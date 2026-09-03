import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, DownloadIcon, CloseIcon, CastIcon } from './icons.jsx';
import { formatDuration } from './utils.js';

const VideoPlayerModal = ({ isOpen, item, onClose, onDownloadStream, onCast }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const controlsTimeoutRef = useRef(null);

  const filename = item?.filename || item?.streamUrl || '';
  const title = item?.title || item?.metadata?.title || item?.filename || 'Video';
  const seriesTitle = item?.seriesTitle || (item?.isSeriesEpisode ? item?.metadata?.originalCategory : '');
  const initialPosition = item?.progress?.position || item?.progress?.currentTime || 0;

  const streamSrc = item?.streamUrl
    ? item.streamUrl
    : `/api/media/${encodeURIComponent(filename)}`;

  useEffect(() => {
    if (!isOpen || !item) return;

    setIsPlaying(true);
    setDownloadSuccess(false);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        saveProgressAndClose();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        seek(10);
      } else if (e.key === 'ArrowLeft') {
        seek(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, item]);

  // Sync progress every 5s and on pause/close
  const saveProgress = (pos, dur) => {
    if (!filename || pos === undefined) return;
    const finalDur = dur || duration;
    fetch('/api/media/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        position: pos,
        currentTime: pos,
        duration: finalDur,
        seriesTitle: seriesTitle || null,
        episodeTitle: item?.isSeriesEpisode ? title : null,
        percentage: finalDur > 0 ? (pos / finalDur) * 100 : 0
      })
    }).catch(err => console.error('Failed to sync progress:', err));
  };

  const saveProgressAndClose = () => {
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
    onClose();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialPosition > 10 && initialPosition < videoRef.current.duration - 30) {
        videoRef.current.currentTime = initialPosition;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (Math.floor(videoRef.current.currentTime) % 5 === 0) {
        saveProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const seek = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const handleTriggerDownload = async () => {
    setDownloading(true);
    const isUrlFilename = filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('http___') || filename.startsWith('https___');
    try {
      const res = await fetch('/api/media/download-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamUrl: item.streamUrl || streamSrc,
          title: title,
          seriesTitle: seriesTitle,
          filename: !isUrlFilename ? filename : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadSuccess(true);
        if (onDownloadStream) onDownloadStream(data);
      }
    } catch (e) {
      console.error('Download stream error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCast = () => {
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration);
      videoRef.current.pause();
      setIsPlaying(false);
    }
    if (onCast) {
      onCast(item);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="video-player-modal-backdrop"
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.96)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {/* Top Header Controls */}
      <div
        className={`video-player-header ${showControls ? 'visible' : 'hidden'}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
          zIndex: 10,
          transition: 'opacity 0.3s ease',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={saveProgressAndClose}
            className="btn btn-secondary"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff'
            }}
          >
            ◀ Zurück
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: '600' }}>{title}</h2>
            {seriesTitle && <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{seriesTitle}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Cast to TV Button */}
          <button
            onClick={handleCast}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '50px',
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid var(--accent-cyan)',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Auf TV oder DLNA/Chromecast/AirPlay streamen"
          >
            <CastIcon />
            <span>Auf TV streamen (Cast)</span>
          </button>

          {/* In-Player Puffer-Fix Download Button */}
          <button
            onClick={handleTriggerDownload}
            disabled={downloading || downloadSuccess}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '50px',
              backgroundColor: downloadSuccess ? '#10b981' : '#e50914',
              color: '#fff',
              fontWeight: '600',
              border: 'none',
              cursor: downloading || downloadSuccess ? 'default' : 'pointer'
            }}
            title="Film hakelt oder puffert? Lade ihn im Hintergrund auf den Server herunter."
          >
            <DownloadIcon />
            <span>{downloadSuccess ? '✓ Auf Server geladen' : downloading ? 'Lade herunter...' : 'Puffer-Fix: Download 📥'}</span>
          </button>

          <button
            onClick={saveProgressAndClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Main Video Element */}
      <video
        ref={videoRef}
        src={streamSrc}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          saveProgress(duration, duration);
          setIsPlaying(false);
        }}
        onClick={togglePlay}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          objectFit: 'contain',
          backgroundColor: '#000'
        }}
        playsInline
      />

      {/* Bottom Timeline & Controls */}
      <div
        className={`video-player-footer ${showControls ? 'visible' : 'hidden'}`}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.5rem 2rem',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          zIndex: 10,
          transition: 'opacity 0.3s ease',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none'
        }}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setCurrentTime(val);
            if (videoRef.current) videoRef.current.currentTime = val;
          }}
          style={{
            width: '100%',
            height: '6px',
            accentColor: '#e50914',
            cursor: 'pointer',
            marginBottom: '0.8rem'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button
              onClick={togglePlay}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              onClick={() => seek(-10)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ⏪ 10s
            </button>
            <button
              onClick={() => seek(10)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ⏩ 10s
            </button>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleCast}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.9)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
              title="Auf TV streamen (Cast)"
            >
              <CastIcon />
              <span>Cast</span>
            </button>
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else videoRef.current.requestFullscreen();
                }
              }}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ⛶ Vollbild
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
