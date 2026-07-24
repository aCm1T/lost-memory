import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import case001 from '../src/data/cases/case-001.json';
import case002 from '../src/data/cases/case-002.json';
import caseIndex from '../src/data/case-index.json';
import {
  clearCaseCache,
  getCaseIndex,
  getCaseSummary,
  listRegisteredCaseIds,
  loadCase,
} from '../src/js/systems/case-loader.js';
import { validateCaseData } from '../src/js/utils/validation.js';
import { resetGameState, getState, startCase, setState } from '../src/js/state/game-state.js';
import { inspectHotspot, listLocations } from '../src/js/systems/investigation-system.js';
import { askTopic } from '../src/js/systems/dialogue-system.js';
import { compareEvidence } from '../src/js/systems/evidence-link-system.js';
import { listDiscoveredEvents, submitTimeline } from '../src/js/systems/timeline-system.js';
import {
  evaluateDeduction,
  selectEnding,
  submitDeduction,
} from '../src/js/systems/deduction-system.js';
import { needsNewCaseConfirmation } from '../src/js/utils/progress-guard.js';
import {
  recordBestRank,
  readBestRanks,
  recordCaseEnding,
  getCaseEnding,
} from '../src/js/state/save-manager.js';
import { CREDIT_ITEMS } from '../src/js/views/credits-view.js';

const root = resolve(process.cwd());

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function assertAsset(relativePath) {
  expect(existsSync(resolve(root, 'public', relativePath)), relativePath).toBe(true);
}

describe('multi-case registry', () => {
  it('keeps case-index and case-loader registrations aligned', () => {
    const indexIds = getCaseIndex()
      .map((item) => item.id)
      .sort();
    const registered = listRegisteredCaseIds().sort();
    expect(indexIds).toEqual(registered);
    expect(indexIds).toEqual(['case-001', 'case-002']);
    expect(caseIndex.map((item) => item.id).sort()).toEqual(indexIds);
  });

  it('loads both cases through the loader', () => {
    clearCaseCache();
    expect(loadCase('case-001').ok).toBe(true);
    expect(loadCase('case-002').ok).toBe(true);
    expect(getCaseSummary('case-002').titleZh).toContain('零点十三分');
  });
});

describe('case-001 still valid', () => {
  it('passes validateCaseData', () => {
    const result = validateCaseData(case001);
    expect(result.ok).toBe(true);
  });
});

describe('case-002 validation', () => {
  it('passes schema and reference checks', () => {
    const result = validateCaseData(case002);
    if (!result.ok) console.error(result.errors);
    expect(result.ok).toBe(true);
    expect(case002.characters).toHaveLength(6);
    expect(case002.characters.filter((c) => c.interviewable).length).toBeGreaterThanOrEqual(5);
    expect(case002.locations).toHaveLength(5);
    expect(case002.clues.length).toBeGreaterThanOrEqual(16);
    expect(case002.endings).toHaveLength(3);
  });

  it('has enough dialogue topics and pairwise evidence links', () => {
    const topicCount = case002.dialogues.reduce((sum, d) => sum + d.topics.length, 0);
    expect(topicCount).toBeGreaterThanOrEqual(24);
    expect(case002.evidenceLinks.length).toBeGreaterThanOrEqual(8);
    for (const link of case002.evidenceLinks) {
      expect(link.clueIds).toHaveLength(2);
      for (const clueId of link.clueIds) {
        expect(case002.clues.some((clue) => clue.id === clueId)).toBe(true);
      }
    }
  });

  it('keeps deduction answers and required evidence resolvable', () => {
    const { correct, personOptions, motiveOptions, methodOptions, evidenceOptions } =
      case002.deduction;
    expect(personOptions.some((o) => o.id === correct.personId)).toBe(true);
    expect(motiveOptions.some((o) => o.id === correct.motiveId)).toBe(true);
    expect(methodOptions.some((o) => o.id === correct.methodId)).toBe(true);
    for (const clueId of correct.requiredEvidenceIds) {
      expect(case002.clues.some((clue) => clue.id === clueId)).toBe(true);
      expect(evidenceOptions.some((option) => option.id === clueId)).toBe(true);
    }
  });

  it('does not gate timeline events on timelineSolved', () => {
    for (const event of case002.timeline.events) {
      const blob = JSON.stringify(event.unlockConditions || []);
      expect(blob).not.toContain('timelineSolved');
    }
  });

  it('ships expected SVG assets', () => {
    assertAsset(case002.coverImage);
    for (const character of case002.characters) {
      assertAsset(character.portrait);
    }
    for (const location of case002.locations) {
      assertAsset(location.image);
    }
  });
});

