import { describe, it, expect } from 'vitest';
import { isAdultContent } from '../services/xtream-client.js';

describe('isAdultContent', () => {
  it('detects adult keywords in subcategory', () => {
    expect(isAdultContent('XXX Filme', 'Some Movie')).toBe(true);
  });

  it('detects adult keywords in title', () => {
    expect(isAdultContent('Filme', '18+ Erotik')).toBe(true);
  });

  it('returns false for clean content', () => {
    expect(isAdultContent('Action', 'The Matrix')).toBe(false);
  });

  it('handles null/undefined inputs', () => {
    expect(isAdultContent(null, null)).toBe(false);
    expect(isAdultContent('', '')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isAdultContent('Erotik', '')).toBe(true);
    expect(isAdultContent('', 'HENTAI')).toBe(true);
  });
});