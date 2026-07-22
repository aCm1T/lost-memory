const routes = [];
let renderRoute = null;

function normalizeHash(hash) {
  const raw = (hash || '#/home').replace(/^#/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return path === '/' ? '/home' : path;
}

function matchRoute(path) {
  for (const route of routes) {
    const paramNames = [];
    const pattern = route.path
      .replace(/:([A-Za-z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);
    if (!match) continue;
    const params = {};
    paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1]);
    });
    return { route, params };
  }
  return null;
}

export function registerRoute(path, handler) {
  routes.push({ path, handler });
}

export function navigate(path) {
  const next = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`;
  if (window.location.hash === next) {
    if (renderRoute) {
      renderRoute().catch((error) => console.error('Router render failed', error));
    }
    return;
  }
  window.location.hash = next;
}

export function getCurrentPath() {
  return normalizeHash(window.location.hash);
}

export function startRouter(onUnhandled) {
  const render = async () => {
    const path = getCurrentPath();
    const matched = matchRoute(path);
    if (!matched) {
      if (onUnhandled) onUnhandled(path);
      else navigate('/home');
      return;
    }
    await matched.route.handler({ path, params: matched.params });
  };

  renderRoute = render;

  window.addEventListener('hashchange', () => {
    render().catch((error) => {
      console.error('Router render failed', error);
    });
  });

  if (!window.location.hash) {
    window.location.hash = '#/home';
  } else {
    render().catch((error) => {
      console.error('Router render failed', error);
    });
  }

  return { render };
}

export function parsePathForTests(hash) {
  return normalizeHash(hash);
}

export function matchRouteForTests(path) {
  return matchRoute(path);
}

export function resetRouterForTests() {
  routes.length = 0;
  renderRoute = null;
}
