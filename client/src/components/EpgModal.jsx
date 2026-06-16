import React from 'react';
import { CloseIcon, CalendarIcon } from './icons.jsx';

export default function EpgModal({
  showEpgModal, epgChannel, epgListings, loadingEpg, epgError, recordings,
  onClose, onScheduleRecording, onOpenManualFromEpg
}) {
  if (!showEpgModal || !epgChannel) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ width: '750px', maxWidth: '95%' }}>
        <div className="modal-header">
          <div>
            <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📅 Programmführer (EPG)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', fontWeight: '500', marginTop: '0.2rem', display: 'block' }}>
              {epgChannel.metadata?.title || epgChannel.filename}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {loadingEpg ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
              <p>Lade elektronischen Programmführer vom IPTV Server...</p>
            </div>
          ) : epgError ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--accent-red)' }}>{epgError}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Kein automatisches EPG für diesen Sender verfügbar. Du kannst eine manuelle Aufnahme planen.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={onOpenManualFromEpg}>
                Manuelle Aufnahme planen ✍️
              </button>
            </div>
          ) : epgListings.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Keine Programmdaten für diesen Sender verfügbar.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={onOpenManualFromEpg}>
                Manuelle Aufnahme planen ✍️
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {epgListings.map((prog, idx) => {
                const startMs = prog.start_timestamp ? parseInt(prog.start_timestamp) * 1000 : new Date(prog.start.replace(' ', 'T')).getTime();
                const endMs = prog.end_timestamp ? parseInt(prog.end_timestamp) * 1000 : new Date(prog.end.replace(' ', 'T')).getTime();

                const startDate = new Date(startMs);
                const endDate = new Date(endMs);
                const timeStr = `${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                const dateStr = startDate.toLocaleDateString();

                const nowMs = Date.now();
                const isCurrent = nowMs >= startMs && nowMs < endMs;
                const isPast = nowMs >= endMs;

                const isScheduled = recordings.some(rec =>
                  rec.streamId === epgChannel.xtreamStreamId &&
                  Math.abs(new Date(rec.startTime).getTime() - startMs) < 60000 &&
                  (rec.status === 'scheduled' || rec.status === 'recording')
                );

                return (
                  <div key={idx} style={{
                    background: isCurrent ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255, 255, 255, 0.015)',
                    border: isCurrent ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.9rem 1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                          📅 {dateStr} | ⏰ {timeStr}
                        </span>
                        {isCurrent && (
                          <span style={{
                            padding: '0.15rem 0.4rem',
                            background: 'rgba(0, 242, 254, 0.15)',
                            color: 'var(--accent-cyan)',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold'
                          }}>
                            LÄUFT JETZT
                          </span>
                        )}
                        {isScheduled && (
                          <span style={{
                            padding: '0.15rem 0.4rem',
                            background: 'rgba(255, 153, 0, 0.15)',
                            color: 'var(--accent-orange)',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold'
                          }}>
                            GEPLANT 🔴
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                        {prog.title}
                      </div>
                      {prog.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                          {prog.description}
                        </div>
                      )}
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {!isPast && (
                        <button
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            borderColor: isScheduled ? 'rgba(255, 153, 0, 0.3)' : 'var(--border-color)',
                            color: isScheduled ? 'var(--accent-orange)' : 'var(--text-primary)'
                          }}
                          disabled={isScheduled}
                          onClick={() => onScheduleRecording(prog)}
                        >
                          {isScheduled ? 'Geplant 🔴' : 'Aufnehmen 📹'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Keine passende Sendung dabei?
          </span>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={onOpenManualFromEpg}>
            Manuelles Zeitfenster aufnehmen ✍️
          </button>
        </div>
      </div>
    </div>
  );
}