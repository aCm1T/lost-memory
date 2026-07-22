import { el, clear } from '../utils/dom.js';
import { navigate } from '../router.js';
import { loadCase, getLoadedCase } from '../systems/case-loader.js';
import { getState } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { renderGameNav } from '../components/game-nav.js';
import { playSfx } from '../systems/audio-system.js';
import { renderEmptyBlock } from '../components/status-block.js';
import {
  getOrderedTimelineEvents,
  getTimelineConfig,
  listDiscoveredEvents,
  moveTimelineEvent,
  submitTimeline,
} from '../systems/timeline-system.js';

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

export function renderTimelineView(root) {
  const caseData = ensureCase(root);
  if (!caseData) return;

  const shell = el('section', {
    className: 'view timeline-shell',
    attrs: { 'aria-labelledby': 'timeline-title' },
  });
  root.append(shell);

  let feedback = null;

  const paint = () => {
    const state = getState();
    const config = getTimelineConfig(caseData);
    const discovered = listDiscoveredEvents(caseData, state);
    const ordered = getOrderedTimelineEvents(caseData, state);
    const solved = Boolean(state.timelineSolved);

    clear(shell);

    const eventRows = ordered.length
      ? ordered.map((event, index) =>
          el(
            'article',
            {
              className: `timeline-row${solved ? ' is-solved' : ''}`,
              attrs: { 'aria-label': `事件 ${index + 1}: ${event.label}` },
            },
            [
              el('div', { className: 'timeline-row__index', text: String(index + 1) }),
              el('div', { className: 'timeline-row__body' }, [
                el('h2', { text: event.label }),
                el('p', { text: event.description }),
              ]),
              el('div', { className: 'timeline-row__controls' }, [
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'btn',
                    disabled: solved || index === 0,
                    attrs: { 'aria-label': `上移 ${event.label}` },
                    on: {
                      click: () => {
                        const result = moveTimelineEvent(caseData, event.id, 'up');
                        if (!result.ok) return;
                        feedback = null;
                        saveGame();
                        paint();
                      },
                    },
                  },
                  '上移',
                ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'btn',
                    disabled: solved || index === ordered.length - 1,
                    attrs: { 'aria-label': `下移 ${event.label}` },
                    on: {
                      click: () => {
                        const result = moveTimelineEvent(caseData, event.id, 'down');
                        if (!result.ok) return;
                        feedback = null;
                        saveGame();
                        paint();
                      },
                    },
                  },
                  '下移',
                ),
              ]),
            ],
          ),
        )
      : [
          renderEmptyBlock({
            title: '尚未发现时间线事件',
            message: '继续调查现场与询问人物以解锁事件，再回来排序。',
            action: {
              label: '返回调查',
              primary: true,
              onClick: () => navigate('/investigation'),
            },
          }),
        ];

    shell.append(
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Timeline Analysis' }),
        el('h1', { id: 'timeline-title', text: '时间线分析' }),
        el('p', {
          text: solved
            ? '时间线已验证通过。'
            : `已发现事件 ${discovered.length}/${config.events.length}。使用上移/下移调整顺序后提交验证。`,
        }),
      ]),
      el(
        'div',
        {
          className: 'timeline-board',
          attrs: { role: 'list', 'aria-label': '可排序事件列表' },
        },
        eventRows,
      ),
      el('div', { className: 'btn-row' }, [
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn--primary',
            disabled: solved || ordered.length === 0,
            on: {
              click: () => {
                const result = submitTimeline(caseData);
                feedback = result;
                saveGame();
                playSfx(result.solved ? 'correct' : 'wrong');
                showToast(result.message);
                paint();
              },
            },
          },
          solved ? '已完成验证' : '提交排序',
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn',
            on: { click: () => navigate('/investigation') },
          },
          '返回调查',
        ),
        solved
          ? el(
              'button',
              {
                type: 'button',
                className: 'btn btn--ghost',
                on: { click: () => navigate('/deduction') },
              },
              '前往最终推理',
            )
          : null,
      ]),
      feedback
        ? el(
            'div',
            {
              className: `timeline-feedback${feedback.solved ? ' is-ok' : ' is-bad'}`,
              attrs: { role: 'status', 'aria-live': 'polite' },
            },
            [el('p', { text: feedback.message })],
          )
        : null,
      el('p', {
        className: 'placeholder-note',
        text: '移动端可用上移/下移按钮排序，不依赖拖拽。',
      }),
      renderGameNav('timeline'),
    );
  };

  paint();
  saveGame();
}
