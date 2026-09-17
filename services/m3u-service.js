import { appState } from '../state.js';
import path from 'path';

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generates an M3U8 playlist containing local files and IPTV streams
 * @param {string} baseUrl - e.g. "http://192.168.1.50:3000"
 * @returns {Promise<string>} M3U content
 */
export async function generateM3uPlaylist(baseUrl) {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const lines = [
    '#EXTM3U x-tvg-url="' + cleanBaseUrl + '/api/iptv/epg.xml"'
  ];

  // 1. Local Files
  const localList = appState.cachedMappedList || [];
  for (const item of localList) {
    const meta = item.metadata || {};
    const title = meta.title || path.parse(item.filename).name;
    const origCat = meta.originalCategory || meta.category || 'Videos';
    const groupTitle = `Lokal - ${origCat}`;
    const logo = meta.posterUrl ? (meta.posterUrl.startsWith('http') ? `${cleanBaseUrl}/api/media/${encodeURIComponent(meta.posterUrl)}` : meta.posterUrl) : '';
    const streamUrl = `${cleanBaseUrl}/api/media/${encodeURIComponent(item.filename)}`;
    const tvgName = meta.seasonEpisode ? `${title} (${meta.seasonEpisode})` : title;

    lines.push(`#EXTINF:-1 tvg-id="local_${Buffer.from(item.filename).toString('hex').slice(0, 12)}" tvg-name="${tvgName}" tvg-logo="${logo}" group-title="${groupTitle}",${tvgName}`);
    lines.push(streamUrl);
  }

  // 2. IPTV Live Channels
  const liveChannels = appState.cachedMappedLive || [];
  for (const chan of liveChannels) {
    const title = chan.title || 'Unbekannter Sender';
    const groupTitle = `Live TV - ${chan.subcategory || 'Sonstige'}`;
    const tvgId = chan.epgChannelId || chan.xtreamStreamId || '';
    const streamUrl = `${cleanBaseUrl}/api/media/${encodeURIComponent(chan.streamUrl)}`;

    lines.push(`#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${title}" group-title="${groupTitle}",${title}`);
    lines.push(streamUrl);
  }

  // 3. IPTV VOD Movies
  const vodMovies = appState.cachedMappedMovies || [];
  for (const movie of vodMovies) {
    const title = movie.title || 'Unbekannter Film';
    const groupTitle = `Filme - ${movie.subcategory || 'Sonstige'}`;
    const logo = movie.coverUrl ? `${cleanBaseUrl}/api/media/${encodeURIComponent(movie.coverUrl)}` : '';
    const streamUrl = `${cleanBaseUrl}/api/media/${encodeURIComponent(movie.streamUrl)}`;

    lines.push(`#EXTINF:-1 tvg-id="movie_${movie.xtreamStreamId || ''}" tvg-name="${title}" tvg-logo="${logo}" group-title="${groupTitle}",${title}`);
    lines.push(streamUrl);
  }

  return lines.join('\n') + '\n';
}

