import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import * as cheerio from 'cheerio';
import tls from 'tls';
import { execFile, spawn, exec } from 'child_process';
import ChromecastAPI from 'chromecast-api';
import dlnacastsCreator from 'dlnacasts2';
import airplayerCreator from 'airplayer';
import { IrcDccDownloader } from './irc-dcc-client.js';
import crypto from 'crypto';
import { HttpDownloader } from './http-downloader.js';
import { parseFile } from 'music-metadata';

// Read version from package.json & record server start time
let appVersion = '1.0.0';
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    appVersion = pkg.version || '1.0.0';
  }
} catch (e) {
  console.error('[Startup] Failed to read package.json version:', e.message);
}
const serverStartTime = new Date().toISOString();

// Setup global log file interception
const LOG_FILE = path.join(os.homedir(), '.xdcc_downloader_logs.txt');

function appendToLog(type, args) {
  try {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    const logLine = `[${timestamp}] [${type}] ${message}\n`;
    
    // Auto rotation if file exceeds 5MB
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > 5 * 1024 * 1024) { // 5 MB
        try {
          fs.renameSync(LOG_FILE, LOG_FILE + '.old');
        } catch (e) {
          fs.writeFileSync(LOG_FILE, '', 'utf8');
        }
      }
    }
    
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    // Ignore logging errors to prevent infinite loops / crashes
  }
}

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

console.log = (...args) => {
  originalConsole.log(...args);
  appendToLog('INFO', args);
};

console.error = (...args) => {
  originalConsole.error(...args);
  appendToLog('ERROR', args);
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  appendToLog('WARN', args);
};

console.info = (...args) => {
  originalConsole.info(...args);
  appendToLog('INFO', args);
};

const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.mp3', '.wav', '.m4a', '.mov', '.flac', '.mpeg', '.mpg', '.webm', '.ogg', '.ts', '.m4b'
]);

// Setup default configuration
const defaultDownloadDir = path.join(os.homedir(), 'Downloads');
const CONFIG_FILE = path.join(os.homedir(), '.xdcc_downloader_config.json');

const PORT = process.env.PORT || 3000;

let appConfig = {
  downloadDir: defaultDownloadDir,
  useSSLByDefault: true,
  ircPortDefaultSSL: 6697,
  ircPortDefaultNoSSL: 6667,
  keepDays: 0,
  checkIntervalHours: 3,
  xtreamHost: '',
  xtreamUsername: '',
  xtreamPassword: '',
  xtreamEnabled: false,
  xtreamSyncIntervalHours: 1,
  xxxHideEnabled: false,
  xxxPin: '0000'
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

// DLNA / Miracast discovery setup
const discoveredDlnas = new Map();
let dlnaBrowser = null;

function startDlnaDiscovery() {
  if (dlnaBrowser) return;
  try {
    dlnaBrowser = dlnacastsCreator();
    dlnaBrowser.on('update', (player) => {
      console.log(`[DLNA/Miracast] Discovered device: ${player.name}`);
      discoveredDlnas.set(player.name, player);
    });
  } catch (err) {
    console.error('[DLNA/Miracast] Error starting discovery:', err);
  }
}

startDlnaDiscovery();

// AirPlay discovery setup
const discoveredAirplays = new Map();
let airplayBrowser = null;

function startAirplayDiscovery() {
  if (airplayBrowser) return;
  try {
    airplayBrowser = airplayerCreator();
    airplayBrowser.on('update', (player) => {
      console.log(`[AirPlay] Discovered device: ${player.name}`);
      discoveredAirplays.set(player.name, player);
    });
  } catch (err) {
    console.error('[AirPlay] Error starting discovery:', err);
  }
}

startAirplayDiscovery();

// Xtream Codes API Cache
let xtreamMovies = [];
let xtreamSeries = [];
let xtreamLive = [];
let xtreamVodCategories = [];
let xtreamSeriesCategories = [];
let xtreamLiveCategories = [];
let lastXtreamFetch = 0;
let xtreamSyncTimer = null;

const XTREAM_CACHE_FILE = path.join(os.homedir(), '.xdcc_xtream_cache.json');

function loadXtreamCache() {
  if (fs.existsSync(XTREAM_CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(XTREAM_CACHE_FILE, 'utf8'));
      xtreamMovies = data.xtreamMovies || [];
      xtreamSeries = data.xtreamSeries || [];
      xtreamLive = data.xtreamLive || [];
      xtreamVodCategories = data.xtreamVodCategories || [];
      xtreamSeriesCategories = data.xtreamSeriesCategories || [];
      xtreamLiveCategories = data.xtreamLiveCategories || [];
      lastXtreamFetch = data.lastXtreamFetch || 0;
      console.log(`[Xtream Cache] Loaded cache from disk. Movies: ${xtreamMovies.length}, Series: ${xtreamSeries.length}, Live: ${xtreamLive.length}, Last Fetch: ${new Date(lastXtreamFetch).toLocaleString()}`);
      updateMappedXtreamData();
    } catch (e) {
      console.error('[Xtream Cache] Failed to load cache from disk:', e.message);
    }
  }
}

async function saveXtreamCache() {
  try {
    const data = {
      xtreamMovies,
      xtreamSeries,
      xtreamLive,
      xtreamVodCategories,
      xtreamSeriesCategories,
      xtreamLiveCategories,
      lastXtreamFetch
    };
    await fs.promises.writeFile(XTREAM_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Xtream Cache] Saved cache to disk (${XTREAM_CACHE_FILE}).`);
  } catch (e) {
    console.error('[Xtream Cache] Failed to save cache to disk:', e.message);
  }
}

function isAdultContent(subcategory, title) {
  const adultKeywords = ['xxx', 'adult', '18+', 'porn', 'erotik', 'redlight', 'pink', 'explicito', 'sensual', 'hot', 'erotic', 'hentai', 'lust', 'sxt'];
  const cat = (subcategory || '').toLowerCase();
  const t = (title || '').toLowerCase();
  return adultKeywords.some(kw => cat.includes(kw) || t.includes(kw));
}

function broadcastXtreamSyncComplete() {
  if (typeof wss !== 'undefined' && wss && wss.clients) {
    const message = JSON.stringify({ type: 'xtream-sync-complete' });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }
}

function recreateXtreamSyncInterval() {
  if (xtreamSyncTimer) {
    clearInterval(xtreamSyncTimer);
    xtreamSyncTimer = null;
  }
  if (!appConfig.xtreamEnabled) {
    return;
  }
  const hours = appConfig.xtreamSyncIntervalHours || 1;
  console.log(`[Xtream] Setting sync interval to ${hours} hours.`);
  xtreamSyncTimer = setInterval(() => {
    console.log(`[Xtream] Running background sync...`);
    fetchXtreamData(true).catch(err => console.error('[Xtream] Background sync error:', err.message));
  }, hours * 60 * 60 * 1000);
}

async function fetchXtreamData(force = false) {
  if (!appConfig.xtreamEnabled || !appConfig.xtreamHost || !appConfig.xtreamUsername || !appConfig.xtreamPassword) {
    return;
  }
  const intervalMs = (appConfig.xtreamSyncIntervalHours || 1) * 60 * 60 * 1000;
  if (!force && (Date.now() - lastXtreamFetch < intervalMs) && xtreamMovies.length > 0) {
    console.log(`[Xtream] Disk cache is still valid (age: ${Math.round((Date.now() - lastXtreamFetch) / 60000)}m). Skipping network fetch.`);
    return;
  }
  
  try {
    const host = appConfig.xtreamHost.replace(/\/$/, '');
    
    // Fetch categories first
    console.log(`[Xtream] Fetching movies categories from ${host}...`);
    try {
      const moviesCatRes = await axios.get(`${host}/player_api.php`, {
        params: {
          username: appConfig.xtreamUsername,
          password: appConfig.xtreamPassword,
          action: 'get_vod_categories'
        },
        timeout: 10000
      });
      if (Array.isArray(moviesCatRes.data)) {
        xtreamVodCategories = moviesCatRes.data;
      }
    } catch (err) {
      console.error('[Xtream] Error fetching VOD categories:', err.message);
    }

    console.log(`[Xtream] Fetching series categories from ${host}...`);
    try {
      const seriesCatRes = await axios.get(`${host}/player_api.php`, {
        params: {
          username: appConfig.xtreamUsername,
          password: appConfig.xtreamPassword,
          action: 'get_series_categories'
        },
        timeout: 10000
      });
      if (Array.isArray(seriesCatRes.data)) {
        xtreamSeriesCategories = seriesCatRes.data;
      }
    } catch (err) {
      console.error('[Xtream] Error fetching series categories:', err.message);
    }

    console.log(`[Xtream] Fetching live categories from ${host}...`);
    try {
      const liveCatRes = await axios.get(`${host}/player_api.php`, {
        params: {
          username: appConfig.xtreamUsername,
          password: appConfig.xtreamPassword,
          action: 'get_live_categories'
        },
        timeout: 10000
      });
      if (Array.isArray(liveCatRes.data)) {
        xtreamLiveCategories = liveCatRes.data;
      }
    } catch (err) {
      console.error('[Xtream] Error fetching live categories:', err.message);
    }

    console.log(`[Xtream] Fetching movies list from ${host}...`);
    const moviesRes = await axios.get(`${host}/player_api.php`, {
      params: {
        username: appConfig.xtreamUsername,
        password: appConfig.xtreamPassword,
        action: 'get_vod_streams'
      },
      timeout: 15000
    });
    
    if (Array.isArray(moviesRes.data)) {
      xtreamMovies = moviesRes.data;
    }
    
    console.log(`[Xtream] Fetching series list from ${host}...`);
    const seriesRes = await axios.get(`${host}/player_api.php`, {
      params: {
        username: appConfig.xtreamUsername,
        password: appConfig.xtreamPassword,
        action: 'get_series'
      },
      timeout: 15000
    });
    
    if (Array.isArray(seriesRes.data)) {
      xtreamSeries = seriesRes.data;
    }
 
    console.log(`[Xtream] Fetching live channels list from ${host}...`);
    const liveRes = await axios.get(`${host}/player_api.php`, {
      params: {
        username: appConfig.xtreamUsername,
        password: appConfig.xtreamPassword,
        action: 'get_live_streams'
      },
      timeout: 25000
    });
    
    if (Array.isArray(liveRes.data)) {
      xtreamLive = liveRes.data;
    }
    
    lastXtreamFetch = Date.now();
    console.log(`[Xtream] Cache updated. Movies: ${xtreamMovies.length}, Series: ${xtreamSeries.length}, Live TV: ${xtreamLive.length}`);
    updateMappedXtreamData();
    await saveXtreamCache();
    broadcastXtreamSyncComplete();
  } catch (err) {
    console.error('[Xtream] Error updating cache:', err.message);
  }
}

// Load config if exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    appConfig = { ...appConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    loadXtreamCache();
    recreateXtreamSyncInterval();
    if (appConfig.xtreamEnabled) {
      setTimeout(() => {
        fetchXtreamData().catch(err => console.error('[Xtream] Startup fetch error:', err.message));
      }, 1000);
    }
  } catch (e) {
    console.error('Error loading config file:', e);
  }
}

// Configure Samba share on startup
configureSambaShare(appConfig.downloadDir);

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
    errorMessage: dl.errorMessage,
    isAuto: !!item.isAuto,
    isHttp: !!dl.isHttp,
    speedHistory: dl.speedHistory ? [...dl.speedHistory] : []
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

// Reusable xdcc.eu search helper
async function searchXdccEu(queryStr) {
  try {
    console.log(`Searching xdcc.eu for: ${queryStr}`);
    const response = await axios.get(`https://www.xdcc.eu/search.php`, {
      params: { searchkey: queryStr },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
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

    return results;
  } catch (error) {
    console.error('Search xdcc.eu error:', error.message);
    return [];
  }
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
    const results = await searchXdccEu(query);
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
  const publicConfig = { ...appConfig };
  delete publicConfig.xxxPin;
  publicConfig.version = appVersion;
  publicConfig.startTime = serverStartTime;
  return res.json(publicConfig);
});

app.get('/api/settings/files', (req, res) => {
  try {
    const subpath = req.query.path || '';
    const baseDir = path.resolve(appConfig.downloadDir);
    const targetDir = path.resolve(path.join(baseDir, subpath));
    
    // Security check: ensure path does not escape the download directory
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Unzulässiger Pfad-Traversal blockiert!' });
    }
    
    if (!fs.existsSync(targetDir)) {
      if (targetDir === baseDir) {
        return res.json({ currentPath: '', files: [] });
      }
      return res.status(404).json({ error: 'Ordner existiert nicht.' });
    }
    
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const files = entries
      .filter(entry => !entry.name.startsWith('.')) // Hide hidden files/folders
      .map(entry => {
        const entryPath = path.join(targetDir, entry.name);
        let size = 0;
        let mtime = 0;
        try {
          const stat = fs.statSync(entryPath);
          size = stat.size;
          mtime = stat.mtimeMs;
        } catch (e) {
          // ignore
        }
        return {
          name: entry.name,
          isDirectory: entry.isDirectory(),
          size,
          mtime
        };
      });
      
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return res.json({
      currentPath: subpath,
      files
    });
  } catch (err) {
    console.error('[Settings Explorer] Error reading directory:', err.message);
    return res.status(500).json({ error: `Ordner konnte nicht gelesen werden: ${err.message}` });
  }
});

app.post('/api/settings/files/mkdir', (req, res) => {
  try {
    const { path: subpath, name } = req.body;
    if (!name || name.includes('/') || name.includes('\\') || name === '..' || name === '.') {
      return res.status(400).json({ error: 'Ungültiger Ordnername.' });
    }
    const baseDir = path.resolve(appConfig.downloadDir);
    const targetDir = path.resolve(path.join(baseDir, subpath || ''));
    
    // Security check: ensure path does not escape the download directory
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Unzulässiger Pfad-Traversal blockiert!' });
    }
    
    const newFolderDir = path.join(targetDir, name);
    if (fs.existsSync(newFolderDir)) {
      return res.status(400).json({ error: 'Ordner existiert bereits.' });
    }
    
    fs.mkdirSync(newFolderDir, { recursive: true });
    console.log(`[File Explorer] Created directory: ${newFolderDir}`);
    cachedLocalFiles = null; // Invalidate cache
    return res.json({ success: true });
  } catch (err) {
    console.error('[File Explorer] mkdir error:', err.message);
    return res.status(500).json({ error: `Ordner konnte nicht erstellt werden: ${err.message}` });
  }
});

