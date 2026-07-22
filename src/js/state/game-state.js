import { DATA_VERSION, DEFAULT_SETTINGS } from '../utils/constants.js';

function createInitialState() {
  return {
    dataVersion: DATA_VERSION,
    caseId: null,
    caseTitle: null,
    view: 'home',
    currentLocationId: null,
    currentCharacterId: null,
    flags: {},
    discoveredClueIds: [],
    pinnedClueIds: [],
    inspectedHotspotIds: [],
    askedTopicIds: [],
    dialogueHistory: [],
    timelineOrder: [],
    timelineSolved: false,
    deductionAttempts: 0,
    endingId: null,
    rank: null,
    settings: { ...DEFAULT_SETTINGS },
    startedAt: null,
    updatedAt: null,
    completed: false,
    caseLoadError: null,
  };
}

const listeners = new Set();
let state = createInitialState();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener(state));
}

export function setState(patch) {
  state = {
    ...state,
    ...patch,
    settings: patch.settings ? { ...state.settings, ...patch.settings } : state.settings,
    updatedAt: new Date().toISOString(),
  };
  notify();
  return state;
}

export function replaceState(nextState) {
  state = {
    ...createInitialState(),
    ...nextState,
    settings: { ...DEFAULT_SETTINGS, ...(nextState.settings || {}) },
  };
  notify();
  return state;
}

export function resetGameState(options = {}) {
  const keepSettings = options.keepSettings !== false;
  const settings = keepSettings ? { ...state.settings } : { ...DEFAULT_SETTINGS };
  state = {
    ...createInitialState(),
    settings,
  };
  notify();
  return state;
}

export function hasActiveSave(snapshot = state) {
  return Boolean(snapshot.caseId && snapshot.startedAt && !snapshot.completed);
}

export function startCase(caseId, meta = {}) {
  return setState({
    caseId,
    caseTitle: meta.titleZh || meta.title || null,
    caseLoadError: null,
    currentLocationId: null,
    currentCharacterId: null,
    startedAt: new Date().toISOString(),
    completed: false,
    flags: {},
    discoveredClueIds: [],
    pinnedClueIds: [],
    inspectedHotspotIds: [],
    askedTopicIds: [],
    dialogueHistory: [],
    timelineOrder: [],
    timelineSolved: false,
    deductionAttempts: 0,
    endingId: null,
    rank: null,
  });
}

export function setCaseLoadError(message) {
  return setState({ caseLoadError: message });
}

export function createInitialStateForTests() {
  return createInitialState();
}
