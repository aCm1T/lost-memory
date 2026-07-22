import { describe, expect, it, beforeEach } from 'vitest';
import {
  createInitialStateForTests,
  replaceState,
  startCase,
  hasActiveSave,
  resetGameState,
  getState,
} from '../src/js/state/game-state.js';
import {
  serializeSave,
  saveGame,
  loadGame,
  clearSave,
  hasSave,
} from '../src/js/state/save-manager.js';
import { SAVE_KEY } from '../src/js/utils/constants.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

describe('game state & save manager', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
  });

  it('creates a valid initial state', () => {
    const state = createInitialStateForTests();
    expect(state.dataVersion).toBe(1);
    expect(state.caseId).toBeNull();
    expect(state.settings.language).toBe('zh');
  });

  it('starts a case and serializes a save payload', () => {
    startCase('case-001');
    const payload = serializeSave();
    expect(payload.caseId).toBe('case-001');
    expect(payload.startedAt).toBeTruthy();
    expect(hasActiveSave(getState())).toBe(true);
  });

  it('round-trips through storage', () => {
    const storage = memoryStorage();
    startCase('case-001');
    const saved = saveGame(storage);
    expect(saved.ok).toBe(true);
    expect(storage.getItem(SAVE_KEY)).toBeTruthy();

    resetGameState({ keepSettings: false });
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    expect(loaded.data.caseId).toBe('case-001');
  });

  it('recovers from corrupt JSON without throwing', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{not-json');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(false);
    expect(loaded.reason).toBe('corrupt');
  });

  it('clears saves', () => {
    const storage = memoryStorage();
    startCase('case-001');
    saveGame(storage);
    expect(hasSave(storage)).toBe(true);
    clearSave(storage);
    expect(hasSave(storage)).toBe(false);
  });

  it('replaceState merges settings defaults', () => {
    replaceState({ caseId: 'case-001', settings: { volume: 0.2 } });
    expect(getState().settings.bgm).toBe(true);
    expect(getState().settings.volume).toBe(0.2);
  });
});
