import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '../src/js/pwa.js';

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is a no-op outside production builds', () => {
    const register = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { register } });

    expect(() => registerServiceWorker()).not.toThrow();
    expect(register).not.toHaveBeenCalled();
  });
});
