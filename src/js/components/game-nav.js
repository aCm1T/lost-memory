import { el } from '../utils/dom.js';
import { navigate } from '../router.js';

export function renderGameNav(active) {
  const items = [
    { id: 'investigation', label: '调查', href: '/investigation' },
    { id: 'people', label: '询问', href: '/people' },
    { id: 'archive', label: '档案', href: '/archive' },
    { id: 'timeline', label: '时间线', href: '/timeline' },
    { id: 'deduction', label: '推理', href: '/deduction' },
  ];

  return el(
    'nav',
    { className: 'game-nav', attrs: { 'aria-label': '调查导航' } },
    items.map((item) =>
      el(
        'button',
        {
          type: 'button',
          className: `game-nav__btn${active === item.id ? ' is-active' : ''}`,
          attrs: { 'aria-current': active === item.id ? 'page' : null },
          on: {
            click: () => navigate(item.href),
          },
        },
        item.label,
      ),
    ),
  );
}
