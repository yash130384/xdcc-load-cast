import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import { appState, broadcastToClients } from '../state.js';
import { updateLocalMappedList } from './media-library.js';

const RECORDINGS_FILE = path.join(os.homedir(), '.xdcc_recordings.json');

export function decodeBase64Safe(str) {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      const hasControl = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(decoded);
      if (!hasControl && decoded.length > 0) {
        return decoded;
      }
    } catch (e) {}
  }
  return str;
}

export function loadRecordings() {
  if (fs.existsSync(RECORDINGS_FILE)) {
    try {
      appState.recordings = JSON.parse(fs.readFileSync(RECORDINGS_FILE, 'utf8'));
      appState.recordings.forEach(rec => {
        if (rec.status === 'recording') {
          rec.status = 'error';
          rec.errorMessage = 'Aufnahme durch Server-Neustart unterbrochen';
        }
      });
    } catch (e) {
      console.error('[VCR] Failed to load recordings:', e.message);
      appState.recordings = [];
    }
  } else {
    appState.recordings = [];
  }
}

export function saveRecordings() {
  try {
    fs.writeFileSync(RECORDINGS_FILE, JSON.stringify(appState.recordings, null, 2), 'utf8');
  } catch (e) {
    console.error('[VCR] Failed to save recordings:', e.message);
  }
}

export function broadcastVcrStatus() {
  const list = appState.recordings.map(rec => {
    const active = appState.activeVcrJobs.get(rec.id);
    return {
      ...rec,
      bytesReceived: active ? active.bytesReceived : (rec.bytesReceived || 0),
      speed: active ? active.speed : 0
    };
  });
  broadcastToClients({ type: 'vcr-status', data: list });
}

export async function startVcrRecording(rec) {
  if (appState.activeVcrJobs.has(rec.id)) return;

  console.log(`[VCR] Starting recording for ${rec.title} (${rec.channelName})...`);

  if (!fs.existsSync(appState.appConfig.downloadDir)) {
    fs.mkdirSync(appState.appConfig.downloadDir, { recursive: true });
  }

  const cleanTitle = rec.title.replace(/[^a-zA-Z0-9-_]/g, '_');
  const cleanChannel = rec.channelName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const dateStr = new Date(rec.startTime).toISOString().slice(0, 16).replace(/:/g, '-');
  const filename = `Aufnahme_${cleanChannel}_${cleanTitle}_${dateStr}.ts`;
  const filePath = path.join(appState.appConfig.downloadDir, filename);

  rec.filename = filename;
  rec.filePath = filePath;
  rec.status = 'recording';
  saveRecordings();
  broadcastVcrStatus();

  const abortController = new AbortController();
  const fileStream = fs.createWriteStream(filePath);

  const job = {
    abortController,
    fileStream,
    bytesReceived: 0,
    bytesInLastTick: 0,
    speed: 0,
    startTime: Date.now()
  };

  appState.activeVcrJobs.set(rec.id, job);

  try {
    const response = await axios({
      method: 'get',
      url: rec.streamUrl,
      responseType: 'stream',
      signal: abortController.signal,
      timeout: 30000
    });

    const responseStream = response.data;

    responseStream.on('data', (chunk) => {
      job.bytesReceived += chunk.length;
      fileStream.write(chunk);
    });

    responseStream.on('end', () => {
      console.log(`[VCR] Stream end reached for ${rec.title}`);
      stopVcrRecordingJob(rec.id, 'completed');
    });

    responseStream.on('error', (err) => {
      if (rec.status === 'recording') {
        console.error(`[VCR] Stream error for ${rec.title}:`, err.message);
        stopVcrRecordingJob(rec.id, 'error', `Stream-Fehler: ${err.message}`);
      }
    });

  } catch (err) {
    if (axios.isCancel(err) || err.name === 'CanceledError') {
      console.log(`[VCR] Recording canceled for ${rec.title}`);
    } else {
      console.error(`[VCR] Connection failed for ${rec.title}:`, err.message);
      stopVcrRecordingJob(rec.id, 'error', `Verbindungsfehler: ${err.message}`);
    }
  }
}

export function stopVcrRecordingJob(id, targetStatus = 'completed', errorMessage = '') {
  const job = appState.activeVcrJobs.get(id);
  const rec = appState.recordings.find(r => r.id === id);

  if (job) {
    try {
      job.abortController.abort();
    } catch (e) {}
    try {
      job.fileStream.end();
    } catch (e) {}
    appState.activeVcrJobs.delete(id);
  }

  if (rec && rec.status === 'recording') {
    rec.status = targetStatus;
    if (job) {
      rec.bytesReceived = job.bytesReceived;
    }
    if (errorMessage) {
      rec.errorMessage = errorMessage;
    }
    saveRecordings();
    broadcastVcrStatus();
    console.log(`[VCR] Recording stopped for ${rec.title} with status ${targetStatus}`);

    updateLocalMappedList(true).catch(err => console.error('[VCR] Media library update error:', err));
  }
}

export async function checkVcrRecordings() {
  const now = Date.now();
  let changed = false;

  for (const rec of appState.recordings) {
    const start = new Date(rec.startTime).getTime();
    const end = new Date(rec.endTime).getTime();

    if (rec.status === 'scheduled' && now >= start) {
      if (now < end) {
        startVcrRecording(rec).catch(err => {
          console.error(`[VCR] Failed to start recording ${rec.title}:`, err.message);
          rec.status = 'error';
          rec.errorMessage = `Fehler beim Start: ${err.message}`;
          saveRecordings();
          broadcastVcrStatus();
        });
        changed = true;
      } else {
        rec.status = 'error';
        rec.errorMessage = 'Aufnahmezeitfenster verpasst (Server offline)';
        changed = true;
      }
    }

    if (rec.status === 'recording' && now >= end) {
      stopVcrRecordingJob(rec.id, 'completed');
      changed = true;
    }
  }

  for (const [id, job] of appState.activeVcrJobs.entries()) {
    const bytesReceived = job.bytesReceived;
    const bytesDiff = bytesReceived - job.bytesInLastTick;
    job.speed = Math.round(bytesDiff / 10);
    job.bytesInLastTick = bytesReceived;
    changed = true;
  }

  if (changed) {
    saveRecordings();
    broadcastVcrStatus();
  }
}