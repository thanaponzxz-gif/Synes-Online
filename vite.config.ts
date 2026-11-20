import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import { execSync } from 'node:child_process';
let rev = 'dev'; try { rev = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* no git */ }
export default defineConfig({
  define: { __BUILD__: JSON.stringify(`slice-1 · ${rev} · ${new Date().toISOString().slice(0, 10)}`) },
  base: './', // relative URLs so the build works from any sub-path (static host, artifact, CDN folder)
  build: { outDir: 'dist', target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 900, sourcemap: false },
  server: { host: true },
  // agent worktrees live under .claude/worktrees; never collect their copies of the tests
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
