import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import * as cheerio from 'cheerio';
import tls from 'tls';
import { execFile, spawn } from 'child_process';
import ChromecastAPI from 'chromecast-api';
import { IrcDccDownloader } from './irc-dcc-client.js';

// Setup default configuration
const defaultDownloadDir = path.join(os.homedir(), 'Downloads');
const CONFIG_FILE = path.join(os.tmpdir(), 'xdcc_downloader_config.json');

const PORT = process.env.PORT || 3000;

let appConfig = {
  downloadDir: defaultDownloadDir,
  useSSLByDefault: true,
  ircPortDefaultSSL: 6697,
  ircPortDefaultNoSSL: 6667,
  keepDays: 0
};

// Chromecast discovery setup
const discoveredChromecasts = new Map();
let castBrowser = null;

function startChromecastDiscovery() {
  if (castBrowser) return;
  try {
    castBrowser = new ChromecastAPI();
    castBrowser.on('device', (device) => {
      console.log(`[Chromecast] Discovered device: ${device.friendlyName} at ${device.host}`);
      discoveredChromecasts.set(device.friendlyName, device);
    });
  } catch (err) {
    console.error('[Chromecast] Error starting discovery:', err);
  }
}

startChromecastDiscovery();

// Load config if exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    appConfig = { ...appConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
  } catch (e) {
    console.error('Error loading config file:', e);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(appConfig, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving config file:', e);
  }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(express.json());

// Serve static assets from frontend build dist folder
const distPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// In-memory download queue
// Structure: { id: { downloaderInstance, details } }
const downloadQueue = new Map();

// Helper to serialize downloader details
function getDownloadDetails(id) {
  const item = downloadQueue.get(id);
  if (!item) return null;
  const dl = item.downloader;
  return {
    id: dl.id,
    server: dl.server,
    port: dl.port,
    useSSL: dl.useSSL,
    channel: dl.channel,
    botName: dl.botName,
    packNumber: dl.packNumber,
    filename: dl.filename,
    offeredFilename: dl.offeredFilename,
    expectedSize: dl.expectedSize,
    bytesReceived: dl.bytesReceived,
    speed: dl.speed,
    eta: dl.eta,
    status: item.statusOverride || dl.status,
    errorMessage: dl.errorMessage
  };
}

// Broadcast progress to all connected WS clients
function broadcastStatus(id) {
  const details = getDownloadDetails(id);
  if (!details) return;
  const message = JSON.stringify({ type: 'progress', data: details });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Broadcast deletion to all connected WS clients
function broadcastDeletion(id) {
  const message = JSON.stringify({ type: 'delete', data: { id } });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Size parser utility
function parseSizeToBytes(sizeStr) {
  if (!sizeStr) return 0;
  const match = sizeStr.trim().match(/^([\d.]+)\s*([KMGTP]?)(B?)$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case 'K': return Math.round(num * 1024);
    case 'M': return Math.round(num * 1024 * 1024);
    case 'G': return Math.round(num * 1024 * 1024 * 1024);
    case 'T': return Math.round(num * 1024 * 1024 * 1024 * 1024);
    default: return Math.round(num);
  }
}

// REST APIs
// Helper function to search Moviegods via IRC
function searchMoviegodsIRC(queryStr) {
  return new Promise((resolve, reject) => {
    const server = 'irc.abjects.net';
    const port = 6697;
    const nick = 'G_' + Math.floor(100000 + Math.random() * 900000);
    const channel1 = '#moviegods';
    const channel2 = '#mg-chat';
    
    let socket;
    let buffer = '';
    const results = [];
    const isTopDl = queryStr.toLowerCase().startsWith('!topdl') || queryStr.toLowerCase().startsWith('.topdl');
    
    // Command to send
    let cmd = queryStr;
    if (cmd.startsWith('!')) {
      cmd = '.' + cmd.slice(1);
    } else if (!cmd.startsWith('.')) {
      cmd = `.s ${cmd}`;
    }

    let timeoutTimer = setTimeout(() => {
      cleanup('Timeout bei der IRC-Suche');
    }, 12000); // 12 seconds absolute max timeout

    let inactivityTimer = null;
    let cmdSent = false;
    let fallbackSendTimer = null;
    
    function resetInactivityTimer(ms = 1500) {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('Inactivity timeout reached, finishing search.');
        cleanup();
      }, ms);
    }

    function cleanup(errorMsg = null) {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      if (fallbackSendTimer) {
        clearTimeout(fallbackSendTimer);
        fallbackSendTimer = null;
      }
      if (socket) {
        try {
          if (socket.writable) {
            socket.write('QUIT :Search completed\r\n');
          }
          socket.destroy();
        } catch (e) {}
        socket = null;
      }
      if (errorMsg && results.length === 0) {
        reject(new Error(errorMsg));
      } else {
        resolve({
          type: isTopDl ? 'topdl' : 'search',
          results: results
        });
      }
    }

    function stripIrcColors(str) {
      return str
        .replace(/\x03(?:\d{1,2}(?:,\d{1,2})?)?/g, '')
        .replace(/[\x02\x0F\x16\x1D\x1F]/g, '');
    }

    try {
      console.log(`Connecting to ${server}:${port} for Moviegods search...`);
      socket = tls.connect({ host: server, port: port, rejectUnauthorized: false }, () => {
        console.log(`Connected to ${server}. Registering nick ${nick}...`);
        socket.write(`NICK ${nick}\r\n`);
        socket.write(`USER ${nick} 0 * :Search Client\r\n`);
      });

      socket.on('data', (data) => {
        buffer += data.toString('utf8');
        const lines = buffer.split('\r\n');
        buffer = lines.pop();

        for (const line of lines) {
          // PING-PONG
          if (line.startsWith('PING')) {
            const token = line.split(' :')[1] || line.substring(5);
            if (socket && socket.writable) {
              socket.write(`PONG :${token}\r\n`);
            }
            continue;
          }

          // Registration success
          if (line.includes(' 376 ') || line.includes(' 422 ')) {
            console.log(`Registered. Joining ${channel1} and ${channel2}...`);
            if (socket && socket.writable) {
              socket.write(`JOIN ${channel1},${channel2}\r\n`);
            }
            // Fallback safety timeout: send command after 5s if 366 didn't trigger
            fallbackSendTimer = setTimeout(() => {
              if (socket && socket.writable && !cmdSent) {
                cmdSent = true;
                console.log(`Fallback: Sending Moviegods search command: ${cmd}`);
                socket.write(`PRIVMSG ${channel2} :${cmd}\r\n`);
                resetInactivityTimer(3500);
              }
            }, 5000);
            continue;
          }

          // Fully joined #mg-chat
          if (line.includes(' 366 ') && line.includes(channel2)) {
            if (fallbackSendTimer) {
              clearTimeout(fallbackSendTimer);
              fallbackSendTimer = null;
            }
            if (!cmdSent) {
              cmdSent = true;
              console.log(`Fully joined ${channel2}. Sending Moviegods search command: ${cmd}`);
              if (socket && socket.writable) {
                socket.write(`PRIVMSG ${channel2} :${cmd}\r\n`);
                resetInactivityTimer(3500);
              }
            }
            continue;
          }

          // Listen for PRIVMSG/NOTICE search responses
          const privmsgMatch = line.match(/^:([^\s!]+)![^\s]+ (PRIVMSG|NOTICE) [^\s]+ :(.*)$/);
          if (privmsgMatch) {
            const senderNick = privmsgMatch[1];
            const rawMsg = privmsgMatch[3];
            const cleanMsg = stripIrcColors(rawMsg).trim();

            if (isTopDl) {
              // Parse topdl line: e.g. " 360x       Mortal.Kombat.II.2026.1080p.DCPRip.x264-FS.mkv (9.1G) ( 07  5d9h )"
              const topDlMatch = cleanMsg.match(/^\s*(\d+x)\s+([^\s(]+)\s+\(([^)]+)\)/);
              if (topDlMatch) {
                results.push({
                  gets: topDlMatch[1],
                  filename: topDlMatch[2],
                  sizeStr: topDlMatch[3]
                });
                resetInactivityTimer(1500);
              }
            } else {
              // Parse normal search result line
              // e.g. " 001 )   0x  |  5.3G  |  84.m2.2025.GERMAN.1080P.WEB.X264-WAYNE.mkv  |   /msg [MG]-Request|Bot|Snx6 XDCC SEND 72  |   Used: ..."
              const parts = cleanMsg.split(' | ');
              if (parts.length >= 4) {
                const firstPart = parts[0];
                const indexMatch = firstPart.match(/^\s*(\d+)\s*\)(.*)$/);
                if (indexMatch) {
                  const gets = indexMatch[2].trim() || '0x';
                  const sizeStr = parts[1].trim();
                  const filename = parts[2].trim();
                  const cmdPart = parts[3].trim();

                  // Extract botName and packNumber from command
                  const botCmdMatch = cmdPart.match(/(?:msg|privmsg)\s+([^\s]+)\s+xdcc\s+s?send\s+#?(\d+)/i);
                  if (botCmdMatch) {
                    const botName = botCmdMatch[1];
                    const packNumber = botCmdMatch[2];
                    results.push({
                      network: 'Abjects',
                      server: 'irc.abjects.net',
                      channel: '#moviegods',
                      botName: botName,
                      packNumber: packNumber,
                      fullCommand: `/msg ${botName} XDCC SEND ${packNumber}`,
                      gets: gets,
                      sizeStr: sizeStr,
                      sizeBytes: parseSizeToBytes(sizeStr),
                      filename: filename
                    });
                    resetInactivityTimer(1500);
                  }
                }
              }
              
              // Immediate completion if we see the summary line
              if (cleanMsg.includes('#MOVIEGODS - Found') && cleanMsg.includes('ONLINE Packs')) {
                console.log('Found summary line, finishing search immediately.');
                cleanup();
              }
            }
          }
        }
      });

      socket.on('error', (err) => {
        console.error('Moviegods IRC Search connection error:', err.message);
        cleanup(`Verbindungsfehler zu Moviegods IRC: ${err.message}`);
      });

      socket.on('close', () => {
        cleanup();
      });
    } catch (e) {
      cleanup(`IRC-Verbindungsfehler: ${e.message}`);
    }
  });
}

// 1. Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const source = req.query.source || 'xdcc';

  if (!query) {
    return res.status(400).json({ error: 'Suchbegriff fehlt' });
  }

  if (source === 'moviegods') {
    try {
      console.log(`Searching Moviegods IRC for: ${query}`);
      const data = await searchMoviegodsIRC(query);
      return res.json(data);
    } catch (error) {
      console.error('Moviegods search error:', error.message);
      return res.status(500).json({ error: `Fehler bei der Suche auf Moviegods IRC: ${error.message}` });
    }
  }

  // Fallback to xdcc.eu search
  try {
    console.log(`Searching xdcc.eu for: ${query}`);
    const response = await axios.get(`https://www.xdcc.eu/search.php`, {
      params: { searchkey: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('tr').each((idx, el) => {
      const infoLink = $(el).find('a[data-s]');
      if (infoLink.length === 0) return;

      const serverAddress = infoLink.attr('data-s');
      const channelName = infoLink.attr('data-c');
      const fullCommand = infoLink.attr('data-p');

      if (!serverAddress || !fullCommand) return;

      const commandParts = fullCommand.split(' ');
      const botName = commandParts[0];
      const packCommand = commandParts.slice(1).join(' ');

      // Extract pack number (could be like "#42" or "42")
      const packNumberMatch = packCommand.match(/#?(\d+)/);
      const packNumber = packNumberMatch ? packNumberMatch[1] : '';

      const tds = $(el).find('td');
      if (tds.length < 7) return;

      const network = $(tds[0]).text().trim();
      const gets = $(tds[4]).text().trim();
      const sizeStr = $(tds[5]).text().trim();
      const filename = $(tds[6]).text().trim();

      results.push({
        network,
        server: serverAddress,
        channel: channelName,
        botName,
        packNumber,
        fullCommand,
        gets,
        sizeStr,
        sizeBytes: parseSizeToBytes(sizeStr),
        filename
      });
    });

    return res.json({ type: 'search', results: results });
  } catch (error) {
    console.error('Search error:', error.message);
    return res.status(500).json({ error: `Fehler bei der Suche auf xdcc.eu: ${error.message}` });
  }
});

// 2. Queue list endpoint
app.get('/api/downloads', (req, res) => {
  const list = Array.from(downloadQueue.keys()).map(id => getDownloadDetails(id));
  return res.json(list);
});

// 3. Settings endpoints
app.get('/api/settings', (req, res) => {
  return res.json(appConfig);
});

app.post('/api/settings', (req, res) => {
  const { downloadDir, useSSLByDefault, keepDays } = req.body;
  if (downloadDir) {
    appConfig.downloadDir = path.resolve(downloadDir);
  }
  if (typeof useSSLByDefault === 'boolean') {
    appConfig.useSSLByDefault = useSSLByDefault;
  }
  if (typeof keepDays === 'number' && keepDays >= 0) {
    appConfig.keepDays = keepDays;
  }
  saveConfig();
  return res.json(appConfig);
});

// 4. Download operations
app.post('/api/download', (req, res) => {
  const { server, port, useSSL, channel, botName, packNumber, filename, expectedSize } = req.body;

  if (!server || !channel || !botName || !packNumber || !filename) {
    return res.status(400).json({ error: 'Fehlende Download-Parameter' });
  }

  const id = `${server}_${channel}_${botName}_${packNumber}_${filename.replace(/\s+/g, '_')}`;
  
  if (downloadQueue.has(id)) {
    const item = downloadQueue.get(id);
    if (item.downloader.status === 'paused' || item.downloader.status === 'error' || item.downloader.status === 'cancelled') {
      // Re-create or resume
      item.downloader.cleanup();
      downloadQueue.delete(id);
    } else {
      return res.status(400).json({ error: 'Download läuft bereits oder ist bereits in der Warteschlange.' });
    }
  }

  // Determine SSL and Port
  const resolvedUseSSL = typeof useSSL === 'boolean' ? useSSL : appConfig.useSSLByDefault;
  const resolvedPort = port || (resolvedUseSSL ? appConfig.ircPortDefaultSSL : appConfig.ircPortDefaultNoSSL);

  const downloader = new IrcDccDownloader({
    id,
    server,
    port: resolvedPort,
    useSSL: resolvedUseSSL,
    channel,
    botName,
    packNumber,
    filename,
    expectedSize,
    downloadDir: appConfig.downloadDir
  });

  downloader.on('progress', (data) => {
    if (data.status === 'completed' && !downloader._extractionStarted) {
      const lowerFile = downloader.filename.toLowerCase();
      if (lowerFile.endsWith('.tar') || lowerFile.endsWith('.tar.gz') || lowerFile.endsWith('.tgz')) {
        downloader._extractionStarted = true;
        downloadQueue.set(id, { downloader, statusOverride: 'extracting' });
        broadcastStatus(id);
        
        const sendLog = (text) => {
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: 'message', data: { id, text: `[Entpacken] ${text}` } }));
            }
          });
        };

        sendLog(`Entpacken der Archivdatei gestartet...`);

        execFile('tar', ['-xf', downloader.filePath, '-C', downloader.downloadDir], (error) => {
          if (error) {
            console.error(`[Extraction] Fehler beim Entpacken von ${downloader.filePath}:`, error);
            sendLog(`Fehler beim Entpacken: ${error.message}`);
            downloadQueue.set(id, { downloader, statusOverride: null });
            broadcastStatus(id);
          } else {
            console.log(`[Extraction] Entpacken erfolgreich abgeschlossen: ${downloader.filePath}`);
            sendLog(`Erfolgreich entpackt!`);
            
            fs.unlink(downloader.filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`[Extraction] Konnte Archiv nicht löschen:`, unlinkErr);
              } else {
                console.log(`[Extraction] Archiv gelöscht: ${downloader.filePath}`);
                sendLog(`Originales Archiv gelöscht.`);
              }
              downloadQueue.set(id, { downloader, statusOverride: null });
              broadcastStatus(id);
            });
          }
        });
        return;
      }
    }
    broadcastStatus(id);
  });

  downloader.on('message', (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'message', data: { id, text: data.text } }));
      }
    });
  });

  downloadQueue.set(id, { downloader });
  downloader.start();

  return res.json({ success: true, id, status: downloader.status });
});

