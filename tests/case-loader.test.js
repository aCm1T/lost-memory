import { describe, expect, it } from 'vitest';
import { getCaseIndex, getCaseSummary } from '../src/js/systems/case-loader.js';

describe('case index loader', () => {
  it('loads the registered case list', () => {
    const list = getCaseIndex();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe('case-001');
  });

  it('resolves a case summary by id', () => {
    const summary = getCaseSummary('case-001');
    expect(summary.titleZh).toContain('407');
    expect(getCaseSummary('missing')).toBeNull();
  });
});
