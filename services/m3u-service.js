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
