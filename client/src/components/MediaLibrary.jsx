import React from 'react';
import MediaCard from './MediaCard.jsx';
import MusicItem from './MusicItem.jsx';
import { SearchIcon, CloseIcon, HeartIcon, CastIcon, PlayIcon, PauseIcon, DownloadIcon, TrashIcon, CalendarIcon } from './icons.jsx';
import { getPosterSrc, formatDuration, formatBytes } from './utils.js';

const MediaLibrary = ({ mediaLibrary, selectedCategory, selectedSubcategory, loadingLibrary, totalPages, totalItems, currentPage,
  categoryCounts, serverSubcategories, activeSeries, activeSeriesId, librarySearchQuery, debouncedSearchQuery,
  favoritesFilter, activeCasts, pendingCasts, wsConnected, xtreamEpisodes, loadingXtreamEpisodes,
  settings, filteredLibrary, groupedLibrary, availableSubcategories,
  onSelectCategory, onSelectSubcategory, onSearchChange, onPageChange, onToggleFavorite,
  onDelete, onDeleteFile, onPlay, onCast, onCastControl, onStopCast, onScroll, onSeriesClick, onCheckNow,
  onToggleAutoDownload, onRefresh, onClearFilters, onXtreamDownload, autoDownloads, checkingShowId, renderFavoritesOverview }) => {

  const getObsoleteFiles = () => {
    if (!settings?.keepDays) return [];
    const now = Date.now();
    const cutoff = now - settings.keepDays * 24 * 60 * 60 * 1000;
    return (mediaLibrary || []).filter(item =>
      !item.isGroup &&
      (item.mtime && new Date(item.mtime).getTime() < cutoff) &&
      !item.favorite
    );
  };

  if (loadingLibrary && mediaLibrary.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner" style={{ fontSize: '2rem' }}>⏳</span>
        <p>Mediathek wird gescannt...</p>
      </div>
    );
  }

  if (mediaLibrary.length === 0 && !librarySearchQuery && selectedCategory === 'all' && selectedSubcategory === 'all') {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🎥</span>
        <p>Keine Mediendateien im Download-Ordner gefunden.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Unterstützte Formate: MP4, MKV, AVI, MP3, WAV, M4A, MOV, FLAC
        </p>
        <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => onRefresh(true)}>
          Ordner erneut scannen 🔄
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {activeSeries ? (
        <div className="series-detail-view" style={{ animation: 'fadeIn 0.3s ease', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onSeriesClick(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', borderRadius: '30px' }}
            >
              ◀ Zurück zur Mediathek
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => onRefresh(true)}
              disabled={loadingLibrary}
            >
              {loadingLibrary ? '⏳ Scanne...' : 'Aktualisieren 🔄'}
            </button>
          </div>

          <div className="series-detail-layout" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="series-info-card" style={{ flex: '1 1 250px', maxWidth: '300px' }}>
              <div className="media-card" style={{ maxWidth: '100%' }}>
                <div className="media-poster-container">
                  <img
                    src={getPosterSrc(activeSeries.posterUrl)}
                    alt={activeSeries.title}
                    className="media-poster"
                    style={{ display: activeSeries.posterUrl ? 'block' : 'none' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.media-poster-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="media-poster-fallback" style={{ display: activeSeries.posterUrl ? 'none' : 'flex' }}>
                    <span className="media-poster-fallback-icon">📺</span>
                    <span className="media-poster-fallback-title">{activeSeries.title}</span>
                  </div>
                  {activeSeries.year && <span className="media-badge-year">{activeSeries.year}</span>}
                  <span className="media-badge-type">Serie</span>
                </div>
                <div className="media-card-body" style={{ padding: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    {activeSeries.title}
                  </h3>
                  {activeSeries.cast && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                      <strong>Besetzung:</strong>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{activeSeries.cast}</div>
                    </div>
                  )}
                  {activeSeries.imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${activeSeries.imdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-imdb-link"
                      style={{ fontSize: '0.85rem' }}
                    >
                      ⭐ Auf IMDb ansehen
                    </a>
                  )}

                  {activeSeries.imdbId && (
                    <div style={{
                      marginTop: '1.25rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                      }}>
                        <input
                          type="checkbox"
                          checked={!!autoDownloads[activeSeries.imdbId]?.enabled}
                          onChange={(e) => onToggleAutoDownload(activeSeries.imdbId, activeSeries.title, e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--accent-pink)',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        />
                        <span>Lade weitere Folgen</span>
                      </label>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                        {autoDownloads[activeSeries.imdbId]?.enabled ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              ● Aktiv (prüft alle {settings?.checkIntervalHours || 3} Std.)
                            </span>
                            <button
                              className="btn btn-secondary"
                              onClick={() => onCheckNow(activeSeries.imdbId)}
                              disabled={checkingShowId === activeSeries.imdbId}
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                width: 'fit-content',
                                marginTop: '0.2rem'
                              }}
                            >
                              {checkingShowId === activeSeries.imdbId ? '🔍 Suche läuft...' : '🔍 Jetzt suchen'}
                            </button>
                          </div>
                        ) : (
                          `Prüft alle ${settings?.checkIntervalHours || 3} Std. auf neue Folgen desselben Formats und lädt diese automatisch herunter.`
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="series-episodes-container" style={{ flex: '2 1 450px' }}>
              {(() => {
                const activeSeriesFiles = activeSeries.isXtream
                  ? (xtreamEpisodes[activeSeries.xtreamSeriesId] || [])
                  : activeSeries.files;

                return (
                  <>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      Dateien ({activeSeriesFiles.length})
                    </h3>

                    {loadingXtreamEpisodes ? (
                      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
                        <p>Lade Episoden vom Xtream Server...</p>
                      </div>
                    ) : (
                      <div className="episodes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '750px', overflowY: 'auto' }}>
                        {activeSeriesFiles.map((item, idx) => {
                          const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
                          const isPending = !!pendingCasts[item.filename];

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div className="music-item" style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
                                <div className="music-info">
                                  <div className="music-icon" style={{ background: 'rgba(255, 0, 127, 0.08)', color: 'var(--accent-pink)' }}>
                                    {item.metadata?.seasonEpisode ? '🎬' : '📹'}
                                  </div>
                                  <div className="music-details">
                                    <div className="music-title" title={item.filename} style={{ fontWeight: '500' }}>
                                      {item.metadata?.seasonEpisode ? <strong style={{ color: 'var(--accent-pink)', marginRight: '0.4rem' }}>{item.metadata.seasonEpisode}</strong> : null}
                                      {item.isXtream ? (item.metadata?.title || item.filename) : item.filename}
                                    </div>
                                    <div className="music-meta">
                                      {item.sizeBytes > 0 && (
                                        <>
                                          <span className="music-size">{formatBytes(item.sizeBytes)}</span>
                                          <span>•</span>
                                        </>
                                      )}
                                      <span>{item.isXtream ? 'Xtream Codes Stream' : new Date(item.mtime).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="music-actions">
                                  {item.isXtream && (
                                    <button
                                      className="btn btn-secondary btn-icon-only"
                                      style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 153, 0, 0.2)' }}
                                      title="Folge herunterladen"
                                      onClick={() => onXtreamDownload(item, activeSeries)}
                                    >
                                      <DownloadIcon />
                                    </button>
                                  )}
                                  {!item.isXtream && (
                                    <button
                                      className="btn btn-danger btn-icon-only"
                                      title="Datei von Festplatte löschen"
                                      onClick={() => onDeleteFile(item.filename)}
                                    >
                                      <TrashIcon />
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-primary btn-icon-only"
                                    style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
                                    title="Lokal abspielen"
                                    onClick={() => onPlay(item.filename, item)}
                                  >
                                    <PlayIcon />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-icon-only"
                                    style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                                    title="Auf TV streamen (Cast)"
                                    disabled={isPending}
                                    onClick={() => onCast(item)}
                                  >
                                    {isPending ? <span className="spinner">⏳</span> : <CastIcon />}
                                  </button>
                                </div>
                              </div>

                              {activeCastForFile && (
                                <div style={{
                                  background: 'rgba(0, 242, 254, 0.08)',
                                  border: '1px solid rgba(0, 242, 254, 0.25)',
                                  borderRadius: '10px',
                                  padding: '0.75rem 1rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem',
                                  color: 'var(--text-primary)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                                      📺 Streamt auf {activeCastForFile.device}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                      {activeCastForFile.playerState || 'Verbinden'}
                                    </span>
                                  </div>

                                  {activeCastForFile.duration > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                      <input
                                        type="range"
                                        min={0}
                                        max={activeCastForFile.duration}
                                        value={activeCastForFile.currentTime || 0}
                                        onChange={(e) => onCastControl(activeCastForFile.device, 'seek', e.target.value)}
                                        style={{
                                          width: '100%',
                                          accentColor: 'var(--accent-cyan)',
                                          cursor: 'pointer',
                                          height: '4px'
                                        }}
                                      />
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                                        <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                                    {activeCastForFile.playerState === 'PAUSED' ? (
                                      <button
                                        className="btn btn-secondary btn-icon-only"
                                        style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                        onClick={() => onCastControl(activeCastForFile.device, 'resume')}
                                      >
                                        <PlayIcon />
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-secondary btn-icon-only"
                                        style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                        onClick={() => onCastControl(activeCastForFile.device, 'pause')}
                                      >
                                        <PauseIcon />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-danger"
                                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                                      onClick={() => onStopCast(activeCastForFile.device)}
                                    >
                                      Stoppen
                                    </button>
                                  </div>
                                </div>
                              )}

                              {isPending && !activeCastForFile && (
                                <div style={{
                                  background: 'rgba(0, 242, 254, 0.05)',
                                  border: '1px solid rgba(0, 242, 254, 0.2)',
                                  borderRadius: '8px',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  color: 'var(--text-secondary)'
                                }}>
                                  <span><span className="spinner">⏳</span> Verbindung wird aufgebaut...</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Gefundene Mediendateien:</span>
            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onRefresh(true)} disabled={loadingLibrary}>
              {loadingLibrary ? '⏳ Scanne...' : 'Aktualisieren 🔄'}
            </button>
          </div>

          {getObsoleteFiles().length > 0 && (
            <div className="obsolete-banner" style={{
              background: 'rgba(255, 153, 0, 0.08)',
              border: '1px solid rgba(255, 153, 0, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              gap: '1rem',
              marginTop: '0.25rem'
            }}>
              <div style={{ color: 'var(--accent-orange)' }}>
                ⚠️ <strong>{getObsoleteFiles().length} veraltete Dateien</strong> gefunden (älter als {settings?.keepDays} Tage).
              </div>
              <button
                className="btn btn-primary"
                style={{
                  background: 'rgba(255, 153, 0, 0.2)',
                  color: 'var(--accent-orange)',
                  borderColor: 'rgba(255, 153, 0, 0.3)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  boxShadow: 'none'
                }}
                onClick={() => onDelete(getObsoleteFiles().map(f => f.filename))}
              >
                🗑️ Bereinigen
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="search-input-wrapper" style={{ marginBottom: '0.25rem' }}>
              <span className="search-icon-placeholder"><SearchIcon /></span>
              <input
                type="text"
                className="search-input"
                style={{ padding: '0.55rem 1rem 0.55rem 2.5rem', fontSize: '0.85rem' }}
                placeholder="Mediathek nach Dateinamen, Titeln oder Schauspielern filtern..."
                value={librarySearchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>

            <div className="category-tabs-container">
              <button
                className={`category-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => onSelectCategory('all')}
              >
                📁 Alle ({categoryCounts.all || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Favoriten' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Favoriten')}
                style={{
                  border: selectedCategory === 'Favoriten' ? '1px solid var(--accent-red)' : '1px solid transparent',
                  boxShadow: selectedCategory === 'Favoriten' ? '0 0 8px rgba(255, 51, 102, 0.2)' : 'none'
                }}
              >
                ❤️ Favoriten ({categoryCounts.Favoriten || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Neu' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Neu')}
              >
                🆕 Neu ({categoryCounts.Neu || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Lokal' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Lokal')}
              >
                💾 Lokal ({categoryCounts.Lokal || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Filme' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Filme')}
              >
                🎬 Filme ({categoryCounts.Filme || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Serien' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Serien')}
              >
                📺 Serien ({categoryCounts.Serien || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Videos' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Videos')}
              >
                📹 Videos ({categoryCounts.Videos || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Musik' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Musik')}
              >
                🎵 Musik ({categoryCounts.Musik || 0})
              </button>
              <button
                className={`category-tab-btn ${selectedCategory === 'Hörbücher' ? 'active' : ''}`}
                onClick={() => onSelectCategory('Hörbücher')}
              >
                🎧 Hörbücher ({categoryCounts.Hörbücher || 0})
              </button>
              {settings?.xtreamEnabled && (
                <button
                  className={`category-tab-btn ${selectedCategory === 'Live TV' ? 'active' : ''}`}
                  onClick={() => onSelectCategory('Live TV')}
                >
                  📡 Live TV ({categoryCounts['Live TV'] || 0})
                </button>
              )}
            </div>

            {availableSubcategories && availableSubcategories.length > 1 && (
              <div className="subcategory-tags-container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', margin: '0.2rem 0', scrollbarWidth: 'thin' }}>
                {availableSubcategories.map(sub => (
                  <button
                    key={sub}
                    className={`subcategory-tag-btn ${selectedSubcategory === sub ? 'active' : ''}`}
                    onClick={() => onSelectSubcategory(sub)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      background: selectedSubcategory === sub ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedSubcategory === sub ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {sub === 'all' ? 'Alle' : sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(!filteredLibrary || filteredLibrary.length === 0) ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <span className="empty-state-icon">🔍</span>
              {librarySearchQuery ? (
                <p>Keine Übereinstimmung für &quot;{librarySearchQuery}&quot; gefunden.</p>
              ) : (
                <p>Keine Mediendateien in dieser Kategorie gefunden.</p>
              )}
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={onClearFilters}
              >
                Filter zurücksetzen
              </button>
            </div>
          ) : selectedCategory === 'Musik' ? (
            <div className="music-list" style={{ maxHeight: '650px', overflowY: 'auto' }} onScroll={onScroll}>
              {filteredLibrary.map((item, idx) => (
                <MusicItem
                  key={idx}
                  item={item}
                  idx={idx}
                  activeCasts={activeCasts}
                  pendingCasts={pendingCasts}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDelete}
                  onPlay={onPlay}
                  onCast={onCast}
                  onCastControl={onCastControl}
                  onStopCast={onStopCast}
                />
              ))}
              {loadingLibrary && currentPage > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem', color: 'var(--text-secondary)' }}>
                  <span className="spinner">⏳</span> Lade mehr...
                </div>
              )}
            </div>
          ) : selectedCategory === 'Favoriten' ? (
            <div style={{ maxHeight: '750px', overflowY: 'auto' }} onScroll={onScroll}>
              {typeof renderFavoritesOverview === 'function' && renderFavoritesOverview()}
              {loadingLibrary && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem', color: 'var(--text-secondary)' }}>
                  <span className="spinner">⏳</span> Lade...
                </div>
              )}
            </div>
          ) : (
            <div className="media-grid" style={{ maxHeight: '750px', overflowY: 'auto' }} onScroll={onScroll}>
              {groupedLibrary && groupedLibrary.map((item, idx) => (
                <MediaCard
                  key={idx}
                  item={item}
                  idx={idx}
                  activeCasts={activeCasts}
                  pendingCasts={pendingCasts}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDelete}
                  onPlay={onPlay}
                  onCast={onCast}
                  onCastControl={onCastControl}
                  onStopCast={onStopCast}
                  onXtreamDownload={onXtreamDownload}
                  onSeriesClick={onSeriesClick}
                />
              ))}
              {loadingLibrary && currentPage > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
                  <span className="spinner">⏳</span> Lade mehr...
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MediaLibrary;