import { appState, broadcastToClients } from '../state.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const XTREAM_CACHE_FILE = path.join(os.homedir(), '.xdcc_xtream_cache.json');

export function loadXtreamCache() {
  if (fs.existsSync(XTREAM_CACHE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(XTREAM_CACHE_FILE, 'utf8'));
      appState.xtreamMovies = data.xtreamMovies || [];
      appState.xtreamSeries = data.xtreamSeries || [];
      appState.xtreamLive = data.xtreamLive || [];
      appState.xtreamVodCategories = data.xtreamVodCategories || [];
      appState.xtreamSeriesCategories = data.xtreamSeriesCategories || [];
      appState.xtreamLiveCategories = data.xtreamLiveCategories || [];
      appState.lastXtreamFetch = data.lastXtreamFetch || 0;
      console.log(`[Xtream Cache] Loaded cache from disk. Movies: ${appState.xtreamMovies.length}, Series: ${appState.xtreamSeries.length}, Live: ${appState.xtreamLive.length}, Last Fetch: ${new Date(appState.lastXtreamFetch).toLocaleString()}`);
      updateMappedXtreamData();
    } catch (e) {
      console.error('[Xtream Cache] Failed to load cache from disk:', e.message);
    }
  }
}

export async function saveXtreamCache() {
  try {
    const data = {
      xtreamMovies: appState.xtreamMovies,
      xtreamSeries: appState.xtreamSeries,
      xtreamLive: appState.xtreamLive,
      xtreamVodCategories: appState.xtreamVodCategories,
      xtreamSeriesCategories: appState.xtreamSeriesCategories,
      xtreamLiveCategories: appState.xtreamLiveCategories,
      lastXtreamFetch: appState.lastXtreamFetch
    };
    await fs.promises.writeFile(XTREAM_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Xtream Cache] Saved cache to disk (${XTREAM_CACHE_FILE}).`);
  } catch (e) {
    console.error('[Xtream Cache] Failed to save cache to disk:', e.message);
  }
}

export function isAdultContent(subcategory, title) {
  const adultKeywords = ['xxx', 'adult', '18+', 'porn', 'erotik', 'redlight', 'pink', 'explicito', 'sensual', 'hot', 'erotic', 'hentai', 'lust', 'sxt'];
  const cat = (subcategory || '').toLowerCase();
  const t = (title || '').toLowerCase();
  return adultKeywords.some(kw => cat.includes(kw) || t.includes(kw));
}

function broadcastXtreamSyncComplete() {
  broadcastToClients({ type: 'xtream-sync-complete' });
}

export function recreateXtreamSyncInterval() {
  if (appState.xtreamSyncTimer) {
    clearInterval(appState.xtreamSyncTimer);
    appState.xtreamSyncTimer = null;
  }
  if (!appState.appConfig.xtreamEnabled) {
    return;
  }
  const hours = appState.appConfig.xtreamSyncIntervalHours || 1;
  console.log(`[Xtream] Setting sync interval to ${hours} hours.`);
  appState.xtreamSyncTimer = setInterval(() => {
    console.log(`[Xtream] Running background sync...`);
    fetchXtreamData(true).catch(err => console.error('[Xtream] Background sync error:', err.message));
  }, hours * 60 * 60 * 1000);
}

async function fetchFromXtream(host, action, timeoutMs = 10000) {
  const urlParams = new URLSearchParams({
    username: appState.appConfig.xtreamUsername,
    password: appState.appConfig.xtreamPassword,
    action: action
  });
  const res = await fetch(`${host}/player_api.php?${urlParams}`, {
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function fetchXtreamData(force = false) {
  if (!appState.appConfig.xtreamEnabled || !appState.appConfig.xtreamHost || !appState.appConfig.xtreamUsername || !appState.appConfig.xtreamPassword) {
    return;
  }
  const intervalMs = (appState.appConfig.xtreamSyncIntervalHours || 1) * 60 * 60 * 1000;
  if (!force && (Date.now() - appState.lastXtreamFetch < intervalMs) && appState.xtreamMovies.length > 0) {
    console.log(`[Xtream] Disk cache is still valid (age: ${Math.round((Date.now() - appState.lastXtreamFetch) / 60000)}m). Skipping network fetch.`);
    return;
  }

  try {
    const host = appState.appConfig.xtreamHost.replace(/\/$/, '');

    console.log(`[Xtream] Fetching movies categories from ${host}...`);
    try {
      const data = await fetchFromXtream(host, 'get_vod_categories', 10000);
      if (Array.isArray(data)) {
        appState.xtreamVodCategories = data;
      }
    } catch (err) {
      console.error('[Xtream] Error fetching VOD categories:', err.message);
    }

    console.log(`[Xtream] Fetching series categories from ${host}...`);
    try {
      const data = await fetchFromXtream(host, 'get_series_categories', 10000);
      if (Array.isArray(data)) {
        appState.xtreamSeriesCategories = data;
      }
    } catch (err) {
      console.error('[Xtream] Error fetching series categories:', err.message);
    }

    console.log(`[Xtream] Fetching live categories from ${host}...`);
    try {
      const data = await fetchFromXtream(host, 'get_live_categories', 10000);
      if (Array.isArray(data)) {
        appState.xtreamLiveCategories = data;
      }
    } catch (err) {
      console.error('[Xtream] Error fetching live categories:', err.message);
    }

    console.log(`[Xtream] Fetching movies list from ${host}...`);
    const moviesData = await fetchFromXtream(host, 'get_vod_streams', 15000);
    if (Array.isArray(moviesData)) {
      appState.xtreamMovies = moviesData;
    }

    console.log(`[Xtream] Fetching series list from ${host}...`);
    const seriesData = await fetchFromXtream(host, 'get_series', 15000);
    if (Array.isArray(seriesData)) {
      appState.xtreamSeries = seriesData;
    }

    console.log(`[Xtream] Fetching live channels list from ${host}...`);
    const liveData = await fetchFromXtream(host, 'get_live_streams', 25000);
    if (Array.isArray(liveData)) {
      appState.xtreamLive = liveData;
    }

    appState.lastXtreamFetch = Date.now();
    console.log(`[Xtream] Cache updated. Movies: ${appState.xtreamMovies.length}, Series: ${appState.xtreamSeries.length}, Live TV: ${appState.xtreamLive.length}`);
    updateMappedXtreamData();
    await saveXtreamCache();
    broadcastXtreamSyncComplete();
  } catch (err) {
    console.error('[Xtream] Error updating cache:', err.message);
  }
}

export function updateMappedXtreamData() {
  if (!appState.appConfig) return;
  if (!appState.appConfig.xtreamEnabled || !appState.appConfig.xtreamHost || !appState.appConfig.xtreamUsername || !appState.appConfig.xtreamPassword) {
    appState.cachedMappedMovies = [];
    appState.cachedMappedSeries = [];
    appState.cachedMappedLive = [];
    rebuildCachedRawItems();
    return;
  }

  const host = appState.appConfig.xtreamHost.replace(/\/$/, '');
  const vodCatMap = new Map(appState.xtreamVodCategories.map(c => [String(c.category_id), c.category_name]));
  const seriesCatMap = new Map(appState.xtreamSeriesCategories.map(c => [String(c.category_id), c.category_name]));
  const liveCatMap = new Map(appState.xtreamLiveCategories.map(c => [String(c.category_id), c.category_name]));

  const parseXtreamTimestamp = (val) => {
    if (!val) return 0;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) return 0;
    return String(parsed).length >= 13 ? parsed : parsed * 1000;
  };

  appState.cachedMappedMovies = appState.xtreamMovies.map(movie => {
    const ext = movie.container_extension || 'mp4';
    const streamUrl = `${host}/movie/${appState.appConfig.xtreamUsername}/${appState.appConfig.xtreamPassword}/${movie.stream_id}.${ext}`;
    const subcat = vodCatMap.get(String(movie.category_id)) || 'Sonstige';
    const movieTitle = movie.name || movie.title || 'Unbekannter Film';
    const releaseYear = movie.release_date || movie.year || (movie.name ? (movie.name.match(/\b(19\d{2}|20\d{2})\b/) || [])[1] : '') || '';
    const poster = movie.stream_icon || movie.cover || null;
    const mtime = parseXtreamTimestamp(movie.last_modified || movie.added);

    return {
      filename: movie.stream_id + '_' + movieTitle.replace(/[^a-zA-Z0-9]/g, '_') + '.mp4',
      isXtream: true, isGroup: false,
      source: 'xtream', type: 'movie', xtreamStreamId: movie.stream_id,
      streamUrl, xtreamTitle: movieTitle,
      title: movieTitle, year: releaseYear,
      category: 'Filme', subcategory: subcat,
      coverUrl: poster,
      posterUrl: poster,
      mtime,
      xtreamLastModified: mtime,
      metadata: {
        title: movieTitle,
        category: 'Filme',
        originalCategory: 'Filme',
        subcategory: subcat,
        year: releaseYear,
        posterUrl: poster,
        coverUrl: poster,
        backdrop: poster,
        description: movie.plot || movie.description || ''
      }
    };
  });

  appState.cachedMappedSeries = appState.xtreamSeries.map(series => {
    const subcat = seriesCatMap.get(String(series.category_id)) || 'Sonstige';
    const seriesTitle = series.name || series.title || 'Unbekannte Serie';
    const releaseYear = series.year || series.release_date || (series.name ? (series.name.match(/\b(19\d{2}|20\d{2})\b/) || [])[1] : '') || '';
    const poster = series.cover || series.stream_icon || series.movie_image || null;
    const backdrop = series.backdrop_path && series.backdrop_path[0] ? `https://image.tmdb.org/t/p/w500${series.backdrop_path[0]}` : poster;
    const mtime = parseXtreamTimestamp(series.last_modified || series.last_updated || series.added);

    return {
      filename: series.series_id + '_' + seriesTitle.replace(/[^a-zA-Z0-9]/g, '_') + '.mp4',
      isXtream: true, isGroup: true, files: [],
      source: 'xtream', type: 'series', xtreamSeriesId: series.series_id,
      title: seriesTitle, year: releaseYear,
      category: 'Serien', subcategory: subcat,
      coverUrl: poster,
      posterUrl: poster,
      backdropUrl: series.backdrop_path ? series.backdrop_path.map(p => `https://image.tmdb.org/t/p/w500${p}`) : null,
      mtime,
      xtreamLastModified: mtime,
      metadata: {
        title: seriesTitle,
        category: 'Serien',
        originalCategory: 'Serien',
        subcategory: subcat,
        year: releaseYear,
        posterUrl: poster,
        coverUrl: poster,
        backdrop: backdrop,
        cast: series.cast || '',
        genre: series.genre || subcat,
        description: series.plot || series.description || ''
      }
    };
  });

  appState.cachedMappedLive = appState.xtreamLive.map(chan => {
    const ext = 'ts';
    const streamUrl = `${host}/live/${appState.appConfig.xtreamUsername}/${appState.appConfig.xtreamPassword}/${chan.stream_id}.${ext}`;
    const subcat = liveCatMap.get(String(chan.category_id)) || 'Sonstige';
    const chanTitle = chan.name || chan.title || 'Unbekannter Kanal';
    const icon = chan.stream_icon || null;
    const mtime = parseXtreamTimestamp(chan.last_modified || chan.last_updated || chan.added);

    return {
      filename: chan.stream_id + '_' + chanTitle.replace(/[^a-zA-Z0-9]/g, '_') + '.ts',
      isXtream: true, isLive: true, isGroup: false,
      source: 'xtream', type: 'live', xtreamStreamId: chan.stream_id,
      streamUrl, title: chanTitle,
      category: 'Live TV', subcategory: subcat,
      coverUrl: icon,
      posterUrl: icon,
      epgChannelId: chan.epg_channel_id || '',
      tvArchive: chan.tv_archive === 1 || chan.tv_archive === '1' || chan.tvod_archive,
      mtime,
      xtreamLastModified: mtime,
      metadata: {
        title: chanTitle,
        category: 'Live TV',
        originalCategory: 'Live TV',
        subcategory: subcat,
        posterUrl: icon,
        coverUrl: icon
      }
    };
  });

  rebuildCachedRawItems();
  console.log(`[Xtream Mapper] Mapped ${appState.cachedMappedMovies.length} movies, ${appState.cachedMappedSeries.length} series, ${appState.cachedMappedLive.length} live channels`);
}

export function rebuildCachedRawItems() {
  if (!appState.appConfig) return;
  const localMapped = appState.cachedMappedList || [];
  appState.cachedRawItems = [
    ...localMapped,
    ...(appState.cachedMappedMovies || []),
    ...(appState.cachedMappedSeries || []),
    ...(appState.cachedMappedLive || [])
  ];
}