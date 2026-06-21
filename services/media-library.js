import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { parseFile } from 'music-metadata';
import { appState, broadcastToClients } from '../state.js';

const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.mp3', '.wav', '.m4a', '.mov', '.flac', '.mpeg', '.mpg', '.webm', '.ogg', '.ts', '.m4b'
]);

const MUSIC_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.m4b']);

const LOCAL_CACHE_TTL = 30000;
const PLAY_PROGRESS_FILE = path.join(os.homedir(), '.xdcc_play_progress.json');
const FAVORITES_FILE = path.join(os.homedir(), '.xdcc_favorites.json');

let lastLocalScanTime = 0;
let saveMetadataTimeout = null;
let isOrganizing = false;

function getMetadataCachePath() {
  return path.join(appState.appConfig.downloadDir, '.metadata_cache.json');
}

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
        resolve(false);
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
  const baseDir = path.resolve(appState.appConfig.downloadDir);
  const filePath = path.resolve(baseDir, filename);
  if (!filePath.startsWith(baseDir)) {
    return null;
  }
  return filePath;
}

async function deleteMediaFileAndCleanDirs(filename) {
  appState.cachedLocalFiles = null;
  const filePath = getSafeFilePath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Datei existiert nicht auf dem Datenträger');
  }

  await fs.promises.unlink(filePath);
  console.log(`[Media Library] Deleted file: ${filePath}`);

  let currentDir = path.dirname(filePath);
  const baseDir = path.resolve(appState.appConfig.downloadDir);
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

function loadMetadataCache() {
  const cachePath = getMetadataCachePath();
  if (fs.existsSync(cachePath)) {
    try {
      appState.metadataCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`[Cache] Loaded metadata cache from ${cachePath} (${Object.keys(appState.metadataCache).length} items)`);
    } catch (e) {
      console.error('Error loading metadata cache:', e);
      appState.metadataCache = {};
    }
  } else {
    appState.metadataCache = {};
  }
}

function saveMetadataCache() {
  if (saveMetadataTimeout) {
    clearTimeout(saveMetadataTimeout);
  }
  saveMetadataTimeout = setTimeout(async () => {
    saveMetadataTimeout = null;
    const cachePath = getMetadataCachePath();
    try {
      if (!fs.existsSync(appState.appConfig.downloadDir)) {
        await fs.promises.mkdir(appState.appConfig.downloadDir, { recursive: true });
      }
      await fs.promises.writeFile(cachePath, JSON.stringify(appState.metadataCache, null, 2), 'utf8');
      console.log(`[Cache] Metadata cache saved to ${cachePath} (${Object.keys(appState.metadataCache).length} items)`);
    } catch (e) {
      console.error('Error saving metadata cache:', e);
    }
  }, 1000);
}

function loadPlayProgress() {
  try {
    if (fs.existsSync(PLAY_PROGRESS_FILE)) {
      const data = fs.readFileSync(PLAY_PROGRESS_FILE, 'utf8');
      appState.playProgress = JSON.parse(data);
      console.log(`[Progress] Loaded playback progress for ${Object.keys(appState.playProgress).length} items`);
    }
  } catch (err) {
    console.error('Failed to load play progress:', err.message);
    appState.playProgress = {};
  }
}

