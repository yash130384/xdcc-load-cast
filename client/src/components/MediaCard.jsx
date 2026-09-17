import React, { useState } from 'react';
import { HeartIcon, DownloadIcon, TrashIcon, PlayIcon } from './icons.jsx';
import { formatBytes, getPosterSrc, getDisplayTitle } from './utils.js';

const MediaCard = ({
  item,
  idx,
  onToggleFavorite,
  onDelete,
  onPlay,
  onCopyUrl,
  onShowEpg,
  onXtreamDownload,
  onSeriesClick
}) => {
  const [copied, setCopied] = useState(false);

  if (item.isGroup) {
    const title = getDisplayTitle(item);
    const posterUrl = item.posterUrl;
    const year = item.year;
    const cast = item.cast;
    const imdbLink = item.imdbId ? `https://www.imdb.com/title/${item.imdbId}` : null;
    const fileCount = item.files ? item.files.length : 0;

    return (
      <div
        className="media-card series-group-card"
        onClick={() => onSeriesClick(item.imdbId || item.title || (item.isXtream && item.xtreamSeriesId))}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div className="media-poster-container" style={{ position: 'relative' }}>
          <img
            src={getPosterSrc(posterUrl)}
            alt={title}
            className="media-poster"
            loading="lazy"
            style={{ display: posterUrl ? 'block' : 'none' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.media-poster-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="media-poster-fallback" style={{ display: posterUrl ? 'none' : 'flex' }}>
            <span className="media-poster-fallback-icon">📺</span>
            <span className="media-poster-fallback-title">{title}</span>
          </div>

          {year && <span className="media-badge-year">{year}</span>}
          <span className="media-badge-type">Serie</span>
          <span className="media-badge-episode">{fileCount} {fileCount === 1 ? 'Datei' : 'Dateien'}</span>

          <button
            className="btn-favorite"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: item.favorite ? 'var(--accent-red)' : 'rgba(255,255,255,0.7)',
              transition: 'transform 0.2s, background 0.2s',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}
            title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <HeartIcon filled={item.favorite} />
          </button>
        </div>

        <div className="media-card-body">
          <div className="media-card-details">
            <div className="media-card-title" title={title}>
              {title}
            </div>
            {cast && (
              <div className="media-card-cast" title={cast}>
                {cast}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                📂 Staffeln & Folgen anzeigen ({fileCount})
              </span>
              {imdbLink && (
                <a
                  href={imdbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="media-imdb-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⭐ IMDb
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta = item.metadata || {};
  const title = getDisplayTitle(item);
  const posterUrl = meta.posterUrl;
  const year = meta.year || null;
  const cast = meta.cast || null;
  const rawCategory = meta.category || 'Videos';
  const category = rawCategory === 'Sonstige' ? 'Videos' : rawCategory;
  const originalCategory = meta.originalCategory || category;
  const imdbLink = meta.imdbId ? `https://www.imdb.com/title/${meta.imdbId}` : null;

  let fallbackIcon = '📹';
  if (category === 'Filme' || originalCategory === 'Filme') fallbackIcon = '🎬';
  else if (category === 'Serien' || originalCategory === 'Serien') fallbackIcon = '📺';
  else if (category === 'Live TV' || originalCategory === 'Live TV') fallbackIcon = '📡';
  else if (category === 'Musik' || originalCategory === 'Musik') fallbackIcon = '🎵';

  const handleCopy = (e) => {
    e.stopPropagation();
    if (onCopyUrl) {
      onCopyUrl(item.filename, item);
    } else {
      const streamUrl = `${window.location.protocol}//${window.location.host}/api/media/stream/${encodeURIComponent(item.filename)}`;
      navigator.clipboard?.writeText(streamUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="media-card" style={{ position: 'relative' }}>
      <div className="media-poster-container" style={{ position: 'relative' }}>
        <img
          src={getPosterSrc(posterUrl)}
          alt={title}
          className="media-poster"
          loading="lazy"
          style={{ display: posterUrl ? 'block' : 'none' }}
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = e.target.parentElement.querySelector('.media-poster-fallback');
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="media-poster-fallback" style={{ display: posterUrl ? 'none' : 'flex' }}>
          <span className="media-poster-fallback-icon">{fallbackIcon}</span>
          <span className="media-poster-fallback-title">{title}</span>
        </div>

        {year && <span className="media-badge-year">{year}</span>}
        <span className="media-badge-type">
          {category === 'Serien' || originalCategory === 'Serien' ? 'Serie' : category === 'Filme' || originalCategory === 'Filme' ? 'Film' : category === 'Live TV' ? 'Live TV' : category === 'Musik' || originalCategory === 'Musik' ? 'Musik' : category === 'Hörbücher' || originalCategory === 'Hörbücher' ? 'Hörbuch' : 'Video'}
        </span>
        {meta.seasonEpisode && <span className="media-badge-episode">{meta.seasonEpisode}</span>}

        {(category === 'Filme' || originalCategory === 'Filme' || category === 'Serien' || originalCategory === 'Serien' || category === 'Live TV' || category === 'Hörbücher' || originalCategory === 'Hörbücher') && (
          <button
            className="btn-favorite"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: item.favorite ? 'var(--accent-red)' : 'rgba(255,255,255,0.7)',
              transition: 'transform 0.2s, background 0.2s',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
            }}
            title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <HeartIcon filled={item.favorite} />
          </button>
        )}
      </div>

      <div className="media-card-body">
        <div className="media-card-details">
          <div className="media-card-title" title={title}>
            {title}
          </div>
          {cast && (
            <div className="media-card-cast" title={cast}>
              {cast}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
            <span className="media-card-size">{formatBytes(item.sizeBytes)}</span>
            {imdbLink && (
              <a href={imdbLink} target="_blank" rel="noopener noreferrer" className="media-imdb-link">
                ⭐ IMDb
              </a>
            )}
          </div>
        </div>

        <div className="media-card-actions">
          {item.isLive && (
            <button
              className="btn btn-secondary btn-icon-only"
              style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 153, 0, 0.2)' }}
              title="EPG / Programm anzeigen"
              onClick={() => onShowEpg(item)}
            >
              📅
            </button>
          )}

          {/* Xtream Stream Download Action */}
          {item.isXtream && !item.isLive && (
            <button
              className="btn btn-primary"
              style={{ background: 'var(--grad-pink-purple, #ec4899)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              title="In Download-Warteschlange einreihen"
              onClick={() => onXtreamDownload(item)}
            >
              <DownloadIcon />
              <span>Laden</span>
            </button>
          )}

          {/* Local Item VLC Streaming Actions */}
          {!item.isXtream && (
            <>
              <button
                className="btn btn-danger btn-icon-only"
                title="Datei löschen"
                onClick={() => onDelete(item.filename)}
              >
                <TrashIcon />
              </button>

              <button
                className="btn btn-secondary btn-icon-only"
                title={copied ? "URL kopiert!" : "Stream-URL kopieren"}
                style={{ color: copied ? 'var(--accent-green, #10b981)' : 'var(--text-secondary)' }}
                onClick={handleCopy}
              >
                {copied ? '✓' : '📋'}
              </button>

              <button
                className="btn btn-primary"
                style={{ background: 'var(--grad-cyan-blue)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: '600' }}
                title="In VLC öffnen (.m3u Playlist herunterladen und VLC starten)"
                onClick={() => onPlay(item.filename, item)}
              >
                <PlayIcon />
                <span>In VLC öffnen</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;