app.delete('/api/settings/files', (req, res) => {
  try {
    const { path: subpath, name } = req.body;
    if (!name || name.includes('/') || name.includes('\\') || name === '..' || name === '.') {
      return res.status(400).json({ error: 'Ungültiger Name.' });
    }
    const baseDir = path.resolve(appConfig.downloadDir);
    const targetDir = path.resolve(path.join(baseDir, subpath || ''));
    
    // Security check: ensure path does not escape the download directory
    if (!targetDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Unzulässiger Pfad-Traversal blockiert!' });
    }
    
    const targetPath = path.join(targetDir, name);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Datei oder Ordner nicht gefunden.' });
    }
    
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`[File Explorer] Deleted directory: ${targetPath}`);
    } else {
      fs.unlinkSync(targetPath);
      console.log(`[File Explorer] Deleted file: ${targetPath}`);
    }
    cachedLocalFiles = null; // Invalidate cache
    return res.json({ success: true });
  } catch (err) {
    console.error('[File Explorer] delete error:', err.message);
    return res.status(500).json({ error: `Konnte nicht gelöscht werden: ${err.message}` });
  }
});

app.post('/api/settings/files/move', (req, res) => {
  try {
    const { path: subpath, name, destination } = req.body;
    if (!name || name.includes('/') || name.includes('\\') || name === '..' || name === '.') {
      return res.status(400).json({ error: 'Ungültiger Quellname.' });
    }
    if (!destination) {
      return res.status(400).json({ error: 'Zielname oder Zielpfad fehlt.' });
    }
    const baseDir = path.resolve(appConfig.downloadDir);
    const srcDir = path.resolve(path.join(baseDir, subpath || ''));
    
    // Security check: ensure path does not escape the download directory
    if (!srcDir.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Unzulässiger Pfad-Traversal blockiert!' });
    }
    
    const srcPath = path.join(srcDir, name);
    if (!fs.existsSync(srcPath)) {
      return res.status(404).json({ error: 'Quelle nicht gefunden.' });
    }
    
    let destPath;
    if (destination.startsWith('/')) {
      destPath = path.resolve(path.join(baseDir, destination));
    } else {
      destPath = path.resolve(path.join(srcDir, destination));
    }
    
    // Security check: destination must stay inside baseDir
    if (!destPath.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Unzulässiger Zielpfad (außerhalb der Mediathek)!' });
    }
    
    if (fs.existsSync(destPath)) {
      return res.status(400).json({ error: 'Zielpfad existiert bereits.' });
    }
    
    // Ensure destination parent folder exists
    const destParent = path.dirname(destPath);
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true });
    }
    
    fs.renameSync(srcPath, destPath);
    console.log(`[File Explorer] Moved/Renamed: ${srcPath} -> ${destPath}`);
    cachedLocalFiles = null; // Invalidate cache
    return res.json({ success: true });
  } catch (err) {
    console.error('[File Explorer] move error:', err.message);
    return res.status(500).json({ error: `Konnte nicht verschoben/umbenannt werden: ${err.message}` });
  }
});

app.post('/api/settings', (req, res) => {
  const { 
    downloadDir, useSSLByDefault, keepDays, checkIntervalHours, 
    xtreamHost, xtreamUsername, xtreamPassword, xtreamEnabled, xtreamSyncIntervalHours,
    xxxHideEnabled, pin, newPin
  } = req.body;

  // Verify PIN if we are disabling the lock (changing xxxHideEnabled from true to false)
  if (appConfig.xxxHideEnabled && xxxHideEnabled === false) {
    if (pin !== appConfig.xxxPin) {
      return res.status(403).json({ error: 'Falscher Sperrcode!' });
    }
  }

  // Change PIN if requested
  if (newPin !== undefined && newPin !== '') {
    // If a PIN is currently active, verify it
    if (appConfig.xxxPin !== '' && pin !== appConfig.xxxPin) {
      return res.status(403).json({ error: 'Falscher Sperrcode!' });
    }
    appConfig.xxxPin = newPin;
    console.log('[Jugendschutz] Sperrcode wurde geändert.');
  }

  if (xxxHideEnabled !== undefined) {
    appConfig.xxxHideEnabled = !!xxxHideEnabled;
  }

  if (downloadDir) {
    const oldDir = appConfig.downloadDir;
    appConfig.downloadDir = path.resolve(downloadDir);
    if (oldDir !== appConfig.downloadDir) {
      loadMetadataCache();
      cachedLocalFiles = null;
      configureSambaShare(appConfig.downloadDir);
    }
  }
  if (typeof useSSLByDefault === 'boolean') {
    appConfig.useSSLByDefault = useSSLByDefault;
  }
  if (typeof keepDays === 'number' && keepDays >= 0) {
    appConfig.keepDays = keepDays;
  }
  if (typeof checkIntervalHours === 'number' && checkIntervalHours > 0) {
    appConfig.checkIntervalHours = checkIntervalHours;
    recreateCheckInterval();
  }
  
  if (xtreamHost !== undefined) appConfig.xtreamHost = xtreamHost;
  if (xtreamUsername !== undefined) appConfig.xtreamUsername = xtreamUsername;
  if (xtreamPassword !== undefined) appConfig.xtreamPassword = xtreamPassword;
  if (xtreamEnabled !== undefined) appConfig.xtreamEnabled = !!xtreamEnabled;
  if (typeof xtreamSyncIntervalHours === 'number' && xtreamSyncIntervalHours > 0) {
    appConfig.xtreamSyncIntervalHours = xtreamSyncIntervalHours;
  }

  saveConfig();

  recreateXtreamSyncInterval();

  if (appConfig.xtreamEnabled) {
    lastXtreamFetch = 0; // force cache refresh
    fetchXtreamData().catch(err => console.error('[Xtream] Settings update fetch error:', err.message));
  }

  const publicConfig = { ...appConfig };
  delete publicConfig.xxxPin;
  publicConfig.version = appVersion;
  publicConfig.startTime = serverStartTime;
  return res.json(publicConfig);
});

// 4. Logs endpoint
app.get('/api/logs', (req, res) => {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      return res.json({ logs: content });
    } else {
      return res.json({ logs: 'Keine System-Logs vorhanden.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Fehler beim Lesen der Log-Datei: ' + err.message });
  }
});

// Auto-Download endpoints
app.get('/api/auto-download', (req, res) => {
  loadAutoDownloads();
  return res.json(autoDownloads);
});

app.post('/api/auto-download/toggle', (req, res) => {
  const { imdbId, title, enabled } = req.body;
  if (!imdbId || !title) {
    return res.status(400).json({ error: 'Fehlende Parameter imdbId oder title' });
  }

  loadAutoDownloads();
  
  if (!autoDownloads[imdbId]) {
    autoDownloads[imdbId] = {
      imdbId,
      title,
      enabled: false,
      addedAt: new Date().toISOString()
    };
  }

  autoDownloads[imdbId].enabled = !!enabled;
  saveAutoDownloads();
  
  // Broadcast updated subscriptions to all connected clients
  broadcastAutoDownloads();

  // If enabled, trigger a check immediately in the background
  if (enabled) {
    console.log(`[Auto-Download] Enabled for "${title}" (${imdbId}). Triggering check...`);
    checkAllAutoDownloads();
  }

  return res.json(autoDownloads[imdbId]);
});

app.post('/api/auto-download/check-now', async (req, res) => {
  const { imdbId } = req.body;
  if (!imdbId) {
    return res.status(400).json({ error: 'Fehlende Parameter imdbId' });
  }

  loadAutoDownloads();
  const sub = autoDownloads[imdbId];
  if (!sub) {
    return res.status(404).json({ error: 'Kein Abonnement für diese IMDb-ID gefunden' });
  }

  console.log(`[Auto-Download] Manual 'Search now' triggered for "${sub.title}" (${imdbId})`);

  getLocalFiles().then(mediaFiles => {
    checkSingleShow(sub, mediaFiles);
  }).catch(err => {
    console.error(`[Auto-Download] Error scanning during manual check:`, err.message);
  });

  return res.json({ success: true, message: 'Suche gestartet' });
});

async function findAndExtractRarFiles(dir, sendLog) {
  const rarFiles = [];
  
  async function findRar(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await findRar(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.rar') {
          // Verify if it is currently being written to by another download in downloadQueue
          let isCurrentlyDownloading = false;
          for (const item of downloadQueue.values()) {
            if (item.downloader && item.downloader.status === 'dcc_downloading' && item.downloader.filePath === fullPath) {
              isCurrentlyDownloading = true;
              break;
            }
          }
          if (!isCurrentlyDownloading) {
            rarFiles.push(fullPath);
          }
        }
      }
    }
  }
  
  await findRar(dir);
  
  if (rarFiles.length === 0) {
    return false;
  }
  
  const rarsToExtract = rarFiles.filter(filePath => {
    const filename = path.basename(filePath).toLowerCase();
    const partMatch = filename.match(/part(\d+)\.rar$/);
    if (partMatch) {
      const partNum = parseInt(partMatch[1], 10);
      return partNum === 1; // Only extract part 1
    }
    return true;
  });

  if (rarsToExtract.length === 0) {
    return false;
  }
  
  sendLog(`Gefundene RAR-Archive: ${rarsToExtract.length}. Entpacken gestartet...`);
  let extractedAny = false;

  for (const rarPath of rarsToExtract) {
    const rarDir = path.dirname(rarPath);
    sendLog(`Entpacke RAR-Datei: ${path.basename(rarPath)}...`);
    
    const success = await new Promise((resolve) => {
      execFile('unrar', ['x', '-o+', rarPath, rarDir], (unrarErr) => {
        if (!unrarErr) {
          sendLog(`Erfolgreich entpackt mit unrar!`);
          resolve(true);
        } else {
          sendLog(`unrar nicht verfügbar oder fehlgeschlagen. Versuche 7z...`);
          execFile('7z', ['x', '-y', `-o${rarDir}`, rarPath], (sevenzErr) => {
            if (!sevenzErr) {
              sendLog(`Erfolgreich entpackt mit 7z!`);
              resolve(true);
            } else {
              sendLog(`Fehler beim Entpacken von ${path.basename(rarPath)}: unrar & 7z fehlgeschlagen.`);
              resolve(false);
            }
          });
        }
      });
    });

    if (success) {
      extractedAny = true;
      // Delete all archive parts and verification files for this specific RAR archive
      const filename = path.basename(rarPath);
      let prefix = filename;
      if (filename.toLowerCase().endsWith('.part1.rar')) {
        prefix = filename.slice(0, -10);
      } else if (filename.toLowerCase().endsWith('.rar')) {
        prefix = filename.slice(0, -4);
      }

      try {
        const dirEntries = await fs.promises.readdir(rarDir, { withFileTypes: true });
        for (const entry of dirEntries) {
          if (entry.isFile()) {
            const entryName = entry.name;
            if (entryName.toLowerCase().startsWith(prefix.toLowerCase())) {
              const entryExt = path.extname(entryName).toLowerCase();
              const isArchivePart = entryExt === '.rar' || 
                                   /^\.r\d+$/.test(entryExt) || 
                                   entryExt === '.sfv' ||
                                   /\.part\d+\.rar$/i.test(entryName);
              if (isArchivePart) {
                const partPath = path.join(rarDir, entryName);
                try {
                  await fs.promises.unlink(partPath);
                  console.log(`[Extraction] Archive-Teil gelöscht: ${partPath}`);
                } catch (unlinkErr) {
                  console.error(`[Extraction] Fehler beim Löschen von ${partPath}:`, unlinkErr.message);
                }
              }
            }
          }
        }
      } catch (dirErr) {
        console.error(`[Extraction] Fehler beim Bereinigen von RAR-Verzeichnis ${rarDir}:`, dirErr.message);
      }
    }
  }

  return extractedAny;
}

async function flattenAndCleanupMedia(downloadDir) {
  try {
    const baseDir = path.resolve(downloadDir);
    
    async function traverse(currentDir) {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          if (path.resolve(currentDir) !== baseDir) {
            const ext = path.extname(entry.name).toLowerCase();
            let targetPath = path.join(baseDir, entry.name);
            
            if (fs.existsSync(targetPath)) {
              const nameWithoutExt = path.parse(entry.name).name;
              let counter = 1;
              while (fs.existsSync(targetPath)) {
                targetPath = path.join(baseDir, `${nameWithoutExt}_${counter}${ext}`);
                counter++;
              }
            }
            
            await fs.promises.rename(fullPath, targetPath);
            console.log(`[Relocation] Moved file from ${fullPath} to ${targetPath}`);
          }
        }
      }
    }
    
    await traverse(baseDir);
    
    async function cleanEmptyDirs(currentDir) {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await cleanEmptyDirs(fullPath);
          const subEntries = await fs.promises.readdir(fullPath);
          if (subEntries.length === 0) {
            await fs.promises.rmdir(fullPath);
            console.log(`[Relocation] Cleaned empty directory: ${fullPath}`);
          }
        }
      }
    }
    
    await cleanEmptyDirs(baseDir);
  } catch (err) {
    console.error('[Relocation] Fehler beim Verschieben/Bereinigen der Dateien:', err);
  }
}

async function detectExtractedMedia(downloadDir, originalFilename, filesBefore) {
  try {
    const filesAfter = await fs.promises.readdir(downloadDir);
    const newFiles = filesAfter.filter(f => !filesBefore.has(f));
    const newMediaFiles = [];
    
    for (const file of newFiles) {
      const ext = path.extname(file).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext)) {
        try {
          const stat = await fs.promises.stat(path.join(downloadDir, file));
          newMediaFiles.push({ filename: file, size: stat.size });
        } catch (e) {}
      }
    }
    
    // Sort by size descending (largest first)
    newMediaFiles.sort((a, b) => b.size - a.size);
    
    if (newMediaFiles.length > 0) {
      return newMediaFiles[0].filename;
    }
    
    // Fallback 1: Match by base name prefix
    const archiveBase = path.parse(originalFilename).name.toLowerCase();
    const cleanBase = archiveBase.replace(/\.part\d+$/, '').replace(/\.tar$/, '');
    
    const matchingMedia = [];
    for (const file of filesAfter) {
      const ext = path.extname(file).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext)) {
        if (file.toLowerCase().startsWith(cleanBase)) {
          try {
            const stat = await fs.promises.stat(path.join(downloadDir, file));
            matchingMedia.push({ filename: file, size: stat.size });
          } catch (e) {}
        }
      }
    }
    
    matchingMedia.sort((a, b) => b.size - a.size);
    if (matchingMedia.length > 0) {
      return matchingMedia[0].filename;
    }
    
    // Fallback 2: Find the absolute newest media file in downloadDir
    const allMedia = [];
    for (const file of filesAfter) {
      const ext = path.extname(file).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext)) {
        try {
          const stat = await fs.promises.stat(path.join(downloadDir, file));
          allMedia.push({ filename: file, mtime: stat.mtimeMs });
        } catch (e) {}
      }
    }
    allMedia.sort((a, b) => b.mtime - a.mtime);
    if (allMedia.length > 0) {
      return allMedia[0].filename;
    }
  } catch (err) {
    console.error('[Detection] Fehler bei der Mediendetektion:', err);
  }
  return null;
}