app.post('/api/download/:id/pause', (req, res) => {
  const { id } = req.params;
  const item = downloadQueue.get(id);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });

  item.downloader.pause();
  return res.json({ success: true });
});

app.post('/api/download/:id/resume', (req, res) => {
  const { id } = req.params;
  const item = downloadQueue.get(id);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });

  item.downloader.start();
  return res.json({ success: true });
});

app.post('/api/download/:id/confirm-filename', (req, res) => {
  const { id } = req.params;
  const item = downloadQueue.get(id);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });

  item.downloader.confirmFilename();
  return res.json({ success: true });
});

app.post('/api/download/:id/cancel', (req, res) => {
  const { id } = req.params;
  const item = downloadQueue.get(id);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });

  item.downloader.cancel();
  downloadQueue.delete(id);
  broadcastDeletion(id);
  return res.json({ success: true });
});

app.delete('/api/download/:id', async (req, res) => {
  const { id } = req.params;
  const deleteFile = req.query.deleteFile === 'true';
  const item = downloadQueue.get(id);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });

  if (item.downloader.status !== 'dcc_downloading') {
    if (deleteFile && item.downloader.filePath) {
      try {
        if (fs.existsSync(item.downloader.filePath)) {
          await fs.promises.unlink(item.downloader.filePath);
          console.log(`[Server] Deleted file from disk: ${item.downloader.filePath}`);
        }
      } catch (err) {
        console.error(`[Server] Failed to delete file: ${item.downloader.filePath}`, err);
        return res.status(500).json({ error: `Datei konnte nicht gelöscht werden: ${err.message}` });
      }
    }
    item.downloader.cleanup();
    downloadQueue.delete(id);
    broadcastDeletion(id);
    return res.json({ success: true });
  } else {
    return res.status(400).json({ error: 'Laufende Downloads können nicht gelöscht werden, brich sie zuerst ab.' });
  }
});

