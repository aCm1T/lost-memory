import { describe, expect, it } from 'vitest';
import { calcProgressPercent } from '../src/js/components/progress-indicator.js';

describe('progress indicator helpers', () => {
  it('clamps values and computes percent', () => {
    expect(calcProgressPercent(3, 10)).toEqual({ safeMax: 10, safeValue: 3, percent: 30 });
    expect(calcProgressPercent(12, 10).safeValue).toBe(10);
    expect(calcProgressPercent(-2, 10).safeValue).toBe(0);
    expect(calcProgressPercent(1, 0).safeMax).toBe(1);
  });
});
