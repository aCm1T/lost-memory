import { getState, setState } from '../state/game-state.js';
import { recordBestRank } from '../state/save-manager.js';

const RANK_ORDER = ['C', 'B', 'A', 'S'];

export function getDeductionConfig(caseData) {
  return caseData.deduction;
}

export function canAccessDeduction(state = getState()) {
  return Boolean(state.timelineSolved);
}

export function rankAtLeast(rank, minimum) {
  return RANK_ORDER.indexOf(rank) >= RANK_ORDER.indexOf(minimum);
}

export function scoreEvidenceSelection(correct, selectedIds) {
  const selected = new Set(selectedIds || []);
  const required = correct.requiredEvidenceIds || [];
  const groups = correct.acceptedEvidenceGroups || [];

  const requiredHits = required.filter((id) => selected.has(id)).length;
  const groupsCovered = groups.filter((group) => group.some((id) => selected.has(id))).length;

  const evidenceStrong =
    (required.length > 0 && requiredHits === required.length) ||
    (groups.length > 0 && groupsCovered === groups.length);

  const evidencePartial =
    requiredHits >= Math.min(2, required.length) ||
    groupsCovered >= Math.min(2, groups.length || 2);

  return {
    requiredHits,
    requiredTotal: required.length,
    groupsCovered,
    groupsTotal: groups.length,
    evidenceStrong,
    evidencePartial,
  };
}

export function countContradictionFlags(scoring, state = getState()) {
  const needed = scoring?.requiredContradictionFlags || [];
  const found = needed.filter((flagId) => Boolean(state.flags?.[flagId]));
  return {
    found: found.length,
    total: needed.length,
    complete: needed.length > 0 && found.length === needed.length,
    flags: found,
  };
}

/**
 * Pure scoring helper (does not mutate state).
 */
export function evaluateDeduction(caseData, submission, state = getState()) {
  const deduction = getDeductionConfig(caseData);
  const correct = deduction.correct;
  const scoring = deduction.scoring || {};

  const personCorrect = submission.personId === correct.personId;
  const motiveCorrect = submission.motiveId === correct.motiveId;
  const methodCorrect = submission.methodId === correct.methodId;
  const evidence = scoreEvidenceSelection(correct, submission.evidenceIds || []);
  const contradictions = countContradictionFlags(scoring, state);

  const wrongAttempts = Number(state.deductionWrongAttempts) || 0;
  const maxWrongForS = Number(scoring.maxWrongSubmitsForS ?? 1);

  let rank = 'C';
  if (!personCorrect) {
    rank = 'C';
  } else if (
    motiveCorrect &&
    methodCorrect &&
    evidence.evidenceStrong &&
    contradictions.complete &&
    wrongAttempts <= maxWrongForS
  ) {
    rank = 'S';
  } else if (
    motiveCorrect &&
    methodCorrect &&
    (evidence.evidenceStrong || evidence.evidencePartial)
  ) {
    rank = 'A';
  } else if (methodCorrect || motiveCorrect) {
    rank = 'B';
  } else {
    rank = 'C';
  }

  const labels = {
    S: '洞察真相',
    A: '优秀侦探',
    B: '案件解决',
    C: '勉强结案',
  };

  return {
    personCorrect,
    motiveCorrect,
    methodCorrect,
    evidence,
    contradictions,
    rank,
    rankLabel: labels[rank],
    wrongAttempts,
    submission,
    correct,
  };
}

export function selectEnding(caseData, evaluation) {
  const endings = caseData.endings || [];
  const personCorrect = evaluation.personCorrect;
  const rank = evaluation.rank;

  if (!personCorrect) {
    return endings.find((ending) => ending.conditions?.personCorrect === false) || endings.at(-1);
  }

  const byMinRank = endings.find(
    (ending) =>
      ending.conditions?.minRank &&
      !('personCorrect' in (ending.conditions || {})) &&
      rankAtLeast(rank, ending.conditions.minRank),
  );
  if (byMinRank) return byMinRank;

  const partial = endings.find(
    (ending) =>
      ending.conditions?.personCorrect === true &&
      (!ending.conditions.minRank || rankAtLeast(rank, ending.conditions.minRank)),
  );
  if (partial) return partial;

  return endings[0] || null;
}

/**
 * Apply a confirmed deduction submission to game state.
 * Returns feedback; may complete the case or keep it open for retry.
 */
export function submitDeduction(caseData, submission) {
  const state = getState();
  if (!canAccessDeduction(state)) {
    return { ok: false, reason: 'timeline-locked', message: '请先完成时间线验证。' };
  }

  if (!submission?.personId || !submission?.motiveId || !submission?.methodId) {
    return { ok: false, reason: 'incomplete-form', message: '请选择人物、动机与事件过程。' };
  }

  if (!Array.isArray(submission.evidenceIds) || submission.evidenceIds.length < 1) {
    return { ok: false, reason: 'no-evidence', message: '请至少选择一条关键证据。' };
  }

  const evaluation = evaluateDeduction(caseData, submission, state);

  // Retry path: wrong person, or person right but both motive & method wrong
  const shouldRetry =
    !evaluation.personCorrect || (!evaluation.motiveCorrect && !evaluation.methodCorrect);

  const attempts = (Number(state.deductionAttempts) || 0) + 1;
  const wrongAttempts = shouldRetry
    ? (Number(state.deductionWrongAttempts) || 0) + 1
    : Number(state.deductionWrongAttempts) || 0;

  if (shouldRetry && wrongAttempts < 5) {
    const message = buildRetryMessage(evaluation);
    setState({
      deductionAttempts: attempts,
      deductionWrongAttempts: wrongAttempts,
      lastDeduction: {
        ...evaluation,
        endingId: null,
        message,
        at: new Date().toISOString(),
      },
    });

    return {
      ok: true,
      completed: false,
      retry: true,
      evaluation,
      message,
      attempts,
      wrongAttempts,
    };
  }

  // Re-evaluate with updated wrongAttempts for final rank fairness on forced finish
  const finalState = {
    ...getState(),
    deductionWrongAttempts: wrongAttempts,
  };
  const finalEvaluation = evaluateDeduction(caseData, submission, finalState);
  const finalEnding = selectEnding(caseData, finalEvaluation);

  setState({
    deductionAttempts: attempts,
    deductionWrongAttempts: wrongAttempts,
    rank: finalEvaluation.rank,
    endingId: finalEnding?.id || null,
    completed: true,
    lastDeduction: {
      ...finalEvaluation,
      endingId: finalEnding?.id || null,
      message: '推理已提交。',
      at: new Date().toISOString(),
    },
  });

  if (getState().caseId && finalEvaluation.rank) {
    recordBestRank(getState().caseId, finalEvaluation.rank);
  }

  return {
    ok: true,
    completed: true,
    retry: false,
    evaluation: finalEvaluation,
    ending: finalEnding,
    message: '推理已提交。',
    attempts,
    wrongAttempts,
  };
}

function buildRetryMessage(evaluation) {
  if (!evaluation.personCorrect) {
    return '主要责任人判断似乎有偏差。再核对证词与关键时间记录。';
  }
  if (!evaluation.motiveCorrect && !evaluation.methodCorrect) {
    return '人物方向大致正确，但动机与过程仍对不上关键物证。';
  }
  return '推理还不完整，请调整后再提交。';
}

export function getRankLabel(rank) {
  return (
    {
      S: '洞察真相',
      A: '优秀侦探',
      B: '案件解决',
      C: '勉强结案',
    }[rank] || rank
  );
}
