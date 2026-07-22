import { beforeEach, describe, expect, it } from 'vitest';
import case001 from '../src/data/cases/case-001.json';
import { resetGameState, getState, startCase, setState } from '../src/js/state/game-state.js';
import {
  canAccessDeduction,
  evaluateDeduction,
  selectEnding,
  submitDeduction,
} from '../src/js/systems/deduction-system.js';

function unlockDeduction() {
  setState({
    timelineSolved: true,
    flags: {
      flag_time_gap: true,
      flag_fake_lock: true,
      flag_motive_leak: true,
    },
    discoveredClueIds: [
      'clue-elevator-cam',
      'clue-lobby-cam',
      'clue-usb-leak',
      'clue-latch-fiber',
      'clue-phone-draft',
      'clue-card-log-412',
    ],
  });
}

describe('deduction system', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-001', case001);
  });

  it('locks deduction until timeline is solved', () => {
    expect(canAccessDeduction()).toBe(false);
    const blocked = submitDeduction(case001, {
      personId: 'char-zhou-cheng',
      motiveId: 'motive-silence-leak',
      methodId: 'method-sedate-move-412',
      evidenceIds: ['clue-elevator-cam'],
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe('timeline-locked');
  });

  it('scores a perfect submission as S and selects true-rescue ending', () => {
    unlockDeduction();
    const evaluation = evaluateDeduction(case001, {
      personId: 'char-zhou-cheng',
      motiveId: 'motive-silence-leak',
      methodId: 'method-sedate-move-412',
      evidenceIds: ['clue-elevator-cam', 'clue-usb-leak', 'clue-latch-fiber'],
    });
    expect(evaluation.rank).toBe('S');
    expect(selectEnding(case001, evaluation).id).toBe('ending-true-rescue');
  });

  it('allows retry feedback when person is wrong', () => {
    unlockDeduction();
    const result = submitDeduction(case001, {
      personId: 'char-lin-yue',
      motiveId: 'motive-theft',
      methodId: 'method-window-escape',
      evidenceIds: ['clue-flashlight'],
    });
    expect(result.ok).toBe(true);
    expect(result.retry).toBe(true);
    expect(result.completed).toBe(false);
    expect(getState().completed).toBe(false);
    expect(getState().deductionWrongAttempts).toBe(1);
  });

  it('completes the case with partial ending for person+method only', () => {
    unlockDeduction();
    const result = submitDeduction(case001, {
      personId: 'char-zhou-cheng',
      motiveId: 'motive-theft',
      methodId: 'method-sedate-move-412',
      evidenceIds: ['clue-elevator-cam', 'clue-latch-fiber'],
    });
    expect(result.completed).toBe(true);
    expect(result.evaluation.personCorrect).toBe(true);
    expect(result.evaluation.methodCorrect).toBe(true);
    expect(result.evaluation.motiveCorrect).toBe(false);
    expect(['B', 'A', 'C']).toContain(result.evaluation.rank);
    expect(getState().completed).toBe(true);
    expect(getState().endingId).toBeTruthy();
  });

  it('forces an ending after repeated failed retries', () => {
    unlockDeduction();
    setState({ deductionWrongAttempts: 4 });
    const result = submitDeduction(case001, {
      personId: 'char-he-lan',
      motiveId: 'motive-affair',
      methodId: 'method-never-returned',
      evidenceIds: ['clue-flashlight'],
    });
    expect(result.completed).toBe(true);
    expect(result.ending.id).toBe('ending-missed');
    expect(getState().rank).toBe('C');
  });
});
