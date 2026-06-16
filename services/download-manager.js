import { appState, broadcastToClients } from '../state.js';
import { getLocalIp } from './network.js';
import { getSafeFilePath, deleteMediaFileAndCleanDirs } from './media-library.js';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import crypto from 'crypto';
import { IrcDccDownloader } from '../irc-dcc-client.js';
import { HttpDownloader } from '../http-downloader.js';
import { organizeAllFiles } from './media-library.js';

const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.mp3', '.wav', '.m4a', '.mov', '.flac', '.mpeg', '.mpg', '.webm', '.ogg', '.ts', '.m4b'
]);

export function getDownloadDetails(id) {
  const item = appState.downloadQueue.get(id);
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

export function broadcastStatus(id) {
  const details = getDownloadDetails(id);
  if (!details) return;
  const message = JSON.stringify({ type: 'progress', data: details });
  appState.wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

export function broadcastDeletion(id) {
  const message = JSON.stringify({ type: 'delete', data: { id } });
  appState.wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

export async function findAndExtractRarFiles(dir, sendLog) {
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
          let isCurrentlyDownloading = false;
          for (const item of appState.downloadQueue.values()) {
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
      return partNum === 1;
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

export async function flattenAndCleanupMedia(downloadDir) {
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

export async function detectExtractedMedia(downloadDir, originalFilename, filesBefore) {
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
        } catch (e) { console.error('Error stating media file:', e?.message); }
      }
    }

    newMediaFiles.sort((a, b) => b.size - a.size);

    if (newMediaFiles.length > 0) {
      return newMediaFiles[0].filename;
    }

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
          } catch (e) { console.error('Error stating media file:', e?.message); }
        }
      }
    }

    matchingMedia.sort((a, b) => b.size - a.size);
    if (matchingMedia.length > 0) {
      return matchingMedia[0].filename;
    }

    const allMedia = [];
    for (const file of filesAfter) {
      const ext = path.extname(file).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext)) {
        try {
          const stat = await fs.promises.stat(path.join(downloadDir, file));
          allMedia.push({ filename: file, mtime: stat.mtimeMs });
        } catch (e) { console.error('Error stating media file:', e?.message); }
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

export async function handleDownloadPostProcessing(id, downloader) {
  const filePath = downloader.filePath;
  const downloadDir = downloader.downloadDir;
  const lowerFile = downloader.filename.toLowerCase();

  const isArchive = lowerFile.endsWith('.tar') ||
                    lowerFile.endsWith('.tar.gz') ||
                    lowerFile.endsWith('.tgz') ||
                    lowerFile.endsWith('.rar');

  if (isArchive) {
    appState.downloadQueue.set(id, { downloader, statusOverride: 'extracting' });
    broadcastStatus(id);
  }

  const sendLog = (text) => {
    appState.wss.clients.forEach((client) => {
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

    await findAndExtractRarFiles(downloadDir, sendLog);

    sendLog(`Bereinige Verzeichnisstruktur...`);
    await flattenAndCleanupMedia(downloadDir);
    sendLog(`Dateien erfolgreich verarbeitet.`);

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
      } catch (e) { console.error('Error stating media file:', e?.message); }

      sendLog(`Zugeordnetes File geändert auf: ${detected}`);
      console.log(`[PostProcessing] Updated downloader ${id} filename from ${oldFilename} to ${detected}`);
    } else {
      sendLog(`Keine passende Mediendatei gefunden. Dateiname bleibt: ${downloader.filename}`);
    }

    await organizeAllFiles();

  } catch (err) {
    console.error(`[PostProcessing] Fehler:`, err);
    sendLog(`Fehler bei der Nachverarbeitung: ${err.message}`);
  } finally {
    appState.downloadQueue.set(id, { downloader, statusOverride: null });
    appState.cachedLocalFiles = null;
    broadcastStatus(id);
  }
}