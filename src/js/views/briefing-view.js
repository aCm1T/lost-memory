import { el, assetUrl } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getCaseSummary, loadCase } from '../systems/case-loader.js';
import { getState, startCase, setCaseLoadError } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';

function renderError(root, title, message, caseId) {
  root.append(
    el('section', { className: 'view panel' }, [
      el('h1', { text: title }),
      el('p', { text: message }),
      caseId ? el('p', { className: 'placeholder-note', text: `案件 ID：${caseId}` }) : null,
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
}

export function renderBriefingView(root, caseId) {
  const summary = getCaseSummary(caseId);
  if (!summary) {
    renderError(root, '未找到案件', `案件索引中不存在：${caseId}`, caseId);
    return;
  }

  const loaded = loadCase(caseId);
  if (!loaded.ok) {
    setCaseLoadError(loaded.error);
    renderError(root, '案件数据无效', loaded.error, caseId);
    return;
  }

  const caseData = loaded.data;
  const state = getState();
  if (state.caseId !== caseId || !state.startedAt) {
    startCase(caseId, caseData);
    saveGame();
  }

  const victim = caseData.briefing.victim;
  const objectives = caseData.briefing.objectives.map((item) => el('li', { text: item }));

  root.append(
    el(
      'section',
      { className: 'view briefing-view', attrs: { 'aria-labelledby': 'briefing-title' } },
      [
        el('article', { className: 'panel briefing-panel' }, [
          el('header', { className: 'view-header' }, [
            el('p', { className: 'eyebrow', text: 'Case Briefing' }),
            el('h1', { id: 'briefing-title', text: caseData.titleZh }),
            el('p', { text: caseData.title }),
          ]),
          el('div', { className: 'briefing-cover-wrap' }, [
            el('img', {
              className: 'briefing-cover',
              src: assetUrl(caseData.coverImage),
              alt: `${caseData.titleZh} 封面`,
            }),
          ]),
          el('div', { className: 'briefing-grid' }, [
            el('section', { attrs: { 'aria-labelledby': 'briefing-bg-title' } }, [
              el('h2', { id: 'briefing-bg-title', text: '案件背景' }),
              ...caseData.briefing.background
                .split('\n')
                .filter(Boolean)
                .map((para) => el('p', { text: para })),
            ]),
            el('aside', { className: 'briefing-aside' }, [
              el('h2', { text: '基本信息' }),
              el('dl', { className: 'briefing-facts' }, [
                el('dt', { text: '时间' }),
                el('dd', { text: caseData.briefing.time }),
                el('dt', { text: '地点' }),
                el('dd', { text: caseData.briefing.place }),
                el('dt', { text: '失踪者' }),
                el('dd', {
                  text: `${victim.name}${victim.nameEn ? `（${victim.nameEn}）` : ''} · ${victim.role}`,
                }),
                el('dt', { text: '难度 / 时长' }),
                el('dd', {
                  text: `${caseData.difficulty} · 约 ${caseData.estimatedMinutes} 分钟`,
                }),
              ]),
              el('h2', { text: '当前任务' }),
              el('ol', { className: 'briefing-objectives' }, objectives),
              el('h2', { text: '内容规模' }),
              el('ul', { className: 'briefing-stats' }, [
                el('li', {
                  text: `人物 ${caseData.characters.length} · 可询问 ${caseData.characters.filter((c) => c.interviewable).length}`,
                }),
                el('li', { text: `场景 ${caseData.locations.length}` }),
                el('li', { text: `线索 ${caseData.clues.length}` }),
                el('li', {
                  text: `问答 ${caseData.dialogues.reduce((sum, d) => sum + d.topics.length, 0)}`,
                }),
                el('li', { text: `结局 ${caseData.endings.length}` }),
              ]),
            ]),
          ]),
          el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1.5rem' } }, [
            el(
              'button',
              {
                className: 'btn btn--primary',
                type: 'button',
                on: {
                  click: () => {
                    saveGame();
                    navigate('/investigation');
                  },
                },
              },
              '开始调查',
            ),
            el(
              'button',
              {
                className: 'btn',
                type: 'button',
                on: { click: () => navigate('/cases') },
              },
              '返回案件列表',
            ),
          ]),
          el('p', {
            className: 'placeholder-note',
            text: '案件数据已校验并载入。场景热点与对话交互将在 Phase 4 完整开放；当前可查看调查概览。',
          }),
        ]),
      ],
    ),
  );
}
