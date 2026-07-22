import { getState, setState } from '../state/game-state.js';
import { conditionsMet, discoverClues, setFlags } from './clue-system.js';

export function getLocationById(caseData, locationId) {
  return caseData.locations.find((location) => location.id === locationId) || null;
}

export function listLocations(caseData, state = getState()) {
  return caseData.locations.map((location) => ({
    location,
    unlocked: conditionsMet(location.unlockConditions, state),
    inspectedCount: location.hotspots.filter((hotspot) =>
      (state.inspectedHotspotIds || []).includes(hotspot.id),
    ).length,
    availableHotspots: location.hotspots.filter(
      (hotspot) =>
        conditionsMet(location.unlockConditions, state) &&
        conditionsMet(hotspot.unlockConditions, state),
    ).length,
  }));
}

export function listVisibleHotspots(location, state = getState()) {
  if (!location) return [];
  if (!conditionsMet(location.unlockConditions, state)) return [];

  return location.hotspots.map((hotspot) => {
    const unlocked = conditionsMet(hotspot.unlockConditions, state);
    const inspected = (state.inspectedHotspotIds || []).includes(hotspot.id);
    return { hotspot, unlocked, inspected };
  });
}

export function selectLocation(locationId) {
  return setState({ currentLocationId: locationId });
}

/**
 * Inspect a hotspot. Awards clues/flags once; returns narrative payload.
 */
export function inspectHotspot(caseData, locationId, hotspotId) {
  const location = getLocationById(caseData, locationId);
  if (!location) {
    return { ok: false, reason: 'missing-location' };
  }
  if (!conditionsMet(location.unlockConditions)) {
    return { ok: false, reason: 'location-locked' };
  }

  const hotspot = location.hotspots.find((item) => item.id === hotspotId);
  if (!hotspot) {
    return { ok: false, reason: 'missing-hotspot' };
  }
  if (!conditionsMet(hotspot.unlockConditions)) {
    return { ok: false, reason: 'hotspot-locked' };
  }

  const state = getState();
  const already = (state.inspectedHotspotIds || []).includes(hotspotId);
  const inspectedHotspotIds = already
    ? state.inspectedHotspotIds
    : [...state.inspectedHotspotIds, hotspotId];

  if (!already) {
    setState({ inspectedHotspotIds, currentLocationId: locationId });
  } else {
    setState({ currentLocationId: locationId });
  }

  const clueResult = discoverClues(hotspot.revealsClues || [], caseData);
  setFlags(hotspot.setsFlags || []);

  return {
    ok: true,
    alreadyInspected: already,
    hotspot,
    location,
    newlyDiscovered: clueResult.newlyDiscovered,
    clues: clueResult.clues,
    description: hotspot.description || hotspot.label,
  };
}

export function getInvestigationProgress(caseData, state = getState()) {
  const allHotspots = caseData.locations.flatMap((location) => location.hotspots);
  const unlockedHotspots = caseData.locations.flatMap((location) => {
    if (!conditionsMet(location.unlockConditions, state)) return [];
    return location.hotspots.filter((hotspot) => conditionsMet(hotspot.unlockConditions, state));
  });

  return {
    clueCount: state.discoveredClueIds.length,
    clueTotal: caseData.clues.length,
    hotspotInspected: state.inspectedHotspotIds.length,
    hotspotUnlocked: unlockedHotspots.length,
    hotspotTotal: allHotspots.length,
    topicsAsked: state.askedTopicIds.length,
    locationUnlocked: listLocations(caseData, state).filter((item) => item.unlocked).length,
    locationTotal: caseData.locations.length,
  };
}
