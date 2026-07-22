import { el } from '../utils/dom.js';
import { navigate } from '../router.js';
import { loadCase, getLoadedCase } from '../systems/case-loader.js';
import { getState } from '../state/game-state.js';
import { getRankLabel } from '../systems/deduction-system.js';
import { getDeductionConfig } from '../systems/deduction-system.js';

function labelOf(options, id) {
  return options.find((option) => option.id === id)?.label || id || '—';
}

export function renderEndingView(root) {
  const state = getState();
  if (!state.caseId) {
    navigate('/cases');
    return;
  }

  const loaded = loadCase(state.caseId);
  if (!loaded.ok) {
    root.append(el('section', { className: 'view panel' }, [el('p', { text: loaded.error })]));
    return;
  }

  const caseData = getLoadedCase(state.caseId);
  if (!state.completed || !state.endingId) {
    root.append(
      el('section', { className: 'view panel' }, [
        el('h1', { text: '尚未结案' }),
        el('p', { text: '请先完成最终推理提交。' }),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn--primary',
            on: { click: () => navigate('/deduction') },
          },
          '前往推理',
        ),
      ]),
    );
    return;
  }

  const ending = caseData.endings.find((item) => item.id === state.endingId);
  const deduction = getDeductionConfig(caseData);
  const last = state.lastDeduction;
  const rank = state.rank || last?.rank || 'C';

  root.append(
    el(
      'section',
      { className: 'view ending-shell', attrs: { 'aria-labelledby': 'ending-title' } },
      [
        el('header', { className: 'ending-hero panel' }, [
          el('p', { className: 'eyebrow', text: 'Case Closed' }),
          el('p', { className: 'ending-rank', text: `评价 ${rank}` }),
          el('h1', { id: 'ending-title', text: getRankLabel(rank) }),
          el('h2', { text: ending?.title || '结案' }),
          el('p', { text: ending?.summary || '' }),
        ]),
        el('section', { className: 'panel ending-breakdown' }, [
          el('h2', { text: '本次推理' }),
          el('dl', { className: 'briefing-facts' }, [
            el('dt', { text: '人物' }),
            el('dd', {
              text: `${labelOf(deduction.personOptions, last?.submission?.personId)} ${last?.personCorrect ? '（正确）' : '（有误）'}`,
            }),
            el('dt', { text: '动机' }),
            el('dd', {
              text: `${labelOf(deduction.motiveOptions, last?.submission?.motiveId)} ${last?.motiveCorrect ? '（正确）' : '（有误）'}`,
            }),
            el('dt', { text: '过程' }),
            el('dd', {
              text: `${labelOf(deduction.methodOptions, last?.submission?.methodId)} ${last?.methodCorrect ? '（正确）' : '（有误）'}`,
            }),
            el('dt', { text: '证据' }),
            el('dd', {
              text: last?.evidence
                ? `命中必选 ${last.evidence.requiredHits}/${last.evidence.requiredTotal} · 覆盖组 ${last.evidence.groupsCovered}/${last.evidence.groupsTotal}`
                : '—',
            }),
            el('dt', { text: '关键矛盾' }),
            el('dd', {
              text: last?.contradictions
                ? `${last.contradictions.found}/${last.contradictions.total}`
                : '—',
            }),
          ]),
        ]),
        el('section', { className: 'panel ending-truth' }, [
          el('h2', { text: '真相对照' }),
          el('ul', { className: 'briefing-stats' }, [
            el('li', {
              text: `责任人：${labelOf(deduction.personOptions, deduction.correct.personId)}`,
            }),
            el('li', {
              text: `动机：${labelOf(deduction.motiveOptions, deduction.correct.motiveId)}`,
            }),
            el('li', {
              text: `过程：${labelOf(deduction.methodOptions, deduction.correct.methodId)}`,
            }),
            el('li', {
              text: `关键证据示例：${deduction.correct.requiredEvidenceIds
                .map((id) => labelOf(deduction.evidenceOptions, id))
                .join('、')}`,
            }),
          ]),
          el('p', {
            className: 'placeholder-note',
            text: '记忆可能不可靠，但物证与时间不会撒谎。',
          }),
        ]),
        el('div', { className: 'btn-row' }, [
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn--primary',
              on: { click: () => navigate('/home') },
            },
            '返回首页',
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn',
              on: { click: () => navigate('/cases') },
            },
            '案件列表',
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn--ghost',
              on: { click: () => navigate('/credits') },
            },
            '制作人员',
          ),
        ]),
      ],
    ),
  );
}
