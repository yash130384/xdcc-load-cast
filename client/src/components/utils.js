export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
  if (!seconds || seconds === Infinity) return '--:--';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export function highlightMatch(filename, query) {
  if (!query || !query.trim()) return filename;
  try {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return filename.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="hit">$1</span>');
  } catch (e) {
    return filename;
  }
}

export const getPosterSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/media/${encodeURIComponent(url)}`;
  }
  return url;
};

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatMediaTitle(raw) {
  if (!raw || typeof raw !== 'string') return '';
  
  // Strip directory paths
  let cleaned = raw.split('/').pop().split('\\').pop();

  // If Xtream format with numeric ID prefix like 12345_Movie_Title.mp4, remove the leading ID
  cleaned = cleaned.replace(/^\d+_+/, '');

  // Strip extension
  cleaned = cleaned.replace(/\.(mp4|mkv|avi|mov|ts|webm|flac|mp3|m4a|m4b|mpg|mpeg)$/i, '');

  // Replace dots, underscores with spaces
  cleaned = cleaned.replace(/[._]/g, ' ');

  // Clean release tags like 1080p, BluRay, x264, etc.
  const tags = [
    '2160p', '1080p', '720p', '480p', '4k', 'uhd', 'bluray', 'bdrip', 'brrip', 
    'hdtv', 'webrip', 'web-dl', 'webdl', 'dvdrip', 'x264', 'h264', 'x265', 'h265', 
    'hevc', 'aac', 'dd5.1', 'dts', 'german', 'english', 'multi', 'dl', 'dubbed', 'proper', 'repack'
  ];
  for (const tag of tags) {
    const pattern = new RegExp(`\\b${tag}\\b.*$`, 'i');
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean multiple whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || raw;
}

export function getDisplayTitle(item, isContinueWatching = false) {
  if (!item) return '';

  if (isContinueWatching && item.seriesTitle) {
    const ep = item.episodeTitle || formatMediaTitle(item.title || item.filename);
    return `${item.seriesTitle} - ${ep}`;
  }

  const metaTitle = item.metadata?.title;
  if (metaTitle && metaTitle !== 'Unbekannte Serie' && metaTitle !== 'Unbekannter Film') {
    return metaTitle;
  }

  if (item.title && item.title !== 'Unbekannte Serie' && item.title !== 'Unbekannter Film') {
    return item.title;
  }

  return formatMediaTitle(item.filename || '');
}