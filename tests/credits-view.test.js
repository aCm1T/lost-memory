import { describe, expect, it } from 'vitest';
import { CREDIT_ITEMS } from '../src/js/views/credits-view.js';

describe('credits content', () => {
  it('lists core attributions for the release', () => {
    const blob = CREDIT_ITEMS.join('\n');
    expect(blob).toContain('aCm1T');
    expect(blob).toContain('407');
    expect(blob).toContain('零点十三分');
    expect(blob).toContain('MIT');
    expect(blob).toContain('CREDITS.md');
    expect(CREDIT_ITEMS.length).toBeGreaterThanOrEqual(7);
  });
});