async function handleDownloadPostProcessing(id, downloader) {
  const filePath = downloader.filePath;
  const downloadDir = downloader.downloadDir;
  const lowerFile = downloader.filename.toLowerCase();
  
  const isArchive = lowerFile.endsWith('.tar') || 
                    lowerFile.endsWith('.tar.gz') || 
                    lowerFile.endsWith('.tgz') || 
                    lowerFile.endsWith('.rar');
                    
  if (isArchive) {
    downloadQueue.set(id, { downloader, statusOverride: 'extracting' });
    broadcastStatus(id);
  }

  const sendLog = (text) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'message', data: { id, text: `[Entpacken] ${text}` } }));
      }
    });
  };

  const filesBefore = new Set();
  try {
    if (fs.existsSync(downloadDir)) {
      const entries = await fs.promises.readdir(downloadDir);
      for (const entry of entries) {
        filesBefore.add(entry);
      }
    }
  } catch (e) {
    console.error('[PostProcessing] Konnte Verzeichnis vor Entpackung nicht lesen:', e);
  }

  try {
    if (lowerFile.endsWith('.tar') || lowerFile.endsWith('.tar.gz') || lowerFile.endsWith('.tgz')) {
      sendLog(`Entpacken der TAR-Datei gestartet...`);
      await new Promise((resolve) => {
        execFile('tar', ['-xf', filePath, '-C', downloadDir], (error) => {
          if (error) {
            console.error(`[Extraction] TAR-Fehler:`, error);
            sendLog(`Fehler beim TAR-Entpacken: ${error.message}`);
            resolve(false);
          } else {
            sendLog(`TAR erfolgreich entpackt.`);
            fs.unlink(filePath, (err) => {
              if (err) console.error(`[Extraction] Konnte TAR nicht löschen:`, err);
              else sendLog(`Originale TAR-Datei gelöscht.`);
              resolve(true);
            });
          }
        });
      });
    }

    // Now check for RAR files (both if downloaded RAR or extracted from TAR)
    await findAndExtractRarFiles(downloadDir, sendLog);
    
    // Flatten any subdirectories (move media files to root, delete empty subdirs)
    sendLog(`Bereinige Verzeichnisstruktur...`);
    await flattenAndCleanupMedia(downloadDir);
    sendLog(`Dateien erfolgreich verarbeitet.`);
    
    // Detect the extracted media file and update queue item
    sendLog(`Suche nach entpackter Mediendatei...`);
    const detected = await detectExtractedMedia(downloadDir, downloader.filename, filesBefore);
    if (detected) {
      const oldFilename = downloader.filename;
      downloader.filename = detected;
      downloader.filePath = path.join(downloadDir, detected);
      
      try {
        const stat = await fs.promises.stat(downloader.filePath);
        downloader.expectedSize = stat.size;
        downloader.bytesReceived = stat.size;
      } catch (e) {}
      
      sendLog(`Zugeordnetes File geändert auf: ${detected}`);
      console.log(`[PostProcessing] Updated downloader ${id} filename from ${oldFilename} to ${detected}`);
    } else {
      sendLog(`Keine passende Mediendatei gefunden. Dateiname bleibt: ${downloader.filename}`);
    }

    // Auto-organize files immediately
    await organizeAllFiles();
    
  } catch (err) {
    console.error(`[PostProcessing] Fehler:`, err);
    sendLog(`Fehler bei der Nachverarbeitung: ${err.message}`);
  } finally {
    // Clear override to finish
    downloadQueue.set(id, { downloader, statusOverride: null });
    cachedLocalFiles = null;
    broadcastStatus(id);
  }
}

