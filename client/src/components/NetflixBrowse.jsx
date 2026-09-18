import React, { useState, useEffect, useRef } from 'react';
import { getPosterSrc, getDisplayTitle } from './utils.js';
import { SettingsIcon } from './icons.jsx';

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

const LockIcon = ({ size = 18, style = {} }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const pinStyles = `
.nb-pin-screen {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  position: relative;
  z-index: 10;
}
.nb-pin-card {
  box-sizing: border-box;
}
.nb-pin-inline-card {
  background: rgba(13, 19, 34, 0.92);
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 3rem 2.5rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
  animation: nbFadeIn 0.25s ease-out;
}
.nb-pin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 10, 19, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: nbFadeIn 0.2s ease-out;
}
.nb-pin-modal-card {
  background: #0d1322;
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.2);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
  animation: nbSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.nb-pin-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9ca3af);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  border-radius: 4px;
  transition: color 0.2s;
}
.nb-pin-modal-close:hover {
  color: #fff;
}
.nb-pin-lock-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
  margin-bottom: 1.25rem;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);
}
.nb-pin-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}
.nb-pin-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary, #9ca3af);
  margin-bottom: 1.75rem;
  line-height: 1.45;
}
.nb-pin-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}
.nb-pin-input-wrap {
  width: 100%;
  max-width: 260px;
}
.nb-pin-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  font-size: 1.5rem;
  letter-spacing: 0.45em;
  text-align: center;
  background: rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-family: var(--font-mono, monospace);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.nb-pin-input:focus {
  border-color: var(--accent-cyan, #06b6d4);
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.3);
}
.nb-pin-error-msg {
  color: var(--accent-red, #ef4444);
  font-size: 0.84rem;
  font-weight: 500;
  margin-top: -0.4rem;
}
.nb-pin-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 260px;
  margin-top: 0.25rem;
}
.nb-pin-btn-submit {
  flex: 1;
  padding: 0.65rem 1.25rem;
  background: var(--grad-cyan-blue, linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%));
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.nb-pin-btn-submit:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}
.nb-pin-btn-cancel {
  padding: 0.65rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-secondary, #9ca3af);
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.nb-pin-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.nb-pin-trigger-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary, #9ca3af);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, color 0.2s;
}
.nb-pin-trigger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: scale(1.05);
}
@keyframes nbFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes nbSlideUp {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

const PinInputCard = ({
  pinInput,
  onPinChange,
  onSubmit,
  pinError,
  onCancel,
  cancelText = 'Abbrechen',
  title = 'PIN erforderlich',
  subtitle = 'Bitte 6-stellige PIN eingeben, um lokale Medien freizuschalten.',
  isModal = false,
  onCloseModal
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`nb-pin-card ${isModal ? 'nb-pin-modal-card' : 'nb-pin-inline-card'}`}>
      {isModal && (
        <button
          type="button"
          className="nb-pin-modal-close"
          onClick={onCloseModal}
          title="Schließen"
        >
          ✕
        </button>
      )}
      <div className="nb-pin-lock-badge">
        <LockIcon size={isModal ? 26 : 32} />
      </div>
      <h2 className="nb-pin-title">{title}</h2>
      <p className="nb-pin-subtitle">{subtitle}</p>

      <form onSubmit={onSubmit} className="nb-pin-form">
        <div className="nb-pin-input-wrap">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            value={pinInput}
            onChange={onPinChange}
            placeholder="••••••"
            className="nb-pin-input"
          />
        </div>

        {pinError && <div className="nb-pin-error-msg">{pinError}</div>}

        <div className="nb-pin-actions">
          <button type="submit" className="nb-pin-btn-submit">
            Entsperren
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="nb-pin-btn-cancel">
              {cancelText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const NetflixBrowse = ({
  showLocalFiles = false,
  toggleLocalFiles,
  onPlay,
  onDownloadStream,
  onCopyUrl,
  onSeriesClick,
  onToggleFavorite,
  settings,
  onOpenAdvanced
}) => {
  const [activeTab, setActiveTab] = useState(() => (showLocalFiles ? 'Lokal' : 'Stream'));
  const [activeSubTab, setActiveSubTab] = useState('Filme'); // Filme, Serien
  const [loading, setLoading] = useState(false);
  
  const [heroItem, setHeroItem] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  
  // Rows data: array of { title, items }
  const [rowsData, setRowsData] = useState([]);

  // PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const isXtreamEnabled = settings?.xtreamEnabled;

  const handleUnlock = () => {
    if (typeof toggleLocalFiles === 'function') {
      toggleLocalFiles(true);
    }
    setPinInput('');
    setPinError('');
    setShowPinModal(false);
    setActiveTab('Lokal');
  };

  const handlePinChange = (e) => {
    const val = e.target.value;
    setPinInput(val);
    setPinError('');
    if (val === '009981') {
      handleUnlock();
    } else if (val.length >= 6) {
      setPinError('Falsche PIN. Bitte erneut versuchen.');
    }
  };

  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === '009981') {
      handleUnlock();
    } else {
      setPinError('Falsche PIN. Bitte erneut versuchen.');
    }
  };

  const fetchItems = async (url) => {
    // Only fetch local content if showLocalFiles is true
    if (!showLocalFiles && (url.includes('Lokal') || url.includes('category=Lokal'))) {
      return [];
    }
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
      // If user selected Lokal but showLocalFiles is false, do not fetch or display local content
      if (activeTab === 'Lokal' && !showLocalFiles) {
        setHeroItem(null);
        setContinueWatching([]);
        setRowsData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Fetch continue watching always
      const cw = await fetchItems('/api/media/continue-watching');
      
      let items = [];
      let mappedRows = [];
      
      if (activeTab === 'Lokal') {
        if (showLocalFiles) {
          const cat = activeSubTab === 'Filme' ? 'Lokal_Filme' : 'Lokal_Serien';
          items = await fetchItems(`/api/media-library?category=${cat}&limit=2000`);
        }
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
  }, [activeTab, activeSubTab, isXtreamEnabled, showLocalFiles]);

  return (
    <div className="nb-container">
      <style>{pinStyles}</style>

      {/* Sub-Filterbar für Entdecken */}
      <div className="nb-navbar">
        <div className="nb-nav-left">
          <button
            className={`nb-nav-link ${activeTab === 'Stream' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('Stream');
              setShowPinModal(false);
            }}
          >
            ☁️ Stream
          </button>
          <button
            className={`nb-nav-link ${activeTab === 'Lokal' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('Lokal');
              setPinError('');
            }}
          >
            💾 Lokal {!showLocalFiles && <span style={{ display: 'inline-flex', verticalAlign: 'middle', opacity: 0.6, marginLeft: '4px' }}><LockIcon size={12} /></span>}
          </button>
          {isXtreamEnabled && (
            <button
              className={`nb-nav-link ${activeTab === 'IPTV' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('IPTV');
                setShowPinModal(false);
              }}
            >
              📡 IPTV
            </button>
          )}
        </div>
        <div className="nb-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {((activeTab === 'Lokal' && showLocalFiles) || activeTab === 'Stream') && (
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '0.2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                className={`nb-subnav-pill ${activeSubTab === 'Filme' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('Filme')}
                style={{
                  background: activeSubTab === 'Filme' ? 'var(--grad-cyan-blue)' : 'transparent',
                  color: activeSubTab === 'Filme' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Filme
              </button>
              <button
                className={`nb-subnav-pill ${activeSubTab === 'Serien' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('Serien')}
                style={{
                  background: activeSubTab === 'Serien' ? 'var(--grad-cyan-blue)' : 'transparent',
                  color: activeSubTab === 'Serien' ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Serien
              </button>
            </div>
          )}
          {!showLocalFiles && (
            <button
              className="nb-pin-trigger-btn"
              onClick={() => {
                setShowPinModal(true);
                setPinError('');
                setPinInput('');
              }}
              title="Lokale Medien mit PIN entsperren"
            >
              <LockIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Discreet PIN Modal */}
      {showPinModal && !showLocalFiles && (
        <div
          className="nb-pin-modal-overlay"
          onClick={() => {
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PinInputCard
              isModal={true}
              onCloseModal={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError('');
              }}
              pinInput={pinInput}
              onPinChange={handlePinChange}
              onSubmit={handlePinSubmit}
              pinError={pinError}
              onCancel={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError('');
              }}
              cancelText="Abbrechen"
              title="Lokale Medien entsperren"
              subtitle="Gib die 6-stellige PIN ein, um lokale Inhalte freizuschalten."
            />
          </div>
        </div>
      )}

      {/* Content Section */}
      {activeTab === 'Lokal' && !showLocalFiles ? (
        <div className="nb-pin-screen">
          <PinInputCard
            pinInput={pinInput}
            onPinChange={handlePinChange}
            onSubmit={handlePinSubmit}
            pinError={pinError}
            onCancel={() => setActiveTab('Stream')}
            cancelText="Zurück zu Stream"
            title="Geschützter Bereich"
            subtitle="Lokale Medien sind geschützt. Bitte PIN eingeben, um Zugriff zu erhalten."
          />
        </div>
      ) : loading ? (
        <div className="nb-loading-screen">
          <div className="nb-spinner"></div>
        </div>
      ) : (
        <>
          {heroItem && (
            <HeroBanner 
              item={heroItem} 
              onPlay={onPlay} 
              onSeriesClick={onSeriesClick} 
              onDownloadStream={onDownloadStream}
              activeTab={activeTab}
            />
          )}
          
          <div className="nb-content">
            {continueWatching.length > 0 && (
              <MediaRow 
                title="▶ Weiterschauen" 
                items={continueWatching} 
                isContinueWatching={true}
                onPlay={onPlay}
                onDownloadStream={onDownloadStream}
                onCopyUrl={onCopyUrl}
                onSeriesClick={onSeriesClick}
                onToggleFavorite={onToggleFavorite}
                activeTab={activeTab}
              />
            )}

            {rowsData.length > 0 ? (
              rowsData.map((row, idx) => (
                <MediaRow 
                  key={idx}
                  title={row.title} 
                  items={row.items} 
                  onPlay={onPlay} 
                  onDownloadStream={onDownloadStream}
                  onCopyUrl={onCopyUrl}
                  onSeriesClick={onSeriesClick} 
                  onToggleFavorite={onToggleFavorite} 
                  activeTab={activeTab}
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

const HeroBanner = ({ item, onPlay, onSeriesClick, onDownloadStream, activeTab }) => {
  const metadata = item.metadata || {};
  const backgroundUrl = getPosterSrc(metadata.backdrop || metadata.posterUrl || metadata.coverUrl || item.coverUrl || item.posterUrl || '');
  const title = getDisplayTitle(item);
  const isStream = activeTab === 'Stream' || item.isXtream;
  
  const handleActionClick = () => {
    if (item.isGroup) {
      onSeriesClick(item);
    } else if (isStream) {
      if (onDownloadStream) {
        onDownloadStream(item);
      }
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
          <button 
            className={`nb-hero-btn ${isStream && !item.isGroup ? 'nb-hero-download' : 'nb-hero-play'}`} 
            onClick={handleActionClick}
            style={isStream && !item.isGroup ? { background: 'var(--accent-pink, #ec4899)', color: '#fff', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)' } : undefined}
          >
            <span className="nb-hero-btn-icon">{item.isGroup ? '📺' : isStream ? '📥' : '▶'}</span>{' '}
            {item.isGroup ? 'Episoden ansehen' : isStream ? 'In Download-Warteschlange' : 'In VLC abspielen'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MediaRow = ({ title, items, isContinueWatching = false, onPlay, onDownloadStream, onCopyUrl, onSeriesClick, onToggleFavorite, activeTab }) => {
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
              onDownloadStream={onDownloadStream}
              onCopyUrl={onCopyUrl}
              onSeriesClick={onSeriesClick} 
              onToggleFavorite={onToggleFavorite} 
              activeTab={activeTab}
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

const MediaCard = ({ item, isContinueWatching, onPlay, onDownloadStream, onCopyUrl, onSeriesClick, onToggleFavorite, activeTab }) => {
  const [copied, setCopied] = useState(false);
  const metadata = item.metadata || {};
  const displayTitle = getDisplayTitle(item, isContinueWatching);
  const isStream = activeTab === 'Stream' || item.isXtream;
  const isLocal = activeTab === 'Lokal' || (!item.isXtream && !item.isLive);

  const posterUrl = getPosterSrc(metadata.posterUrl || metadata.backdrop || metadata.coverUrl || item.posterUrl || item.coverUrl || '');
  const progressPercentage = item.progress?.percentage || 0;

  const handleClick = () => {
    if (item.isGroup) {
      onSeriesClick(item);
    } else if (isStream) {
      if (onDownloadStream) {
        onDownloadStream(item);
      }
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

  const handleCopyClick = (e) => {
    e.stopPropagation();
    if (onCopyUrl) {
      onCopyUrl(item.filename, item);
    } else {
      const url = `${window.location.protocol}//${window.location.host}/api/media/stream/${encodeURIComponent(item.filename)}`;
      navigator.clipboard?.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`nb-card ${isContinueWatching ? 'nb-card-wide' : 'nb-card-tall'}`}
      onClick={handleClick}
      title={item.isGroup ? 'Serie öffnen' : isStream ? 'Zu Downloads hinzufügen' : 'In VLC öffnen'}
    >
      <div className="nb-card-image-wrapper">
        {posterUrl ? (
          <img src={posterUrl} alt={displayTitle} className="nb-card-image" loading="lazy" />
        ) : (
          <div className="nb-card-fallback">
            <span className="nb-card-emoji">{item.isGroup ? '📺' : isStream ? '📥' : '🎬'}</span>
          </div>
        )}
        
        <div className="nb-card-overlay">
          <div className="nb-card-play-icon">
            {item.isGroup ? '📺' : isStream ? '📥' : '▶'}
          </div>
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

        {isLocal && !item.isGroup && (
          <button 
            className="nb-card-copy-btn"
            onClick={handleCopyClick}
            title={copied ? "Stream-URL kopiert!" : "Stream-URL kopieren"}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              zIndex: 5,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: copied ? 'var(--accent-green, #10b981)' : '#fff',
              fontSize: '0.8rem'
            }}
          >
            {copied ? '✓' : '📋'}
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
