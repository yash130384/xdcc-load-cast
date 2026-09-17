import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { registerAllRoutes } from '../routes/index.js';
import { appState } from '../state.js';

describe('Media Stream Endpoints', () => {
  let server;
  let port;
  let baseUrl;
  let tempDir;
  let testFile;

  beforeAll(async () => {
    // Setup temp directory and dummy video file
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulsecast-test-'));
    testFile = path.join(tempDir, 'sample_movie.mp4');
    // Create 10KB dummy buffer
    fs.writeFileSync(testFile, Buffer.alloc(10240, 'A'));

    appState.appConfig = {
      downloadDir: tempDir,
      xtreamEnabled: false
    };

    appState.cachedMappedList = [
      {
        filename: 'sample_movie.mp4',
        metadata: {
          title: 'Sample Movie',
          category: 'Lokal',
          originalCategory: 'Filme'
        }
      },
      {
        filename: 'Dark_S01E01.mp4',
        metadata: {
          title: 'Dark',
          seasonEpisode: 'S01E01',
          category: 'Lokal',
          originalCategory: 'Serien'
        }
      },
      {
        filename: 'Dark_S01E02.mp4',
        metadata: {
          title: 'Dark',
          seasonEpisode: 'S01E02',
          category: 'Lokal',
          originalCategory: 'Serien'
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

  it('GET /api/media/stream.m3u returns valid m3u attachment with stream URL', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream.m3u?filename=sample_movie.mp4`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/x-mpegurl');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="Sample_Movie.m3u"');

    const text = await res.text();
    expect(text).toContain('#EXTM3U');
    expect(text).toContain('#EXTINF:-1 tvg-name="Sample Movie"');
    expect(text).toContain(`${baseUrl}/api/media/stream/sample_movie.mp4`);
  });

  it('GET /api/media/stream.m3u returns 400 when filename is missing', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream.m3u`);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Parameter filename fehlt');
  });

  it('GET /api/media/season.m3u returns valid multi-item season playlist', async () => {
    const res = await fetch(`${baseUrl}/api/media/season.m3u?series=Dark&season=1`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/x-mpegurl');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="Dark_Staffel_1.m3u"');

    const text = await res.text();
    expect(text).toContain('#EXTM3U');
    expect(text).toContain('tvg-name="Dark - S01E01 - Dark"');
    expect(text).toContain(`${baseUrl}/api/media/stream/Dark_S01E01.mp4`);
    expect(text).toContain('tvg-name="Dark - S01E02 - Dark"');
    expect(text).toContain(`${baseUrl}/api/media/stream/Dark_S01E02.mp4`);
  });

  it('GET /api/media/season.m3u returns 404 when no episodes match', async () => {
    const res = await fetch(`${baseUrl}/api/media/season.m3u?series=NonExistentShow&season=99`);
    expect(res.status).toBe(404);
  });

  it('GET /api/media/stream/:filename streams complete file without range header', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream/sample_movie.mp4`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe('10240');
    expect(res.headers.get('accept-ranges')).toBe('bytes');
    expect(res.headers.get('content-type')).toBe('video/mp4');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBe(10240);
  });

  it('GET /api/media/stream/:filename supports HTTP 206 Partial Content range requests', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream/sample_movie.mp4`, {
      headers: {
        'Range': 'bytes=0-499'
      }
    });

    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 0-499/10240');
    expect(res.headers.get('content-length')).toBe('500');
    expect(res.headers.get('accept-ranges')).toBe('bytes');

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBe(500);
  });

  it('GET /api/media/stream/:filename returns 416 on unsatisfiable range', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream/sample_movie.mp4`, {
      headers: {
        'Range': 'bytes=20000-25000'
      }
    });

    expect(res.status).toBe(416);
    expect(res.headers.get('content-range')).toBe('bytes */10240');
  });

  it('GET /api/media/stream/:filename returns 404 for non-existent file', async () => {
    const res = await fetch(`${baseUrl}/api/media/stream/does_not_exist.mp4`);
    expect(res.status).toBe(404);
  });
});
