import { beforeEach, describe, expect, it } from 'vitest';
import case001 from '../src/data/cases/case-001.json';
import { resetGameState, getState, startCase, setState } from '../src/js/state/game-state.js';
import { compareEvidence, findEvidenceLink } from '../src/js/systems/evidence-link-system.js';
import {
  ensureTimelineOrder,
  moveTimelineEvent,
  submitTimeline,
  listDiscoveredEvents,
} from '../src/js/systems/timeline-system.js';
import { filterClues, pinClue } from '../src/js/systems/clue-system.js';

describe('evidence link system', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-001', case001);
    setState({
      discoveredClueIds: [
        'clue-elevator-cam',
        'clue-lobby-cam',
        'clue-flashlight',
        'clue-front-call-log',
      ],
    });
  });

  it('finds authored links regardless of clue order', () => {
    const link = findEvidenceLink(case001, 'clue-lobby-cam', 'clue-elevator-cam');
    expect(link?.id).toBe('link-time-gap');
    expect(link.result).toBe('contradiction');
  });

  it('compares evidence, sets flags, and records resolved links once', () => {
    const first = compareEvidence(case001, 'clue-elevator-cam', 'clue-lobby-cam');
    expect(first.ok).toBe(true);
    expect(first.result).toBe('contradiction');
    expect(first.newlyResolved).toBe(true);
    expect(getState().flags.flag_time_gap).toBe(true);
    expect(getState().resolvedLinkIds).toContain('link-time-gap');

    const second = compareEvidence(case001, 'clue-lobby-cam', 'clue-elevator-cam');
    expect(second.newlyResolved).toBe(false);
  });

  it('returns none for unrelated discovered pairs', () => {
    const result = compareEvidence(case001, 'clue-flashlight', 'clue-front-call-log');
    expect(result.ok).toBe(true);
    expect(result.result).toBe('none');
  });
});

describe('timeline system', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-001', case001);
  });

  it('only lists events whose unlock conditions are met', () => {
    expect(listDiscoveredEvents(case001)).toHaveLength(1); // manager open has empty conditions

    setState({ discoveredClueIds: ['clue-phone-draft', 'clue-elevator-cam'] });
    const discovered = listDiscoveredEvents(case001, getState());
    expect(discovered.map((e) => e.id)).toEqual(
      expect.arrayContaining(['evt-su-returns', 'evt-zhou-upstairs', 'evt-manager-open']),
    );
  });

  it('moves events up and down', () => {
    setState({
      discoveredClueIds: ['clue-phone-draft', 'clue-elevator-cam'],
    });
    ensureTimelineOrder(case001);
    const order = [...getState().timelineOrder];
    const firstId = order[0];
    const secondId = order[1];
    const moved = moveTimelineEvent(case001, secondId, 'up');
    expect(moved.ok).toBe(true);
    expect(getState().timelineOrder[0]).toBe(secondId);
    expect(getState().timelineOrder[1]).toBe(firstId);
  });

  it('rejects submit until all events are discovered', () => {
    setState({ discoveredClueIds: ['clue-phone-draft'] });
    const result = submitTimeline(case001);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('incomplete');
    expect(getState().timelineSolved).toBe(false);
  });

  it('validates correct full order and sets timelineSolved', () => {
    // Unlock all events via required clues/topics
    setState({
      discoveredClueIds: [
        'clue-phone-draft',
        'clue-front-call-log',
        'clue-elevator-cam',
        'clue-two-cups',
        'clue-sedative-blister',
        'clue-chen-stair-sight',
        'clue-latch-fiber',
        'clue-lobby-cam',
      ],
      askedTopicIds: ['topic-he-visitor'],
    });

    const correct = case001.timeline.correctOrder;
    setState({ timelineOrder: [...correct].reverse() });
    const wrong = submitTimeline(case001);
    expect(wrong.solved).toBe(false);

    setState({ timelineOrder: [...correct] });
    const right = submitTimeline(case001);
    expect(right.solved).toBe(true);
    expect(getState().timelineSolved).toBe(true);
  });
});

describe('archive helpers', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-001', case001);
  });

  it('filters and pins clues', () => {
    const clues = case001.clues.slice(0, 3);
    expect(filterClues(clues, { type: 'physical' }).every((c) => c.type === 'physical')).toBe(true);
    pinClue(clues[0].id);
    expect(getState().pinnedClueIds).toContain(clues[0].id);
    pinClue(clues[0].id);
    expect(getState().pinnedClueIds).not.toContain(clues[0].id);
  });
});