app.post('/api/xtream/download', (req, res) => {
  const { url, title, seriesTitle } = req.body;

  if (!url || !title) {
    return res.status(400).json({ error: 'Fehlende Parameter url oder title' });
  }

  // Generate unique ID using md5 hash of the stream URL
  const id = `http_${crypto.createHash('md5').update(url).digest('hex')}`;

  if (downloadQueue.has(id)) {
    const item = downloadQueue.get(id);
    if (item.downloader.status === 'paused' || item.downloader.status === 'error' || item.downloader.status === 'cancelled') {
      item.downloader.cleanup();
      downloadQueue.delete(id);
    } else {
      return res.status(400).json({ error: 'Download läuft bereits oder ist bereits in der Warteschlange.' });
    }
  }

  // Determine file extension from URL
  let extension = '.mp4';
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    if (ext && ext.length > 1 && ext.length < 6) {
      extension = ext.toLowerCase();
    }
  } catch (e) {}

  // Construct target filename
  let filename = '';
  if (seriesTitle) {
    filename = `${seriesTitle} - ${title}${extension}`;
  } else {
    filename = `${title}${extension}`;
  }
  // Clean illegal filename characters
  filename = filename.replace(/[\\/:*?"<>|]/g, '_');

  const downloader = new HttpDownloader({
    id,
    url,
    filename,
    downloadDir: appConfig.downloadDir
  });

  downloader.on('progress', (data) => {
    // HTTP downloads do not require RAR/TAR extraction post-processing
    if (data.status === 'completed') {
      cachedLocalFiles = null;
      organizeAllFiles().catch(err => console.error('[Xtream Download] Organize error:', err));
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

// 4. Download operations
app.post('/api/download', (req, res) => {
  const { server, port, useSSL, channel, botName, packNumber, filename, expectedSize, useSsend } = req.body;

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
    downloadDir: appConfig.downloadDir,
    useSsend: typeof useSsend === 'boolean' ? useSsend : false
  });

  downloader.on('progress', (data) => {
    if (data.status === 'completed' && !downloader._extractionStarted) {
      downloader._extractionStarted = true;
      handleDownloadPostProcessing(id, downloader);
    } else {
      broadcastStatus(id);
    }
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
          cachedLocalFiles = null;
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

function checkAudioTranscodeNeeded(filePath) {
  return new Promise((resolve) => {
    execFile('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_name',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ], (err, stdout) => {
      if (err) {
        console.error('[probe] ffprobe failed:', err.message);
        resolve(false); // Fallback to direct streaming
        return;
      }
      const codec = stdout.trim().toLowerCase();
      console.log(`[probe] Detected audio codec for ${path.basename(filePath)}: ${codec}`);
      const needsTranscode = ['dts', 'ac3', 'eac3', 'truehd', 'dca'].includes(codec);
      resolve(needsTranscode);
    });
  });
}

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
  cachedLocalFiles = null;
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

let cachedLocalFiles = null;
let lastLocalScanTime = 0;
const LOCAL_CACHE_TTL = 30000; // 30 seconds

let metadataCache = {};

function getMetadataCachePath() {
  return path.join(appConfig.downloadDir, '.metadata_cache.json');
}

function loadMetadataCache() {
  const cachePath = getMetadataCachePath();
  if (fs.existsSync(cachePath)) {
    try {
      metadataCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`[Cache] Loaded metadata cache from ${cachePath} (${Object.keys(metadataCache).length} items)`);
    } catch (e) {
      console.error('Error loading metadata cache:', e);
      metadataCache = {};
    }
  } else {
    metadataCache = {};
  }
}

let saveMetadataTimeout = null;
function saveMetadataCache() {
  if (saveMetadataTimeout) {
    clearTimeout(saveMetadataTimeout);
  }
  saveMetadataTimeout = setTimeout(async () => {
    saveMetadataTimeout = null;
    const cachePath = getMetadataCachePath();
    try {
      if (!fs.existsSync(appConfig.downloadDir)) {
        await fs.promises.mkdir(appConfig.downloadDir, { recursive: true });
      }
      await fs.promises.writeFile(cachePath, JSON.stringify(metadataCache, null, 2), 'utf8');
      console.log(`[Cache] Metadata cache saved to ${cachePath} (${Object.keys(metadataCache).length} items)`);
    } catch (e) {
      console.error('Error saving metadata cache:', e);
    }
  }, 1000); // 1 second debounce
}

let playProgress = {};
const PLAY_PROGRESS_FILE = path.join(os.homedir(), '.xdcc_play_progress.json');

function loadPlayProgress() {
  try {
    if (fs.existsSync(PLAY_PROGRESS_FILE)) {
      const data = fs.readFileSync(PLAY_PROGRESS_FILE, 'utf8');
      playProgress = JSON.parse(data);
      console.log(`[Progress] Loaded playback progress for ${Object.keys(playProgress).length} items`);
    }
  } catch (err) {
    console.error('Failed to load play progress:', err.message);
    playProgress = {};
  }
}

function savePlayProgress() {
  try {
    fs.writeFileSync(PLAY_PROGRESS_FILE, JSON.stringify(playProgress, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save play progress:', err.message);
  }
}

// --- Favorites and Cache Logic ---
let favorites = new Set();
const FAVORITES_FILE = path.join(os.homedir(), '.xdcc_favorites.json');

function loadFavorites() {
  try {
    if (fs.existsSync(FAVORITES_FILE)) {
      const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
      favorites = new Set(JSON.parse(data));
      console.log(`[Favorites] Loaded ${favorites.size} favorites`);
    }
  } catch (err) {
    console.error('Failed to load favorites:', err.message);
    favorites = new Set();
  }
}

function saveFavorites() {
  try {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(Array.from(favorites), null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save favorites:', err.message);
  }
}

let cachedMappedMovies = [];
let cachedMappedSeries = [];
let cachedMappedLive = [];
let cachedMappedList = [];
let cachedRawItems = [];

function isItemFavorite(item) {
  const favKey = item.isGroup
    ? (item.xtreamSeriesId || item.imdbId || item.title || item.metadata?.imdbId || item.metadata?.title)
    : item.filename;
  return favorites.has(String(favKey));
}

function rebuildCachedRawItems() {
  cachedRawItems = [
    ...cachedMappedList,
    ...cachedMappedMovies,
    ...cachedMappedSeries,
    ...cachedMappedLive
  ];
  console.log(`[Performance] Rebuilt cachedRawItems: ${cachedRawItems.length} total items (Lokal: ${cachedMappedList.length}, Movies: ${cachedMappedMovies.length}, Series: ${cachedMappedSeries.length}, Live TV: ${cachedMappedLive.length})`);
}

async function updateLocalMappedList(force = false) {
  const list = await getLocalFiles(force);
  cachedMappedList = list.map(item => {
    const ext = path.extname(item.filename).toLowerCase();
    const cloned = { ...item };
    if (cloned.metadata) {
      cloned.metadata = { ...cloned.metadata };
      cloned.metadata.originalCategory = cloned.metadata.category || (ext === '.m4b' ? 'Hörbücher' : (MUSIC_EXTENSIONS.has(ext) ? 'Musik' : 'Videos'));
      cloned.metadata.category = 'Lokal';
    } else {
      cloned.metadata = {
        title: path.parse(cloned.filename).name,
        category: 'Lokal',
        originalCategory: ext === '.m4b' ? 'Hörbücher' : (MUSIC_EXTENSIONS.has(ext) ? 'Musik' : 'Videos')
      };
    }
    return cloned;
  });
  rebuildCachedRawItems();
}

function updateMappedXtreamData() {
  if (!appConfig.xtreamEnabled || !appConfig.xtreamHost || !appConfig.xtreamUsername || !appConfig.xtreamPassword) {
    cachedMappedMovies = [];
    cachedMappedSeries = [];
    cachedMappedLive = [];
    rebuildCachedRawItems();
    return;
  }
  
  const host = appConfig.xtreamHost.replace(/\/$/, '');
  const vodCatMap = new Map(xtreamVodCategories.map(c => [String(c.category_id), c.category_name]));
  const seriesCatMap = new Map(xtreamSeriesCategories.map(c => [String(c.category_id), c.category_name]));
  const liveCatMap = new Map(xtreamLiveCategories.map(c => [String(c.category_id), c.category_name]));
  
  const parseXtreamTimestamp = (val) => {
    if (!val) return 0;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) return 0;
    return String(parsed).length >= 13 ? parsed : parsed * 1000;
  };
  
  cachedMappedMovies = xtreamMovies.map(movie => {
    const ext = movie.container_extension || 'mp4';
    const streamUrl = `${host}/movie/${appConfig.xtreamUsername}/${appConfig.xtreamPassword}/${movie.stream_id}.${ext}`;
    const subcat = vodCatMap.get(String(movie.category_id)) || 'Sonstige';
    const addedTime = parseXtreamTimestamp(movie.added) || Date.now();
    return {
      filename: streamUrl,
      sizeBytes: 0,
      mtime: addedTime,
      isXtream: true,
      xtreamStreamId: movie.stream_id,
      metadata: {
        title: movie.name,
        posterUrl: movie.stream_icon,
        category: 'Filme',
        subcategory: subcat,
        cast: 'Xtream Codes Movie',
        year: movie.rating ? `Rating: ${movie.rating}` : null
      }
    };
  });
  
  cachedMappedSeries = xtreamSeries.map(series => {
    const subcat = seriesCatMap.get(String(series.category_id)) || 'Sonstige';
    const addedTime = parseXtreamTimestamp(series.last_modified) || parseXtreamTimestamp(series.added) || Date.now();
    return {
      filename: `xtream_series_${series.series_id}`,
      isGroup: true,
      isXtream: true,
      xtreamSeriesId: series.series_id,
      title: series.name,
      posterUrl: series.cover,
      category: 'Serien',
      subcategory: subcat,
      cast: series.plot || 'Xtream Codes Series',
      year: series.rating ? `Rating: ${series.rating}` : null,
      mtime: addedTime,
      metadata: {
        title: series.name,
        posterUrl: series.cover,
        category: 'Serien',
        subcategory: subcat,
        cast: series.plot || 'Xtream Codes Series',
        year: series.rating ? `Rating: ${series.rating}` : null
      },
      files: []
    };
  });
  
  cachedMappedLive = xtreamLive.map(channel => {
    const streamUrl = `${host}/live/${appConfig.xtreamUsername}/${appConfig.xtreamPassword}/${channel.stream_id}.ts`;
    const subcat = liveCatMap.get(String(channel.category_id)) || 'Sonstige';
    const isRadio = subcat.toLowerCase().includes('radio') || channel.name.toLowerCase().includes('radio');
    return {
      filename: streamUrl,
      sizeBytes: 0,
      mtime: Date.now(),
      isXtream: true,
      isLive: true,
      xtreamStreamId: channel.stream_id,
      metadata: {
        title: channel.name,
        posterUrl: channel.stream_icon,
        category: isRadio ? 'Musik' : 'Live TV',
        subcategory: isRadio ? 'Internet-Radio' : subcat,
        cast: isRadio ? 'Xtream Internet Radio' : 'Xtream Live TV Channel'
      }
    };
  });
  
  if (appConfig.xxxHideEnabled) {
    cachedMappedMovies = cachedMappedMovies.filter(m => !isAdultContent(m.metadata.subcategory, m.metadata.title));
    cachedMappedSeries = cachedMappedSeries.filter(s => !isAdultContent(s.metadata.subcategory, s.metadata.title));
    cachedMappedLive = cachedMappedLive.filter(l => !isAdultContent(l.metadata.subcategory, l.metadata.title));
  }
  
  rebuildCachedRawItems();
}

let isOrganizing = false;

function isFileDownloading(filePath) {
  for (const [id, item] of downloadQueue.entries()) {
    if (item.downloader && item.downloader.filePath === filePath) {
      if (['connecting', 'registering', 'joining', 'requesting', 'queued', 'dcc_negotiating', 'dcc_downloading', 'extracting'].includes(item.downloader.status)) {
        return true;
      }
    }
  }
  return false;
}

function updateDownloaderFilePath(oldPath, newPath) {
  for (const [id, item] of downloadQueue.entries()) {
    if (item.downloader && item.downloader.filePath === oldPath) {
      item.downloader.filePath = newPath;
      item.downloader.filename = path.basename(newPath);
      console.log(`[Organize] Updated downloader ${id} filePath to ${newPath}`);
    }
  }
}

async function cleanEmptyDirsInDownloadDir(currentDir) {
  const dir = appConfig.downloadDir;
  if (!fs.existsSync(currentDir)) return;
  
  if (currentDir === dir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await cleanEmptyDirsInDownloadDir(path.join(currentDir, entry.name));
      }
    }
    return;
  }
  
  const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await cleanEmptyDirsInDownloadDir(path.join(currentDir, entry.name));
    }
  }
  
  // Re-read entries to check if empty
  const finalEntries = await fs.promises.readdir(currentDir);
  if (finalEntries.length === 0) {
    await fs.promises.rmdir(currentDir);
    console.log(`[Organize] Removed empty directory: ${currentDir}`);
  }
}

async function organizeAllFiles() {
  const dir = appConfig.downloadDir;
  if (!fs.existsSync(dir)) return;
  if (isOrganizing) return;
  isOrganizing = true;
  
  try {
    const filesToOrganize = [];
    
    async function findUnorganized(currentDir) {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(dir, fullPath);
        
        if (entry.isDirectory()) {
          const firstDir = relPath.split(path.sep)[0];
          if (['Filme', 'Serien', 'Musik'].includes(firstDir)) {
            continue;
          }
          await findUnorganized(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MEDIA_EXTENSIONS.has(ext)) {
            if (isFileDownloading(fullPath)) {
              continue;
            }
            filesToOrganize.push({ fullPath, relPath, name: entry.name, ext });
          }
        }
      }
    }
    
    await findUnorganized(dir);
    
    if (filesToOrganize.length > 0) {
      console.log(`[Organize] Found ${filesToOrganize.length} files to structure...`);
    }
    
    let changed = false;
    for (const file of filesToOrganize) {
      const ext = file.ext;
      const baseName = file.name;
      const relPath = file.relPath;
      const sourcePath = file.fullPath;
      
      let category = 'Filme';
      let subfolder = 'Filme';
      let seriesTitle = '';
      let imdb = null;
      let parsed = null;
      
      if (MUSIC_EXTENSIONS.has(ext)) {
        if (ext === '.m4b') {
          category = 'Hörbücher';
          subfolder = path.join('Musik', 'Hörbücher');
        } else {
          category = 'Musik';
          subfolder = 'Musik';
        }
      } else {
        // Video file
        parsed = parseFilename(baseName);
        // Look up metadata cache
        const cached = metadataCache[relPath] || metadataCache[baseName];
        if (cached && (cached.category === 'Serien' || cached.category === 'Filme' || cached.type)) {
          category = cached.category || (cached.type === 'series' ? 'Serien' : 'Filme');
          if (category === 'Serien') {
            seriesTitle = cached.title || parsed.title;
          }
        } else {
          imdb = await fetchImdbMetadata(parsed);
          if (imdb) {
            category = imdb.type === 'series' ? 'Serien' : 'Filme';
            seriesTitle = imdb.title;
          }
        }
        
        if (category === 'Serien' || parsed.isSeries) {
          category = 'Serien';
          const titleName = seriesTitle || parsed.title || 'Unbekannte Serie';
          const safeSeriesTitle = titleName.replace(/[\\/:*?"<>|]/g, '_').trim();
          
          let seasonFolder = null;
          const sEp = parsed.seasonEpisode || baseName;
          const sMatch = sEp.match(/S(\d+)/i) || sEp.match(/(\d+)x/i) || sEp.match(/Staffel\s*(\d+)/i) || sEp.match(/Season\s*(\d+)/i);
          if (sMatch) {
            const seasonNum = parseInt(sMatch[1], 10);
            seasonFolder = `Staffel ${String(seasonNum).padStart(2, '0')}`;
          }
          
          if (seasonFolder) {
            subfolder = path.join('Serien', safeSeriesTitle, seasonFolder);
          } else {
            subfolder = path.join('Serien', safeSeriesTitle);
          }
        } else {
          category = 'Filme';
          subfolder = 'Filme';
        }
      }
      
      // Determine target path
      let targetPath = path.join(dir, subfolder, baseName);
      if (fs.existsSync(targetPath)) {
        const nameWithoutExt = path.parse(baseName).name;
        let counter = 1;
        while (fs.existsSync(targetPath)) {
          targetPath = path.join(dir, subfolder, `${nameWithoutExt}_${counter}${ext}`);
          counter++;
        }
      }
      
      // Move the file
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.rename(sourcePath, targetPath);
      console.log(`[Organize] Moved ${sourcePath} to ${targetPath}`);
      changed = true;
      
      const newRelPath = path.relative(dir, targetPath);
      
      // Update metadataCache
      if (metadataCache[relPath]) {
        metadataCache[newRelPath] = { ...metadataCache[relPath] };
        metadataCache[newRelPath].category = category;
        delete metadataCache[relPath];
      } else if (metadataCache[baseName]) {
        metadataCache[newRelPath] = { ...metadataCache[baseName] };
        metadataCache[newRelPath].category = category;
        delete metadataCache[baseName];
      } else {
        metadataCache[newRelPath] = {
          title: parsed ? parsed.title : path.parse(baseName).name,
          category: category,
          year: parsed ? parsed.year : null,
          seasonEpisode: parsed ? parsed.seasonEpisode : null,
          isSeries: parsed ? parsed.isSeries : false
        };
        if (imdb) {
          metadataCache[newRelPath] = {
            ...metadataCache[newRelPath],
            imdbId: imdb.imdbId,
            title: imdb.title,
            type: imdb.type,
            year: imdb.year,
            yearRange: imdb.yearRange,
            cast: imdb.cast,
            posterUrl: imdb.posterUrl
          };
        }
      }
      
      // Update playProgress
      if (playProgress[relPath]) {
        playProgress[newRelPath] = playProgress[relPath];
        delete playProgress[relPath];
      }
      
      // Update download queue
      updateDownloaderFilePath(sourcePath, targetPath);
    }
    
    if (changed) {
      saveMetadataCache();
      savePlayProgress();
      cachedLocalFiles = null; // Invalidate scan cache
    }
    
    // Clean up empty folders
    await cleanEmptyDirsInDownloadDir(dir);
    
  } catch (err) {
    console.error('[Organize] Error during file organization:', err);
  } finally {
    isOrganizing = false;
  }
}


function configureSambaShare(downloadDir) {
  if (process.platform !== 'linux') {
    console.log('[Samba] System is not Linux. Skipping Samba configuration.');
    return;
  }

  const smbConfPath = '/etc/samba/smb.conf';
  if (!fs.existsSync(smbConfPath)) {
    console.log('[Samba] /etc/samba/smb.conf not found. Samba might not be installed.');
    return;
  }

  try {
    console.log(`[Samba] Configuring share for directory: ${downloadDir}`);
    let content = fs.readFileSync(smbConfPath, 'utf8');

    const sectionRegex = /\[Mediathek\][\s\S]*?(?=\n\[|$)/g;
    content = content.replace(sectionRegex, '').trim();

    const username = os.userInfo().username || 'pi';
    const newSection = `
[Mediathek]
   path = ${downloadDir}
   browseable = yes
   read only = no
   guest ok = yes
   create mask = 0775
   directory mask = 0775
   force user = ${username}
`;

    content = content + '\n' + newSection.trim() + '\n';

    const tempPath = '/tmp/smb.conf.tmp';
    fs.writeFileSync(tempPath, content, 'utf8');

    const cmd = `sudo cp ${tempPath} ${smbConfPath} && sudo systemctl restart smbd || sudo service smbd restart`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('[Samba] Error copying config or restarting smbd:', err.message);
      } else {
        console.log('[Samba] Samba configuration updated and service restarted successfully.');
      }
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        // ignore
      }
    });
  } catch (err) {
    console.error('[Samba] Error updating Samba config:', err.message);
  }
}

async function getLocalFiles(force = false) {
  if (!force && cachedLocalFiles && (Date.now() - lastLocalScanTime < LOCAL_CACHE_TTL)) {
    return cachedLocalFiles;
  }
  cachedLocalFiles = await scanDownloadDir();
  lastLocalScanTime = Date.now();
  return cachedLocalFiles;
}

loadMetadataCache();

// --- Auto-Download Feature ---
let autoDownloads = {};
const tvmazeCache = {};
let checkIntervalTimer = null;

function recreateCheckInterval() {
  if (checkIntervalTimer) {
    clearInterval(checkIntervalTimer);
  }
  const hours = appConfig.checkIntervalHours || 3;
  console.log(`[Auto-Download] Setting query interval to ${hours} hours.`);
  checkIntervalTimer = setInterval(checkAllAutoDownloads, hours * 60 * 60 * 1000);
}

function getAutoDownloadsPath() {
  return path.join(appConfig.downloadDir, '.auto_downloads.json');
}

function loadAutoDownloads() {
  const filePath = getAutoDownloadsPath();
  if (fs.existsSync(filePath)) {
    try {
      autoDownloads = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`[Auto-Download] Loaded subscriptions from ${filePath} (${Object.keys(autoDownloads).length} items)`);
    } catch (e) {
      console.error('Error loading auto downloads file:', e);
      autoDownloads = {};
    }
  } else {
    autoDownloads = {};
  }
}

function saveAutoDownloads() {
  const filePath = getAutoDownloadsPath();
  try {
    if (!fs.existsSync(appConfig.downloadDir)) {
      fs.mkdirSync(appConfig.downloadDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(autoDownloads, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving auto downloads file:', e);
  }
}

function broadcastAutoDownloads() {
  const message = JSON.stringify({ type: 'auto-downloads', data: autoDownloads });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

function parseSeasonEpisodeNumber(seStr) {
  if (!seStr) return null;
  let match = seStr.match(/S(\d+)E(\d+)/i);
  if (match) {
    return {
      season: parseInt(match[1], 10),
      episode: parseInt(match[2], 10)
    };
  }
  match = seStr.match(/(\d+)X(\d+)/i);
  if (match) {
    return {
      season: parseInt(match[1], 10),
      episode: parseInt(match[2], 10)
    };
  }
  return null;
}

function getTargetFilename(originalFilename, targetEpNum) {
  const seriesPattern = /(s\d{1,2}\s?e\d+|\d{1,2}x\d+)/i;
  const match = originalFilename.match(seriesPattern);
  if (!match) return null;
  
  const epMatch = match[0].match(/([EeXx])(\d+)/);
  if (!epMatch) return null;
  
  const prefix = epMatch[1]; // E or x
  const digits = epMatch[2]; // e.g. 03
  const padding = digits.length;
  const newEpStr = prefix + String(targetEpNum).padStart(padding, '0');
  
  const newSeriesStr = match[0].replace(epMatch[0], newEpStr);
  return originalFilename.replace(match[0], newSeriesStr);
}

function matchTagBased(templateFilename, resultFilename, targetSeason, targetEpisode, showTitle) {
  // 1. Verify season and episode
  const parsedResult = parseFilename(resultFilename);
  if (!parsedResult.isSeries) return false;
  
  const se = parseSeasonEpisodeNumber(parsedResult.seasonEpisode);
  if (!se || se.season !== targetSeason || se.episode !== targetEpisode) {
    return false;
  }

  // 2. Verify show title is present in result (normalized)
  const normShowTitle = showTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normResultFile = resultFilename.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normResultFile.includes(normShowTitle)) {
    return false;
  }

  // 3. Clean strings for tag boundaries (replace non-alphanumeric with spaces)
  const cleanTemplate = templateFilename.replace(/[^a-zA-Z0-9]/g, ' ');
  const cleanResult = resultFilename.replace(/[^a-zA-Z0-9]/g, ' ');

  // 4. Define target matching tags
  const RESOLUTIONS = ['2160p', '1080p', '720p', '4k', 'uhd', '576p', 'sd'];
  const LANGUAGES = ['german', 'english', 'french', 'multi', 'dl', 'dubbed', 'dual'];
  const SOURCES = ['web-dl', 'webrip', 'web', 'bluray', 'hdtv', 'dvdrip', 'bdrip', 'dsr'];
  const CODECS = ['x264', 'x265', 'h264', 'h265', 'hevc', 'av1'];

  const tagGroups = [RESOLUTIONS, LANGUAGES, SOURCES, CODECS];

  for (const group of tagGroups) {
    // Find if template contains a tag from this group
    const templateTag = group.find(tag => {
      const regex = new RegExp(`\\b${tag}\\b`, 'i');
      return regex.test(cleanTemplate);
    });

    if (templateTag) {
      // If template contains this tag, result must also contain it
      const regex = new RegExp(`\\b${templateTag}\\b`, 'i');
      if (!regex.test(cleanResult)) {
        return false; // Tag missing in result
      }
    }
  }

  return true;
}

async function getTvmazeEpisodeCount(imdbId, seasonNumber) {
  const cacheKey = `${imdbId}_${seasonNumber}`;
  if (tvmazeCache[cacheKey] !== undefined) {
    return tvmazeCache[cacheKey];
  }
  
  try {
    console.log(`[TVmaze] Fetching episodes for IMDb ID ${imdbId}, Season ${seasonNumber}...`);
    const lookupUrl = `https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`;
    const res = await axios.get(lookupUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });
    
    if (res.status === 200 && res.data && res.data.id) {
      const showId = res.data.id;
      const episodesUrl = `https://api.tvmaze.com/shows/${showId}/episodes`;
      const epRes = await axios.get(episodesUrl, { timeout: 5000 });
      if (epRes.status === 200 && Array.isArray(epRes.data)) {
        const seasonEpisodes = epRes.data.filter(ep => ep.season === seasonNumber);
        const count = seasonEpisodes.length;
        console.log(`[TVmaze] Found ${count} episodes for IMDb ID ${imdbId}, Season ${seasonNumber}`);
        tvmazeCache[cacheKey] = count;
        return count;
      }
    }
  } catch (err) {
    console.error(`[TVmaze] Error fetching for IMDb ID ${imdbId}:`, err.message);
  }
  return null;
}

function markEpisodeFailed(imdbId, episode, reason) {
  loadAutoDownloads();
  if (autoDownloads[imdbId]) {
    if (!autoDownloads[imdbId].failedEpisodes) {
      autoDownloads[imdbId].failedEpisodes = {};
    }
    autoDownloads[imdbId].failedEpisodes[String(episode)] = {
      failedAt: new Date().toISOString(),
      reason: reason || 'unknown'
    };
    saveAutoDownloads();
    broadcastAutoDownloads();
    console.log(`[Auto-Download] Marked episode ${episode} of IMDb ${imdbId} as failed. Reason: ${reason}`);
  }
}

function clearEpisodeFailure(imdbId, episode) {
  loadAutoDownloads();
  if (autoDownloads[imdbId] && autoDownloads[imdbId].failedEpisodes) {
    if (autoDownloads[imdbId].failedEpisodes[String(episode)]) {
      delete autoDownloads[imdbId].failedEpisodes[String(episode)];
      saveAutoDownloads();
      broadcastAutoDownloads();
      console.log(`[Auto-Download] Cleared failure for episode ${episode} of IMDb ${imdbId}`);
    }
  }
}

function checkDownloadsTimeout() {
  const now = Date.now();
  const timeoutMs = 20 * 60 * 1000; // 20 minutes
  
  for (const [id, item] of downloadQueue.entries()) {
    const dl = item.downloader;
    if (!item.isAuto) continue;
    
    const isActive = !['completed', 'error', 'cancelled', 'paused'].includes(dl.status) && !['completed', 'error', 'cancelled', 'paused'].includes(item.statusOverride);
    if (!isActive) continue;
    
    const startedAt = item.startedAt || now;
    if (now - startedAt > timeoutMs) {
      if (dl.bytesReceived === 0) {
        console.log(`[Auto-Download] Download ${id} timed out after 20 minutes without starting transfer. Cancelling.`);
        
        if (item.imdbId && item.episode) {
          markEpisodeFailed(item.imdbId, item.episode, 'transfer_timeout');
        }
        
        dl.cancel();
        downloadQueue.delete(id);
        broadcastDeletion(id);
        
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'message',
              data: {
                id: id,
                text: `[Auto-Download] Download abgebrochen: Nach 20 Min kein Transfer begonnen.`
              }
            }));
          }
        });
        
        setTimeout(checkAllAutoDownloads, 5000);
      }
    }
  }
}

