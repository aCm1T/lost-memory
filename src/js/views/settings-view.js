import { el } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getState, setState } from '../state/game-state.js';
import { saveGame, clearSave } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';

export function renderSettingsView(root) {
  const { settings } = getState();

  const volumeInput = el('input', {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.05,
    value: settings.volume,
    attrs: { id: 'setting-volume', 'aria-valuemin': '0', 'aria-valuemax': '1' },
  });

  root.append(
    el('section', { className: 'view panel', attrs: { 'aria-labelledby': 'settings-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Settings' }),
        el('h1', { id: 'settings-title', text: '设置' }),
        el('p', { text: '设置会写入本地存档。音频实际播放将在后续阶段接入。' }),
      ]),
      el(
        'form',
        {
          className: 'settings-list',
          on: {
            submit: (event) => {
              event.preventDefault();
            },
          },
        },
        [
          el('label', {}, [
            el('span', { text: '背景音乐' }),
            el(
              'select',
              {
                attrs: { id: 'setting-bgm' },
                value: settings.bgm ? 'on' : 'off',
                on: {
                  change: (event) => {
                    setState({ settings: { bgm: event.target.value === 'on' } });
                    saveGame();
                  },
                },
              },
              [
                el('option', { value: 'on', text: '开' }),
                el('option', { value: 'off', text: '关' }),
              ],
            ),
          ]),
          el('label', {}, [
            el('span', { text: '音效' }),
            el(
              'select',
              {
                attrs: { id: 'setting-sfx' },
                value: settings.sfx ? 'on' : 'off',
                on: {
                  change: (event) => {
                    setState({ settings: { sfx: event.target.value === 'on' } });
                    saveGame();
                  },
                },
              },
              [
                el('option', { value: 'on', text: '开' }),
                el('option', { value: 'off', text: '关' }),
              ],
            ),
          ]),
          el('label', {}, [el('span', { text: '音量' }), volumeInput]),
          el('label', {}, [
            el('span', { text: '动画强度' }),
            el(
              'select',
              {
                attrs: { id: 'setting-motion' },
                value: settings.motion,
                on: {
                  change: (event) => {
                    setState({ settings: { motion: event.target.value } });
                    saveGame();
                  },
                },
              },
              [
                el('option', { value: 'full', text: '完整' }),
                el('option', { value: 'reduced', text: '减弱' }),
                el('option', { value: 'off', text: '关闭' }),
              ],
            ),
          ]),
          el('label', {}, [
            el('span', { text: '文字速度' }),
            el(
              'select',
              {
                attrs: { id: 'setting-text-speed' },
                value: settings.textSpeed,
                on: {
                  change: (event) => {
                    setState({ settings: { textSpeed: event.target.value } });
                    saveGame();
                  },
                },
              },
              [
                el('option', { value: 'slow', text: '慢' }),
                el('option', { value: 'normal', text: '中' }),
                el('option', { value: 'fast', text: '快' }),
              ],
            ),
          ]),
          el('label', {}, [
            el('span', { text: '语言（预留）' }),
            el(
              'select',
              {
                attrs: { id: 'setting-language', disabled: 'disabled' },
                value: settings.language,
              },
              [
                el('option', { value: 'zh', text: '中文' }),
                el('option', { value: 'en', text: 'English（后续）' }),
              ],
            ),
          ]),
        ],
      ),
      el('div', { className: 'btn-row', attrs: { style: 'margin-top: 1.5rem' } }, [
        el(
          'button',
          {
            className: 'btn btn--primary',
            type: 'button',
            on: {
              click: () => {
                setState({
                  settings: {
                    volume: Number(volumeInput.value),
                  },
                });
                saveGame();
                showToast('设置已保存');
              },
            },
          },
          '保存设置',
        ),
        el(
          'button',
          {
            className: 'btn',
            type: 'button',
            on: {
              click: () => {
                const confirmed = window.confirm('确定删除本地存档吗？此操作不可撤销。');
                if (!confirmed) return;
                clearSave();
                showToast('存档已删除');
                navigate('/home');
              },
            },
          },
          '删除存档',
        ),
        el(
          'button',
          {
            className: 'btn btn--ghost',
            type: 'button',
            on: { click: () => navigate('/home') },
          },
          '返回首页',
        ),
      ]),
    ]),
  );

  // Ensure select values reflect state (value prop alone is unreliable pre-mount).
  const bgm = root.querySelector('#setting-bgm');
  const sfx = root.querySelector('#setting-sfx');
  if (bgm) bgm.value = settings.bgm ? 'on' : 'off';
  if (sfx) sfx.value = settings.sfx ? 'on' : 'off';
}
