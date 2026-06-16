import { appState, broadcastToClients } from '../state.js';
import { getLocalIp, getNetworkDetails } from '../services/network.js';
import { searchMoviegodsIRC, searchXdccEu, runStartupTests } from '../services/search-service.js';
import { fetchXtreamData, updateMappedXtreamData, recreateXtreamSyncInterval, loadXtreamCache } from '../services/xtream-client.js';
import { getDownloadDetails, broadcastStatus, broadcastDeletion, handleDownloadPostProcessing } from '../services/download-manager.js';
import { decodeBase64Safe, loadRecordings, saveRecordings, startVcrRecording, stopVcrRecordingJob, checkVcrRecordings, broadcastVcrStatus } from '../services/vcr.js';
import { getLocalFiles, updateLocalMappedList, getSafeFilePath, scanDownloadDir, getOrFetchMetadata, loadFavorites, saveFavorites, isItemFavorite, deleteMediaFileAndCleanDirs, loadMetadataCache, saveMetadataCache, checkAudioTranscodeNeeded, loadPlayProgress, savePlayProgress, organizeAllFiles, fetchImdbMetadata, parseFilename, findBestMatch, isImageFile, getImageCachePath, MEDIA_EXTENSIONS, MUSIC_EXTENSIONS } from '../services/media-library.js';
import { loadAutoDownloads, saveAutoDownloads, broadcastAutoDownloads, checkAllAutoDownloads, checkDownloadsTimeout, recreateCheckInterval, checkSingleShow } from '../services/auto-download.js';
import { updateAllDiscovery } from '../services/discovery.js';
import { saveConfig } from '../services/config.js';
import { parseSizeToBytes, parseTimeStringToSeconds } from '../services/file-utils.js';
import { IrcDccDownloader } from '../irc-dcc-client.js';
import { HttpDownloader } from '../http-downloader.js';
import { configureSambaShare } from '../services/samba.js';
import { attachDeviceStatusListeners, attachDlnaDeviceStatusListeners, attachAirplayDeviceStatusListeners, broadcastActiveCasts, getActiveCasts, playLocalFile, startCasting, stopCasting } from '../services/cast-service.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import crypto from 'crypto';
import { execFile, spawn } from 'child_process';

const LOG_FILE = path.join(os.homedir(), '.xdcc_downloader_logs.txt');
const PLAY_PROGRESS_FILE = path.join(os.homedir(), '.xdcc_play_progress.json');
const FAVORITES_FILE = path.join(os.homedir(), '.xdcc_favorites.json');
const PORT = process.env.PORT || 3000;

function getMetadataCachePath() {
  return path.join(appState.appConfig.downloadDir, '.metadata_cache.json');
}