async function checkAllAutoDownloads() {
  console.log(`[Auto-Download] Starting auto-download check...`);
  loadAutoDownloads();
  
  const subscriptions = Object.values(autoDownloads).filter(sub => sub.enabled);
  if (subscriptions.length === 0) {
    console.log(`[Auto-Download] No active subscriptions.`);
    return;
  }
  
  const mediaFiles = await getLocalFiles();
  for (const sub of subscriptions) {
    await checkSingleShow(sub, mediaFiles);
  }
}

async function checkSingleShow(sub, mediaFiles) {
  try {
    console.log(`[Auto-Download] Checking show: "${sub.title}" (IMDb: ${sub.imdbId})`);
    
    const showFiles = mediaFiles.filter(file => file.metadata && file.metadata.imdbId === sub.imdbId);
    if (showFiles.length === 0) {
      console.log(`[Auto-Download] No files found for "${sub.title}" in library. Cannot check next episode.`);
      return;
    }
    
    const parsedFiles = showFiles.map(file => {
      const se = parseSeasonEpisodeNumber(file.metadata.seasonEpisode);
      return {
        file,
        season: se ? se.season : null,
        episode: se ? se.episode : null
      };
    }).filter(x => x.season !== null && x.episode !== null);
    
    if (parsedFiles.length === 0) {
      console.log(`[Auto-Download] No files with valid SxxExx structure for "${sub.title}".`);
      return;
    }
    
    // Highest season
    const maxSeason = Math.max(...parsedFiles.map(x => x.season));
    const currentSeasonFiles = parsedFiles.filter(x => x.season === maxSeason);
    const maxEpisode = Math.max(...currentSeasonFiles.map(x => x.episode));
    
    console.log(`[Auto-Download] Current state for "${sub.title}": Season ${maxSeason}, Episode ${maxEpisode}. Total downloaded in season: ${currentSeasonFiles.length}`);
    
    // Check if season is complete using TVmaze
    const totalEpisodes = await getTvmazeEpisodeCount(sub.imdbId, maxSeason);
    if (totalEpisodes !== null && (currentSeasonFiles.length >= totalEpisodes || maxEpisode >= totalEpisodes)) {
      console.log(`[Auto-Download] Season ${maxSeason} of "${sub.title}" is complete (${currentSeasonFiles.length}/${totalEpisodes} episodes, maxEpisode: ${maxEpisode}). Stopping auto-download.`);
      autoDownloads[sub.imdbId].enabled = false;
      saveAutoDownloads();
      
      // Broadcast change to client
      broadcastAutoDownloads();
      return;
    }
    
    // Build list of candidate episodes to try
    const downloadedEpisodes = new Set(currentSeasonFiles.map(x => x.episode));
    const limit = totalEpisodes !== null ? totalEpisodes : (maxEpisode + 5);
    const candidates = [];
    for (let ep = 1; ep <= limit; ep++) {
      if (!downloadedEpisodes.has(ep)) {
        candidates.push(ep);
      }
    }
    
    // Helper to check if an episode is in downloadQueue
    const isEpisodeDownloading = (season, episode) => {
      for (const item of downloadQueue.values()) {
        const dl = item.downloader;
        const isFinished = ['completed', 'error', 'cancelled', 'paused'].includes(dl.status) || ['completed', 'error', 'cancelled', 'paused'].includes(item.statusOverride);
        if (!isFinished) {
          const parsed = parseFilename(dl.filename);
          if (parsed.isSeries) {
            const se = parseSeasonEpisodeNumber(parsed.seasonEpisode);
            if (se && se.season === season && se.episode === episode) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Find template filename (the one of maxEpisode)
    const templateFile = currentSeasonFiles.find(x => x.episode === maxEpisode)?.file || currentSeasonFiles[0].file;
    const templateFilename = path.basename(templateFile.filename);

    sub.failedEpisodes = sub.failedEpisodes || {};
    let startedAnyDownload = false;

    for (const targetEpisode of candidates) {
      // 1. Check if already downloading
      if (isEpisodeDownloading(maxSeason, targetEpisode)) {
        console.log(`[Auto-Download] Episode S${String(maxSeason).padStart(2, '0')}E${String(targetEpisode).padStart(2, '0')} for "${sub.title}" is already in the download queue.`);
        startedAnyDownload = true;
        break; // Only run one transfer at a time per series
      }

      // 2. Check if failed recently
      const failInfo = sub.failedEpisodes[String(targetEpisode)];
      if (failInfo) {
        const failedAt = new Date(failInfo.failedAt).getTime();
        const timeSinceFailure = Date.now() - failedAt;
        const retryThreshold = 20 * 60 * 1000; // 20 minutes
        if (timeSinceFailure < retryThreshold) {
          console.log(`[Auto-Download] Skipping episode S${String(maxSeason).padStart(2, '0')}E${String(targetEpisode).padStart(2, '0')} for "${sub.title}" because it failed recently (${Math.round(timeSinceFailure / 60000)}m ago).`);
          continue; // Try next candidate
        }
      }

      // 3. Construct target filename
      const targetFilename = getTargetFilename(templateFilename, targetEpisode);
      if (!targetFilename) {
        console.log(`[Auto-Download] Could not construct target filename for "${sub.title}" episode ${targetEpisode}`);
        continue;
      }

      console.log(`[Auto-Download] Searching S${String(maxSeason).padStart(2, '0')}E${String(targetEpisode).padStart(2, '0')} for "${sub.title}": "${targetFilename}"`);
      
      const seasonStr = String(maxSeason).padStart(2, '0');
      const epStr = String(targetEpisode).padStart(2, '0');
      const queryStr = `${sub.title} S${seasonStr}E${epStr}`;
      
      let searchResults = [];
      try {
        searchResults = await searchXdccEu(queryStr);
      } catch (err) {
        console.error(`[Auto-Download] Search on xdcc.eu failed:`, err.message);
      }
      
      let match = searchResults.find(res => matchTagBased(templateFilename, res.filename, maxSeason, targetEpisode, sub.title));
      
      if (!match) {
        console.log(`[Auto-Download] Episode S${seasonStr}E${epStr} not found on xdcc.eu with matching tags. Searching Moviegods IRC...`);
        try {
          const mgRes = await searchMoviegodsIRC(queryStr);
          const mgResults = mgRes.results || [];
          match = mgResults.find(res => matchTagBased(templateFilename, res.filename, maxSeason, targetEpisode, sub.title));
        } catch (err) {
          console.error(`[Auto-Download] Moviegods search failed:`, err.message);
        }
      }
      
      if (!match) {
        console.log(`[Auto-Download] Episode ${queryStr} matching template tags not found. Marking S${seasonStr}E${epStr} as failed.`);
        markEpisodeFailed(sub.imdbId, targetEpisode, 'search_no_match');
        continue; // Try next candidate
      }

      // Found a match!
      console.log(`[Auto-Download] FOUND MATCH for S${seasonStr}E${epStr}! Starting download for: ${match.filename}`);
      
      const downloadId = `${match.server}_${match.channel}_${match.botName}_${match.packNumber}_${match.filename.replace(/\s+/g, '_')}`;
      const resolvedUseSSL = appConfig.useSSLByDefault;
      const resolvedPort = resolvedUseSSL ? appConfig.ircPortDefaultSSL : appConfig.ircPortDefaultNoSSL;
      
      const downloader = new IrcDccDownloader({
        id: downloadId,
        server: match.server,
        port: resolvedPort,
        useSSL: resolvedUseSSL,
        channel: match.channel,
        botName: match.botName,
        packNumber: match.packNumber,
        filename: match.filename,
        expectedSize: match.sizeBytes,
        downloadDir: appConfig.downloadDir,
        isAuto: true
      });
      
      downloader.on('progress', (data) => {
        if (data.status === 'completed' && !downloader._extractionStarted) {
          downloader._extractionStarted = true;
          handleDownloadPostProcessing(downloadId, downloader);
          clearEpisodeFailure(sub.imdbId, targetEpisode);
          setTimeout(checkAllAutoDownloads, 30000);
        } else if (data.status === 'error') {
          console.log(`[Auto-Download] Download ${downloadId} failed with error. Marking S${seasonStr}E${epStr} as failed.`);
          markEpisodeFailed(sub.imdbId, targetEpisode, `download_error: ${data.errorMessage || 'Unknown error'}`);
          setTimeout(checkAllAutoDownloads, 5000);
        } else {
          broadcastStatus(downloadId);
        }
      });
      
      downloader.on('message', (data) => {
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'message', data: { id: downloadId, text: data.text } }));
          }
        });
      });
      
      // Save metadata and auto flag in queue
      downloadQueue.set(downloadId, {
        downloader,
        isAuto: true,
        imdbId: sub.imdbId,
        season: maxSeason,
        episode: targetEpisode,
        startedAt: Date.now()
      });
      
      broadcastStatus(downloadId);
      downloader.start();
      
      // Clear failure history since download succeeded
      clearEpisodeFailure(sub.imdbId, targetEpisode);
      
      // Send a system message to all clients about the automatic start
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'message',
            data: {
              id: downloadId,
              text: `[Auto-Download] Neue Folge automatisch gestartet: ${match.filename}`
            }
          }));
        }
      });
      
      startedAnyDownload = true;
      break; // Only start one download at a time per show per run
    }
  } catch (subErr) {
    console.error(`[Auto-Download] Error processing "${sub.title}":`, subErr);
  }
}
// -----------------------------

const MUSIC_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.m4b']);

function parseFilename(filename) {
  const baseName = path.basename(filename);
  let name = baseName;
  const extIndex = name.lastIndexOf('.');
  if (extIndex !== -1) {
    name = name.slice(0, extIndex);
  }
  
  name = name.replace(/[\._\-]/g, ' ');
  
  const seriesPattern = /\b(s\d{1,2}\s?e\d{1,2}|\b\d{1,2}x\d{1,2})\b/i;
  const matchSeries = name.match(seriesPattern);
  
  const isSeries = !!matchSeries;
  
  const yearPattern = /\b(19\d{2}|20\d{2})\b/;
  const matchYear = name.match(yearPattern);
  const year = matchYear ? matchYear[1] : null;
  
  let cutIndex = name.length;
  if (matchSeries) {
    cutIndex = Math.min(cutIndex, name.indexOf(matchSeries[0]));
  }
  if (matchYear) {
    cutIndex = Math.min(cutIndex, name.indexOf(matchYear[0]));
  }
  
  const tags = ['1080p', '720p', '2160p', 'bluray', 'hdtv', 'webrip', 'web-dl', 'dvdrip', 'x264', 'h264', 'x265', 'h265', 'hevc', 'aac', 'dd5.1', 'dts', 'german', 'english', 'multi', 'dl', 'dubbed'];
  for (const tag of tags) {
    const tagPattern = new RegExp(`\\b${tag}\\b`, 'i');
    const matchTag = name.match(tagPattern);
    if (matchTag) {
      cutIndex = Math.min(cutIndex, name.indexOf(matchTag[0]));
    }
  }
  
  let title = name.slice(0, cutIndex).trim();
  title = title.replace(/\s+/g, ' ');
  
  return {
    title: title || baseName,
    year,
    isSeries,
    seasonEpisode: matchSeries ? matchSeries[0].toUpperCase() : null
  };
}

