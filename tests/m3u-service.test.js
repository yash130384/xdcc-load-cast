import { describe, it, expect, beforeEach } from 'vitest';
import { generateM3uPlaylist, generateXmltvEpg } from '../services/m3u-service.js';
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
