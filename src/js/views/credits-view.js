import { el } from '../utils/dom.js';
import { navigate } from '../router.js';

/** Shared with CREDITS.md — keep in sync when attributions change. */
export const CREDIT_ITEMS = [
  'Lost Memory /《失落的记忆》— 原创互动推理项目',
  '概念 · 设计 · 实现：aCm1T',
  '第一案：《407 号房的失踪者》 / The Vanishing at Room 407',
  '字体：Instrument Serif、Source Sans 3（Google Fonts · SIL OFL）',
  '占位封面、角色与场景图、PWA 图标：项目原创 SVG',
  '音频：可选本地文件；缺失时回退为程序音效',
  '技术：Vite · Vitest · GitHub Pages',
  '许可：MIT — 详见仓库 LICENSE 与 CREDITS.md',
];

export function renderCreditsView(root) {
  root.append(
    el('section', { className: 'view panel', attrs: { 'aria-labelledby': 'credits-title' } }, [
      el('header', { className: 'view-header' }, [
        el('p', { className: 'eyebrow', text: 'Credits' }),
        el('h1', { id: 'credits-title', text: '制作人员' }),
        el('p', {
          text: '完整致谢与第三方许可说明见仓库 CREDITS.md。',
        }),
      ]),
      el(
        'ul',
        { className: 'credits-list' },
        CREDIT_ITEMS.map((text) => el('li', { text })),
      ),
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
