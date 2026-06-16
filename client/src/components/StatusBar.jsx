import React from 'react';

const StatusBar = ({ wsConnected }) => {
  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`}></span>
        <span>
          {wsConnected ? 'Verbunden mit lokalem Backend' : 'Verbindung zum Backend verloren. Verbinde erneut...'}
        </span>
      </div>
      <div>
        <span>Powered by Antigravity AI Engine</span>
      </div>
    </footer>
  );
};

export default StatusBar;