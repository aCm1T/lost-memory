import '../styles/main.css';
import { clear, $all } from './utils/dom.js';
import { registerRoute, startRouter, navigate, getCurrentPath } from './router.js';
import { loadGame, recoverCorruptSave } from './state/save-manager.js';
import { setState } from './state/game-state.js';
import { applyPresentationSettings } from './systems/settings-system.js';
import { bindAudioUnlockOnce } from './systems/audio-system.js';
import { registerServiceWorker } from './pwa.js';
import { showToast } from './components/toast.js';
import { renderLoadingBlock, renderErrorBlock } from './components/status-block.js';
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

function showLoading() {
  const main = getMain();
  if (!main) return;
  clear(main);
  main.classList.add('is-loading');
  main.append(renderLoadingBlock('正在切换页面…'));
}

function mount(renderFn) {
  const main = getMain();
  if (!main) return;
  main.classList.remove('is-loading');
  clear(main);
  try {
    renderFn(main);
  } catch (error) {
    console.error('View render failed', error);
    main.append(
      renderErrorBlock({
        title: '页面渲染失败',
        message: error?.message || '未知错误',
        onRetry: () => window.location.reload(),
        onHome: () => navigate('/home'),
      }),
    );
  }
  updateNav(getCurrentPath());
  main.focus({ preventScroll: true });
}

async function mountRoute(renderFn) {
  showLoading();
  // Yield so the loading state is visible on slower devices / large views.
  await Promise.resolve();
  mount(renderFn);
}

function boot() {
  bindAudioUnlockOnce(document);
  registerServiceWorker();
  let bootNotice = null;

  const loaded = loadGame();
  if (!loaded.ok && (loaded.reason === 'corrupt' || loaded.reason === 'invalid-shape')) {
    const recovered = recoverCorruptSave();
    bootNotice = recovered.message || '存档已损坏并重置。';
    console.warn('Save data corrupt; recovered.', loaded.error);
  } else if (!loaded.ok && loaded.reason === 'unsupported-version') {
    const recovered = recoverCorruptSave();
    bootNotice = recovered.message || '存档版本不受支持，已安全重置。';
    console.warn('Save version unsupported; recovered.');
  }

  applyPresentationSettings();

  registerRoute('/home', async () => {
    setState({ view: 'home' });
    await mountRoute(renderHomeView);
  });

  registerRoute('/cases', async () => {
    setState({ view: 'cases' });
    await mountRoute(renderCaseSelectView);
  });

  registerRoute('/case/:id', async ({ params }) => {
    setState({ view: 'briefing' });
    await mountRoute((root) => renderBriefingView(root, params.id));
  });

  registerRoute('/investigation', async () => {
    setState({ view: 'investigation' });
    await mountRoute(renderInvestigationView);
  });

  registerRoute('/people', async () => {
    setState({ view: 'people' });
    await mountRoute(renderPeopleView);
  });

  registerRoute('/dialogue/:characterId', async ({ params }) => {
    setState({ view: 'dialogue' });
    await mountRoute((root) => renderDialogueView(root, params.characterId));
  });

  registerRoute('/archive', async () => {
    setState({ view: 'archive' });
    await mountRoute(renderArchiveView);
  });

  registerRoute('/timeline', async () => {
    setState({ view: 'timeline' });
    await mountRoute(renderTimelineView);
  });

  registerRoute('/deduction', async () => {
    setState({ view: 'deduction' });
    await mountRoute(renderDeductionView);
  });

  registerRoute('/ending', async () => {
    setState({ view: 'ending' });
    await mountRoute(renderEndingView);
  });

  registerRoute('/ending/:caseId', async ({ params }) => {
    setState({ view: 'ending' });
    await mountRoute((root) => renderEndingView(root, params.caseId));
  });

  registerRoute('/settings', async () => {
    setState({ view: 'settings' });
    await mountRoute(renderSettingsView);
  });

  registerRoute('/credits', async () => {
    setState({ view: 'credits' });
    await mountRoute(renderCreditsView);
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

  if (bootNotice) {
    window.setTimeout(() => showToast(bootNotice), 400);
  }
}

boot();
