import React from 'react';
import { PulseCastLogo, DownloadIcon, MediaIcon, FolderIcon, SettingsIcon } from './icons.jsx';

const AppHeader = ({
  appMode, // 'media' or 'advanced'
  currentView,
  selectedCategory,
  settings,
  onToggleAppMode,
  onSelectCategory,
  onDownloadsClick,
  onLibraryClick,
  onExplorerClick,
  onOpenSettings,
  onOpenVcr
}) => {
  return (
    <header className="app-header">
      <div className="header-top-row">
        <div className="brand" onClick={() => onToggleAppMode('media')} style={{ cursor: 'pointer' }}>
          <PulseCastLogo />
          <div className="brand-text">
            <h1>
              <span>PulseCast</span>
              <span className="version-info-badge">
                <span>v{settings.version || '1.0.0'}</span>
              </span>
            </h1>
            <span className="brand-subtitle">{appMode === 'media' ? 'Cinema & Stream Hub' : 'Local Search & Transfer'}</span>
          </div>
        </div>

        {/* Mode Switcher & Global Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Primary Switcher: Medien-Modus vs Erweiterter Modus */}
          <button
            className={`btn ${appMode === 'advanced' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onToggleAppMode(appMode === 'media' ? 'advanced' : 'media')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '30px',
              padding: '0.45rem 1rem',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}
            title={appMode === 'media' ? 'Zu Downloads, XDCC-Suche & Warteschlange' : 'Zurück zur Film- und Serien-Übersicht'}
          >
            <span>{appMode === 'media' ? '⚡ Erweiterter Modus' : '🎬 Medien-Modus'}</span>
          </button>

          {appMode === 'advanced' && settings.xtreamEnabled && (
            <button className="btn btn-secondary header-btn-vcr" onClick={onOpenVcr} title="Videorekorder">
              <span className="btn-icon">📹</span>
              <span className="btn-label">VCR</span>
            </button>
          )}

          <button className="btn btn-secondary header-btn-settings" onClick={onOpenSettings} title="Einstellungen">
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Navigation depending on App Mode */}
      {appMode === 'advanced' ? (
        <nav className="header-nav" aria-label="Erweiterte Navigation">
          <button
            className={`nav-btn ${currentView === 'downloads' ? 'active' : ''}`}
            onClick={onDownloadsClick}
          >
            <DownloadIcon />
            <span>Downloads & Queue</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'library' ? 'active' : ''}`}
            onClick={onLibraryClick}
          >
            <MediaIcon />
            <span>Mediathek-Verwaltung</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'explorer' ? 'active' : ''}`}
            onClick={onExplorerClick}
          >
            <FolderIcon />
            <span>Dateiexplorer</span>
          </button>
        </nav>
      ) : (
        <nav className="header-nav media-categories-nav" aria-label="Medien Navigation" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {[
            { id: 'all', label: '🎬 Alle Medien' },
            { id: 'Filme', label: '🍿 Filme' },
            { id: 'Serien', label: '📺 Serien' },
            { id: 'Live TV', label: '📡 Live TV' },
            { id: 'Lokal', label: '💾 Nur Lokal' }
          ].map(cat => (
            <button
              key={cat.id}
              className={`nav-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              style={{ padding: '0.4rem 1rem', borderRadius: '20px' }}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};

export default AppHeader;