import { el } from '../utils/dom.js';

export function calcProgressPercent(value = 0, max = 1) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  return {
    safeMax,
    safeValue,
    percent: Math.round((safeValue / safeMax) * 100),
  };
}

export function renderProgressIndicator({
  label = '进度',
  value = 0,
  max = 1,
  id = 'progress-indicator',
} = {}) {
  const { safeMax, safeValue, percent } = calcProgressPercent(value, max);

  return el('div', { className: 'progress-indicator', attrs: { 'aria-label': label } }, [
    el('div', { className: 'progress-indicator__meta' }, [
      el('span', { text: label }),
      el('span', {
        attrs: { id: `${id}-value` },
        text: `${safeValue}/${safeMax}（${percent}%）`,
      }),
    ]),
    el(
      'div',
      {
        className: 'progress-indicator__track',
        attrs: {
          role: 'progressbar',
          'aria-valuemin': '0',
          'aria-valuemax': String(safeMax),
          'aria-valuenow': String(safeValue),
          'aria-labelledby': `${id}-value`,
        },
      },
      [
        el('div', {
          className: 'progress-indicator__fill',
          attrs: { style: `width:${percent}%` },
        }),
      ],
    ),
  ]);
}
