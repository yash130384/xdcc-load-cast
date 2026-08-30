import React from 'react';
import { PlayIcon, CloseIcon } from './icons.jsx';
import { getPosterSrc, formatDuration, getDisplayTitle } from './utils.js';

const ContinueWatchingRow = ({ items, onPlay, onToggleWatched }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="continue-watching-section" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>▶</span>
          <span>Weiterschauen</span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>{items.length} Medien</span>
      </div>

      <div
        className="continue-watching-scroll"
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          scrollbarWidth: 'thin'
        }}
      >
        {items.map((item, idx) => {
          const title = getDisplayTitle(item, false);
          const seriesTitle = item.seriesTitle || (item.isSeriesEpisode ? item.metadata?.originalCategory : '');
          const poster = getPosterSrc(item.posterUrl || item.metadata?.posterUrl || item.coverUrl);
          const progress = item.progress || {};
          const percentage = Math.min(100, Math.max(5, progress.percentage || 0));
          const remainingSec = Math.max(0, (progress.duration || 0) - (progress.position || progress.currentTime || 0));

          return (
            <div
              key={idx}
              className="continue-watching-card"
              style={{
                flex: '0 0 240px',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onClick={() => onPlay(item.filename, item)}
            >
              {/* Poster Thumbnail */}
              <div style={{ height: '135px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={poster}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(229, 9, 20, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}
                  >
                    <PlayIcon />
                  </div>
                </div>

                {/* Mark as watched / Remove button */}
                {onToggleWatched && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatched(item.filename, true);
                    }}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Als gesehen markieren"
                  >
                    <CloseIcon />
                  </button>
                )}

                {/* Netflix Red Progress Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: '#e50914'
                    }}
                  />
                </div>
              </div>

              {/* Details Body */}
              <div style={{ padding: '0.6rem 0.8rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  <span>{seriesTitle || 'Film'}</span>
                  {remainingSec > 0 && <span>Noch {formatDuration(remainingSec)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatchingRow;