function findBestMatch(suggestions, parsedInfo) {
  if (!suggestions || suggestions.length === 0) return null;
  
  for (const s of suggestions) {
    const isTv = s.qid === 'tvSeries' || s.qid === 'tvMiniSeries';
    const isMovie = s.qid === 'movie' || s.qid === 'feature';
    
    const typeMatch = parsedInfo.isSeries ? isTv : isMovie;
    const yearMatch = parsedInfo.year ? (Math.abs(s.y - parseInt(parsedInfo.year)) <= 1) : true;
    
    if (typeMatch && yearMatch) {
      return s;
    }
  }
  
  for (const s of suggestions) {
    const isTv = s.qid === 'tvSeries' || s.qid === 'tvMiniSeries';
    const isMovie = s.qid === 'movie' || s.qid === 'feature';
    
    const typeMatch = parsedInfo.isSeries ? isTv : isMovie;
    if (typeMatch) {
      return s;
    }
  }
  
  if (parsedInfo.year) {
    for (const s of suggestions) {
      if (Math.abs(s.y - parseInt(parsedInfo.year)) <= 1) {
        return s;
      }
    }
  }
  
  for (const s of suggestions) {
    if (['tvSeries', 'tvMiniSeries', 'movie', 'feature'].includes(s.qid)) {
      return s;
    }
  }
  
  return suggestions[0];
}

async function fetchImdbMetadata(parsedInfo) {
  try {
    const query = parsedInfo.title.trim().toLowerCase();
    if (!query) return null;
    const firstChar = query[0];
    const url = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(query)}.json`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });
    
    const suggestions = res.data?.d;
    if (!suggestions || suggestions.length === 0) return null;
    
    const best = findBestMatch(suggestions, parsedInfo);
    if (best) {
      return {
        imdbId: best.id,
        title: best.l,
        type: best.qid === 'tvSeries' || best.qid === 'tvMiniSeries' ? 'series' : 'movie',
        year: best.y,
        yearRange: best.yr || null,
        cast: best.s || null,
        posterUrl: best.i?.imageUrl || null
      };
    }
  } catch (err) {
    console.error(`[IMDb API] Error fetching for "${parsedInfo.title}":`, err.message);
  }
  return null;
}

async function getOrFetchMetadata(filename, ext) {
  if (MUSIC_EXTENSIONS.has(ext)) {
    const targetCategory = ext === '.m4b' ? 'Hörbücher' : 'Musik';
    if (metadataCache[filename] && metadataCache[filename].category === targetCategory && metadataCache[filename].artist) {
      return metadataCache[filename];
    }

    const baseName = path.parse(filename).name;
    const fullPath = getSafeFilePath(filename);

    let title = baseName;
    let artist = 'Unbekannter Künstler';
    let album = 'Unbekanntes Album';
    let genre = ext === '.m4b' ? 'Hörbuch' : 'Musik';
    let year = null;
    let track = null;
    let posterUrl = null;
    let duration = null;
    let chapters = [];

    if (fullPath && fs.existsSync(fullPath)) {
      try {
        console.log(`[Music Parser] Parsing tags for: ${filename}`);
        const parsed = await parseFile(fullPath, { skipCovers: true, includeChapters: true });
        if (parsed && parsed.common) {
          title = parsed.common.title || title;
          artist = parsed.common.artist || artist;
          album = parsed.common.album || album;
          if (parsed.common.genre && parsed.common.genre.length > 0) {
            genre = parsed.common.genre[0];
          }
          year = parsed.common.year || year;
          if (parsed.common.track && parsed.common.track.no !== undefined) {
            track = parsed.common.track.no;
          }
        }
        if (parsed && parsed.format) {
          duration = parsed.format.duration || null;
        }
        if (parsed && parsed.chapters && Array.isArray(parsed.chapters)) {
          chapters = parsed.chapters.map(c => ({
            title: c.title || '',
            startTime: c.startTime || 0
          }));
        }
      } catch (err) {
        console.error(`[Music Parser] Error parsing tags for ${filename}:`, err.message);
      }
    }

    if (artist !== 'Unbekannter Künstler') {
      try {
        const queryTerm = `${artist} ${album !== 'Unbekanntes Album' ? album : title}`;
        console.log(`[Music Web Fetch] Querying iTunes API for: "${queryTerm}"`);
        const itunesRes = await axios.get('https://itunes.apple.com/search', {
          params: {
            term: queryTerm,
            entity: ext === '.m4b' ? 'audiobook' : 'song',
            limit: 1
          },
          timeout: 5000
        });

        if (itunesRes.data && itunesRes.data.results && itunesRes.data.results.length > 0) {
          const result = itunesRes.data.results[0];
          if (result.artworkUrl100) {
            posterUrl = result.artworkUrl100.replace('100x100bb', '600x600bb');
          }
          if (genre === (ext === '.m4b' ? 'Hörbuch' : 'Musik') && result.primaryGenreName) {
            genre = result.primaryGenreName;
          }
          if (album === 'Unbekanntes Album' && result.collectionName) {
            album = result.collectionName;
          }
          if (!year && result.releaseDate) {
            year = new Date(result.releaseDate).getFullYear();
          }
        }
      } catch (err) {
        console.error(`[Music Web Fetch] Failed to fetch details from iTunes for ${artist}:`, err.message);
      }
    }

    const data = {
      title,
      artist,
      album,
      genre,
      year,
      track,
      posterUrl,
      category: targetCategory,
      subcategory: artist,
      duration,
      chapters
    };

    metadataCache[filename] = data;
    saveMetadataCache();
    return data;
  }

  if (metadataCache[filename]) {
    // Migration: If item was not found on IMDb but is not categorized as 'Videos', fix it.
    if (metadataCache[filename].notFound && metadataCache[filename].category !== 'Videos') {
      metadataCache[filename].category = 'Videos';
      saveMetadataCache();
    }
    return metadataCache[filename];
  }
  
  const parsed = parseFilename(filename);
  const data = {
    title: parsed.title,
    year: parsed.year,
    seasonEpisode: parsed.seasonEpisode,
    isSeries: parsed.isSeries,
    category: 'Videos' // default fallback if not found on IMDb
  };
  
  const imdb = await fetchImdbMetadata(parsed);
  if (imdb) {
    data.imdbId = imdb.imdbId;
    data.title = imdb.title;
    data.type = imdb.type;
    data.year = imdb.year;
    data.yearRange = imdb.yearRange;
    data.cast = imdb.cast;
    data.posterUrl = imdb.posterUrl;
    data.category = imdb.type === 'series' ? 'Serien' : 'Filme';
  } else {
    data.notFound = true;
    data.category = 'Videos';
  }
  
  metadataCache[filename] = data;
  saveMetadataCache();
  return data;
}

async function scanDownloadDir() {
  const dir = appConfig.downloadDir;
  try {
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    // Auto-organize files before scanning
    await organizeAllFiles();
    
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

    // Populate metadata sequentially to avoid rate-limiting
    for (const file of mediaFiles) {
      const ext = path.extname(file.filename).toLowerCase();
      try {
        file.metadata = await getOrFetchMetadata(file.filename, ext);
      } catch (err) {
        console.error(`[Metadata] Failed to get metadata for ${file.filename}:`, err);
        file.metadata = {
          title: path.parse(file.filename).name,
          category: ext === '.m4b' ? 'Hörbücher' : (MUSIC_EXTENSIONS.has(ext) ? 'Musik' : 'Videos')
        };
      }
    }

    return mediaFiles;
  } catch (err) {
    console.error('[Media Library] Fehler beim Scannen des Download-Verzeichnisses:', err);
    return [];
  }
}

app.get('/api/media-library', async (req, res) => {
  const category = req.query.category || 'all';
  const subcategory = req.query.subcategory || 'all';
  const search = (req.query.search || '').trim().toLowerCase();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 60;
  const forceScan = req.query.forceScan === 'true';

  // 1. Get raw items (either scanning or using cache)
  if (forceScan || cachedLocalFiles === null) {
    await updateLocalMappedList(forceScan);
  }

  // Trigger background sync if Xtream is enabled and either cache is empty or interval has passed
  if (appConfig.xtreamEnabled) {
    const intervalMs = (appConfig.xtreamSyncIntervalHours || 1) * 60 * 60 * 1000;
    const isExpired = Date.now() - lastXtreamFetch >= intervalMs;
    if (xtreamMovies.length === 0 || isExpired) {
      console.log(`[Xtream] Cache empty or expired (age: ${Math.round((Date.now() - lastXtreamFetch) / 60000)}m). Triggering background fetch.`);
      fetchXtreamData(false).catch(err => console.error('[Xtream] Background sync error:', err.message));
    }
  }

  // 2. Filter raw items by search query
  let filteredRaw = cachedRawItems;
  if (search) {
    filteredRaw = cachedRawItems.filter(item => {
      const filenameMatch = item.filename ? item.filename.toLowerCase().includes(search) : false;
      const titleMatch = (item.metadata?.title || item.title || '').toLowerCase().includes(search);
      const castMatch = (item.metadata?.cast || item.cast || '').toLowerCase().includes(search);
      return filenameMatch || titleMatch || castMatch;
    });
  }

  // 3. Compute category counts based on search-filtered raw items
  const counts = {
    all: filteredRaw.length,
    Lokal: filteredRaw.filter(item => !item.isXtream).length,
    Filme: filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === 'Filme' || origCat === 'Filme';
    }).length,
    Serien: filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === 'Serien' || origCat === 'Serien';
    }).length,
    Videos: filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === 'Videos' || origCat === 'Videos';
    }).length,
    Musik: filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === 'Musik' || origCat === 'Musik';
    }).length,
    'Live TV': filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === 'Live TV' || origCat === 'Live TV';
    }).length,
    'Hörbücher': filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === 'Hörbücher' || origCat === 'Hörbücher';
    }).length,
    Favoriten: filteredRaw.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      const isSeries = cat === 'Serien' || origCat === 'Serien';
      const favKey = isSeries
        ? (item.metadata?.imdbId || item.metadata?.title || item.xtreamSeriesId || item.imdbId || item.title)
        : item.filename;
      const isFav = favorites.has(String(favKey));
      const hasProgress = !item.isGroup && playProgress[item.filename];
      return isFav || hasProgress;
    }).length,
    Neu: 0
  };

  // 4. Group series
  const seriesGroups = {};
  const otherItems = [];

  filteredRaw.forEach(item => {
    const cat = item.metadata?.category || 'Videos';
    const originalCategory = item.metadata?.originalCategory || cat;
    
    if (cat === 'Serien' || originalCategory === 'Serien') {
      if (item.isGroup) {
        const key = item.xtreamSeriesId || item.title;
        seriesGroups[key] = {
          ...item,
          files: item.files || [],
          mtime: item.mtime || 0
        };
        return;
      }
      const seriesKey = item.metadata?.imdbId || item.metadata?.title || 'Unknown Series';
      if (!seriesGroups[seriesKey]) {
        seriesGroups[seriesKey] = {
          isGroup: true,
          title: item.metadata?.title || 'Unbekannte Serie',
          posterUrl: item.metadata?.posterUrl,
          year: item.metadata?.year,
          cast: item.metadata?.cast,
          imdbId: item.metadata?.imdbId,
          category: cat,
          files: [],
          mtime: item.mtime || 0
        };
      }
      seriesGroups[seriesKey].files.push(item);
    } else {
      otherItems.push(item);
    }
  });

  // Sort files within series groups and calculate their group mtime
  Object.values(seriesGroups).forEach(group => {
    let groupMtime = group.mtime || 0;
    if (Array.isArray(group.files) && group.files.length > 0) {
      const fileMtimes = group.files.map(f => f.mtime || 0);
      groupMtime = Math.max(groupMtime, ...fileMtimes);
      
      group.files.sort((a, b) => {
        const epA = a.metadata?.seasonEpisode || '';
        const epB = b.metadata?.seasonEpisode || '';
        if (epA && epB) {
          return epA.localeCompare(epB, undefined, { numeric: true, sensitivity: 'base' });
        }
        return a.filename.localeCompare(b.filename);
      });
    }
    group.mtime = groupMtime || Date.now();
  });

  const sortedSeries = Object.values(seriesGroups);
  const groupedItems = [...sortedSeries, ...otherItems];

  // Calculate Neu category count (within the last 5 days, excluding Live TV & Musik)
  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
  const nonLiveItems = groupedItems.filter(item => {
    const cat = item.metadata?.category || item.category || 'Videos';
    const origCat = item.metadata?.originalCategory || cat;
    return cat !== 'Live TV' && origCat !== 'Live TV' && cat !== 'Musik' && origCat !== 'Musik' && cat !== 'Hörbücher' && origCat !== 'Hörbücher';
  });
  const newItemsLast5Days = nonLiveItems.filter(item => (item.mtime || 0) >= fiveDaysAgo);
  counts.Neu = newItemsLast5Days.length;

  // 5. Filter grouped list by category
  let filteredGrouped = groupedItems;
  if (category === 'Neu') {
    filteredGrouped = nonLiveItems.filter(item => (item.mtime || 0) >= fiveDaysAgo);
  } else if (category === 'Favoriten') {
    filteredGrouped = groupedItems.filter(item => {
      const isFav = favorites.has(String(item.isGroup
        ? (item.xtreamSeriesId || item.imdbId || item.title || item.metadata?.imdbId || item.metadata?.title)
        : item.filename));
      const isWatchingSeries = item.isGroup && item.files.some(ep => playProgress[ep.filename]);
      return isFav || isWatchingSeries;
    });
  } else if (category !== 'all') {
    filteredGrouped = groupedItems.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat === category || origCat === category;
    });
  }

  // Sort by mtime descending (newest first) for all except Live TV, Musik, Hörbücher
  if (category === 'Live TV') {
    filteredGrouped.sort((a, b) => {
      const titleA = a.metadata?.title || a.title || '';
      const titleB = b.metadata?.title || b.title || '';
      return titleA.localeCompare(titleB);
    });
  } else if (category !== 'Musik' && category !== 'Hörbücher') {
    filteredGrouped.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
  }

  // Musik / Hörbücher sorting
  if (category === 'Musik' || category === 'Hörbücher') {
    filteredGrouped.sort((a, b) => {
      const isRadioA = a.metadata?.subcategory === 'Internet-Radio';
      const isRadioB = b.metadata?.subcategory === 'Internet-Radio';
      if (isRadioA && !isRadioB) return 1;
      if (!isRadioA && isRadioB) return -1;
      
      const artistA = (a.metadata?.artist || '').toLowerCase();
      const artistB = (b.metadata?.artist || '').toLowerCase();
      if (artistA !== artistB) return artistA.localeCompare(artistB);
      
      const albumA = (a.metadata?.album || '').toLowerCase();
      const albumB = (b.metadata?.album || '').toLowerCase();
      if (albumA !== albumB) return albumA.localeCompare(albumB);
      
      const trackA = a.metadata?.track || 0;
      const trackB = b.metadata?.track || 0;
      if (trackA !== trackB) return trackA - trackB;
      
      const titleA = (a.metadata?.title || '').toLowerCase();
      const titleB = (b.metadata?.title || '').toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }

  // 6. Subcategories filter
  const subcats = new Set();
  filteredGrouped.forEach(item => {
    const sub = item.metadata?.subcategory || item.subcategory;
    if (sub) {
      subcats.add(sub);
    }
  });
  const availableSubcategories = ['all', ...Array.from(subcats).sort()];

  if (subcategory !== 'all') {
    filteredGrouped = filteredGrouped.filter(item => {
      const subcat = item.metadata?.subcategory || item.subcategory || '';
      return subcat === subcategory;
    });
  }

  // 7. Paginate results
  const totalItems = filteredGrouped.length;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * limit;
  const endIndex = currentPage * limit;

  const paginatedItems = filteredGrouped.slice(startIndex, endIndex);

  // 8. Inject dynamic progress and favorites onto the PAGINATED items ONLY
  const finalItems = paginatedItems.map(item => {
    const cloned = { ...item };
    
    // Inject progress
    if (!cloned.isGroup) {
      if (playProgress[cloned.filename]) {
        cloned.progress = playProgress[cloned.filename];
      }
    } else {
      // For series group, populate playProgress for its files
      cloned.files = cloned.files.map(ep => {
        const epCloned = { ...ep };
        if (playProgress[epCloned.filename]) {
          epCloned.progress = playProgress[epCloned.filename];
        }
        return epCloned;
      });
    }

    // Inject favorite
    cloned.favorite = isItemFavorite(cloned);
    return cloned;
  });

  return res.json({
    items: finalItems,
    totalItems,
    totalPages,
    currentPage,
    counts,
    availableSubcategories
  });
});

app.get('/api/xtream/series-episodes', async (req, res) => {
  const { seriesId } = req.query;
  if (!seriesId) return res.status(400).json({ error: 'Parameter seriesId fehlt' });
  
  if (!appConfig.xtreamEnabled || !appConfig.xtreamHost || !appConfig.xtreamUsername || !appConfig.xtreamPassword) {
    return res.status(400).json({ error: 'Xtream Codes ist nicht aktiviert oder konfiguriert.' });
  }
  
  try {
    const host = appConfig.xtreamHost.replace(/\/$/, '');
    const resEpisodes = await axios.get(`${host}/player_api.php`, {
      params: {
        username: appConfig.xtreamUsername,
        password: appConfig.xtreamPassword,
        action: 'get_series_info',
        series_id: seriesId
      },
      timeout: 10000
    });
    
    const data = resEpisodes.data;
    if (!data || !data.episodes) {
      return res.json([]);
    }
    
    const mappedEpisodes = [];
    for (const seasonNum of Object.keys(data.episodes)) {
      const seasonEps = data.episodes[seasonNum];
      if (Array.isArray(seasonEps)) {
        for (const ep of seasonEps) {
          const ext = ep.container_extension || 'mp4';
          const streamUrl = `${host}/series/${appConfig.xtreamUsername}/${appConfig.xtreamPassword}/${ep.id}.${ext}`;
          
          mappedEpisodes.push({
            filename: streamUrl,
            sizeBytes: 0,
            mtime: Date.now(),
            isXtream: true,
            xtreamStreamId: ep.id,
            metadata: {
              title: ep.title || `Folge ${ep.episode_num}`,
              category: 'Serien',
              seasonEpisode: `S${String(seasonNum).padStart(2, '0')}E${String(ep.episode_num || ep.episode).padStart(2, '0')}`,
              cast: ep.info || 'Xtream Codes Episode'
            }
          });
        }
      }
    }
    
    return res.json(mappedEpisodes);
  } catch (err) {
    console.error(`[Xtream] Error loading episodes for series ${seriesId}:`, err.message);
    return res.status(500).json({ error: `Konnte Serien-Episoden nicht laden: ${err.message}` });
  }
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

app.post('/api/media/progress', (req, res) => {
  const { filename, position } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }
  playProgress[filename] = {
    position: parseFloat(position) || 0,
    updatedAt: Date.now()
  };
  savePlayProgress();
  return res.json({ success: true, progress: playProgress[filename] });
});

app.post('/api/favorites/toggle', (req, res) => {
  const { id, isFavorite } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing parameter id' });
  }
  if (isFavorite) {
    favorites.add(String(id));
  } else {
    favorites.delete(String(id));
  }
  saveFavorites();
  return res.json({ success: true, isFavorite: favorites.has(String(id)) });
});

app.post('/api/media-library/play-local', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Parameter filename fehlt' });
  
  const isUrl = filename.startsWith('http://') || filename.startsWith('https://');
  const filePath = isUrl ? filename : getSafeFilePath(filename);
  
  if (!isUrl && (!filePath || !fs.existsSync(filePath))) {
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

app.post('/api/media-library/cast/play', async (req, res) => {
  const { filename, deviceName } = req.body;
  if (!filename || !deviceName) {
    return res.status(400).json({ error: 'Parameter filename und deviceName fehlen' });
  }

  const isUrl = filename.startsWith('http://') || filename.startsWith('https://');
  const filePath = isUrl ? filename : getSafeFilePath(filename);
  
  if (!isUrl && (!filePath || !fs.existsSync(filePath))) {
    return res.status(404).json({ error: 'Datei existiert nicht auf dem Datenträger' });
  }

  let device = discoveredChromecasts.get(deviceName);
  let isDlna = false;
  let isAirplay = false;
  if (!device) {
    device = discoveredDlnas.get(deviceName);
    if (device) {
      isDlna = true;
    } else {
      device = discoveredAirplays.get(deviceName);
      if (device) {
        isAirplay = true;
      } else {
        return res.status(404).json({ error: `Gerät "${deviceName}" nicht im Netzwerk gefunden.` });
      }
    }
  }

  // Always route through local server endpoint (especially for URLs to handle transcoding and CORS)
  const mediaUrl = `http://${getLocalIp()}:${PORT}/api/media/${encodeURIComponent(filename)}`;

  console.log(`[Cast] Casting Library file "${filename}" to "${deviceName}" via ${mediaUrl} (isDlna: ${isDlna}, isAirplay: ${isAirplay})`);

  // Determine mime type
  let contentType = 'video/mp4';
  const ext = path.extname(filename.split('?')[0]).toLowerCase();
  if (ext === '.mkv') {
    const needsTranscode = await checkAudioTranscodeNeeded(filePath);
    contentType = needsTranscode ? 'video/mp4' : 'video/x-matroska';
  }
  else if (ext === '.avi') contentType = 'video/mp4'; // transcoded on the fly!
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';

  let responded = false;
  if (isDlna) {
    const performPlay = () => {
      device.play(mediaUrl, {
        title: filename,
        type: contentType,
        autoPlay: false
      }, (err) => {
        if (responded) return;
        if (err) {
          responded = true;
          console.error(`[DLNA] Fehler beim Laden der Library-Datei auf ${deviceName}:`, err);
          return res.status(500).json({ error: `Streaming-Fehler: ${err.message}` });
        }

        setTimeout(() => {
          device.resume((resumeErr) => {
            if (resumeErr) {
              console.error(`[DLNA] Fehler beim Starten (Resume) auf ${deviceName}:`, resumeErr);
            }
          });
        }, 1500);

        responded = true;
        activeCasts.set(deviceName, {
          downloadId: null,
          filename: filename,
          deviceType: 'dlna',
          playerState: 'PLAYING',
          currentTime: 0,
          duration: 0,
          volume: 1,
          muted: false
        });
        attachDlnaDeviceStatusListeners(device, deviceName);
        broadcastActiveCasts();
        return res.json({ success: true, deviceName, filename: filename });
      });
    };

    if (device.client) {
      // Stop first to reset transport state machine, then play with autoPlay: false to set URI, then trigger play after a delay
      device.stop(() => {
        setTimeout(performPlay, 1000);
      });
    } else {
      performPlay();
    }
  } else if (isAirplay) {
    device.play(mediaUrl, (err) => {
      if (responded) return;
      responded = true;
      if (err) {
        console.error(`[AirPlay] Fehler beim Laden der Library-Datei auf ${deviceName}:`, err);
        return res.status(500).json({ error: `Streaming-Fehler: ${err.message}` });
      }
      activeCasts.set(deviceName, {
        downloadId: null,
        filename: filename,
        deviceType: 'airplay',
        playerState: 'PLAYING',
        currentTime: 0,
        duration: 0,
        volume: 1,
        muted: false
      });
      attachAirplayDeviceStatusListeners(device, deviceName);
      broadcastActiveCasts();
      return res.json({ success: true, deviceName, filename: filename });
    });
  } else {
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
        deviceType: 'chromecast',
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
  }
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
  if (dlnaBrowser) {
    try {
      dlnaBrowser.update();
    } catch (e) {
      console.error('[DLNA] Fehler beim Aktualisieren des Browsers:', e);
    }
  }
  if (airplayBrowser) {
    try {
      airplayBrowser.update();
    } catch (e) {
      console.error('[AirPlay] Fehler beim Aktualisieren des Browsers:', e);
    }
  }
  const chromecasts = Array.from(discoveredChromecasts.values()).map(d => ({
    name: d.friendlyName,
    host: d.host,
    type: 'chromecast'
  }));
  const dlnas = Array.from(discoveredDlnas.values()).map(d => ({
    name: d.name,
    host: d.host || 'DLNA',
    type: 'dlna'
  }));
  const airplays = Array.from(discoveredAirplays.values()).map(d => ({
    name: d.name,
    host: d.host || 'AirPlay',
    type: 'airplay'
  }));
  return res.json([...chromecasts, ...dlnas, ...airplays]);
});

// Helper to get local network IP address (ipv4, non-loopback)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignore loopback and Tailscale's 100.x.y.z subnet
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('100.')) {
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

// Helper to parse HH:MM:SS or MM:SS to seconds
function parseTimeStringToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  if (/^\d+(\.\d+)?$/.test(timeStr)) {
    return parseFloat(timeStr);
  }
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  return 0;
}

// DLNA Device Status Listeners
function attachDlnaDeviceStatusListeners(device, deviceName) {
  device.removeAllListeners('status');
  device.on('status', (status) => {
    console.log(`[DLNA] Status update on ${deviceName}:`, status?.transportState);
    if (status) {
      const castInfo = activeCasts.get(deviceName);
      if (castInfo) {
        let playerState = 'PLAYING';
        if (status.transportState === 'PAUSED_PLAYBACK') {
          playerState = 'PAUSED';
        } else if (status.transportState === 'STOPPED') {
          playerState = 'IDLE';
        }

        castInfo.playerState = playerState;
        if (status.relTime) {
          castInfo.currentTime = parseTimeStringToSeconds(status.relTime);
        }
        if (status.trackDuration) {
          castInfo.duration = parseTimeStringToSeconds(status.trackDuration);
        }
        if (status.volume !== undefined) {
          castInfo.volume = status.volume / 100;
        }

        activeCasts.set(deviceName, castInfo);
        broadcastActiveCasts();

        if (playerState === 'IDLE') {
          console.log(`[DLNA] Playback STOPPED on ${deviceName}. Clearing active cast.`);
          activeCasts.delete(deviceName);
          broadcastActiveCasts();
        }
      }
    }
  });
}

// AirPlay Device Status Listeners
function attachAirplayDeviceStatusListeners(device, deviceName) {
  device.removeAllListeners('event');
  device.on('event', (event) => {
    console.log(`[AirPlay] Status update on ${deviceName}:`, event);
    if (event) {
      const castInfo = activeCasts.get(deviceName);
      if (castInfo) {
        if (event.state === 'playing') {
          castInfo.playerState = 'PLAYING';
        } else if (event.state === 'paused') {
          castInfo.playerState = 'PAUSED';
        } else if (event.state === 'stopped') {
          console.log(`[AirPlay] Playback STOPPED on ${deviceName}. Clearing active cast.`);
          activeCasts.delete(deviceName);
          broadcastActiveCasts();
          return;
        }
        activeCasts.set(deviceName, castInfo);
        broadcastActiveCasts();
      }
    }
  });
}

