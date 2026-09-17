import { describe, it, expect } from 'vitest';
import { generateSingleItemM3u, generateSeasonM3u } from '../services/m3u-service.js';

describe('VLC Client Streaming & M3U Generation', () => {
  const baseUrl = 'http://192.168.1.50:3000';

  it('generates a valid single-item M3U playlist with stream URL for VLC', () => {
    const item = {
      filename: 'Inception.2010.1080p.mkv',
      metadata: {
        title: 'Inception',
        originalCategory: 'Filme',
        posterUrl: 'http://image.tmdb.org/t/p/w500/inception.jpg'
      }
    };

    const m3u = generateSingleItemM3u(item, baseUrl);

    expect(m3u).toContain('#EXTM3U');
    expect(m3u).toContain('#EXTINF:-1 tvg-name="Inception"');
    expect(m3u).toContain('group-title="Filme"');
    expect(m3u).toContain('tvg-logo="http://image.tmdb.org/t/p/w500/inception.jpg"');
    expect(m3u).toContain('http://192.168.1.50:3000/api/media/stream/Inception.2010.1080p.mkv');
  });

  it('properly encodes special characters and spaces in stream URLs', () => {
    const item = {
      filename: 'Series/Breaking Bad/Staffel 1/S01E01 - Pilot (720p).mkv',
      metadata: {
        title: 'Breaking Bad',
        seasonEpisode: 'S01E01'
      }
    };

    const m3u = generateSingleItemM3u(item, baseUrl);

    expect(m3u).toContain('#EXTM3U');
    expect(m3u).toContain('tvg-name="Breaking Bad (S01E01)"');
    expect(m3u).toContain('http://192.168.1.50:3000/api/media/stream/Series%2FBreaking%20Bad%2FStaffel%201%2FS01E01%20-%20Pilot%20(720p).mkv');
  });

  it('generates a valid season M3U playlist for VLC with sequential episodes', () => {
    const episodes = [
      {
        filename: 'Breaking Bad - S01E01.mp4',
        metadata: { title: 'Pilot', seasonEpisode: 'S01E01' }
      },
      {
        filename: 'Breaking Bad - S01E02.mp4',
        metadata: { title: 'Cat\'s in the Bag...', seasonEpisode: 'S01E02' }
      }
    ];

    const m3u = generateSeasonM3u('Breaking Bad', 1, episodes, baseUrl);

    expect(m3u).toContain('#EXTM3U');
    expect(m3u).toContain('group-title="Breaking Bad - Staffel 1"');
    expect(m3u).toContain('tvg-name="Breaking Bad - S01E01 - Pilot"');
    expect(m3u).toContain('http://192.168.1.50:3000/api/media/stream/Breaking%20Bad%20-%20S01E01.mp4');
    expect(m3u).toContain('tvg-name="Breaking Bad - S01E02 - Cat\'s in the Bag..."');
    expect(m3u).toContain('http://192.168.1.50:3000/api/media/stream/Breaking%20Bad%20-%20S01E02.mp4');
  });
});
