import { defineConfig } from 'vite';
import { lostMemoryServiceWorkerPlugin } from './scripts/vite-sw-plugin.js';

export default defineConfig({
  base: '/lost-memory/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  plugins: [lostMemoryServiceWorkerPlugin()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
