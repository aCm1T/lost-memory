import { el, assetUrl, clear } from '../utils/dom.js';
import { navigate } from '../router.js';
import { loadCase, getLoadedCase } from '../systems/case-loader.js';
import { getState } from '../state/game-state.js';
import { saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { renderGameNav } from '../components/game-nav.js';
import { renderErrorBlock, renderEmptyBlock } from '../components/status-block.js';
import { renderProgressIndicator } from '../components/progress-indicator.js';
import { playSfx } from '../systems/audio-system.js';
import {
  getInvestigationProgress,
  getLocationById,
  inspectHotspot,
  listLocations,
  listVisibleHotspots,
  selectLocation,
} from '../systems/investigation-system.js';
import { listInterviewableCharacters } from '../systems/dialogue-system.js';
import { getDiscoveredClues } from '../systems/clue-system.js';

function ensureCaseOrRedirect(root) {
  const state = getState();
  if (!state.caseId) {
    root.append(
      el('section', { className: 'view' }, [
        renderEmptyBlock({
          title: '尚未开始案件',
          message: '请先从案件列表进入简报，再开始现场调查。',
          action: {
            label: '前往案件选择',
            primary: true,
            onClick: () => navigate('/cases'),
          },
        }),
      ]),
    );
    return null;
  }

  const loaded = loadCase(state.caseId);
  if (!loaded.ok) {
    root.append(
      el('section', { className: 'view' }, [
        renderErrorBlock({
          title: '案件加载失败',
          message: loaded.error,
          onRetry: () => navigate('/investigation'),
          onHome: () => navigate('/home'),
        }),
      ]),
    );
    return null;
  }

  return getLoadedCase(state.caseId);
}

function showClueModal(clues, title = '发现线索') {
  if (!clues.length) return;
  const nodes = clues.map((clue) =>
    el('article', { className: 'clue-found' }, [
      el('h3', { text: clue.name }),
      el('p', { className: 'eyebrow', text: clue.type }),
      el('p', { text: clue.detailDescription || clue.shortDescription }),
    ]),
  );
  openModal({
    title: clues.length > 1 ? `${title}（${clues.length}）` : title,
    bodyNodes: nodes,
    actions: [{ label: '收入档案', primary: true }],
  });
}

function buildObjectives(caseData, state) {
  const progress = getInvestigationProgress(caseData, state);
  const items = [
    {
      done: progress.clueCount >= 3,
      text: `收集线索（${progress.clueCount}/${caseData.clues.length}）`,
    },
    {
      done: progress.hotspotInspected >= 3,
      text: `调查现场热点（${progress.hotspotInspected}/${progress.hotspotUnlocked} 可用）`,
    },
    {
      done: progress.topicsAsked >= 3,
      text: `询问关键人物（已问 ${progress.topicsAsked}）`,
    },
    {
      done: Boolean(state.flags.flag_time_gap),
      text: '发现时间线矛盾',
    },
  ];
  return items;
}

export function renderInvestigationView(root) {
  const caseData = ensureCaseOrRedirect(root);
  if (!caseData) return;

  let mobilePanel = 'stage';

  const shell = el('section', {
    className: 'view investigation-shell',
    attrs: {
      'aria-labelledby': 'invest-title',
      'data-mobile-panel': mobilePanel,
    },
  });
  root.append(shell);

  const paint = () => {
    shell.dataset.mobilePanel = mobilePanel;
    const state = getState();
    const locations = listLocations(caseData, state);
    const defaultLocation =
      locations.find((item) => item.location.id === state.currentLocationId && item.unlocked) ||
      locations.find((item) => item.unlocked) ||
      locations[0];

    if (defaultLocation && state.currentLocationId !== defaultLocation.location.id) {
      selectLocation(defaultLocation.location.id);
    }

    const currentId = getState().currentLocationId || defaultLocation?.location.id;
    const location = getLocationById(caseData, currentId);
    const hotspotEntries = listVisibleHotspots(location, getState());
    const people = listInterviewableCharacters(caseData, getState());
    const progress = getInvestigationProgress(caseData, getState());
    const objectives = buildObjectives(caseData, getState());
    const recentClues = getDiscoveredClues(caseData, getState()).slice(-4).reverse();

    clear(shell);

    const locationButtons = locations.map((item) =>
      el(
        'button',
        {
          type: 'button',
          className: `side-list__btn${item.location.id === currentId ? ' is-active' : ''}${item.unlocked ? '' : ' is-locked'}`,
          disabled: !item.unlocked,
          attrs: {
            'aria-current': item.location.id === currentId ? 'true' : null,
            title: item.unlocked ? item.location.name : '尚未解锁',
          },
          on: {
            click: () => {
              selectLocation(item.location.id);
              saveGame();
              paint();
            },
          },
        },
        [
          el('span', { text: item.location.name }),
          el('small', {
            text: item.unlocked
              ? `${item.inspectedCount}/${item.location.hotspots.length}`
              : '锁定',
          }),
        ],
      ),
    );

    const peopleButtons = people.map((item) =>
      el(
        'button',
        {
          type: 'button',
          className: 'side-list__btn',
          on: {
            click: () => navigate(`/dialogue/${item.character.id}`),
          },
        },
        [
          el('span', { text: item.character.name }),
          el('small', {
            text:
              item.newCount > 0
                ? `${item.askedCount}/${item.availableCount} · 新 ${item.newCount}`
                : `${item.askedCount}/${item.availableCount}`,
          }),
        ],
      ),
    );

    const hotspotButtons = hotspotEntries.map(({ hotspot, unlocked, inspected }) => {
      if (!unlocked) {
        return el(
          'button',
          {
            type: 'button',
            className: 'hotspot is-locked',
            disabled: true,
            attrs: {
              style: `left:${hotspot.x}%;top:${hotspot.y}%`,
              title: '尚未满足调查条件',
              'aria-label': `${hotspot.label}（未解锁）`,
            },
          },
          hotspot.label,
        );
      }

      return el(
        'button',
        {
          type: 'button',
          className: `hotspot${inspected ? ' is-inspected' : ''}`,
          attrs: {
            style: `left:${hotspot.x}%;top:${hotspot.y}%`,
            'aria-label': `${hotspot.label}${inspected ? '（已调查）' : '（未调查）'}`,
          },
          on: {
            click: () => {
              const result = inspectHotspot(caseData, location.id, hotspot.id);
              if (!result.ok) {
                showToast('无法调查该点');
                return;
              }
              saveGame();
              if (result.clues.length) {
                showClueModal(result.clues);
                playSfx('clue');
                showToast(`发现线索：${result.clues.map((c) => c.name).join('、')}`);
              } else if (result.alreadyInspected) {
                playSfx('click');
                showToast(result.description || '已经调查过这里');
                openModal({
                  title: hotspot.label,
                  bodyNodes: [el('p', { text: result.description || '没有更多发现。' })],
                  actions: [{ label: '关闭', primary: true }],
                });
              } else {
                showToast(result.description || '调查完成');
                openModal({
                  title: hotspot.label,
                  bodyNodes: [el('p', { text: result.description || '你仔细检查了这里。' })],
                  actions: [{ label: '关闭', primary: true }],
                });
              }
              paint();
            },
          },
        },
        hotspot.label,
      );
    });

    shell.append(
      el('header', { className: 'investigation-top' }, [
        el('div', {}, [
          el('p', { className: 'eyebrow', text: 'Investigation' }),
          el('h1', { id: 'invest-title', text: caseData.titleZh }),
          el('p', {
            className: 'save-status',
            text: `自动保存 · 线索 ${progress.clueCount}/${progress.clueTotal}`,
          }),
        ]),
        el('div', { className: 'btn-row' }, [
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn--ghost',
              on: { click: () => navigate(`/case/${caseData.id}`) },
            },
            '简报',
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn--ghost',
              on: { click: () => navigate('/settings') },
            },
            '设置',
          ),
        ]),
      ]),
      el(
        'div',
        { className: 'mobile-tabs', attrs: { role: 'tablist', 'aria-label': '调查面板' } },
        [
          el(
            'button',
            {
              type: 'button',
              className: `mobile-tabs__btn${mobilePanel === 'nav' ? ' is-active' : ''}`,
              attrs: {
                role: 'tab',
                'aria-selected': String(mobilePanel === 'nav'),
              },
              on: {
                click: () => {
                  mobilePanel = 'nav';
                  paint();
                },
              },
            },
            '导航',
          ),
          el(
            'button',
            {
              type: 'button',
              className: `mobile-tabs__btn${mobilePanel === 'stage' ? ' is-active' : ''}`,
              attrs: {
                role: 'tab',
                'aria-selected': String(mobilePanel === 'stage'),
              },
              on: {
                click: () => {
                  mobilePanel = 'stage';
                  paint();
                },
              },
            },
            '现场',
          ),
          el(
            'button',
            {
              type: 'button',
              className: `mobile-tabs__btn${mobilePanel === 'progress' ? ' is-active' : ''}`,
              attrs: {
                role: 'tab',
                'aria-selected': String(mobilePanel === 'progress'),
              },
              on: {
                click: () => {
                  mobilePanel = 'progress';
                  paint();
                },
              },
            },
            '进度',
          ),
        ],
      ),
      el('div', { className: 'investigation-layout' }, [
        el(
          'aside',
          {
            className: 'investigation-side investigation-panel',
            attrs: { 'aria-label': '场景与人物' },
          },
          [
            el('h2', { text: '场景' }),
            el('div', { className: 'side-list' }, locationButtons),
            el('h2', { text: '人物' }),
            el('div', { className: 'side-list' }, peopleButtons),
          ],
        ),
        el('div', { className: 'investigation-stage investigation-panel' }, [
          el('div', { className: 'stage-heading' }, [
            el('h2', { text: location?.name || '选择场景' }),
            el('p', { text: location?.description || '' }),
          ]),
          location
            ? el(
                'div',
                {
                  className: 'scene-board',
                  attrs: { role: 'group', 'aria-label': `${location.name} 调查点` },
                },
                [
                  el('img', {
                    className: 'scene-board__image',
                    src: assetUrl(location.image),
                    alt: `${location.name} 场景图`,
                  }),
                  ...hotspotButtons,
                ],
              )
            : renderEmptyBlock({
                title: '没有可进入的场景',
                message: '继续收集线索以解锁更多地点。',
              }),
          el('div', { className: 'hotspot-legend', attrs: { 'aria-hidden': 'true' } }, [
            el('span', { className: 'legend legend--new', text: '未调查' }),
            el('span', { className: 'legend legend--done', text: '已调查' }),
            el('span', { className: 'legend legend--lock', text: '未解锁' }),
          ]),
        ]),
        el(
          'aside',
          {
            className: 'investigation-rail investigation-panel',
            attrs: { 'aria-label': '任务与进度' },
          },
          [
            el('h2', { text: '任务进度' }),
            renderProgressIndicator({
              label: '线索收集',
              value: progress.clueCount,
              max: progress.clueTotal,
              id: 'clue-progress',
            }),
            el(
              'ul',
              { className: 'objective-list' },
              objectives.map((item) =>
                el('li', { className: item.done ? 'is-done' : '' }, [
                  el('span', {
                    className: 'objective-mark',
                    attrs: { 'aria-hidden': 'true' },
                    text: item.done ? '+' : '-',
                  }),
                  el('span', { text: item.text }),
                ]),
              ),
            ),
            el('h2', { text: '最近线索' }),
            recentClues.length
              ? el(
                  'ul',
                  { className: 'recent-clues' },
                  recentClues.map((clue) =>
                    el('li', {}, [
                      el('strong', { text: clue.name }),
                      el('span', { text: clue.shortDescription }),
                    ]),
                  ),
                )
              : el('p', { className: 'placeholder-note', text: '点击场景中的调查点收集线索。' }),
            el('h2', { text: '统计' }),
            el('ul', { className: 'briefing-stats' }, [
              el('li', {
                text: `场景 ${progress.locationUnlocked}/${progress.locationTotal}`,
              }),
              el('li', {
                text: `热点 ${progress.hotspotInspected}/${progress.hotspotTotal}`,
              }),
              el('li', { text: `询问 ${progress.topicsAsked}` }),
            ]),
          ],
        ),
      ]),
      renderGameNav('investigation'),
    );
  };

  paint();
  saveGame();
}
