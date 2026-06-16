import React from 'react';
import { FolderIcon, ChevronDownIcon, TrashIcon, CloseIcon } from './icons.jsx';
import { formatBytes } from './utils.js';

export default function FileExplorer({
  explorerPath, explorerFiles, explorerLoading, explorerError,
  showNewFolderModal, newFolderName, showMoveModal, movingItem, moveDestination,
  onNavigate, onCreateFolder, onDelete, onMove, onCloseNewFolder, onCloseMove,
  onNewFolderNameChange, onMoveDestinationChange,
  onOpenNewFolder, onOpenMove
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📂 Dateiexplorer (Mediathek)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Verwalte Dateien und Ordner direkt in deinem Mediathek-Verzeichnis.
          </span>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          onClick={onOpenNewFolder}
        >
          ➕ Neuer Ordner
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0.6rem 0.85rem', 
        borderRadius: '10px', 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid var(--border-color)',
        marginBottom: '0.5rem',
        fontSize: '0.825rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)' }}>Ordner:</span>
          <strong style={{ color: 'var(--accent-cyan)' }}>/ {explorerPath || ''}</strong>
        </div>
        {explorerPath && (
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', minHeight: 'auto', borderRadius: '6px' }}
            onClick={() => {
              const parts = explorerPath.split('/');
              parts.pop();
              onNavigate(parts.join('/'));
            }}
          >
            Parent-Ordner ⬆️
          </button>
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.5rem',
        maxHeight: '650px',
        overflowY: 'auto',
        flexGrow: 1
      }}>
        {explorerLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
            <p>Lade Dateien...</p>
          </div>
        ) : explorerError ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent-red)' }}>
            <p>⚠️ {explorerError}</p>
            <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => onNavigate(explorerPath)}>
              Erneut versuchen 🔄
            </button>
          </div>
        ) : explorerFiles.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📁</span>
            <p>Dieser Ordner ist leer.</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ margin: 0, border: 'none', background: 'transparent' }}>
            <table className="results-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', width: '120px' }}>Größe</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', width: '180px' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {explorerFiles.map((file, idx) => {
                  const isDir = file.isDirectory;
                  const ext = file.name.split('.').pop().toLowerCase();
                  const isAudio = ['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext);
                  const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'ts'].includes(ext);
                  
                  let icon = '📄';
                  if (isDir) icon = '📁';
                  else if (isAudio) icon = '🎵';
                  else if (isVideo) icon = '🎬';

                  return (
                    <tr 
                      key={idx}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        background: isDir ? 'rgba(0, 242, 254, 0.01)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.6rem', 
                            cursor: isDir ? 'pointer' : 'default' 
                          }}
                          onClick={() => {
                            if (isDir) {
                              onNavigate(explorerPath ? `${explorerPath}/${file.name}` : file.name);
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                          <span style={{ 
                            color: isDir ? 'var(--accent-cyan)' : 'var(--text-primary)',
                            fontWeight: isDir ? '600' : 'normal',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '550px'
                          }}>
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle' }}>
                        {!isDir && (
                          <span className="size-badge" style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatBytes(file.size)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button 
                            type="button"
                            className="btn btn-secondary btn-icon-only"
                            style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                            title="Verschieben / Umbenennen"
                            onClick={() => onOpenMove(file)}
                          >
                            ✏️
                          </button>
                          <button 
                            type="button"
                            className="btn btn-danger btn-icon-only"
                            title="Löschen"
                            onClick={() => onDelete(file)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewFolderModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <span className="modal-title">Neuen Ordner erstellen</span>
              <button type="button" className="modal-close" onClick={onCloseNewFolder}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1rem 0' }}>
              <div className="form-group">
                <label>Ordnername</label>
                <input 
                  type="text" 
                  className="input-text"
                  value={newFolderName}
                  onChange={(e) => onNewFolderNameChange(e.target.value)}
                  placeholder="z.B. Dokumentationen"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCreateFolder();
                  }}
                />
              </div>
            </div>
            <div className="settings-footer" style={{ border: 'none', padding: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={onCloseNewFolder}>Abbrechen</button>
              <button type="button" className="btn btn-primary" onClick={onCreateFolder}>Erstellen</button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && movingItem && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span className="modal-title">Verschieben / Umbenennen</span>
              <button type="button" className="modal-close" onClick={onCloseMove}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1rem 0' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Aktueller Name: <strong style={{ color: 'var(--text-primary)' }}>{movingItem.name}</strong>
              </p>
              <div className="form-group">
                <label>Zielpfad oder neuer Name</label>
                <input 
                  type="text" 
                  className="input-text"
                  value={moveDestination}
                  onChange={(e) => onMoveDestinationChange(e.target.value)}
                  placeholder="z.B. neuer_name.mp4 oder /Serien/neuer_name.mp4"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onMove();
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  - Wenn der Pfad mit einem <strong>/</strong> beginnt, ist er relativ zum Hauptverzeichnis der Mediathek.<br />
                  - Andernfalls ist er relativ zum aktuellen Unterordner.
                </span>
              </div>
            </div>
            <div className="settings-footer" style={{ border: 'none', padding: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={onCloseMove}>Abbrechen</button>
              <button type="button" className="btn btn-primary" onClick={onMove}>Bestätigen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}