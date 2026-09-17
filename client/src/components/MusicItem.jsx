import React, { useState } from 'react';
import { HeartIcon, TrashIcon, PlayIcon } from './icons.jsx';
import { formatBytes, getPosterSrc } from './utils.js';

const MusicItem = ({ item, idx, onToggleFavorite, onDelete, onPlay, onCopyUrl }) => {
  const [copied, setCopied] = useState(false);

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
          <button
            className="btn btn-secondary btn-icon-only"
            title={copied ? "Kopiert!" : "Stream-URL kopieren"}
            onClick={handleCopy}
            style={{
              color: copied ? 'var(--accent-green, #10b981)' : 'var(--text-secondary)',
              borderColor: copied ? 'var(--accent-green, #10b981)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {copied ? '✓' : '🔗'}
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
            title="In VLC öffnen"
            onClick={() => onPlay(item.filename, item)}
          >
            <PlayIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicItem;