import { describe, it, expect } from 'vitest';
import { sanitizeStreamFilename } from '../services/filename-sanitizer.js';

describe('filename-sanitizer', () => {
  it('eliminates duplicated series titles and episode tags', () => {
    const input = {
      seriesTitle: 'Ted Lasso (2020) DE',
      title: 'Ted Lasso (2020) DE - S04E06 - Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!',
      extension: '.mkv'
    };

    const sanitized = sanitizeStreamFilename(input);
    expect(sanitized).toBe('Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!.mkv');
  });

  it('eliminates duplicated SxxExx tags when series title matches partially', () => {
    const input = {
      seriesTitle: 'Ted Lasso',
      title: 'Ted Lasso (2020) DE - S04E07 - Ted Lasso (2020) DE - S04E07 - Ja und, Baby',
      extension: '.mkv'
    };

    const sanitized = sanitizeStreamFilename(input);
    expect(sanitized).toBe('Ted Lasso - S04E07 - Ja und, Baby.mkv');
  });

  it('handles duplicate series without episode title', () => {
    const input = {
      seriesTitle: 'True Detective (2014) DE',
      title: 'True Detective (2014) DE - S03E04 - True Detective (2014) - S03E04',
      extension: '.mkv'
    };

    const sanitized = sanitizeStreamFilename(input);
    expect(sanitized).toBe('True Detective (2014) DE - S03E04.mkv');
  });

  it('properly handles single movies without series title', () => {
    const input = {
      seriesTitle: '',
      title: 'Inception (2010) 1080p German DL',
      extension: '.mp4'
    };

    const sanitized = sanitizeStreamFilename(input);
    expect(sanitized).toBe('Inception (2010) 1080p German DL.mp4');
  });

  it('cleans invalid filesystem characters', () => {
    const input = {
      seriesTitle: 'What / If?',
      title: 'Episode <1>: The *Beginning*?',
      seasonEpisode: 'S01E01',
      extension: '.mkv'
    };

    const sanitized = sanitizeStreamFilename(input);
    expect(sanitized).toBe('What _ If_ - S01E01 - Episode _1_ The _Beginning_.mkv');
    expect(sanitized).not.toMatch(/[\\/:*?"<>|]/);
  });
});
