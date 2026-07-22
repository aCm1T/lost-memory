import { describe, expect, it } from 'vitest';
import { needsNewCaseConfirmation } from '../src/js/utils/progress-guard.js';

describe('progress guard', () => {
  it('requires confirmation only for in-progress saves', () => {
    expect(
      needsNewCaseConfirmation({
        caseId: 'case-001',
        startedAt: '2026-01-01T00:00:00.000Z',
        completed: false,
      }),
    ).toBe(true);

    expect(
      needsNewCaseConfirmation({
        caseId: 'case-001',
        startedAt: '2026-01-01T00:00:00.000Z',
        completed: true,
      }),
    ).toBe(false);

    expect(needsNewCaseConfirmation({ caseId: null, startedAt: null, completed: false })).toBe(
      false,
    );
  });
});
