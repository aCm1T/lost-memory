import { el } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getCaseSummary } from '../systems/case-loader.js';
import { getState, startCase } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';

export function renderBriefingView(root, caseId) {
  const summary = getCaseSummary(caseId);
  const state = getState();

  if (!summary) {
    root.append(
      el('section', { className: 'view panel' }, [
        el('h1', { text: '未找到案件' }),
        el('p', { text: `不存在的案件 ID：${caseId}` }),
        el(
          'button',
          {
            className: 'btn btn--primary',
            type: 'button',
            on: { click: () => navigate('/cases') },
          },
          '返回案件列表',
        ),
      ]),
    );
    return;
  }

  if (state.caseId !== caseId) {
    startCase(caseId);
    saveGame();
  }

  root.append(
    el('section', { className: 'view panel', attrs: { 'aria-labelledby': 'briefing-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Case Briefing' }),
        el('h1', { id: 'briefing-title', text: summary.titleZh }),
        el('p', { text: summary.title }),
      ]),
      el('div', { attrs: { style: 'display:grid;gap:1rem;max-width:40rem' } }, [
        el('p', { text: summary.summary }),
        el('p', {
          text: '时间：雨夜 · 地点：港灯酒店 · 失踪者：苏晚（407 房客）',
        }),
        el('p', {
          text: '当前任务：阅读简报后进入调查。完整场景、对话与推理系统将在后续阶段接入。',
        }),
        el('div', { className: 'btn-row' }, [
          el(
            'button',
            {
              className: 'btn btn--primary',
              type: 'button',
              on: {
                click: () => {
                  saveGame();
                  showToast('调查界面将在 Phase 4 开放');
                  navigate('/cases');
                },
              },
            },
            '开始调查（预览）',
          ),
          el(
            'button',
            {
              className: 'btn',
              type: 'button',
              on: { click: () => navigate('/cases') },
            },
            '返回',
          ),
        ]),
        el('p', {
          className: 'placeholder-note',
          text: 'Phase 2 骨架：简报页可到达；案件完整 JSON 与调查循环属于后续阶段。',
        }),
      ]),
    ]),
  );
}