function toRelativePath(filePath) {
  if (!filePath) return '';
  const baseDir = path.resolve(appState.appConfig?.downloadDir || '');
  let p = filePath;
  if (baseDir && p.startsWith(baseDir)) {
    p = path.relative(baseDir, p);
  }
  return p.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Generates an M3U playlist for a single media item targeting client VLC streaming
 * @param {object} item - Media item with filename and optional metadata
 * @param {string} baseUrl - Base URL of PulseCast server e.g. "http://192.168.1.50:3000"
 * @returns {string} M3U content
 */
export function generateSingleItemM3u(item, baseUrl) {
  const cleanBaseUrl = (baseUrl || '').replace(/\/$/, '');
  const meta = item?.metadata || {};
  const rawFilename = item?.filename || 'media';
  const relPath = toRelativePath(rawFilename);
  const baseTitle = meta.title || path.parse(relPath).name;

  // Avoid duplicate (SxxExx) if baseTitle already contains seasonEpisode
  let tvgName = baseTitle;
  if (meta.seasonEpisode && !baseTitle.toLowerCase().includes(meta.seasonEpisode.toLowerCase())) {
    tvgName = `${baseTitle} (${meta.seasonEpisode})`;
  }

  const logo = meta.posterUrl ? (meta.posterUrl.startsWith('http') ? meta.posterUrl : `${cleanBaseUrl}/api/media/${encodeURIComponent(meta.posterUrl)}`) : '';
  const groupTitle = meta.originalCategory || meta.category || 'Media';
  const streamUrl = `${cleanBaseUrl}/api/media/stream/${encodeURIComponent(relPath)}`;

  const lines = [
    '#EXTM3U',
    `#EXTINF:-1 tvg-name="${tvgName}" tvg-logo="${logo}" group-title="${groupTitle}",${tvgName}`,
    streamUrl
  ];
  return lines.join('\n') + '\n';
}

/**
 * Generates an M3U playlist for a full TV series season targeting client VLC streaming
 * @param {string} seriesTitle - Title of the series
 * @param {number|string} seasonNum - Season number
 * @param {Array} episodes - List of episode media items
 * @param {string} baseUrl - Base URL of PulseCast server
 * @returns {string} M3U content
 */
export function generateSeasonM3u(seriesTitle, seasonNum, episodes, baseUrl) {
  const cleanBaseUrl = (baseUrl || '').replace(/\/$/, '');
  const sNum = parseInt(seasonNum, 10) || 1;
  const sTag = `S${String(sNum).padStart(2, '0')}`;

  const parseEpisodeNum = (ep) => {
    if (typeof ep?.episodeNum === 'number') return ep.episodeNum;
    if (typeof ep?.metadata?.episodeNum === 'number') return ep.metadata.episodeNum;
    const str = `${ep?.metadata?.seasonEpisode || ''} ${ep?.title || ''} ${ep?.metadata?.title || ''} ${ep?.filename || ''}`;
    const m = str.match(/(?:S\d{1,2}E(\d{1,2})|\d{1,2}x(\d{1,2})|Episode\s*(\d{1,2}))/i);
    return m ? parseInt(m[1] || m[2] || m[3], 10) : null;
  };

  const scoreCandidate = (ep) => {
    const fn = ep?.filename || '';
    let score = 0;
    // Prefer filenames that do NOT repeat the series title
    if (seriesTitle) {
      const escaped = seriesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = fn.match(new RegExp(escaped, 'gi'));
      if (matches && matches.length > 1) {
        score -= 100 * (matches.length - 1);
      }
    }
    // Prefer filenames that do NOT repeat SxxExx
    const seMatches = fn.match(/S\d{1,2}E\d{1,2}/gi);
    if (seMatches && seMatches.length > 1) {
      score -= 50 * (seMatches.length - 1);
    }
    // Penalize duplicate suffixes like _1, _2
    if (/_\d+\.[a-z0-9]+$/i.test(fn)) {
      score -= 20;
    }
    // Prefer shorter filenames
    score -= fn.length * 0.05;
    return score;
  };

  // Group and deduplicate by episode number
  const epMap = new Map();
  const unnumbered = [];

  for (const ep of episodes || []) {
    const epNum = parseEpisodeNum(ep);
    if (epNum !== null) {
      if (!epMap.has(epNum)) {
        epMap.set(epNum, ep);
      } else {
        const current = epMap.get(epNum);
        if (scoreCandidate(ep) > scoreCandidate(current)) {
          epMap.set(epNum, ep);
        }
      }
    } else {
      unnumbered.push(ep);
    }
  }

  // Sort deduplicated episodes by episode number
  const sortedEpisodes = Array.from(epMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(entry => ({ ...entry[1], detectedEpNum: entry[0] }))
    .concat(unnumbered);

  const lines = ['#EXTM3U'];

  for (const ep of sortedEpisodes) {
    const meta = ep?.metadata || {};
    const rawFilename = ep?.filename || '';
    const relPath = toRelativePath(rawFilename);

    let epTitle = (meta.title || ep.title || path.parse(relPath || 'episode').name || '').trim();
    // Strip redundant series title prefix if present in epTitle
    if (seriesTitle) {
      const escaped = seriesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const seriesBase = seriesTitle.replace(/\s*\(\d{4}\).*$/, '').trim();
      const escapedBase = seriesBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixRegex = new RegExp(`^(?:${escaped}|${escapedBase})(?:[\\s_]*\\(\\d{4}\\))?(?:[\\s_]*(?:DE|EN|US|GERMAN|GER))?[\\s\\-_:]*`, 'i');
      let prev;
      do {
        prev = epTitle;
        epTitle = epTitle.replace(prefixRegex, '').trim();
        epTitle = epTitle.replace(/^(?:S\d{1,2}E\d{1,2}|\d{1,2}x\d{1,2})[\s\-_:]*/i, '').trim();
      } while (epTitle !== prev && epTitle.length > 0);
    }

    const epNum = ep.detectedEpNum || parseEpisodeNum(ep) || 1;
    const eTag = `E${String(epNum).padStart(2, '0')}`;
    const sEp = `${sTag}${eTag}`;

    const displayTitle = epTitle ? `${seriesTitle} - ${sEp} - ${epTitle}` : `${seriesTitle} - ${sEp}`;
    const logo = meta.posterUrl ? (meta.posterUrl.startsWith('http') ? meta.posterUrl : `${cleanBaseUrl}/api/media/${encodeURIComponent(meta.posterUrl)}`) : '';
    const groupTitle = `${seriesTitle} - Staffel ${sNum}`;
    const streamUrl = `${cleanBaseUrl}/api/media/stream/${encodeURIComponent(relPath)}`;

    lines.push(`#EXTINF:-1 tvg-name="${displayTitle}" tvg-logo="${logo}" group-title="${groupTitle}",${displayTitle}`);
    lines.push(streamUrl);
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates an XMLTV EPG for available Live TV channels
 * @param {string} baseUrl
 * @returns {string} XMLTV content
 */
export function generateXmltvEpg(baseUrl) {
  const liveChannels = appState.cachedMappedLive || [];
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE tv SYSTEM "xmltv.dtd">', '<tv generator-info-name="PulseCast">'];

  for (const chan of liveChannels) {
    const channelId = chan.epgChannelId || chan.xtreamStreamId || chan.title;
    xml.push(`  <channel id="${escapeXml(channelId)}">`);
    xml.push(`    <display-name>${escapeXml(chan.title)}</display-name>`);
    xml.push('  </channel>');
  }

  // Add current dummy / available live programmes if present in cache
  const now = new Date();
  const startStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14) + ' +0000';
  const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const endStr = end.toISOString().replace(/[-:T]/g, '').slice(0, 14) + ' +0000';

  for (const chan of liveChannels) {
    const channelId = chan.epgChannelId || chan.xtreamStreamId || chan.title;
    xml.push(`  <programme start="${startStr}" stop="${endStr}" channel="${escapeXml(channelId)}">`);
    xml.push(`    <title lang="de">${escapeXml(chan.title)} Live</title>`);
    xml.push(`    <desc lang="de">Live Stream bereitgestellt von PulseCast</desc>`);
    xml.push('  </programme>');
  }

  xml.push('</tv>');
  return xml.join('\n') + '\n';
}
