import { describe, expect, it } from 'vitest';
import { getCaseIndex, getCaseSummary } from '../src/js/systems/case-loader.js';

describe('case index loader', () => {
  it('loads the registered case list', () => {
    const list = getCaseIndex();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.map((item) => item.id)).toEqual(expect.arrayContaining(['case-001', 'case-002']));
  });

  it('resolves a case summary by id', () => {
    const summary = getCaseSummary('case-001');
    expect(summary.titleZh).toContain('407');
    expect(getCaseSummary('case-002').titleZh).toContain('零点十三分');
    expect(getCaseSummary('missing')).toBeNull();
  });
});
