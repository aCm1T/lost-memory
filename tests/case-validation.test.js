import { describe, expect, it } from 'vitest';
import case001 from '../src/data/cases/case-001.json';
import { validateCaseData } from '../src/js/utils/validation.js';
import { evaluateConditions } from '../src/js/utils/conditions.js';
import { loadCase, clearCaseCache, getCaseSummary } from '../src/js/systems/case-loader.js';

describe('case-001 validation', () => {
  it('passes schema and reference checks', () => {
    const result = validateCaseData(case001);
    if (!result.ok) {
      console.error(result.errors);
    }
    expect(result.ok).toBe(true);
    expect(case001.clues.length).toBeGreaterThanOrEqual(10);
    expect(case001.locations.length).toBeGreaterThanOrEqual(3);
    expect(case001.endings.length).toBeGreaterThanOrEqual(2);
  });

  it('registers deduction answers that exist in options', () => {
    const { correct, personOptions, motiveOptions, methodOptions } = case001.deduction;
    expect(personOptions.some((o) => o.id === correct.personId)).toBe(true);
    expect(motiveOptions.some((o) => o.id === correct.motiveId)).toBe(true);
    expect(methodOptions.some((o) => o.id === correct.methodId)).toBe(true);
  });

  it('loads through the case loader', () => {
    clearCaseCache();
    const loaded = loadCase('case-001');
    expect(loaded.ok).toBe(true);
    expect(loaded.data.id).toBe('case-001');
    expect(getCaseSummary('case-001').titleZh).toContain('407');
  });
});

describe('condition evaluator', () => {
  it('treats empty conditions as unlocked', () => {
    expect(evaluateConditions([], {})).toBe(true);
    expect(evaluateConditions(null, {})).toBe(true);
  });

  it('evaluates flag/clue/any/all predicates', () => {
    const context = {
      flags: { flag_time_gap: true },
      discoveredClueIds: ['clue-usb-leak'],
      askedTopicIds: [],
      timelineSolved: false,
    };
    expect(evaluateConditions([{ flag: 'flag_time_gap' }], context)).toBe(true);
    expect(evaluateConditions([{ clue: 'clue-missing' }], context)).toBe(false);
    expect(
      evaluateConditions([{ any: [{ clue: 'clue-missing' }, { clue: 'clue-usb-leak' }] }], context),
    ).toBe(true);
    expect(
      evaluateConditions(
        [{ all: [{ flag: 'flag_time_gap' }, { clue: 'clue-usb-leak' }] }],
        context,
      ),
    ).toBe(true);
  });
});
