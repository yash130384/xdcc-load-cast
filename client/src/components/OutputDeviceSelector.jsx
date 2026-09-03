import React, { useState, useRef, useEffect } from 'react';
import { CastIcon, MonitorIcon, ChevronDownIcon } from './icons.jsx';

export default function OutputDeviceSelector({
  selectedDevice = 'local',
  onSelectDevice,
  castDevices = [],
  loadingDevices = false,
  onRefreshDevices,
  activeCasts = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isLocal = selectedDevice === 'local' || !selectedDevice;
  const activeCastForSelected = !isLocal ? activeCasts.find(c => c.device === selectedDevice) : null;

  const handleDeviceClick = (deviceName) => {
    if (onSelectDevice) {
      onSelectDevice(deviceName);
    }
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen && onRefreshDevices) {
      onRefreshDevices();
    }
    setIsOpen(prev => !prev);
  };

  return (
    <div className="output-device-selector" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className={`output-device-btn ${!isLocal ? 'device-active' : ''}`}
        onClick={handleToggle}
        title="Ausgabegerät für Wiedergabe wählen (Lokal / TV Cast)"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.9rem',
          borderRadius: '30px',
          background: !isLocal
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))'
            : 'rgba(0, 0, 0, 0.45)',
          border: !isLocal
            ? '1px solid var(--accent-cyan)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', color: !isLocal ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.8)' }}>
          {isLocal ? <MonitorIcon /> : <CastIcon />}
        </span>
        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isLocal ? 'Ausgabe: Lokal' : `TV: ${selectedDevice}`}
        </span>
        {activeCastForSelected && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} title="Streamt gerade" />
        )}
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div
          className="output-device-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '280px',
            backgroundColor: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)',
            padding: '0.6rem',
            zIndex: 1000,
            color: '#fff'
          }}
        >
          <div style={{ padding: '0.4rem 0.6rem 0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>
              Wiedergabeziel wählen
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRefreshDevices) onRefreshDevices();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.1rem 0.3rem'
              }}
              title="Geräte aktualisieren"
            >
              🔄 Scannen
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
            {/* Local Device Option */}
            <button
              onClick={() => handleDeviceClick('local')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: isLocal ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: isLocal ? 'var(--accent-cyan)' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s'
              }}
              className="device-item-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MonitorIcon />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: isLocal ? '600' : '400' }}>Lokal (Dieses Gerät)</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>Browser Player</div>
                </div>
              </div>
              {isLocal && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>✓</span>}
            </button>

            {/* Cast Devices Section */}
            <div style={{ margin: '0.4rem 0 0.2rem', padding: '0 0.6rem', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>
              Cast-Geräte ({castDevices.length})
            </div>

            {loadingDevices && castDevices.length === 0 ? (
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                <span className="spinner" style={{ display: 'inline-block', marginRight: '0.3rem' }}>⏳</span> Suche Geräte...
              </div>
            ) : castDevices.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                Keine Cast-Geräte im WLAN gefunden.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                {castDevices.map((device, idx) => {
                  const isSelected = selectedDevice === device.name;
                  const activeCast = activeCasts.find(c => c.device === device.name);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDeviceClick(device.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: isSelected ? 'var(--accent-cyan)' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s'
                      }}
                      className="device-item-btn"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <span style={{ color: isSelected ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.7)' }}>
                          {device.type === 'dlna' ? <MonitorIcon /> : <CastIcon />}
                        </span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? '600' : '400', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {device.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {device.type === 'dlna' ? 'DLNA/Miracast' : device.type === 'airplay' ? 'AirPlay' : 'Chromecast'}
                            {activeCast && ' • 🟢 Aktiv'}
                          </div>
                        </div>
                      </div>
                      {isSelected && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
