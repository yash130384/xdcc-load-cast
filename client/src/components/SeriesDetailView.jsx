import React, { useState, useEffect } from 'react';
import { getPosterSrc, formatBytes } from './utils.js';

const SeriesDetailView = ({
  series,
  onClose,
  onPlay,
  onCheckNow,
  autoDownloads,
  checkingShowId,
  xtreamEpisodes,
  loadingXtreamEpisodes,
  settings
}) => {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const metadata = series.metadata || {};
  const backgroundUrl = getPosterSrc(metadata.backdrop || metadata.posterUrl || metadata.coverUrl || '');
  const posterUrl = getPosterSrc(metadata.posterUrl || metadata.coverUrl || '');
  const title = metadata.title || series.title || series.filename;

  // Determine episodes
  const parseEpisodeInfo = (item) => {
    if (item.season && typeof item.season === 'number') {
      return { season: item.season, episode: item.episodeNum || 1 };
    }
    const sEp = item.metadata?.seasonEpisode || item.filename || '';
    const match = sEp.match(/S(\d+)E(\d+)/i) || sEp.match(/(\d+)x(\d+)/i);
    if (match) {
      return { season: parseInt(match[1], 10), episode: parseInt(match[2], 10) };
    }
    const sOnly = sEp.match(/Staffel\s*(\d+)/i) || sEp.match(/Season\s*(\d+)/i) || sEp.match(/S(\d+)/i);
    if (sOnly) {
      return { season: parseInt(sOnly[1], 10), episode: 1 };
    }
    return { season: 1, episode: 1 };
  };

  const activeSeriesFiles = series.isXtream
    ? (xtreamEpisodes[series.xtreamSeriesId] || [])
    : (series.files || []);

  const seasonMap = new Map();
  activeSeriesFiles.forEach((file) => {
    const { season } = parseEpisodeInfo(file);
    const seasonKey = season || 1;
    if (!seasonMap.has(seasonKey)) {
      seasonMap.set(seasonKey, []);
    }
    seasonMap.get(seasonKey).push(file);
  });

  const sortedSeasons = Array.from(seasonMap.keys()).sort((a, b) => a - b);

  useEffect(() => {
    if (sortedSeasons.length > 0 && !seasonMap.has(selectedSeason)) {
      setSelectedSeason(sortedSeasons[0]);
    }
  }, [sortedSeasons, selectedSeason]);

  const episodes = (seasonMap.get(selectedSeason) || []).sort((a, b) => {
    const epA = parseEpisodeInfo(a).episode;
    const epB = parseEpisodeInfo(b).episode;
    return epA - epB;
  });

  const isAutoDlActive = autoDownloads && autoDownloads[series.imdbId]?.enabled;

  return (
    <div className="sdv-container">
      {/* Background Banner */}
      <div className="sdv-hero" style={{ backgroundImage: `url(${backgroundUrl})` }}>
        <div className="sdv-hero-overlay"></div>
      </div>
      
      {/* Top Navbar */}
      <div className="sdv-navbar">
        <button className="sdv-back-btn" onClick={onClose}>
          <span style={{ fontSize: '1.2rem', marginRight: '5px' }}>←</span> Zurück
        </button>
      </div>

      <div className="sdv-content">
        <div className="sdv-header">
          <div className="sdv-poster">
            <img src={posterUrl} alt={title} />
          </div>
          <div className="sdv-info">
            <h1 className="sdv-title">{title}</h1>
            <div className="sdv-meta">
              {metadata.year && <span>{metadata.year}</span>}
              {metadata.genre && <span>{metadata.genre}</span>}
              {sortedSeasons.length > 0 && <span>{sortedSeasons.length} {sortedSeasons.length === 1 ? 'Staffel' : 'Staffeln'}</span>}
              <span className="sdv-badge">{series.isXtream ? 'STREAM' : 'LOKAL'}</span>
            </div>
            <p className="sdv-description">
              {metadata.description || 'Keine Beschreibung verfügbar.'}
            </p>
            
            {/* Download / Auto-DL Status */}
            <div className="sdv-actions">
              {isAutoDlActive ? (
                <div className="sdv-auto-dl active">
                  <span className="sdv-indicator"></span>
                  Auto-Download aktiv (prüft alle {settings?.checkIntervalHours || 3} Std.)
                </div>
              ) : (
                <div className="sdv-auto-dl">
                  Auto-Download inaktiv
                </div>
              )}
              {onCheckNow && (
                <button 
                  className="sdv-btn sdv-btn-secondary" 
                  onClick={() => onCheckNow(series.imdbId)}
                  disabled={checkingShowId === series.imdbId}
                >
                  {checkingShowId === series.imdbId ? '🔍 Suche...' : '🔍 Jetzt neue Folgen suchen'}
                </button>
              )}
            </div>
          </div>
        </div>

        {loadingXtreamEpisodes ? (
          <div className="sdv-loading">
            <div className="nb-spinner"></div>
            <p>Lade Episoden...</p>
          </div>
        ) : (
          <div className="sdv-episodes-section">
            {/* Season Selector */}
            {sortedSeasons.length > 1 && (
              <div className="sdv-season-selector">
                <select 
                  value={selectedSeason} 
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                >
                  {sortedSeasons.map(s => (
                    <option key={s} value={s}>Staffel {s}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Episode List */}
            <div className="sdv-episodes-list">
              {episodes.map((ep, idx) => {
                const epInfo = parseEpisodeInfo(ep);
                const epTitle = ep.metadata?.title || ep.title || ep.filename;
                const pct = ep.progress?.percentage || 0;
                
                return (
                  <div key={idx} className="sdv-episode-item" onClick={() => onPlay(ep.filename, ep)}>
                    <div className="sdv-ep-number">{epInfo.episode}</div>
                    <div className="sdv-ep-thumb">
                      <img src={getPosterSrc(ep.metadata?.backdrop || ep.metadata?.posterUrl || metadata.backdrop || posterUrl)} alt={epTitle} />
                      <div className="sdv-ep-play">▶</div>
                      {pct > 0 && pct < 100 && (
                        <div className="sdv-ep-progress"><div className="sdv-ep-progress-fill" style={{ width: `${pct}%` }}></div></div>
                      )}
                    </div>
                    <div className="sdv-ep-details">
                      <h4 className="sdv-ep-title">{epTitle}</h4>
                      <p className="sdv-ep-desc">{ep.metadata?.description || ''}</p>
                    </div>
                    <div className="sdv-ep-meta">
                      {ep.metadata?.duration && <span className="sdv-ep-duration">{Math.floor(ep.metadata.duration/60)} Min.</span>}
                      {ep.size && <span className="sdv-ep-size">{formatBytes(ep.size)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesDetailView;
