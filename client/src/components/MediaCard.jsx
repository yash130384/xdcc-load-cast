import React from 'react';
import { HeartIcon, DownloadIcon, TrashIcon, PlayIcon, CastIcon, PauseIcon } from './icons.jsx';
import { formatBytes, formatDuration, getPosterSrc } from './utils.js';

const MediaCard = ({ item, idx, activeCasts, pendingCasts, onToggleFavorite, onDelete, onPlay, onCast, onCastControl, onStopCast, onShowEpg, onXtreamDownload, onSeriesClick }) => {
  if (item.isGroup) {
    const title = item.title;
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
                📂 Anzeigen ({fileCount})
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

  const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
  const isPending = !!pendingCasts[item.filename];

  const meta = item.metadata || {};
  const title = meta.title || item.filename;
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
          {item.isXtream && !item.isLive && (
            <button
              className="btn btn-secondary btn-icon-only"
              style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 153, 0, 0.2)' }}
              title="Herunterladen"
              onClick={() => onXtreamDownload(item)}
            >
              <DownloadIcon />
            </button>
          )}
          {!item.isXtream && (
            <button
              className="btn btn-danger btn-icon-only"
              title="Datei löschen"
              onClick={() => onDelete(item.filename)}
            >
              <TrashIcon />
            </button>
          )}
          <button
            className="btn btn-primary btn-icon-only"
            style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
            title="Abspielen"
            onClick={() => onPlay(item.filename, item)}
          >
            <PlayIcon />
          </button>
          <button
            className="btn btn-secondary btn-icon-only"
            style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
            title="Auf TV streamen (Cast)"
            disabled={isPending}
            onClick={() => onCast(item)}
          >
            {isPending ? <span className="spinner">⏳</span> : <CastIcon />}
          </button>
        </div>

        {activeCastForFile && (
          <div style={{
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginTop: '0.5rem',
            color: 'var(--text-primary)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                📺 Streamt auf {activeCastForFile.device}
              </span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                {activeCastForFile.playerState || 'Verbinden'}
              </span>
            </div>

            {activeCastForFile.duration > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <input
                  type="range"
                  min={0}
                  max={activeCastForFile.duration}
                  value={activeCastForFile.currentTime || 0}
                  onChange={(e) => onCastControl(activeCastForFile.device, 'seek', e.target.value)}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    height: '4px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                  <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
              {activeCastForFile.playerState === 'PAUSED' ? (
                <button
                  className="btn btn-secondary btn-icon-only"
                  style={{ padding: '0.2rem', height: 'auto', minWidth: '26px' }}
                  onClick={() => onCastControl(activeCastForFile.device, 'resume')}
                  title="Wiedergabe fortsetzen"
                >
                  <PlayIcon />
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-icon-only"
                  style={{ padding: '0.2rem', height: 'auto', minWidth: '26px' }}
                  onClick={() => onCastControl(activeCastForFile.device, 'pause')}
                  title="Wiedergabe pausieren"
                >
                  <PauseIcon />
                </button>
              )}

              <button
                className="btn btn-danger"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', marginLeft: 'auto' }}
                onClick={() => onStopCast(activeCastForFile.device)}
              >
                Stoppen
              </button>
            </div>
          </div>
        )}

        {isPending && !activeCastForFile && (
          <div style={{
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '8px',
            padding: '0.4rem 0.6rem',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-secondary)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <span><span className="spinner">⏳</span> Verbindung wird aufgebaut...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaCard;