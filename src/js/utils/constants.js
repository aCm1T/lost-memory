export const APP_NAME = 'Lost Memory';
export const APP_NAME_ZH = '失落的记忆';
export const SAVE_KEY = 'lost-memory.save.v1';
export const SETTINGS_KEY = 'lost-memory.settings.v1';
export const BEST_RANKS_KEY = 'lost-memory.best-ranks.v1';
export const DATA_VERSION = 1;
export const BASE_PATH = '/lost-memory/';

export const ROUTES = {
  home: '/home',
  cases: '/cases',
  case: '/case/:id',
  settings: '/settings',
  credits: '/credits',
};

export const DEFAULT_SETTINGS = {
  bgm: true,
  sfx: true,
  volume: 0.7,
  motion: 'full',
  textSpeed: 'normal',
  language: 'zh',
};

export const AUDIO_URLS = {
  // Optional file overrides; missing files are ignored and procedural tones are used.
  bgm: 'assets/audio/music/ambient-loop.mp3',
  click: 'assets/audio/sfx/click.mp3',
  clue: 'assets/audio/sfx/clue.mp3',
  correct: 'assets/audio/sfx/correct.mp3',
  wrong: 'assets/audio/sfx/wrong.mp3',
};
