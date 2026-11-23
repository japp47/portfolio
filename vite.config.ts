import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// One entry per page. Vite's own hashed output goes to /build so it stays clear of
// the files copied verbatim from public/.
export default defineConfig({
  build: {
    assetsDir: 'build',
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        '99ile': resolve(import.meta.dirname, 'work/99ile/index.html'),
        gateway: resolve(import.meta.dirname, 'work/local-llm-gateway/index.html'),
      },
    },
  },
});
