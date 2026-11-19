import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  root: 'spike', base: './',
  build: { outDir: '../dist-spike', emptyOutDir: true, target: 'es2022',
    rollupOptions: { input: { playcanvas: resolve(__dirname, 'spike/playcanvas/index.html'), three: resolve(__dirname, 'spike/three/index.html') } } },
});
