import React, { useState } from 'react';
import { PauseIcon, PlayIcon, CancelIcon, TrashIcon, TerminalIcon, ChevronUpIcon, ChevronDownIcon } from './icons.jsx';
import { formatBytes, formatDuration } from './utils.js';
import SpeedChart from './SpeedChart.jsx';

const statusText = (status) => {
  switch (status) {
    case 'connecting': return 'Verbinden...';
    case 'registering': return 'Registrieren...';
    case 'joining': return 'Kanal betreten...';
    case 'requesting': return 'Paket anfordern...';
    case 'queued': return 'In Warteschlange';
    case 'dcc_negotiating': return 'Aushandeln...';
    case 'confirm_filename': return 'Bestätigung erforderlich';
    case 'dcc_downloading': return 'Lädt herunter';
    case 'completed': return 'Fertiggestellt';
    case 'extracting': return 'Entpacken...';
    case 'paused': return 'Pausiert';
    case 'error': return 'Fehler';
    case 'cancelled': return 'Abgebrochen';
    default: return status;
  }
};

const statusClass = (status) => `download-status-badge status-${status}`;

const DownloadItem = ({
  item,
  downloadLogs,
  expandedLogs,
  onPause,
  onResume,
  onCancel,
  onDelete,
  onDeleteFile,
  onConfirmFilename,
  onPlayLocal,
  onCopyUrl,
  onToggleLogs
}) => {
  const [copied, setCopied] = useState(false);

  const progressPct = item.expectedSize
    ? Math.min(100, Math.round((item.bytesReceived / item.expectedSize) * 100))
    : 0;

  const isDownloading = item.status === 'dcc_downloading';
  const isQueued = item.status === 'queued';
  const isCompleted = item.status === 'completed';
  const isPaused = item.status === 'paused';
  const isError = item.status === 'error';
  const isCancelled = item.status === 'cancelled';

  const showProgress = ['dcc_negotiating', 'dcc_downloading', 'completed', 'paused', 'extracting'].includes(item.status);
  const logs = downloadLogs[item.id] || [];
  const isExpanded = !!expandedLogs[item.id];

  const handleCopy = (e) => {
    e.stopPropagation();
    if (onCopyUrl) {
      onCopyUrl(item.filename, item);
    } else {
      const streamUrl = `${window.location.protocol}//${window.location.host}/api/media/stream/${encodeURIComponent(item.filename)}`;
      navigator.clipboard?.writeText(streamUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div key={item.id} className={`download-item ${item.status}`}>
      <div className="download-item-header">
        <div className="download-filename" title={item.filename}>
          {item.filename}
        </div>
        <span className={statusClass(item.status)}>
          {statusText(item.status)}
        </span>
      </div>

      {item.isHttp ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>Typ: <strong style={{ color: 'var(--text-primary)' }}>Xtream Codes</strong></span>
          <span>&bull;</span>
          <span>Quelle: <strong style={{ color: 'var(--text-primary)' }}>{item.server}</strong></span>
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>Server: <strong style={{ color: 'var(--text-primary)' }}>{item.server}</strong></span>
          <span>&bull;</span>
          <span>Bot: <strong style={{ color: 'var(--text-primary)' }}>{item.botName}</strong></span>
          <span>&bull;</span>
          <span>Pack: <strong style={{ color: 'var(--text-primary)' }}>#{item.packNumber}</strong></span>
        </div>
      )}

      {item.status === 'confirm_filename' && (
        <div style={{
          background: 'rgba(255, 0, 127, 0.08)',
          border: '1px solid rgba(255, 0, 127, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem 0.85rem',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '0.5rem',
          color: 'var(--text-primary)'
        }}>
          <div>
            <strong style={{ color: 'var(--accent-pink)' }}>⚠️ Dateiname weicht ab!</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Gesucht: <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.filename}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Angeboten: <span style={{ fontFamily: 'monospace', color: 'var(--accent-pink)', fontWeight: 'bold' }}>{item.offeredFilename}</span>
            </div>
          </div>
          <div className="confirm-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'var(--accent-pink)', borderColor: 'var(--accent-pink)', color: '#fff' }}
              onClick={() => onConfirmFilename(item.id)}
            >
              Namen akzeptieren & fortsetzen
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => onCancel(item.id)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {showProgress && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="download-stats">
            <div className="download-meta-info">
              {formatBytes(item.bytesReceived)} / {formatBytes(item.expectedSize)} ({progressPct}%)
            </div>
            <div className="download-speed-eta">
              {isDownloading && (
                <>
                  <span className="speed-text">{formatBytes(item.speed)}/s</span>
                  <span>ETA: {formatDuration(item.eta)}</span>
                </>
              )}
            </div>
          </div>
          <SpeedChart itemId={item.id} history={item.speedHistory} />
        </div>
      )}

      {isError && item.errorMessage && (
        <div className="download-error-msg">
          ⚠️ {item.errorMessage}
        </div>
      )}

      <div className="log-accordion">
        <div className="log-accordion-header" onClick={() => onToggleLogs(item.id)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TerminalIcon />
            Verbindungs-Protokoll ({logs.length} Zeilen)
          </span>
          <span>{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
        </div>
        {isExpanded && (
          <div className="log-content">
            {logs.length === 0 ? (
              <div className="log-line" style={{ color: 'var(--text-muted)' }}>Keine Protokoll-Einträge vorhanden.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="log-line">{log}</div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="download-actions">
        {isDownloading && (
          <button
            className="btn btn-secondary btn-icon-only"
            title="Pause"
            onClick={() => onPause(item.id)}
          >
            <PauseIcon />
          </button>
        )}
        {(isPaused || isError || isCancelled) && (
          <button
            className="btn btn-primary btn-icon-only"
            title="Fortsetzen"
            onClick={() => onResume(item.id)}
          >
            <PlayIcon />
          </button>
        )}
        {(isDownloading || isQueued || item.status === 'connecting' || item.status === 'registering' || item.status === 'joining' || item.status === 'requesting' || item.status === 'dcc_negotiating' || item.status === 'confirm_filename') && (
          <button
            className="btn btn-danger btn-icon-only"
            title="Abbrechen"
            onClick={() => onCancel(item.id)}
          >
            <CancelIcon />
          </button>
        )}
        {isCompleted && (
          <>
            <button
              className="btn btn-danger btn-icon-only"
              style={{ marginRight: 'auto' }}
              title="Datei von Festplatte löschen"
              onClick={() => onDeleteFile(item.id, item.filename)}
            >
              <TrashIcon />
            </button>
            <button
              className="btn btn-secondary btn-icon-only"
              title={copied ? "Kopiert!" : "Stream-URL kopieren"}
              onClick={handleCopy}
              style={{
                color: copied ? 'var(--accent-green, #10b981)' : 'var(--text-secondary)',
                borderColor: copied ? 'var(--accent-green, #10b981)' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {copied ? '✓' : '🔗'}
            </button>
            <button
              className="btn btn-primary btn-icon-only"
              style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
              title="In VLC öffnen"
              onClick={() => onPlayLocal(item.filename || item.id, item)}
            >
              <PlayIcon />
            </button>
          </>
        )}
        {(isCompleted || isPaused || isError || isCancelled) && (
          <button
            className="btn btn-secondary btn-icon-only"
            style={{ color: 'var(--accent-red)', borderColor: 'rgba(255, 51, 102, 0.2)' }}
            title="Aus Warteschlange löschen"
            onClick={() => onDelete(item.id)}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default DownloadItem;