// Periodic status check (every 8 seconds) to verify active casts are still playing
setInterval(() => {
  if (activeCasts.size === 0) return;
  
  for (const [deviceName, castInfo] of activeCasts.entries()) {
    const device = discoveredChromecasts.get(deviceName);
    if (!device) {
      // Check if it's a DLNA device
      const dlnaDevice = discoveredDlnas.get(deviceName);
      if (dlnaDevice) {
        dlnaDevice.status((err, status) => {
          if (err) {
            console.log(`[DLNA Check] Failed to get status for "${deviceName}": ${err.message}. Clearing active cast.`);
            activeCasts.delete(deviceName);
            broadcastActiveCasts();
            return;
          }
          
          if (status) {
            const currentCast = activeCasts.get(deviceName);
            if (currentCast) {
              let playerState = 'PLAYING';
              if (status.transportState === 'PAUSED_PLAYBACK') {
                playerState = 'PAUSED';
              } else if (status.transportState === 'STOPPED') {
                playerState = 'IDLE';
              }
              
              currentCast.playerState = playerState;
              if (status.relTime) {
                currentCast.currentTime = parseTimeStringToSeconds(status.relTime);
              }
              if (status.trackDuration) {
                currentCast.duration = parseTimeStringToSeconds(status.trackDuration);
              }
              if (status.volume !== undefined) {
                currentCast.volume = status.volume / 100;
              }
              
              if (playerState === 'IDLE') {
                activeCasts.delete(deviceName);
              } else {
                activeCasts.set(deviceName, currentCast);
              }
              broadcastActiveCasts();
            }
          }
        });
        continue;
      }

      // Check if it's an AirPlay device
      const airplayDevice = discoveredAirplays.get(deviceName);
      if (airplayDevice) {
        airplayDevice.playbackInfo((err, resObj, body) => {
          if (err) {
            console.log(`[AirPlay Check] Failed to get status for "${deviceName}": ${err.message}. Clearing active cast.`);
            activeCasts.delete(deviceName);
            broadcastActiveCasts();
            return;
          }
          if (body) {
            const currentCast = activeCasts.get(deviceName);
            if (currentCast) {
              if (body.rate !== undefined) {
                currentCast.playerState = body.rate === 0 ? 'PAUSED' : 'PLAYING';
              }
              if (body.duration !== undefined) {
                currentCast.duration = body.duration;
              }
              if (body.position !== undefined) {
                currentCast.currentTime = body.position;
              }
              activeCasts.set(deviceName, currentCast);
              broadcastActiveCasts();
            }
          } else {
            console.log(`[AirPlay Check] No status body for "${deviceName}". Clearing active cast.`);
            activeCasts.delete(deviceName);
            broadcastActiveCasts();
          }
        });
        continue;
      }

      console.log(`[Cast Check] Active device "${deviceName}" is no longer in discovered list. Clearing.`);
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

app.post('/api/chromecast/play', async (req, res) => {
  const { downloadId, deviceName } = req.body;
  if (!downloadId || !deviceName) {
    return res.status(400).json({ error: 'Parameter downloadId und deviceName fehlen' });
  }

  const item = downloadQueue.get(downloadId);
  if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
  if (item.downloader.status !== 'completed') {
    return res.status(400).json({ error: 'Download ist noch nicht abgeschlossen' });
  }

  let device = discoveredChromecasts.get(deviceName);
  let isDlna = false;
  let isAirplay = false;
  if (!device) {
    device = discoveredDlnas.get(deviceName);
    if (device) {
      isDlna = true;
    } else {
      device = discoveredAirplays.get(deviceName);
      if (device) {
        isAirplay = true;
      } else {
        return res.status(404).json({ error: `Gerät "${deviceName}" nicht im Netzwerk gefunden. Bitte Suche aktualisieren.` });
      }
    }
  }

  const filename = item.downloader.filename;
  const localIp = getLocalIp();
  const mediaUrl = `http://${localIp}:${PORT}/api/media/${encodeURIComponent(filename)}`;

  console.log(`[Cast] Casting "${filename}" to "${deviceName}" via ${mediaUrl} (isDlna: ${isDlna}, isAirplay: ${isAirplay})`);

  // Determine mime type
  let contentType = 'video/mp4';
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mkv') {
    const needsTranscode = await checkAudioTranscodeNeeded(item.downloader.filePath);
    contentType = needsTranscode ? 'video/mp4' : 'video/x-matroska';
  }
  else if (ext === '.avi') contentType = 'video/mp4'; // transcoded on the fly!
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';

  let responded = false;
  if (isDlna) {
    const performPlay = () => {
      device.play(mediaUrl, {
        title: filename,
        type: contentType,
        autoPlay: false
      }, (err) => {
        if (responded) return;
        if (err) {
          responded = true;
          console.error(`[DLNA] Fehler beim Laden auf ${deviceName}:`, err);
          return res.status(500).json({ error: `Streaming-Fehler: ${err.message}` });
        }

        setTimeout(() => {
          device.resume((resumeErr) => {
            if (resumeErr) {
              console.error(`[DLNA] Fehler beim Starten (Resume) auf ${deviceName}:`, resumeErr);
            }
          });
        }, 1500);

        responded = true;
        activeCasts.set(deviceName, {
          downloadId,
          filename,
          deviceType: 'dlna',
          playerState: 'PLAYING',
          currentTime: 0,
          duration: 0,
          volume: 1,
          muted: false
        });
        attachDlnaDeviceStatusListeners(device, deviceName);
        broadcastActiveCasts();
        return res.json({ success: true, deviceName, filename });
      });
    };

    if (device.client) {
      // Stop first to reset transport state machine, then play with autoPlay: false to set URI, then trigger play after a delay
      device.stop(() => {
        setTimeout(performPlay, 1000);
      });
    } else {
      performPlay();
    }
  } else if (isAirplay) {
    device.play(mediaUrl, (err) => {
      if (responded) return;
      responded = true;
      if (err) {
        console.error(`[AirPlay] Fehler beim Abspielen auf ${deviceName}:`, err);
        return res.status(500).json({ error: `Streaming-Fehler: ${err.message}` });
      }
      activeCasts.set(deviceName, {
        downloadId,
        filename,
        deviceType: 'airplay',
        playerState: 'PLAYING',
        currentTime: 0,
        duration: 0,
        volume: 1,
        muted: false
      });
      attachAirplayDeviceStatusListeners(device, deviceName);
      broadcastActiveCasts();
      return res.json({ success: true, deviceName, filename });
    });
  } else {
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
        deviceType: 'chromecast',
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
  }
});

app.post('/api/chromecast/stop', (req, res) => {
  const { deviceName } = req.body;
  if (!deviceName) {
    return res.status(400).json({ error: 'Parameter deviceName fehlt' });
  }

  // Always delete and broadcast first to ensure UI resets immediately
  activeCasts.delete(deviceName);
  broadcastActiveCasts();

  const device = discoveredChromecasts.get(deviceName);
  if (device && typeof device.stop === 'function') {
    device.stop((err) => {
      if (err) {
        console.error(`[Chromecast] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
      }
    });
  } else {
    const dlnaDevice = discoveredDlnas.get(deviceName);
    if (dlnaDevice && dlnaDevice.client && typeof dlnaDevice.stop === 'function') {
      dlnaDevice.stop((err) => {
        if (err) {
          console.error(`[DLNA] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
        }
      });
    } else {
      const airplayDevice = discoveredAirplays.get(deviceName);
      if (airplayDevice && typeof airplayDevice.stop === 'function') {
        airplayDevice.stop((err) => {
          if (err) {
            console.error(`[AirPlay] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
          }
        });
      } else {
        console.log(`[Cast] Gerät "${deviceName}" für Stop nicht in Entdeckungsliste oder nicht aktiv.`);
      }
    }
  }

  return res.json({ success: true });
});

app.post('/api/chromecast/control', (req, res) => {
  const { deviceName, action, value } = req.body;
  if (!deviceName || !action) {
    return res.status(400).json({ error: 'Parameter deviceName und action fehlen' });
  }

  let device = discoveredChromecasts.get(deviceName);
  let isDlna = false;
  let isAirplay = false;
  if (!device) {
    device = discoveredDlnas.get(deviceName);
    if (device) {
      isDlna = true;
    } else {
      device = discoveredAirplays.get(deviceName);
      if (device) {
        isAirplay = true;
      } else {
        return res.status(404).json({ error: 'Gerät nicht gefunden' });
      }
    }
  }

  if (isAirplay) {
    const callback = (err) => {
      if (err) {
        console.error(`[AirPlay Control] Fehler bei Action ${action} auf ${deviceName}:`, err);
        return res.status(500).json({ error: `Steuerung fehlgeschlagen: ${err.message}` });
      }
      
      // Fetch status immediately
      device.playbackInfo((statusErr, resObj, body) => {
        if (!statusErr && body) {
          const castInfo = activeCasts.get(deviceName);
          if (castInfo) {
            if (body.rate !== undefined) {
              castInfo.playerState = body.rate === 0 ? 'PAUSED' : 'PLAYING';
            }
            if (body.duration !== undefined) {
              castInfo.duration = body.duration;
            }
            if (body.position !== undefined) {
              castInfo.currentTime = body.position;
            }
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
        device.resume(callback);
        break;
      case 'seek':
        device.scrub(parseFloat(value), callback);
        break;
      case 'volume':
        // volume control is not directly supported by this AirPlay library, return success
        return res.json({ success: true });
      default:
        return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });
    }
    return;
  }

  if (isDlna) {
    if (!device.client) {
      return res.status(400).json({ error: 'Wiedergabe ist nicht aktiv.' });
    }
    const callback = (err) => {
      if (err) {
        console.error(`[DLNA Control] Fehler bei Action ${action} auf ${deviceName}:`, err);
        return res.status(500).json({ error: `Steuerung fehlgeschlagen: ${err.message}` });
      }
      
      // Poll status immediately
      device.status((statusErr, status) => {
        if (!statusErr && status) {
          const castInfo = activeCasts.get(deviceName);
          if (castInfo) {
            let playerState = 'PLAYING';
            if (status.transportState === 'PAUSED_PLAYBACK') {
              playerState = 'PAUSED';
            } else if (status.transportState === 'STOPPED') {
              playerState = 'IDLE';
            }
            castInfo.playerState = playerState;
            if (status.relTime) {
              castInfo.currentTime = parseTimeStringToSeconds(status.relTime);
            }
            if (status.trackDuration) {
              castInfo.duration = parseTimeStringToSeconds(status.trackDuration);
            }
            if (status.volume !== undefined) {
              castInfo.volume = status.volume / 100;
            }
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
        device.volume(Math.round(parseFloat(value) * 100), callback);
        break;
      default:
        return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });
    }
    return;
  }

  // Chromecast control
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

function isImageFile(urlOrPath) {
  try {
    const urlObj = new URL(urlOrPath);
    const pathname = urlObj.pathname.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].some(ext => pathname.endsWith(ext));
  } catch (e) {
    const ext = path.extname(urlOrPath.split('?')[0]).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext);
  }
}

function getImageCacheDir() {
  const cacheDir = path.join(appConfig.downloadDir, '.image_cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

function getImageCachePath(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  let ext = '.jpg';
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const foundExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].find(e => pathname.endsWith(e));
    if (foundExt) {
      ext = foundExt;
    }
  } catch (e) {
    // ignore
  }
  return path.join(getImageCacheDir(), `${hash}${ext}`);
}

// Serving local media files with HTTP Range Requests for streaming and seeking support
app.get('/api/media/*', async (req, res) => {
  const filename = req.params[0];
  const isUrl = filename.startsWith('http://') || filename.startsWith('https://');

  let filePath;
  if (isUrl) {
    filePath = filename;
  } else {
    filePath = getSafeFilePath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('Datei nicht gefunden');
    }
  }

  // Intercept and cache image URLs
  if (isUrl && isImageFile(filePath)) {
    const cachePath = getImageCachePath(filePath);
    if (fs.existsSync(cachePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      const extName = path.extname(cachePath).toLowerCase();
      let contentType = 'image/jpeg';
      if (extName === '.png') contentType = 'image/png';
      else if (extName === '.gif') contentType = 'image/gif';
      else if (extName === '.webp') contentType = 'image/webp';
      else if (extName === '.svg') contentType = 'image/svg+xml';
      res.setHeader('Content-Type', contentType);
      
      fs.createReadStream(cachePath).pipe(res);
      return;
    }

    try {
      console.log(`[Image Cache] Cache miss, downloading image: ${filePath}`);
      const response = await axios({
        method: 'get',
        url: filePath,
        responseType: 'arraybuffer',
        timeout: 15000
      });

      const buffer = Buffer.from(response.data);
      // Save cache asynchronously
      fs.promises.writeFile(cachePath, buffer).catch(err => {
        console.error(`[Image Cache] Failed to write cache file: ${cachePath}`, err.message);
      });

      const contentType = response.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
      return;
    } catch (err) {
      console.error('[Image Cache] Error downloading image:', filePath, err.message);
      if (!res.headersSent) {
        return res.status(404).send('Bild konnte nicht geladen werden');
      }
      return;
    }
  }

  const ext = path.extname(filePath.split('?')[0]).toLowerCase();
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

  if (ext === '.mkv') {
    const needsTranscode = await checkAudioTranscodeNeeded(filePath);
    if (needsTranscode) {
      console.log(`[Playback] Audio-Transcodierung läuft (on-the-fly) für MKV-Datei: ${filePath}`);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Transfer-Encoding': 'chunked'
      });
      
      const ffmpeg = spawn('ffmpeg', [
        '-i', filePath,
        '-vcodec', 'copy',
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
          res.status(500).send('Fehler bei der Audio-Transkodierung');
        }
      });
      return;
    }
  }
  const isTs = ext === '.ts' || filePath.includes('/live/');
  if (isTs) {
    console.log(`[Playback] Remuxing TS stream on-the-fly to MP4 for: ${filePath}`);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked'
    });
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-c:v', 'copy',
      '-c:a', 'aac',
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
      console.error(`[Playback] ffmpeg-Fehler beim Remuxen des TS-Streams für ${filePath}:`, err);
    });
    return;
  }

  if (isUrl) {
    const headers = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }
    if (req.headers['user-agent']) {
      headers['User-Agent'] = req.headers['user-agent'];
    }

    try {
      const response = await axios({
        method: 'get',
        url: filePath,
        headers: headers,
        responseType: 'stream',
        timeout: 30000
      });

      res.status(response.status);

      const headersToForward = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges'
      ];
      for (const h of headersToForward) {
        if (response.headers[h]) {
          res.setHeader(h, response.headers[h]);
        }
      }

      response.data.pipe(res);

      req.on('close', () => {
        response.data.destroy();
      });
      return;
    } catch (err) {
      console.error('[Media Proxy] Fehler beim Proxying der URL:', filePath, err.message);
      if (!res.headersSent) {
        return res.status(500).send(`Fehler beim Laden des Remote-Streams: ${err.message}`);
      }
    }
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'video/mp4';
  if (ext === '.mkv') contentType = 'video/x-matroska';
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';
  else if (ext === '.m4a' || ext === '.m4b') contentType = 'audio/mp4';

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

  // Send current auto-downloads on connection
  ws.send(JSON.stringify({ type: 'auto-downloads', data: autoDownloads }));

  ws.on('close', () => {
    console.log('WS Client disconnected.');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started at http://localhost:${PORT}`);

  // Load auto-downloads from disk
  loadAutoDownloads();

  // Load play progress from disk
  loadPlayProgress();

  // Load favorites from disk
  loadFavorites();

  // Initialize cached local mapped list
  updateLocalMappedList().catch(err => console.error('[Startup] Local scan cache error:', err));

  // Setup interval check from configuration
  recreateCheckInterval();

  // Setup Xtream sync interval
  recreateXtreamSyncInterval();

  // Start background timeout checker for auto-downloads
  setInterval(checkDownloadsTimeout, 30 * 1000);

  // Trigger initial check after 5 seconds
  setTimeout(checkAllAutoDownloads, 5000);
});
