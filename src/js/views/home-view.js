import { el } from '../utils/dom.js';
import { navigate } from '../router.js';
import { hasActiveSave, startCase, getState } from '../state/game-state.js';
import { hasSave, loadGame, saveGame, getContinuePath } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { getCaseIndex, loadCase } from '../systems/case-loader.js';
import { playSfx } from '../systems/audio-system.js';
import { confirmNewCaseStart } from '../utils/progress-guard.js';

function restartCurrentOrChooseCase() {
  const state = getState();
  const cases = getCaseIndex();
  if (!cases.length) {
    showToast('暂无可用案件');
    return;
  }

  const currentId = state.caseId;
  const shouldRestartCurrent =
    Boolean(currentId) && (hasActiveSave(state) || Boolean(state.completed && state.endingId));

  if (!shouldRestartCurrent) {
    playSfx('click');
    navigate('/cases');
    showToast('请选择要调查的案件');
    return;
  }

  if (!confirmNewCaseStart(state, '重新开始当前案件将清空现有进度。确定继续吗？')) {
    showToast('已取消重新开始');
    return;
  }

  const loaded = loadCase(currentId);
  if (!loaded.ok) {
    showToast('案件数据无法加载');
    console.error(loaded.error);
    return;
  }

  startCase(currentId, loaded.data);
  saveGame();
  playSfx('click');
  navigate(`/case/${currentId}`);
}

export function renderHomeView(root) {
  const state = getState();
  const canContinue = hasSave() && hasActiveSave(state);
  const canReviewEnding = Boolean(state.completed && state.endingId);

  const continueBtn = el(
    'button',
    {
      className: 'btn btn--primary',
      type: 'button',
      disabled: !canContinue,
      attrs: { 'aria-disabled': String(!canContinue) },
      on: {
        click: () => {
          const result = loadGame();
          if (!result.ok || !result.data?.caseId) {
            showToast(
              result.reason === 'corrupt' ? '存档损坏，请到设置中重置' : '没有可继续的存档',
            );
            return;
          }
          playSfx('click');
          navigate(getContinuePath(result.data));
          showToast('已读取存档并继续');
        },
      },
    },
    '继续游戏',
  );

  const buttons = [
    el(
      'button',
      {
        className: canContinue ? 'btn' : 'btn btn--primary',
        type: 'button',
        on: { click: restartCurrentOrChooseCase },
      },
      canContinue || canReviewEnding ? '重新开始' : '开始游戏',
    ),
    continueBtn,
  ];

  if (canReviewEnding) {
    buttons.push(
      el(
        'button',
        {
          className: 'btn',
          type: 'button',
          on: {
            click: () => {
              loadGame();
              playSfx('click');
              navigate('/ending');
            },
          },
        },
        '查看结局',
      ),
    );
  }

  buttons.push(
    el(
      'button',
      {
        className: 'btn',
        type: 'button',
        on: { click: () => navigate('/cases') },
      },
      '案件选择',
    ),
    el(
      'button',
      {
        className: 'btn btn--ghost',
        type: 'button',
        on: { click: () => navigate('/settings') },
      },
      '设置',
    ),
    el(
      'button',
      {
        className: 'btn btn--ghost',
        type: 'button',
        on: { click: () => navigate('/credits') },
      },
      '制作人员',
    ),
  );

  root.append(
    el('section', { className: 'view home-hero', attrs: { 'aria-labelledby': 'home-title' } }, [
      el('div', {}, [
        el('p', { className: 'eyebrow', text: 'Interactive Mystery' }),
        el('h1', { className: 'home-hero__brand', id: 'home-title' }, [
          'Lost Memory',
          el('span', { text: '失落的记忆' }),
        ]),
        el('p', {
          className: 'home-hero__lead',
          text: '一个人的记忆可能不可靠，但物证和时间不会撒谎。调查现场、核对证词、拼回那一夜真正发生过的事。',
        }),
        el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1.5rem' } }, buttons),
      ]),
      el('div', { className: 'home-hero__stage', attrs: { 'aria-hidden': 'true' } }, [
        el('p', {
          className: 'home-hero__fragment',
          text: '“听见一个人的声音，不等于那个人在那个时刻说话。”',
        }),
      ]),
    ]),
  );
}
