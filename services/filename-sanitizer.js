/**
 * Sanitizes and normalizes stream filenames for movies and TV series episodes,
 * eliminating redundant series names, duplicate SxxExx tags, and illegal characters.
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeStreamFilename({ seriesTitle, title, seasonEpisode, extension = '.mp4' }) {
  // 1. Normalize extension
  let cleanExt = extension ? (extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`) : '.mp4';

  // 2. Clean raw title from existing video extensions
  let cleanTitle = (title || '').replace(/\.(mkv|mp4|avi|ts|mov|webm)$/i, '').trim();
  let cleanSeries = (seriesTitle || '').trim();

  // 3. Detect Season/Episode pattern (e.g. S04E06, 4x06)
  const seRegex = /(?:S(\d{1,2})E(\d{1,2})|(\d{1,2})x(\d{1,2}))/i;
  let canonicalSE = seasonEpisode;
  if (!canonicalSE) {
    const seMatch = cleanTitle.match(seRegex) || cleanSeries.match(seRegex);
    if (seMatch) {
      const s = seMatch[1] || seMatch[3];
      const e = seMatch[2] || seMatch[4];
      canonicalSE = `S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}`;
    }
  }

  // 4. Strip SxxExx from seriesTitle if present
  if (cleanSeries) {
    cleanSeries = cleanSeries.replace(seRegex, '').replace(/[\s\-_]+$/, '').trim();
  }

  // 5. Iteratively remove redundant series and seasonEpisode prefixes from cleanTitle
  if (cleanSeries) {
    const seriesBase = cleanSeries.replace(/\s*\(\d{4}\).*$/, '').trim();
    const seriesPattern = `(?:${escapeRegex(cleanSeries)}|${escapeRegex(seriesBase)})(?:[\\s_]*\\(\\d{4}\\))?(?:[\\s_]*(?:DE|EN|US|GERMAN|GER|DUBBED|DL|HD|UHD))?`;
    let prev;
    do {
      prev = cleanTitle;
      cleanTitle = cleanTitle.replace(new RegExp(`^${seriesPattern}[\\s\\-_:]*`, 'i'), '').trim();
      cleanTitle = cleanTitle.replace(/^(?:S\d{1,2}E\d{1,2}|\d{1,2}x\d{1,2})[\s\-_:]*/i, '').trim();
    } while (cleanTitle !== prev && cleanTitle.length > 0);
  } else {
    let prev;
    do {
      prev = cleanTitle;
      cleanTitle = cleanTitle.replace(/^(?:S\d{1,2}E\d{1,2}|\d{1,2}x\d{1,2})[\s\-_:]*/i, '').trim();
    } while (cleanTitle !== prev && cleanTitle.length > 0);
  }

  // 6. Final composition
  let finalBase;
  if (cleanSeries && canonicalSE) {
    finalBase = cleanTitle ? `${cleanSeries} - ${canonicalSE} - ${cleanTitle}` : `${cleanSeries} - ${canonicalSE}`;
  } else if (cleanSeries) {
    finalBase = cleanTitle ? `${cleanSeries} - ${cleanTitle}` : cleanSeries;
  } else {
    finalBase = cleanTitle || 'Stream_Download';
  }

  // 7. Sanitize invalid filesystem characters, collapse consecutive underscores and whitespace
  finalBase = finalBase.replace(/[\\/:*?"<>|]/g, '_').replace(/_+/g, '_').replace(/\s+/g, ' ').trim();
  return `${finalBase}${cleanExt}`;
}
