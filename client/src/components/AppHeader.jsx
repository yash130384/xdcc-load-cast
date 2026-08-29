import React from 'react';
import { PulseCastLogo, DownloadIcon, MediaIcon, FolderIcon, SettingsIcon } from './icons.jsx';

const AppHeader = ({ currentView, settings, onDownloadsClick, onLibraryClick, onExplorerClick, onOpenSettings, onOpenVcr }) => {
  return (
    <header className="app-header">
      <div className="header-top-row">
        <div className="brand">
          <PulseCastLogo />
          <div className="brand-text">
            <h1>
              <span>PulseCast</span>
              <span className="version-info-badge">
                <span>v{settings.version || '1.0.0'}</span>
                {settings.startTime && (
                  <span className="uptime-text">
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>Gestartet: {new Date(settings.startTime).toLocaleString('de-DE')}</span>
                  </span>
                )}
              </span>
            </h1>
            <span className="brand-subtitle">Local Search & Transfer</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="header-folder-badge" title={settings.downloadDir || ''}>
            <FolderIcon />
            <span className="folder-text">
              {settings.downloadDir || 'Lädt Ordner...'}
            </span>
          </div>
          {settings.xtreamEnabled && (
            <button className="btn btn-secondary header-btn-vcr" onClick={onOpenVcr} title="Videorekorder">
              <span className="btn-icon">📹</span>
              <span className="btn-label">Videorekorder</span>
            </button>
          )}
          <button className="btn btn-primary header-btn-settings" onClick={onOpenSettings} title="Einstellungen">
            <SettingsIcon />
            <span className="btn-label">Einstellungen</span>
          </button>
        </div>
      </div>

      <nav className="header-nav" aria-label="Hauptnavigation">
        <button
          className={`nav-btn ${currentView === 'downloads' ? 'active' : ''}`}
          onClick={onDownloadsClick}
        >
          <DownloadIcon />
          <span>Downloads</span>
        </button>
        <button
          className={`nav-btn ${currentView === 'library' ? 'active' : ''}`}
          onClick={onLibraryClick}
        >
          <MediaIcon />
          <span>Mediathek</span>
        </button>
        <button
          className={`nav-btn ${currentView === 'explorer' ? 'active' : ''}`}
          onClick={onExplorerClick}
        >
          <FolderIcon />
          <span>Dateiexplorer</span>
        </button>
      </nav>
    </header>
  );
};

export default AppHeader;