describe('case-002 clear path', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-002', case002);
  });

  it('can discover all timeline events before solving the timeline', () => {
    inspectHotspot(case002, 'loc-studio-a', 'hot-studio-mic');
    inspectHotspot(case002, 'loc-studio-a', 'hot-studio-desk');
    inspectHotspot(case002, 'loc-edit-suite-b', 'hot-edit-recorder');
    inspectHotspot(case002, 'loc-edit-suite-b', 'hot-edit-workstation');
    inspectHotspot(case002, 'loc-edit-suite-b', 'hot-edit-inner');
    inspectHotspot(case002, 'loc-control-room', 'hot-ctrl-queue');
    inspectHotspot(case002, 'loc-control-room', 'hot-ctrl-login');
    inspectHotspot(case002, 'loc-lobby', 'hot-lobby-receipt');
    inspectHotspot(case002, 'loc-lobby', 'hot-lobby-visitor');

    askTopic(case002, 'char-lin-wu', 'topic-lin-voices');
    askTopic(case002, 'char-he-yuan', 'topic-he-found');
    askTopic(case002, 'char-he-yuan', 'topic-he-patrol');
    askTopic(case002, 'char-xia-yu', 'topic-xia-ledger');

    inspectHotspot(case002, 'loc-studio-a', 'hot-studio-monitor');
    inspectHotspot(case002, 'loc-control-room', 'hot-ctrl-maint');
    inspectHotspot(case002, 'loc-edit-suite-b', 'hot-edit-daw');
    inspectHotspot(case002, 'loc-equipment-corridor', 'hot-equip-panel');
    inspectHotspot(case002, 'loc-equipment-corridor', 'hot-equip-cache');
    inspectHotspot(case002, 'loc-lobby', 'hot-lobby-xia-bag');

    compareEvidence(case002, 'clue-auto-queue', 'clue-mic-log');
    compareEvidence(case002, 'clue-broadcast-file', 'clue-backup-take');
    compareEvidence(case002, 'clue-sponsor-ledger', 'clue-email-draft');
    compareEvidence(case002, 'clue-workstation-cache', 'clue-auto-queue');
    compareEvidence(case002, 'clue-access-log', 'clue-hidden-disc');
    compareEvidence(case002, 'clue-calib-tone', 'clue-maint-log');

    expect(getState().timelineSolved).toBe(false);
    const discovered = listDiscoveredEvents(case002, getState());
    expect(discovered.map((event) => event.id).sort()).toEqual(
      [...case002.timeline.correctOrder].sort(),
    );

    const locations = listLocations(case002, getState());
    expect(locations.find((item) => item.location.id === 'loc-equipment-corridor').unlocked).toBe(
      true,
    );
  });

  it('solves timeline then scores a full clear as S with true ending', () => {
    setState({
      discoveredClueIds: case002.clues.map((clue) => clue.id),
      askedTopicIds: case002.dialogues.flatMap((d) => d.topics.map((t) => t.id)),
      flags: {
        flag_not_live: true,
        flag_edited_broadcast: true,
        flag_motive_finance: true,
        flag_heard_quarrel: true,
        flag_inner_inspected: true,
        flag_lobby_checked: true,
        flag_luo_operated: true,
        flag_disc_trail: true,
        flag_early_recording: true,
        flag_xia_opened_up: true,
      },
      timelineOrder: [...case002.timeline.correctOrder],
    });

    const timeline = submitTimeline(case002);
    expect(timeline.solved).toBe(true);
    expect(timeline.message).not.toContain('412');
    expect(getState().timelineSolved).toBe(true);

    const evaluation = evaluateDeduction(case002, {
      personId: 'char-luo-jingzhou',
      motiveId: 'motive-cover-embezzlement',
      methodId: 'method-incapacitate-fake-live',
      evidenceIds: ['clue-auto-queue', 'clue-email-draft', 'clue-workstation-cache'],
    });
    expect(evaluation.rank).toBe('S');
    expect(selectEnding(case002, evaluation).id).toBe('ending-full-reveal');

    const result = submitDeduction(case002, {
      personId: 'char-luo-jingzhou',
      motiveId: 'motive-cover-embezzlement',
      methodId: 'method-incapacitate-fake-live',
      evidenceIds: ['clue-auto-queue', 'clue-email-draft', 'clue-workstation-cache'],
    });
    expect(result.completed).toBe(true);
    expect(result.ending.id).toBe('ending-full-reveal');
    expect(getState().rank).toBe('S');
  });

  it('retries wrong person without completing the case', () => {
    setState({ timelineSolved: true });
    const result = submitDeduction(case002, {
      personId: 'char-he-yuan',
      motiveId: 'motive-ratings',
      methodId: 'method-security-lock',
      evidenceIds: ['clue-master-key'],
    });
    expect(result.retry).toBe(true);
    expect(result.completed).toBe(false);
    expect(result.message).not.toContain('监控');
  });

  it('maps A-rank complete answers to partial ending, not full reveal', () => {
    setState({
      timelineSolved: true,
      flags: {},
      discoveredClueIds: [
        'clue-auto-queue',
        'clue-email-draft',
        'clue-workstation-cache',
        'clue-mic-log',
      ],
    });
    const evaluation = evaluateDeduction(case002, {
      personId: 'char-luo-jingzhou',
      motiveId: 'motive-cover-embezzlement',
      methodId: 'method-incapacitate-fake-live',
      evidenceIds: ['clue-auto-queue', 'clue-email-draft', 'clue-workstation-cache'],
    });
    expect(evaluation.rank).toBe('A');
    expect(selectEnding(case002, evaluation).id).toBe('ending-partial');
  });

  it('maps person+method-only answers to B and partial ending', () => {
    setState({ timelineSolved: true });
    const result = submitDeduction(case002, {
      personId: 'char-luo-jingzhou',
      motiveId: 'motive-ratings',
      methodId: 'method-incapacitate-fake-live',
      evidenceIds: ['clue-auto-queue', 'clue-workstation-cache'],
    });
    expect(result.completed).toBe(true);
    expect(result.evaluation.rank).toBe('B');
    expect(result.ending.id).toBe('ending-partial');
  });

  it('keeps timeline event labels free of the culprit name', () => {
    for (const event of case002.timeline.events) {
      expect(event.label).not.toContain('罗景舟');
    }
    const hidden = case002.clues.find((clue) => clue.id === 'clue-hidden-disc');
    expect(hidden.detailDescription).not.toContain('显然打算');
  });

  it('exposes all accepted-evidence-group clues in evidenceOptions', () => {
    const optionIds = new Set(case002.deduction.evidenceOptions.map((option) => option.id));
    for (const group of case002.deduction.correct.acceptedEvidenceGroups) {
      for (const clueId of group) {
        expect(optionIds.has(clueId)).toBe(true);
      }
    }
  });
});

