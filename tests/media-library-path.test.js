import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getSafeFilePath, basenameIndex } from '../services/media-library.js';
import { appState } from '../state.js';

describe('media-library path resolution (getSafeFilePath)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsecast-test-'));
    appState.appConfig = { downloadDir: tmpDir };
    appState.downloadQueue = new Map();
    appState.cachedMappedList = [];
    appState.cachedLocalFiles = [];
    basenameIndex.clear();
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('resolves direct relative paths within downloadDir', () => {
    const filePath = path.join(tmpDir, 'Filme', 'Matrix.mp4');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'dummy content');

    const resolved = getSafeFilePath('Filme/Matrix.mp4');
    expect(resolved).toBe(filePath);
  });

  it('resolves pure basename located in a nested series subdirectory', () => {
    const seriesFile = path.join(tmpDir, 'Serien', 'Ted Lasso', 'Staffel 04', 'Ted Lasso - S04E06.mkv');
    fs.mkdirSync(path.dirname(seriesFile), { recursive: true });
    fs.writeFileSync(seriesFile, 'dummy content');

    const resolved = getSafeFilePath('Ted Lasso - S04E06.mkv');
    expect(resolved).toBe(seriesFile);
  });

  it('resolves pure basename located in standard Filme directory', () => {
    const movieFile = path.join(tmpDir, 'Filme', 'Inception.mkv');
    fs.mkdirSync(path.dirname(movieFile), { recursive: true });
    fs.writeFileSync(movieFile, 'dummy content');

    const resolved = getSafeFilePath('Inception.mkv');
    expect(resolved).toBe(movieFile);
  });

  it('blocks path traversal attempts (../../etc/shadow)', () => {
    const attempt1 = getSafeFilePath('../../etc/shadow');
    expect(attempt1).toBeNull();

    const attempt2 = getSafeFilePath('../../../../../../etc/passwd');
    expect(attempt2).toBeNull();

    const attempt3 = getSafeFilePath('..\\..\\windows\\system32');
    expect(attempt3).toBeNull();
  });

  it('finds active downloading files registered in downloadQueue', () => {
    const activeFile = path.join(tmpDir, 'In_Progress_Movie.mkv');
    fs.writeFileSync(activeFile, 'partial content');

    appState.downloadQueue.set('dl-1', {
      downloader: {
        id: 'dl-1',
        filename: 'In_Progress_Movie.mkv',
        filePath: activeFile,
        status: 'downloading'
      }
    });

    const resolved = getSafeFilePath('In_Progress_Movie.mkv');
    expect(resolved).toBe(activeFile);
  });

  it('finds files through cached mapped list and basenameIndex', () => {
    const cachedFile = path.join(tmpDir, 'Serien', 'Dark', 'Staffel 01', 'Dark S01E01.mp4');
    fs.mkdirSync(path.dirname(cachedFile), { recursive: true });
    fs.writeFileSync(cachedFile, 'dark episode');

    appState.cachedMappedList = [
      {
        filename: 'Serien/Dark/Staffel 01/Dark S01E01.mp4',
        metadata: { title: 'Geheimnisse' }
      }
    ];
    basenameIndex.set('Dark S01E01.mp4', 'Serien/Dark/Staffel 01/Dark S01E01.mp4');

    const resolved = getSafeFilePath('Dark S01E01.mp4');
    expect(resolved).toBe(cachedFile);
  });
});
