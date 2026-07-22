import { el } from '../utils/dom.js';
import { navigate } from '../router.js';
import { hasActiveSave, startCase, getState } from '../state/game-state.js';
import { hasSave, loadGame, saveGame } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { getCaseIndex, loadCase } from '../systems/case-loader.js';

export function renderHomeView(root) {
  const state = getState();
  const canContinue = hasSave() && hasActiveSave(state);

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
            showToast('没有可继续的存档');
            return;
          }
          navigate('/investigation');
          showToast('已读取存档');
        },
      },
    },
    '继续游戏',
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
          text: '一个人的记忆可能不可靠，但物证和时间不会撒谎。在港灯酒店的雨夜，还原 407 号房的失踪真相。',
        }),
        el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1.5rem' } }, [
          el(
            'button',
            {
              className: 'btn btn--primary',
              type: 'button',
              on: {
                click: () => {
                  const firstCase = getCaseIndex()[0];
                  if (!firstCase) {
                    showToast('暂无可用案件');
                    return;
                  }
                  const loaded = loadCase(firstCase.id);
                  if (!loaded.ok) {
                    showToast('案件数据无法加载');
                    console.error(loaded.error);
                    return;
                  }
                  startCase(firstCase.id, loaded.data);
                  saveGame();
                  navigate(`/case/${firstCase.id}`);
                },
              },
            },
            '开始游戏',
          ),
          continueBtn,
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
        ]),
      ]),
      el('div', { className: 'home-hero__stage', attrs: { 'aria-hidden': 'true' } }, [
        el('p', {
          className: 'home-hero__fragment',
          text: '“门锁完好。房间空了。手表停在 22:37。”',
        }),
      ]),
    ]),
  );
}
