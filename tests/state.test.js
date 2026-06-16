import { describe, it, expect, beforeEach } from 'vitest';
import { appState, broadcastToClients, setWss, setApp } from '../state.js';

describe('appState', () => {
  beforeEach(() => {
    // Reset state for each test
    appState.downloadQueue = new Map();
    appState.activeCasts = new Map();
    appState.recordings = [];
    appState.autoDownloads = {};
  });

  it('has default configuration', () => {
    expect(appState.appConfig).toBeNull();
  });

  it('manages download queue', () => {
    appState.downloadQueue.set('test-id', { downloader: { status: 'downloading' } });
    expect(appState.downloadQueue.has('test-id')).toBe(true);
    expect(appState.downloadQueue.get('test-id').downloader.status).toBe('downloading');
  });

  it('manages active casts', () => {
    appState.activeCasts.set('Living Room', { playerState: 'PLAYING' });
    expect(appState.activeCasts.size).toBe(1);
  });

  it('manages recordings', () => {
    appState.recordings.push({ id: 'rec1', title: 'Test', status: 'scheduled' });
    expect(appState.recordings.length).toBe(1);
  });
});

describe('broadcastToClients', () => {
  it('handles null wss gracefully', () => {
    appState.wss = null;
    expect(() => broadcastToClients('test')).not.toThrow();
  });

  it('handles wss with no clients', () => {
    appState.wss = { clients: new Set() };
    expect(() => broadcastToClients({ type: 'test' })).not.toThrow();
  });
});

describe('setWss and setApp', () => {
  it('sets wss reference', () => {
    const fakeWss = { clients: new Set() };
    setWss(fakeWss);
    expect(appState.wss).toBe(fakeWss);
  });

  it('sets app reference', () => {
    const fakeApp = { use: () => {} };
    setApp(fakeApp);
    expect(appState.app).toBe(fakeApp);
  });
});