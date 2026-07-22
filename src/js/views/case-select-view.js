import { el, assetUrl } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getCaseIndex, loadCase } from '../systems/case-loader.js';
import { getState, startCase, hasActiveSave } from '../state/game-state.js';
import { saveGame, readBestRanks } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { renderEmptyBlock } from '../components/status-block.js';
import { confirmNewCaseStart } from '../utils/progress-guard.js';

function difficultyLabel(value) {
  const map = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
  };
  return map[value] || value;
}

function enterCaseBriefing(item, { isActive }) {
  // Resume in-progress case without wiping progress.
  if (isActive) {
    navigate(`/case/${item.id}`);
    return;
  }

  if (
    !confirmNewCaseStart(
      getState(),
      '已有进行中的调查进度，进入该案简报并重新开始将清空当前进度。确定继续吗？',
    )
  ) {
    showToast('已取消重新开始');
    return;
  }

  const loaded = loadCase(item.id);
  if (!loaded.ok) {
    showToast('案件数据无效，无法开始');
    console.error(loaded.error);
    return;
  }
  startCase(item.id, loaded.data);
  saveGame();
  navigate(`/case/${item.id}`);
}

export function renderCaseSelectView(root) {
  const cases = getCaseIndex();
  const state = getState();
  const bestRanks = readBestRanks();

  const cards = cases.map((item) => {
    const isActive = state.caseId === item.id && hasActiveSave(state);
    const cover = el('img', {
      className: 'case-card__cover',
      src: assetUrl(item.coverImage),
      alt: `${item.titleZh} 封面`,
      loading: 'lazy',
    });

    return el(
      'article',
      {
        className: 'case-card',
        attrs: { 'aria-labelledby': `case-title-${item.id}` },
      },
      [
        cover,
        el('div', {}, [
          el('p', { className: 'eyebrow', text: item.id }),
          el('h2', {
            className: 'case-card__title',
            id: `case-title-${item.id}`,
            text: item.title,
          }),
          el('p', { className: 'case-card__title-zh', text: item.titleZh }),
          el('p', { text: item.summary }),
          el('div', { className: 'case-card__meta' }, [
            el('span', {
              className: 'status-pill',
              text: `难度：${difficultyLabel(item.difficulty)}`,
            }),
            el('span', {
              className: 'status-pill',
              text: `预计 ${item.estimatedMinutes} 分钟`,
            }),
            el('span', {
              className: 'status-pill',
              text: isActive
                ? '进行中'
                : state.completed && state.caseId === item.id
                  ? '已完成'
                  : '未开始',
            }),
            el('span', {
              className: 'status-pill',
              text: bestRanks[item.id] ? `最佳评价：${bestRanks[item.id]}` : '最佳评价：—',
            }),
          ]),
          el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1rem' } }, [
            el(
              'button',
              {
                className: 'btn btn--primary',
                type: 'button',
                on: {
                  click: () => enterCaseBriefing(item, { isActive }),
                },
              },
              isActive ? '继续本案' : '进入简报',
            ),
            el(
              'button',
              {
                className: 'btn',
                type: 'button',
                on: {
                  click: () => {
                    navigate(`/case/${item.id}`);
                  },
                },
              },
              '查看详情',
            ),
          ]),
        ]),
      ],
    );
  });

  root.append(
    el('section', { className: 'view', attrs: { 'aria-labelledby': 'cases-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Case Files' }),
        el('h1', { id: 'cases-title', text: '案件选择' }),
        el('p', { text: '第一版包含一个完整案件。列表结构已预留扩展。' }),
      ]),
      cases.length
        ? el('div', { className: 'case-grid' }, cards)
        : renderEmptyBlock({
            title: '暂无案件',
            message: '案件索引为空。请检查 case-index.json。',
          }),
    ]),
  );
}
