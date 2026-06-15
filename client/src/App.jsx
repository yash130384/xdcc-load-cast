import React, { useState, useEffect, useRef, useMemo } from 'react';

// Custom inline SVG Icons for zero-dependency and clean layout
const PulseCastLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))' }}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-cyan)" />
        <stop offset="100%" stopColor="var(--accent-blue)" />
      </linearGradient>
    </defs>
    <path d="M2 12h3l2-5 3 10 2-7 2 5 2-3h3" />
    <path d="M15 5a8 8 0 0 1 5 5" strokeWidth="2" opacity="0.8" />
    <path d="M17 3a11 11 0 0 1 6 6" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

const MediaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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

const HeartIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "var(--accent-red, #ff3366)" : "none"} stroke={filled ? "var(--accent-red, #ff3366)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
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

function SpeedChart({ itemId, history }) {
  if (!history || history.length < 2) return null;

  const height = 45;
  const width = 300;
  
  // Find max speed in the history to scale the y-axis.
  const maxSpeed = Math.max(...history, 1024 * 1024); // default minimum max is 1MB/s
  
  // Map points to SVG coordinates
  // We want to scale x from 0 to width, and y from height to 0
  const points = history.map((speed, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = height - (speed / maxSpeed) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  
  // We can also make an area path by closing the path to the bottom
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;
  const gradId = `speedGrad-${itemId.replace(/[^a-zA-Z0-9-]/g, '')}`;

  return (
    <div className="download-speed-chart-container" style={{ 
      marginTop: '0.65rem', 
      marginBottom: '0.65rem', 
      width: '100%', 
      height: '50px', 
      position: 'relative',
      background: 'rgba(0, 0, 0, 0.15)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.03)',
      padding: '4px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines (horizontal) */}
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        
        {/* Filled Area under the curve */}
        <path d={areaData} fill={`url(#${gradId})`} />
        
        {/* Stroke Line */}
        <path 
          d={pathData} 
          fill="none" 
          stroke="var(--accent-cyan)" 
          strokeWidth="1.25" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ filter: 'drop-shadow(0px 0px 4px rgba(0, 242, 254, 0.3))' }}
        />
      </svg>
      {/* Maximum speed label in corner */}
      <span style={{ 
        position: 'absolute', 
        top: '4px', 
        left: '6px', 
        fontSize: '0.62rem', 
        fontWeight: 'bold',
        color: 'var(--text-muted)', 
        background: 'rgba(10, 11, 16, 0.75)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '1px 5px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)'
      }}>
        Max: {formatBytes(maxSpeed)}/s
      </span>
      {/* Current/Latest speed label in bottom right corner */}
      <span style={{ 
        position: 'absolute', 
        bottom: '4px', 
        right: '6px', 
        fontSize: '0.62rem', 
        fontWeight: 'bold',
        color: 'var(--accent-cyan)', 
        background: 'rgba(10, 11, 16, 0.75)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(0, 242, 254, 0.15)',
        padding: '1px 5px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)'
      }}>
        {formatBytes(history[history.length - 1])}/s
      </span>
    </div>
  );
}

const getPosterSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/media/${encodeURIComponent(url)}`;
  }
  return url;
};

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
  const [castDevices, setCastDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [activeCasts, setActiveCasts] = useState([]);
  const [pendingCasts, setPendingCasts] = useState({});
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'Lokal' | 'Filme' | 'Serien' | 'Musik' | 'Sonstige'
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [favoritesFilter, setFavoritesFilter] = useState('all'); // 'all' | 'Filme' | 'Serien' | 'Musik' | 'Hörbuch'
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({
    all: 0, Neu: 0, Lokal: 0, Filme: 0, Serien: 0, Videos: 0, Musik: 0, 'Live TV': 0, 'Hörbücher': 0, Favoriten: 0
  });
  const [serverSubcategories, setServerSubcategories] = useState(['all']);
  const [rightPanelTab, setRightPanelTab] = useState('queue'); // 'queue' or 'library'
  const [currentView, setCurrentView] = useState('downloads'); // 'downloads' | 'library'
  const [activeSeriesId, setActiveSeriesId] = useState(null);
  const [settings, setSettings] = useState({ downloadDir: '', useSSLByDefault: true, keepDays: 0, xxxHideEnabled: false });
  
  const [tempDownloadDir, setTempDownloadDir] = useState('');
  const [tempUseSSL, setTempUseSSL] = useState(true);
  const [tempKeepDays, setTempKeepDays] = useState(0);
  const [tempTailscaleBypassIrc, setTempTailscaleBypassIrc] = useState(true);
  const [tempTailscaleLocalAddress, setTempTailscaleLocalAddress] = useState('');
  const [tempIrcSearchTimeout, setTempIrcSearchTimeout] = useState(24);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [tempAllowTailscaleIp, setTempAllowTailscaleIp] = useState(false);
  const [tempCustomLocalIp, setTempCustomLocalIp] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // VCR and EPG states
  const [recordings, setRecordings] = useState([]);
  const [vcrChannels, setVcrChannels] = useState([]);
  const [showVcrModal, setShowVcrModal] = useState(false);
  const [showEpgModal, setShowEpgModal] = useState(false);
  const [epgChannel, setEpgChannel] = useState(null);
  const [epgListings, setEpgListings] = useState([]);
  const [loadingEpg, setLoadingEpg] = useState(false);
  const [epgError, setEpgError] = useState('');
  const [vcrActiveTab, setVcrActiveTab] = useState('list'); // 'list' | 'new'

  // VCR Manual Form states
  const [vcrChannelId, setVcrChannelId] = useState('');
  const [vcrTitle, setVcrTitle] = useState('');
  const [vcrStartTime, setVcrStartTime] = useState('');
  const [vcrEndTime, setVcrEndTime] = useState('');
  const [vcrError, setVcrError] = useState('');
  const [vcrSaving, setVcrSaving] = useState(false);

  // Parental Control/PIN states
  const [tempXxxHideEnabled, setTempXxxHideEnabled] = useState(false);
  const [verifyPin, setVerifyPin] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  
  const [showObsoleteModal, setShowObsoleteModal] = useState(false);
  const [selectedObsoleteFiles, setSelectedObsoleteFiles] = useState([]);
  
  // Collapse state for logs: { downloadId: boolean }
  const [expandedLogs, setExpandedLogs] = useState({});
  // Log message store: { downloadId: [string] }
  const [downloadLogs, setDownloadLogs] = useState({});

  // Application logs state
  const [showLogs, setShowLogs] = useState(false);
  const [logsContent, setLogsContent] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoScrollActive, setAutoScrollActive] = useState(true);
  const logsPreRef = useRef(null);

  // Xtream Codes state
  const [tempXtreamHost, setTempXtreamHost] = useState('');
  const [tempXtreamUsername, setTempXtreamUsername] = useState('');
  const [tempXtreamPassword, setTempXtreamPassword] = useState('');
  const [tempXtreamEnabled, setTempXtreamEnabled] = useState(false);
  const [tempXtreamSyncIntervalHours, setTempXtreamSyncIntervalHours] = useState(1);
  const [xtreamEpisodes, setXtreamEpisodes] = useState({});
  const [loadingXtreamEpisodes, setLoadingXtreamEpisodes] = useState(false);

  // Auto-downloads state
  const [autoDownloads, setAutoDownloads] = useState({});
  const [tempCheckIntervalHours, setTempCheckIntervalHours] = useState(3);
  const [checkingShowId, setCheckingShowId] = useState(null);

  // Audiobook Player States
  const [activeAudiobook, setActiveAudiobook] = useState(null);
  const [showAudiobookPlayer, setShowAudiobookPlayer] = useState(false);
  const [audiobookPlaying, setAudiobookPlaying] = useState(false);
  const [audiobookDuration, setAudiobookDuration] = useState(0);
  const [audiobookPosition, setAudiobookPosition] = useState(0);
  const [audiobookChapters, setAudiobookChapters] = useState([]);
  const audiobookRef = useRef(null);

  // Sleep Timer States
  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  const [sleepTimerTime, setSleepTimerTime] = useState(0); // in seconds

  // Settings File Explorer state
  const [explorerPath, setExplorerPath] = useState('');
  const [explorerFiles, setExplorerFiles] = useState([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerError, setExplorerError] = useState('');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingItem, setMovingItem] = useState(null);
  const [moveDestination, setMoveDestination] = useState('');

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
        setTempCheckIntervalHours(data.checkIntervalHours || 3);
        setTempXtreamHost(data.xtreamHost || '');
        setTempXtreamUsername(data.xtreamUsername || '');
        setTempXtreamPassword(data.xtreamPassword || '');
        setTempXtreamEnabled(!!data.xtreamEnabled);
        setTempXtreamSyncIntervalHours(data.xtreamSyncIntervalHours || 1);
        setTempXxxHideEnabled(!!data.xxxHideEnabled);
        setTempTailscaleBypassIrc(data.tailscaleBypassIrc !== false);
        setTempTailscaleLocalAddress(data.tailscaleLocalAddress || '');
        setTempIrcSearchTimeout(data.ircSearchTimeout || 24);
        setTempAllowTailscaleIp(!!data.allowTailscaleIp);
        setTempCustomLocalIp(data.customLocalIp || '');
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

    // Fetch initial auto downloads
    fetch('/api/auto-download')
      .then(res => res.json())
      .then(data => setAutoDownloads(data))
      .catch(err => console.error('Error fetching auto downloads:', err));

    // Fetch initial VCR recordings
    fetch('/api/recordings')
      .then(res => res.json())
      .then(data => setRecordings(data))
      .catch(err => console.error('Error fetching VCR recordings:', err));

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
        } else if (message.type === 'auto-downloads') {
          setAutoDownloads(message.data);
        } else if (message.type === 'xtream-sync-complete') {
          fetchMediaLibrary();
        } else if (message.type === 'vcr-status') {
          setRecordings(message.data);
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

  const triggerXtreamDownload = async (item, activeSeries = null) => {
    try {
      const title = item.metadata?.title || item.filename;
      const seasonEpisode = item.metadata?.seasonEpisode || '';
      
      const payload = {
        url: item.filename,
        title: seasonEpisode ? `${seasonEpisode} - ${title}` : title
      };

      if (activeSeries && activeSeries.title) {
        payload.seriesTitle = activeSeries.title;
      }

      const res = await fetch('/api/xtream/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Download konnte nicht gestartet werden: ${errData.error}`);
      } else {
        const data = await res.json();
        setDownloadLogs(prev => ({
          ...prev,
          [data.id]: [`[${new Date().toLocaleTimeString()}] HTTP-Download gestartet...`]
        }));
        setCurrentView('downloads');
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

  const handleToggleAutoDownload = (imdbId, title, enabled) => {
    fetch('/api/auto-download/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imdbId, title, enabled })
    })
      .then(res => res.json())
      .then(data => {
        setAutoDownloads(prev => ({
          ...prev,
          [imdbId]: data
        }));
      })
      .catch(err => {
        console.error('Error toggling auto download:', err);
        alert('Fehler beim Ändern des Suchauftrags: ' + err.message);
      });
  };

  const getObsoleteFiles = () => {
    if (!settings.keepDays || settings.keepDays <= 0) return [];
    const cutoff = Date.now() - (settings.keepDays * 24 * 60 * 60 * 1000);
    return mediaLibrary.filter(item => item.mtime < cutoff);
  };

  const availableSubcategories = serverSubcategories;
  const filteredLibrary = mediaLibrary;
  const groupedLibrary = mediaLibrary;
  
  const activeSeries = activeSeriesId 
    ? groupedLibrary.find(g => g.isGroup && (g.imdbId === activeSeriesId || g.title === activeSeriesId || (g.isXtream && g.xtreamSeriesId === activeSeriesId)))
    : null;

  useEffect(() => {
    if (activeSeries && activeSeries.isXtream) {
      const sid = activeSeries.xtreamSeriesId;
      if (!xtreamEpisodes[sid]) {
        setLoadingXtreamEpisodes(true);
        fetch(`/api/xtream/series-episodes?seriesId=${sid}`)
          .then(res => res.json())
          .then(data => {
            setXtreamEpisodes(prev => ({ ...prev, [sid]: data }));
            setLoadingXtreamEpisodes(false);
          })
          .catch(err => {
            console.error('Error loading Xtream episodes:', err);
            setLoadingXtreamEpisodes(false);
          });
      }
    }
  }, [activeSeriesId, activeSeries]);

  useEffect(() => {
    if (activeSeriesId && !activeSeries) {
      setActiveSeriesId(null);
    }
  }, [activeSeriesId, activeSeries]);

  useEffect(() => {
    setActiveSeriesId(null);
  }, [selectedCategory, currentView]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('all');
    setCurrentPage(1);
  };

  const handleSelectSubcategory = (sub) => {
    setSelectedSubcategory(sub);
    setCurrentPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(librarySearchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [librarySearchQuery]);

  useEffect(() => {
    fetchMediaLibrary();
  }, [selectedCategory, selectedSubcategory, debouncedSearchQuery, currentPage]);

  // Audiobook Player Initial Setup and Seek
  useEffect(() => {
    if (activeAudiobook && audiobookRef.current) {
      const audio = audiobookRef.current;
      audio.src = `/api/media/${encodeURIComponent(activeAudiobook.filename)}`;
      audio.load();
      
      const savedPosition = activeAudiobook.progress?.position || 0;
      audio.currentTime = savedPosition;
      setAudiobookPosition(savedPosition);
      
      audio.play().then(() => {
        setAudiobookPlaying(true);
      }).catch(err => {
        console.error('Audiobook autoplay failed:', err);
        setAudiobookPlaying(false);
      });
    }
  }, [activeAudiobook]);

  // Save progress periodically during playback
  useEffect(() => {
    if (!audiobookPlaying || !activeAudiobook) return;
    
    const interval = setInterval(() => {
      if (audiobookRef.current) {
        const position = audiobookRef.current.currentTime;
        saveAudiobookProgress(activeAudiobook.filename, position);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [audiobookPlaying, activeAudiobook]);

  // Sleep Timer Tick
  useEffect(() => {
    if (!sleepTimerActive || sleepTimerTime <= 0) return;
    
    const timer = setInterval(() => {
      setSleepTimerTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSleepTimerActive(false);
          if (audiobookRef.current) {
            audiobookRef.current.pause();
            setAudiobookPlaying(false);
            saveAudiobookProgress(activeAudiobook.filename, audiobookRef.current.currentTime);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [sleepTimerActive, sleepTimerTime, activeAudiobook]);

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
        setCastDevices(data);
        setLoadingDevices(false);
      })
      .catch(err => {
        console.error('Error fetching cast devices:', err);
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

  const fetchRecordings = () => {
    fetch('/api/recordings')
      .then(res => res.json())
      .then(data => setRecordings(data))
      .catch(err => console.error('Error fetching recordings:', err));
  };

  const handleShowEpg = (channel) => {
    setEpgChannel(channel);
    setEpgListings([]);
    setEpgError('');
    setLoadingEpg(true);
    setShowEpgModal(true);

    const streamId = channel.xtreamStreamId;
    fetch(`/api/epg/${streamId}`)
      .then(res => {
        if (!res.ok) throw new Error('EPG-Serverfehler');
        return res.json();
      })
      .then(data => {
        setEpgListings(data.epg_listings || []);
        setLoadingEpg(false);
      })
      .catch(err => {
        setEpgError(err.message || 'Fehler beim Laden des EPG');
        setLoadingEpg(false);
      });
  };

  const handleStopRecording = (id) => {
    fetch(`/api/recordings/${id}/stop`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(`Fehler: ${data.error}`);
        } else {
          fetchRecordings();
        }
      })
      .catch(err => console.error('Error stopping recording:', err));
  };

  const handleDeleteRecording = (id) => {
    if (!confirm('Aufnahme wirklich löschen? Dies bricht ggf. die aktive Aufnahme ab und löscht die Videodatei.')) return;
    fetch(`/api/recordings/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(`Fehler: ${data.error}`);
        } else {
          fetchRecordings();
        }
      })
      .catch(err => console.error('Error deleting recording:', err));
  };

  const handleAddRecording = (e) => {
    e.preventDefault();
    if (!vcrChannelId || !vcrStartTime || !vcrEndTime) {
      setVcrError('Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    const start = new Date(vcrStartTime).getTime();
    const end = new Date(vcrEndTime).getTime();
    if (start >= end) {
      setVcrError('Die Startzeit muss vor der Endzeit liegen.');
      return;
    }

    // Find channel metadata
    // Use raw mediaLibrary items (which are mapped live streams in client)
    const liveChannels = mediaLibrary.filter(item => item.isLive);
    const channel = liveChannels.find(item => String(item.xtreamStreamId) === String(vcrChannelId));
    if (!channel) {
      setVcrError('Sender nicht gefunden.');
      return;
    }

    setVcrSaving(true);
    setVcrError('');

    fetch('/api/recordings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId: channel.xtreamStreamId,
        channelName: channel.metadata?.title || channel.filename,
        streamUrl: channel.filename,
        title: vcrTitle || 'Manuelle Aufnahme',
        startTime: new Date(vcrStartTime).toISOString(),
        endTime: new Date(vcrEndTime).toISOString()
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Fehler beim Speichern');
        return res.json();
      })
      .then(() => {
        setVcrSaving(false);
        setVcrTitle('');
        setVcrStartTime('');
        setVcrEndTime('');
        setVcrActiveTab('list');
        fetchRecordings();
      })
      .catch(err => {
        setVcrError(err.message || 'Fehler beim Speichern');
        setVcrSaving(false);
      });
  };

  const handleScheduleEpgRecording = (prog) => {
    if (!epgChannel) return;
    
    let startIso, endIso;
    if (prog.start_timestamp) {
      startIso = new Date(parseInt(prog.start_timestamp) * 1000).toISOString();
    } else {
      startIso = new Date(prog.start.replace(' ', 'T')).toISOString();
    }

    if (prog.end_timestamp) {
      endIso = new Date(parseInt(prog.end_timestamp) * 1000).toISOString();
    } else {
      endIso = new Date(prog.end.replace(' ', 'T')).toISOString();
    }

    fetch('/api/recordings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId: epgChannel.xtreamStreamId,
        channelName: epgChannel.metadata?.title || epgChannel.filename,
        streamUrl: epgChannel.filename,
        title: prog.title || 'EPG Aufnahme',
        startTime: startIso,
        endTime: endIso
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(`Fehler: ${data.error}`);
        } else {
          alert(`Sendung "${prog.title}" wurde zur Aufnahme programmiert!`);
          fetchRecordings();
        }
      })
      .catch(err => console.error('Error scheduling EPG recording:', err));
  };

  const handleOpenManualFromEpg = () => {
    if (!epgChannel) return;
    setVcrChannelId(String(epgChannel.xtreamStreamId));
    setVcrTitle('');
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);
    const formatLocal = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setVcrStartTime(formatLocal(now));
    setVcrEndTime(formatLocal(future));
    setVcrActiveTab('new');
    setShowEpgModal(false);
    setShowVcrModal(true);
    fetchRecordings();
  };

  const openVcrModalAndLoad = () => {
    fetchRecordings();
    setShowVcrModal(true);
    const params = new URLSearchParams({
      category: 'Live TV',
      limit: '1000'
    });
    fetch(`/api/media-library?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setVcrChannels(data.items || []);
      })
      .catch(err => console.error('Error fetching VCR channels:', err));
  };

  const fetchMediaLibrary = (forceScan = false) => {
    setLoadingLibrary(true);
    const isForce = forceScan === true;
    const limitVal = selectedCategory === 'Favoriten' ? '1000' : '60';
    const params = new URLSearchParams({
      category: selectedCategory,
      subcategory: selectedSubcategory,
      search: debouncedSearchQuery,
      page: String(currentPage),
      limit: limitVal
    });
    if (isForce) {
      params.append('forceScan', 'true');
    }
    fetch(`/api/media-library?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setMediaLibrary(prev => {
          if (currentPage === 1) {
            return data.items || [];
          } else {
            const existingIds = new Set(prev.map(i => i.isGroup ? (i.imdbId || i.title || i.xtreamSeriesId) : i.filename));
            const newItems = (data.items || []).filter(i => {
              const id = i.isGroup ? (i.imdbId || i.title || i.xtreamSeriesId) : i.filename;
              return !existingIds.has(id);
            });
            return [...prev, ...newItems];
          }
        });
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 0);
        setCategoryCounts(data.counts || {
          all: 0, Neu: 0, Lokal: 0, Filme: 0, Serien: 0, Videos: 0, Musik: 0, 'Live TV': 0, 'Hörbücher': 0, Favoriten: 0
        });
        setServerSubcategories(data.availableSubcategories || ['all']);
        setLoadingLibrary(false);
      })
      .catch(err => {
        console.error('Error fetching media library:', err);
        setLoadingLibrary(false);
      });
  };

  const toggleFavorite = (item) => {
    const isGroup = item.isGroup;
    const favKey = isGroup
      ? (item.xtreamSeriesId || item.imdbId || item.title || item.metadata?.imdbId || item.metadata?.title)
      : item.filename;
    
    const nextFavorite = !item.favorite;
    
    setMediaLibrary(prev => prev.map(i => {
      const k = i.isGroup
        ? (i.xtreamSeriesId || i.imdbId || i.title || i.metadata?.imdbId || i.metadata?.title)
        : i.filename;
      if (String(k) === String(favKey)) {
        return { ...i, favorite: nextFavorite };
      }
      return i;
    }));
    
    fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: favKey, isFavorite: nextFavorite })
    })
      .then(res => res.json())
      .then(data => {
        fetchMediaLibrary();
      })
      .catch(err => {
        console.error('Error toggling favorite:', err);
        fetchMediaLibrary();
      });
  };

  const handleScroll = (e) => {
    const target = e.target;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
      if (!loadingLibrary && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    }
  };

  const renderMusicItem = (item, idx) => {
    const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
    const isPending = !!pendingCasts[item.filename];
    
    return (
      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div className="music-item">
          <div className="music-info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="music-icon" style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }}>
              {item.metadata?.posterUrl ? (
                <img 
                  src={getPosterSrc(item.metadata.posterUrl)} 
                  alt="Cover" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ fontSize: '1.2rem' }}>🎵</span>
              )}
            </div>
            <div className="music-details">
              <div className="music-title" title={item.filename} style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {item.metadata?.artist && item.metadata.artist !== 'Unbekannter Künstler' && (
                  <span style={{ color: 'var(--accent-cyan)', marginRight: '0.35rem', fontWeight: 'bold' }}>{item.metadata.artist} -</span>
                )}
                {item.metadata?.title || item.filename}
              </div>
              <div className="music-meta" style={{ fontSize: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', color: 'var(--text-secondary)' }}>
                {item.metadata?.album && item.metadata.album !== 'Unbekanntes Album' && (
                  <>
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{item.metadata.album}</span>
                    <span>•</span>
                  </>
                )}
                {item.metadata?.year && (
                  <>
                    <span>{item.metadata.year}</span>
                    <span>•</span>
                  </>
                )}
                {item.metadata?.genre && item.metadata.genre !== 'Musik' && (
                  <>
                    <span style={{ color: 'var(--accent-blue)', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.7rem' }}>{item.metadata.genre}</span>
                    <span>•</span>
                  </>
                )}
                <span className="music-size">{formatBytes(item.sizeBytes)}</span>
                <span>•</span>
                <span>{new Date(item.mtime).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="music-actions">
            <button
              className="btn btn-secondary btn-icon-only btn-favorite"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item);
              }}
              style={{
                color: item.favorite ? 'var(--accent-red)' : 'rgba(255,255,255,0.7)',
                borderColor: item.favorite ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255,255,255,0.1)',
                background: 'rgba(255, 255, 255, 0.03)'
              }}
              title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <HeartIcon filled={item.favorite} />
            </button>
            {!item.isXtream && (
              <button 
                className="btn btn-danger btn-icon-only" 
                title="Datei von Festplatte löschen"
                onClick={() => handleDeleteMediaFile(item.filename)}
              >
                <TrashIcon />
              </button>
            )}
            <button 
              className="btn btn-primary btn-icon-only" 
              style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
              title="Lokal abspielen"
              onClick={() => playLocalLibrary(item.filename, item)}
            >
              <PlayIcon />
            </button>
            <button 
              className="btn btn-secondary btn-icon-only" 
              style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
              title="Auf TV streamen (Cast)"
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
  };

  const renderMediaCard = (item, idx) => {
    if (item.isGroup) {
      const title = item.title;
      const posterUrl = item.posterUrl;
      const year = item.year;
      const cast = item.cast;
      const imdbLink = item.imdbId ? `https://www.imdb.com/title/${item.imdbId}` : null;
      const fileCount = item.files ? item.files.length : 0;
      
      return (
        <div 
          key={idx} 
          className="media-card series-group-card" 
          onClick={() => setActiveSeriesId(item.imdbId || item.title || (item.isXtream && item.xtreamSeriesId))}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <div className="media-poster-container" style={{ position: 'relative' }}>
             <img 
               src={getPosterSrc(posterUrl)} 
               alt={title} 
               className="media-poster" 
               loading="lazy" 
               style={{ display: posterUrl ? 'block' : 'none' }}
               onError={(e) => {
                 e.target.style.display = 'none';
                 const fallback = e.target.parentElement.querySelector('.media-poster-fallback');
                 if (fallback) fallback.style.display = 'flex';
               }}
             />
             <div className="media-poster-fallback" style={{ display: posterUrl ? 'none' : 'flex' }}>
               <span className="media-poster-fallback-icon">📺</span>
               <span className="media-poster-fallback-title">{title}</span>
             </div>
            
            {year && <span className="media-badge-year">{year}</span>}
            <span className="media-badge-type">Serie</span>
            <span className="media-badge-episode">{fileCount} {fileCount === 1 ? 'Datei' : 'Dateien'}</span>

            {/* Favorite button overlay */}
            <button
              className="btn-favorite"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 10,
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: item.favorite ? 'var(--accent-red)' : 'rgba(255,255,255,0.7)',
                transition: 'transform 0.2s, background 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
              }}
              title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <HeartIcon filled={item.favorite} />
            </button>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  📂 Anzeigen ({fileCount})
                </span>
                {imdbLink && (
                  <a 
                    href={imdbLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="media-imdb-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⭐ IMDb
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise normal card
    const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
    const isPending = !!pendingCasts[item.filename];
    
    const meta = item.metadata || {};
    const title = meta.title || item.filename;
    const posterUrl = meta.posterUrl;
    const year = meta.year || null;
    const cast = meta.cast || null;
    const rawCategory = meta.category || 'Videos';
    const category = rawCategory === 'Sonstige' ? 'Videos' : rawCategory;
    const originalCategory = meta.originalCategory || category;
    
    const imdbLink = meta.imdbId ? `https://www.imdb.com/title/${meta.imdbId}` : null;
    
    let fallbackIcon = '📹';
    if (category === 'Filme' || originalCategory === 'Filme') fallbackIcon = '🎬';
    else if (category === 'Serien' || originalCategory === 'Serien') fallbackIcon = '📺';
    else if (category === 'Live TV' || originalCategory === 'Live TV') fallbackIcon = '📡';
    else if (category === 'Musik' || originalCategory === 'Musik') fallbackIcon = '🎵';
    
    return (
      <div key={idx} className="media-card" style={{ position: 'relative' }}>
        <div className="media-poster-container" style={{ position: 'relative' }}>
          <img 
            src={getPosterSrc(posterUrl)} 
            alt={title} 
            className="media-poster" 
            loading="lazy" 
            style={{ display: posterUrl ? 'block' : 'none' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.media-poster-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="media-poster-fallback" style={{ display: posterUrl ? 'none' : 'flex' }}>
            <span className="media-poster-fallback-icon">{fallbackIcon}</span>
            <span className="media-poster-fallback-title">{title}</span>
          </div>
          
          {/* Badges on Poster */}
          {year && <span className="media-badge-year">{year}</span>}
          <span className="media-badge-type">
            {category === 'Serien' || originalCategory === 'Serien' ? 'Serie' : category === 'Filme' || originalCategory === 'Filme' ? 'Film' : category === 'Live TV' ? 'Live TV' : category === 'Musik' || originalCategory === 'Musik' ? 'Musik' : category === 'Hörbücher' || originalCategory === 'Hörbücher' ? 'Hörbuch' : 'Video'}
          </span>
          {meta.seasonEpisode && <span className="media-badge-episode">{meta.seasonEpisode}</span>}

          {/* Favorite button overlay */}
          {(category === 'Filme' || originalCategory === 'Filme' || category === 'Serien' || originalCategory === 'Serien' || category === 'Live TV' || category === 'Hörbücher' || originalCategory === 'Hörbücher') && (
            <button
              className="btn-favorite"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(item);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 10,
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: item.favorite ? 'var(--accent-red)' : 'rgba(255,255,255,0.7)',
                transition: 'transform 0.2s, background 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
              }}
              title={item.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <HeartIcon filled={item.favorite} />
            </button>
          )}
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
            {item.isLive && (
              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 153, 0, 0.2)' }}
                title="EPG / Programm anzeigen"
                onClick={() => handleShowEpg(item)}
              >
                📅
              </button>
            )}
            {item.isXtream && !item.isLive && (
              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 153, 0, 0.2)' }}
                title="Herunterladen"
                onClick={() => triggerXtreamDownload(item)}
              >
                <DownloadIcon />
              </button>
            )}
            {!item.isXtream && (
              <button 
                className="btn btn-danger btn-icon-only" 
                title="Datei löschen"
                onClick={() => handleDeleteMediaFile(item.filename)}
              >
                <TrashIcon />
              </button>
            )}
            <button 
              className="btn btn-primary btn-icon-only" 
              style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
              title="Abspielen"
              onClick={() => playLocalLibrary(item.filename, item)}
            >
              <PlayIcon />
            </button>
            <button 
              className="btn btn-secondary btn-icon-only" 
              style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
              title="Auf TV streamen (Cast)"
              disabled={isPending}
              onClick={() => {
                setCastingItem(item);
                fetchDevices();
              }}
            >
              {isPending ? <span className="spinner">⏳</span> : <CastIcon />}
            </button>
          </div>

          {/* Active cast status */}
          {activeCastForFile && (
            <div style={{
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              marginTop: '0.5rem',
              color: 'var(--text-primary)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  📺 Streamt auf {activeCastForFile.device}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  {activeCastForFile.playerState || 'Verbinden'}
                </span>
              </div>

              {activeCastForFile.duration > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>{formatDuration(Math.round(activeCastForFile.currentTime || 0))}</span>
                    <span>{formatDuration(Math.round(activeCastForFile.duration))}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                {activeCastForFile.playerState === 'PAUSED' ? (
                  <button 
                    className="btn btn-secondary btn-icon-only" 
                    style={{ padding: '0.2rem', height: 'auto', minWidth: '26px' }}
                    onClick={() => handleCastControl(activeCastForFile.device, 'resume')}
                    title="Wiedergabe fortsetzen"
                  >
                    <PlayIcon />
                  </button>
                ) : (
                  <button 
                    className="btn btn-secondary btn-icon-only" 
                    style={{ padding: '0.2rem', height: 'auto', minWidth: '26px' }}
                    onClick={() => handleCastControl(activeCastForFile.device, 'pause')}
                    title="Wiedergabe pausieren"
                  >
                    <PauseIcon />
                  </button>
                )}
                
                <button 
                  className="btn btn-danger" 
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', marginLeft: 'auto' }}
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
              padding: '0.4rem 0.6rem',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-secondary)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <span><span className="spinner">⏳</span> Verbindung wird aufgebaut...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFavoritesOverview = () => {
    const watchingSeries = mediaLibrary.filter(item => 
      item.isGroup && item.files && item.files.some(ep => ep.progress)
    );
    
    watchingSeries.sort((a, b) => {
      const getLatestProgressTime = (group) => {
        let maxTime = 0;
        if (group.files) {
          group.files.forEach(ep => {
            const prog = ep.progress;
            if (prog && prog.updatedAt > maxTime) {
              maxTime = prog.updatedAt;
            }
          });
        }
        return maxTime;
      };
      return getLatestProgressTime(b) - getLatestProgressTime(a);
    });

    const favMovies = mediaLibrary.filter(item => 
      !item.isGroup && 
      (item.metadata?.category === 'Filme' || item.category === 'Filme' || item.metadata?.originalCategory === 'Filme') && 
      item.favorite
    );

    const favSeries = mediaLibrary.filter(item => 
      item.isGroup && 
      item.favorite && 
      !watchingSeries.some(ws => (ws.imdbId === item.imdbId && ws.title === item.title) || (ws.isXtream && ws.xtreamSeriesId === item.xtreamSeriesId))
    );

    const favMusic = mediaLibrary.filter(item => 
      !item.isGroup && 
      (item.metadata?.category === 'Musik' || item.category === 'Musik' || item.metadata?.originalCategory === 'Musik') && 
      item.favorite
    );

    const favAudiobooks = mediaLibrary.filter(item => 
      !item.isGroup && 
      (item.metadata?.category === 'Hörbücher' || item.category === 'Hörbücher' || item.metadata?.originalCategory === 'Hörbücher') && 
      item.favorite
    );

    const hasAnyFilteredItems = (() => {
      if (favoritesFilter === 'all') {
        return watchingSeries.length > 0 || favMovies.length > 0 || favSeries.length > 0 || favMusic.length > 0 || favAudiobooks.length > 0;
      } else if (favoritesFilter === 'Filme') {
        return favMovies.length > 0;
      } else if (favoritesFilter === 'Serien') {
        return watchingSeries.length > 0 || favSeries.length > 0;
      } else if (favoritesFilter === 'Musik') {
        return favMusic.length > 0;
      } else if (favoritesFilter === 'Hörbuch') {
        return favAudiobooks.length > 0;
      }
      return false;
    })();

    return (
      <div className="favorites-overview" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Favorites filter tabs */}
        <div className="favorites-filter-container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem', scrollbarWidth: 'thin' }}>
          <button
            onClick={() => setFavoritesFilter('all')}
            className={`subcategory-tag-btn ${favoritesFilter === 'all' ? 'active' : ''}`}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: favoritesFilter === 'all' ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
              color: favoritesFilter === 'all' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            ❤️ Alle ({watchingSeries.length + favMovies.length + favSeries.length + favMusic.length + favAudiobooks.length})
          </button>
          <button
            onClick={() => setFavoritesFilter('Filme')}
            className={`subcategory-tag-btn ${favoritesFilter === 'Filme' ? 'active' : ''}`}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: favoritesFilter === 'Filme' ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
              color: favoritesFilter === 'Filme' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            🎬 Filme ({favMovies.length})
          </button>
          <button
            onClick={() => setFavoritesFilter('Serien')}
            className={`subcategory-tag-btn ${favoritesFilter === 'Serien' ? 'active' : ''}`}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: favoritesFilter === 'Serien' ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
              color: favoritesFilter === 'Serien' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            📺 Serien ({watchingSeries.length + favSeries.length})
          </button>
          <button
            onClick={() => setFavoritesFilter('Musik')}
            className={`subcategory-tag-btn ${favoritesFilter === 'Musik' ? 'active' : ''}`}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: favoritesFilter === 'Musik' ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
              color: favoritesFilter === 'Musik' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            🎵 Musik ({favMusic.length})
          </button>
          <button
            onClick={() => setFavoritesFilter('Hörbuch')}
            className={`subcategory-tag-btn ${favoritesFilter === 'Hörbuch' ? 'active' : ''}`}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: favoritesFilter === 'Hörbuch' ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
              color: favoritesFilter === 'Hörbuch' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            🎧 Hörbücher ({favAudiobooks.length})
          </button>
        </div>

        {!hasAnyFilteredItems ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <span className="empty-state-icon" style={{ color: 'var(--accent-red)' }}>❤️</span>
            <h3 style={{ color: 'var(--text-primary)' }}>Hier ist noch nichts zu sehen</h3>
            <p style={{ maxWidth: '400px', margin: '0.5rem auto', color: 'var(--text-secondary)' }}>
              Markiere deine Lieblingsinhalte mit dem Herz-Symbol, um sie in dieser Kategorie anzuzeigen.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Watching Series */}
            {(favoritesFilter === 'all' || favoritesFilter === 'Serien') && watchingSeries.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📺 Gerade geschaut (Serien)
                </h3>
                <div className="media-grid">
                  {watchingSeries.map((item, idx) => renderMediaCard(item, idx))}
                </div>
              </div>
            )}

            {/* Favorite Movies */}
            {(favoritesFilter === 'all' || favoritesFilter === 'Filme') && favMovies.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎬 Lieblings-Filme
                </h3>
                <div className="media-grid">
                  {favMovies.map((item, idx) => renderMediaCard(item, idx))}
                </div>
              </div>
            )}

            {/* Favorite Series */}
            {(favoritesFilter === 'all' || favoritesFilter === 'Serien') && favSeries.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📺 Lieblings-Serien
                </h3>
                <div className="media-grid">
                  {favSeries.map((item, idx) => renderMediaCard(item, idx))}
                </div>
              </div>
            )}

            {/* Favorite Music */}
            {(favoritesFilter === 'all' || favoritesFilter === 'Musik') && favMusic.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎵 Lieblings-Musik
                </h3>
                <div className="music-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {favMusic.map((item, idx) => renderMusicItem(item, idx))}
                </div>
              </div>
            )}

            {/* Favorite Audiobooks */}
            {(favoritesFilter === 'all' || favoritesFilter === 'Hörbuch') && favAudiobooks.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎧 Lieblings-Hörbücher
                </h3>
                <div className="media-grid">
                  {favAudiobooks.map((item, idx) => renderMediaCard(item, idx))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const playAudiobook = (item) => {
    setActiveAudiobook(item);
    setAudiobookDuration(item.metadata?.duration || 0);
    setAudiobookChapters(item.metadata?.chapters || []);
    setShowAudiobookPlayer(true);
  };

  const playLocalLibrary = (filename, item = null) => {
    const isM4b = filename.toLowerCase().endsWith('.m4b');
    if (isM4b) {
      playAudiobook(item || { filename });
      return;
    }
    window.open(`/api/media/${encodeURIComponent(filename)}`, '_blank');
  };

  const saveAudiobookProgress = (filename, position) => {
    fetch('/api/media/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, position })
    })
    .then(res => res.json())
    .then(data => {
      setMediaLibrary(prev => prev.map(item => {
        if (item.filename === filename) {
          return { ...item, progress: { position, updatedAt: Date.now() } };
        }
        return item;
      }));
    })
    .catch(err => console.error('Failed to save play progress:', err));
  };

  const toggleAudiobookPlay = () => {
    if (audiobookRef.current) {
      if (audiobookPlaying) {
        audiobookRef.current.pause();
        setAudiobookPlaying(false);
        saveAudiobookProgress(activeAudiobook.filename, audiobookRef.current.currentTime);
      } else {
        audiobookRef.current.play().then(() => {
          setAudiobookPlaying(true);
        }).catch(err => console.error(err));
      }
    }
  };

  const seekAudiobook = (position) => {
    if (audiobookRef.current) {
      audiobookRef.current.currentTime = position;
      setAudiobookPosition(position);
    }
  };

  const skipAudiobook = (seconds) => {
    if (audiobookRef.current) {
      const newPos = Math.max(0, Math.min(audiobookDuration, audiobookRef.current.currentTime + seconds));
      audiobookRef.current.currentTime = newPos;
      setAudiobookPosition(newPos);
    }
  };

  const closeAudiobookPlayer = () => {
    if (audiobookRef.current) {
      audiobookRef.current.pause();
      saveAudiobookProgress(activeAudiobook.filename, audiobookRef.current.currentTime);
    }
    setAudiobookPlaying(false);
    setShowAudiobookPlayer(false);
    setActiveAudiobook(null);
    setSleepTimerActive(false);
    setSleepTimerTime(0);
  };

  const handleAudioTimeUpdate = () => {
    if (audiobookRef.current) {
      setAudiobookPosition(audiobookRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audiobookRef.current) {
      setAudiobookDuration(audiobookRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setAudiobookPlaying(false);
    if (activeAudiobook) {
      saveAudiobookProgress(activeAudiobook.filename, 0);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const pad = (num) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
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
        keepDays: parseInt(tempKeepDays, 10) || 0,
        checkIntervalHours: parseInt(tempCheckIntervalHours, 10) || 3,
        xtreamHost: tempXtreamHost,
        xtreamUsername: tempXtreamUsername,
        xtreamPassword: tempXtreamPassword,
        xtreamEnabled: tempXtreamEnabled,
        xtreamSyncIntervalHours: parseInt(tempXtreamSyncIntervalHours, 10) || 1,
        xxxHideEnabled: tempXxxHideEnabled,
        pin: verifyPin || currentPinInput,
        newPin: newPinInput,
        tailscaleBypassIrc: tempTailscaleBypassIrc,
        tailscaleLocalAddress: tempTailscaleLocalAddress,
        ircSearchTimeout: parseInt(tempIrcSearchTimeout, 10) || 24,
        allowTailscaleIp: tempAllowTailscaleIp,
        customLocalIp: tempCustomLocalIp
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Einstellungen konnten nicht gespeichert werden');
        }
        return res.json();
      })
      .then(data => {
        setSettings(data);
        setShowSettings(false);
        setVerifyPin('');
        setCurrentPinInput('');
        setNewPinInput('');
        fetchMediaLibrary();
      })
      .catch(err => {
        alert(err.message);
      });
  };

  const fetchExplorerFiles = (subpath = '') => {
    setExplorerLoading(true);
    setExplorerError('');
    fetch(`/api/settings/files?path=${encodeURIComponent(subpath)}`)
      .then(res => {
        if (!res.ok) throw new Error('Fehler beim Laden der Dateien');
        return res.json();
      })
      .then(data => {
        setExplorerPath(data.currentPath);
        setExplorerFiles(data.files || []);
        setExplorerLoading(false);
      })
      .catch(err => {
        setExplorerError(err.message);
        setExplorerLoading(false);
      });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    fetch('/api/settings/files/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: explorerPath, name: newFolderName.trim() })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Fehler beim Erstellen des Ordners'); });
        return res.json();
      })
      .then(() => {
        setShowNewFolderModal(false);
        setNewFolderName('');
        fetchExplorerFiles(explorerPath);
      })
      .catch(err => {
        alert(err.message);
      });
  };

  const handleDeleteExplorerItem = (item) => {
    const isDir = item.isDirectory;
    const confirmMsg = isDir 
      ? `Möchten Sie den Ordner "${item.name}" und alle darin enthaltenen Dateien wirklich unwiderruflich löschen?`
      : `Möchten Sie die Datei "${item.name}" wirklich unwiderruflich löschen?`;
    
    if (!window.confirm(confirmMsg)) return;

    fetch('/api/settings/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: explorerPath, name: item.name })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Fehler beim Löschen'); });
        return res.json();
      })
      .then(() => {
        fetchExplorerFiles(explorerPath);
      })
      .catch(err => {
        alert(err.message);
      });
  };

  const handleMoveExplorerItem = () => {
    if (!movingItem || !moveDestination.trim()) return;
    fetch('/api/settings/files/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        path: explorerPath, 
        name: movingItem.name, 
        destination: moveDestination.trim() 
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Fehler beim Verschieben/Umbenennen'); });
        return res.json();
      })
      .then(() => {
        setShowMoveModal(false);
        setMovingItem(null);
        setMoveDestination('');
        fetchExplorerFiles(explorerPath);
      })
      .catch(err => {
        alert(err.message);
      });
  };

  const fetchLogs = () => {
    setLoadingLogs(true);
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        setLogsContent(data.logs || 'Keine System-Logs vorhanden.');
        setLoadingLogs(false);
      })
      .catch(err => {
        console.error('Error fetching logs:', err);
        setLogsContent(`Fehler beim Laden der Logs: ${err.message}`);
        setLoadingLogs(false);
      });
  };

  // Logs polling when shown
  useEffect(() => {
    if (!showLogs) return;

    // Reset scroll active status on open
    setAutoScrollActive(true);
    fetchLogs();

    const interval = setInterval(() => {
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
          setLogsContent(data.logs || 'Keine System-Logs vorhanden.');
        })
        .catch(err => {
          console.error('Error polling logs:', err);
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [showLogs]);

  // Autoscroll logs to bottom when content updates
  useEffect(() => {
    if (showLogs && autoScrollActive && logsPreRef.current) {
      const pre = logsPreRef.current;
      pre.scrollTop = pre.scrollHeight;
    }
  }, [logsContent, autoScrollActive, showLogs]);

  const handleLogsScroll = () => {
    if (!logsPreRef.current) return;
    const pre = logsPreRef.current;
    // Calculate how close the scroll is to the bottom
    const isAtBottom = pre.scrollHeight - pre.scrollTop - pre.clientHeight < 15;
    
    if (isAtBottom) {
      setAutoScrollActive(true);
    } else {
      setAutoScrollActive(false);
    }
  };

  const handleCheckNow = (imdbId) => {
    setCheckingShowId(imdbId);
    fetch('/api/auto-download/check-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imdbId })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Suche konnte nicht gestartet werden');
        }
        return res.json();
      })
      .then(() => {
        setTimeout(() => {
          setCheckingShowId(null);
        }, 1500);
      })
      .catch(err => {
        console.error('Error triggering manual check:', err);
        alert('Fehler beim Starten der Suche: ' + err.message);
        setCheckingShowId(null);
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

  const renderDownloadItem = (item) => {
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
        {item.isHttp ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Typ: <strong style={{ color: 'var(--text-primary)' }}>Xtream Codes</strong></span>
            <span>•</span>
            <span>Quelle: <strong style={{ color: 'var(--text-primary)' }}>{item.server}</strong></span>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Server: <strong style={{ color: 'var(--text-primary)' }}>{item.server}</strong></span>
            <span>•</span>
            <span>Bot: <strong style={{ color: 'var(--text-primary)' }}>{item.botName}</strong></span>
            <span>•</span>
            <span>Pack: <strong style={{ color: 'var(--text-primary)' }}>#{item.packNumber}</strong></span>
          </div>
        )}

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
            <SpeedChart itemId={item.id} history={item.speedHistory} />
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
            <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
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
                title="Auf TV streamen (Cast)"
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
  };

  const renderFullExplorer = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
        
        {/* Explorer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📂 Dateiexplorer (Mediathek)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Verwalte Dateien und Ordner direkt in deinem Mediathek-Verzeichnis.
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => setShowNewFolderModal(true)}
          >
            ➕ Neuer Ordner
          </button>
        </div>

        {/* Path breadcrumb bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0.6rem 0.85rem', 
          borderRadius: '10px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid var(--border-color)',
          marginBottom: '0.5rem',
          fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>Ordner:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>/ {explorerPath || ''}</strong>
          </div>
          {explorerPath && (
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', minHeight: 'auto', borderRadius: '6px' }}
              onClick={() => {
                const parts = explorerPath.split('/');
                parts.pop();
                fetchExplorerFiles(parts.join('/'));
              }}
            >
              Parent-Ordner ⬆️
            </button>
          )}
        </div>

        {/* Main List Area */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.5rem',
          maxHeight: '650px',
          overflowY: 'auto',
          flexGrow: 1
        }}>
          {explorerLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
              <p>Lade Dateien...</p>
            </div>
          ) : explorerError ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent-red)' }}>
              <p>⚠️ {explorerError}</p>
              <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => fetchExplorerFiles(explorerPath)}>
                Erneut versuchen 🔄
              </button>
            </div>
          ) : explorerFiles.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📁</span>
              <p>Dieser Ordner ist leer.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ margin: 0, border: 'none', background: 'transparent' }}>
              <table className="results-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', width: '120px' }}>Größe</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', width: '180px' }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {explorerFiles.map((file, idx) => {
                    const isDir = file.isDirectory;
                    const ext = file.name.split('.').pop().toLowerCase();
                    const isAudio = ['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext);
                    const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'ts'].includes(ext);
                    
                    let icon = '📄';
                    if (isDir) icon = '📁';
                    else if (isAudio) icon = '🎵';
                    else if (isVideo) icon = '🎬';

                    return (
                      <tr 
                        key={idx}
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          background: isDir ? 'rgba(0, 242, 254, 0.01)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.6rem', 
                              cursor: isDir ? 'pointer' : 'default' 
                            }}
                            onClick={() => {
                              if (isDir) {
                                fetchExplorerFiles(explorerPath ? `${explorerPath}/${file.name}` : file.name);
                              }
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                            <span style={{ 
                              color: isDir ? 'var(--accent-cyan)' : 'var(--text-primary)',
                              fontWeight: isDir ? '600' : 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '550px'
                            }}>
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle' }}>
                          {!isDir && (
                            <span className="size-badge" style={{ fontFamily: 'var(--font-mono)' }}>
                              {formatBytes(file.size)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button 
                              type="button"
                              className="btn btn-secondary btn-icon-only"
                              style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                              title="Verschieben / Umbenennen"
                              onClick={() => {
                                setMovingItem(file);
                                setMoveDestination(file.name);
                                setShowMoveModal(true);
                              }}
                            >
                              ✏️
                            </button>
                            <button 
                              type="button"
                              className="btn btn-danger btn-icon-only"
                              title="Löschen"
                              onClick={() => handleDeleteExplorerItem(file)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Neuer Ordner */}
        {showNewFolderModal && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <span className="modal-title">Neuen Ordner erstellen</span>
                <button type="button" className="modal-close" onClick={() => setShowNewFolderModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-body" style={{ padding: '1rem 0' }}>
                <div className="form-group">
                  <label>Ordnername</label>
                  <input 
                    type="text" 
                    className="input-text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="z.B. Dokumentationen"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                    }}
                  />
                </div>
              </div>
              <div className="settings-footer" style={{ border: 'none', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewFolderModal(false)}>Abbrechen</button>
                <button type="button" className="btn btn-primary" onClick={handleCreateFolder}>Erstellen</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Verschieben / Umbenennen */}
        {showMoveModal && movingItem && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <span className="modal-title">Verschieben / Umbenennen</span>
                <button type="button" className="modal-close" onClick={() => setShowMoveModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-body" style={{ padding: '1rem 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Aktueller Name: <strong style={{ color: 'var(--text-primary)' }}>{movingItem.name}</strong>
                </p>
                <div className="form-group">
                  <label>Zielpfad oder neuer Name</label>
                  <input 
                    type="text" 
                    className="input-text"
                    value={moveDestination}
                    onChange={(e) => setMoveDestination(e.target.value)}
                    placeholder="z.B. neuer_name.mp4 oder /Serien/neuer_name.mp4"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleMoveExplorerItem();
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    - Wenn der Pfad mit einem <strong>/</strong> beginnt, ist er relativ zum Hauptverzeichnis der Mediathek.<br />
                    - Andernfalls ist er relativ zum aktuellen Unterordner.
                  </span>
                </div>
              </div>
              <div className="settings-footer" style={{ border: 'none', padding: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMoveModal(false)}>Abbrechen</button>
                <button type="button" className="btn btn-primary" onClick={handleMoveExplorerItem}>Bestätigen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAudiobookPlayer = () => {
    if (!showAudiobookPlayer || !activeAudiobook) return null;

    const metadata = activeAudiobook.metadata || {};
    const title = metadata.title || (activeAudiobook.filename ? activeAudiobook.filename.split('/').pop() : 'Unbekannt');
    const artist = metadata.artist || 'Unbekannter Autor';
    const album = metadata.album || 'Unbekanntes Hörbuch';
    const posterUrl = metadata.posterUrl;

    // Determine current chapter if any
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
            <button className="modal-close" onClick={closeAudiobookPlayer}>&times;</button>
          </div>
          
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 0' }}>
            
            {/* Audio Element */}
            <audio 
              ref={audiobookRef}
              onTimeUpdate={handleAudioTimeUpdate}
              onLoadedMetadata={handleAudioLoadedMetadata}
              onEnded={handleAudioEnded}
            />

            {/* Info and Cover Row */}
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

            {/* Seek Bar / Custom Progress bar */}
            <div>
              <input 
                type="range" 
                min={0} 
                max={audiobookDuration || 100} 
                value={audiobookPosition} 
                onChange={(e) => seekAudiobook(parseFloat(e.target.value))}
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

            {/* Playback controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                onClick={() => skipAudiobook(-30)}
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
                onClick={toggleAudiobookPlay}
                title={audiobookPlaying ? "Pausieren" : "Abspielen"}
              >
                {audiobookPlaying ? '⏸️' : '▶️'}
              </button>

              <button 
                className="btn btn-secondary btn-icon-only" 
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                onClick={() => skipAudiobook(30)}
                title="30s vorspringen"
              >
                30s ⏩
              </button>
            </div>

            {/* Downloader & Sleep Timer Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Sleep Timer Card */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>⏱️ Schlaf-Timer</strong>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {[5, 15, 30, 60].map(mins => (
                    <button 
                      key={mins}
                      className="btn btn-secondary"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSleepTimerTime(mins * 60);
                        setSleepTimerActive(true);
                      }}
                    >
                      {mins} Min
                    </button>
                  ))}
                  <button 
                    className="btn btn-danger"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setSleepTimerActive(false);
                      setSleepTimerTime(0);
                    }}
                  >
                    Aus
                  </button>
                </div>
                
                {/* Custom sleep timer input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input 
                    type="number" 
                    placeholder="Minuten" 
                    style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.8rem' }}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) {
                        setSleepTimerTime(v * 60);
                        setSleepTimerActive(true);
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

              {/* Chapters List */}
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
                        seekAudiobook(audiobookChapters[idx].startTime);
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

            {/* Direct download button */}
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
  };

  return (
    <div className="app-layout">
      <div className="app-container">
        
        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <PulseCastLogo />
            <div>
              <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                PulseCast
                <span className="version-info-badge" style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>v{settings.version || '1.0.0'}</span>
                  {settings.startTime && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span>Gestartet: {new Date(settings.startTime).toLocaleString('de-DE')}</span>
                    </>
                  )}
                </span>
              </h1>
              <span>Local Search & Transfer</span>
            </div>
          </div>
          <div className="header-nav">
            <button 
              className={`nav-btn ${currentView === 'downloads' ? 'active' : ''}`}
              onClick={() => setCurrentView('downloads')}
            >
              <DownloadIcon />
              Downloads
            </button>
            <button 
              className={`nav-btn ${currentView === 'library' ? 'active' : ''}`}
              onClick={() => {
                const isAtTopLevel = selectedCategory === 'all' &&
                                     selectedSubcategory === 'all' &&
                                     librarySearchQuery === '' &&
                                     currentPage === 1;
                
                setCurrentView('library');
                setActiveSeriesId(null);
                setSelectedCategory('all');
                setSelectedSubcategory('all');
                setLibrarySearchQuery('');
                setCurrentPage(1);
                
                if (isAtTopLevel) {
                  fetchMediaLibrary();
                }
              }}
            >
              <MediaIcon />
              Mediathek
            </button>
            <button 
              className={`nav-btn ${currentView === 'explorer' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('explorer');
                fetchExplorerFiles('');
              }}
            >
              <FolderIcon />
              Dateiexplorer
            </button>
          </div>
          <div className="header-actions">
            <div className="btn btn-secondary" style={{ cursor: 'default', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <FolderIcon />
              <span style={{ fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {settings.downloadDir || 'Lädt Ordner...'}
              </span>
            </div>
            {settings.xtreamEnabled && (
              <button className="btn btn-secondary" style={{ marginRight: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={() => {
                openVcrModalAndLoad();
              }}>
                📹 Videorekorder
              </button>
            )}
            <button className="btn btn-primary" onClick={() => {
              setTempDownloadDir(settings.downloadDir);
              setTempUseSSL(settings.useSSLByDefault);
              setTempKeepDays(settings.keepDays || 0);
              setTempCheckIntervalHours(settings.checkIntervalHours || 3);
              setTempXtreamHost(settings.xtreamHost || '');
              setTempXtreamUsername(settings.xtreamUsername || '');
              setTempXtreamPassword(settings.xtreamPassword || '');
              setTempXtreamEnabled(!!settings.xtreamEnabled);
              setTempXtreamSyncIntervalHours(settings.xtreamSyncIntervalHours || 1);
              setTempTailscaleBypassIrc(settings.tailscaleBypassIrc !== false);
              setTempTailscaleLocalAddress(settings.tailscaleLocalAddress || '');
              setTempIrcSearchTimeout(settings.ircSearchTimeout || 24);
              setTempAllowTailscaleIp(!!settings.allowTailscaleIp);
              setTempCustomLocalIp(settings.customLocalIp || '');
              setActiveSettingsTab('general');
              setShowSettings(true);
            }}>
              <SettingsIcon />
              Einstellungen
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className={currentView === 'downloads' ? "dashboard-grid" : "library-view-container"}>
          
          {/* Left Panel: Search */}
          {currentView === 'downloads' && (
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
          )}

          {/* Right Panel: Queue or Mediathek */}
          <div className="card" style={currentView !== 'downloads' ? { width: '100%' } : {}}>
            {currentView === 'downloads' ? (
              <>
                {/* 1. Vom User beauftragte Warteschlange */}
                <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📥 Warteschlange (Vom User beauftragt) ({downloads.filter(d => !d.isAuto).length})
                  </h3>
                </div>
                {downloads.filter(d => !d.isAuto).length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keine aktiven manuellen Downloads.</p>
                  </div>
                ) : (
                  <div className="downloads-list" style={{ marginBottom: '1.5rem' }}>
                    {downloads.filter(d => !d.isAuto).map((item) => renderDownloadItem(item))}
                  </div>
                )}

                {/* 2. Automatische Downloads (Auto-Loads) */}
                <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🤖 Automatische Downloads (Auto-Loads) ({downloads.filter(d => d.isAuto).length})
                  </h3>
                </div>
                {downloads.filter(d => d.isAuto).length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keine aktiven automatischen Downloads.</p>
                  </div>
                ) : (
                  <div className="downloads-list" style={{ marginBottom: '1.5rem' }}>
                    {downloads.filter(d => d.isAuto).map((item) => renderDownloadItem(item))}
                  </div>
                )}

                {/* 3. Serien-Autoloads (Abonnements) */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔄 Serien-Autoloads ({Object.values(autoDownloads).filter(sub => sub.enabled).length} aktiv)
                    </h3>
                  </div>
                  {Object.keys(autoDownloads).length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Keine Serien für den automatischen Download abonniert.
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Aktiviere "Lade weitere Folgen" in der Mediathek, um eine Serie hinzuzufügen.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {Object.values(autoDownloads).map((sub) => (
                        <div key={sub.imdbId} style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {sub.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', gap: '0.5rem' }}>
                              <span>IMDb: {sub.imdbId}</span>
                              {sub.failedEpisodes && Object.keys(sub.failedEpisodes).length > 0 && (
                                <span style={{ color: 'var(--accent-red)' }}>
                                  ⚠️ {Object.keys(sub.failedEpisodes).length} Fehlgeschlagen
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleCheckNow(sub.imdbId)}
                              disabled={checkingShowId === sub.imdbId}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              {checkingShowId === sub.imdbId ? '⏳' : '🔍 Suchen'}
                            </button>
                            
                            <label className="switch" style={{ transform: 'scale(0.85)' }}>
                              <input
                                type="checkbox"
                                checked={!!sub.enabled}
                                onChange={(e) => handleToggleAutoDownload(sub.imdbId, sub.title, e.target.checked)}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : currentView === 'library' ? (
            <>
              {/* Media Library List */}
              {loadingLibrary && mediaLibrary.length === 0 ? (
                <div className="empty-state">
                  <span className="spinner" style={{ fontSize: '2rem' }}>⏳</span>
                  <p>Mediathek wird gescannt...</p>
                </div>
              ) : (mediaLibrary.length === 0 && !librarySearchQuery && selectedCategory === 'all' && selectedSubcategory === 'all') ? (
                <div className="empty-state">
                  <span className="empty-state-icon">🎥</span>
                  <p>Keine Mediendateien im Download-Ordner gefunden.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Unterstützte Formate: MP4, MKV, AVI, MP3, WAV, M4A, MOV, FLAC
                  </p>
                  <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => fetchMediaLibrary(true)}>
                    Ordner erneut scannen 🔄
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeSeries ? (
                    <div className="series-detail-view" style={{ animation: 'fadeIn 0.3s ease', width: '100%' }}>
                      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setActiveSeriesId(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', borderRadius: '30px' }}
                        >
                          ◀ Zurück zur Mediathek
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
                          onClick={() => fetchMediaLibrary(true)} 
                          disabled={loadingLibrary}
                        >
                          {loadingLibrary ? '⏳ Scanne...' : 'Aktualisieren 🔄'}
                        </button>
                      </div>

                      <div className="series-detail-layout" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        {/* Left side: Info Card */}
                        <div className="series-info-card" style={{ flex: '1 1 250px', maxWidth: '300px' }}>
                          <div className="media-card" style={{ maxWidth: '100%' }}>
                            <div className="media-poster-container">
                                <img 
                                  src={getPosterSrc(activeSeries.posterUrl)} 
                                  alt={activeSeries.title} 
                                  className="media-poster" 
                                  style={{ display: activeSeries.posterUrl ? 'block' : 'none' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentElement.querySelector('.media-poster-fallback');
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div className="media-poster-fallback" style={{ display: activeSeries.posterUrl ? 'none' : 'flex' }}>
                                  <span className="media-poster-fallback-icon">📺</span>
                                  <span className="media-poster-fallback-title">{activeSeries.title}</span>
                                </div>
                              {activeSeries.year && <span className="media-badge-year">{activeSeries.year}</span>}
                              <span className="media-badge-type">Serie</span>
                            </div>
                            <div className="media-card-body" style={{ padding: '1rem' }}>
                              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                                {activeSeries.title}
                              </h3>
                              {activeSeries.cast && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                                  <strong>Besetzung:</strong>
                                  <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{activeSeries.cast}</div>
                                </div>
                              )}
                              {activeSeries.imdbId && (
                                <a 
                                  href={`https://www.imdb.com/title/${activeSeries.imdbId}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="media-imdb-link"
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  ⭐ Auf IMDb ansehen
                                </a>
                              )}

                              {activeSeries.imdbId && (
                                <div style={{ 
                                  marginTop: '1.25rem', 
                                  borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
                                  paddingTop: '1rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem'
                                }}>
                                  <label style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.6rem', 
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    color: 'var(--text-primary)'
                                  }}>
                                    <input 
                                      type="checkbox" 
                                      checked={!!autoDownloads[activeSeries.imdbId]?.enabled}
                                      onChange={(e) => handleToggleAutoDownload(activeSeries.imdbId, activeSeries.title, e.target.checked)}
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: 'var(--accent-pink)',
                                        cursor: 'pointer',
                                        borderRadius: '4px'
                                      }}
                                    />
                                    <span>Lade weitere Folgen</span>
                                  </label>
                                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                                    {autoDownloads[activeSeries.imdbId]?.enabled ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                          ● Aktiv (prüft alle {settings.checkIntervalHours || 3} Std.)
                                        </span>
                                        <button
                                          className="btn btn-secondary"
                                          onClick={() => handleCheckNow(activeSeries.imdbId)}
                                          disabled={checkingShowId === activeSeries.imdbId}
                                          style={{
                                            padding: '0.3rem 0.6rem',
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            width: 'fit-content',
                                            marginTop: '0.2rem'
                                          }}
                                        >
                                          {checkingShowId === activeSeries.imdbId ? '🔍 Suche läuft...' : '🔍 Jetzt suchen'}
                                        </button>
                                      </div>
                                    ) : (
                                      `Prüft alle ${settings.checkIntervalHours || 3} Std. auf neue Folgen desselben Formats und lädt diese automatisch herunter.`
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Episodes List */}
                        <div className="series-episodes-container" style={{ flex: '2 1 450px' }}>
                          {(() => {
                            const activeSeriesFiles = activeSeries.isXtream 
                              ? (xtreamEpisodes[activeSeries.xtreamSeriesId] || []) 
                              : activeSeries.files;
                            
                            return (
                              <>
                                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                  Dateien ({activeSeriesFiles.length})
                                </h3>

                                {loadingXtreamEpisodes ? (
                                  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
                                    <p>Lade Episoden vom Xtream Server...</p>
                                  </div>
                                ) : (
                                  <div className="episodes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '750px', overflowY: 'auto' }}>
                                    {activeSeriesFiles.map((item, idx) => {
                                      const activeCastForFile = activeCasts.find(c => c.filename === item.filename && c.downloadId === null);
                                      const isPending = !!pendingCasts[item.filename];
                                      
                                      return (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                          <div className="music-item" style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
                                            <div className="music-info">
                                              <div className="music-icon" style={{ background: 'rgba(255, 0, 127, 0.08)', color: 'var(--accent-pink)' }}>
                                                {item.metadata?.seasonEpisode ? '🎬' : '📹'}
                                              </div>
                                              <div className="music-details">
                                                <div className="music-title" title={item.filename} style={{ fontWeight: '500' }}>
                                                  {item.metadata?.seasonEpisode ? <strong style={{ color: 'var(--accent-pink)', marginRight: '0.4rem' }}>{item.metadata.seasonEpisode}</strong> : null}
                                                  {item.isXtream ? (item.metadata?.title || item.filename) : item.filename}
                                                </div>
                                                <div className="music-meta">
                                                  {item.sizeBytes > 0 && (
                                                    <>
                                                      <span className="music-size">{formatBytes(item.sizeBytes)}</span>
                                                      <span>•</span>
                                                    </>
                                                  )}
                                                  <span>{item.isXtream ? 'Xtream Codes Stream' : new Date(item.mtime).toLocaleDateString()}</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="music-actions">
                                              {item.isXtream && (
                                                <button 
                                                  className="btn btn-secondary btn-icon-only" 
                                                  style={{ color: 'var(--accent-orange)', borderColor: 'rgba(255, 153, 0, 0.2)' }}
                                                  title="Folge herunterladen"
                                                  onClick={() => triggerXtreamDownload(item, activeSeries)}
                                                >
                                                  <DownloadIcon />
                                                </button>
                                              )}
                                              {!item.isXtream && (
                                                <button 
                                                  className="btn btn-danger btn-icon-only" 
                                                  title="Datei von Festplatte löschen"
                                                  onClick={() => handleDeleteMediaFile(item.filename)}
                                                >
                                                  <TrashIcon />
                                                </button>
                                              )}
                                              <button 
                                                className="btn btn-primary btn-icon-only" 
                                                style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
                                                title="Lokal abspielen"
                                                onClick={() => playLocalLibrary(item.filename, item)}
                                              >
                                                <PlayIcon />
                                              </button>
                                              <button 
                                                className="btn btn-secondary btn-icon-only" 
                                                style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.2)' }}
                                                title="Auf TV streamen (Cast)"
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

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                                        {activeCastForFile.playerState === 'PAUSED' ? (
                                          <button 
                                            className="btn btn-secondary btn-icon-only" 
                                            style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                            onClick={() => handleCastControl(activeCastForFile.device, 'resume')}
                                          >
                                            <PlayIcon />
                                          </button>
                                        ) : (
                                          <button 
                                            className="btn btn-secondary btn-icon-only" 
                                            style={{ padding: '0.3rem', height: 'auto', minWidth: '30px' }}
                                            onClick={() => handleCastControl(activeCastForFile.device, 'pause')}
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
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Gefundene Mediendateien:</span>
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => fetchMediaLibrary(true)} disabled={loadingLibrary}>
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
                        placeholder="Mediathek nach Dateinamen, Titeln oder Schauspielern filtern..."
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Category Selection Tabs */}
                    <div className="category-tabs-container">
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('all')}
                      >
                        📁 Alle ({categoryCounts.all || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Favoriten' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Favoriten')}
                        style={{
                          border: selectedCategory === 'Favoriten' ? '1px solid var(--accent-red)' : '1px solid transparent',
                          boxShadow: selectedCategory === 'Favoriten' ? '0 0 8px rgba(255, 51, 102, 0.2)' : 'none'
                        }}
                      >
                        ❤️ Favoriten ({categoryCounts.Favoriten || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Neu' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Neu')}
                      >
                        🆕 Neu ({categoryCounts.Neu || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Lokal' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Lokal')}
                      >
                        💾 Lokal ({categoryCounts.Lokal || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Filme' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Filme')}
                      >
                        🎬 Filme ({categoryCounts.Filme || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Serien' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Serien')}
                      >
                        📺 Serien ({categoryCounts.Serien || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Videos' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Videos')}
                      >
                        📹 Videos ({categoryCounts.Videos || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Musik' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Musik')}
                      >
                        🎵 Musik ({categoryCounts.Musik || 0})
                      </button>
                      <button 
                        className={`category-tab-btn ${selectedCategory === 'Hörbücher' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('Hörbücher')}
                      >
                        🎧 Hörbücher ({categoryCounts.Hörbücher || 0})
                      </button>
                      {settings.xtreamEnabled && (
                        <button 
                          className={`category-tab-btn ${selectedCategory === 'Live TV' ? 'active' : ''}`}
                          onClick={() => handleSelectCategory('Live TV')}
                        >
                          📡 Live TV ({categoryCounts['Live TV'] || 0})
                        </button>
                      )}
                    </div>

                    {/* Subcategories tags container */}
                    {availableSubcategories.length > 1 && (
                      <div className="subcategory-tags-container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', margin: '0.2rem 0', scrollbarWidth: 'thin' }}>
                        {availableSubcategories.map(sub => (
                          <button
                            key={sub}
                            className={`subcategory-tag-btn ${selectedSubcategory === sub ? 'active' : ''}`}
                            onClick={() => handleSelectSubcategory(sub)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '20px',
                              border: '1px solid var(--border-color)',
                              background: selectedSubcategory === sub ? 'var(--grad-cyan-blue)' : 'rgba(255, 255, 255, 0.05)',
                              color: selectedSubcategory === sub ? '#fff' : 'var(--text-secondary)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s'
                            }}
                          >
                            {sub === 'all' ? 'Alle' : sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {filteredLibrary.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <span className="empty-state-icon">🔍</span>
                      {librarySearchQuery ? (
                        <p>Keine Übereinstimmung für „{librarySearchQuery}“ gefunden.</p>
                      ) : (
                        <p>Keine Mediendateien in dieser Kategorie gefunden.</p>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} 
                        onClick={() => {
                          setLibrarySearchQuery('');
                          setSelectedCategory('all');
                          setSelectedSubcategory('all');
                        }}
                      >
                        Filter zurücksetzen
                      </button>
                    </div>
                  ) : selectedCategory === 'Musik' ? (
                    /* Compact Music Track Item List */
                    <div className="music-list" style={{ maxHeight: '650px', overflowY: 'auto' }} onScroll={handleScroll}>
                      {filteredLibrary.map((item, idx) => renderMusicItem(item, idx))}
                      {loadingLibrary && currentPage > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem', color: 'var(--text-secondary)' }}>
                          <span className="spinner">⏳</span> Lade mehr...
                        </div>
                      )}
                    </div>
                  ) : selectedCategory === 'Favoriten' ? (
                    /* Favorites overview dashboard */
                    <div style={{ maxHeight: '750px', overflowY: 'auto' }} onScroll={handleScroll}>
                      {renderFavoritesOverview()}
                      {loadingLibrary && (
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem', color: 'var(--text-secondary)' }}>
                          <span className="spinner">⏳</span> Lade...
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Movies/Series Card Grid View with Endless Scroll */
                    <div className="media-grid" style={{ maxHeight: '750px', overflowY: 'auto' }} onScroll={handleScroll}>
                      {groupedLibrary.map((item, idx) => renderMediaCard(item, idx))}
                      {loadingLibrary && currentPage > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '1rem', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
                          <span className="spinner">⏳</span> Lade mehr...
                        </div>
                      )}
                    </div>
                  )}


                </>
              )}
            </div>
          )}
        </>
            ) : (
              renderFullExplorer()
            )}
          </div>

      </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay">
            <div className="modal settings-modal">
              <div className="modal-header">
                <span className="modal-title">Einstellungen</span>
                <button className="modal-close" onClick={() => setShowSettings(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div className="settings-container">
                {/* Sidebar */}
                <div className="settings-sidebar">
                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'general' ? 'active' : ''}`} 
                    onClick={() => setActiveSettingsTab('general')}
                  >
                    ⚙️ Allgemein
                  </button>
                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'network' ? 'active' : ''}`} 
                    onClick={() => setActiveSettingsTab('network')}
                  >
                    🌐 Netzwerk & Tailscale
                  </button>
                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'xtream' ? 'active' : ''}`} 
                    onClick={() => setActiveSettingsTab('xtream')}
                  >
                    📺 Xtream IPTV
                  </button>
                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'parental' ? 'active' : ''}`} 
                    onClick={() => setActiveSettingsTab('parental')}
                  >
                    🤫 Jugendschutz
                  </button>
                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'logs' ? 'active' : ''}`} 
                    onClick={() => setActiveSettingsTab('logs')}
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
                          onChange={(e) => setTempDownloadDir(e.target.value)}
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
                            onChange={(e) => setTempUseSSL(e.target.checked)}
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
                          onChange={(e) => setTempKeepDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
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
                          onChange={(e) => setTempCheckIntervalHours(Math.max(1, parseInt(e.target.value, 10) || 1))}
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
                            onChange={(e) => setTempAllowTailscaleIp(e.target.checked)}
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
                            onChange={(e) => setTempTailscaleBypassIrc(e.target.checked)}
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
                            onChange={(e) => setTempTailscaleLocalAddress(e.target.value)}
                            placeholder="z. B. 192.168.178.50 (leer lassen für Auto-Erkennung)"
                          />
                          {tempTailscaleLocalAddress && (
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              onClick={() => setTempTailscaleLocalAddress('')} 
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
                            onChange={(e) => setTempCustomLocalIp(e.target.value)}
                            placeholder="z. B. 192.168.178.100 (leer lassen für Auto-Erkennung)"
                          />
                          {tempCustomLocalIp && (
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              onClick={() => setTempCustomLocalIp('')} 
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
                          onChange={(e) => setTempIrcSearchTimeout(Math.max(5, parseInt(e.target.value, 10) || 5))}
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
                                      onClick={() => setTempTailscaleLocalAddress(ip.address)}
                                      title="Für IRC-Bindung übernehmen"
                                    >
                                      Bind IP
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-secondary btn-xs"
                                      onClick={() => setTempCustomLocalIp(ip.address)}
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
                          <span>Integiere IPTV/VOD-Streams in die Mediathek</span>
                        </div>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={tempXtreamEnabled}
                            onChange={(e) => setTempXtreamEnabled(e.target.checked)}
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
                              onChange={(e) => setTempXtreamHost(e.target.value)}
                              placeholder="http://iptv-server.com:8080"
                            />
                          </div>
                          <div className="form-group">
                            <label>Benutzername</label>
                            <input
                              type="text"
                              className="input-text"
                              value={tempXtreamUsername}
                              onChange={(e) => setTempXtreamUsername(e.target.value)}
                              placeholder="Benutzername"
                            />
                          </div>
                          <div className="form-group">
                            <label>Passwort</label>
                            <input
                              type="password"
                              className="input-text"
                              value={tempXtreamPassword}
                              onChange={(e) => setTempXtreamPassword(e.target.value)}
                              placeholder="Passwort"
                            />
                          </div>
                          <div className="form-group">
                            <label>Sync-Intervall (Stunden)</label>
                            <input
                              type="number"
                              className="input-text"
                              value={tempXtreamSyncIntervalHours}
                              onChange={(e) => setTempXtreamSyncIntervalHours(e.target.value)}
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
                            onChange={(e) => setTempXxxHideEnabled(e.target.checked)}
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
                            onChange={(e) => setVerifyPin(e.target.value)}
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
                              onChange={(e) => setCurrentPinInput(e.target.value)}
                              placeholder="Code"
                            />
                          </div>
                          <div className="form-group flex-1">
                            <label>Neuer Sperrcode</label>
                            <input
                              type="password"
                              className="input-text"
                              value={newPinInput}
                              onChange={(e) => setNewPinInput(e.target.value)}
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
                          fetchLogs();
                          setShowLogs(true);
                        }}
                      >
                        📋 System-Logs ansehen
                      </button>
                    </div>
                  )}
                </div>
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

        {/* VCR Modal */}
        {showVcrModal && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal" style={{ width: '850px', maxWidth: '95%' }}>
              <div className="modal-header">
                <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📹 Videorekorder & Aufnahmen
                </span>
                <button className="modal-close" onClick={() => setShowVcrModal(false)}>
                  <CloseIcon />
                </button>
              </div>

              {/* Tab navigation inside modal */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', paddingBottom: '0.5rem' }}>
                <button 
                  className={`category-tab-btn ${vcrActiveTab === 'list' ? 'active' : ''}`}
                  onClick={() => setVcrActiveTab('list')}
                  style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  📋 Aufnahmen ({recordings.length})
                </button>
                <button 
                  className={`category-tab-btn ${vcrActiveTab === 'new' ? 'active' : ''}`}
                  onClick={() => {
                    setVcrActiveTab('new');
                    setVcrError('');
                    if (vcrChannels.length > 0 && !vcrChannelId) {
                      setVcrChannelId(String(vcrChannels[0].xtreamStreamId));
                    }
                    const now = new Date();
                    const future = new Date(now.getTime() + 60 * 60 * 1000);
                    const formatLocal = (d) => {
                      const pad = (n) => String(n).padStart(2, '0');
                      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    };
                    if (!vcrStartTime) setVcrStartTime(formatLocal(now));
                    if (!vcrEndTime) setVcrEndTime(formatLocal(future));
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
                      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setVcrActiveTab('new')}>
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
                                onClick={() => handleStopRecording(rec.id)}
                              >
                                <StopIcon /> Aufnahme stoppen
                              </button>
                            )}
                            <button 
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => handleDeleteRecording(rec.id)}
                            >
                              <TrashIcon /> Löschen
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Manual recording form */
                <form onSubmit={handleAddRecording} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                      onChange={(e) => setVcrChannelId(e.target.value)}
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
                      onChange={(e) => setVcrTitle(e.target.value)}
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
                        onChange={(e) => setVcrStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                      <label>Endzeit</label>
                      <input
                        type="datetime-local"
                        className="input-text"
                        value={vcrEndTime}
                        onChange={(e) => setVcrEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setVcrActiveTab('list')}>
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
        )}

        {/* EPG Modal */}
        {showEpgModal && epgChannel && (
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
                <button className="modal-close" onClick={() => setShowEpgModal(false)}>
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
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleOpenManualFromEpg}>
                      Manuelle Aufnahme planen ✍️
                    </button>
                  </div>
                ) : epgListings.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Keine Programmdaten für diesen Sender verfügbar.</p>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleOpenManualFromEpg}>
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
                                onClick={() => handleScheduleEpgRecording(prog)}
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
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={handleOpenManualFromEpg}>
                  Manuelles Zeitfenster aufnehmen ✍️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Modal */}
        {showLogs && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal" style={{ width: '800px', maxWidth: '95%' }}>
              <div className="modal-header">
                <span className="modal-title">📋 System-Logs</span>
                <button className="modal-close" onClick={() => setShowLogs(false)}>
                  <CloseIcon />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Hier sind die letzten System-Logs der Anwendung. Du kannst sie ansehen und kopieren.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      color: autoScrollActive ? 'var(--accent-green)' : 'var(--text-muted)',
                      background: autoScrollActive ? 'rgba(0, 255, 135, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      border: autoScrollActive ? '1px solid rgba(0, 255, 135, 0.2)' : '1px solid var(--border-color)'
                    }}>
                      <span className={autoScrollActive ? "spinner" : ""} style={{ display: 'inline-block' }}>
                        {autoScrollActive ? "🟢" : "⏸️"}
                      </span>
                      <span>{autoScrollActive ? "Live-Stream" : "Pausiert"}</span>
                    </span>
                    {!autoScrollActive && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', height: 'auto' }}
                        onClick={() => {
                          setAutoScrollActive(true);
                          if (logsPreRef.current) {
                            const pre = logsPreRef.current;
                            pre.scrollTop = pre.scrollHeight;
                          }
                        }}
                      >
                        ⬇️ Scrollen
                      </button>
                    )}
                  </div>
                </div>

                {loadingLogs ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</span>
                    <p>Lade Logs...</p>
                  </div>
                ) : (
                  <div>
                    <pre 
                      ref={logsPreRef}
                      onScroll={handleLogsScroll}
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '1rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: '#a5b4fc',
                        margin: 0
                      }}
                    >
                      {logsContent}
                    </pre>
                  </div>
                )}
              </div>

              <div className="settings-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                >
                  🔄 Aktualisieren
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn btn-primary"
                    style={{ background: 'var(--grad-cyan-blue)', border: 'none' }}
                    disabled={!logsContent || loadingLogs}
                    onClick={() => {
                      navigator.clipboard.writeText(logsContent);
                      alert('Logs in die Zwischenablage kopiert!');
                    }}
                  >
                    📋 Kopieren
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowLogs(false)}>
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chromecast / Miracast Modal */}
        {castingItem && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Auf TV streamen (Cast)</span>
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
                                {device.type === 'dlna' ? '📶 ' : device.type === 'airplay' ? '🍏 ' : '📺 '}
                                {device.name}
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

        {renderAudiobookPlayer()}
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
