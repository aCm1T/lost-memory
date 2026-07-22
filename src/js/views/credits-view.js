import { el } from '../utils/dom.js';
import { navigate } from '../router.js';

export function renderCreditsView(root) {
  root.append(
    el('section', { className: 'view panel', attrs: { 'aria-labelledby': 'credits-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Credits' }),
        el('h1', { id: 'credits-title', text: '制作人员' }),
      ]),
      el('ul', { className: 'credits-list' }, [
        el('li', { text: 'Lost Memory /《失落的记忆》— 原创互动推理项目' }),
        el('li', { text: '第一案：《407 号房的失踪者》' }),
        el('li', { text: '字体：Instrument Serif、Source Sans 3（Google Fonts）' }),
        el('li', { text: '占位封面与图标：项目原创 SVG' }),
        el('li', { text: '完整 CREDITS.md 将在发布阶段补全' }),
      ]),
      el(
        'button',
        {
          className: 'btn btn--primary',
          type: 'button',
          attrs: { style: 'margin-top: 1.5rem' },
          on: { click: () => navigate('/home') },
        },
        '返回首页',
      ),
    ]),
  );
}
