import { defineConfig } from 'vite';

// The design kit lives in public/assets and is served as-is at /assets,
// so Vite's own hashed output goes to /build to keep the two apart.
export default defineConfig({
  build: { assetsDir: 'build', target: 'es2022' },
});
