import { CastIcon, CloseIcon, StopIcon, PlayIcon, MonitorIcon } from './icons.jsx';
import { formatBytes } from './utils.js';

export default function CastModal({
  castingItem, castDevices, loadingDevices, activeCasts, pendingCasts,
  onClose, onStartCast, onStopCast
}) {
  if (!castingItem) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title"><CastIcon /> Auf TV streamen (Cast)</span>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Datei: <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{castingItem.filename}</strong>
          </p>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Verfügbare Geräte im Netzwerk:</span>
            </div>

            {loadingDevices && castDevices.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'inline-block' }}>⏳</span>
                <p>Suche nach Cast Geräten...</p>
              </div>
            ) : castDevices.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                <p>Keine Cast-Geräte im Netzwerk gefunden.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Vergewissere dich, dass Chromecast/AirPlay/Miracast und Computer im selben WLAN/Netzwerk sind.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {castDevices.map((device, idx) => {
                  const activeCastForDevice = activeCasts.find(c => c.device === device.name);
                  const isPending = pendingCasts && pendingCasts[device.name];

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ marginRight: '1rem', overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {device.type === 'dlna' ? <MonitorIcon /> : device.type === 'airplay' ? <CastIcon /> : <CastIcon />}
                          {' '}{device.name}
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginLeft: '0.5rem', opacity: 0.8 }}>
                            ({device.type === 'dlna' ? 'Miracast/DLNA' : device.type === 'airplay' ? 'AirPlay/Apple' : 'Chromecast'})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP: {device.host}</div>
                        {activeCastForDevice && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.15rem' }}>
                            Streamt: {activeCastForDevice.filename}
                          </div>
                        )}
                        {isPending && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginTop: '0.15rem' }}>
                            <span className="spinner">⏳</span> Starte Stream...
                          </div>
                        )}
                      </div>

                      {activeCastForDevice ? (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => onStopCast(device.name)}
                        >
                          <StopIcon /> Stoppen
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: 'var(--grad-cyan-blue)', border: 'none' }}
                          onClick={() => onStartCast(castingItem, device.name)}
                          disabled={isPending}
                        >
                          <PlayIcon /> Streamen
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}