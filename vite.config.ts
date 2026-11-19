import { defineConfig } from 'vite';
export default defineConfig({
  base: './', // relative URLs so the build works from any sub-path (static host, artifact, CDN folder)
  build: { outDir: 'dist', target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 900, sourcemap: false },
  server: { host: true },
});
