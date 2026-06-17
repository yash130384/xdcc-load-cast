import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import fs from 'fs';

import { appState, setWss, setApp } from './state.js';
import { interceptConsole } from './services/logger.js';
import { getDefaultConfig, loadConfig } from './services/config.js';
import { startAllDiscovery } from './services/discovery.js';
import { loadXtreamCache, recreateXtreamSyncInterval } from './services/xtream-client.js';
import { loadRecordings, checkVcrRecordings } from './services/vcr.js';
import { updateLocalMappedList, loadFavorites, loadPlayProgress, loadMetadataCache } from './services/media-library.js';
import { loadAutoDownloads, checkAllAutoDownloads, checkDownloadsTimeout, recreateCheckInterval } from './services/auto-download.js';
import { getDownloadDetails } from './services/download-manager.js';
import { runStartupTests } from './services/search-service.js';
import { registerAllRoutes } from './routes/index.js';
import { configureSambaShare } from './services/samba.js';

// Read version
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  appState.appVersion = pkg.version || '1.0.0';
} catch (e) {
  console.warn('[Startup] Failed to read package.json version:', e.message);
}

// Intercept console
interceptConsole();

// Init config
appState.appConfig = getDefaultConfig();
loadConfig(appState);

// Create Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

setApp(app);
setWss(wss);

app.use(express.json());

// Serve static frontend
const distPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Start device discovery
startAllDiscovery(appState);

// Load persisted caches
loadXtreamCache();
loadRecordings();
loadMetadataCache();
loadPlayProgress();
loadFavorites();
loadAutoDownloads();

// Samba share
configureSambaShare(appState.appConfig.downloadDir);

// Register all REST API routes
registerAllRoutes(app);

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(process.cwd(), 'client', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('PulseCast API Server is running. Frontend has not been built yet.');
  }
});

// WebSocket upgrade
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
  ws.send(JSON.stringify({ type: 'init', data: Array.from(appState.downloadQueue.keys()).map(id => getDownloadDetails(id)) }));
  ws.send(JSON.stringify({ type: 'activeCasts', data: Array.from(appState.activeCasts.entries()).map(([device, info]) => ({ device, ...info })) }));
  ws.send(JSON.stringify({ type: 'auto-downloads', data: appState.autoDownloads }));
  ws.send(JSON.stringify({ type: 'vcr-status', data: appState.recordings.map(r => ({ ...r, bytesReceived: appState.activeVcrJobs.get(r.id)?.bytesReceived || r.bytesReceived || 0, speed: appState.activeVcrJobs.get(r.id)?.speed || 0 })) }));
  ws.on('close', () => console.log('WS Client disconnected.'));
});

// Start server
const PORT = process.env.PORT || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Startup-Error] Port ${PORT} ist bereits belegt. Bitte beende den anderen Prozess oder starte PulseCast mit einem anderen Port (z.B. PORT=3001 npm start).`);
  } else {
    console.error('[Startup-Error] Fehler beim Starten des Servers:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started at http://localhost:${PORT}`);
  setTimeout(runStartupTests, 3000);
  recreateXtreamSyncInterval();
  recreateCheckInterval();
  setInterval(checkDownloadsTimeout, 30 * 1000);
  setInterval(checkVcrRecordings, 10000);
  setTimeout(checkAllAutoDownloads, 5000);
  updateLocalMappedList().catch(err => console.error('[Startup] Local scan cache error:', err));
});