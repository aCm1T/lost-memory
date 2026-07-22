import { getState, setState } from '../state/game-state.js';
import { conditionsMet } from './clue-system.js';

export function getTimelineConfig(caseData) {
  return caseData.timeline || { events: [], correctOrder: [] };
}

export function listDiscoveredEvents(caseData, state = getState()) {
  const { events } = getTimelineConfig(caseData);
  return events.filter((event) => conditionsMet(event.unlockConditions, state));
}

export function ensureTimelineOrder(caseData, state = getState()) {
  const discoveredIds = listDiscoveredEvents(caseData, state).map((event) => event.id);
  const existing = state.timelineOrder || [];
  const retained = existing.filter((id) => discoveredIds.includes(id));
  const missing = discoveredIds.filter((id) => !retained.includes(id));
  const next = [...retained, ...missing];

  const same = next.length === existing.length && next.every((id, index) => id === existing[index]);
  if (!same) {
    setState({ timelineOrder: next });
  }
  return next;
}

export function getOrderedTimelineEvents(caseData, state = getState()) {
  const order = ensureTimelineOrder(caseData, state);
  const byId = new Map(listDiscoveredEvents(caseData, state).map((event) => [event.id, event]));
  return order.map((id) => byId.get(id)).filter(Boolean);
}

export function moveTimelineEvent(caseData, eventId, direction) {
  const order = [...ensureTimelineOrder(caseData)];
  const index = order.indexOf(eventId);
  if (index < 0) return { ok: false, reason: 'missing-event' };

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= order.length) {
    return { ok: false, reason: 'out-of-bounds', order };
  }

  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  setState({ timelineOrder: next, timelineSolved: false });
  return { ok: true, order: next };
}

export function setTimelineOrder(order) {
  setState({ timelineOrder: [...order], timelineSolved: false });
  return order;
}

/**
 * Validate player order against authored correctOrder.
 * Requires all timeline events to be discovered.
 */
export function submitTimeline(caseData, state = getState()) {
  const { events, correctOrder } = getTimelineConfig(caseData);
  const discovered = listDiscoveredEvents(caseData, state);
  const order = ensureTimelineOrder(caseData, state);

  if (discovered.length < events.length) {
    return {
      ok: false,
      solved: false,
      reason: 'incomplete',
      message: `仍有未发现的事件（${discovered.length}/${events.length}）。继续调查后再来排序。`,
      discoveredCount: discovered.length,
      totalCount: events.length,
    };
  }

  const expected = correctOrder.filter((id) => order.includes(id));
  const correct =
    expected.length === order.length && expected.every((id, index) => order[index] === id);

  if (!correct) {
    // Count how many positions match prefix for soft feedback without full spoiler.
    let matchingPrefix = 0;
    while (matchingPrefix < order.length && order[matchingPrefix] === expected[matchingPrefix]) {
      matchingPrefix += 1;
    }

    setState({ timelineSolved: false });
    return {
      ok: true,
      solved: false,
      reason: 'incorrect',
      message:
        matchingPrefix === 0
          ? '顺序还不对。试着从最早发生的事重新排列。'
          : `前 ${matchingPrefix} 个事件的相对位置看起来合理，后面仍有错乱。`,
      matchingPrefix,
      expected,
      order,
    };
  }

  setState({ timelineSolved: true, timelineOrder: [...expected] });
  return {
    ok: true,
    solved: true,
    reason: 'correct',
    message: '时间线验证通过。412 号房与后续推理条件已解锁。',
    order: expected,
  };
}

export function isTimelineSolved(state = getState()) {
  return Boolean(state.timelineSolved);
}
