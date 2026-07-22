import { getState, setState } from '../state/game-state.js';
import { getClueById, isClueDiscovered, setFlags } from './clue-system.js';

const RESULT_LABELS = {
  contradiction: '存在矛盾',
  corroboration: '相互印证',
  inference: '解锁新推论',
  none: '暂无明显关联',
};

export function getResultLabel(result) {
  return RESULT_LABELS[result] || result;
}

export function normalizePair(clueIdA, clueIdB) {
  return [clueIdA, clueIdB].sort();
}

export function findEvidenceLink(caseData, clueIdA, clueIdB) {
  if (!clueIdA || !clueIdB || clueIdA === clueIdB) return null;
  const [a, b] = normalizePair(clueIdA, clueIdB);
  return (
    (caseData.evidenceLinks || []).find((link) => {
      if (!Array.isArray(link.clueIds) || link.clueIds.length < 2) return false;
      const sorted = [...link.clueIds].sort();
      return sorted[0] === a && sorted[1] === b;
    }) || null
  );
}

/**
 * Compare two discovered clues using authored link rules.
 */
export function compareEvidence(caseData, clueIdA, clueIdB) {
  if (!isClueDiscovered(clueIdA) || !isClueDiscovered(clueIdB)) {
    return { ok: false, reason: 'clue-not-discovered' };
  }
  if (clueIdA === clueIdB) {
    return { ok: false, reason: 'same-clue' };
  }

  const link = findEvidenceLink(caseData, clueIdA, clueIdB);
  const clueA = getClueById(caseData, clueIdA);
  const clueB = getClueById(caseData, clueIdB);

  if (!link) {
    return {
      ok: true,
      matched: false,
      result: 'none',
      resultLabel: getResultLabel('none'),
      message: '这两条线索暂时看不出直接关联。或许还缺少中间环节。',
      clueA,
      clueB,
      newlyResolved: false,
      setsFlags: [],
    };
  }

  const state = getState();
  const resolved = new Set(state.resolvedLinkIds || []);
  const newlyResolved = !resolved.has(link.id);
  if (newlyResolved) {
    resolved.add(link.id);
    setState({ resolvedLinkIds: [...resolved] });
  }

  if (link.setsFlags?.length) {
    setFlags(link.setsFlags);
  }

  return {
    ok: true,
    matched: true,
    link,
    result: link.result,
    resultLabel: getResultLabel(link.result),
    message: link.message,
    clueA,
    clueB,
    newlyResolved,
    setsFlags: link.setsFlags || [],
  };
}

export function listResolvedLinks(caseData, state = getState()) {
  const resolved = new Set(state.resolvedLinkIds || []);
  return (caseData.evidenceLinks || []).filter((link) => resolved.has(link.id));
}

export function countDiscoverableLinks(caseData, state = getState()) {
  const discovered = new Set(state.discoveredClueIds || []);
  return (caseData.evidenceLinks || []).filter((link) =>
    (link.clueIds || []).every((id) => discovered.has(id)),
  ).length;
}
