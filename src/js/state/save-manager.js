import { DATA_VERSION, DEFAULT_SETTINGS, SAVE_KEY } from '../utils/constants.js';
import { getState, replaceState, resetGameState } from './game-state.js';

export function serializeSave(state = getState()) {
  return {
    dataVersion: DATA_VERSION,
    caseId: state.caseId,
    caseTitle: state.caseTitle || null,
    currentLocationId: state.currentLocationId || null,
    currentCharacterId: state.currentCharacterId || null,
    flags: state.flags || {},
    discoveredClueIds: [...(state.discoveredClueIds || [])],
    pinnedClueIds: [...(state.pinnedClueIds || [])],
    resolvedLinkIds: [...(state.resolvedLinkIds || [])],
    inspectedHotspotIds: [...(state.inspectedHotspotIds || [])],
    askedTopicIds: [...(state.askedTopicIds || [])],
    dialogueHistory: [...(state.dialogueHistory || [])],
    timelineOrder: [...(state.timelineOrder || [])],
    timelineSolved: Boolean(state.timelineSolved),
    deductionAttempts: Number(state.deductionAttempts) || 0,
    deductionWrongAttempts: Number(state.deductionWrongAttempts) || 0,
    lastDeduction: state.lastDeduction || null,
    endingId: state.endingId,
    rank: state.rank,
    settings: { ...DEFAULT_SETTINGS, ...(state.settings || {}) },
    startedAt: state.startedAt,
    updatedAt: state.updatedAt || new Date().toISOString(),
    completed: Boolean(state.completed),
  };
}

export function saveGame(storage = localStorage) {
  try {
    const payload = serializeSave();
    storage.setItem(SAVE_KEY, JSON.stringify(payload));
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error };
  }
}

export function loadGame(storage = localStorage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { ok: true, data: null, reason: 'empty' };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, data: null, reason: 'invalid-shape' };
    }

    if (parsed.dataVersion !== DATA_VERSION) {
      // Phase 2: no migrations yet — safe reset path for unknown versions.
      return { ok: false, data: null, reason: 'unsupported-version', parsed };
    }

    const restored = replaceState(parsed);
    return { ok: true, data: restored };
  } catch (error) {
    return { ok: false, data: null, reason: 'corrupt', error };
  }
}

export function clearSave(storage = localStorage) {
  try {
    storage.removeItem(SAVE_KEY);
    resetGameState({ keepSettings: true });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export function hasSave(storage = localStorage) {
  try {
    return Boolean(storage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}
