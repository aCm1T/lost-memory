import { el, assetUrl } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getLoadedCase, loadCase } from '../systems/case-loader.js';
import { getState } from '../state/game-state.js';
import { evaluateConditions } from '../utils/conditions.js';
import { saveGame } from '../state/save-manager.js';

/**
 * Phase 3 overview shell: proves case load + progress wiring.
 * Full hotspot / dialogue interaction arrives in Phase 4.
 */
export function renderInvestigationView(root) {
  const state = getState();
  if (!state.caseId) {
    root.append(
      el('section', { className: 'view panel' }, [
        el('h1', { text: '尚未开始案件' }),
        el('p', { text: '请先从案件列表进入简报。' }),
        el(
          'button',
          {
            className: 'btn btn--primary',
            type: 'button',
            on: { click: () => navigate('/cases') },
          },
          '前往案件选择',
        ),
      ]),
    );
    return;
  }

  const loaded = loadCase(state.caseId);
  if (!loaded.ok) {
    root.append(
      el('section', { className: 'view panel' }, [
        el('h1', { text: '案件加载失败' }),
        el('p', { text: loaded.error }),
        el(
          'button',
          {
            className: 'btn btn--primary',
            type: 'button',
            on: { click: () => navigate('/home') },
          },
          '返回首页',
        ),
      ]),
    );
    return;
  }

  const caseData = getLoadedCase(state.caseId);
  const context = {
    flags: state.flags,
    discoveredClueIds: state.discoveredClueIds,
    askedTopicIds: state.askedTopicIds,
    timelineSolved: state.timelineSolved,
  };

  const locationCards = caseData.locations.map((location) => {
    const unlocked = evaluateConditions(location.unlockConditions, context);
    return el('article', { className: `overview-card${unlocked ? '' : ' is-locked'}` }, [
      el('img', {
        className: 'overview-card__image',
        src: assetUrl(location.image),
        alt: location.name,
      }),
      el('div', {}, [
        el('h3', { text: location.name }),
        el('p', { text: location.description }),
        el('p', {
          className: 'overview-card__meta',
          text: unlocked ? `可调查点 ${location.hotspots.length}` : '尚未解锁（条件未满足）',
        }),
      ]),
    ]);
  });

  const people = caseData.characters
    .filter((character) => character.interviewable)
    .map((character) => {
      const dialogue = caseData.dialogues.find((entry) => entry.characterId === character.id);
      const openTopics = (dialogue?.topics || []).filter((topic) =>
        evaluateConditions(topic.unlockConditions, context),
      );
      return el('article', { className: 'overview-card overview-card--person' }, [
        el('img', {
          className: 'overview-card__portrait',
          src: assetUrl(character.portrait),
          alt: `${character.name} 肖像`,
        }),
        el('div', {}, [
          el('h3', { text: character.name }),
          el('p', { text: character.role }),
          el('p', {
            className: 'overview-card__meta',
            text: `可问话题 ${openTopics.length}/${dialogue?.topics.length || 0}`,
          }),
        ]),
      ]);
    });

  saveGame();

  root.append(
    el('section', { className: 'view', attrs: { 'aria-labelledby': 'invest-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Investigation Overview' }),
        el('h1', { id: 'invest-title', text: caseData.titleZh }),
        el('p', {
          text: '概览已从案件 JSON 载入。热点调查与人物询问交互将在下一阶段实现。',
        }),
      ]),
      el('div', { className: 'progress-strip', attrs: { 'aria-label': '调查进度' } }, [
        el('span', { text: `线索 ${state.discoveredClueIds.length}/${caseData.clues.length}` }),
        el('span', { text: `已查热点 ${state.inspectedHotspotIds.length}` }),
        el('span', { text: `已问话题 ${state.askedTopicIds.length}` }),
        el('span', { text: state.timelineSolved ? '时间线：已验证' : '时间线：未完成' }),
      ]),
      el('h2', { className: 'section-title', text: '场景' }),
      el('div', { className: 'overview-grid' }, locationCards),
      el('h2', { className: 'section-title', text: '可询问人物' }),
      el('div', { className: 'overview-grid' }, people),
      el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1.5rem' } }, [
        el(
          'button',
          {
            className: 'btn',
            type: 'button',
            on: { click: () => navigate(`/case/${caseData.id}`) },
          },
          '返回简报',
        ),
        el(
          'button',
          {
            className: 'btn btn--ghost',
            type: 'button',
            on: { click: () => navigate('/home') },
          },
          '首页',
        ),
      ]),
    ]),
  );
}
