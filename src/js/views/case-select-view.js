import { el, assetUrl } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getCaseIndex } from '../systems/case-loader.js';
import { getState, hasActiveSave } from '../state/game-state.js';
import { readBestRanks, getCaseEnding } from '../state/save-manager.js';
import { renderEmptyBlock } from '../components/status-block.js';

function difficultyLabel(value) {
  const map = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
  };
  return map[value] || value;
}

export function renderCaseSelectView(root) {
  const cases = getCaseIndex();
  const state = getState();
  const bestRanks = readBestRanks();

  const cards = cases.map((item) => {
    const isActive = state.caseId === item.id && hasActiveSave(state);
    const archivedEnding = getCaseEnding(item.id);
    const cover = el('img', {
      className: 'case-card__cover',
      src: assetUrl(item.coverImage),
      alt: `${item.titleZh} 封面`,
      loading: 'lazy',
    });

    const actions = [
      el(
        'button',
        {
          className: 'btn btn--primary',
          type: 'button',
          on: {
            click: () => {
              if (isActive) {
                navigate('/investigation');
                return;
              }
              navigate(`/case/${item.id}`);
            },
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
    ];

    if (archivedEnding?.endingId) {
      actions.push(
        el(
          'button',
          {
            className: 'btn btn--ghost',
            type: 'button',
            on: {
              click: () => navigate(`/ending/${item.id}`),
            },
          },
          '回顾结局',
        ),
      );
    }

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
                : bestRanks[item.id] ||
                    archivedEnding ||
                    (state.completed && state.caseId === item.id)
                  ? '已完成'
                  : '未开始',
            }),
            el('span', {
              className: 'status-pill',
              text: bestRanks[item.id] ? `最佳评价：${bestRanks[item.id]}` : '最佳评价：—',
            }),
          ]),
          el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1rem' } }, actions),
        ]),
      ],
    );
  });

  root.append(
    el('section', { className: 'view', attrs: { 'aria-labelledby': 'cases-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Case Files' }),
        el('h1', { id: 'cases-title', text: '案件选择' }),
        el('p', {
          text: '选择要调查的案件。进度按案件分别记录最佳评价与结局；同一时间仅保留一份进行中的存档。“查看详情”不会清空进度。',
        }),
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
