import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// One entry per page. Vite's own hashed output goes to /build so it stays clear of
// the files copied verbatim from public/.
export default defineConfig({
  // A multi-page site, not an app: without this the dev server quietly answers every unknown
  // path with the home page, which hides both typos and the 404.
  appType: 'mpa',
  build: {
    assetsDir: 'build',
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        '99ile': resolve(import.meta.dirname, 'work/99ile/index.html'),
        gateway: resolve(import.meta.dirname, 'work/local-llm-gateway/index.html'),
        writing: resolve(import.meta.dirname, 'writing/index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
});
