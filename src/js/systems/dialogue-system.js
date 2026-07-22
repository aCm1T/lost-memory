import { getState, setState } from '../state/game-state.js';
import { conditionsMet, discoverClues, setFlags } from './clue-system.js';

export function getCharacterById(caseData, characterId) {
  return caseData.characters.find((character) => character.id === characterId) || null;
}

export function getDialogueForCharacter(caseData, characterId) {
  return caseData.dialogues.find((entry) => entry.characterId === characterId) || null;
}

export function listInterviewableCharacters(caseData, state = getState()) {
  return caseData.characters
    .filter((character) => character.interviewable)
    .map((character) => {
      const dialogue = getDialogueForCharacter(caseData, character.id);
      const topics = dialogue?.topics || [];
      const available = topics.filter((topic) => conditionsMet(topic.unlockConditions, state));
      const asked = topics.filter((topic) => (state.askedTopicIds || []).includes(topic.id));
      const newlyUnlocked = available.filter(
        (topic) =>
          !(state.askedTopicIds || []).includes(topic.id) &&
          (topic.unlockConditions || []).length > 0,
      );
      return {
        character,
        topicTotal: topics.length,
        availableCount: available.length,
        askedCount: asked.length,
        newCount: newlyUnlocked.length,
      };
    });
}

export function listTopicsForCharacter(caseData, characterId, state = getState()) {
  const dialogue = getDialogueForCharacter(caseData, characterId);
  if (!dialogue) return [];

  return dialogue.topics.map((topic) => {
    const unlocked = conditionsMet(topic.unlockConditions, state);
    const asked = (state.askedTopicIds || []).includes(topic.id);
    const isNew =
      unlocked &&
      !asked &&
      Array.isArray(topic.unlockConditions) &&
      topic.unlockConditions.length > 0;
    return { topic, unlocked, asked, isNew };
  });
}

/**
 * Ask a topic; records history and applies reveals once.
 */
export function askTopic(caseData, characterId, topicId) {
  const character = getCharacterById(caseData, characterId);
  if (!character?.interviewable) {
    return { ok: false, reason: 'not-interviewable' };
  }

  const dialogue = getDialogueForCharacter(caseData, characterId);
  const topic = dialogue?.topics.find((item) => item.id === topicId);
  if (!topic) return { ok: false, reason: 'missing-topic' };
  if (!conditionsMet(topic.unlockConditions)) {
    return { ok: false, reason: 'topic-locked' };
  }

  const state = getState();
  const alreadyAsked = (state.askedTopicIds || []).includes(topicId);
  const askedTopicIds = alreadyAsked ? state.askedTopicIds : [...state.askedTopicIds, topicId];

  const historyEntry = {
    id: `${topicId}-${Date.now()}`,
    characterId,
    topicId,
    question: topic.question,
    answer: topic.answer,
    at: new Date().toISOString(),
  };

  const dialogueHistory = [...(state.dialogueHistory || []), historyEntry];

  setState({
    askedTopicIds,
    dialogueHistory,
    currentCharacterId: characterId,
  });

  const clueResult = alreadyAsked
    ? { newlyDiscovered: [], clues: [] }
    : discoverClues(topic.revealsClues || [], caseData);

  if (!alreadyAsked) {
    setFlags(topic.setsFlags || []);
  }

  return {
    ok: true,
    alreadyAsked,
    character,
    topic,
    newlyDiscovered: clueResult.newlyDiscovered,
    clues: clueResult.clues,
    historyEntry,
  };
}

export function getDialogueHistoryForCharacter(characterId, state = getState()) {
  return (state.dialogueHistory || []).filter((entry) => entry.characterId === characterId);
}
