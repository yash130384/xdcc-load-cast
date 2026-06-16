import React, { useState, useEffect, useRef, useMemo } from 'react';
import AppHeader from './components/AppHeader';
import StatusBar from './components/StatusBar';
import SearchPanel from './components/SearchPanel';
import DownloadsQueue from './components/DownloadsQueue';
import MediaLibrary from './components/MediaLibrary';
import SettingsModal from './components/SettingsModal';
import VcrModal from './components/VcrModal';
import EpgModal from './components/EpgModal';
import LogsModal from './components/LogsModal';
import CastModal from './components/CastModal';
import ObsoleteFilesModal from './components/ObsoleteFilesModal';
import AudiobookPlayer from './components/AudiobookPlayer';
import FileExplorer from './components/FileExplorer';
import { formatBytes, formatDuration, highlightMatch, getPosterSrc, formatTime } from './components/utils';

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

function SpeedChart({ itemId, history }) {
  if (!history || history.length < 2) return null;

  const height = 45;
  const width = 300;
  
  const maxSpeed = Math.max(...history, 1024 * 1024);
  
  const points = history.map((speed, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = height - (speed / maxSpeed) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  
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
        
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        
        <path d={areaData} fill={`url(#${gradId})`} />
        
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

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSource, setSearchSource] = useState('xdcc');
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [favoritesFilter, setFavoritesFilter] = useState('all');
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({
    all: 0, Neu: 0, Lokal: 0, Filme: 0, Serien: 0, Videos: 0, Musik: 0, 'Live TV': 0, 'Hörbücher': 0, Favoriten: 0
  });
  const [serverSubcategories, setServerSubcategories] = useState(['all']);
  const [rightPanelTab, setRightPanelTab] = useState('queue');
  const [currentView, setCurrentView] = useState('downloads');
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

  const [recordings, setRecordings] = useState([]);
  const [vcrChannels, setVcrChannels] = useState([]);
  const [showVcrModal, setShowVcrModal] = useState(false);
  const [showEpgModal, setShowEpgModal] = useState(false);
  const [epgChannel, setEpgChannel] = useState(null);
  const [epgListings, setEpgListings] = useState([]);
  const [loadingEpg, setLoadingEpg] = useState(false);
  const [epgError, setEpgError] = useState('');
  const [vcrActiveTab, setVcrActiveTab] = useState('list');

  const [vcrChannelId, setVcrChannelId] = useState('');
  const [vcrTitle, setVcrTitle] = useState('');
  const [vcrStartTime, setVcrStartTime] = useState('');
  const [vcrEndTime, setVcrEndTime] = useState('');
  const [vcrError, setVcrError] = useState('');
  const [vcrSaving, setVcrSaving] = useState(false);

  const [tempXxxHideEnabled, setTempXxxHideEnabled] = useState(false);
  const [verifyPin, setVerifyPin] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  
  const [showObsoleteModal, setShowObsoleteModal] = useState(false);
  const [selectedObsoleteFiles, setSelectedObsoleteFiles] = useState([]);
  
  const [expandedLogs, setExpandedLogs] = useState({});
  const [downloadLogs, setDownloadLogs] = useState({});

  const [showLogs, setShowLogs] = useState(false);
  const [logsContent, setLogsContent] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoScrollActive, setAutoScrollActive] = useState(true);
  const logsPreRef = useRef(null);

  const [tempXtreamHost, setTempXtreamHost] = useState('');
  const [tempXtreamUsername, setTempXtreamUsername] = useState('');
  const [tempXtreamPassword, setTempXtreamPassword] = useState('');
  const [tempXtreamEnabled, setTempXtreamEnabled] = useState(false);
  const [tempXtreamSyncIntervalHours, setTempXtreamSyncIntervalHours] = useState(1);
  const [xtreamEpisodes, setXtreamEpisodes] = useState({});
  const [loadingXtreamEpisodes, setLoadingXtreamEpisodes] = useState(false);

  const [autoDownloads, setAutoDownloads] = useState({});
  const [tempCheckIntervalHours, setTempCheckIntervalHours] = useState(3);
  const [checkingShowId, setCheckingShowId] = useState(null);

  const [activeAudiobook, setActiveAudiobook] = useState(null);
  const [showAudiobookPlayer, setShowAudiobookPlayer] = useState(false);
  const [audiobookPlaying, setAudiobookPlaying] = useState(false);
  const [audiobookDuration, setAudiobookDuration] = useState(0);
  const [audiobookPosition, setAudiobookPosition] = useState(0);
  const [audiobookChapters, setAudiobookChapters] = useState([]);
  const audiobookRef = useRef(null);

  const [sleepTimerActive, setSleepTimerActive] = useState(false);
  const [sleepTimerTime, setSleepTimerTime] = useState(0);

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

  useEffect(() => {
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

    fetch('/api/downloads')
      .then(res => res.json())
      .then(data => {
        setDownloads(data);
      })
      .catch(err => console.error('Error fetching downloads:', err));

    fetchActiveCasts();

    fetch('/api/auto-download')
      .then(res => res.json())
      .then(data => setAutoDownloads(data))
      .catch(err => console.error('Error fetching auto downloads:', err));

    fetch('/api/recordings')
      .then(res => res.json())
      .then(data => setRecordings(data))
      .catch(err => console.error('Error fetching VCR recordings:', err));

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
          useSSL: settings.useSSLByDefault
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Download konnte nicht gestartet werden: ${errData.error}`);
      } else {
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

  const handleOpenSettings = () => {
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
          
          {year && <span className="media-badge-year">{year}</span>}
          <span className="media-badge-type">
            {category === 'Serien' || originalCategory === 'Serien' ? 'Serie' : category === 'Filme' || originalCategory === 'Filme' ? 'Film' : category === 'Live TV' ? 'Live TV' : category === 'Musik' || originalCategory === 'Musik' ? 'Musik' : category === 'Hörbücher' || originalCategory === 'Hörbücher' ? 'Hörbuch' : 'Video'}
          </span>
          {meta.seasonEpisode && <span className="media-badge-episode">{meta.seasonEpisode}</span>}

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

  useEffect(() => {
    if (!showLogs) return;

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

  useEffect(() => {
    if (showLogs && autoScrollActive && logsPreRef.current) {
      const pre = logsPreRef.current;
      pre.scrollTop = pre.scrollHeight;
    }
  }, [logsContent, autoScrollActive, showLogs]);

  const handleLogsScroll = () => {
    if (!logsPreRef.current) return;
    const pre = logsPreRef.current;
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

  const getDownloadState = (item) => {
    const id = `${item.server}_${item.channel}_${item.botName}_${item.packNumber}_${item.filename.replace(/\s+/g, '_')}`;
    const found = downloads.find(d => d.id === id);
    return found ? found.status : null;
  };

  const handleSettingsFieldChange = (field, value) => {
    switch (field) {
      case 'tempDownloadDir': setTempDownloadDir(value); break;
      case 'tempUseSSL': setTempUseSSL(value); break;
      case 'tempKeepDays': setTempKeepDays(value); break;
      case 'tempTailscaleBypassIrc': setTempTailscaleBypassIrc(value); break;
      case 'tempTailscaleLocalAddress': setTempTailscaleLocalAddress(value); break;
      case 'tempIrcSearchTimeout': setTempIrcSearchTimeout(value); break;
      case 'tempAllowTailscaleIp': setTempAllowTailscaleIp(value); break;
      case 'tempCustomLocalIp': setTempCustomLocalIp(value); break;
      case 'tempXxxHideEnabled': setTempXxxHideEnabled(value); break;
      case 'verifyPin': setVerifyPin(value); break;
      case 'currentPinInput': setCurrentPinInput(value); break;
      case 'newPinInput': setNewPinInput(value); break;
      case 'tempXtreamHost': setTempXtreamHost(value); break;
      case 'tempXtreamUsername': setTempXtreamUsername(value); break;
      case 'tempXtreamPassword': setTempXtreamPassword(value); break;
      case 'tempXtreamEnabled': setTempXtreamEnabled(value); break;
      case 'tempXtreamSyncIntervalHours': setTempXtreamSyncIntervalHours(value); break;
      case 'tempCheckIntervalHours': setTempCheckIntervalHours(value); break;
      default: break;
    }
  };

  const handleVcrFieldChange = (field, value) => {
    switch (field) {
      case 'vcrChannelId': setVcrChannelId(value); break;
      case 'vcrTitle': setVcrTitle(value); break;
      case 'vcrStartTime': setVcrStartTime(value); break;
      case 'vcrEndTime': setVcrEndTime(value); break;
      default: break;
    }
  };

  const handleLibraryView = () => {
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
  };

  return (
    <div className="app-layout">
      <div className="app-container">
        
        <AppHeader
          currentView={currentView}
          onDownloadsClick={() => setCurrentView('downloads')}
          onLibraryClick={handleLibraryView}
          onExplorerClick={() => { setCurrentView('explorer'); fetchExplorerFiles(''); }}
          settings={settings}
          onOpenVcr={openVcrModalAndLoad}
          onOpenSettings={handleOpenSettings}
        />

        <div className={currentView === 'downloads' ? "dashboard-grid" : "library-view-container"}>
          
          {currentView === 'downloads' && (
            <SearchPanel
              query={query}
              results={results}
              loading={loading}
              error={error}
              searchSource={searchSource}
              searchHistory={searchHistory}
              topDlResults={topDlResults}
              topDlLoading={topDlLoading}
              topDlError={topDlError}
              onQueryChange={setQuery}
              onSearch={handleSearch}
              onSearchSourceChange={setSearchSource}
              onDownload={triggerDownload}
              fetchTopDl={fetchTopDl}
              highlightMatch={highlightMatch}
              renderStatusText={renderStatusText}
              getDownloadState={getDownloadState}
              getStatusClass={getStatusClass}
            />
          )}

          <div className="card" style={currentView !== 'downloads' ? { width: '100%' } : {}}>
            {currentView === 'downloads' ? (
              <DownloadsQueue
                downloads={downloads}
                downloadLogs={downloadLogs}
                expandedLogs={expandedLogs}
                activeCasts={activeCasts}
                autoDownloads={autoDownloads}
                checkingShowId={checkingShowId}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onDeleteFile={handleDeleteFile}
                onConfirmFilename={confirmFilename}
                onPlayLocal={playLocal}
                onStartCast={(item) => setCastingItem(item)}
                onToggleLogs={toggleLogs}
                onToggleAutoDownload={handleToggleAutoDownload}
                onCheckNow={handleCheckNow}
              />
            ) : currentView === 'library' ? (
              <MediaLibrary
                mediaLibrary={mediaLibrary}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                loadingLibrary={loadingLibrary}
                totalPages={totalPages}
                totalItems={totalItems}
                currentPage={currentPage}
                categoryCounts={categoryCounts}
                serverSubcategories={serverSubcategories}
                activeSeriesId={activeSeriesId}
                activeSeries={activeSeries}
                librarySearchQuery={librarySearchQuery}
                debouncedSearchQuery={debouncedSearchQuery}
                favoritesFilter={favoritesFilter}
                activeCasts={activeCasts}
                wsConnected={wsConnected}
                xtreamEpisodes={xtreamEpisodes}
                loadingXtreamEpisodes={loadingXtreamEpisodes}
                onSelectCategory={handleSelectCategory}
                onSelectSubcategory={handleSelectSubcategory}
                onSearchChange={setLibrarySearchQuery}
                onPageChange={setCurrentPage}
                onToggleFavorite={toggleFavorite}
                onDelete={handleDeleteMediaFile}
                onPlay={playLocalLibrary}
                onCast={startCastLibrary}
                onScroll={handleScroll}
                onSeriesClick={setActiveSeriesId}
                onBack={() => setActiveSeriesId(null)}
                getPosterSrc={getPosterSrc}
                formatDuration={formatDuration}
                renderFavoritesOverview={renderFavoritesOverview}
                autoDownloads={autoDownloads}
                checkingShowId={checkingShowId}
                onCheckNow={handleCheckNow}
                onToggleAutoDownload={handleToggleAutoDownload}
                onScheduleEpgRecording={handleScheduleEpgRecording}
              />
            ) : (
              <FileExplorer
                explorerPath={explorerPath}
                explorerFiles={explorerFiles}
                explorerLoading={explorerLoading}
                explorerError={explorerError}
                showNewFolderModal={showNewFolderModal}
                newFolderName={newFolderName}
                showMoveModal={showMoveModal}
                movingItem={movingItem}
                moveDestination={moveDestination}
                onNavigate={fetchExplorerFiles}
                onCreateFolder={handleCreateFolder}
                onDelete={handleDeleteExplorerItem}
                onMove={handleMoveExplorerItem}
                onCloseNewFolder={() => setShowNewFolderModal(false)}
                onCloseMove={() => setShowMoveModal(false)}
                onNewFolderNameChange={setNewFolderName}
                onMoveDestinationChange={setMoveDestination}
                onOpenNewFolder={() => setShowNewFolderModal(true)}
                onOpenMove={(item) => { setMovingItem(item); setShowMoveModal(true); setMoveDestination(item.name); }}
              />
            )}
          </div>

        </div>

        <SettingsModal
          showSettings={showSettings}
          settings={settings}
          activeSettingsTab={activeSettingsTab}
          tempDownloadDir={tempDownloadDir}
          tempUseSSL={tempUseSSL}
          tempKeepDays={tempKeepDays}
          tempTailscaleBypassIrc={tempTailscaleBypassIrc}
          tempTailscaleLocalAddress={tempTailscaleLocalAddress}
          tempIrcSearchTimeout={tempIrcSearchTimeout}
          tempAllowTailscaleIp={tempAllowTailscaleIp}
          tempCustomLocalIp={tempCustomLocalIp}
          tempXxxHideEnabled={tempXxxHideEnabled}
          verifyPin={verifyPin}
          currentPinInput={currentPinInput}
          newPinInput={newPinInput}
          tempXtreamHost={tempXtreamHost}
          tempXtreamUsername={tempXtreamUsername}
          tempXtreamPassword={tempXtreamPassword}
          tempXtreamEnabled={tempXtreamEnabled}
          tempXtreamSyncIntervalHours={tempXtreamSyncIntervalHours}
          tempCheckIntervalHours={tempCheckIntervalHours}
          logsContent={logsContent}
          loadingLogs={loadingLogs}
          autoScrollActive={autoScrollActive}
          wsConnected={wsConnected}
          onClose={() => setShowSettings(false)}
          onTabChange={setActiveSettingsTab}
          onSave={handleSaveSettings}
          onFieldChange={handleSettingsFieldChange}
          onFetchLogs={fetchLogs}
          onLogsScroll={handleLogsScroll}
          onOpenObsoleteModal={() => setShowObsoleteModal(true)}
          onOpenLogsModal={() => { fetchLogs(); setShowLogs(true); }}
          onPinVerify={setVerifyPin}
        />

        <VcrModal
          showVcrModal={showVcrModal}
          recordings={recordings}
          vcrChannels={vcrChannels}
          vcrActiveTab={vcrActiveTab}
          vcrChannelId={vcrChannelId}
          vcrTitle={vcrTitle}
          vcrStartTime={vcrStartTime}
          vcrEndTime={vcrEndTime}
          vcrError={vcrError}
          vcrSaving={vcrSaving}
          activeCasts={activeCasts}
          onClose={() => setShowVcrModal(false)}
          onTabChange={setVcrActiveTab}
          onStopRecording={handleStopRecording}
          onDeleteRecording={handleDeleteRecording}
          onShowEpg={handleShowEpg}
          onVcrFieldChange={handleVcrFieldChange}
          onAddRecording={handleAddRecording}
          onOpenManualFromEpg={handleOpenManualFromEpg}
          formatBytes={formatBytes}
        />

        <EpgModal
          showEpgModal={showEpgModal}
          epgChannel={epgChannel}
          epgListings={epgListings}
          loadingEpg={loadingEpg}
          epgError={epgError}
          onClose={() => setShowEpgModal(false)}
          onScheduleRecording={handleScheduleEpgRecording}
          onOpenManualFromEpg={handleOpenManualFromEpg}
        />

        <LogsModal
          showLogs={showLogs}
          logsContent={logsContent}
          loadingLogs={loadingLogs}
          autoScrollActive={autoScrollActive}
          logsPreRef={logsPreRef}
          onClose={() => setShowLogs(false)}
          onFetchLogs={fetchLogs}
          onScroll={handleLogsScroll}
          onToggleAutoScroll={() => setAutoScrollActive(prev => !prev)}
        />

        <CastModal
          castingItem={castingItem}
          castDevices={castDevices}
          loadingDevices={loadingDevices}
          activeCasts={activeCasts}
          pendingCasts={pendingCasts}
          onClose={() => setCastingItem(null)}
          onStartCast={startCast}
          onStopCast={stopCast}
        />

        <ObsoleteFilesModal
          showObsoleteModal={showObsoleteModal}
          selectedObsoleteFiles={selectedObsoleteFiles}
          onClose={() => setShowObsoleteModal(false)}
          onToggleFile={(filename) => {
            setSelectedObsoleteFiles(prev => prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]);
          }}
          onDeleteSelected={() => handleBulkDeleteObsolete(selectedObsoleteFiles)}
          getDownloadState={getDownloadState}
        />

        <AudiobookPlayer
          activeAudiobook={activeAudiobook}
          audiobookPlaying={audiobookPlaying}
          audiobookDuration={audiobookDuration}
          audiobookPosition={audiobookPosition}
          audiobookChapters={audiobookChapters}
          showAudiobookPlayer={showAudiobookPlayer}
          sleepTimerActive={sleepTimerActive}
          sleepTimerTime={sleepTimerTime}
          onTogglePlay={toggleAudiobookPlay}
          onSeek={seekAudiobook}
          onSkip={skipAudiobook}
          onClose={closeAudiobookPlayer}
          onSleepTimerToggle={() => setSleepTimerActive(prev => !prev)}
          formatTime={formatTime}
        />

      </div>

      <StatusBar wsConnected={wsConnected} />
    </div>
  );
}

export default App;