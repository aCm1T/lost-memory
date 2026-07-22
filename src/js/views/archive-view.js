import { el, clear } from '../utils/dom.js';
import { navigate } from '../router.js';
import { loadCase, getLoadedCase } from '../systems/case-loader.js';
import { getState } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { renderGameNav } from '../components/game-nav.js';
import { renderEmptyBlock } from '../components/status-block.js';
import { filterClues, getDiscoveredClues, pinClue, getClueById } from '../systems/clue-system.js';
import {
  compareEvidence,
  countDiscoverableLinks,
  getResultLabel,
  listResolvedLinks,
} from '../systems/evidence-link-system.js';

const TYPE_LABELS = {
  all: '全部',
  physical: '物证',
  testimony: '证词',
  document: '文件',
  photo: '照片',
  time: '时间记录',
  environment: '环境信息',
  communication: '通信记录',
  record: '记录',
};

function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

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

export function renderArchiveView(root) {
  const caseData = ensureCase(root);
  if (!caseData) return;

  const shell = el('section', {
    className: 'view archive-shell',
    attrs: { 'aria-labelledby': 'archive-title' },
  });
  root.append(shell);

  let filterType = 'all';
  let pinnedOnly = false;
  let selectedId = null;
  let compareA = null;
  let compareB = null;
  let lastCompare = null;

  const paint = () => {
    const state = getState();
    const discovered = getDiscoveredClues(caseData, state);
    const filtered = filterClues(discovered, {
      type: filterType,
      pinnedOnly,
      pinnedIds: state.pinnedClueIds || [],
    });
    const selected = selectedId ? getClueById(caseData, selectedId) : filtered[0] || null;
    if (selected) selectedId = selected.id;

    const types = ['all', ...new Set(discovered.map((clue) => clue.type))];
    const resolved = listResolvedLinks(caseData, state);
    const linkReady = countDiscoverableLinks(caseData, state);

    clear(shell);

    const filterButtons = types.map((type) =>
      el(
        'button',
        {
          type: 'button',
          className: `chip${filterType === type ? ' is-active' : ''}`,
          attrs: { 'aria-pressed': String(filterType === type) },
          on: {
            click: () => {
              filterType = type;
              paint();
            },
          },
        },
        typeLabel(type),
      ),
    );

    filterButtons.push(
      el(
        'button',
        {
          type: 'button',
          className: `chip${pinnedOnly ? ' is-active' : ''}`,
          attrs: { 'aria-pressed': String(pinnedOnly) },
          on: {
            click: () => {
              pinnedOnly = !pinnedOnly;
              paint();
            },
          },
        },
        '只看重点',
      ),
    );

    const cards = filtered.length
      ? filtered.map((clue) => {
          const pinned = (state.pinnedClueIds || []).includes(clue.id);
          return el(
            'button',
            {
              type: 'button',
              className: `clue-card${selected?.id === clue.id ? ' is-selected' : ''}${pinned ? ' is-pinned' : ''}`,
              attrs: {
                'aria-pressed': String(selected?.id === clue.id),
                'aria-label': `${clue.name}${pinned ? '（重点）' : ''}`,
              },
              on: {
                click: () => {
                  selectedId = clue.id;
                  paint();
                },
              },
            },
            [
              el('span', { className: 'clue-card__type', text: typeLabel(clue.type) }),
              el('strong', { className: 'clue-card__title', text: clue.name }),
              el('span', { className: 'clue-card__summary', text: clue.shortDescription }),
              pinned ? el('span', { className: 'clue-card__pin', text: '重点' }) : null,
            ],
          );
        })
      : [
          renderEmptyBlock({
            title: '还没有符合筛选的线索',
            message: '先去现场调查，或切换筛选条件。',
            action: {
              label: '前往调查',
              primary: true,
              onClick: () => navigate('/investigation'),
            },
          }),
        ];

    const detail = selected
      ? el('article', { className: 'clue-detail panel', attrs: { 'aria-live': 'polite' } }, [
          el('p', { className: 'eyebrow', text: typeLabel(selected.type) }),
          el('h2', { text: selected.name }),
          el('p', { text: selected.detailDescription || selected.shortDescription }),
          el('dl', { className: 'briefing-facts' }, [
            el('dt', { text: '关联时间' }),
            el('dd', { text: selected.relatedTime || '—' }),
            el('dt', { text: '来源' }),
            el('dd', { text: selected.source || '—' }),
            el('dt', { text: '关联人物' }),
            el('dd', {
              text:
                (selected.relatedCharacterIds || [])
                  .map((id) => caseData.characters.find((c) => c.id === id)?.name || id)
                  .join('、') || '—',
            }),
            el('dt', { text: '关联地点' }),
            el('dd', {
              text:
                (selected.relatedLocationIds || [])
                  .map((id) => caseData.locations.find((l) => l.id === id)?.name || id)
                  .join('、') || '—',
            }),
          ]),
          el('div', { className: 'btn-row' }, [
            el(
              'button',
              {
                type: 'button',
                className: 'btn',
                on: {
                  click: () => {
                    pinClue(selected.id);
                    saveGame();
                    showToast(
                      (getState().pinnedClueIds || []).includes(selected.id)
                        ? '已标记为重点线索'
                        : '已取消重点标记',
                    );
                    paint();
                  },
                },
              },
              (state.pinnedClueIds || []).includes(selected.id) ? '取消重点' : '标记重点',
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn--primary',
                on: {
                  click: () => {
                    if (!compareA) compareA = selected.id;
                    else if (!compareB && selected.id !== compareA) compareB = selected.id;
                    else {
                      compareA = selected.id;
                      compareB = null;
                      lastCompare = null;
                    }
                    paint();
                  },
                },
              },
              !compareA
                ? '选为对比 A'
                : !compareB
                  ? selected.id === compareA
                    ? '已选为 A'
                    : '选为对比 B'
                  : '重新选择对比',
            ),
          ]),
        ])
      : renderEmptyBlock({
          title: '选择一条线索',
          message: '从左侧列表打开详情，并标记重点或加入对比。',
        });

    const comparePanel = el('section', { className: 'compare-panel panel' }, [
      el('h2', { text: '证据关联' }),
      el('p', {
        text: `已发现可对比组合 ${linkReady} · 已解析关联 ${resolved.length}`,
      }),
      el('div', { className: 'compare-slots' }, [
        el('div', { className: 'compare-slot' }, [
          el('span', { className: 'eyebrow', text: '线索 A' }),
          el('strong', {
            text: compareA ? getClueById(caseData, compareA)?.name || compareA : '未选择',
          }),
        ]),
        el('div', { className: 'compare-slot' }, [
          el('span', { className: 'eyebrow', text: '线索 B' }),
          el('strong', {
            text: compareB ? getClueById(caseData, compareB)?.name || compareB : '未选择',
          }),
        ]),
      ]),
      el('div', { className: 'btn-row' }, [
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn--primary',
            disabled: !(compareA && compareB),
            on: {
              click: () => {
                const result = compareEvidence(caseData, compareA, compareB);
                if (!result.ok) {
                  showToast('请选择两条已发现的不同线索');
                  return;
                }
                lastCompare = result;
                saveGame();
                showToast(`${result.resultLabel}：${result.message}`);
                paint();
              },
            },
          },
          '对比证据',
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn--ghost',
            on: {
              click: () => {
                compareA = null;
                compareB = null;
                lastCompare = null;
                paint();
              },
            },
          },
          '清空选择',
        ),
      ]),
      lastCompare
        ? el(
            'div',
            {
              className: `compare-result compare-result--${lastCompare.result}`,
              attrs: { role: 'status', 'aria-live': 'polite' },
            },
            [
              el('p', { className: 'eyebrow', text: lastCompare.resultLabel }),
              el('p', { text: lastCompare.message }),
              lastCompare.setsFlags?.length
                ? el('p', {
                    className: 'placeholder-note',
                    text: `解锁标记：${lastCompare.setsFlags.join(', ')}`,
                  })
                : null,
            ],
          )
        : el('p', {
            className: 'placeholder-note',
            text: '选择两条线索进行对比。关联结果由案件数据预设，不使用在线模型判断。',
          }),
      resolved.length
        ? el('div', {}, [
            el('h3', { text: '已发现的关联' }),
            el(
              'ul',
              { className: 'resolved-links' },
              resolved.map((link) =>
                el('li', {}, [
                  el('strong', { text: getResultLabel(link.result) }),
                  el('span', { text: link.message }),
                ]),
              ),
            ),
          ])
        : null,
    ]);

    shell.append(
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Evidence Archive' }),
        el('h1', { id: 'archive-title', text: '证据档案' }),
        el('p', {
          text: `已收集 ${discovered.length}/${caseData.clues.length} 条线索。可筛选、标记重点并对比证据。`,
        }),
      ]),
      el(
        'div',
        { className: 'chip-row', attrs: { role: 'toolbar', 'aria-label': '线索筛选' } },
        filterButtons,
      ),
      el('div', { className: 'archive-layout' }, [
        el('div', { className: 'clue-card-grid', attrs: { 'aria-label': '线索列表' } }, cards),
        el('div', { className: 'archive-side' }, [detail, comparePanel]),
      ]),
      renderGameNav('archive'),
    );
  };

  paint();
  saveGame();
}
