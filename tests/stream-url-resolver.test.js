import { describe, it, expect } from 'vitest';
import { resolveStreamUrl } from '../http-downloader.js';

describe('resolveStreamUrl', () => {
  it('correctly reconstructs IPTV stream URL from sanitized http___ format with port', () => {
    const input = 'http___vpn.c01.live_8080_series_bYfbW21W_twuqbyF6tQnM_1106772.mkv';
    const result = resolveStreamUrl(input);
    expect(result).toBe('http://vpn.c01.live:8080/series/bYfbW21W/twuqbyF6tQnM/1106772.mkv');
  });

  it('correctly reconstructs HTTPS stream URL with custom port', () => {
    const input = 'https___stream.provider.to_8443_movie_myuser_mypass_998877.mp4';
    const result = resolveStreamUrl(input);
    expect(result).toBe('https://stream.provider.to:8443/movie/myuser/mypass/998877.mp4');
  });

  it('correctly decodes /api/media/ encoded proxy URL', () => {
    const input = '/api/media/http%3A%2F%2Fvpn.c01.live%3A8080%2Fseries%2FbYfbW21W%2FtwuqbyF6tQnM%2F1106772.mkv';
    const result = resolveStreamUrl(input);
    expect(result).toBe('http://vpn.c01.live:8080/series/bYfbW21W/twuqbyF6tQnM/1106772.mkv');
  });

  it('leaves standard valid HTTP/HTTPS URLs untouched', () => {
    const input = 'http://vpn.c01.live:8080/series/bYfbW21W/twuqbyF6tQnM/1106772.mkv';
    const result = resolveStreamUrl(input);
    expect(result).toBe('http://vpn.c01.live:8080/series/bYfbW21W/twuqbyF6tQnM/1106772.mkv');
  });

  it('resolves relative Xtream path using config', () => {
    const input = 'series/bYfbW21W/twuqbyF6tQnM/1106772.mkv';
    const result = resolveStreamUrl(input, { xtreamHost: 'http://vpn.c01.live:8080' });
    expect(result).toBe('http://vpn.c01.live:8080/series/bYfbW21W/twuqbyF6tQnM/1106772.mkv');
  });
});
