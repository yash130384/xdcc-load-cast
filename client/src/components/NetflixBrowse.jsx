import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPosterSrc } from './utils.js';

const NetflixBrowse = ({ onPlay, onSeriesClick, onToggleFavorite, settings }) => {
  const [categories, setCategories] = useState({
    continueWatching: [],
    neueFilme: [],
    neueSerien: [],
    lokaleFilme: [],
    lokaleSerien: [],
    streamFilme: [],
    streamSerien: [],
    liveTv: []
  });
  const [heroItem, setHeroItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const isXtreamEnabled = settings?.xtreamEnabled;

  const fetchItems = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const fetchTasks = [
        fetchItems('/api/media/continue-watching'),
        fetchItems('/api/media-library?category=Lokal_Filme&limit=50'),
        fetchItems('/api/media-library?category=Lokal_Serien&limit=50')
      ];

      if (isXtreamEnabled) {
        fetchTasks.push(fetchItems('/api/media-library?category=Filme&limit=50'));
        fetchTasks.push(fetchItems('/api/media-library?category=Serien&limit=50'));
        fetchTasks.push(fetchItems('/api/media-library?category=Live%20TV&limit=50'));
      } else {
        fetchTasks.push(Promise.resolve([]));
        fetchTasks.push(Promise.resolve([]));
        fetchTasks.push(Promise.resolve([]));
      }

      const [
        continueWatching,
        lokaleFilme,
        lokaleSerien,
        streamFilme,
        streamSerien,
        liveTv
      ] = await Promise.all(fetchTasks);

      // Merge for "Neue Filme" and "Neue Serien"
      const allFilme = [...lokaleFilme, ...streamFilme];
      const allSerien = [...lokaleSerien, ...streamSerien];
      
      const sortByMtime = (a, b) => (b.mtime || 0) - (a.mtime || 0);

      const neueFilme = [...allFilme].sort(sortByMtime).slice(0, 50);
      const neueSerien = [...allSerien].sort(sortByMtime).slice(0, 50);

      const newCategories = {
        continueWatching,
        neueFilme,
        neueSerien,
        lokaleFilme,
        lokaleSerien,
        streamFilme,
        streamSerien,
        liveTv
      };

      setCategories(newCategories);

      // Pick a random hero item from Neue Filme or Neue Serien
      const possibleHeroes = [...neueFilme, ...neueSerien].filter(
        item => item.metadata?.backdrop || item.metadata?.posterUrl
      );
      if (possibleHeroes.length > 0) {
        setHeroItem(possibleHeroes[Math.floor(Math.random() * possibleHeroes.length)]);
      }

      setLoading(false);
    };

    loadData();
  }, [isXtreamEnabled]);

  if (loading) {
    return (
      <div className="nb-loading-screen">
        <div className="nb-spinner"></div>
      </div>
    );
  }

  return (
    <div className="nb-container">
      {heroItem && <HeroBanner item={heroItem} onPlay={onPlay} onSeriesClick={onSeriesClick} />}
      
      <div className="nb-content">
        {categories.continueWatching.length > 0 && (
          <MediaRow 
            title="▶ Weiterschauen" 
            items={categories.continueWatching} 
            isContinueWatching={true}
            onPlay={onPlay}
            onSeriesClick={onSeriesClick}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        
        {categories.neueFilme.length > 0 && (
          <MediaRow title="🆕 Neue Filme" items={categories.neueFilme} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
        
        {categories.neueSerien.length > 0 && (
          <MediaRow title="🆕 Neue Serien" items={categories.neueSerien} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
        
        {categories.lokaleFilme.length > 0 && (
          <MediaRow title="💾 Lokale Filme" items={categories.lokaleFilme} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
        
        {categories.lokaleSerien.length > 0 && (
          <MediaRow title="💾 Lokale Serien" items={categories.lokaleSerien} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
        
        {isXtreamEnabled && categories.streamFilme.length > 0 && (
          <MediaRow title="🍿 Stream Filme" items={categories.streamFilme} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
        
        {isXtreamEnabled && categories.streamSerien.length > 0 && (
          <MediaRow title="📺 Stream Serien" items={categories.streamSerien} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
        
        {isXtreamEnabled && categories.liveTv.length > 0 && (
          <MediaRow title="📡 Live TV" items={categories.liveTv} onPlay={onPlay} onSeriesClick={onSeriesClick} onToggleFavorite={onToggleFavorite} />
        )}
      </div>
    </div>
  );
};

const HeroBanner = ({ item, onPlay, onSeriesClick }) => {
  const metadata = item.metadata || {};
  const backgroundUrl = getPosterSrc(metadata.backdrop || metadata.posterUrl || metadata.coverUrl || '');
  const title = metadata.title || item.title || item.filename;
  
  const handlePlayClick = () => {
    if (item.isGroup) {
      onSeriesClick(item.imdbId || item.title || (item.isXtream && item.xtreamSeriesId));
    } else {
      onPlay(item.filename, item);
    }
  };

  return (
    <div className="nb-hero">
      <div 
        className="nb-hero-background"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      ></div>
      <div className="nb-hero-vignette"></div>
      
      <div className="nb-hero-content">
        <h1 className="nb-hero-title">{title}</h1>
        <div className="nb-hero-meta">
          {metadata.year && <span className="nb-hero-year">{metadata.year}</span>}
          {metadata.genre && <span className="nb-hero-genre">{metadata.genre}</span>}
          {metadata.category && <span className="nb-hero-badge">{metadata.category}</span>}
        </div>
        <p className="nb-hero-description">
          {metadata.description ? (
            metadata.description.length > 200 
              ? metadata.description.substring(0, 200) + '...' 
              : metadata.description
          ) : ''}
        </p>
        <div className="nb-hero-buttons">
          <button className="nb-hero-btn nb-hero-play" onClick={handlePlayClick}>
            <span className="nb-hero-btn-icon">▶</span> Abspielen
          </button>
        </div>
      </div>
    </div>
  );
};

const MediaRow = ({ title, items, isContinueWatching = false, onPlay, onSeriesClick, onToggleFavorite }) => {
  const rowRef = useRef(null);

  const scrollLeft = () => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="nb-row">
      <h2 className="nb-row-title">{title}</h2>
      
      <div className="nb-row-container">
        <button className="nb-scroll-btn nb-scroll-left" onClick={scrollLeft}>
          ‹
        </button>
        
        <div className="nb-row-slider" ref={rowRef}>
          {items.map((item, index) => (
            <MediaCard 
              key={item.filename || index} 
              item={item} 
              isContinueWatching={isContinueWatching}
              onPlay={onPlay}
              onSeriesClick={onSeriesClick}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>

        <button className="nb-scroll-btn nb-scroll-right" onClick={scrollRight}>
          ›
        </button>
      </div>
    </div>
  );
};

const MediaCard = ({ item, isContinueWatching, onPlay, onSeriesClick, onToggleFavorite }) => {
  const metadata = item.metadata || {};
  
  const displayTitle = isContinueWatching && item.seriesTitle 
    ? `${item.seriesTitle} - ${item.episodeTitle || item.title || item.filename}`
    : metadata.title || item.title || item.filename;

  const posterUrl = getPosterSrc(metadata.posterUrl || metadata.backdrop || metadata.coverUrl || item.posterUrl || '');
  const progressPercentage = item.progress?.percentage || 0;

  const handleClick = () => {
    if (item.isGroup) {
      onSeriesClick(item.imdbId || item.title || (item.isXtream && item.xtreamSeriesId));
    } else {
      onPlay(item.filename, item);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(item);
    }
  };

  return (
    <div 
      className={`nb-card ${isContinueWatching ? 'nb-card-wide' : 'nb-card-tall'}`}
      onClick={handleClick}
    >
      <div className="nb-card-image-wrapper">
        {posterUrl ? (
          <img src={posterUrl} alt={displayTitle} className="nb-card-image" loading="lazy" />
        ) : (
          <div className="nb-card-fallback">
            <span className="nb-card-emoji">{item.isGroup ? '📺' : '🎬'}</span>
          </div>
        )}
        
        <div className="nb-card-overlay">
          <div className="nb-card-play-icon">▶</div>
        </div>

        {onToggleFavorite && !isContinueWatching && (
          <button 
            className={`nb-card-favorite-btn ${item.favorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            {item.favorite ? '♥' : '♡'}
          </button>
        )}

        {metadata.category && (
          <span className="nb-card-badge">{metadata.category}</span>
        )}
        
        {progressPercentage > 0 && progressPercentage < 100 && (
          <div className="nb-card-progress-bg">
            <div 
              className="nb-card-progress-bar" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="nb-card-info">
        <h3 className="nb-card-title">{displayTitle}</h3>
        {!isContinueWatching && metadata.year && (
          <span className="nb-card-year">{metadata.year}</span>
        )}
      </div>
    </div>
  );
};

export default NetflixBrowse;
