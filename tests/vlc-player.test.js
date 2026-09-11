import { describe, it, expect } from 'vitest';
import { launchVlc } from '../services/cast-service.js';

describe('VLC Player Support', () => {
  it('rejects with an error if no target is provided to launchVlc', async () => {
    await expect(launchVlc(null)).rejects.toThrow('Kein Ziel zum Abspielen übergeben');
    await expect(launchVlc('')).rejects.toThrow('Kein Ziel zum Abspielen übergeben');
  });

  it('verifies launchVlc function signature', () => {
    expect(typeof launchVlc).toBe('function');
  });
});
