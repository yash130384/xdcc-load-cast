// Shared mutable application state
// All modules import this to access shared state

export const appState = {
  // Config
  appConfig: null,
  appVersion: '1.0.0',
  serverStartTime: new Date().toISOString(),

  // Discovery
  discoveredChromecasts: new Map(),
  discoveredDlnas: new Map(),
  discoveredAirplays: new Map(),
  castBrowser: null,
  dlnaBrowser: null,
  airplayBrowser: null,

  // Xtream Cache
  xtreamMovies: [],
  xtreamSeries: [],
  xtreamLive: [],
  xtreamVodCategories: [],
  xtreamSeriesCategories: [],
  xtreamLiveCategories: [],
  lastXtreamFetch: 0,
  xtreamSyncTimer: null,

  // Download Queue
  downloadQueue: new Map(),

  // Active Casts
  activeCasts: new Map(),

  // Auto-Downloads
  autoDownloads: {},

  // VCR
  recordings: [],
  activeVcrJobs: new Map(),

  // Media Library
  cachedLocalFiles: null,
  lastLocalFileScan: 0,
  cachedMappedMovies: [],
  cachedMappedSeries: [],
  cachedMappedLive: [],
  cachedMappedList: [],
  cachedRawItems: [],
  favorites: [],
  metadataCache: {},

  // Server references
  wss: null,
  app: null,
};

export function setWss(wss) {
  appState.wss = wss;
}

export function setApp(app) {
  appState.app = app;
}

export function broadcastToClients(message) {
  const { wss } = appState;
  if (!wss || !wss.clients) return;
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}