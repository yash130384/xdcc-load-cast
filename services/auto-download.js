import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { IrcDccDownloader } from '../irc-dcc-client.js';
import { appState, broadcastToClients } from '../state.js';
import { searchMoviegodsIRC, searchXdccEu } from './search-service.js';
import { broadcastStatus, broadcastDeletion, handleDownloadPostProcessing } from './download-manager.js';
import { getLocalIp } from './network.js';
import { isAdultContent, updateMappedXtreamData, rebuildCachedRawItems } from './xtream-client.js';

const tvmazeCache = {};
let checkIntervalTimer = null;

export function recreateCheckInterval() {
  if (checkIntervalTimer) {
    clearInterval(checkIntervalTimer);
  }
  const hours = appState.appConfig.checkIntervalHours || 3;
  console.log(`[Auto-Download] Setting query interval to ${hours} hours.`);
  checkIntervalTimer = setInterval(checkAllAutoDownloads, hours * 60 * 60 * 1000);
}

function getAutoDownloadsPath() {
  return path.join(appState.appConfig.downloadDir, '.auto_downloads.json');
}

export function loadAutoDownloads() {
  const filePath = getAutoDownloadsPath();
  if (fs.existsSync(filePath)) {
    try {
      appState.autoDownloads = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`[Auto-Download] Loaded subscriptions from ${filePath} (${Object.keys(appState.autoDownloads).length} items)`);
    } catch (e) {
      console.error('Error loading auto downloads file:', e);
      appState.autoDownloads = {};
    }
  } else {
    appState.autoDownloads = {};
  }
}

