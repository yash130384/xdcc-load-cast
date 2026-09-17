import { describe, it, expect, beforeEach } from 'vitest';
import { generateM3uPlaylist, generateSingleItemM3u, generateSeasonM3u, generateXmltvEpg } from '../services/m3u-service.js';
import { appState } from '../state.js';

describe('m3u-service', () => {
  beforeEach(() => {
    appState.cachedMappedList = [
      {
        filename: 'Inception.2010.1080p.mp4',
        metadata: {
          title: 'Inception',
          category: 'Lokal',
          originalCategory: 'Filme',
          posterUrl: 'https://image.tmdb.org/t/p/w500/inception.jpg'
        }
      },
      {
        filename: 'Breaking.Bad.S01E01.mp4',
        metadata: {
          title: 'Breaking Bad',
          seasonEpisode: 'S01E01',
          category: 'Lokal',
          originalCategory: 'Serien'
        }
      }
    ];

    appState.cachedMappedLive = [
      {
        title: 'Das Erste HD',
        streamUrl: 'http://upstream.iptv/live/123.ts',
        epgChannelId: 'daserste.de',
        subcategory: 'DE | Öffentlich-Rechtlich'
      }
    ];

    appState.cachedMappedMovies = [
      {
        title: 'Dune: Part Two',
        streamUrl: 'http://upstream.iptv/movie/456.mp4',
        xtreamStreamId: 456,
        coverUrl: 'http://upstream.iptv/dune.jpg',
        subcategory: 'DE | Sci-Fi'
      }
    ];
  });

  it('generates valid M3U8 content with local files and IPTV streams', async () => {
    const baseUrl = 'http://192.168.1.100:3000';
    const m3u = await generateM3uPlaylist(baseUrl);

    expect(m3u).toContain('#EXTM3U');
    expect(m3u).toContain('x-tvg-url="http://192.168.1.100:3000/api/iptv/epg.xml"');
    
    // Local movie
    expect(m3u).toContain('group-title="Lokal - Filme"');
    expect(m3u).toContain('Inception');
    expect(m3u).toContain('http://192.168.1.100:3000/api/media/Inception.2010.1080p.mp4');

    // Local series
    expect(m3u).toContain('group-title="Lokal - Serien"');
    expect(m3u).toContain('Breaking Bad (S01E01)');

    // Live IPTV
    expect(m3u).toContain('group-title="Live TV - DE | Öffentlich-Rechtlich"');
    expect(m3u).toContain('tvg-id="daserste.de"');
    expect(m3u).toContain('Das Erste HD');

    // VOD IPTV
    expect(m3u).toContain('group-title="Filme - DE | Sci-Fi"');
    expect(m3u).toContain('Dune: Part Two');
  });

  it('generates valid single-item M3U with stream URL', () => {
    const baseUrl = 'http://192.168.1.100:3000';
    const item = appState.cachedMappedList[0];
    const m3u = generateSingleItemM3u(item, baseUrl);

    expect(m3u).toContain('#EXTM3U');
    expect(m3u).toContain('tvg-name="Inception"');
    expect(m3u).toContain('group-title="Filme"');
    expect(m3u).toContain('http://192.168.1.100:3000/api/media/stream/Inception.2010.1080p.mp4');
  });

  it('generates valid season M3U with multiple episode entries', () => {
    const baseUrl = 'http://192.168.1.100:3000';
    const episodes = [
      {
        filename: 'Dark S01E01.mkv',
        metadata: { title: 'Geheimnisse', seasonEpisode: 'S01E01' }
      },
      {
        filename: 'Dark S01E02.mkv',
        metadata: { title: 'Lügen', seasonEpisode: 'S01E02' }
      }
    ];

    const m3u = generateSeasonM3u('Dark', 1, episodes, baseUrl);

    expect(m3u).toContain('#EXTM3U');
    expect(m3u).toContain('group-title="Dark - Staffel 1"');
    expect(m3u).toContain('tvg-name="Dark - S01E01 - Geheimnisse"');
    expect(m3u).toContain('http://192.168.1.100:3000/api/media/stream/Dark%20S01E01.mkv');
    expect(m3u).toContain('tvg-name="Dark - S01E02 - Lügen"');
    expect(m3u).toContain('http://192.168.1.100:3000/api/media/stream/Dark%20S01E02.mkv');
  });

  it('deduplicates episodes in generateSeasonM3u and picks the cleaner file', () => {
    const baseUrl = 'http://192.168.1.100:3000';
    const episodes = [
      {
        filename: 'Serien/Ted Lasso/Staffel 04/Ted Lasso (2020) DE - S04E06 - Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!.mkv',
        metadata: { title: 'Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!', seasonEpisode: 'S04E06' }
      },
      {
        filename: 'Serien/Ted Lasso/Staffel 04/Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!.mkv',
        metadata: { title: 'Vorsicht beim Springen!', seasonEpisode: 'S04E06' }
      },
      {
        filename: 'Serien/Ted Lasso/Staffel 04/Ted Lasso (2020) DE - S04E07 - Ja und, Baby.mkv',
        metadata: { title: 'Ja und, Baby', seasonEpisode: 'S04E07' }
      }
    ];

    const m3u = generateSeasonM3u('Ted Lasso (2020) DE', 4, episodes, baseUrl);

    // Should only have 2 EXTINF entries, not 3!
    const extinfMatches = m3u.match(/#EXTINF/g);
    expect(extinfMatches?.length).toBe(2);

    // It should pick the clean S04E06 filename
    expect(m3u).toContain('http://192.168.1.100:3000/api/media/stream/Serien%2FTed%20Lasso%2FStaffel%2004%2FTed%20Lasso%20(2020)%20DE%20-%20S04E06%20-%20Vorsicht%20beim%20Springen!.mkv');
    expect(m3u).not.toContain('Ted%20Lasso%20(2020)%20DE%20-%20S04E06%20-%20Ted%20Lasso');

    // Display title should be cleanly formatted
    expect(m3u).toContain('tvg-name="Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!"');
    expect(m3u).toContain('tvg-name="Ted Lasso (2020) DE - S04E07 - Ja und, Baby"');
  });

  it('converts absolute downloadDir paths into clean relative stream URLs', () => {
    appState.appConfig = { downloadDir: '/media/yash/INTENSO' };
    const baseUrl = 'http://192.168.1.100:3000';
    const item = {
      filename: '/media/yash/INTENSO/Filme/Dune.mp4',
      metadata: { title: 'Dune' }
    };

    const m3u = generateSingleItemM3u(item, baseUrl);
    expect(m3u).toContain('http://192.168.1.100:3000/api/media/stream/Filme%2FDune.mp4');
    expect(m3u).not.toContain('/media/yash/INTENSO');
  });

  it('generates valid XMLTV EPG', () => {
    const baseUrl = 'http://192.168.1.100:3000';
    const xml = generateXmltvEpg(baseUrl);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<tv generator-info-name="PulseCast">');
    expect(xml).toContain('<channel id="daserste.de">');
    expect(xml).toContain('<display-name>Das Erste HD</display-name>');
    expect(xml).toContain('<programme');
  });
});
