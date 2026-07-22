import caseIndex from '../../data/case-index.json';
import { assetUrl } from '../utils/dom.js';

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
