import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { registerAllRoutes } from '../routes/index.js';
import { appState } from '../state.js';

describe('On-the-Fly Audio Transcoding for Webplayer', () => {
  let server;
  let port;
  let baseUrl;
  let tempDir;
  let ac3VideoFile;

  beforeAll(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsecast-transcode-test-'));
    ac3VideoFile = path.join(tempDir, 'sample_ac3.mp4');

    // Generate a lightweight test MP4 with AC-3 audio using ffmpeg
    execSync(
      `ffmpeg -f lavfi -i testsrc=duration=1:size=64x64:rate=10 -f lavfi -i sine=frequency=440:duration=1 -c:v libx264 -c:a ac3 "${ac3VideoFile}" -y`,
      { stdio: 'ignore' }
    );

    appState.appConfig = {
      downloadDir: tempDir,
      xtreamEnabled: false
    };

    appState.cachedMappedList = [
      {
        filename: 'sample_ac3.mp4',
        metadata: {
          title: 'Sample AC3 Movie',
          category: 'Lokal',
          originalCategory: 'Filme'
        }
      }
    ];

    const app = express();
    app.use(express.json());
    registerAllRoutes(app);

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('GET /api/media/transcode/* streams transcoded MP4 with AAC audio', async () => {
    const res = await fetch(`${baseUrl}/api/media/transcode/sample_ac3.mp4`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('transfer-encoding')).toBe('chunked');
    expect(res.headers.get('cache-control')).toBe('no-cache');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/media/stream/*?transcode=audio activates audio transcoding', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream/sample_ac3.mp4?transcode=audio`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('transfer-encoding')).toBe('chunked');
    expect(res.headers.get('cache-control')).toBe('no-cache');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/media/transcode/* supports seeking with ss query param', async () => {
    const res = await fetch(`${baseUrl}/api/media/transcode/sample_ac3.mp4?ss=0.5`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('transfer-encoding')).toBe('chunked');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(500);
  });

  it('HEAD /api/media/transcode/* returns 200 headers without body', async () => {
    const res = await fetch(`${baseUrl}/api/media/transcode/sample_ac3.mp4`, {
      method: 'HEAD'
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('transfer-encoding')).toBe('chunked');
    const text = await res.text();
    expect(text).toBe('');
  });

  it('GET /api/media/probe/* accurately identifies AC-3 as requiring transcoding', async () => {
    const res = await fetch(`${baseUrl}/api/media/probe/sample_ac3.mp4`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.filename).toBe('sample_ac3.mp4');
    expect(data.needsAudioTranscode).toBe(true);
  });

  it('GET /api/media/transcode returns 400 when filename is missing', async () => {
    const res = await fetch(`${baseUrl}/api/media/transcode`);
    expect(res.status).toBe(400);
  });

  it('GET /api/media/transcode/* returns 404 for non-existent file', async () => {
    const res = await fetch(`${baseUrl}/api/media/transcode/does_not_exist.mp4`);
    expect(res.status).toBe(404);
  });

  it('handles client disconnect cleanly during transcode stream', async () => {
    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/api/media/transcode/sample_ac3.mp4`, {
      signal: controller.signal
    });
    expect(res.status).toBe(200);

    const reader = res.body.getReader();
    const { value } = await reader.read();
    expect(value).toBeDefined();

    // Abort stream to trigger req.on('close') and ffmpeg.kill
    controller.abort();
    await new Promise(r => setTimeout(r, 100));
  });
});
