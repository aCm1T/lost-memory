import { el } from '../utils/dom.js';
import { navigate } from '../router.js';
import { getState } from '../state/game-state.js';
import { saveGame, clearSave, restartCase, saveSettings } from '../state/save-manager.js';
import { showToast } from '../components/toast.js';
import { updateSettings } from '../systems/settings-system.js';
import { playSfx, syncAudioWithSettings, unlockAudio } from '../systems/audio-system.js';
import { loadCase } from '../systems/case-loader.js';

export function renderSettingsView(root) {
  const { settings, caseId, caseTitle, completed, startedAt } = getState();

  const volumeInput = el('input', {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.05,
    value: settings.volume,
    attrs: {
      id: 'setting-volume',
      'aria-valuemin': '0',
      'aria-valuemax': '1',
      'aria-label': '主音量',
    },
    on: {
      input: (event) => {
        updateSettings({ volume: Number(event.target.value) });
        saveSettings();
        syncAudioWithSettings();
      },
    },
  });

  const persist = (patch) => {
    updateSettings(patch);
    saveSettings();
    saveGame();
    playSfx('click');
  };

  root.append(
    el('section', { className: 'view panel', attrs: { 'aria-labelledby': 'settings-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Settings' }),
        el('h1', { id: 'settings-title', text: '设置' }),
        el('p', {
          text: '音频、动画与文字速度会立即生效，并写入本地存储。缺少音频文件时会自动改用程序音效。',
        }),
      ]),
      el(
        'form',
        {
          className: 'settings-list',
          on: {
            submit: (event) => event.preventDefault(),
          },
        },
        [
          el('label', {}, [
            el('span', { text: '背景音乐' }),
            el(
              'select',
              {
                attrs: { id: 'setting-bgm', 'aria-label': '背景音乐开关' },
                on: {
                  change: (event) => {
                    unlockAudio();
                    persist({ bgm: event.target.value === 'on' });
                    syncAudioWithSettings();
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
                attrs: { id: 'setting-sfx', 'aria-label': '音效开关' },
                on: {
                  change: (event) => {
                    unlockAudio();
                    persist({ sfx: event.target.value === 'on' });
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
                attrs: { id: 'setting-motion', 'aria-label': '动画强度' },
                on: {
                  change: (event) => persist({ motion: event.target.value }),
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
                attrs: { id: 'setting-text-speed', 'aria-label': '文字速度' },
                on: {
                  change: (event) => persist({ textSpeed: event.target.value }),
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
                persist({ volume: Number(volumeInput.value) });
                syncAudioWithSettings();
                showToast('设置已保存到本地');
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
            disabled: !caseId || !startedAt,
            on: {
              click: () => {
                const confirmed = window.confirm(
                  completed
                    ? '确定重新开始当前案件吗？进度会被清空。'
                    : '确定重新开始案件吗？当前调查进度将丢失。',
                );
                if (!confirmed) return;
                const loaded = loadCase(caseId);
                const result = restartCase(
                  caseId,
                  loaded.ok ? loaded.data : { titleZh: caseTitle },
                );
                if (!result.ok) {
                  showToast('无法重新开始');
                  return;
                }
                playSfx('click');
                showToast('案件已重新开始');
                navigate(`/case/${caseId}`);
              },
            },
          },
          '重新开始案件',
        ),
        el(
          'button',
          {
            className: 'btn',
            type: 'button',
            on: {
              click: () => {
                const confirmed = window.confirm(
                  '确定删除本地存档吗？此操作不可撤销。设置会保留。',
                );
                if (!confirmed) return;
                clearSave();
                playSfx('wrong');
                showToast('存档已删除，设置已保留');
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

  const bgm = root.querySelector('#setting-bgm');
  const sfx = root.querySelector('#setting-sfx');
  const motion = root.querySelector('#setting-motion');
  const textSpeed = root.querySelector('#setting-text-speed');
  const language = root.querySelector('#setting-language');
  if (bgm) bgm.value = settings.bgm ? 'on' : 'off';
  if (sfx) sfx.value = settings.sfx ? 'on' : 'off';
  if (motion) motion.value = settings.motion || 'full';
  if (textSpeed) textSpeed.value = settings.textSpeed || 'normal';
  if (language) language.value = settings.language || 'zh';
}
