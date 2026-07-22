import caseIndex from '../../data/case-index.json';
import case001 from '../../data/cases/case-001.json';
import { assetUrl } from '../utils/dom.js';
import { assertCaseValid, validateCaseData } from '../utils/validation.js';

const caseModules = {
  'case-001': case001,
};

const cache = new Map();

export function getCaseIndex() {
  return caseIndex;
}

export function getCaseSummary(caseId) {
  return caseIndex.find((item) => item.id === caseId) || null;
}

export function resolveCaseCoverUrl(caseSummary) {
  if (!caseSummary?.coverImage) return '';
  return assetUrl(caseSummary.coverImage);
}

export function listRegisteredCaseIds() {
  return Object.keys(caseModules);
}

/**
 * Load and validate a full case definition.
 * @param {string} caseId
 * @param {{ strict?: boolean }} [options]
 */
export function loadCase(caseId, options = {}) {
  const strict = options.strict !== false;

  if (cache.has(caseId)) {
    return { ok: true, data: cache.get(caseId), cached: true };
  }

  const raw = caseModules[caseId];
  if (!raw) {
    return { ok: false, error: `Unknown case id: ${caseId}` };
  }

  const summary = getCaseSummary(caseId);
  if (!summary) {
    return { ok: false, error: `Case ${caseId} is not registered in case-index.json` };
  }

  const validation = validateCaseData(raw);
  if (!validation.ok) {
    if (strict) {
      try {
        assertCaseValid(raw);
      } catch (error) {
        return { ok: false, error: error.message, validation };
      }
    }
    return { ok: false, error: validation.errors.join('\n'), validation };
  }

  cache.set(caseId, raw);
  return { ok: true, data: raw, validation, cached: false };
}

export function getLoadedCase(caseId) {
  if (cache.has(caseId)) return cache.get(caseId);
  const result = loadCase(caseId);
  return result.ok ? result.data : null;
}

export function clearCaseCache() {
  cache.clear();
}

export { validateCaseData };
