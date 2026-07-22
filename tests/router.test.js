import { describe, expect, it } from 'vitest';
import {
  parsePathForTests,
  registerRoute,
  matchRouteForTests,
  resetRouterForTests,
} from '../src/js/router.js';

describe('hash router helpers', () => {
  it('normalizes hashes to paths', () => {
    expect(parsePathForTests('')).toBe('/home');
    expect(parsePathForTests('#/cases')).toBe('/cases');
    expect(parsePathForTests('#cases')).toBe('/cases');
    expect(parsePathForTests('#/')).toBe('/home');
  });

  it('matches parameterized routes', () => {
    resetRouterForTests();
    registerRoute('/case/:id', () => {});
    const matched = matchRouteForTests('/case/case-001');
    expect(matched).not.toBeNull();
    expect(matched.params.id).toBe('case-001');
  });
});
