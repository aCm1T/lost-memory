/**
 * Register the production service worker.
 * Disabled in Vite dev to avoid cache confusion while debugging.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[pwa] New version ready. Reload to update.');
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[pwa] Service worker registration failed', error);
      });
  });
}
