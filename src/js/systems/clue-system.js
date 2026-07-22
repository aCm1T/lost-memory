import { getState, setState } from '../state/game-state.js';
import { evaluateConditions } from '../utils/conditions.js';

export function getProgressContext(state = getState()) {
  return {
    flags: state.flags || {},
    discoveredClueIds: state.discoveredClueIds || [],
    askedTopicIds: state.askedTopicIds || [],
    timelineSolved: Boolean(state.timelineSolved),
  };
}

export function discoverClues(clueIds, caseData) {
  if (!clueIds?.length) {
    return { newlyDiscovered: [], clues: [] };
  }

  const state = getState();
  const known = new Set(state.discoveredClueIds);
  const newlyDiscovered = [];

  for (const clueId of clueIds) {
    if (!known.has(clueId)) {
      known.add(clueId);
      newlyDiscovered.push(clueId);
    }
  }

  if (newlyDiscovered.length) {
    setState({ discoveredClueIds: [...known] });
  }

  const clues = newlyDiscovered
    .map((id) => caseData.clues.find((clue) => clue.id === id))
    .filter(Boolean);

  return { newlyDiscovered, clues };
}

export function setFlags(flagIds) {
  if (!flagIds?.length) return getState().flags;
  const flags = { ...getState().flags };
  let changed = false;
  for (const flagId of flagIds) {
    if (!flags[flagId]) {
      flags[flagId] = true;
      changed = true;
    }
  }
  if (changed) setState({ flags });
  return flags;
}

export function getClueById(caseData, clueId) {
  return caseData.clues.find((clue) => clue.id === clueId) || null;
}

export function getDiscoveredClues(caseData, state = getState()) {
  return (state.discoveredClueIds || []).map((id) => getClueById(caseData, id)).filter(Boolean);
}

export function isClueDiscovered(clueId, state = getState()) {
  return (state.discoveredClueIds || []).includes(clueId);
}

export function pinClue(clueId) {
  const pinned = new Set(getState().pinnedClueIds || []);
  if (pinned.has(clueId)) pinned.delete(clueId);
  else pinned.add(clueId);
  setState({ pinnedClueIds: [...pinned] });
  return [...pinned];
}

export function filterClues(clues, { type = 'all', pinnedOnly = false, pinnedIds = [] } = {}) {
  return clues.filter((clue) => {
    if (type !== 'all' && clue.type !== type) return false;
    if (pinnedOnly && !pinnedIds.includes(clue.id)) return false;
    return true;
  });
}

export function conditionsMet(conditions, state = getState()) {
  return evaluateConditions(conditions, getProgressContext(state));
}
