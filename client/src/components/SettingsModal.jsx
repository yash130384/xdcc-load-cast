import React from 'react';
import { CloseIcon, SettingsIcon } from './icons.jsx';

export default function SettingsModal({
  showSettings, settings, activeSettingsTab, tempDownloadDir, tempUseSSL, tempKeepDays,
  tempTailscaleBypassIrc, tempTailscaleLocalAddress, tempIrcSearchTimeout,
  tempAllowTailscaleIp, tempCustomLocalIp, tempXxxHideEnabled, verifyPin, currentPinInput, newPinInput,
  tempXtreamHost, tempXtreamUsername, tempXtreamPassword, tempXtreamEnabled, tempXtreamSyncIntervalHours,
  logsContent, loadingLogs, autoScrollActive, wsConnected,
  tempCheckIntervalHours,
  onClose, onTabChange, onSave, onFieldChange, onFetchLogs, onLogsScroll,
  onOpenObsoleteModal, onOpenLogsModal, onPinVerify
}) {
  if (!showSettings) return null;

  return (
    <div className="modal-overlay">
      <div className="modal settings-modal">
        <div className="modal-header">
          <span className="modal-title">Einstellungen</span>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="settings-container">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <button
              type="button"
              className={`settings-tab-btn ${activeSettingsTab === 'general' ? 'active' : ''}`}
              onClick={() => onTabChange('general')}
            >
              ⚙️ Allgemein
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeSettingsTab === 'network' ? 'active' : ''}`}
              onClick={() => onTabChange('network')}
            >
              🌐 Netzwerk & Tailscale
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeSettingsTab === 'xtream' ? 'active' : ''}`}
              onClick={() => onTabChange('xtream')}
            >
              📺 Xtream IPTV
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeSettingsTab === 'parental' ? 'active' : ''}`}
              onClick={() => onTabChange('parental')}
            >
              🤫 Jugendschutz
            </button>
            <button
              type="button"
              className={`settings-tab-btn ${activeSettingsTab === 'logs' ? 'active' : ''}`}
              onClick={() => onTabChange('logs')}
            >
              📋 System-Logs
            </button>
          </div>

          {/* Content Panel */}
          <div className="settings-content">
            {activeSettingsTab === 'general' && (
              <div className="settings-pane">
                <h3>Allgemeine Einstellungen</h3>

                <div className="form-group">
                  <label>Download-Verzeichnis</label>
                  <input
                    type="text"
                    className="input-text"
                    value={tempDownloadDir}
                    onChange={(e) => onFieldChange('downloadDir', e.target.value)}
                    placeholder="/Pfad/zu/deinen/Downloads"
                  />
                  <span className="form-helper">
                    Gibt das Zielverzeichnis an, in dem die XDCC-Dateien abgelegt werden.
                  </span>
                </div>

                <div className="toggle-group">
                  <div className="toggle-group-label">
                    <span>SSL/TLS standardmäßig aktivieren</span>
                    <span>Verbinde mit IRC-Servern standardmäßig über SSL (Port 6697)</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tempUseSSL}
                      onChange={(e) => onFieldChange('useSSL', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Löschfrist für Mediathek (Tage)</label>
                  <input
                    type="number"
                    className="input-text"
                    value={tempKeepDays}
                    onChange={(e) => onFieldChange('keepDays', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    min="0"
                    placeholder="0 (deaktiviert)"
                  />
                  <span className="form-helper">
                    Gibt an, wie viele Tage Dateien in der Mediathek behalten werden. 0 deaktiviert die automatische Löschung.
                  </span>
                </div>

                <div className="form-group">
                  <label>Abfrageintervall für neue Folgen (Stunden)</label>
                  <input
                    type="number"
                    className="input-text"
                    value={tempCheckIntervalHours}
                    onChange={(e) => onFieldChange('checkIntervalHours', Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    placeholder="3"
                  />
                  <span className="form-helper">
                    Gibt an, wie oft (in Stunden) automatisch nach neuen Folgen gesucht werden soll.
                  </span>
                </div>
              </div>
            )}

            {activeSettingsTab === 'network' && (
              <div className="settings-pane">
                <h3>Netzwerk & Tailscale</h3>

                <div className="toggle-group">
                  <div className="toggle-group-label">
                    <span>Tailscale IP-Adresse zulassen</span>
                    <span>Erlaubt der IP-Erkennung, die Tailscale-IP (100.x.y.z) für Streaming/Chromecast zu verwenden</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tempAllowTailscaleIp}
                      onChange={(e) => onFieldChange('allowTailscaleIp', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-group-label">
                    <span>IRC über lokales Interface zwingen</span>
                    <span>Umgeht VPN/Tailscale für IRC/DCC-Verbindungen (empfohlen)</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tempTailscaleBypassIrc}
                      onChange={(e) => onFieldChange('tailscaleBypassIrc', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Lokale Bindungs-IP für IRC/DCC (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-text"
                      value={tempTailscaleLocalAddress}
                      onChange={(e) => onFieldChange('tailscaleLocalAddress', e.target.value)}
                      placeholder="z. B. 192.168.178.50 (leer lassen für Auto-Erkennung)"
                    />
                    {tempTailscaleLocalAddress && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onFieldChange('tailscaleLocalAddress', '')}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Leeren
                      </button>
                    )}
                  </div>
                  <span className="form-helper">
                    Falls aktiv, wird ausgehender IRC- und DCC-Verkehr an diese IP gebunden. Wenn leer, wird deine LAN-IP automatisch ermittelt.
                  </span>
                </div>

                <div className="form-group">
                  <label>Benutzerdefinierte Streaming-IP (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-text"
                      value={tempCustomLocalIp}
                      onChange={(e) => onFieldChange('customLocalIp', e.target.value)}
                      placeholder="z. B. 192.168.178.100 (leer lassen für Auto-Erkennung)"
                    />
                    {tempCustomLocalIp && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onFieldChange('customLocalIp', '')}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Leeren
                      </button>
                    )}
                  </div>
                  <span className="form-helper">
                    Manuelle IP-Adresse zum Erstellen von Stream-Links für Chromecast. Nützlich bei komplexen Netzwerk-Setups oder VPNs.
                  </span>
                </div>

                <div className="form-group">
                  <label>Such-Timeout für IRC/TopDL (Sekunden)</label>
                  <input
                    type="number"
                    className="input-text"
                    value={tempIrcSearchTimeout}
                    onChange={(e) => onFieldChange('ircSearchTimeout', Math.max(5, parseInt(e.target.value, 10) || 5))}
                    min="5"
                    placeholder="24"
                  />
                  <span className="form-helper">
                    Gibt an, wie viele Sekunden absolut auf Suchergebnisse (z. B. TopDL) gewartet werden soll. Standard: 24 Sekunden.
                  </span>
                </div>

                {settings.network && (
                  <div className="network-info-box">
                    <div className="network-info-header">
                      🛰️ Erkannte Netzwerk-Schnittstellen
                      {settings.network.tailscaleDetected && (
                        <span className="ts-badge active">Tailscale aktiv</span>
                      )}
                    </div>
                    <div className="network-interfaces-list">
                      {settings.network.allIps && settings.network.allIps.length > 0 ? (
                        settings.network.allIps.map((ip, idx) => (
                          <div key={idx} className="network-interface-item">
                            <div className="interface-meta">
                              <span className="interface-name">{ip.interface}</span>
                              <span className="interface-ip">{ip.address}</span>
                              {ip.isTailscale && <span className="ts-badge inline">Tailscale</span>}
                            </div>
                            <div className="interface-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => onFieldChange('tailscaleLocalAddress', ip.address)}
                                title="Für IRC-Bindung übernehmen"
                              >
                                Bind IP
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                onClick={() => onFieldChange('customLocalIp', ip.address)}
                                title="Als Streaming-IP übernehmen"
                              >
                                Stream IP
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-interfaces">Keine externen Schnittstellen gefunden.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSettingsTab === 'xtream' && (
              <div className="settings-pane">
                <h3>Xtream Codes (IPTV/VOD)</h3>

                <div className="toggle-group">
                  <div className="toggle-group-label">
                    <span>Xtream Codes aktivieren</span>
                    <span>Integriere IPTV/VOD-Streams in die Mediathek</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tempXtreamEnabled}
                      onChange={(e) => onFieldChange('xtreamEnabled', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {tempXtreamEnabled && (
                  <div className="xtream-fields-container">
                    <div className="form-group">
                      <label>Server-URL</label>
                      <input
                        type="text"
                        className="input-text"
                        value={tempXtreamHost}
                        onChange={(e) => onFieldChange('xtreamHost', e.target.value)}
                        placeholder="http://iptv-server.com:8080"
                      />
                    </div>
                    <div className="form-group">
                      <label>Benutzername</label>
                      <input
                        type="text"
                        className="input-text"
                        value={tempXtreamUsername}
                        onChange={(e) => onFieldChange('xtreamUsername', e.target.value)}
                        placeholder="Benutzername"
                      />
                    </div>
                    <div className="form-group">
                      <label>Passwort</label>
                      <input
                        type="password"
                        className="input-text"
                        value={tempXtreamPassword}
                        onChange={(e) => onFieldChange('xtreamPassword', e.target.value)}
                        placeholder="Passwort"
                      />
                    </div>
                    <div className="form-group">
                      <label>Sync-Intervall (Stunden)</label>
                      <input
                        type="number"
                        className="input-text"
                        value={tempXtreamSyncIntervalHours}
                        onChange={(e) => onFieldChange('xtreamSyncIntervalHours', e.target.value)}
                        placeholder="1"
                        min="1"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSettingsTab === 'parental' && (
              <div className="settings-pane">
                <h3>Jugendschutz (Adult-Inhalte)</h3>

                <div className="toggle-group">
                  <div className="toggle-group-label">
                    <span>XXX-Inhalte ausblenden</span>
                    <span>Blendet Filme, Serien und Live-TV mit adult-Inhalten aus</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={tempXxxHideEnabled}
                      onChange={(e) => onFieldChange('xxxHideEnabled', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {settings.xxxHideEnabled && !tempXxxHideEnabled && (
                  <div className="form-group warning-border">
                    <label style={{ color: 'var(--accent-red)' }}>Sperrcode zur Freigabe</label>
                    <input
                      type="password"
                      className="input-text"
                      value={verifyPin}
                      onChange={(e) => onFieldChange('verifyPin', e.target.value)}
                      placeholder="Aktuellen Sperrcode eingeben"
                    />
                  </div>
                )}

                <div className="pin-change-box">
                  <label className="box-title">Sperrcode ändern</label>
                  <div className="pin-change-inputs">
                    <div className="form-group flex-1">
                      <label>Aktueller Sperrcode</label>
                      <input
                        type="password"
                        className="input-text"
                        value={currentPinInput}
                        onChange={(e) => onFieldChange('currentPinInput', e.target.value)}
                        placeholder="Code"
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>Neuer Sperrcode</label>
                      <input
                        type="password"
                        className="input-text"
                        value={newPinInput}
                        onChange={(e) => onFieldChange('newPinInput', e.target.value)}
                        placeholder="Neuer Code"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSettingsTab === 'logs' && (
              <div className="settings-pane logs-pane">
                <h3>Systemdiagnose & Logs</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Sieh dir die System-Logs an, um eventuelle DCC-Fehler, Verbindungsprobleme oder IPTV Sync-Events zu analysieren.
                </p>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'var(--border-color)',
                    padding: '0.8rem'
                  }}
                  onClick={() => {
                    onFetchLogs();
                    onOpenLogsModal();
                  }}
                >
                  📋 System-Logs ansehen
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}