describe('case-select / save compatibility helpers', () => {
  it('tracks best ranks per case independently', () => {
    const storage = memoryStorage();
    recordBestRank('case-001', 'A', storage);
    recordBestRank('case-002', 'S', storage);
    const ranks = readBestRanks(storage);
    expect(ranks['case-001']).toBe('A');
    expect(ranks['case-002']).toBe('S');
  });

  it('archives endings per case for later review', () => {
    const storage = memoryStorage();
    recordCaseEnding(
      'case-002',
      {
        endingId: 'ending-full-reveal',
        rank: 'S',
        title: '回声落地',
        summary: 'test',
        lastDeduction: { rank: 'S' },
      },
      storage,
    );
    expect(getCaseEnding('case-002', storage).endingId).toBe('ending-full-reveal');
    expect(getCaseEnding('case-001', storage)).toBeNull();
  });

  it('still requires confirmation when switching away from an in-progress case', () => {
    expect(
      needsNewCaseConfirmation({
        caseId: 'case-001',
        startedAt: '2026-01-01T00:00:00.000Z',
        completed: false,
      }),
    ).toBe(true);
  });
});

describe('credits mention both cases', () => {
  it('lists case 001 and case 002', () => {
    const blob = CREDIT_ITEMS.join('\n');
    expect(blob).toContain('407');
    expect(blob).toContain('零点十三分');
    expect(blob).toContain('00:13');
  });
});
