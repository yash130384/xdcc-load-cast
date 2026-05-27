import React, { useState, useEffect, useRef } from 'react';

// Custom inline SVG Icons for zero-dependency and clean layout
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

const CancelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
);

const CastIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8A13 13 0 0 1 14 20M2 20h.01M22 2H2a2 2 0 0 0-2 2v4h2V4h20v14h-7v2h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path></svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>
);

// Formatting utilities
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds || seconds === Infinity) return '--:--';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function highlightMatch(filename, query) {
  if (!query || !query.trim()) return filename;
  try {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return filename.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="hit">$1</span>');
  } catch (e) {
    return filename;
  }
}

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSource, setSearchSource] = useState('xdcc'); // 'xdcc' or 'moviegods'
  const [topDlResults, setTopDlResults] = useState(null);
  const [topDlLoading, setTopDlLoading] = useState(false);
  const [topDlError, setTopDlError] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('xdcc_search_history') || '[]');
    } catch {
      return [];
    }
  });

  const [downloads, setDownloads] = useState([]);
  const [castingItem, setCastingItem] = useState(null);
  const [chromecastDevices, setChromecastDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [activeCasts, setActiveCasts] = useState([]);
  const [pendingCasts, setPendingCasts] = useState({});
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'Filme' | 'Serien' | 'Musik' | 'Sonstige'
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('queue'); // 'queue' or 'library'
  const [settings, setSettings] = useState({ downloadDir: '', useSSLByDefault: true, keepDays: 0 });
  
  const [tempDownloadDir, setTempDownloadDir] = useState('');
  const [tempUseSSL, setTempUseSSL] = useState(true);
  const [tempKeepDays, setTempKeepDays] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const [showObsoleteModal, setShowObsoleteModal] = useState(false);
  const [selectedObsoleteFiles, setSelectedObsoleteFiles] = useState([]);
  
  // Collapse state for logs: { downloadId: boolean }
  const [expandedLogs, setExpandedLogs] = useState({});
  // Log message store: { downloadId: [string] }
  const [downloadLogs, setDownloadLogs] = useState({});

  const wsRef = useRef(null);

  // Initialize and WebSockets setup
  useEffect(() => {
    // Fetch initial settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setTempDownloadDir(data.downloadDir);
        setTempUseSSL(data.useSSLByDefault);
        setTempKeepDays(data.keepDays || 0);
      })
      .catch(err => console.error('Error fetching settings:', err));

    // Fetch initial downloads list
    fetch('/api/downloads')
      .then(res => res.json())
      .then(data => {
        setDownloads(data);
      })
      .catch(err => console.error('Error fetching downloads:', err));

    // Fetch active Chromecast streams
    fetchActiveCasts();

    // Fetch local Media Library files
    fetchMediaLibrary();

    // Connect WebSocket
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('WebSocket connection established.');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'init') {
          setDownloads(message.data);
        } else if (message.type === 'progress') {
          const updatedItem = message.data;
          setDownloads(prev => {
            const index = prev.findIndex(item => item.id === updatedItem.id);
            if (index === -1) {
              return [...prev, updatedItem];
            } else {
              const copy = [...prev];
              copy[index] = updatedItem;
              return copy;
            }
          });
          if (updatedItem.status === 'completed') {
            fetchMediaLibrary();
          }
        } else if (message.type === 'message') {
          const { id, text } = message.data;
          setDownloadLogs(prev => {
            const currentLogs = prev[id] || [];
            return {
              ...prev,
              [id]: [...currentLogs, `[${new Date().toLocaleTimeString()}] ${text}`]
            };
          });
        } else if (message.type === 'delete') {
          const { id } = message.data;
          setDownloads(prev => prev.filter(item => item.id !== id));
          setDownloadLogs(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        } else if (message.type === 'activeCasts') {
          setActiveCasts(message.data);
          setPendingCasts(prev => {
            let changed = false;
            const copy = { ...prev };
            message.data.forEach(c => {
              if (copy[c.filename]) {
                delete copy[c.filename];
                changed = true;
              }
            });
            return changed ? copy : prev;
          });
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('WebSocket connection closed. Retrying in 3s...');
        setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Persist search history
  useEffect(() => {
    localStorage.setItem('xdcc_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const fetchTopDl = async () => {
    setTopDlLoading(true);
    setTopDlError('');
    try {
      const res = await fetch(`/api/search?source=moviegods&q=${encodeURIComponent('!topdl german')}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Fehler beim Laden der Top-Downloads');
      }
      const data = await res.json();
      if (data.type === 'topdl') {
        setTopDlResults(data.results);
      } else {
        throw new Error('Unerwartete Datenstruktur erhalten');
      }
    } catch (err) {
      setTopDlError(err.message);
      setTopDlResults([]);
    } finally {
      setTopDlLoading(false);
    }
  };

  useEffect(() => {
    if (searchSource === 'moviegods' && topDlResults === null && !topDlLoading) {
      fetchTopDl();
    }
  }, [searchSource]);

  const handleSearch = async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    
    // Add to history
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== trimmed);
      return [trimmed, ...filtered].slice(0, 10);
    });

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&source=${searchSource}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Suche fehlgeschlagen');
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = async (item) => {
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          server: item.server,
          channel: item.channel,
          botName: item.botName,
          packNumber: item.packNumber,
          filename: item.filename,
          expectedSize: item.sizeBytes,
          useSSL: settings.useSSLByDefault // uses default settings SSL preference
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Download konnte nicht gestartet werden: ${errData.error}`);
      } else {
        // Clear search logs for this specific download id
        const id = `${item.server}_${item.channel}_${item.botName}_${item.packNumber}_${item.filename.replace(/\s+/g, '_')}`;
        setDownloadLogs(prev => ({
          ...prev,
          [id]: [`[${new Date().toLocaleTimeString()}] Download in Warteschlange gestellt...`]
        }));
      }
    } catch (err) {
      alert(`Fehler beim Starten des Downloads: ${err.message}`);
    }
  };

  const handlePause = (id) => {
    fetch(`/api/download/${encodeURIComponent(id)}/pause`, { method: 'POST' })
      .catch(err => console.error('Error pausing:', err));
  };

  const handleResume = (id) => {
    fetch(`/api/download/${encodeURIComponent(id)}/resume`, { method: 'POST' })
      .catch(err => console.error('Error resuming:', err));
  };

  const confirmFilename = (id) => {
    fetch(`/api/download/${encodeURIComponent(id)}/confirm-filename`, { method: 'POST' })
      .catch(err => console.error('Error confirming filename:', err));
  };

  const handleCancel = (id) => {
    fetch(`/api/download/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
      .catch(err => console.error('Error cancelling:', err));
  };

  const handleDelete = (id) => {
    fetch(`/api/download/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { alert(`Löschen fehlgeschlagen: ${data.error}`); });
        }
      })
      .catch(err => console.error('Error deleting:', err));
  };

  const handleDeleteFile = (id, filename) => {
    if (window.confirm(`Möchtest du die Datei "${filename}" wirklich endgültig von der Festplatte löschen?`)) {
      fetch(`/api/download/${encodeURIComponent(id)}?deleteFile=true`, { method: 'DELETE' })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            alert(`Löschen der Datei fehlgeschlagen: ${data.error}`);
          } else {
            fetchMediaLibrary();
          }
        })
        .catch(err => console.error('Error deleting file:', err));
    }
  };

  const handleDeleteMediaFile = (filename) => {
    if (window.confirm(`Möchtest du die Datei "${filename}" wirklich endgültig von der Festplatte löschen?`)) {
      fetch(`/api/media-library/${encodeURIComponent(filename)}`, { method: 'DELETE' })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            alert(`Löschen der Datei fehlgeschlagen: ${data.error}`);
          } else {
            fetchMediaLibrary();
          }
        })
        .catch(err => console.error('Error deleting library file:', err));
    }
  };

  const getObsoleteFiles = () => {
    if (!settings.keepDays || settings.keepDays <= 0) return [];
    const cutoff = Date.now() - (settings.keepDays * 24 * 60 * 60 * 1000);
    return mediaLibrary.filter(item => item.mtime < cutoff);
  };

  const filteredLibrary = mediaLibrary.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(librarySearchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    const cat = item.metadata?.category || 'Sonstige';
    return cat === selectedCategory;
  });

  const handleBulkDeleteObsolete = () => {
    if (selectedObsoleteFiles.length === 0) {
      alert("Es sind keine Dateien zum Löschen ausgewählt.");
      return;
    }
    if (window.confirm(`Möchtest du die ausgewählten ${selectedObsoleteFiles.length} Dateien wirklich endgültig löschen?`)) {
      fetch('/api/media-library/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filenames: selectedObsoleteFiles })
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            alert(`Löschen fehlgeschlagen: ${data.error}`);
          } else {
            if (data.failed && data.failed.length > 0) {
              alert(`Einige Dateien konnten nicht gelöscht werden:\n${data.failed.map(f => `${f.filename}: ${f.error}`).join('\n')}`);
            }
            setShowObsoleteModal(false);
            fetchMediaLibrary();
          }
        })
        .catch(err => console.error('Error during bulk delete:', err));
    }
  };

  const fetchActiveCasts = () => {
    fetch('/api/chromecast/active')
      .then(res => res.json())
      .then(data => {
        setActiveCasts(data);
      })
      .catch(err => console.error('Error fetching active casts:', err));
  };

  const fetchDevices = () => {
    setLoadingDevices(true);
    fetch('/api/chromecast/devices')
      .then(res => res.json())
      .then(data => {
        setChromecastDevices(data);
        setLoadingDevices(false);
      })
      .catch(err => {
        console.error('Error fetching Chromecast devices:', err);
        setLoadingDevices(false);
      });
  };

  const playLocal = (id) => {
    const item = downloads.find(d => d.id === id);
    if (!item) {
      alert('Datei in Warteschlange nicht gefunden.');
      return;
    }
    window.open(`/api/media/${encodeURIComponent(item.filename)}`, '_blank');
  };

  const startCast = (downloadId, deviceName) => {
    const item = downloads.find(d => d.id === downloadId);
    if (!item) return;
    const filename = item.filename;

    setPendingCasts(prev => ({ ...prev, [filename]: true }));
    setTimeout(() => {
      setPendingCasts(prev => {
        if (prev[filename]) {
          const copy = { ...prev };
          delete copy[filename];
          return copy;
        }
        return prev;
      });
    }, 12000);

    fetch('/api/chromecast/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ downloadId, deviceName })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          alert(`Streaming konnte nicht gestartet werden: ${errData.error}`);
          setPendingCasts(prev => {
            const copy = { ...prev };
            delete copy[filename];
            return copy;
          });
        } else {
          fetchActiveCasts();
          setCastingItem(null);
        }
      })
      .catch(err => {
        alert(`Streaming-Fehler: ${err.message}`);
        setPendingCasts(prev => {
          const copy = { ...prev };
          delete copy[filename];
          return copy;
        });
      });
  };

  const stopCast = (deviceName) => {
    fetch('/api/chromecast/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceName })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          alert(`Stream konnte nicht gestoppt werden: ${errData.error}`);
        } else {
          fetchActiveCasts();
        }
      })
      .catch(err => {
        alert(`Fehler beim Stoppen: ${err.message}`);
      });
  };

  const handleCastControl = (deviceName, action, value) => {
    fetch('/api/chromecast/control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceName, action, value })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          console.error(`Control error for ${action}:`, errData.error);
        }
      })
      .catch(err => console.error('Connection error during control:', err));
  };

  const fetchMediaLibrary = () => {
    setLoadingLibrary(true);
    fetch('/api/media-library')
      .then(res => res.json())
      .then(data => {
        setMediaLibrary(data);
        setLoadingLibrary(false);
      })
      .catch(err => {
        console.error('Error fetching media library:', err);
        setLoadingLibrary(false);
      });
  };

  const playLocalLibrary = (filename) => {
    window.open(`/api/media/${encodeURIComponent(filename)}`, '_blank');
  };

  const startCastLibrary = (filename, deviceName) => {
    setPendingCasts(prev => ({ ...prev, [filename]: true }));
    setTimeout(() => {
      setPendingCasts(prev => {
        if (prev[filename]) {
          const copy = { ...prev };
          delete copy[filename];
          return copy;
        }
        return prev;
      });
    }, 12000);

    fetch('/api/media-library/cast/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename, deviceName })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          alert(`Streaming konnte nicht gestartet werden: ${errData.error}`);
          setPendingCasts(prev => {
            const copy = { ...prev };
            delete copy[filename];
            return copy;
          });
        } else {
          fetchActiveCasts();
          setCastingItem(null);
        }
      })
      .catch(err => {
        alert(`Streaming-Fehler: ${err.message}`);
        setPendingCasts(prev => {
          const copy = { ...prev };
          delete copy[filename];
          return copy;
        });
      });
  };

  const handleSaveSettings = () => {
    fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        downloadDir: tempDownloadDir,
        useSSLByDefault: tempUseSSL,
        keepDays: parseInt(tempKeepDays, 10) || 0
      })
    })
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setShowSettings(false);
        fetchMediaLibrary();
      })
      .catch(err => {
        alert(`Einstellungen konnten nicht gespeichert werden: ${err.message}`);
      });
  };

  const toggleLogs = (id) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderStatusText = (status) => {
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

  const getStatusClass = (status) => {
    return `download-status-badge status-${status}`;
  };

  // Helper to check if item is currently in downloads list
  const getDownloadState = (item) => {
    const id = `${item.server}_${item.channel}_${item.botName}_${item.packNumber}_${item.filename.replace(/\s+/g, '_')}`;
    const found = downloads.find(d => d.id === id);
    return found ? found.status : null;
  };

  return (
    <div className="app-layout">
      <div className="app-container">
        
        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <span className="brand-icon">⚡</span>
            <div>
              <h1>XDCC Load&Cast</h1>
              <span>Local Search & Transfer</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="btn btn-secondary" style={{ cursor: 'default', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <FolderIcon />
              <span style={{ fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {settings.downloadDir || 'Lädt Ordner...'}
              </span>
            </div>
            <button className="btn btn-primary" onClick={() => {
              setTempDownloadDir(settings.downloadDir);
              setTempUseSSL(settings.useSSLByDefault);
              setTempKeepDays(settings.keepDays || 0);
              setShowSettings(true);
            }}>
              <SettingsIcon />
              Einstellungen
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          
          {/* Left Panel: Search */}
          <div className="card">
            <div className="search-header-tabs">
              <button 
                className={`search-tab-btn ${searchSource === 'xdcc' ? 'active' : ''}`}
                onClick={() => {
                  setSearchSource('xdcc');
                  setError('');
                  setResults(null);
                }}
              >
                🌍 XDCC.eu
              </button>
              <button 
                className={`search-tab-btn ${searchSource === 'moviegods' ? 'active' : ''}`}
                onClick={() => {
                  setSearchSource('moviegods');
                  setError('');
                  setResults(null);
                }}
              >
                🤖 Moviegods (IRC)
              </button>
              {results && <span className="count" style={{ marginLeft: 'auto' }}>{results.length} Ergebnisse</span>}
            </div>

            {/* Search Input Box */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <span className="search-icon-placeholder"><SearchIcon /></span>
                <input
                  type="text"
                  className="search-input"
                  placeholder={searchSource === 'moviegods' ? "Gib einen Suchbegriff ein (z.B. Wayne)..." : "Gib einen Suchbegriff ein (z.B. ubuntu)..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(query);
                  }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => handleSearch(query)}
                disabled={loading}
              >
                {loading ? <span className="spinner">⌛</span> : 'Suchen'}
              </button>
            </div>

            {/* History Tags */}
            {searchHistory.length > 0 && (
              <div className="search-history-container" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verlauf:</span>
                {searchHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(h);
                      handleSearch(h);
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
                  onClick={() => setSearchHistory([])}
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

            {/* Top Downloads Panel */}
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
                          setQuery(item.filename);
                          handleSearch(item.filename);
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

            {/* Search Results Table */}
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
                      const dlState = getDownloadState(item);
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
                              <span className={getStatusClass(dlState)} style={{ fontSize: '0.75rem' }}>
                                {renderStatusText(dlState)}
                              </span>
                            ) : (
                              <button 
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => triggerDownload(item)}
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

          {/* Right Panel: Tabs */}
          <div className="card">
            <div className="search-header-tabs" style={{ marginBottom: '0.5rem' }}>
              <button 
                className={`search-tab-btn ${rightPanelTab === 'queue' ? 'active' : ''}`}
                onClick={() => setRightPanelTab('queue')}
              >
                📥 Warteschlange ({downloads.length})
              </button>
              <button 
                className={`search-tab-btn ${rightPanelTab === 'library' ? 'active' : ''}`}
                onClick={() => {
                  setRightPanelTab('library');
                  fetchMediaLibrary();
                }}
              >
                🎥 Mediathek ({mediaLibrary.length})
              </button>
            </div>

            {rightPanelTab === 'queue' ? (
              downloads.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📥</span>
                  <p>Aktuell keine aktiven Downloads.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Suchergebnisse anklicken, um Downloads zu starten.</p>
                </div>
              ) : (
                <div className="downloads-list">
                  {downloads.map((item) => {
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
                    const activeCastForFile = activeCasts.find(c => c.downloadId === item.id);
                    const isPending = !!pendingCasts[item.filename];

                    return (
                      <div key={item.id} className={`download-item ${item.status}`}>
                        <div className="download-item-header">
                          <div className="download-filename" title={item.filename}>
                            {item.filename}
                          </div>
                          <span className={getStatusClass(item.status)}>
                            {renderStatusText(item.status)}
                          </span>
                        </div>

                        {/* Info lines */}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>Server: <strong style={{ color: 'var(--text-primary)' }}>{item.server}</strong></span>
                          <span>•</span>
                          <span>Bot: <strong style={{ color: 'var(--text-primary)' }}>{item.botName}</strong></span>
                          <span>•</span>
                          <span>Pack: <strong style={{ color: 'var(--text-primary)' }}>#{item.packNumber}</strong></span>
                        </div>

                        {/* Filename Confirmation Prompt */}
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
                                onClick={() => confirmFilename(item.id)}
                              >
                                Namen akzeptieren & fortsetzen
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                onClick={() => handleCancel(item.id)}
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Progress bar */}
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
                          </div>
                        )}

                        {/* Error message */}
                        {isError && item.errorMessage && (
                          <div className="download-error-msg">
                            ⚠️ {item.errorMessage}
                          </div>
                        )}

                        {/* Casting status */}
                        {activeCastForFile && (
                          <div style={{
                            background: 'rgba(0, 242, 254, 0.08)',
                            border: '1px solid rgba(0, 242, 254, 0.25)',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            marginTop: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            color: 'var(--text-primary)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                                📺 Streamt auf {activeCastForFile.device}
                              </span>
                              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                {activeCastForFile.playerState || 'Verbinden'}
                              </span>
                            </div>

                            {/* Progress bar and time labels */}
                            {activeCastForFile.duration > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <input 
                                  type="range"
                                  min={0}
                                  max={activeCastForFile.duration}
                                  value={activeCastForFile.currentTime || 0}
                                  onChange={(e) => handleCastControl(activeCastForFile.device, 'seek', e.target.value)}
                                  style={{
                                    width: '100%',
                                    accentColor: 'var(--accent-cyan)',
                                    cursor: 'pointer',
                                    height: '4px'
                                  }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                                  <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
                                </div>
                              </div>
                            )}

                            {/* Control Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                              {activeCastForFile.playerState === 'PAUSED' ? (
                                <button 
                                  className="btn btn-secondary btn-icon-only" 
                                  style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                  onClick={() => handleCastControl(activeCastForFile.device, 'resume')}
                                  title="Wiedergabe fortsetzen"
                                >
                                  <PlayIcon />
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-secondary btn-icon-only" 
                                  style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                  onClick={() => handleCastControl(activeCastForFile.device, 'pause')}
                                  title="Wiedergabe pausieren"
                                >
                                  <PauseIcon />
                                </button>
                              )}
                              
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                                onClick={() => stopCast(activeCastForFile.device)}
                              >
                                Stoppen
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Pending Casting status */}
                        {isPending && !activeCastForFile && (
                          <div style={{
                            background: 'rgba(0, 242, 254, 0.05)',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            borderRadius: '8px',
                            padding: '0.6rem 0.85rem',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.5rem',
                            color: 'var(--text-secondary)'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span className="spinner">⏳</span> Verbindung wird aufgebaut...
                            </span>
                          </div>
                        )}

                        {/* Collapsible logs */}
                        <div className="log-accordion">
                          <div className="log-accordion-header" onClick={() => toggleLogs(item.id)}>
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

                        {/* Download actions */}
                        <div className="download-actions">
                          {isDownloading && (
                            <button 
                              className="btn btn-secondary btn-icon-only" 
                              title="Pause"
                              onClick={() => handlePause(item.id)}
                            >
                              <PauseIcon />
                            </button>
                          )}
                          {(isPaused || isError || isCancelled) && (
                            <button 
                              className="btn btn-primary btn-icon-only" 
                              title="Fortsetzen"
                              onClick={() => handleResume(item.id)}
                            >
                              <PlayIcon />
                            </button>
                          )}
                          {(isDownloading || isQueued || item.status === 'connecting' || item.status === 'registering' || item.status === 'joining' || item.status === 'requesting' || item.status === 'dcc_negotiating' || item.status === 'confirm_filename') && (
                            <button 
                              className="btn btn-danger btn-icon-only" 
                              title="Abbrechen"
                              onClick={() => handleCancel(item.id)}
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
                                onClick={() => handleDeleteFile(item.id, item.filename)}
                              >
                                <TrashIcon />
                              </button>
                              <button 
                                className="btn btn-primary btn-icon-only" 
                                style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
                                title="Lokal abspielen"
                                onClick={() => playLocal(item.id)}
                              >
                                <PlayIcon />
                              </button>
                              <button 
                                className="btn btn-secondary btn-icon-only" 
                                style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                                title="Auf Chromecast streamen"
                                disabled={isPending}
                                onClick={() => {
                                  setCastingItem(item);
                                  fetchDevices();
                                }}
                              >
                                {isPending ? <span className="spinner">⏳</span> : <CastIcon />}
                              </button>
                            </>
                          )}
                          {(isCompleted || isPaused || isError || isCancelled) && (
                            <button 
                              className="btn btn-secondary btn-icon-only" 
                              style={{ color: 'var(--accent-red)', borderColor: 'rgba(255, 51, 102, 0.2)' }}
                              title="Aus Warteschlange löschen"
                              onClick={() => handleDelete(item.id)}
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Media Library List */
              loadingLibrary && mediaLibrary.length === 0 ? (
                <div className="empty-state">
                  <span className="spinner" style={{ fontSize: '2rem' }}>⏳</span>
                  <p>Mediathek wird gescannt...</p>
                </div>
              ) : mediaLibrary.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">🎥</span>
                  <p>Keine Mediendateien im Download-Ordner gefunden.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Unterstützte Formate: MP4, MKV, AVI, MP3, WAV, M4A, MOV, FLAC
                  </p>
                  <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={fetchMediaLibrary}>
                    Ordner erneut scannen 🔄
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Gefundene Mediendateien:</span>
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={fetchMediaLibrary} disabled={loadingLibrary}>
                      {loadingLibrary ? '⏳ Scanne...' : 'Aktualisieren 🔄'}
                    </button>
                  </div>

                  {/* Obsolete files deletion banner */}
                  {getObsoleteFiles().length > 0 && (
                    <div className="obsolete-banner" style={{
                      background: 'rgba(255, 153, 0, 0.08)',
                      border: '1px solid rgba(255, 153, 0, 0.3)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      gap: '1rem',
                      marginTop: '0.25rem'
                    }}>
                      <div style={{ color: 'var(--accent-orange)' }}>
                        ⚠️ <strong>{getObsoleteFiles().length} veraltete Dateien</strong> gefunden (älter als {settings.keepDays} Tage).
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{
                          background: 'rgba(255, 153, 0, 0.2)',
                          color: 'var(--accent-orange)',
                          borderColor: 'rgba(255, 153, 0, 0.3)',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          boxShadow: 'none'
                        }}
                        onClick={() => {
                          const obsolete = getObsoleteFiles();
                          setSelectedObsoleteFiles(obsolete.map(f => f.filename));
                          setShowObsoleteModal(true);
                        }}
                      >
                        🗑️ Bereinigen
                      </button>
                    </div>
                  )}

                  {/* Local Media Library Search & Categories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="search-input-wrapper" style={{ marginBottom: '0.25rem' }}>
                      <span className="search-icon-placeholder"><SearchIcon /></span>
                      <input
                        type="text"
                        className="search-input"
                        style={{ padding: '0.55rem 1rem 0.55rem 2.5rem', fontSize: '0.85rem' }}
                        placeholder="Mediathek nach Dateinamen filtern..."
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Category Selection Tabs */}
                    <div className="category-tabs-container">
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                      >
                        📁 Alle ({mediaLibrary.length})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Filme' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('Filme')}
                      >
                        🎬 Filme ({mediaLibrary.filter(item => (item.metadata?.category || 'Filme') === 'Filme').length})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Serien' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('Serien')}
                      >
                        📺 Serien ({mediaLibrary.filter(item => item.metadata?.category === 'Serien').length})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Musik' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('Musik')}
                      >
                        🎵 Musik ({mediaLibrary.filter(item => item.metadata?.category === 'Musik').length})
                      </button>
                      {mediaLibrary.some(item => item.metadata?.category === 'Sonstige') && (
                        <button 
                          className={`category-tab-btn ${selectedCategory === 'Sonstige' ? 'active' : ''}`}
                          onClick={() => setSelectedCategory('Sonstige')}
                        >
                          📦 Sonstige ({mediaLibrary.filter(item => item.metadata?.category === 'Sonstige').length})
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredLibrary.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <span className="empty-state-icon">🔍</span>
                      <p>Keine Übereinstimmung für „{librarySearchQuery}“ gefunden.</p>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} 
                        onClick={() => setLibrarySearchQuery('')}
                      >
                        Suche zurücksetzen
                      </button>
                    </div>
                  ) : selectedCategory === 'Musik' ? (
                    /* Compact Music Track Item List */
                    <div className="music-list" style={{ maxHeight: '650px', overflowY: 'auto' }}>
                      {filteredLibrary.map((item, idx) => {
                        const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
                        const isPending = !!pendingCasts[item.filename];
                        
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div className="music-item">
                              <div className="music-info">
                                <div className="music-icon">🎵</div>
                                <div className="music-details">
                                  <div className="music-title" title={item.filename}>
                                    {item.metadata?.title || item.filename}
                                  </div>
                                  <div className="music-meta">
                                    <span className="music-size">{formatBytes(item.sizeBytes)}</span>
                                    <span>•</span>
                                    <span>{new Date(item.mtime).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="music-actions">
                                <button 
                                  className="btn btn-danger btn-icon-only" 
                                  title="Datei von Festplatte löschen"
                                  onClick={() => handleDeleteMediaFile(item.filename)}
                                >
                                  <TrashIcon />
                                </button>
                                <button 
                                  className="btn btn-primary btn-icon-only" 
                                  style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
                                  title="Lokal abspielen"
                                  onClick={() => playLocalLibrary(item.filename)}
                                >
                                  <PlayIcon />
                                </button>
                                <button 
                                  className="btn btn-secondary btn-icon-only" 
                                  style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                                  title="Auf Chromecast streamen"
                                  disabled={isPending}
                                  onClick={() => {
                                    setCastingItem(item);
                                    fetchDevices();
                                  }}
                                >
                                  {isPending ? <span className="spinner">⏳</span> : <CastIcon />}
                                </button>
                              </div>
                            </div>

                            {/* Casting status */}
                            {activeCastForFile && (
                              <div style={{
                                background: 'rgba(0, 242, 254, 0.08)',
                                border: '1px solid rgba(0, 242, 254, 0.25)',
                                borderRadius: '10px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                color: 'var(--text-primary)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                                    📺 Streamt auf {activeCastForFile.device}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    {activeCastForFile.playerState || 'Verbinden'}
                                  </span>
                                </div>

                                {/* Progress bar and time labels */}
                                {activeCastForFile.duration > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <input 
                                      type="range"
                                      min={0}
                                      max={activeCastForFile.duration}
                                      value={activeCastForFile.currentTime || 0}
                                      onChange={(e) => handleCastControl(activeCastForFile.device, 'seek', e.target.value)}
                                      style={{
                                        width: '100%',
                                        accentColor: 'var(--accent-cyan)',
                                        cursor: 'pointer',
                                        height: '4px'
                                      }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                                      <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Control Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                                  {activeCastForFile.playerState === 'PAUSED' ? (
                                    <button 
                                      className="btn btn-secondary btn-icon-only" 
                                      style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                      onClick={() => handleCastControl(activeCastForFile.device, 'resume')}
                                      title="Wiedergabe fortsetzen"
                                    >
                                      <PlayIcon />
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn btn-secondary btn-icon-only" 
                                      style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                      onClick={() => handleCastControl(activeCastForFile.device, 'pause')}
                                      title="Wiedergabe pausieren"
                                    >
                                      <PauseIcon />
                                    </button>
                                  )}
                                  
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                                    onClick={() => stopCast(activeCastForFile.device)}
                                  >
                                    Stoppen
                                  </button>
                                </div>
                              </div>
                            )}

                            {isPending && !activeCastForFile && (
                              <div style={{
                                background: 'rgba(0, 242, 254, 0.05)',
                                border: '1px solid rgba(0, 242, 254, 0.2)',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: 'var(--text-secondary)'
                              }}>
                                <span><span className="spinner">⏳</span> Verbindung wird aufgebaut...</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Movies/Series Card Grid View */
                    <div className="media-grid" style={{ maxHeight: '650px', overflowY: 'auto' }}>
                      {filteredLibrary.map((item, idx) => {
                        const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
                        const isPending = !!pendingCasts[item.filename];
                        
                        const meta = item.metadata || {};
                        const title = meta.title || item.filename;
                        const posterUrl = meta.posterUrl;
                        const year = meta.year || null;
                        const cast = meta.cast || null;
                        const isTv = meta.type === 'series' || meta.category === 'Serien';
                        const imdbLink = meta.imdbId ? `https://www.imdb.com/title/${meta.imdbId}` : null;
                        
                        return (
                          <div key={idx} className="media-card">
                            <div className="media-poster-container">
                              {posterUrl ? (
                                <img src={posterUrl} alt={title} className="media-poster" loading="lazy" />
                              ) : (
                                <div className="media-poster-fallback">
                                  <span className="media-poster-fallback-icon">{isTv ? '📺' : '🎬'}</span>
                                  <span className="media-poster-fallback-title">{title}</span>
                                </div>
                              )}
                              
                              {/* Badges on Poster */}
                              {year && <span className="media-badge-year">{year}</span>}
                              <span className="media-badge-type">{isTv ? 'Serie' : 'Film'}</span>
                              {meta.seasonEpisode && <span className="media-badge-episode">{meta.seasonEpisode}</span>}
                            </div>
                            
                            <div className="media-card-body">
                              <div className="media-card-details">
                                <div className="media-card-title" title={title}>
                                  {title}
                                </div>
                                {cast && (
                                  <div className="media-card-cast" title={cast}>
                                    {cast}
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                                  <span className="media-card-size">{formatBytes(item.sizeBytes)}</span>
                                  {imdbLink && (
                                    <a href={imdbLink} target="_blank" rel="noopener noreferrer" className="media-imdb-link">
                                      ⭐ IMDb
                                    </a>
                                  )}
                                </div>
                              </div>
                              
                              <div className="media-card-actions">
                                <button 
                                  className="btn btn-danger btn-icon-only" 
                                  title="Datei löschen"
                                  onClick={() => handleDeleteMediaFile(item.filename)}
                                >
                                  <TrashIcon />
                                </button>
                                <button 
                                  className="btn btn-primary btn-icon-only" 
                                  style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
                                  title="Lokal abspielen"
                                  onClick={() => playLocalLibrary(item.filename)}
                                >
                                  <PlayIcon />
                                </button>
                                <button 
                                  className="btn btn-secondary btn-icon-only" 
                                  style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                                  title="Auf Chromecast streamen"
                                  disabled={isPending}
                                  onClick={() => {
                                    setCastingItem(item);
                                    fetchDevices();
                                  }}
                                >
                                  {isPending ? <span className="spinner">⏳</span> : <CastIcon />}
                                </button>
                              </div>
                            </div>

                            {/* Casting status */}
                            {activeCastForFile && (
                              <div style={{
                                background: 'rgba(0, 242, 254, 0.08)',
                                borderTop: '1px solid rgba(0, 242, 254, 0.25)',
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                color: 'var(--text-primary)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                                    📺 {activeCastForFile.device}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    {activeCastForFile.playerState || 'Verbinden'}
                                  </span>
                                </div>

                                {/* Progress bar and time labels */}
                                {activeCastForFile.duration > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <input 
                                      type="range"
                                      min={0}
                                      max={activeCastForFile.duration}
                                      value={activeCastForFile.currentTime || 0}
                                      onChange={(e) => handleCastControl(activeCastForFile.device, 'seek', e.target.value)}
                                      style={{
                                        width: '100%',
                                        accentColor: 'var(--accent-cyan)',
                                        cursor: 'pointer',
                                        height: '4px'
                                      }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                                      <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Control Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                                  {activeCastForFile.playerState === 'PAUSED' ? (
                                    <button 
                                      className="btn btn-secondary btn-icon-only" 
                                      style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                      onClick={() => handleCastControl(activeCastForFile.device, 'resume')}
                                      title="Wiedergabe fortsetzen"
                                    >
                                      <PlayIcon />
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn btn-secondary btn-icon-only" 
                                      style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                      onClick={() => handleCastControl(activeCastForFile.device, 'pause')}
                                      title="Wiedergabe pausieren"
                                    >
                                      <PauseIcon />
                                    </button>
                                  )}
                                  
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: 'auto' }}
                                    onClick={() => stopCast(activeCastForFile.device)}
                                  >
                                    Stoppen
                                  </button>
                                </div>
                              </div>
                            )}

                            {isPending && !activeCastForFile && (
                              <div style={{
                                background: 'rgba(0, 242, 254, 0.05)',
                                borderTop: '1px solid rgba(0, 242, 254, 0.2)',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: 'var(--text-secondary)'
                              }}>
                                <span><span className="spinner">⏳</span> Verbindung wird aufgebaut...</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Globale Einstellungen</span>
                <button className="modal-close" onClick={() => setShowSettings(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="form-group">
                <label>Download-Verzeichnis</label>
                <input
                  type="text"
                  className="input-text"
                  value={tempDownloadDir}
                  onChange={(e) => setTempDownloadDir(e.target.value)}
                  placeholder="/Pfad/zu/deinen/Downloads"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                    onChange={(e) => setTempUseSSL(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>Löschfrist für Mediathek (Tage)</label>
                <input
                  type="number"
                  className="input-text"
                  value={tempKeepDays}
                  onChange={(e) => setTempKeepDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  min="0"
                  placeholder="0 (deaktiviert)"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gibt an, wie viele Tage Dateien in der Mediathek behalten werden. 0 deaktiviert die automatische Löschung.
                </span>
              </div>

              <div className="settings-footer">
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                  Abbrechen
                </button>
                <button className="btn btn-primary" onClick={handleSaveSettings}>
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chromecast Modal */}
        {castingItem && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Auf Chromecast streamen</span>
                <button className="modal-close" onClick={() => setCastingItem(null)}>
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
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={fetchDevices} disabled={loadingDevices}>
                      {loadingDevices ? <span className="spinner">⌛</span> : 'Aktualisieren 🔄'}
                    </button>
                  </div>

                  {loadingDevices && chromecastDevices.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span className="spinner" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'inline-block' }}>⏳</span>
                      <p>Suche nach Chromecast Geräten...</p>
                    </div>
                  ) : chromecastDevices.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                      <p>Keine Chromecast Geräte im Netzwerk gefunden.</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Vergewissere dich, dass Chromecast und Computer im selben WLAN/Netzwerk sind.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {chromecastDevices.map((device, idx) => {
                        const activeCastForDevice = activeCasts.find(c => c.device === device.name);
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
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>📺 {device.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IP: {device.host}</div>
                              {activeCastForDevice && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.15rem' }}>
                                  Streamt: {activeCastForDevice.filename}
                                </div>
                              )}
                            </div>
                            
                            {activeCastForDevice ? (
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                                onClick={() => stopCast(device.name)}
                              >
                                Stoppen
                              </button>
                            ) : (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: 'var(--grad-cyan-blue)', border: 'none' }}
                                onClick={() => {
                                  if (castingItem.id) {
                                    startCast(castingItem.id, device.name);
                                  } else {
                                    startCastLibrary(castingItem.filename, device.name);
                                  }
                                }}
                              >
                                Streamen
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
                <button className="btn btn-secondary" onClick={() => setCastingItem(null)}>
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Modal for Obsolete Files */}
        {showObsoleteModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ width: '550px' }}>
              <div className="modal-header">
                <span className="modal-title">Veraltete Dateien bereinigen</span>
                <button className="modal-close" onClick={() => setShowObsoleteModal(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Die folgenden Dateien in deiner Mediathek sind älter als <strong>{settings.keepDays} Tage</strong>. Markierte Dateien werden unwiderruflich von der Festplatte gelöscht.
                </p>

                {/* Select All checkbox */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}>
                  <input
                    type="checkbox"
                    id="select-all-obsolete"
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    checked={selectedObsoleteFiles.length === getObsoleteFiles().length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedObsoleteFiles(getObsoleteFiles().map(f => f.filename));
                      } else {
                        setSelectedObsoleteFiles([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all-obsolete" style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Alle auswählen ({getObsoleteFiles().length})
                  </label>
                </div>

                {/* Obsolete files list */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  {getObsoleteFiles().map((file, idx) => {
                    const isChecked = selectedObsoleteFiles.includes(file.filename);
                    return (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          background: isChecked ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`obsolete-file-${idx}`}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedObsoleteFiles(prev => [...prev, file.filename]);
                            } else {
                              setSelectedObsoleteFiles(prev => prev.filter(f => f !== file.filename));
                            }
                          }}
                        />
                        <label 
                          htmlFor={`obsolete-file-${idx}`}
                          style={{
                            fontSize: '0.82rem',
                            color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flexGrow: 1,
                            userSelect: 'none'
                          }}
                          title={file.filename}
                        >
                          {file.filename}
                        </label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatBytes(file.sizeBytes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="settings-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowObsoleteModal(false)}>
                  Abbrechen
                </button>
                <button 
                  className="btn btn-danger"
                  style={{
                    background: 'rgba(255, 51, 102, 0.2)',
                    color: 'var(--accent-red)',
                    borderColor: 'rgba(255, 51, 102, 0.3)'
                  }}
                  disabled={selectedObsoleteFiles.length === 0}
                  onClick={handleBulkDeleteObsolete}
                >
                  Ausgewählte löschen ({selectedObsoleteFiles.length})
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Status Bar Footer */}
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
    </div>
  );
}

export default App;