// Media Library Scanner and Endpoints
const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.mp3', '.wav', '.m4a', '.mov', '.flac', '.mpeg', '.mpg', '.webm', '.ogg', '.ts'
]);

function getSafeFilePath(filename) {
  if (!filename) return null;
  const baseDir = path.resolve(appConfig.downloadDir);
  const filePath = path.resolve(baseDir, filename);
  if (!filePath.startsWith(baseDir)) {
    return null;
  }
  return filePath;
}

async function deleteMediaFileAndCleanDirs(filename) {
  const filePath = getSafeFilePath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Datei existiert nicht auf dem Datenträger');
  }

  await fs.promises.unlink(filePath);
  console.log(`[Media Library] Deleted file: ${filePath}`);

  // Clean up empty directories up to downloadDir
  let currentDir = path.dirname(filePath);
  const baseDir = path.resolve(appConfig.downloadDir);
  while (currentDir !== baseDir && currentDir.startsWith(baseDir)) {
    try {
      const files = await fs.promises.readdir(currentDir);
      if (files.length === 0) {
        await fs.promises.rmdir(currentDir);
        console.log(`[Media Library] Removed empty directory: ${currentDir}`);
        currentDir = path.dirname(currentDir);
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }
}

async function scanDownloadDir() {
  const dir = appConfig.downloadDir;
  try {
    if (!fs.existsSync(dir)) {
      return [];
    }
    const mediaFiles = [];
    
    async function traverse(currentDir) {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MEDIA_EXTENSIONS.has(ext)) {
            try {
              const stat = await fs.promises.stat(fullPath);
              const relativePath = path.relative(dir, fullPath);
              mediaFiles.push({
                filename: relativePath,
                sizeBytes: stat.size,
                mtime: stat.mtime.getTime()
              });
            } catch (e) {
              // Ignore stats errors
            }
          }
        }
      }
    }
    
    await traverse(dir);
    
    // Sort by modification time, newest first
    mediaFiles.sort((a, b) => b.mtime - a.mtime);
    return mediaFiles;
  } catch (err) {
    console.error('[Media Library] Fehler beim Scannen des Download-Verzeichnisses:', err);
    return [];
  }
}

