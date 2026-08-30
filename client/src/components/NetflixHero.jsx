import React from 'react';
import { PlayIcon, HeartIcon, DownloadIcon } from './icons.jsx';
import { getPosterSrc } from './utils.js';

const NetflixHero = ({ item, onPlay, onSeriesClick, onToggleFavorite, onDownload }) => {
  if (!item) return null;

  const title = item.displayTitle || item.title || item.metadata?.title || item.filename;
  const poster = getPosterSrc(item.displayPoster || item.posterUrl || item.metadata?.posterUrl || item.coverUrl);
  const category = item.metadata?.originalCategory || item.category || 'Film';
  const year = item.metadata?.year || item.year || '';
  const cast = item.metadata?.cast || item.cast || '';
  const isFav = !!item.favorite;

  return (
    <div
      className="netflix-hero-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '380px',
        minHeight: '320px',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '2rem',
        background: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 30%, rgba(15, 23, 42, 0.6) 70%, rgba(15, 23, 42, 0.2)), url(${poster}) center/cover no-repeat`,
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        padding: '2.5rem'
      }}
    >
      <div style={{ maxWidth: '600px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            backgroundColor: '#e50914',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {item.isGroup ? 'Serie' : category}
          </span>
          {year && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{year}</span>}
          {item.isXtream && <span style={{ color: 'var(--accent-cyan, #06b6d4)', fontSize: '0.85rem', fontWeight: '500' }}>• IPTV Stream</span>}
        </div>

        <h1 style={{
          margin: 0,
          fontSize: '2.2rem',
          fontWeight: '800',
          color: '#fff',
          lineHeight: '1.15',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)'
        }}>
          {title}
        </h1>

        {cast && (
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.8)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {cast}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (item.isGroup && onSeriesClick) {
                onSeriesClick(item.xtreamSeriesId || item.filename);
              } else {
                onPlay(item.filename, item);
              }
            }}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#fff',
              color: '#000',
              fontWeight: '700',
              fontSize: '1rem',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255,255,255,0.3)'
            }}
          >
            <PlayIcon />
            <span>{item.isGroup ? 'Episoden ansehen' : 'Abspielen'}</span>
          </button>

          {item.isGroup && onSeriesClick && (
            <button
              onClick={() => onSeriesClick(item.xtreamSeriesId || item.filename)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontWeight: '600',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none'
              }}
            >
              <span>ℹ Weitere Infos</span>
            </button>
          )}

          {item.isXtream && onDownload && !item.isGroup && (
            <button
              onClick={() => onDownload(item)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: 'none'
              }}
              title="Auf Server herunterladen"
            >
              <DownloadIcon />
              <span>Offline laden</span>
            </button>
          )}

          <button
            onClick={() => onToggleFavorite && onToggleFavorite(item.filename || item.xtreamStreamId || item.xtreamSeriesId, !isFav)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
            title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <HeartIcon filled={isFav} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetflixHero;
