import React from 'react';
import { PulseCastLogo, DownloadIcon, MediaIcon, FolderIcon, SettingsIcon } from './icons.jsx';

const AppHeader = ({ currentView, settings, onViewChange, onOpenSettings, onOpenVcr }) => {
  return (
    <header className="app-header">
      <div className="brand">
        <PulseCastLogo />
        <div>
          <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            PulseCast
            <span className="version-info-badge" style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>v{settings.version || '1.0.0'}</span>
              {settings.startTime && (
                <>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>Gestartet: {new Date(settings.startTime).toLocaleString('de-DE')}</span>
                </>
              )}
            </span>
          </h1>
          <span>Local Search & Transfer</span>
        </div>
      </div>
      <div className="header-nav">
        <button
          className={`nav-btn ${currentView === 'downloads' ? 'active' : ''}`}
          onClick={() => onViewChange('downloads')}
        >
          <DownloadIcon />
          Downloads
        </button>
        <button
          className={`nav-btn ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => onViewChange('library')}
        >
          <MediaIcon />
          Mediathek
        </button>
        <button
          className={`nav-btn ${currentView === 'explorer' ? 'active' : ''}`}
          onClick={() => onViewChange('explorer')}
        >
          <FolderIcon />
          Dateiexplorer
        </button>
      </div>
      <div className="header-actions">
        <div className="btn btn-secondary" style={{ cursor: 'default', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <FolderIcon />
          <span style={{ fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {settings.downloadDir || 'Lädt Ordner...'}
          </span>
        </div>
        {settings.xtreamEnabled && (
          <button className="btn btn-secondary" style={{ marginRight: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={onOpenVcr}>
            📹 Videorekorder
          </button>
        )}
        <button className="btn btn-primary" onClick={onOpenSettings}>
          <SettingsIcon />
          Einstellungen
        </button>
      </div>
    </header>
  );
};

export default AppHeader;