app.get('/api/media-library', async (req, res) => {
  const list = await scanDownloadDir();
  return res.json(list);
});

app.delete('/api/media-library/:filename', async (req, res) => {
  const { filename } = req.params;
  try {
    await deleteMediaFileAndCleanDirs(filename);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Media Library] Fehler beim Löschen der Datei:', err);
    return res.status(500).json({ error: `Konnte Datei nicht löschen: ${err.message}` });
  }
});

app.post('/api/media-library/bulk-delete', async (req, res) => {
  const { filenames } = req.body;
  if (!Array.isArray(filenames)) {
    return res.status(400).json({ error: 'Parameter filenames muss ein Array sein' });
  }

  const results = { deleted: [], failed: [] };
  for (const filename of filenames) {
    try {
      await deleteMediaFileAndCleanDirs(filename);
      results.deleted.push(filename);
    } catch (err) {
      console.error(`[Media Library] Bulk delete failed for ${filename}:`, err);
      results.failed.push({ filename, error: err.message });
    }
  }

  return res.json({ success: true, ...results });
});

app.post('/api/media-library/play-local', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Parameter filename fehlt' });
  
  const filePath = getSafeFilePath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei existiert nicht auf dem Datenträger' });
  }
  
  execFile('open', [filePath], (error) => {
    if (error) {
      console.error('[Playback] Fehler beim lokalen Öffnen der Library-Datei:', error);
      return res.status(500).json({ error: `Konnte die Datei nicht lokal abspielen: ${error.message}` });
    }
    return res.json({ success: true });
  });
});

