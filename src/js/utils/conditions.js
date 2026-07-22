/**
 * Evaluate authored unlock conditions against runtime progress.
 * Condition forms:
 * - { flag: 'id' }
 * - { clue: 'id' }
 * - { topic: 'id' }
 * - { timelineSolved: true }
 * - { all: [ ... ] }
 * - { any: [ ... ] }
 * Array of conditions means ALL must pass.
 */

export function evaluateConditions(conditions, context) {
  if (conditions == null || (Array.isArray(conditions) && conditions.length === 0)) {
    return true;
  }

  if (Array.isArray(conditions)) {
    return conditions.every((condition) => evaluateConditions(condition, context));
  }

  if (typeof conditions !== 'object') return false;

  if (conditions.all) return evaluateConditions(conditions.all, context);
  if (conditions.any) {
    return (conditions.any || []).some((condition) => evaluateConditions(condition, context));
  }

  if (conditions.timelineSolved) return Boolean(context.timelineSolved);

  if (conditions.flag) {
    return Boolean(context.flags?.[conditions.flag]);
  }

  if (conditions.clue) {
    return (context.discoveredClueIds || []).includes(conditions.clue);
  }

  if (conditions.topic) {
    return (context.askedTopicIds || []).includes(conditions.topic);
  }

  return false;
}
