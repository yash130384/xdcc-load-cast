import React from 'react';
import { CloseIcon } from './icons.jsx';
import { formatBytes } from './utils.js';

export default function AudiobookPlayer({
  activeAudiobook, audiobookPlaying, audiobookDuration, audiobookPosition,
  audiobookChapters, showAudiobookPlayer, sleepTimerActive, sleepTimerTime,
  onTogglePlay, onSeek, onSkip, onClose, onSleepTimerToggle, formatTime,
  audioRef, onTimeUpdate, onLoadedMetadata, onEnded
}) {
  if (!showAudiobookPlayer || !activeAudiobook) return null;

  const metadata = activeAudiobook.metadata || {};
  const title = metadata.title || (activeAudiobook.filename ? activeAudiobook.filename.split('/').pop() : 'Unbekannt');
  const artist = metadata.artist || 'Unbekannter Autor';
  const album = metadata.album || 'Unbekanntes Hörbuch';
  const posterUrl = metadata.posterUrl;

  let currentChapterName = 'Standard-Kapitel';
  if (audiobookChapters && audiobookChapters.length > 0) {
    let activeChapter = null;
    for (const ch of audiobookChapters) {
      if (ch.startTime <= audiobookPosition) {
        if (!activeChapter || ch.startTime > activeChapter.startTime) {
          activeChapter = ch;
        }
      }
    }
    if (activeChapter) {
      currentChapterName = activeChapter.title;
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal" style={{ width: '600px', maxWidth: '95%' }}>
        <div className="modal-header">
          <span className="modal-title">🎧 Hörbuch-Player</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 0' }}>
          
          <audio 
            ref={audioRef}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
          />

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div 
              style={{ 
                width: '140px', 
                height: '140px', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
              }}
            >
              {posterUrl ? (
                <img src={`/api/media/${encodeURIComponent(posterUrl)}`} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 10px rgba(0,242,254,0.5))' }}>🎧</div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
              <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}><strong>Autor:</strong> {artist}</p>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}><strong>Album:</strong> {album}</p>
              {audiobookChapters.length > 0 && (
                <div style={{ fontSize: '0.85rem', background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: 'var(--accent-cyan)' }}>
                  <strong>Kapitel:</strong> {currentChapterName}
                </div>
              )}
            </div>
          </div>

          <div>
            <input 
              type="range" 
              min={0} 
              max={audiobookDuration || 100} 
              value={audiobookPosition} 
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              style={{ 
                width: '100%', 
                accentColor: 'var(--accent-cyan)', 
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.1)',
                height: '6px',
                borderRadius: '3px'
              }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              <span>{formatTime(audiobookPosition)}</span>
              <span>{formatTime(audiobookDuration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
            <button 
              className="btn btn-secondary btn-icon-only" 
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              onClick={() => onSkip(-30)}
              title="30s zurückspringen"
            >
              ⏪ 30s
            </button>
            
            <button 
              className="btn btn-primary" 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.5rem',
                background: 'var(--grad-cyan-blue)', 
                border: 'none',
                boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)'
              }}
              onClick={onTogglePlay}
              title={audiobookPlaying ? "Pausieren" : "Abspielen"}
            >
              {audiobookPlaying ? '⏸️' : '▶️'}
            </button>

            <button 
              className="btn btn-secondary btn-icon-only" 
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              onClick={() => onSkip(30)}
              title="30s vorspringen"
            >
              30s ⏩
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>⏱️ Schlaf-Timer</strong>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {[5, 15, 30, 60].map(mins => (
                  <button 
                    key={mins}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                    onClick={() => onSleepTimerToggle(mins * 60, true)}
                  >
                    {mins} Min
                  </button>
                ))}
                <button 
                  className="btn btn-danger"
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                  onClick={() => onSleepTimerToggle(0, false)}
                >
                  Aus
                </button>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input 
                  type="number" 
                  placeholder="Minuten" 
                  style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.8rem' }}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v > 0) {
                      onSleepTimerToggle(v * 60, true);
                    }
                  }}
                />
                {sleepTimerActive && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                    ⏳ {Math.floor(sleepTimerTime / 60)}:{(sleepTimerTime % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', height: '115px' }}>
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>📖 Kapitel ({audiobookChapters.length})</strong>
              {audiobookChapters.length > 0 ? (
                <select 
                  style={{ 
                    width: '100%', 
                    padding: '0.4rem', 
                    background: 'rgba(0,0,0,0.3)', 
                    color: 'white', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}
                  value={audiobookChapters.findIndex(c => c.title === currentChapterName)}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    if (audiobookChapters[idx]) {
                      onSeek(audiobookChapters[idx].startTime);
                    }
                  }}
                >
                  {audiobookChapters.map((ch, idx) => (
                    <option key={idx} value={idx} style={{ background: '#222', color: 'white' }}>
                      {formatTime(ch.startTime)} - {ch.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Keine Kapitelmarken verfügbar</span>
              )}
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <a 
              href={`/api/media/${encodeURIComponent(activeAudiobook.filename)}`} 
              download={activeAudiobook.filename ? activeAudiobook.filename.split('/').pop() : 'hörbuch.m4b'}
              className="btn btn-secondary" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'rgba(0, 242, 254, 0.15)', 
                borderColor: 'rgba(0, 242, 254, 0.25)', 
                color: 'var(--accent-cyan)' 
              }}
            >
              📥 Hörbuch herunterladen
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}