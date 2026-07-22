import { describe, expect, it, beforeEach } from 'vitest';
import {
  createInitialStateForTests,
  replaceState,
  startCase,
  hasActiveSave,
  resetGameState,
  getState,
  setState,
} from '../src/js/state/game-state.js';
import {
  serializeSave,
  saveGame,
  loadGame,
  clearSave,
  hasSave,
  migrateSave,
  recoverCorruptSave,
  getContinuePath,
  restartCase,
  saveSettings,
  loadSettings,
  recordBestRank,
  readBestRanks,
} from '../src/js/state/save-manager.js';
import { SAVE_KEY, SETTINGS_KEY, BEST_RANKS_KEY } from '../src/js/utils/constants.js';
import { updateSettings, applyPresentationSettings } from '../src/js/systems/settings-system.js';
import {
  unlockAudio,
  playSfx,
  resetAudioForTests,
  getMissingAudioFilesForTests,
} from '../src/js/systems/audio-system.js';

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

  it('round-trips through storage and persists settings key', () => {
    const storage = memoryStorage();
    startCase('case-001');
    setState({ settings: { volume: 0.4 } });
    const saved = saveGame(storage);
    expect(saved.ok).toBe(true);
    expect(storage.getItem(SAVE_KEY)).toBeTruthy();
    expect(storage.getItem(SETTINGS_KEY)).toBeTruthy();

    resetGameState({ keepSettings: false });
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(true);
    expect(loaded.data.caseId).toBe('case-001');
    expect(loaded.data.settings.volume).toBe(0.4);
  });

  it('recovers from corrupt JSON without throwing', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, '{not-json');
    const loaded = loadGame(storage);
    expect(loaded.ok).toBe(false);
    expect(loaded.reason).toBe('corrupt');

    const recovered = recoverCorruptSave(storage);
    expect(recovered.ok).toBe(true);
    expect(hasSave(storage)).toBe(false);
  });

  it('clears saves but keeps settings on disk', () => {
    const storage = memoryStorage();
    startCase('case-001');
    setState({ settings: { sfx: false, volume: 0.2 } });
    saveGame(storage);
    expect(hasSave(storage)).toBe(true);
    clearSave(storage);
    expect(hasSave(storage)).toBe(false);
    const settings = loadSettings(storage);
    expect(settings.data.sfx).toBe(false);
    expect(settings.data.volume).toBe(0.2);
  });

  it('replaceState merges settings defaults', () => {
    replaceState({ caseId: 'case-001', settings: { volume: 0.2 } });
    expect(getState().settings.bgm).toBe(true);
    expect(getState().settings.volume).toBe(0.2);
  });

  it('migrates partial saves by filling arrays', () => {
    const migrated = migrateSave({
      dataVersion: 1,
      caseId: 'case-001',
      settings: { volume: 0.5 },
    });
    expect(migrated.ok).toBe(true);
    expect(migrated.data.discoveredClueIds).toEqual([]);
    expect(migrated.data.settings.volume).toBe(0.5);
    expect(migrated.data.settings.bgm).toBe(true);
  });

  it('returns continue path and can restart a case', () => {
    startCase('case-001', { titleZh: '测试' });
    expect(getContinuePath(getState())).toBe('/investigation');
    setState({ completed: true, endingId: 'ending-true-rescue' });
    expect(getContinuePath(getState())).toBe('/ending');

    const storage = memoryStorage();
    const restarted = restartCase('case-001', { titleZh: '测试' }, storage);
    expect(restarted.ok).toBe(true);
    expect(getState().completed).toBe(false);
    expect(getState().discoveredClueIds).toEqual([]);
  });

  it('records best ranks without downgrading', () => {
    const storage = memoryStorage();
    recordBestRank('case-001', 'B', storage);
    recordBestRank('case-001', 'C', storage);
    recordBestRank('case-001', 'S', storage);
    expect(readBestRanks(storage)['case-001']).toBe('S');
    expect(storage.getItem(BEST_RANKS_KEY)).toBeTruthy();
  });
});

describe('settings & audio helpers', () => {
  beforeEach(() => {
    resetGameState({ keepSettings: false });
    resetAudioForTests();
  });

  it('updates and applies presentation settings', () => {
    updateSettings({ motion: 'off', textSpeed: 'fast' }, { syncAudio: false });
    expect(getState().settings.motion).toBe('off');
    applyPresentationSettings();
    if (typeof document !== 'undefined') {
      expect(document.documentElement.dataset.motion).toBe('off');
      expect(document.documentElement.dataset.textSpeed).toBe('fast');
    }
  });

  it('playSfx tolerates missing audio APIs after unlock', async () => {
    unlockAudio();
    setState({ settings: { sfx: true, volume: 0.5 } });
    await expect(playSfx('click')).resolves.toBeUndefined();
    await expect(playSfx('clue')).resolves.toBeUndefined();
    expect(Array.isArray(getMissingAudioFilesForTests())).toBe(true);
  });

  it('saveSettings round-trips independently', () => {
    const storage = memoryStorage();
    saveSettings({ bgm: false, volume: 0.1 }, storage);
    const loaded = loadSettings(storage);
    expect(loaded.ok).toBe(true);
    expect(loaded.data.bgm).toBe(false);
    expect(loaded.data.volume).toBe(0.1);
    expect(loaded.data.sfx).toBe(true);
  });
});