app.post('/api/media-library/cast/play', (req, res) => {
  const { filename, deviceName } = req.body;
  if (!filename || !deviceName) {
    return res.status(400).json({ error: 'Parameter filename und deviceName fehlen' });
  }

  const filePath = getSafeFilePath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei existiert nicht auf dem Datenträger' });
  }

  const device = discoveredChromecasts.get(deviceName);
  if (!device) {
    return res.status(404).json({ error: `Gerät "${deviceName}" nicht im Netzwerk gefunden.` });
  }

  const localIp = getLocalIp();
  const mediaUrl = `http://${localIp}:${PORT}/api/media/${encodeURIComponent(filename)}`;

  console.log(`[Chromecast] Casting Library file "${filename}" to "${deviceName}" via ${mediaUrl}`);

  // Determine mime type
  let contentType = 'video/mp4';
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mkv') contentType = 'video/x-matroska';
  else if (ext === '.avi') contentType = 'video/mp4'; // transcoded on the fly!
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';

  let responded = false;
  device.play(mediaUrl, { contentType }, (err) => {
    if (responded) return;
    responded = true;
    if (err) {
      console.error(`[Chromecast] Fehler beim Abspielen der Library-Datei auf ${deviceName}:`, err);
      return res.status(500).json({ error: `Streaming-Fehler: ${err.message}` });
    }
    activeCasts.set(deviceName, {
      downloadId: null,
      filename: filename,
      playerState: 'BUFFERING',
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false
    });
    attachDeviceStatusListeners(device, deviceName);
    broadcastActiveCasts();
    return res.json({ success: true, deviceName, filename: filename });
  });
});

