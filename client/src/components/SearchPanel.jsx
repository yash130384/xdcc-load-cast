import React from 'react';
import { SearchIcon, DownloadIcon } from './icons.jsx';
import { formatBytes } from './utils.js';

const SearchPanel = ({ query, results, loading, error, searchSource, searchHistory, topDlResults, topDlLoading, topDlError,
  onQueryChange, onSearch, onSearchSourceChange, onDownload, onPlayLocal, onStartCast,
  fetchTopDl, highlightMatch, onClearHistory }) => {
  return (
    <div className="card">
      <div className="search-header-tabs">
        <button
          className={`search-tab-btn ${searchSource === 'xdcc' ? 'active' : ''}`}
          onClick={() => onSearchSourceChange('xdcc')}
        >
          🌍 XDCC.eu
        </button>
        <button
          className={`search-tab-btn ${searchSource === 'moviegods' ? 'active' : ''}`}
          onClick={() => onSearchSourceChange('moviegods')}
        >
          🤖 Moviegods (IRC)
        </button>
        {results && <span className="count" style={{ marginLeft: 'auto' }}>{results.length} Ergebnisse</span>}
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon-placeholder"><SearchIcon /></span>
          <input
            type="text"
            className="search-input"
            placeholder={searchSource === 'moviegods' ? "Gib einen Suchbegriff ein (z.B. Wayne)..." : "Gib einen Suchbegriff ein (z.B. ubuntu)..."}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch(query);
            }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onSearch(query)}
          disabled={loading}
        >
          {loading ? <span className="spinner">⌛</span> : 'Suchen'}
        </button>
      </div>

      {searchHistory.length > 0 && (
        <div className="search-history-container" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verlauf:</span>
          {searchHistory.map((h, i) => (
            <button
              key={i}
              onClick={() => {
                onQueryChange(h);
                onSearch(h);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.2rem 0.6rem',
                borderRadius: '15px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              {h}
            </button>
          ))}
          <button
            onClick={onClearHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-red)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Verlauf leeren
          </button>
        </div>
      )}

      {searchSource === 'moviegods' && (
        <div className="topdl-container">
          <div className="topdl-header">
            <h3>🔥 Moviegods Top Downloads (German)</h3>
            <button className="btn-refresh" onClick={fetchTopDl} disabled={topDlLoading} title="Aktualisieren">
              {topDlLoading ? '⏳' : '🔄'}
            </button>
          </div>
          {topDlLoading ? (
            <div className="topdl-loading">Top-Downloads werden geladen...</div>
          ) : topDlError ? (
            <div className="topdl-error">{topDlError}</div>
          ) : topDlResults && topDlResults.length > 0 ? (
            <div className="topdl-list">
              {topDlResults.map((item, idx) => (
                <button
                  key={idx}
                  className="topdl-item"
                  onClick={() => {
                    onQueryChange(item.filename);
                    onSearch(item.filename);
                  }}
                >
                  <span className="topdl-gets">{item.gets}</span>
                  <span className="topdl-filename" title={item.filename}>{item.filename}</span>
                  <span className="topdl-size">{item.sizeStr}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="topdl-empty">Keine Top-Downloads gefunden.</div>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ fontSize: '2.5rem' }}>⏳</div>
          <p>Suche läuft auf {searchSource === 'moviegods' ? 'Moviegods IRC' : 'xdcc.eu'}...</p>
        </div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--accent-red)' }}>
          <p>{error}</p>
        </div>
      ) : results === null ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <p>Gib ein Stichwort oben ein, um die Suche auf {searchSource === 'moviegods' ? 'Moviegods IRC' : 'xdcc.eu'} zu starten.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">⚠️</span>
          <p>Keine Ergebnisse gefunden. Versuche es mit einem anderen Begriff.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Datei</th>
                <th>Größe</th>
                <th>Netzwerk</th>
                <th>Bot / Pack</th>
                <th style={{ textAlign: 'right' }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, idx) => {
                const dlState = item.dlState;
                return (
                  <tr key={idx}>
                    <td>
                      <div
                        className="filename-cell"
                        title={item.filename}
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(item.filename, query)
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Hits: {item.gets}
                      </div>
                    </td>
                    <td>
                      <span className="size-badge">{item.sizeStr}</span>
                    </td>
                    <td>
                      <div className="network-badge" title={item.server}>
                        {item.network}
                      </div>
                      <div className="channel-badge" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        {item.channel}
                      </div>
                    </td>
                    <td>
                      <div className="bot-badge">{item.botName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pack #{item.packNumber}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {dlState ? (
                        <span className={`download-status-badge status-${dlState}`} style={{ fontSize: '0.75rem' }}>
                          {item.dlStateText || dlState}
                        </span>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => onDownload(item)}
                        >
                          <DownloadIcon />
                          Laden
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;