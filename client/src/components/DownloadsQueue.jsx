import React from 'react';
import DownloadItem from './DownloadItem.jsx';

const DownloadsQueue = ({ downloads, downloadLogs, expandedLogs, activeCasts, pendingCasts, autoDownloads, checkingShowId,
  onPause, onResume, onCancel, onDelete, onDeleteFile, onConfirmFilename,
  onPlayLocal, onStartCast, onToggleLogs, onToggleAutoDownload, onCheckNow }) => {
  return (
    <>
      <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📥 Warteschlange (Vom User beauftragt) ({downloads.filter(d => !d.isAuto).length})
        </h3>
      </div>
      {downloads.filter(d => !d.isAuto).length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keine aktiven manuellen Downloads.</p>
        </div>
      ) : (
        <div className="downloads-list" style={{ marginBottom: '1.5rem' }}>
          {downloads.filter(d => !d.isAuto).map((item) => (
            <DownloadItem
              key={item.id}
              item={item}
              downloadLogs={downloadLogs}
              expandedLogs={expandedLogs}
              activeCasts={activeCasts}
              pendingCasts={pendingCasts}
              onPause={onPause}
              onResume={onResume}
              onCancel={onCancel}
              onDelete={onDelete}
              onDeleteFile={onDeleteFile}
              onConfirmFilename={onConfirmFilename}
              onPlayLocal={onPlayLocal}
              onStartCast={onStartCast}
              onToggleLogs={onToggleLogs}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🤖 Automatische Downloads (Auto-Loads) ({downloads.filter(d => d.isAuto).length})
        </h3>
      </div>
      {downloads.filter(d => d.isAuto).length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keine aktiven automatischen Downloads.</p>
        </div>
      ) : (
        <div className="downloads-list" style={{ marginBottom: '1.5rem' }}>
          {downloads.filter(d => d.isAuto).map((item) => (
            <DownloadItem
              key={item.id}
              item={item}
              downloadLogs={downloadLogs}
              expandedLogs={expandedLogs}
              activeCasts={activeCasts}
              pendingCasts={pendingCasts}
              onPause={onPause}
              onResume={onResume}
              onCancel={onCancel}
              onDelete={onDelete}
              onDeleteFile={onDeleteFile}
              onConfirmFilename={onConfirmFilename}
              onPlayLocal={onPlayLocal}
              onStartCast={onStartCast}
              onToggleLogs={onToggleLogs}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔄 Serien-Autoloads ({Object.values(autoDownloads).filter(sub => sub.enabled).length} aktiv)
          </h3>
        </div>
        {Object.keys(autoDownloads).length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Keine Serien für den automatischen Download abonniert.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Aktiviere &quot;Lade weitere Folgen&quot; in der Mediathek, um eine Serie hinzuzufügen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.values(autoDownloads).map((sub) => (
              <div key={sub.imdbId} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {sub.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', gap: '0.5rem' }}>
                    <span>IMDb: {sub.imdbId}</span>
                    {sub.failedEpisodes && Object.keys(sub.failedEpisodes).length > 0 && (
                      <span style={{ color: 'var(--accent-red)' }}>
                        ⚠️ {Object.keys(sub.failedEpisodes).length} Fehlgeschlagen
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onCheckNow(sub.imdbId)}
                    disabled={checkingShowId === sub.imdbId}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    {checkingShowId === sub.imdbId ? '⏳' : '🔍 Suchen'}
                  </button>

                  <label className="switch" style={{ transform: 'scale(0.85)' }}>
                    <input
                      type="checkbox"
                      checked={!!sub.enabled}
                      onChange={(e) => onToggleAutoDownload(sub.imdbId, sub.title, e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DownloadsQueue;