// Local and Chromecast Playback endpoints
app.post('/api/download/:id/play-local', (req, res) => {
  const { id } = req.params;
  const item = downloadQueue.get(id);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
  if (item.downloader.status !== 'completed') {
    return res.status(400).json({ error: 'Download ist noch nicht abgeschlossen' });
  }

  const filePath = item.downloader.filePath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei existiert nicht auf dem Datenträger' });
  }

  execFile('open', [filePath], (error) => {
    if (error) {
      console.error('[Playback] Fehler beim lokalen Öffnen der Datei:', error);
      return res.status(500).json({ error: `Konnte die Datei nicht lokal abspielen: ${error.message}` });
    }
    return res.json({ success: true });
  });
});

app.get('/api/chromecast/devices', (req, res) => {
  if (castBrowser) {
    try {
      castBrowser.update();
    } catch (e) {
      console.error('[Chromecast] Fehler beim Aktualisieren des Browsers:', e);
    }
  }
  const list = Array.from(discoveredChromecasts.values()).map(d => ({
    name: d.friendlyName,
    host: d.host
  }));
  return res.json(list);
});

// Helper to get local network IP address (ipv4, non-loopback)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const activeCasts = new Map();

// Helper to listen to device status and connection errors
function attachDeviceStatusListeners(device, deviceName) {
  device.removeAllListeners('status');
  device.on('status', (status) => {
    console.log(`[Chromecast] Status update on ${deviceName}:`, status?.playerState);
    if (status && status.playerState === 'IDLE') {
      console.log(`[Chromecast] Playback IDLE on ${deviceName}. Clearing active cast.`);
      if (activeCasts.has(deviceName)) {
        activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    }
  });

  if (device.client) {
    device.client.removeAllListeners('close');
    device.client.removeAllListeners('error');
    
    device.client.on('close', () => {
      console.log(`[Chromecast] Client connection closed for ${deviceName}`);
      if (activeCasts.has(deviceName)) {
        activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    });
    
    device.client.on('error', (err) => {
      console.error(`[Chromecast] Client error on ${deviceName}:`, err.message);
      if (activeCasts.has(deviceName)) {
        activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    });
  }
}

// Periodic status check (every 8 seconds) to verify active casts are still playing
setInterval(() => {
  if (activeCasts.size === 0) return;
  
  for (const [deviceName, castInfo] of activeCasts.entries()) {
    const device = discoveredChromecasts.get(deviceName);
    if (!device) {
      console.log(`[Chromecast Check] Active device "${deviceName}" is no longer in discovered list. Clearing.`);
      activeCasts.delete(deviceName);
      broadcastActiveCasts();
      continue;
    }
    
    device.getStatus((err, status) => {
      if (err) {
        console.log(`[Chromecast Check] Failed to get status for "${deviceName}": ${err.message}. Clearing active cast.`);
        activeCasts.delete(deviceName);
        broadcastActiveCasts();
        return;
      }
      
      if (!status || status.playerState === 'IDLE') {
        console.log(`[Chromecast Check] Device "${deviceName}" is IDLE or has no status. Clearing active cast.`);
        activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    });
  }
}, 8000);

app.post('/api/chromecast/play', (req, res) => {
  const { downloadId, deviceName } = req.body;
  if (!downloadId || !deviceName) {
    return res.status(400).json({ error: 'Parameter downloadId und deviceName fehlen' });
  }

  const item = downloadQueue.get(downloadId);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
  if (item.downloader.status !== 'completed') {
    return res.status(400).json({ error: 'Download ist noch nicht abgeschlossen' });
  }

  const device = discoveredChromecasts.get(deviceName);
  if (!device) {
    return res.status(404).json({ error: `Gerät "${deviceName}" nicht im Netzwerk gefunden. Bitte Suche aktualisieren.` });
  }

  const filename = item.downloader.filename;
  const localIp = getLocalIp();
  const mediaUrl = `http://${localIp}:${PORT}/api/media/${encodeURIComponent(filename)}`;

  console.log(`[Chromecast] Casting "${filename}" to "${deviceName}" via ${mediaUrl}`);

  // Determine mime type
  let contentType = 'video/mp4';
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mkv') contentType = 'video/x-matroska';
  else if (ext === '.avi') contentType = 'video/mp4'; // transcoded on the fly!
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';

  let responded = false;
  device.play(mediaUrl, { contentType }, (err) => {
    if (responded) return;
    responded = true;
    if (err) {
      console.error(`[Chromecast] Fehler beim Abspielen auf ${deviceName}:`, err);
      return res.status(500).json({ error: `Streaming-Fehler: ${err.message}` });
    }
    activeCasts.set(deviceName, {
      downloadId,
      filename,
      playerState: 'BUFFERING',
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false
    });
    attachDeviceStatusListeners(device, deviceName);
    broadcastActiveCasts();
    return res.json({ success: true, deviceName, filename });
  });
});

app.post('/api/chromecast/stop', (req, res) => {
  const { deviceName } = req.body;
  if (!deviceName) {
    return res.status(400).json({ error: 'Parameter deviceName fehlt' });
  }

  const device = discoveredChromecasts.get(deviceName);
  if (!device) {
    return res.status(404).json({ error: 'Gerät nicht gefunden' });
  }

  device.stop((err) => {
    if (err) {
      console.error(`[Chromecast] Fehler beim Stoppen auf ${deviceName}:`, err);
      return res.status(500).json({ error: `Fehler beim Stoppen des Streams: ${err.message}` });
    }
    activeCasts.delete(deviceName);
    broadcastActiveCasts();
    return res.json({ success: true });
  });
});

app.post('/api/chromecast/control', (req, res) => {
  const { deviceName, action, value } = req.body;
  if (!deviceName || !action) {
    return res.status(400).json({ error: 'Parameter deviceName und action fehlen' });
  }

  const device = discoveredChromecasts.get(deviceName);
  if (!device) {
    return res.status(404).json({ error: 'Gerät nicht gefunden' });
  }

  const callback = (err) => {
    if (err) {
      console.error(`[Chromecast Control] Fehler bei Action ${action} auf ${deviceName}:`, err);
      return res.status(500).json({ error: `Steuerung fehlgeschlagen: ${err.message}` });
    }
    
    // Fetch and broadcast the updated status immediately
    device.getStatus((statusErr, status) => {
      if (!statusErr && status) {
        const castInfo = activeCasts.get(deviceName);
        if (castInfo) {
          castInfo.playerState = status.playerState;
          castInfo.currentTime = status.currentTime || 0;
          castInfo.duration = status.media?.duration || 0;
          castInfo.volume = status.volume?.level || 1;
          castInfo.muted = !!status.volume?.muted;
          activeCasts.set(deviceName, castInfo);
          broadcastActiveCasts();
        }
      }
    });
    return res.json({ success: true });
  };

  switch (action) {
    case 'pause':
      device.pause(callback);
      break;
    case 'resume':
      if (typeof device.resume === 'function') {
        device.resume(callback);
      } else {
        device.play(callback);
      }
      break;
    case 'seek':
      device.seek(parseFloat(value), callback);
      break;
    case 'volume':
      device.setVolume(parseFloat(value), callback);
      break;
    default:
      return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });
  }
});

app.get('/api/chromecast/active', (req, res) => {
  return res.json(Array.from(activeCasts.entries()).map(([device, info]) => ({
    device,
    ...info
  })));
});

// Serving local media files with HTTP Range Requests for streaming and seeking support
app.get('/api/media/*', (req, res) => {
  const filename = req.params[0];
  const filePath = getSafeFilePath(filename);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Datei nicht gefunden');
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.avi') {
    console.log(`[Playback] Transcodierung läuft (on-the-fly) für AVI-Datei: ${filePath}`);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked'
    });
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-vcodec', 'libx264',
      '-preset', 'ultrafast',
      '-acodec', 'aac',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      'pipe:1'
    ]);
    
    ffmpeg.stdout.pipe(res);
    
    req.on('close', () => {
      console.log(`[Playback] Client-Verbindung geschlossen, beende ffmpeg für: ${filePath}`);
      ffmpeg.kill('SIGKILL');
    });
    
    ffmpeg.on('error', (err) => {
      console.error(`[Playback] ffmpeg-Fehler für ${filePath}:`, err);
      if (!res.headersSent) {
        res.status(500).send('Fehler bei der Transkodierung');
      }
    });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'video/mp4';
  if (ext === '.mkv') contentType = 'video/x-matroska';
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    
    if (start >= fileSize || end >= fileSize) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
      return res.end();
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Setup fallback for Single Page App routing
app.get('*', (req, res) => {
  const indexPath = path.join(process.cwd(), 'client', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('XDCC Load&Cast API Server is running. Frontend has not been built yet.');
  }
});

// Broadcast active casts to all connected WS clients
function broadcastActiveCasts() {
  const list = Array.from(activeCasts.entries()).map(([device, info]) => ({
    device,
    ...info
  }));
  const message = JSON.stringify({ type: 'activeCasts', data: list });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Integrate WS protocol handshake
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('WS Frontend Client connected.');
  
  // Send current queue status on connection
  const currentList = Array.from(downloadQueue.keys()).map(id => getDownloadDetails(id));
  ws.send(JSON.stringify({ type: 'init', data: currentList }));

  // Send current active casts on connection
  const activeList = Array.from(activeCasts.entries()).map(([device, info]) => ({
    device,
    ...info
  }));
  ws.send(JSON.stringify({ type: 'activeCasts', data: activeList }));

  ws.on('close', () => {
    console.log('WS Client disconnected.');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
