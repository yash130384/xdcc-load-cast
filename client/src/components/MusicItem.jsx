import React from 'react';
import { HeartIcon, TrashIcon, PlayIcon, CastIcon, PauseIcon } from './icons.jsx';
import { formatBytes, formatDuration, getPosterSrc } from './utils.js';

const MusicItem = ({ item, idx, activeCasts, pendingCasts, onToggleFavorite, onDelete, onPlay, onCast, onCastControl, onStopCast }) => {
  const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
  const isPending = !!pendingCasts[item.filename];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div className="music-item">
        <div className="music-info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="music-icon" style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }}>
            {item.metadata?.posterUrl ? (
              <img 
                src={getPosterSrc(item.metadata.posterUrl)} 
                alt="Cover" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span style={{ fontSize: '1.2rem' }}>🎵</span>
            )}
          </div>
          <div className="music-details">
            <div className="music-title" title={item.filename} style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              {item.metadata?.artist && item.metadata.artist !== 'Unbekannter Künstler' && (
                <span style={{ color: 'var(--accent-cyan)', marginRight: '0.35rem', fontWeight: 'bold' }}>{item.metadata.artist} -</span>
              )}
              {item.metadata?.title || item.filename}
            </div>
            <div className="music-meta" style={{ fontSize: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', color: 'var(--text-secondary)' }}>
              {item.metadata?.album && item.metadata.album !== 'Unbekanntes Album' && (
                <>
                  <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{item.metadata.album}</span>
                  <span>&bull;</span>
                </>
              )}
              {item.metadata?.year && (
                <>
                  <span>{item.metadata.year}</span>
                  <span>&bull;</span>
                </>
              )}
              {item.metadata?.genre && item.metadata.genre !== 'Musik' && (
                <>
                  <span style={{ color: 'var(--accent-blue)', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.7rem' }}>{item.metadata.genre}</span>
                  <span>&bull;</span>
                </>
              )}
              <span className="music-size">{formatBytes(item.sizeBytes)}</span>
              <span>&bull;</span>
              <span>{new Date(item.mtime).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="music-actions">
          <button
            className="btn btn-secondary btn-icon-only btn-favorite"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            style={{
              color: item.favorite ? 'var(--accent-red)' : 'rgba(255,255,255,0.7)',
              borderColor: item.favorite ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255,255,255,0.1)',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
            title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <HeartIcon filled={item.favorite} />
          </button>
          {!item.isXtream && (
            <button 
              className="btn btn-danger btn-icon-only" 
              title="Datei von Festplatte löschen"
              onClick={() => onDelete(item.filename)}
            >
              <TrashIcon />
            </button>
          )}
          <button 
            className="btn btn-primary btn-icon-only" 
            style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
            title="Lokal abspielen"
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
      </div>

      {activeCastForFile && (
        <div style={{
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              📺 Streamt auf {activeCastForFile.device}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {activeCastForFile.playerState || 'Verbinden'}
            </span>
          </div>

          {activeCastForFile.duration > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
            {activeCastForFile.playerState === 'PAUSED' ? (
              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                onClick={() => onCastControl(activeCastForFile.device, 'resume')}
                title="Wiedergabe fortsetzen"
              >
                <PlayIcon />
              </button>
            ) : (
              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                onClick={() => onCastControl(activeCastForFile.device, 'pause')}
                title="Wiedergabe pausieren"
              >
                <PauseIcon />
              </button>
            )}
            
            <button 
              className="btn btn-danger" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}
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
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)'
        }}>
          <span><span className="spinner">⏳</span> Verbindung wird aufgebaut...</span>
        </div>
      )}
    </div>
  );
};

export default MusicItem;