function savePlayProgress() {
  try {
    fs.writeFileSync(PLAY_PROGRESS_FILE, JSON.stringify(appState.playProgress, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save play progress:', err.message);
  }
}

function loadFavorites() {
  try {
    if (fs.existsSync(FAVORITES_FILE)) {
      const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
      appState.favorites = new Set(JSON.parse(data));
      console.log(`[Favorites] Loaded ${appState.favorites.size} favorites`);
    }
  } catch (err) {
    console.error('Failed to load favorites:', err.message);
    appState.favorites = new Set();
  }
}

function saveFavorites() {
  try {
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(Array.from(appState.favorites), null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save favorites:', err.message);
  }
}

function isItemFavorite(item) {
  const favKey = item.isGroup
    ? (item.xtreamSeriesId || item.imdbId || item.title || item.metadata?.imdbId || item.metadata?.title)
    : item.filename;
  return appState.favorites instanceof Set ? appState.favorites.has(String(favKey)) : false;
}

function rebuildCachedRawItems() {
  appState.cachedRawItems = [
    ...(appState.cachedMappedList || []),
    ...(appState.cachedMappedMovies || []),
    ...(appState.cachedMappedSeries || []),
    ...(appState.cachedMappedLive || [])
  ];
  console.log(`[Performance] Rebuilt cachedRawItems: ${appState.cachedRawItems.length} total items (Lokal: ${(appState.cachedMappedList || []).length}, Movies: ${(appState.cachedMappedMovies || []).length}, Series: ${(appState.cachedMappedSeries || []).length}, Live TV: ${(appState.cachedMappedLive || []).length})`);
}

async function updateLocalMappedList(force = false) {
  const list = await getLocalFiles(force);
  appState.cachedMappedList = list.map(item => {
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

async function getLocalFiles(force = false) {
  if (!force && appState.cachedLocalFiles && (Date.now() - lastLocalScanTime < LOCAL_CACHE_TTL)) {
    return appState.cachedLocalFiles;
  }
  appState.cachedLocalFiles = await scanDownloadDir();
  lastLocalScanTime = Date.now();
  return appState.cachedLocalFiles;
}

function isFileDownloading(filePath) {
  for (const [id, item] of appState.downloadQueue.entries()) {
    if (item.downloader && item.downloader.filePath === filePath) {
      if (['connecting', 'registering', 'joining', 'requesting', 'queued', 'dcc_negotiating', 'dcc_downloading', 'extracting'].includes(item.downloader.status)) {
        return true;
      }
    }
  }
  return false;
}

function updateDownloaderFilePath(oldPath, newPath) {
  for (const [id, item] of appState.downloadQueue.entries()) {
    if (item.downloader && item.downloader.filePath === oldPath) {
      item.downloader.filePath = newPath;
      item.downloader.filename = path.basename(newPath);
      console.log(`[Organize] Updated downloader ${id} filePath to ${newPath}`);
    }
  }
}

async function cleanEmptyDirsInDownloadDir(currentDir) {
  const dir = appState.appConfig.downloadDir;
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

  const finalEntries = await fs.promises.readdir(currentDir);
  if (finalEntries.length === 0) {
    await fs.promises.rmdir(currentDir);
    console.log(`[Organize] Removed empty directory: ${currentDir}`);
  }
}

async function organizeAllFiles() {
  const dir = appState.appConfig.downloadDir;
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
        parsed = parseFilename(baseName);
        const cached = appState.metadataCache[relPath] || appState.metadataCache[baseName];
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

      let targetPath = path.join(dir, subfolder, baseName);
      if (fs.existsSync(targetPath)) {
        const nameWithoutExt = path.parse(baseName).name;
        let counter = 1;
        while (fs.existsSync(targetPath)) {
          targetPath = path.join(dir, subfolder, `${nameWithoutExt}_${counter}${ext}`);
          counter++;
        }
      }

      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.rename(sourcePath, targetPath);
      console.log(`[Organize] Moved ${sourcePath} to ${targetPath}`);
      changed = true;

      const newRelPath = path.relative(dir, targetPath);

      if (appState.metadataCache[relPath]) {
        appState.metadataCache[newRelPath] = { ...appState.metadataCache[relPath] };
        appState.metadataCache[newRelPath].category = category;
        delete appState.metadataCache[relPath];
      } else if (appState.metadataCache[baseName]) {
        appState.metadataCache[newRelPath] = { ...appState.metadataCache[baseName] };
        appState.metadataCache[newRelPath].category = category;
        delete appState.metadataCache[baseName];
      } else {
        appState.metadataCache[newRelPath] = {
          title: parsed ? parsed.title : path.parse(baseName).name,
          category: category,
          year: parsed ? parsed.year : null,
          seasonEpisode: parsed ? parsed.seasonEpisode : null,
          isSeries: parsed ? parsed.isSeries : false
        };
        if (imdb) {
          appState.metadataCache[newRelPath] = {
            ...appState.metadataCache[newRelPath],
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

      if (appState.playProgress[relPath]) {
        appState.playProgress[newRelPath] = appState.playProgress[relPath];
        delete appState.playProgress[relPath];
      }

      updateDownloaderFilePath(sourcePath, targetPath);
    }

    if (changed) {
      saveMetadataCache();
      savePlayProgress();
      appState.cachedLocalFiles = null;
    }

    await cleanEmptyDirsInDownloadDir(dir);

  } catch (err) {
    console.error('[Organize] Error during file organization:', err);
  } finally {
    isOrganizing = false;
  }
}

function parseFilename(filename) {
  const baseName = path.basename(filename);
  let name = baseName;
  const extIndex = name.lastIndexOf('.');
  if (extIndex !== -1) {
    name = name.slice(0, extIndex);
  }

  name = name.replace(/[._-]/g, ' ');

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
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return null;
    const data = await res.json();
    const suggestions = data?.d;
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
    if (appState.metadataCache[filename] && appState.metadataCache[filename].category === targetCategory && appState.metadataCache[filename].artist) {
      return appState.metadataCache[filename];
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
        const urlParams = new URLSearchParams({
          term: queryTerm,
          entity: ext === '.m4b' ? 'audiobook' : 'song',
          limit: '1'
        });
        const itunesRes = await fetch(`https://itunes.apple.com/search?${urlParams}`, {
          signal: AbortSignal.timeout(5000)
        });

        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (itunesData && itunesData.results && itunesData.results.length > 0) {
            const result = itunesData.results[0];
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

    appState.metadataCache[filename] = data;
    saveMetadataCache();
    return data;
  }

  if (appState.metadataCache[filename]) {
    if (appState.metadataCache[filename].notFound && appState.metadataCache[filename].category !== 'Videos') {
      appState.metadataCache[filename].category = 'Videos';
      saveMetadataCache();
    }
    return appState.metadataCache[filename];
  }

  const parsed = parseFilename(filename);
  const data = {
    title: parsed.title,
    year: parsed.year,
    seasonEpisode: parsed.seasonEpisode,
    isSeries: parsed.isSeries,
    category: 'Videos'
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

  appState.metadataCache[filename] = data;
  saveMetadataCache();
  return data;
}

async function scanDownloadDir() {
  const dir = appState.appConfig.downloadDir;
  try {
    if (!fs.existsSync(dir)) {
      return [];
    }

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
            }
          }
        }
      }
    }

    await traverse(dir);

    mediaFiles.sort((a, b) => b.mtime - a.mtime);

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
  const cacheDir = path.join(appState.appConfig.downloadDir, '.image_cache');
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
  }
  return path.join(getImageCacheDir(), `${hash}${ext}`);
}

export {
  checkAudioTranscodeNeeded,
  getSafeFilePath,
  deleteMediaFileAndCleanDirs,
  loadMetadataCache,
  saveMetadataCache,
  loadPlayProgress,
  savePlayProgress,
  loadFavorites,
  saveFavorites,
  getLocalFiles,
  organizeAllFiles,
  scanDownloadDir,
  getOrFetchMetadata,
  fetchImdbMetadata,
  parseFilename,
  findBestMatch,
  updateLocalMappedList,
  isImageFile,
  getImageCachePath,
  isItemFavorite,
  MEDIA_EXTENSIONS,
  MUSIC_EXTENSIONS,
};