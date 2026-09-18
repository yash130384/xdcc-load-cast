import React from 'react';
import {
  PulseCastLogo,
  DownloadIcon,
  FolderIcon,
  SettingsIcon,
  SearchIcon,
  LockIcon,
  CalendarIcon
} from './icons.jsx';
import { formatBytes } from './utils.js';

const AppHeader = ({
  currentView,
  onNavigate,
  downloads = [],
  settings = {},
  showLocalFiles = true,
  onOpenPinModal,
  onOpenVcr,
  onOpenSettings,
  activeSeriesItem,
  onCloseSeriesDetail
}) => {
  const activeDownloads = downloads.filter(d =>
    ['downloading', 'dcc_downloading', 'extracting', 'connecting', 'queued'].includes(d.status)
  );
  const totalSpeed = downloads.reduce((sum, d) => sum + (d.speed || 0), 0);
  const hasActiveDownloads = activeDownloads.length > 0;

  const handleBrandClick = () => {
    if (activeSeriesItem && onCloseSeriesDetail) {
      onCloseSeriesDetail();
    }
    onNavigate('browse');
  };

  const handleDownloadsClick = () => {
    if (currentView === 'downloads') {
      onNavigate('browse');
    } else {
      if (activeSeriesItem && onCloseSeriesDetail) {
        onCloseSeriesDetail();
      }
      onNavigate('downloads');
    }
  };

  return (
    <header className="unified-app-header">
      <div className="header-brand-section" onClick={handleBrandClick} role="button" tabIndex={0}>
        <div className="brand-logo-wrap">
          <PulseCastLogo />
        </div>
        <div className="brand-title-wrap">
          <div className="brand-name-row">
            <span className="brand-name">PulseCast</span>
            <span className="brand-version-pill">v{settings.version || '1.2.3'}</span>
          </div>
          <span className="brand-subtitle">Media & Transfer Hub</span>
        </div>
      </div>

      {/* Hauptnavigation */}
      <nav className="header-primary-nav" aria-label="Hauptnavigation">
        <button
          type="button"
          className={`nav-pill ${currentView === 'browse' && !activeSeriesItem ? 'active' : ''}`}
          onClick={() => {
            if (activeSeriesItem && onCloseSeriesDetail) onCloseSeriesDetail();
            onNavigate('browse');
          }}
        >
          <span className="nav-pill-icon">🌟</span>
          <span className="nav-pill-label">Entdecken</span>
        </button>

        <button
          type="button"
          className={`nav-pill ${currentView === 'movies' ? 'active' : ''}`}
          onClick={() => {
            if (activeSeriesItem && onCloseSeriesDetail) onCloseSeriesDetail();
            onNavigate('movies');
          }}
        >
          <span className="nav-pill-icon">🍿</span>
          <span className="nav-pill-label">Filme</span>
        </button>

        <button
          type="button"
          className={`nav-pill ${currentView === 'series' || activeSeriesItem ? 'active' : ''}`}
          onClick={() => {
            onNavigate('series');
          }}
        >
          <span className="nav-pill-icon">📺</span>
          <span className="nav-pill-label">Serien</span>
        </button>

        {settings?.xtreamEnabled && (
          <button
            type="button"
            className={`nav-pill ${currentView === 'livetv' ? 'active' : ''}`}
            onClick={() => {
              if (activeSeriesItem && onCloseSeriesDetail) onCloseSeriesDetail();
              onNavigate('livetv');
            }}
          >
            <span className="nav-pill-icon">📡</span>
            <span className="nav-pill-label">Live TV</span>
          </button>
        )}

        <button
          type="button"
          className={`nav-pill ${currentView === 'xdcc' ? 'active' : ''}`}
          onClick={() => {
            if (activeSeriesItem && onCloseSeriesDetail) onCloseSeriesDetail();
            onNavigate('xdcc');
          }}
        >
          <span className="nav-pill-icon">🔍</span>
          <span className="nav-pill-label">XDCC Suche</span>
        </button>

        <button
          type="button"
          className={`nav-pill ${currentView === 'explorer' ? 'active' : ''}`}
          onClick={() => {
            if (activeSeriesItem && onCloseSeriesDetail) onCloseSeriesDetail();
            onNavigate('explorer');
          }}
        >
          <span className="nav-pill-icon"><FolderIcon /></span>
          <span className="nav-pill-label">Dateien</span>
        </button>
      </nav>

      {/* Kontrollzentrum Rechts */}
      <div className="header-control-hub">
        {/* Downloads / Warteschlange Hub */}
        <button
          type="button"
          className={`control-hub-btn download-hub-btn ${currentView === 'downloads' ? 'active' : ''} ${hasActiveDownloads ? 'has-active' : ''}`}
          onClick={handleDownloadsClick}
          title={hasActiveDownloads ? `${activeDownloads.length} aktive Downloads (${formatBytes(totalSpeed)}/s)` : 'Warteschlange & Downloads'}
        >
          <DownloadIcon />
          <span className="btn-label-desktop">Downloads</span>
          {hasActiveDownloads ? (
            <div className="active-downloads-indicator">
              <span className="pulse-dot"></span>
              <span className="active-count-badge">{activeDownloads.length}</span>
              {totalSpeed > 0 && (
                <span className="live-speed-text">{formatBytes(totalSpeed)}/s</span>
              )}
            </div>
          ) : downloads.length > 0 ? (
            <span className="idle-count-badge">{downloads.length}</span>
          ) : null}
        </button>

        {/* PIN Sperre / Entsperren Button */}
        {settings?.xxxHideEnabled && (
          <button
            type="button"
            className={`control-hub-btn pin-hub-btn ${!showLocalFiles ? 'locked' : 'unlocked'}`}
            onClick={onOpenPinModal}
            title={showLocalFiles ? 'Lokale Medien freigeschaltet (Klick zum Sperren)' : 'Lokale Medien gesperrt (Klick zur PIN-Eingabe)'}
          >
            <LockIcon open={showLocalFiles} size={17} />
          </button>
        )}

        {/* VCR Button */}
        {settings?.xtreamEnabled && (
          <button
            type="button"
            className="control-hub-btn vcr-hub-btn"
            onClick={onOpenVcr}
            title="Videorekorder (VCR) & Aufnahmen"
          >
            <CalendarIcon />
            <span className="btn-label-desktop">VCR</span>
          </button>
        )}

        {/* Einstellungen Button */}
        <button
          type="button"
          className="control-hub-btn settings-hub-btn"
          onClick={onOpenSettings}
          title="System-Einstellungen"
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;