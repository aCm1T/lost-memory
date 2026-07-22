import { el, clear } from '../utils/dom.js';
import { navigate } from '../router.js';
import { loadCase, getLoadedCase } from '../systems/case-loader.js';
import { getState } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { renderGameNav } from '../components/game-nav.js';
import { playSfx } from '../systems/audio-system.js';
import {
  canAccessDeduction,
  getDeductionConfig,
  submitDeduction,
} from '../systems/deduction-system.js';

function ensureCase(root) {
  const state = getState();
  if (!state.caseId) {
    navigate('/cases');
    return null;
  }
  const loaded = loadCase(state.caseId);
  if (!loaded.ok) {
    root.append(el('section', { className: 'view panel' }, [el('p', { text: loaded.error })]));
    return null;
  }
  return getLoadedCase(state.caseId);
}

function optionButton(option, selectedId, onSelect, { disabled = false } = {}) {
  return el(
    'button',
    {
      type: 'button',
      className: `choice-btn${selectedId === option.id ? ' is-selected' : ''}`,
      disabled,
      attrs: {
        'aria-pressed': String(selectedId === option.id),
      },
      on: {
        click: () => onSelect(option.id),
      },
    },
    option.label,
  );
}

export function renderDeductionView(root) {
  const caseData = ensureCase(root);
  if (!caseData) return;

  const state = getState();
  if (state.completed && state.endingId) {
    navigate('/ending');
    return;
  }

  const deduction = getDeductionConfig(caseData);
  const unlocked = canAccessDeduction(state);
  const discovered = new Set(state.discoveredClueIds || []);

  const shell = el('section', {
    className: 'view deduction-shell',
    attrs: { 'aria-labelledby': 'deduction-title' },
  });
  root.append(shell);

  let personId = null;
  let motiveId = null;
  let methodId = null;
  let evidenceIds = [];
  let feedback = getState().lastDeduction?.message || null;

  const paint = () => {
    clear(shell);

    const evidenceOptions = (deduction.evidenceOptions || []).map((option) => {
      const owned = discovered.has(option.id);
      const checked = evidenceIds.includes(option.id);
      return el('label', { className: `evidence-option${owned ? '' : ' is-disabled'}` }, [
        el('input', {
          type: 'checkbox',
          checked,
          disabled: !owned || !unlocked,
          attrs: {
            value: option.id,
            'aria-label': option.label,
          },
          on: {
            change: (event) => {
              if (event.target.checked) {
                evidenceIds = [...new Set([...evidenceIds, option.id])];
              } else {
                evidenceIds = evidenceIds.filter((id) => id !== option.id);
              }
              paint();
            },
          },
        }),
        el('span', {
          text: owned ? option.label : `${option.label}（未发现）`,
        }),
      ]);
    });

    shell.append(
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Final Deduction' }),
        el('h1', { id: 'deduction-title', text: '最终推理' }),
        el('p', {
          text: unlocked
            ? '选择主要责任人、动机、事件过程与关键证据，确认后提交。'
            : '时间线尚未验证。请先完成时间线分析，再提交最终推理。',
        }),
      ]),
      !unlocked
        ? el('div', { className: 'panel lock-banner' }, [
            el('p', { text: '推理提交已锁定。' }),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn--primary',
                on: { click: () => navigate('/timeline') },
              },
              '前往时间线',
            ),
          ])
        : null,
      el(
        'form',
        {
          className: 'deduction-form',
          on: {
            submit: (event) => event.preventDefault(),
          },
        },
        [
          el('fieldset', { className: 'deduction-fieldset', disabled: !unlocked }, [
            el('legend', { text: '1. 主要责任人 / 真相核心人物' }),
            el(
              'div',
              { className: 'choice-grid' },
              deduction.personOptions.map((option) =>
                optionButton(option, personId, (id) => {
                  personId = id;
                  paint();
                }),
              ),
            ),
          ]),
          el('fieldset', { className: 'deduction-fieldset', disabled: !unlocked }, [
            el('legend', { text: '2. 动机或原因' }),
            el(
              'div',
              { className: 'choice-grid' },
              deduction.motiveOptions.map((option) =>
                optionButton(option, motiveId, (id) => {
                  motiveId = id;
                  paint();
                }),
              ),
            ),
          ]),
          el('fieldset', { className: 'deduction-fieldset', disabled: !unlocked }, [
            el('legend', { text: '3. 事件过程' }),
            el(
              'div',
              { className: 'choice-grid' },
              deduction.methodOptions.map((option) =>
                optionButton(option, methodId, (id) => {
                  methodId = id;
                  paint();
                }),
              ),
            ),
          ]),
          el('fieldset', { className: 'deduction-fieldset', disabled: !unlocked }, [
            el('legend', { text: '4. 关键证据（可多选）' }),
            el('div', { className: 'evidence-grid' }, evidenceOptions),
          ]),
          el('div', { className: 'btn-row' }, [
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn--primary',
                disabled: !unlocked,
                on: {
                  click: () => {
                    const summary = [
                      `人物：${deduction.personOptions.find((o) => o.id === personId)?.label || '未选'}`,
                      `动机：${deduction.motiveOptions.find((o) => o.id === motiveId)?.label || '未选'}`,
                      `过程：${deduction.methodOptions.find((o) => o.id === methodId)?.label || '未选'}`,
                      `证据：${evidenceIds.length} 条`,
                    ];
                    openModal({
                      title: '确认提交推理？',
                      bodyNodes: [
                        el('p', {
                          text: '提交后将根据正确性结算评价与结局。错误次数会影响最高等级。',
                        }),
                        el(
                          'ul',
                          { className: 'briefing-stats' },
                          summary.map((line) => el('li', { text: line })),
                        ),
                      ],
                      actions: [
                        { label: '再检查一下', close: true },
                        {
                          label: '确认提交',
                          primary: true,
                          onClick: () => {
                            const result = submitDeduction(caseData, {
                              personId,
                              motiveId,
                              methodId,
                              evidenceIds,
                            });
                            saveGame();
                            if (!result.ok) {
                              showToast(result.message);
                              feedback = result.message;
                              playSfx('wrong');
                              paint();
                              return;
                            }
                            if (result.retry) {
                              feedback = result.message;
                              showToast(result.message);
                              playSfx('wrong');
                              paint();
                              return;
                            }
                            playSfx('correct');
                            showToast('案件已结案');
                            navigate('/ending');
                          },
                        },
                      ],
                    });
                  },
                },
              },
              '提交最终推理',
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'btn',
                on: { click: () => navigate('/archive') },
              },
              '返回档案',
            ),
          ]),
        ],
      ),
      feedback
        ? el(
            'div',
            {
              className: 'deduction-feedback',
              attrs: { role: 'status', 'aria-live': 'polite' },
            },
            [el('p', { text: feedback })],
          )
        : null,
      el('p', {
        className: 'placeholder-note',
        text: `已提交次数：${getState().deductionAttempts || 0} · 错误尝试：${getState().deductionWrongAttempts || 0}`,
      }),
      renderGameNav('deduction'),
    );
  };

  paint();
}
