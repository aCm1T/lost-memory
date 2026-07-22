import '../styles/main.css';
import { clear, $all } from './utils/dom.js';
import { registerRoute, startRouter, navigate, getCurrentPath } from './router.js';
import { loadGame } from './state/save-manager.js';
import { setState } from './state/game-state.js';
import { renderHomeView } from './views/home-view.js';
import { renderCaseSelectView } from './views/case-select-view.js';
import { renderBriefingView } from './views/briefing-view.js';
import { renderInvestigationView } from './views/investigation-view.js';
import { renderPeopleView, renderDialogueView } from './views/dialogue-view.js';
import { renderArchiveView } from './views/archive-view.js';
import { renderTimelineView } from './views/timeline-view.js';
import { renderDeductionView } from './views/deduction-view.js';
import { renderEndingView } from './views/ending-view.js';
import { renderSettingsView } from './views/settings-view.js';
import { renderCreditsView } from './views/credits-view.js';

function getMain() {
  return document.getElementById('app-main');
}

function updateNav(path) {
  $all('.app-header__nav a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.replace(/^#/, '');
    const current = path === linkPath || (linkPath !== '/home' && path.startsWith(`${linkPath}/`));
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function mount(renderFn) {
  const main = getMain();
  if (!main) return;
  clear(main);
  renderFn(main);
  updateNav(getCurrentPath());
  main.focus({ preventScroll: true });
}

function boot() {
  const loaded = loadGame();
  if (!loaded.ok && loaded.reason === 'corrupt') {
    console.warn('Save data corrupt; starting clean.', loaded.error);
  } else if (!loaded.ok && loaded.reason === 'unsupported-version') {
    console.warn('Save version unsupported; starting clean.');
  }

  registerRoute('/home', async () => {
    setState({ view: 'home' });
    mount(renderHomeView);
  });

  registerRoute('/cases', async () => {
    setState({ view: 'cases' });
    mount(renderCaseSelectView);
  });

  registerRoute('/case/:id', async ({ params }) => {
    setState({ view: 'briefing' });
    mount((root) => renderBriefingView(root, params.id));
  });

  registerRoute('/investigation', async () => {
    setState({ view: 'investigation' });
    mount(renderInvestigationView);
  });

  registerRoute('/people', async () => {
    setState({ view: 'people' });
    mount(renderPeopleView);
  });

  registerRoute('/dialogue/:characterId', async ({ params }) => {
    setState({ view: 'dialogue' });
    mount((root) => renderDialogueView(root, params.characterId));
  });

  registerRoute('/archive', async () => {
    setState({ view: 'archive' });
    mount(renderArchiveView);
  });

  registerRoute('/timeline', async () => {
    setState({ view: 'timeline' });
    mount(renderTimelineView);
  });

  registerRoute('/deduction', async () => {
    setState({ view: 'deduction' });
    mount(renderDeductionView);
  });

  registerRoute('/ending', async () => {
    setState({ view: 'ending' });
    mount(renderEndingView);
  });

  registerRoute('/settings', async () => {
    setState({ view: 'settings' });
    mount(renderSettingsView);
  });

  registerRoute('/credits', async () => {
    setState({ view: 'credits' });
    mount(renderCreditsView);
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-link]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#/')) return;
    event.preventDefault();
    navigate(href.slice(1));
  });

  startRouter(() => navigate('/home'));
}

boot();
