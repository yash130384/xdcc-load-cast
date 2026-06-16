import { CloseIcon, TerminalIcon } from './icons.jsx';

export default function LogsModal({
  showLogs, logsContent, loadingLogs, autoScrollActive, logsPreRef,
  onClose, onFetchLogs, onScroll, onToggleAutoScroll
}) {
  if (!showLogs) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ width: '800px', maxWidth: '95%' }}>
        <div className="modal-header">
          <span className="modal-title"><TerminalIcon /> System-Logs</span>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Hier sind die letzten System-Logs der Anwendung. Du kannst sie ansehen und kopieren.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: autoScrollActive ? 'var(--accent-green)' : 'var(--text-muted)',
                background: autoScrollActive ? 'rgba(0, 255, 135, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: autoScrollActive ? '1px solid rgba(0, 255, 135, 0.2)' : '1px solid var(--border-color)'
              }}>
                <span className={autoScrollActive ? "spinner" : ""} style={{ display: 'inline-block' }}>
                  {autoScrollActive ? "🟢" : "⏸️"}
                </span>
                <span>{autoScrollActive ? "Live-Stream" : "Pausiert"}</span>
              </span>
              {!autoScrollActive && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', height: 'auto' }}
                  onClick={() => {
                    onToggleAutoScroll(true);
                    if (logsPreRef.current) {
                      logsPreRef.current.scrollTop = logsPreRef.current.scrollHeight;
                    }
                  }}
                >
                  ⬇️ Scrollen
                </button>
              )}
            </div>
          </div>

          {loadingLogs ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
              <p>Lade Logs...</p>
            </div>
          ) : (
            <div>
              <pre
                ref={logsPreRef}
                onScroll={onScroll}
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  color: '#a5b4fc',
                  margin: 0
                }}
              >
                {logsContent}
              </pre>
            </div>
          )}
        </div>

        <div className="settings-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button
            className="btn btn-secondary"
            onClick={onFetchLogs}
            disabled={loadingLogs}
          >
            🔄 Aktualisieren
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
              disabled={!logsContent || loadingLogs}
              onClick={() => {
                navigator.clipboard.writeText(logsContent);
                alert('Logs in die Zwischenablage kopiert!');
              }}
            >
              📋 Kopieren
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}