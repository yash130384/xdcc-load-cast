import React from 'react';
import { CalendarIcon, CloseIcon, PlayIcon, StopIcon } from './icons.jsx';
import { formatBytes } from './utils.js';

export default function VcrModal({
  showVcrModal, recordings, vcrChannels, vcrActiveTab, vcrChannelId, vcrTitle, vcrStartTime, vcrEndTime,
  vcrError, vcrSaving, activeCasts,
  onClose, onTabChange, onStopRecording, onDeleteRecording, onShowEpg,
  onVcrFieldChange, onAddRecording, onOpenManualFromEpg
}) {
  if (!showVcrModal) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ width: '850px', maxWidth: '95%' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📹 Videorekorder & Aufnahmen
          </span>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Tab navigation inside modal */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', paddingBottom: '0.5rem' }}>
          <button
            className={`category-tab-btn ${vcrActiveTab === 'list' ? 'active' : ''}`}
            onClick={() => onTabChange('list')}
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            📋 Aufnahmen ({recordings.length})
          </button>
          <button
            className={`category-tab-btn ${vcrActiveTab === 'new' ? 'active' : ''}`}
            onClick={() => {
              onTabChange('new');
              onVcrFieldChange('vcrError', '');
              if (vcrChannels.length > 0 && !vcrChannelId) {
                onVcrFieldChange('vcrChannelId', String(vcrChannels[0].xtreamStreamId));
              }
              const now = new Date();
              const future = new Date(now.getTime() + 60 * 60 * 1000);
              const formatLocal = (d) => {
                const pad = (n) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              };
              if (!vcrStartTime) onVcrFieldChange('vcrStartTime', formatLocal(now));
              if (!vcrEndTime) onVcrFieldChange('vcrEndTime', formatLocal(future));
            }}
            style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            ➕ Neue Aufnahme planen
          </button>
        </div>

        {vcrActiveTab === 'list' ? (
          /* Recordings list view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {recordings.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <span className="empty-state-icon" style={{ fontSize: '2.5rem' }}>📹</span>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Keine programmierten oder aktiven Aufnahmen vorhanden.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onTabChange('new')}>
                  Aufnahme manuell planen
                </button>
              </div>
            ) : (
              recordings.slice().reverse().map(rec => {
                const startLocal = new Date(rec.startTime).toLocaleString();
                const endLocal = new Date(rec.endTime).toLocaleString();

                let statusBadgeColor = 'var(--text-muted)';
                let statusText = rec.status;
                let isRecording = rec.status === 'recording';

                if (rec.status === 'scheduled') {
                  statusBadgeColor = 'rgba(255, 153, 0, 0.15)';
                  statusText = '⏳ Geplant';
                } else if (rec.status === 'recording') {
                  statusBadgeColor = 'rgba(255, 51, 102, 0.15)';
                  statusText = '🔴 Nimmt auf';
                } else if (rec.status === 'completed') {
                  statusBadgeColor = 'rgba(0, 242, 254, 0.15)';
                  statusText = '✅ Fertig';
                } else if (rec.status === 'error') {
                  statusBadgeColor = 'rgba(255, 75, 75, 0.15)';
                  statusText = `⚠️ Fehler: ${rec.errorMessage || 'Unbekannt'}`;
                }

                return (
                  <div key={rec.id} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {rec.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', marginTop: '0.2rem', fontWeight: '500' }}>
                          📡 {rec.channelName}
                        </div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: statusBadgeColor,
                        color: rec.status === 'recording' ? 'var(--accent-red)' : rec.status === 'scheduled' ? 'var(--accent-orange)' : rec.status === 'completed' ? 'var(--accent-cyan)' : 'var(--accent-red)',
                        border: `1px solid ${rec.status === 'recording' ? 'rgba(255, 51, 102, 0.25)' : 'transparent'}`
                      }}>
                        {statusText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <div><strong>Start:</strong> {startLocal}</div>
                      <div><strong>Ende:</strong> {endLocal}</div>
                    </div>

                    {isRecording && (
                      <div style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="spinner" style={{ color: 'var(--accent-red)', animation: 'pulse 1.5s infinite' }}>🔴</span>
                          <span>Bereits aufgenommen: <strong>{formatBytes(rec.bytesReceived || 0)}</strong></span>
                        </div>
                        {rec.speed > 0 && (
                          <span>Geschwindigkeit: <strong>{formatBytes(rec.speed)}/s</strong></span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {isRecording && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}
                          onClick={() => onStopRecording(rec.id)}
                        >
                          <StopIcon /> Aufnahme stoppen
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => onDeleteRecording(rec.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Löschen
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Manual recording form */
          <form onSubmit={onAddRecording} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vcrError && (
              <div style={{ background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.3)', borderRadius: '6px', padding: '0.75rem', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                ⚠️ {vcrError}
              </div>
            )}

            <div className="form-group">
              <label>Sender auswählen</label>
              <select
                className="input-text"
                value={vcrChannelId}
                onChange={(e) => onVcrFieldChange('vcrChannelId', e.target.value)}
                style={{ background: 'var(--bg-secondary, #151525)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.55rem' }}
              >
                {vcrChannels.length === 0 ? (
                  <option value="">Keine Sender verfügbar (bitte Xtream aktivieren)</option>
                ) : (
                  vcrChannels.map(ch => (
                    <option key={ch.xtreamStreamId} value={ch.xtreamStreamId}>
                      {ch.metadata?.title || ch.filename}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Aufnahme-Titel</label>
              <input
                type="text"
                className="input-text"
                value={vcrTitle}
                onChange={(e) => onVcrFieldChange('vcrTitle', e.target.value)}
                placeholder="z. B. Tagesschau"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Startzeit</label>
                <input
                  type="datetime-local"
                  className="input-text"
                  value={vcrStartTime}
                  onChange={(e) => onVcrFieldChange('vcrStartTime', e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Endzeit</label>
                <input
                  type="datetime-local"
                  className="input-text"
                  value={vcrEndTime}
                  onChange={(e) => onVcrFieldChange('vcrEndTime', e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => onTabChange('list')}>
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary" disabled={vcrSaving || vcrChannels.length === 0}>
                {vcrSaving ? '⏳ Speichern...' : 'Aufnahme planen 💾'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}