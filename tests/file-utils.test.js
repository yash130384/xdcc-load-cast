import { describe, it, expect } from 'vitest';
import { parseSizeToBytes, parseTimeStringToSeconds } from '../services/file-utils.js';

describe('parseSizeToBytes', () => {
  it('parses bytes', () => {
    expect(parseSizeToBytes('100')).toBe(100);
  });

  it('parses KB', () => {
    expect(parseSizeToBytes('1 K')).toBe(1024);
  });

  it('parses MB', () => {
    expect(parseSizeToBytes('2.5 MB')).toBe(Math.round(2.5 * 1024 * 1024));
  });

  it('parses GB', () => {
    expect(parseSizeToBytes('1 GB')).toBe(1073741824);
  });

  it('returns 0 for invalid input', () => {
    expect(parseSizeToBytes('')).toBe(0);
    expect(parseSizeToBytes(null)).toBe(0);
  });
});

describe('parseTimeStringToSeconds', () => {
  it('parses HH:MM:SS', () => {
    expect(parseTimeStringToSeconds('1:30:45')).toBe(5445);
  });

  it('parses MM:SS', () => {
    expect(parseTimeStringToSeconds('5:30')).toBe(330);
  });

  it('parses plain number', () => {
    expect(parseTimeStringToSeconds('120')).toBe(120);
  });

  it('returns 0 for invalid input', () => {
    expect(parseTimeStringToSeconds('')).toBe(0);
    expect(parseTimeStringToSeconds(null)).toBe(0);
  });
});