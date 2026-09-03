import React, { useState, useEffect, useRef } from 'react';
import { getPosterSrc, getDisplayTitle } from './utils.js';
import { SettingsIcon } from './icons.jsx';
import OutputDeviceSelector from './OutputDeviceSelector.jsx';

const PulseCastLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))' }}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-cyan)" />
        <stop offset="100%" stopColor="var(--accent-blue)" />
      </linearGradient>
    </defs>
    <path d="M2 12h3l2-5 3 10 2-7 2 5 2-3h3" />
    <path d="M15 5a8 8 0 0 1 5 5" strokeWidth="2" opacity="0.8" />
    <path d="M17 3a11 11 0 0 1 6 6" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

const NetflixBrowse = ({
  onPlay,
  onSeriesClick,
  onToggleFavorite,
  settings,
  onOpenAdvanced,
  selectedOutputDevice = 'local',
  onSelectOutputDevice,
  castDevices = [],
  loadingDevices = false,
  onRefreshDevices,
  activeCasts = []
}) => {
  const [activeTab, setActiveTab] = useState('Lokal');
  const [activeSubTab, setActiveSubTab] = useState('Filme'); // Filme, Serien
  const [loading, setLoading] = useState(false);
  
  const [heroItem, setHeroItem] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  
  // Rows data: array of { title, items }
  const [rowsData, setRowsData] = useState([]);

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
      
      // Fetch continue watching always
      const cw = await fetchItems('/api/media/continue-watching');
      
      let items = [];
      let mappedRows = [];
      
      if (activeTab === 'Lokal') {
        const cat = activeSubTab === 'Filme' ? 'Lokal_Filme' : 'Lokal_Serien';
        items = await fetchItems(`/api/media-library?category=${cat}&limit=2000`);
      } else if (activeTab === 'Stream') {
        const cat = activeSubTab === 'Filme' ? 'Filme' : 'Serien';
        if (isXtreamEnabled) items = await fetchItems(`/api/media-library?category=${cat}&limit=2000`);
      } else if (activeTab === 'IPTV') {
        if (isXtreamEnabled) items = await fetchItems(`/api/media-library?category=Live%20TV&limit=2000`);
      }

      // Filter Continue Watching for the current tab
      const isStreamTab = activeTab === 'Stream' || activeTab === 'IPTV';
      const filteredCw = cw.filter(item => (!!item.isXtream) === isStreamTab);
      setContinueWatching(filteredCw);

      if (items.length > 0) {
        // 1. Newest 50 row if not IPTV
        if (activeTab !== 'IPTV') {
          const newest50 = [...items].sort((a, b) => (b.mtime || 0) - (a.mtime || 0)).slice(0, 50);
          if (newest50.length > 0) {
            mappedRows.push({
              title: `🆕 NEWEST (${newest50.length})`,
              items: newest50
            });
          }
        }

        // 2. Group by subcategory
        const grouped = {};
        const getSub = (it) => {
           if (activeTab === 'IPTV') return it.metadata?.category || 'Sonstige';
           return it.metadata?.subcategory || it.subcategory || 'Sonstige';
        };
        
        items.forEach(it => {
          const sub = getSub(it);
          if (!grouped[sub]) grouped[sub] = [];
          grouped[sub].push(it);
        });

        // Convert to rows array
        const subcatRows = Object.keys(grouped).sort().map(key => ({
          title: key === 'Sonstige' ? 'Weitere' : key,
          items: grouped[key].sort((a,b) => (b.mtime || 0) - (a.mtime || 0))
        }));

        // Sort so "Weitere" is last
        subcatRows.sort((a,b) => {
          if (a.title === 'Weitere') return 1;
          if (b.title === 'Weitere') return -1;
          return a.title.localeCompare(b.title);
        });

        mappedRows.push(...subcatRows);

        // Set hero to a random item that has a backdrop/poster
        const possibleHeroes = items.filter(it => it.metadata?.backdrop || it.metadata?.posterUrl || it.coverUrl);
        if (possibleHeroes.length > 0) {
          setHeroItem(possibleHeroes[Math.floor(Math.random() * possibleHeroes.length)]);
        } else {
          setHeroItem(items[0]);
        }
      } else {
        setHeroItem(null);
      }

      setRowsData(mappedRows);
      setLoading(false);
    };

    loadData();
  }, [activeTab, activeSubTab, isXtreamEnabled]);

  return (
    <div className="nb-container">
      {/* Navbar */}
      <div className="nb-navbar">
        <div className="nb-nav-left">
          <div className="nb-brand">
            <PulseCastLogo />
            <span>PulseCast</span>
          </div>
          <button className={`nb-nav-link ${activeTab === 'Lokal' ? 'active' : ''}`} onClick={() => setActiveTab('Lokal')}>Lokal</button>
          <button className={`nb-nav-link ${activeTab === 'Stream' ? 'active' : ''}`} onClick={() => setActiveTab('Stream')}>Stream</button>
          <button className={`nb-nav-link ${activeTab === 'IPTV' ? 'active' : ''}`} onClick={() => setActiveTab('IPTV')}>IPTV</button>
        </div>
        <div className="nb-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <OutputDeviceSelector
            selectedDevice={selectedOutputDevice}
            onSelectDevice={onSelectOutputDevice}
            castDevices={castDevices}
            loadingDevices={loadingDevices}
            onRefreshDevices={onRefreshDevices}
            activeCasts={activeCasts}
          />
          <button className="nb-settings-btn" onClick={onOpenAdvanced} title="System & Einstellungen">
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Sub Navbar for Filme/Serien */}
      {(activeTab === 'Lokal' || activeTab === 'Stream') && (
        <div className="nb-subnav">
          <button className={`nb-subnav-link ${activeSubTab === 'Filme' ? 'active' : ''}`} onClick={() => setActiveSubTab('Filme')}>Filme</button>
          <button className={`nb-subnav-link ${activeSubTab === 'Serien' ? 'active' : ''}`} onClick={() => setActiveSubTab('Serien')}>Serien</button>
        </div>
      )}

      {loading ? (
        <div className="nb-loading-screen">
          <div className="nb-spinner"></div>
        </div>
      ) : (
        <>
          {heroItem && <HeroBanner item={heroItem} onPlay={onPlay} onSeriesClick={onSeriesClick} />}
          
          <div className="nb-content">
            {continueWatching.length > 0 && (
              <MediaRow 
                title="▶ Weiterschauen" 
                items={continueWatching} 
                isContinueWatching={true}
                onPlay={onPlay}
                onSeriesClick={onSeriesClick}
                onToggleFavorite={onToggleFavorite}
              />
            )}

            {rowsData.length > 0 ? (
              rowsData.map((row, idx) => (
                <MediaRow 
                  key={idx}
                  title={row.title} 
                  items={row.items} 
                  onPlay={onPlay} 
                  onSeriesClick={onSeriesClick} 
                  onToggleFavorite={onToggleFavorite} 
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                <h2>Keine Medien gefunden</h2>
                <p>Unter dieser Kategorie gibt es aktuell keine Inhalte.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const HeroBanner = ({ item, onPlay, onSeriesClick }) => {
  const metadata = item.metadata || {};
  const backgroundUrl = getPosterSrc(metadata.backdrop || metadata.posterUrl || metadata.coverUrl || item.coverUrl || item.posterUrl || '');
  const title = getDisplayTitle(item);
  
  const handlePlayClick = () => {
    if (item.isGroup) {
      onSeriesClick(item);
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
  const displayTitle = getDisplayTitle(item, isContinueWatching);

  const posterUrl = getPosterSrc(metadata.posterUrl || metadata.backdrop || metadata.coverUrl || item.posterUrl || item.coverUrl || '');
  const progressPercentage = item.progress?.percentage || 0;

  const handleClick = () => {
    if (item.isGroup) {
      onSeriesClick(item);
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
