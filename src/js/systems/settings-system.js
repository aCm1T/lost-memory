import { DEFAULT_SETTINGS } from '../utils/constants.js';
import { getState, setState } from '../state/game-state.js';
import { syncAudioWithSettings } from './audio-system.js';

export function applyPresentationSettings(settings = getState().settings) {
  if (typeof document === 'undefined') return settings;
  const root = document.documentElement;
  root.dataset.motion = settings.motion || 'full';
  root.dataset.textSpeed = settings.textSpeed || 'normal';
  root.style.setProperty(
    '--text-speed-ms',
    settings.textSpeed === 'slow' ? '700ms' : settings.textSpeed === 'fast' ? '180ms' : '350ms',
  );
  return settings;
}

export function updateSettings(patch, { syncAudio = true } = {}) {
  const next = setState({
    settings: {
      ...getState().settings,
      ...patch,
    },
  });
  applyPresentationSettings(next.settings);
  if (syncAudio) {
    syncAudioWithSettings();
  }
  return next.settings;
}

export function resetSettingsToDefault() {
  return updateSettings({ ...DEFAULT_SETTINGS });
}
