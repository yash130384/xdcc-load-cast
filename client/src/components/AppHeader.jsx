import React from 'react';
import { PulseCastLogo, DownloadIcon, MediaIcon, FolderIcon, SettingsIcon } from './icons.jsx';
import OutputDeviceSelector from './OutputDeviceSelector.jsx';

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
  onOpenVcr,
  selectedOutputDevice = 'local',
  onSelectOutputDevice,
  castDevices = [],
  loadingDevices = false,
  onRefreshDevices,
  activeCasts = []
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
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <OutputDeviceSelector
            selectedDevice={selectedOutputDevice}
            onSelectDevice={onSelectOutputDevice}
            castDevices={castDevices}
            loadingDevices={loadingDevices}
            onRefreshDevices={onRefreshDevices}
            activeCasts={activeCasts}
          />
          <button
            className="btn btn-primary"
            onClick={() => onToggleAppMode('media')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '30px',
              padding: '0.45rem 1rem',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}
          >
            <span>◀ Zurück zur Übersicht</span>
          </button>
        </div>
      </div>

      {/* Navigation for Advanced/Settings area */}
      <nav className="header-nav" aria-label="Erweiterte Navigation">
        <button
          className={`nav-btn ${currentView === 'downloads' ? 'active' : ''}`}
          onClick={onDownloadsClick}
        >
          <DownloadIcon />
          <span>Suche & Warteschlange</span>
        </button>
        <button
          className={`nav-btn ${currentView === 'explorer' ? 'active' : ''}`}
          onClick={onExplorerClick}
        >
          <FolderIcon />
          <span>Dateiexplorer (Downloads)</span>
        </button>
        <button
          className={`nav-btn`}
          onClick={onOpenSettings}
        >
          <SettingsIcon />
          <span>System-Einstellungen</span>
        </button>
      </nav>
    </header>

  );
};

export default AppHeader;