function saveLocalPlayProgress() {
  try {
    fs.writeFileSync(PLAY_PROGRESS_FILE, JSON.stringify(appState.playProgress, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save play progress:', err.message);
  }
}

function saveLocalFavorites() {
  try {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(Array.from(appState.favorites), null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save favorites:', err.message);
  }
}

function saveLocalMetadataCache() {
  const cachePath = getMetadataCachePath();
  try {
    if (!fs.existsSync(appState.appConfig.downloadDir)) {
      fs.mkdirSync(appState.appConfig.downloadDir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(appState.metadataCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving metadata cache:', e);
  }
}

export function registerAllRoutes(app) {
  if (!appState.playProgress) appState.playProgress = {};
  if (!appState.metadataCache) appState.metadataCache = {};
  if (!(appState.favorites instanceof Set)) {
    appState.favorites = new Set(Array.isArray(appState.favorites) ? appState.favorites : []);
  }

  app.get('/api/epg/:streamId', async (req, res) => {
    if (!appState.appConfig.xtreamEnabled || !appState.appConfig.xtreamHost) {
      return res.status(400).json({ error: 'Xtream ist nicht aktiviert' });
    }
    const { streamId } = req.params;
    const host = appState.appConfig.xtreamHost.replace(/\/$/, '');
    try {
      const response = await axios.get(`${host}/player_api.php`, {
        params: {
          username: appState.appConfig.xtreamUsername,
          password: appState.appConfig.xtreamPassword,
          action: 'get_short_epg',
          stream_id: streamId
        },
        timeout: 10000
      });
      if (response.data && response.data.epg_listings) {
        const listings = response.data.epg_listings.map(item => {
          const title = decodeBase64Safe(item.title);
          const description = decodeBase64Safe(item.description);
          return { ...item, title, description };
        });
        return res.json({ epg_listings: listings });
      }
      return res.json({ epg_listings: [] });
    } catch (error) {
      console.error(`[EPG] Error fetching for stream ${streamId}:`, error.message);
      return res.status(500).json({ error: `EPG konnte nicht geladen werden: ${error.message}` });
    }
  });

  app.get('/api/recordings', (req, res) => {
    const list = appState.recordings.map(rec => {
      const active = appState.activeVcrJobs.get(rec.id);
      return {
        ...rec,
        bytesReceived: active ? active.bytesReceived : (rec.bytesReceived || 0),
        speed: active ? active.speed : 0
      };
    });
    return res.json(list);
  });

  app.post('/api/recordings', (req, res) => {
    const { streamId, channelName, streamUrl, title, startTime, endTime } = req.body;
    if (!channelName || !streamUrl || !startTime || !endTime) {
      return res.status(400).json({ error: 'Fehlende Aufnahmedetails' });
    }
    const rec = {
      id: Date.now().toString() + '_' + Math.random().toString(36).slice(2, 9),
      streamId: streamId || '',
      channelName,
      streamUrl,
      title: title || 'Manuelle Aufnahme',
      startTime,
      endTime,
      status: 'scheduled',
      bytesReceived: 0,
      filename: '',
      filePath: ''
    };
    appState.recordings.push(rec);
    saveRecordings();
    broadcastVcrStatus();
    console.log(`[VCR] Programmed recording: ${rec.title} for channel ${rec.channelName} (${rec.startTime} to ${rec.endTime})`);
    return res.json(rec);
  });

  app.post('/api/recordings/:id/stop', (req, res) => {
    const { id } = req.params;
    const rec = appState.recordings.find(r => r.id === id);
    if (!rec) {
      return res.status(404).json({ error: 'Aufnahme nicht gefunden' });
    }
    if (rec.status !== 'recording') {
      return res.status(400).json({ error: 'Aufnahme ist nicht aktiv' });
    }
    stopVcrRecordingJob(id, 'completed');
    return res.json({ success: true });
  });

  app.delete('/api/recordings/:id', (req, res) => {
    const { id } = req.params;
    const index = appState.recordings.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Aufnahme nicht gefunden' });
    }
    const rec = appState.recordings[index];
    if (rec.status === 'recording') {
      stopVcrRecordingJob(id, 'error', 'Gelöscht');
    }
    if (rec.filePath && fs.existsSync(rec.filePath)) {
      try {
        fs.unlinkSync(rec.filePath);
        console.log(`[VCR] Deleted recording file: ${rec.filePath}`);
      } catch (e) {
        console.error(`[VCR] Failed to delete recording file: ${rec.filePath}`, e.message);
      }
    }
    appState.recordings.splice(index, 1);
    saveRecordings();
    broadcastVcrStatus();
    console.log(`[VCR] Deleted recording: ${rec.title} (${rec.id})`);
    return res.json({ success: true });
  });

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
    try {
      const results = await searchXdccEu(query);
      return res.json({ type: 'search', results: results });
    } catch (error) {
      console.error('Search error:', error.message);
      return res.status(500).json({ error: `Fehler bei der Suche auf xdcc.eu: ${error.message}` });
    }
  });

  app.get('/api/downloads', (req, res) => {
    const list = Array.from(appState.downloadQueue.keys()).map(id => getDownloadDetails(id));
    return res.json(list);
  });

  app.get('/api/settings', (req, res) => {
    const publicConfig = { ...appState.appConfig };
    delete publicConfig.xxxPin;
    publicConfig.version = appState.appVersion;
    publicConfig.startTime = appState.serverStartTime;
    publicConfig.network = getNetworkDetails(appState.appConfig);
    return res.json(publicConfig);
  });

  app.get('/api/settings/files', (req, res) => {
    try {
      const subpath = req.query.path || '';
      const baseDir = path.resolve(appState.appConfig.downloadDir);
      const targetDir = path.resolve(path.join(baseDir, subpath));
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
        .filter(entry => !entry.name.startsWith('.'))
        .map(entry => {
          const entryPath = path.join(targetDir, entry.name);
          let size = 0;
          let mtime = 0;
          try {
            const stat = fs.statSync(entryPath);
            size = stat.size;
            mtime = stat.mtimeMs;
          } catch (e) { /* ignore stat errors */ }
          return { name: entry.name, isDirectory: entry.isDirectory(), size, mtime };
        });
      files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      return res.json({ currentPath: subpath, files });
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
      const baseDir = path.resolve(appState.appConfig.downloadDir);
      const targetDir = path.resolve(path.join(baseDir, subpath || ''));
      if (!targetDir.startsWith(baseDir)) {
        return res.status(403).json({ error: 'Unzulässiger Pfad-Traversal blockiert!' });
      }
      const newFolderDir = path.join(targetDir, name);
      if (fs.existsSync(newFolderDir)) {
        return res.status(400).json({ error: 'Ordner existiert bereits.' });
      }
      fs.mkdirSync(newFolderDir, { recursive: true });
      console.log(`[File Explorer] Created directory: ${newFolderDir}`);
      appState.cachedLocalFiles = null;
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
      const baseDir = path.resolve(appState.appConfig.downloadDir);
      const targetDir = path.resolve(path.join(baseDir, subpath || ''));
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
      appState.cachedLocalFiles = null;
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
      const baseDir = path.resolve(appState.appConfig.downloadDir);
      const srcDir = path.resolve(path.join(baseDir, subpath || ''));
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
      if (!destPath.startsWith(baseDir)) {
        return res.status(403).json({ error: 'Unzulässiger Zielpfad (außerhalb der Mediathek)!' });
      }
      if (fs.existsSync(destPath)) {
        return res.status(400).json({ error: 'Zielpfad existiert bereits.' });
      }
      const destParent = path.dirname(destPath);
      if (!fs.existsSync(destParent)) {
        fs.mkdirSync(destParent, { recursive: true });
      }
      fs.renameSync(srcPath, destPath);
      console.log(`[File Explorer] Moved/Renamed: ${srcPath} -> ${destPath}`);
      appState.cachedLocalFiles = null;
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
      xxxHideEnabled, pin, newPin,
      tailscaleBypassIrc, tailscaleLocalAddress, ircSearchTimeout,
      allowTailscaleIp, customLocalIp
    } = req.body;

    if (appState.appConfig.xxxHideEnabled && xxxHideEnabled === false) {
      if (pin !== appState.appConfig.xxxPin) {
        return res.status(403).json({ error: 'Falscher Sperrcode!' });
      }
    }

    if (newPin !== undefined && newPin !== '') {
      if (appState.appConfig.xxxPin !== '' && pin !== appState.appConfig.xxxPin) {
        return res.status(403).json({ error: 'Falscher Sperrcode!' });
      }
      appState.appConfig.xxxPin = newPin;
      console.log('[Jugendschutz] Sperrcode wurde geändert.');
    }

    if (xxxHideEnabled !== undefined) {
      appState.appConfig.xxxHideEnabled = !!xxxHideEnabled;
    }

    if (downloadDir) {
      const oldDir = appState.appConfig.downloadDir;
      appState.appConfig.downloadDir = path.resolve(downloadDir);
      if (oldDir !== appState.appConfig.downloadDir) {
        loadMetadataCache();
        appState.cachedLocalFiles = null;
        configureSambaShare(appState.appConfig.downloadDir);
      }
    }
    if (typeof useSSLByDefault === 'boolean') {
      appState.appConfig.useSSLByDefault = useSSLByDefault;
    }
    if (typeof keepDays === 'number' && keepDays >= 0) {
      appState.appConfig.keepDays = keepDays;
    }
    if (typeof checkIntervalHours === 'number' && checkIntervalHours > 0) {
      appState.appConfig.checkIntervalHours = checkIntervalHours;
      recreateCheckInterval();
    }

    if (xtreamHost !== undefined) appState.appConfig.xtreamHost = xtreamHost;
    if (xtreamUsername !== undefined) appState.appConfig.xtreamUsername = xtreamUsername;
    if (xtreamPassword !== undefined) appState.appConfig.xtreamPassword = xtreamPassword;
    if (xtreamEnabled !== undefined) appState.appConfig.xtreamEnabled = !!xtreamEnabled;
    if (typeof xtreamSyncIntervalHours === 'number' && xtreamSyncIntervalHours > 0) {
      appState.appConfig.xtreamSyncIntervalHours = xtreamSyncIntervalHours;
    }

    if (tailscaleBypassIrc !== undefined) {
      appState.appConfig.tailscaleBypassIrc = !!tailscaleBypassIrc;
    }
    if (tailscaleLocalAddress !== undefined) {
      appState.appConfig.tailscaleLocalAddress = String(tailscaleLocalAddress).trim();
    }
    if (ircSearchTimeout !== undefined) {
      appState.appConfig.ircSearchTimeout = Math.max(5, parseInt(ircSearchTimeout, 10) || 24);
    }
    if (allowTailscaleIp !== undefined) {
      appState.appConfig.allowTailscaleIp = !!allowTailscaleIp;
    }
    if (customLocalIp !== undefined) {
      appState.appConfig.customLocalIp = String(customLocalIp).trim();
    }

    saveConfig(appState);
    recreateXtreamSyncInterval();

    if (appState.appConfig.xtreamEnabled) {
      appState.lastXtreamFetch = 0;
      fetchXtreamData(true).catch(err => console.error('[Xtream] Settings update fetch error:', err.message));
    }

    const publicConfig = { ...appState.appConfig };
    delete publicConfig.xxxPin;
    publicConfig.version = appState.appVersion;
    publicConfig.startTime = appState.serverStartTime;
    publicConfig.network = getNetworkDetails(appState.appConfig);
    return res.json(publicConfig);
  });

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

  app.get('/api/auto-download', (req, res) => {
    loadAutoDownloads();
    return res.json(appState.autoDownloads);
  });

  app.post('/api/auto-download/toggle', (req, res) => {
    const { imdbId, title, enabled } = req.body;
    if (!imdbId || !title) {
      return res.status(400).json({ error: 'Fehlende Parameter imdbId oder title' });
    }
    loadAutoDownloads();
    if (!appState.autoDownloads[imdbId]) {
      appState.autoDownloads[imdbId] = {
        imdbId,
        title,
        enabled: false,
        addedAt: new Date().toISOString()
      };
    }
    appState.autoDownloads[imdbId].enabled = !!enabled;
    saveAutoDownloads();
    broadcastAutoDownloads();
    if (enabled) {
      console.log(`[Auto-Download] Enabled for "${title}" (${imdbId}). Triggering check...`);
      checkAllAutoDownloads();
    }
    return res.json(appState.autoDownloads[imdbId]);
  });

  app.post('/api/auto-download/check-now', async (req, res) => {
    const { imdbId } = req.body;
    if (!imdbId) {
      return res.status(400).json({ error: 'Fehlende Parameter imdbId' });
    }
    loadAutoDownloads();
    const sub = appState.autoDownloads[imdbId];
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

  app.post('/api/xtream/download', (req, res) => {
    const { url, title, seriesTitle } = req.body;
    if (!url || !title) {
      return res.status(400).json({ error: 'Fehlende Parameter url oder title' });
    }
    const id = `http_${crypto.createHash('md5').update(url).digest('hex')}`;
    if (appState.downloadQueue.has(id)) {
      const item = appState.downloadQueue.get(id);
      if (item.downloader.status === 'paused' || item.downloader.status === 'error' || item.downloader.status === 'cancelled') {
        item.downloader.cleanup();
        appState.downloadQueue.delete(id);
      } else {
        return res.status(400).json({ error: 'Download läuft bereits oder ist bereits in der Warteschlange.' });
      }
    }
    let extension = '.mp4';
    try {
      const pathname = new URL(url).pathname;
      const ext = path.extname(pathname);
      if (ext && ext.length > 1 && ext.length < 6) {
        extension = ext.toLowerCase();
      }
    } catch (e) { /* ignore stat errors */ }
    let filename = '';
    if (seriesTitle) {
      filename = `${seriesTitle} - ${title}${extension}`;
    } else {
      filename = `${title}${extension}`;
    }
    filename = filename.replace(/[\\/:*?"<>|]/g, '_');
    const downloader = new HttpDownloader({
      id,
      url,
      filename,
      downloadDir: appState.appConfig.downloadDir
    });
    downloader.on('progress', (data) => {
      if (data.status === 'completed') {
        appState.cachedLocalFiles = null;
        organizeAllFiles().catch(err => console.error('[Xtream Download] Organize error:', err));
      }
      broadcastStatus(id);
    });
    downloader.on('message', (data) => {
      broadcastToClients(JSON.stringify({ type: 'message', data: { id, text: data.text } }));
    });
    appState.downloadQueue.set(id, { downloader });
    downloader.start();
    return res.json({ success: true, id, status: downloader.status });
  });

  app.post('/api/download', (req, res) => {
    const { server, port, useSSL, channel, botName, packNumber, filename, expectedSize, useSsend } = req.body;
    if (!server || !channel || !botName || !packNumber || !filename) {
      return res.status(400).json({ error: 'Fehlende Download-Parameter' });
    }
    const id = `${server}_${channel}_${botName}_${packNumber}_${filename.replace(/\s+/g, '_')}`;
    if (appState.downloadQueue.has(id)) {
      const item = appState.downloadQueue.get(id);
      if (item.downloader.status === 'paused' || item.downloader.status === 'error' || item.downloader.status === 'cancelled') {
        item.downloader.cleanup();
        appState.downloadQueue.delete(id);
      } else {
        return res.status(400).json({ error: 'Download läuft bereits oder ist bereits in der Warteschlange.' });
      }
    }
    const resolvedUseSSL = typeof useSSL === 'boolean' ? useSSL : appState.appConfig.useSSLByDefault;
    const resolvedPort = port || (resolvedUseSSL ? appState.appConfig.ircPortDefaultSSL : appState.appConfig.ircPortDefaultNoSSL);
    let resolvedLocalAddress = undefined;
    if (appState.appConfig.tailscaleBypassIrc) {
      resolvedLocalAddress = appState.appConfig.tailscaleLocalAddress || getLocalIp(appState.appConfig);
      if (resolvedLocalAddress === '127.0.0.1') {
        resolvedLocalAddress = undefined;
      }
    }
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
      downloadDir: appState.appConfig.downloadDir,
      useSsend: typeof useSsend === 'boolean' ? useSsend : false,
      localAddress: resolvedLocalAddress
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
      broadcastToClients(JSON.stringify({ type: 'message', data: { id, text: data.text } }));
    });
    appState.downloadQueue.set(id, { downloader });
    downloader.start();
    return res.json({ success: true, id, status: downloader.status });
  });

  app.post('/api/download/:id/pause', (req, res) => {
    const { id } = req.params;
    const item = appState.downloadQueue.get(id);
    if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
    item.downloader.pause();
    return res.json({ success: true });
  });

  app.post('/api/download/:id/resume', (req, res) => {
    const { id } = req.params;
    const item = appState.downloadQueue.get(id);
    if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
    item.downloader.start();
    return res.json({ success: true });
  });

  app.post('/api/download/:id/confirm-filename', (req, res) => {
    const { id } = req.params;
    const item = appState.downloadQueue.get(id);
    if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
    item.downloader.confirmFilename();
    return res.json({ success: true });
  });

  app.post('/api/download/:id/cancel', (req, res) => {
    const { id } = req.params;
    const item = appState.downloadQueue.get(id);
    if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
    item.downloader.cancel();
    appState.downloadQueue.delete(id);
    broadcastDeletion(id);
    return res.json({ success: true });
  });

  app.delete('/api/download/:id', async (req, res) => {
    const { id } = req.params;
    const deleteFile = req.query.deleteFile === 'true';
    const item = appState.downloadQueue.get(id);
    if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
    if (item.downloader.status !== 'dcc_downloading') {
      if (deleteFile && item.downloader.filePath) {
        try {
          if (fs.existsSync(item.downloader.filePath)) {
            await fs.promises.unlink(item.downloader.filePath);
            console.log(`[Server] Deleted file from disk: ${item.downloader.filePath}`);
            appState.cachedLocalFiles = null;
          }
        } catch (err) {
          console.error(`[Server] Failed to delete file: ${item.downloader.filePath}`, err);
          return res.status(500).json({ error: `Datei konnte nicht gelöscht werden: ${err.message}` });
        }
      }
      item.downloader.cleanup();
      appState.downloadQueue.delete(id);
      broadcastDeletion(id);
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'Laufende Downloads können nicht gelöscht werden, brich sie zuerst ab.' });
    }
  });

  app.get('/api/media-library', async (req, res) => {
    const category = req.query.category || 'all';
    const subcategory = req.query.subcategory || 'all';
    const search = (req.query.search || '').trim().toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 60;
    const forceScan = req.query.forceScan === 'true';

    if (forceScan || appState.cachedLocalFiles === null) {
      await updateLocalMappedList(forceScan);
    }

    if (appState.appConfig.xtreamEnabled) {
      const intervalMs = (appState.appConfig.xtreamSyncIntervalHours || 1) * 60 * 60 * 1000;
      const isExpired = Date.now() - appState.lastXtreamFetch >= intervalMs;
      if (appState.xtreamMovies.length === 0 || isExpired) {
        console.log(`[Xtream] Cache empty or expired (age: ${Math.round((Date.now() - appState.lastXtreamFetch) / 60000)}m). Triggering background fetch.`);
        fetchXtreamData(false).catch(err => console.error('[Xtream] Background sync error:', err.message));
      }
    }

    let filteredRaw = appState.cachedRawItems;
    if (search) {
      filteredRaw = appState.cachedRawItems.filter(item => {
        const filenameMatch = item.filename ? item.filename.toLowerCase().includes(search) : false;
        const titleMatch = (item.metadata?.title || item.title || '').toLowerCase().includes(search);
        const castMatch = (item.metadata?.cast || item.cast || '').toLowerCase().includes(search);
        return filenameMatch || titleMatch || castMatch;
      });
    }

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
        const isFav = appState.favorites.has(String(favKey));
        const hasProgress = !item.isGroup && appState.playProgress[item.filename];
        return isFav || hasProgress;
      }).length,
      Neu: 0
    };

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

    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const nonLiveItems = groupedItems.filter(item => {
      const cat = item.metadata?.category || item.category || 'Videos';
      const origCat = item.metadata?.originalCategory || cat;
      return cat !== 'Live TV' && origCat !== 'Live TV' && cat !== 'Musik' && origCat !== 'Musik' && cat !== 'Hörbücher' && origCat !== 'Hörbücher';
    });
    const newItemsLast5Days = nonLiveItems.filter(item => (item.mtime || 0) >= fiveDaysAgo);
    counts.Neu = newItemsLast5Days.length;

    let filteredGrouped = groupedItems;
    if (category === 'Neu') {
      filteredGrouped = nonLiveItems.filter(item => (item.mtime || 0) >= fiveDaysAgo);
    } else if (category === 'Favoriten') {
      filteredGrouped = groupedItems.filter(item => {
        const isFav = appState.favorites.has(String(item.isGroup
          ? (item.xtreamSeriesId || item.imdbId || item.title || item.metadata?.imdbId || item.metadata?.title)
          : item.filename));
        const isWatchingSeries = item.isGroup && item.files.some(ep => appState.playProgress[ep.filename]);
        return isFav || isWatchingSeries;
      });
    } else if (category !== 'all') {
      filteredGrouped = groupedItems.filter(item => {
        const cat = item.metadata?.category || item.category || 'Videos';
        const origCat = item.metadata?.originalCategory || cat;
        return cat === category || origCat === category;
      });
    }

    if (category === 'Live TV') {
      filteredGrouped.sort((a, b) => {
        const titleA = a.metadata?.title || a.title || '';
        const titleB = b.metadata?.title || b.title || '';
        return titleA.localeCompare(titleB);
      });
    } else if (category !== 'Musik' && category !== 'Hörbücher') {
      filteredGrouped.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    }

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

    const subcats = new Set();
    filteredGrouped.forEach(item => {
      const sub = item.metadata?.subcategory || item.subcategory;
      if (sub) subcats.add(sub);
    });
    const availableSubcategories = ['all', ...Array.from(subcats).sort()];

    if (subcategory !== 'all') {
      filteredGrouped = filteredGrouped.filter(item => {
        const subcat = item.metadata?.subcategory || item.subcategory || '';
        return subcat === subcategory;
      });
    }

    const totalItems = filteredGrouped.length;
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * limit;
    const endIndex = currentPage * limit;
    const paginatedItems = filteredGrouped.slice(startIndex, endIndex);

    const finalItems = paginatedItems.map(item => {
      const cloned = { ...item };
      if (!cloned.isGroup) {
        if (appState.playProgress[cloned.filename]) {
          cloned.progress = appState.playProgress[cloned.filename];
        }
      } else {
        cloned.files = cloned.files.map(ep => {
          const epCloned = { ...ep };
          if (appState.playProgress[epCloned.filename]) {
            epCloned.progress = appState.playProgress[epCloned.filename];
          }
          return epCloned;
        });
      }
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
    if (!appState.appConfig.xtreamEnabled || !appState.appConfig.xtreamHost || !appState.appConfig.xtreamUsername || !appState.appConfig.xtreamPassword) {
      return res.status(400).json({ error: 'Xtream Codes ist nicht aktiviert oder konfiguriert.' });
    }
    try {
      const host = appState.appConfig.xtreamHost.replace(/\/$/, '');
      const resEpisodes = await axios.get(`${host}/player_api.php`, {
        params: {
          username: appState.appConfig.xtreamUsername,
          password: appState.appConfig.xtreamPassword,
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
            const streamUrl = `${host}/series/${appState.appConfig.xtreamUsername}/${appState.appConfig.xtreamPassword}/${ep.id}.${ext}`;
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
    appState.playProgress[filename] = {
      position: parseFloat(position) || 0,
      updatedAt: Date.now()
    };
    saveLocalPlayProgress();
    return res.json({ success: true, progress: appState.playProgress[filename] });
  });

  app.post('/api/favorites/toggle', (req, res) => {
    const { id, isFavorite } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing parameter id' });
    }
    if (isFavorite) {
      appState.favorites.add(String(id));
    } else {
      appState.favorites.delete(String(id));
    }
    saveLocalFavorites();
    return res.json({ success: true, isFavorite: appState.favorites.has(String(id)) });
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
    let device = appState.discoveredChromecasts.get(deviceName);
    let isDlna = false;
    let isAirplay = false;
    if (!device) {
      device = appState.discoveredDlnas.get(deviceName);
      if (device) {
        isDlna = true;
      } else {
        device = appState.discoveredAirplays.get(deviceName);
        if (device) {
          isAirplay = true;
        } else {
          return res.status(404).json({ error: `Gerät "${deviceName}" nicht im Netzwerk gefunden.` });
        }
      }
    }
    const mediaUrl = `http://${getLocalIp(appState.appConfig)}:${PORT}/api/media/${encodeURIComponent(filename)}`;
    console.log(`[Cast] Casting Library file "${filename}" to "${deviceName}" via ${mediaUrl} (isDlna: ${isDlna}, isAirplay: ${isAirplay})`);
    let contentType = 'video/mp4';
    const ext = path.extname(filename.split('?')[0]).toLowerCase();
    if (ext === '.mkv') {
      const needsTranscode = await checkAudioTranscodeNeeded(filePath);
      contentType = needsTranscode ? 'video/mp4' : 'video/x-matroska';
    } else if (ext === '.avi') contentType = 'video/mp4';
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
          appState.activeCasts.set(deviceName, {
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
        appState.activeCasts.set(deviceName, {
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
        appState.activeCasts.set(deviceName, {
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

  app.post('/api/download/:id/play-local', (req, res) => {
    const { id } = req.params;
    const item = appState.downloadQueue.get(id);
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
    if (appState.castBrowser) {
      try {
        appState.castBrowser.update();
      } catch (e) {
        console.error('[Chromecast] Fehler beim Aktualisieren des Browsers:', e);
      }
    }
    if (appState.dlnaBrowser) {
      try {
        appState.dlnaBrowser.update();
      } catch (e) {
        console.error('[DLNA] Fehler beim Aktualisieren des Browsers:', e);
      }
    }
    if (appState.airplayBrowser) {
      try {
        appState.airplayBrowser.update();
      } catch (e) {
        console.error('[AirPlay] Fehler beim Aktualisieren des Browsers:', e);
      }
    }
    const chromecasts = Array.from(appState.discoveredChromecasts.values()).map(d => ({
      name: d.friendlyName,
      host: d.host,
      type: 'chromecast'
    }));
    const dlnas = Array.from(appState.discoveredDlnas.values()).map(d => ({
      name: d.name,
      host: d.host || 'DLNA',
      type: 'dlna'
    }));
    const airplays = Array.from(appState.discoveredAirplays.values()).map(d => ({
      name: d.name,
      host: d.host || 'AirPlay',
      type: 'airplay'
    }));
    return res.json([...chromecasts, ...dlnas, ...airplays]);
  });

  app.post('/api/chromecast/play', async (req, res) => {
    const { downloadId, deviceName } = req.body;
    if (!downloadId || !deviceName) {
      return res.status(400).json({ error: 'Parameter downloadId und deviceName fehlen' });
    }
    const item = appState.downloadQueue.get(downloadId);
    if (!item) return res.status(404).json({ error: 'Download nicht gefunden' });
    if (item.downloader.status !== 'completed') {
      return res.status(400).json({ error: 'Download ist noch nicht abgeschlossen' });
    }
    let device = appState.discoveredChromecasts.get(deviceName);
    let isDlna = false;
    let isAirplay = false;
    if (!device) {
      device = appState.discoveredDlnas.get(deviceName);
      if (device) {
        isDlna = true;
      } else {
        device = appState.discoveredAirplays.get(deviceName);
        if (device) {
          isAirplay = true;
        } else {
          return res.status(404).json({ error: `Gerät "${deviceName}" nicht im Netzwerk gefunden. Bitte Suche aktualisieren.` });
        }
      }
    }
    const filename = item.downloader.filename;
    const localIp = getLocalIp(appState.appConfig);
    const mediaUrl = `http://${localIp}:${PORT}/api/media/${encodeURIComponent(filename)}`;
    console.log(`[Cast] Casting "${filename}" to "${deviceName}" via ${mediaUrl} (isDlna: ${isDlna}, isAirplay: ${isAirplay})`);
    let contentType = 'video/mp4';
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.mkv') {
      const needsTranscode = await checkAudioTranscodeNeeded(item.downloader.filePath);
      contentType = needsTranscode ? 'video/mp4' : 'video/x-matroska';
    } else if (ext === '.avi') contentType = 'video/mp4';
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
          appState.activeCasts.set(deviceName, {
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
        appState.activeCasts.set(deviceName, {
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
        appState.activeCasts.set(deviceName, {
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
    appState.activeCasts.delete(deviceName);
    broadcastActiveCasts();
    const device = appState.discoveredChromecasts.get(deviceName);
    if (device && typeof device.stop === 'function') {
      device.stop((err) => {
        if (err) {
          console.error(`[Chromecast] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
        }
      });
    } else {
      const dlnaDevice = appState.discoveredDlnas.get(deviceName);
      if (dlnaDevice && dlnaDevice.client && typeof dlnaDevice.stop === 'function') {
        dlnaDevice.stop((err) => {
          if (err) {
            console.error(`[DLNA] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
          }
        });
      } else {
        const airplayDevice = appState.discoveredAirplays.get(deviceName);
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
    let device = appState.discoveredChromecasts.get(deviceName);
    let isDlna = false;
    let isAirplay = false;
    if (!device) {
      device = appState.discoveredDlnas.get(deviceName);
      if (device) {
        isDlna = true;
      } else {
        device = appState.discoveredAirplays.get(deviceName);
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
        device.playbackInfo((statusErr, resObj, body) => {
          if (!statusErr && body) {
            const castInfo = appState.activeCasts.get(deviceName);
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
              appState.activeCasts.set(deviceName, castInfo);
              broadcastActiveCasts();
            }
          }
        });
        return res.json({ success: true });
      };
      switch (action) {
        case 'pause': device.pause(callback); break;
        case 'resume': device.resume(callback); break;
        case 'seek': device.scrub(parseFloat(value), callback); break;
        case 'volume': return res.json({ success: true });
        default: return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });
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
        device.status((statusErr, status) => {
          if (!statusErr && status) {
            const castInfo = appState.activeCasts.get(deviceName);
            if (castInfo) {
              let playerState = 'PLAYING';
              if (status.transportState === 'PAUSED_PLAYBACK') playerState = 'PAUSED';
              else if (status.transportState === 'STOPPED') playerState = 'IDLE';
              castInfo.playerState = playerState;
              if (status.relTime) castInfo.currentTime = parseTimeStringToSeconds(status.relTime);
              if (status.trackDuration) castInfo.duration = parseTimeStringToSeconds(status.trackDuration);
              if (status.volume !== undefined) castInfo.volume = status.volume / 100;
              appState.activeCasts.set(deviceName, castInfo);
              broadcastActiveCasts();
            }
          }
        });
        return res.json({ success: true });
      };
      switch (action) {
        case 'pause': device.pause(callback); break;
        case 'resume':
          if (typeof device.resume === 'function') device.resume(callback);
          else device.play(callback);
          break;
        case 'seek': device.seek(parseFloat(value), callback); break;
        case 'volume': device.volume(Math.round(parseFloat(value) * 100), callback); break;
        default: return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });
      }
      return;
    }
    const callback = (err) => {
      if (err) {
        console.error(`[Chromecast Control] Fehler bei Action ${action} auf ${deviceName}:`, err);
        return res.status(500).json({ error: `Steuerung fehlgeschlagen: ${err.message}` });
      }
      device.getStatus((statusErr, status) => {
        if (!statusErr && status) {
          const castInfo = appState.activeCasts.get(deviceName);
          if (castInfo) {
            castInfo.playerState = status.playerState;
            castInfo.currentTime = status.currentTime || 0;
            castInfo.duration = status.media?.duration || 0;
            castInfo.volume = status.volume?.level || 1;
            castInfo.muted = !!status.volume?.muted;
            appState.activeCasts.set(deviceName, castInfo);
            broadcastActiveCasts();
          }
        }
      });
      return res.json({ success: true });
    };
    switch (action) {
      case 'pause': device.pause(callback); break;
      case 'resume':
        if (typeof device.resume === 'function') device.resume(callback);
        else device.play(callback);
        break;
      case 'seek': device.seek(parseFloat(value), callback); break;
      case 'volume': device.setVolume(parseFloat(value), callback); break;
      default: return res.status(400).json({ error: `Unbekannte Aktion: ${action}` });
    }
  });

  app.get('/api/chromecast/active', (req, res) => {
    return res.json(Array.from(appState.activeCasts.entries()).map(([device, info]) => ({
      device,
      ...info
    })));
  });

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
      if (req.headers.range) headers['Range'] = req.headers.range;
      if (req.headers['user-agent']) headers['User-Agent'] = req.headers['user-agent'];
      try {
        const response = await axios({
          method: 'get',
          url: filePath,
          headers: headers,
          responseType: 'stream',
          timeout: 30000
        });
        res.status(response.status);
        const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
        for (const h of headersToForward) {
          if (response.headers[h]) res.setHeader(h, response.headers[h]);
        }
        response.data.pipe(res);
        req.on('close', () => { response.data.destroy(); });
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

  app.get('*', (req, res) => {
    const indexPath = path.join(process.cwd(), 'client', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('XDCC Load&Cast API Server is running. Frontend has not been built yet.');
    }
  });
}
