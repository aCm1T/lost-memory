import { hasActiveSave } from '../state/game-state.js';

const DEFAULT_MESSAGE = '已有进行中的调查进度，开始新游戏将清空当前进度。确定继续吗？';

/** Pure check used by UI before calling startCase. */
export function needsNewCaseConfirmation(snapshot) {
  return hasActiveSave(snapshot);
}

/**
 * Ask the player before wiping an in-progress save.
 * Returns true when it is safe to call startCase.
 */
export function confirmNewCaseStart(snapshot, message = DEFAULT_MESSAGE) {
  if (!needsNewCaseConfirmation(snapshot)) return true;
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
    return false;
  }
  return window.confirm(message);
}
