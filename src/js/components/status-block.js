import { el } from '../utils/dom.js';

/**
 * Shared empty / loading / error feedback blocks.
 */
export function renderStatusBlock({
  tone = 'empty',
  title,
  message,
  actions = [],
  live = false,
} = {}) {
  const className = `status-block status-block--${tone}`;
  const attrs = live ? { role: 'status', 'aria-live': 'polite' } : {};

  return el('div', { className, attrs }, [
    el('p', { className: 'status-block__eyebrow', text: toneLabel(tone) }),
    title ? el('h2', { className: 'status-block__title', text: title }) : null,
    message ? el('p', { className: 'status-block__message', text: message }) : null,
    actions.length
      ? el(
          'div',
          { className: 'btn-row status-block__actions' },
          actions.map((action) =>
            el(
              'button',
              {
                type: 'button',
                className: action.primary ? 'btn btn--primary' : 'btn',
                on: { click: action.onClick },
              },
              action.label,
            ),
          ),
        )
      : null,
  ]);
}

function toneLabel(tone) {
  if (tone === 'loading') return 'Loading';
  if (tone === 'error') return 'Error';
  return 'Empty';
}

export function renderLoadingBlock(message = '正在载入…') {
  return renderStatusBlock({
    tone: 'loading',
    title: '请稍候',
    message,
    live: true,
  });
}

export function renderErrorBlock({ title = '出现问题', message, onRetry, onHome } = {}) {
  const actions = [];
  if (onRetry) actions.push({ label: '重试', primary: true, onClick: onRetry });
  if (onHome) actions.push({ label: '返回首页', onClick: onHome });
  return renderStatusBlock({
    tone: 'error',
    title,
    message,
    actions,
    live: true,
  });
}

export function renderEmptyBlock({ title = '暂无内容', message, action } = {}) {
  return renderStatusBlock({
    tone: 'empty',
    title,
    message,
    actions: action ? [action] : [],
  });
}
