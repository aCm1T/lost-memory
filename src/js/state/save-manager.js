import {
  BEST_RANKS_KEY,
  DATA_VERSION,
  DEFAULT_SETTINGS,
  SAVE_KEY,
  SETTINGS_KEY,
} from '../utils/constants.js';
import { getLocalStorage } from '../utils/storage.js';
import { getState, replaceState, resetGameState, startCase, setState } from './game-state.js';

function safeParse(raw) {
  return JSON.parse(raw);
}

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

export function migrateSave(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'invalid-shape' };
  }

  const version = Number(parsed.dataVersion);
  if (!Number.isFinite(version)) {
    return { ok: false, reason: 'invalid-shape' };
  }
  if (version > DATA_VERSION) {
    return { ok: false, reason: 'unsupported-version', parsed };
  }

  // v1 and any older unknown versions that still look usable are normalized.
  const normalized = {
    ...parsed,
    dataVersion: DATA_VERSION,
    flags: parsed.flags && typeof parsed.flags === 'object' ? parsed.flags : {},
    discoveredClueIds: Array.isArray(parsed.discoveredClueIds) ? parsed.discoveredClueIds : [],
    pinnedClueIds: Array.isArray(parsed.pinnedClueIds) ? parsed.pinnedClueIds : [],
    resolvedLinkIds: Array.isArray(parsed.resolvedLinkIds) ? parsed.resolvedLinkIds : [],
    inspectedHotspotIds: Array.isArray(parsed.inspectedHotspotIds)
      ? parsed.inspectedHotspotIds
      : [],
    askedTopicIds: Array.isArray(parsed.askedTopicIds) ? parsed.askedTopicIds : [],
    dialogueHistory: Array.isArray(parsed.dialogueHistory) ? parsed.dialogueHistory : [],
    timelineOrder: Array.isArray(parsed.timelineOrder) ? parsed.timelineOrder : [],
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
  };

  return { ok: true, data: normalized };
}

export function saveSettings(settings = getState().settings, storage = getLocalStorage()) {
  try {
    const payload = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    storage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error };
  }
}

export function loadSettings(storage = getLocalStorage()) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ok: true, data: { ...DEFAULT_SETTINGS }, reason: 'empty' };
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, data: { ...DEFAULT_SETTINGS }, reason: 'corrupt' };
    }
    return { ok: true, data: { ...DEFAULT_SETTINGS, ...parsed } };
  } catch (error) {
    return { ok: false, data: { ...DEFAULT_SETTINGS }, reason: 'corrupt', error };
  }
}

export function saveGame(storage = getLocalStorage()) {
  try {
    const payload = serializeSave();
    storage.setItem(SAVE_KEY, JSON.stringify(payload));
    saveSettings(payload.settings, storage);
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error };
  }
}

export function loadGame(storage = getLocalStorage()) {
  const settingsResult = loadSettings(storage);

  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) {
      if (settingsResult.data) {
        setState({ settings: settingsResult.data });
      }
      return { ok: true, data: null, reason: 'empty', settings: settingsResult.data };
    }

    const parsed = safeParse(raw);
    const migrated = migrateSave(parsed);
    if (!migrated.ok) {
      return {
        ok: false,
        data: null,
        reason: migrated.reason,
        parsed,
        settings: settingsResult.data,
      };
    }

    const withSettings = {
      ...migrated.data,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(settingsResult.data || {}),
        ...(migrated.data.settings || {}),
      },
    };

    const restored = replaceState(withSettings);
    saveSettings(restored.settings, storage);
    return { ok: true, data: restored, settings: restored.settings };
  } catch (error) {
    return {
      ok: false,
      data: null,
      reason: 'corrupt',
      error,
      settings: settingsResult.data,
    };
  }
}

export function recoverCorruptSave(storage = getLocalStorage()) {
  try {
    storage.removeItem(SAVE_KEY);
    const settingsResult = loadSettings(storage);
    resetGameState({ keepSettings: false });
    setState({ settings: settingsResult.data || { ...DEFAULT_SETTINGS } });
    saveSettings(getState().settings, storage);
    return {
      ok: true,
      message: '存档已损坏并被安全重置。设置已保留。',
      settings: getState().settings,
    };
  } catch (error) {
    return { ok: false, error, message: '存档恢复失败。' };
  }
}

export function clearSave(storage = getLocalStorage()) {
  try {
    const settings = getState().settings;
    storage.removeItem(SAVE_KEY);
    resetGameState({ keepSettings: true });
    setState({ settings });
    saveSettings(settings, storage);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export function hasSave(storage = getLocalStorage()) {
  try {
    return Boolean(storage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function peekSave(storage = getLocalStorage()) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const migrated = migrateSave(safeParse(raw));
    return migrated.ok ? migrated.data : null;
  } catch {
    return null;
  }
}

export function getContinuePath(state = getState()) {
  if (!state?.caseId) return '/cases';
  if (state.completed) return '/ending';
  if (state.currentLocationId) return '/investigation';
  return '/investigation';
}

export function restartCase(caseId, meta = {}, storage = getLocalStorage()) {
  const id = caseId || getState().caseId;
  if (!id) return { ok: false, reason: 'no-case' };
  startCase(id, meta);
  const saved = saveGame(storage);
  return { ok: saved.ok, data: getState(), error: saved.error };
}

export function readBestRanks(storage = getLocalStorage()) {
  try {
    const raw = storage.getItem(BEST_RANKS_KEY);
    if (!raw) return {};
    const parsed = safeParse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordBestRank(caseId, rank, storage = getLocalStorage()) {
  if (!caseId || !rank) return readBestRanks(storage);
  const order = ['C', 'B', 'A', 'S'];
  const current = readBestRanks(storage);
  const prev = current[caseId];
  if (!prev || order.indexOf(rank) > order.indexOf(prev)) {
    current[caseId] = rank;
    try {
      storage.setItem(BEST_RANKS_KEY, JSON.stringify(current));
    } catch {
      /* ignore quota errors */
    }
  }
  return current;
}