export function saveAutoDownloads() {
  const filePath = getAutoDownloadsPath();
  try {
    if (!fs.existsSync(appState.appConfig.downloadDir)) {
      fs.mkdirSync(appState.appConfig.downloadDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(appState.autoDownloads, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving auto downloads file:', e);
  }
}

export function broadcastAutoDownloads() {
  broadcastToClients({ type: 'auto-downloads', data: appState.autoDownloads });
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

  const prefix = epMatch[1];
  const digits = epMatch[2];
  const padding = digits.length;
  const newEpStr = prefix + String(targetEpNum).padStart(padding, '0');

  const newSeriesStr = match[0].replace(epMatch[0], newEpStr);
  return originalFilename.replace(match[0], newSeriesStr);
}

function matchTagBased(templateFilename, resultFilename, targetSeason, targetEpisode, showTitle) {
  const parsedResult = parseFilename(resultFilename);
  if (!parsedResult.isSeries) return false;

  const se = parseSeasonEpisodeNumber(parsedResult.seasonEpisode);
  if (!se || se.season !== targetSeason || se.episode !== targetEpisode) {
    return false;
  }

  const normShowTitle = showTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normResultFile = resultFilename.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normResultFile.includes(normShowTitle)) {
    return false;
  }

  const cleanTemplate = templateFilename.replace(/[^a-zA-Z0-9]/g, ' ');
  const cleanResult = resultFilename.replace(/[^a-zA-Z0-9]/g, ' ');

  const RESOLUTIONS = ['2160p', '1080p', '720p', '4k', 'uhd', '576p', 'sd'];
  const LANGUAGES = ['german', 'english', 'french', 'multi', 'dl', 'dubbed', 'dual'];
  const SOURCES = ['web-dl', 'webrip', 'web', 'bluray', 'hdtv', 'dvdrip', 'bdrip', 'dsr'];
  const CODECS = ['x264', 'x265', 'h264', 'h265', 'hevc', 'av1'];

  const tagGroups = [RESOLUTIONS, LANGUAGES, SOURCES, CODECS];

  for (const group of tagGroups) {
    const templateTag = group.find(tag => {
      const regex = new RegExp(`\\b${tag}\\b`, 'i');
      return regex.test(cleanTemplate);
    });

    if (templateTag) {
      const regex = new RegExp(`\\b${templateTag}\\b`, 'i');
      if (!regex.test(cleanResult)) {
        return false;
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
  if (appState.autoDownloads[imdbId]) {
    if (!appState.autoDownloads[imdbId].failedEpisodes) {
      appState.autoDownloads[imdbId].failedEpisodes = {};
    }
    appState.autoDownloads[imdbId].failedEpisodes[String(episode)] = {
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
  if (appState.autoDownloads[imdbId] && appState.autoDownloads[imdbId].failedEpisodes) {
    if (appState.autoDownloads[imdbId].failedEpisodes[String(episode)]) {
      delete appState.autoDownloads[imdbId].failedEpisodes[String(episode)];
      saveAutoDownloads();
      broadcastAutoDownloads();
      console.log(`[Auto-Download] Cleared failure for episode ${episode} of IMDb ${imdbId}`);
    }
  }
}

export function checkDownloadsTimeout() {
  const now = Date.now();
  const timeoutMs = 20 * 60 * 1000;

  for (const [id, item] of appState.downloadQueue.entries()) {
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
        appState.downloadQueue.delete(id);
        broadcastDeletion(id);

        broadcastToClients({
          type: 'message',
          data: {
            id: id,
            text: `[Auto-Download] Download abgebrochen: Nach 20 Min kein Transfer begonnen.`
          }
        });

        setTimeout(checkAllAutoDownloads, 5000);
      }
    }
  }
}

export async function checkAllAutoDownloads() {
  console.log(`[Auto-Download] Starting auto-download check...`);
  loadAutoDownloads();

  const subscriptions = Object.values(appState.autoDownloads).filter(sub => sub.enabled);
  if (subscriptions.length === 0) {
    console.log(`[Auto-Download] No active subscriptions.`);
    return;
  }

  const mediaFiles = await getLocalFiles();
  for (const sub of subscriptions) {
    await checkSingleShow(sub, mediaFiles);
  }
}

export async function checkSingleShow(sub, mediaFiles) {
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

    const maxSeason = Math.max(...parsedFiles.map(x => x.season));
    const currentSeasonFiles = parsedFiles.filter(x => x.season === maxSeason);
    const maxEpisode = Math.max(...currentSeasonFiles.map(x => x.episode));

    console.log(`[Auto-Download] Current state for "${sub.title}": Season ${maxSeason}, Episode ${maxEpisode}. Total downloaded in season: ${currentSeasonFiles.length}`);

    const totalEpisodes = await getTvmazeEpisodeCount(sub.imdbId, maxSeason);
    if (totalEpisodes !== null && (currentSeasonFiles.length >= totalEpisodes || maxEpisode >= totalEpisodes)) {
      console.log(`[Auto-Download] Season ${maxSeason} of "${sub.title}" is complete (${currentSeasonFiles.length}/${totalEpisodes} episodes, maxEpisode: ${maxEpisode}). Stopping auto-download.`);
      appState.autoDownloads[sub.imdbId].enabled = false;
      saveAutoDownloads();

      broadcastAutoDownloads();
      return;
    }

    const downloadedEpisodes = new Set(currentSeasonFiles.map(x => x.episode));
    const limit = totalEpisodes !== null ? totalEpisodes : (maxEpisode + 5);
    const candidates = [];
    for (let ep = 1; ep <= limit; ep++) {
      if (!downloadedEpisodes.has(ep)) {
        candidates.push(ep);
      }
    }

    const isEpisodeDownloading = (season, episode) => {
      for (const item of appState.downloadQueue.values()) {
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

    const templateFile = currentSeasonFiles.find(x => x.episode === maxEpisode)?.file || currentSeasonFiles[0].file;
    const templateFilename = path.basename(templateFile.filename);

    sub.failedEpisodes = sub.failedEpisodes || {};
    let startedAnyDownload = false;

    for (const targetEpisode of candidates) {
      if (isEpisodeDownloading(maxSeason, targetEpisode)) {
        console.log(`[Auto-Download] Episode S${String(maxSeason).padStart(2, '0')}E${String(targetEpisode).padStart(2, '0')} for "${sub.title}" is already in the download queue.`);
        startedAnyDownload = true;
        break;
      }

      const failInfo = sub.failedEpisodes[String(targetEpisode)];
      if (failInfo) {
        const failedAt = new Date(failInfo.failedAt).getTime();
        const timeSinceFailure = Date.now() - failedAt;
        const retryThreshold = 20 * 60 * 1000;
        if (timeSinceFailure < retryThreshold) {
          console.log(`[Auto-Download] Skipping episode S${String(maxSeason).padStart(2, '0')}E${String(targetEpisode).padStart(2, '0')} for "${sub.title}" because it failed recently (${Math.round(timeSinceFailure / 60000)}m ago).`);
          continue;
        }
      }

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
        continue;
      }

      console.log(`[Auto-Download] FOUND MATCH for S${seasonStr}E${epStr}! Starting download for: ${match.filename}`);

      const downloadId = `${match.server}_${match.channel}_${match.botName}_${match.packNumber}_${match.filename.replace(/\s+/g, '_')}`;
      const resolvedUseSSL = appState.appConfig.useSSLByDefault;
      const resolvedPort = resolvedUseSSL ? appState.appConfig.ircPortDefaultSSL : appState.appConfig.ircPortDefaultNoSSL;

      let resolvedLocalAddress = undefined;
      if (appState.appConfig.tailscaleBypassIrc) {
        resolvedLocalAddress = getLocalIp(appState.appConfig);
        if (resolvedLocalAddress === '127.0.0.1') {
          resolvedLocalAddress = undefined;
        }
      }

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
        downloadDir: appState.appConfig.downloadDir,
        isAuto: true,
        localAddress: resolvedLocalAddress
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
        broadcastToClients({ type: 'message', data: { id: downloadId, text: data.text } });
      });

      appState.downloadQueue.set(downloadId, {
        downloader,
        isAuto: true,
        imdbId: sub.imdbId,
        season: maxSeason,
        episode: targetEpisode,
        startedAt: Date.now()
      });

      broadcastStatus(downloadId);
      downloader.start();

      clearEpisodeFailure(sub.imdbId, targetEpisode);

      broadcastToClients({
        type: 'message',
        data: {
          id: downloadId,
          text: `[Auto-Download] Neue Folge automatisch gestartet: ${match.filename}`
        }
      });

      startedAnyDownload = true;
      break;
    }
  } catch (subErr) {
    console.error(`[Auto-Download] Error processing "${sub.title}":`, subErr);
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

async function getLocalFiles(force = false) {
  return [];
}