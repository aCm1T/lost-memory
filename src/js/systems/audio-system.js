import { AUDIO_URLS } from '../utils/constants.js';
import { assetUrl } from '../utils/dom.js';
import { getState } from '../state/game-state.js';

const SFX_TONES = {
  click: { frequency: 520, duration: 0.05, type: 'square', gain: 0.03 },
  clue: { frequency: 660, duration: 0.18, type: 'triangle', gain: 0.05 },
  correct: { frequency: 784, duration: 0.22, type: 'sine', gain: 0.05 },
  wrong: { frequency: 180, duration: 0.28, type: 'sawtooth', gain: 0.04 },
};

let audioCtx = null;
let unlocked = false;
let bgmTimer = null;
let bgmUsingFile = false;
let bgmAudio = null;
const fileCache = new Map();
const missingFiles = new Set();
let unlockBound = false;

function getSettings() {
  return getState().settings || {};
}

function ensureContext() {
  if (audioCtx) return audioCtx;
  if (typeof globalThis === 'undefined') return null;
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

export function isAudioUnlocked() {
  return unlocked;
}

export function unlockAudio() {
  try {
    const ctx = ensureContext();
    if (!ctx) {
      unlocked = true;
      return false;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    unlocked = true;
    syncAudioWithSettings();
    return true;
  } catch (error) {
    console.warn('Audio unlock failed', error);
    unlocked = true;
    return false;
  }
}

export function bindAudioUnlockOnce(target = document) {
  if (unlockBound || typeof target?.addEventListener !== 'function') return;
  unlockBound = true;
  const unlock = () => {
    unlockAudio();
    target.removeEventListener('pointerdown', unlock);
    target.removeEventListener('keydown', unlock);
  };
  target.addEventListener('pointerdown', unlock, { once: true });
  target.addEventListener('keydown', unlock, { once: true });
}

function playTone(config) {
  const ctx = ensureContext();
  if (!ctx || !unlocked) return;
  const settings = getSettings();
  if (!settings.sfx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const volume = Number(settings.volume ?? 0.7);
    const now = ctx.currentTime;
    oscillator.type = config.type || 'sine';
    oscillator.frequency.setValueAtTime(config.frequency, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, config.gain * volume), now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + config.duration + 0.02);
  } catch (error) {
    console.warn('Tone playback failed', error);
  }
}

async function tryPlayFile(key) {
  const settings = getSettings();
  if (!settings.sfx && key !== 'bgm') return false;
  if (!settings.bgm && key === 'bgm') return false;
  if (!unlocked) return false;
  if (typeof Audio === 'undefined') return false;

  const relative = AUDIO_URLS[key];
  if (!relative || missingFiles.has(relative)) return false;

  try {
    let audio = fileCache.get(relative);
    if (!audio) {
      audio = new Audio(assetUrl(relative));
      audio.preload = 'auto';
      fileCache.set(relative, audio);
    }
    audio.volume = Math.max(0, Math.min(1, Number(settings.volume ?? 0.7)));
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch (error) {
    missingFiles.add(relative);
    console.warn(`Audio file unavailable: ${relative}`, error?.message || error);
    return false;
  }
}

export async function playSfx(name) {
  const settings = getSettings();
  if (!settings.sfx) return;
  if (!unlocked) return;

  const played = await tryPlayFile(name);
  if (played) return;
  const tone = SFX_TONES[name];
  if (tone) playTone(tone);
}

function stopBgmNodes() {
  if (bgmTimer) {
    if (typeof globalThis !== 'undefined' && globalThis.clearInterval) {
      globalThis.clearInterval(bgmTimer);
    }
    bgmTimer = null;
  }
  if (bgmAudio) {
    try {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    bgmAudio = null;
  }
  bgmUsingFile = false;
}

function startProceduralBgm() {
  stopBgmNodes();
  const ctx = ensureContext();
  if (!ctx || !unlocked) return;
  const settings = getSettings();
  if (!settings.bgm) return;

  const pulse = () => {
    if (!getSettings().bgm) return;
    playTone({
      frequency: 110,
      duration: 1.4,
      type: 'sine',
      gain: 0.015 * Number(getSettings().volume ?? 0.7),
    });
  };

  pulse();
  if (typeof globalThis !== 'undefined' && globalThis.setInterval) {
    bgmTimer = globalThis.setInterval(pulse, 3200);
  }
}

async function startFileBgm() {
  const relative = AUDIO_URLS.bgm;
  if (!relative || missingFiles.has(relative)) return false;
  if (typeof Audio === 'undefined') return false;
  try {
    const audio = new Audio(assetUrl(relative));
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, Number(getSettings().volume ?? 0.7) * 0.5));
    await audio.play();
    bgmAudio = audio;
    bgmUsingFile = true;
    return true;
  } catch (error) {
    missingFiles.add(relative);
    console.warn(`BGM file unavailable: ${relative}`, error?.message || error);
    return false;
  }
}

export async function syncAudioWithSettings() {
  const settings = getSettings();
  if (!unlocked) return;

  if (!settings.bgm) {
    stopBgmNodes();
    return;
  }

  if (bgmUsingFile && bgmAudio) {
    bgmAudio.volume = Math.max(0, Math.min(1, Number(settings.volume ?? 0.7) * 0.5));
    return;
  }

  const fileOk = await startFileBgm();
  if (!fileOk && !bgmTimer) {
    startProceduralBgm();
  }
}

export function stopAudio() {
  stopBgmNodes();
}

/** Test helper */
export function resetAudioForTests() {
  stopBgmNodes();
  audioCtx = null;
  unlocked = false;
  unlockBound = false;
  missingFiles.clear();
  fileCache.clear();
}

export function getMissingAudioFilesForTests() {
  return [...missingFiles];
}
