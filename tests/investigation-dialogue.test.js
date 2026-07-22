import { beforeEach, describe, expect, it } from 'vitest';
import case001 from '../src/data/cases/case-001.json';
import { resetGameState, getState, startCase, setState } from '../src/js/state/game-state.js';
import {
  inspectHotspot,
  listLocations,
  listVisibleHotspots,
} from '../src/js/systems/investigation-system.js';
import { askTopic, listTopicsForCharacter } from '../src/js/systems/dialogue-system.js';
import { discoverClues } from '../src/js/systems/clue-system.js';

describe('investigation system', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-001', case001);
  });

  it('lists initially unlocked locations', () => {
    const locations = listLocations(case001);
    const unlocked = locations.filter((item) => item.unlocked).map((item) => item.location.id);
    expect(unlocked).toContain('loc-room-407');
    expect(unlocked).toContain('loc-lobby');
    expect(unlocked).not.toContain('loc-room-412');
  });

  it('inspects a hotspot and discovers clues once', () => {
    const first = inspectHotspot(case001, 'loc-room-407', 'hot-407-phone');
    expect(first.ok).toBe(true);
    expect(first.newlyDiscovered).toContain('clue-phone-draft');
    expect(getState().discoveredClueIds).toContain('clue-phone-draft');
    expect(getState().inspectedHotspotIds).toContain('hot-407-phone');

    const second = inspectHotspot(case001, 'loc-room-407', 'hot-407-phone');
    expect(second.ok).toBe(true);
    expect(second.alreadyInspected).toBe(true);
    expect(second.newlyDiscovered).toEqual([]);
  });

  it('keeps conditional hotspots locked until requirements are met', () => {
    const room = case001.locations.find((location) => location.id === 'loc-room-407');
    const before = listVisibleHotspots(room);
    expect(before.find((item) => item.hotspot.id === 'hot-407-trash').unlocked).toBe(false);

    discoverClues(['clue-two-cups'], case001);
    const after = listVisibleHotspots(room, getState());
    expect(after.find((item) => item.hotspot.id === 'hot-407-trash').unlocked).toBe(true);
  });

  it('sets flags from hotspot inspection', () => {
    const result = inspectHotspot(case001, 'loc-room-407', 'hot-407-latch');
    expect(result.ok).toBe(true);
    expect(getState().flags.flag_fake_lock).toBe(true);
  });
});

describe('dialogue system', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    startCase('case-001', case001);
  });

  it('asks an unlocked topic and records history', () => {
    const result = askTopic(case001, 'char-zhou-cheng', 'topic-zhou-relation');
    expect(result.ok).toBe(true);
    expect(getState().askedTopicIds).toContain('topic-zhou-relation');
    expect(getState().dialogueHistory.at(-1).answer).toContain('搭档');
  });

  it('blocks locked topics until flags exist', () => {
    const locked = askTopic(case001, 'char-zhou-cheng', 'topic-zhou-leak');
    expect(locked.ok).toBe(false);

    setState({ flags: { ...getState().flags, flag_motive_leak: true } });
    const topics = listTopicsForCharacter(case001, 'char-zhou-cheng', getState());
    expect(topics.find((item) => item.topic.id === 'topic-zhou-leak').unlocked).toBe(true);

    const opened = askTopic(case001, 'char-zhou-cheng', 'topic-zhou-leak');
    expect(opened.ok).toBe(true);
  });

  it('reveals clues from dialogue topics once', () => {
    const first = askTopic(case001, 'char-fang-yu', 'topic-fang-heard');
    expect(first.ok).toBe(true);
    expect(first.newlyDiscovered).toContain('clue-fang-argument');

    const second = askTopic(case001, 'char-fang-yu', 'topic-fang-heard');
    expect(second.alreadyAsked).toBe(true);
    expect(second.newlyDiscovered).toEqual([]);
  });
});
