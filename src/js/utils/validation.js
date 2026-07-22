/**
 * Case data validation for Lost Memory.
 * Pure functions — safe for Vitest and Node scripts.
 */

function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function addError(errors, message) {
  errors.push(message);
}

function uniqueCheck(errors, items, key, label) {
  const seen = new Set();
  for (const item of items) {
    const id = item?.[key];
    if (!id) {
      addError(errors, `${label} missing ${key}`);
      continue;
    }
    if (seen.has(id)) addError(errors, `Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
  return seen;
}

function collectConditionRefs(condition, refs) {
  if (condition == null) return;
  if (Array.isArray(condition)) {
    condition.forEach((entry) => collectConditionRefs(entry, refs));
    return;
  }
  if (!isObject(condition)) return;

  if (condition.flag) refs.flags.add(condition.flag);
  if (condition.clue) refs.clues.add(condition.clue);
  if (condition.topic) refs.topics.add(condition.topic);
  if (condition.all) collectConditionRefs(condition.all, refs);
  if (condition.any) collectConditionRefs(condition.any, refs);
}

function validateConditions(errors, conditions, ctx, known) {
  if (conditions == null) return;
  if (!Array.isArray(conditions)) {
    addError(errors, `${ctx}: unlockConditions must be an array`);
    return;
  }

  const refs = { flags: new Set(), clues: new Set(), topics: new Set() };
  collectConditionRefs(conditions, refs);

  for (const flag of refs.flags) {
    if (!known.flags.has(flag)) addError(errors, `${ctx}: unknown flag "${flag}"`);
  }
  for (const clue of refs.clues) {
    if (!known.clues.has(clue)) addError(errors, `${ctx}: unknown clue "${clue}"`);
  }
  for (const topic of refs.topics) {
    if (!known.topics.has(topic)) addError(errors, `${ctx}: unknown topic "${topic}"`);
  }
}

/**
 * @param {object} caseData
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateCaseData(caseData) {
  const errors = [];
  const warnings = [];

  if (!isObject(caseData)) {
    return { ok: false, errors: ['Case data must be an object'], warnings };
  }

  for (const field of [
    'id',
    'title',
    'titleZh',
    'summary',
    'briefing',
    'characters',
    'locations',
    'clues',
    'dialogues',
    'evidenceLinks',
    'timeline',
    'deduction',
    'endings',
  ]) {
    if (caseData[field] == null) addError(errors, `Missing required field: ${field}`);
  }

  if (errors.length) return { ok: false, errors, warnings };

  if (!isObject(caseData.briefing)) addError(errors, 'briefing must be an object');
  else {
    for (const field of ['background', 'time', 'place', 'victim', 'objectives']) {
      if (caseData.briefing[field] == null) addError(errors, `briefing missing ${field}`);
    }
    if (!Array.isArray(caseData.briefing.objectives) || caseData.briefing.objectives.length < 1) {
      addError(errors, 'briefing.objectives must be a non-empty array');
    }
  }

  if (!Array.isArray(caseData.characters) || caseData.characters.length < 4) {
    addError(errors, 'characters must contain at least 4 entries');
  }
  if (!Array.isArray(caseData.locations) || caseData.locations.length < 3) {
    addError(errors, 'locations must contain at least 3 entries');
  }
  if (!Array.isArray(caseData.clues) || caseData.clues.length < 10) {
    addError(errors, 'clues must contain at least 10 entries');
  }
  if (!Array.isArray(caseData.dialogues)) addError(errors, 'dialogues must be an array');
  if (!Array.isArray(caseData.evidenceLinks)) addError(errors, 'evidenceLinks must be an array');
  if (!Array.isArray(caseData.endings) || caseData.endings.length < 2) {
    addError(errors, 'endings must contain at least 2 entries');
  }

  const characterIds = uniqueCheck(errors, caseData.characters || [], 'id', 'character');
  const locationIds = uniqueCheck(errors, caseData.locations || [], 'id', 'location');
  const clueIds = uniqueCheck(errors, caseData.clues || [], 'id', 'clue');
  const endingIds = uniqueCheck(errors, caseData.endings || [], 'id', 'ending');
  const flagIds = uniqueCheck(errors, caseData.flags || [], 'id', 'flag');

  const hotspotIds = new Set();
  for (const location of caseData.locations || []) {
    if (!Array.isArray(location.hotspots)) {
      addError(errors, `location ${location.id} missing hotspots array`);
      continue;
    }
    for (const hotspot of location.hotspots) {
      if (!hotspot?.id) {
        addError(errors, `location ${location.id} has hotspot without id`);
        continue;
      }
      if (hotspotIds.has(hotspot.id)) addError(errors, `Duplicate hotspot id: ${hotspot.id}`);
      hotspotIds.add(hotspot.id);
    }
  }

  const topicIds = new Set();
  let topicCount = 0;
  for (const dialogue of caseData.dialogues || []) {
    if (!characterIds.has(dialogue.characterId)) {
      addError(errors, `dialogue references unknown character: ${dialogue.characterId}`);
    }
    if (!Array.isArray(dialogue.topics)) {
      addError(errors, `dialogue for ${dialogue.characterId} missing topics`);
      continue;
    }
    for (const topic of dialogue.topics) {
      topicCount += 1;
      if (!topic?.id) {
        addError(errors, `topic missing id under ${dialogue.characterId}`);
        continue;
      }
      if (topicIds.has(topic.id)) addError(errors, `Duplicate topic id: ${topic.id}`);
      topicIds.add(topic.id);
      if (!topic.question || !topic.answer) {
        addError(errors, `topic ${topic.id} needs question and answer`);
      }
    }
  }

  if (topicCount < 15)
    addError(errors, `Expected at least 15 dialogue topics, found ${topicCount}`);

  const known = { flags: flagIds, clues: clueIds, topics: topicIds };

  for (const location of caseData.locations || []) {
    validateConditions(errors, location.unlockConditions, `location ${location.id}`, known);
    for (const hotspot of location.hotspots || []) {
      validateConditions(errors, hotspot.unlockConditions, `hotspot ${hotspot.id}`, known);
      for (const clueId of hotspot.revealsClues || []) {
        if (!clueIds.has(clueId)) {
          addError(errors, `hotspot ${hotspot.id} reveals unknown clue ${clueId}`);
        }
      }
      for (const flagId of hotspot.setsFlags || []) {
        if (!flagIds.has(flagId)) {
          addError(errors, `hotspot ${hotspot.id} sets unknown flag ${flagId}`);
        }
      }
    }
  }

  for (const dialogue of caseData.dialogues || []) {
    for (const topic of dialogue.topics || []) {
      validateConditions(errors, topic.unlockConditions, `topic ${topic.id}`, known);
      for (const clueId of topic.revealsClues || []) {
        if (!clueIds.has(clueId)) {
          addError(errors, `topic ${topic.id} reveals unknown clue ${clueId}`);
        }
      }
      for (const flagId of topic.setsFlags || []) {
        if (!flagIds.has(flagId)) {
          // Allow incidental flags not predeclared? Prefer declaring.
          addError(errors, `topic ${topic.id} sets unknown flag ${flagId}`);
        }
      }
    }
  }

  for (const clue of caseData.clues || []) {
    for (const characterId of clue.relatedCharacterIds || []) {
      if (!characterIds.has(characterId)) {
        addError(errors, `clue ${clue.id} relatedCharacterIds unknown: ${characterId}`);
      }
    }
    for (const locationId of clue.relatedLocationIds || []) {
      if (!locationIds.has(locationId)) {
        addError(errors, `clue ${clue.id} relatedLocationIds unknown: ${locationId}`);
      }
    }
  }

  for (const link of caseData.evidenceLinks || []) {
    if (!link?.id) addError(errors, 'evidence link missing id');
    if (!Array.isArray(link.clueIds) || link.clueIds.length < 2) {
      addError(errors, `evidence link ${link?.id || '?'} needs at least 2 clueIds`);
    } else {
      for (const clueId of link.clueIds) {
        if (!clueIds.has(clueId)) {
          addError(errors, `evidence link ${link.id} references unknown clue ${clueId}`);
        }
      }
    }
    for (const flagId of link.setsFlags || []) {
      if (!flagIds.has(flagId)) {
        addError(errors, `evidence link ${link.id} sets unknown flag ${flagId}`);
      }
    }
  }

  const timeline = caseData.timeline;
  if (
    !isObject(timeline) ||
    !Array.isArray(timeline.events) ||
    !Array.isArray(timeline.correctOrder)
  ) {
    addError(errors, 'timeline must include events[] and correctOrder[]');
  } else {
    const eventIds = uniqueCheck(errors, timeline.events, 'id', 'timeline event');
    for (const event of timeline.events) {
      validateConditions(errors, event.unlockConditions, `event ${event.id}`, known);
    }
    for (const eventId of timeline.correctOrder) {
      if (!eventIds.has(eventId)) {
        addError(errors, `timeline.correctOrder unknown event ${eventId}`);
      }
    }
    if (timeline.correctOrder.length !== timeline.events.length) {
      addError(errors, 'timeline.correctOrder length must match events length');
    }
  }

  const deduction = caseData.deduction;
  if (!isObject(deduction) || !isObject(deduction.correct)) {
    addError(errors, 'deduction.correct is required');
  } else {
    const { personId, motiveId, methodId, requiredEvidenceIds } = deduction.correct;
    const personOk = (deduction.personOptions || []).some((o) => o.id === personId);
    const motiveOk = (deduction.motiveOptions || []).some((o) => o.id === motiveId);
    const methodOk = (deduction.methodOptions || []).some((o) => o.id === methodId);
    if (!personOk) addError(errors, `deduction.correct.personId not in personOptions: ${personId}`);
    if (!motiveOk) addError(errors, `deduction.correct.motiveId not in motiveOptions: ${motiveId}`);
    if (!methodOk) addError(errors, `deduction.correct.methodId not in methodOptions: ${methodId}`);
    if (!characterIds.has(personId)) {
      addError(errors, `deduction.correct.personId unknown character: ${personId}`);
    }
    if (!Array.isArray(requiredEvidenceIds) || requiredEvidenceIds.length < 1) {
      addError(errors, 'deduction.correct.requiredEvidenceIds must be non-empty');
    } else {
      for (const clueId of requiredEvidenceIds) {
        if (!clueIds.has(clueId)) {
          addError(errors, `deduction required evidence unknown: ${clueId}`);
        }
      }
    }
  }

  for (const ending of caseData.endings || []) {
    if (!ending.title || !ending.summary) {
      addError(errors, `ending ${ending.id} needs title and summary`);
    }
  }

  // Reachability soft checks
  const initiallyOpenLocations = (caseData.locations || []).filter(
    (location) => !location.unlockConditions || location.unlockConditions.length === 0,
  );
  if (initiallyOpenLocations.length < 1) {
    addError(errors, 'At least one location must be unlocked by default');
  }

  const interviewable = (caseData.characters || []).filter((c) => c.interviewable);
  if (interviewable.length < 4) {
    addError(errors, 'At least 4 interviewable characters required');
  }

  if (!endingIds.size) {
    /* already errored */
  }

  if (caseData.briefing?.victim?.id && !characterIds.has(caseData.briefing.victim.id)) {
    addError(errors, `briefing.victim.id unknown: ${caseData.briefing.victim.id}`);
  }

  // Undeclared incidental flags used in topics
  if (!flagIds.has('flag_zhou_alibi_claimed') && topicIds.has('topic-zhou-alibi')) {
    // topic sets this flag — must be declared
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertCaseValid(caseData) {
  const result = validateCaseData(caseData);
  if (!result.ok) {
    const message = result.errors.join('\n');
    throw new Error(`Invalid case data:\n${message}`);
  }
  return result;
}
