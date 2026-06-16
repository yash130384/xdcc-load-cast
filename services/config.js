import path from 'path';
import fs from 'fs';
import os from 'os';

const CONFIG_FILE = path.join(os.homedir(), '.xdcc_downloader_config.json');

export const defaultDownloadDir = path.join(os.homedir(), 'Downloads');

export function getDefaultConfig() {
  return {
    downloadDir: defaultDownloadDir,
    useSSLByDefault: true,
    ircPortDefaultSSL: 6697,
    ircPortDefaultNoSSL: 6667,
    keepDays: 0,
    checkIntervalHours: 3,
    xtreamHost: '',
    xtreamUsername: '',
    xtreamPassword: '',
    xtreamEnabled: false,
    xtreamSyncIntervalHours: 1,
    xxxHideEnabled: false,
    xxxPin: '0000',
    tailscaleBypassIrc: true,
    tailscaleLocalAddress: '',
    ircSearchTimeout: 24,
    allowTailscaleIp: false,
    customLocalIp: ''
  };
}

export function loadConfig(appState) {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      appState.appConfig = { ...appState.appConfig, ...saved };
    } catch (e) {
      console.error('Error loading config file:', e);
    }
  }
}

export function saveConfig(appState) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(appState.appConfig, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving config file:', e);
  }
}

export { CONFIG_FILE };