// Dev server only (vite `apply: 'serve'`): hands the private Seyrin P1 pair from an inbox folder on this machine to the page at
// /__seyrin/hero.glb and /__seyrin/hero.manifest.json, to a browser on this machine only (with SYNES_SEYRIN_LAN=1 also to a
// private home-network address; a public address is always refused). The files are git-ignored and are
// never copied, bundled or written anywhere: `vite build` does not run this plugin, so dist/ cannot contain them.
// Folder: SYNES_SEYRIN_DIR, else assets/_inbox of this checkout. File stem: SYNES_SEYRIN_STEM (default below).
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const STEM = 'char_hero001_ninja_preview_v01';
import { inboxAllowed } from '../../src/seyrin/gate.ts';

/** SYNES_SEYRIN_LAN=1: also serve a private (home network) address, for the owner's phone on the same Wi-Fi; never a public one */
export const seyrinLan = () => process.env.SYNES_SEYRIN_LAN === '1';

/** SYNES_SEYRIN_PUBLIC=1 on `vite build`: the owner's public Seyrin test page (owner order 2026-11-28, DES-009 §10.14). The pair is
 *  written next to the page as seyrin-hero/hero.glb + hero.manifest.json. Without the flag a build carries neither. */
export const seyrinPublic = () => process.env.SYNES_SEYRIN_PUBLIC === '1';
export function seyrinPublicFiles(): Plugin {
  return {
    name: 'synes-seyrin-public',
    apply: 'build',
    generateBundle() {
      if (!seyrinPublic()) return;
      const dir = path.resolve(process.env.SYNES_SEYRIN_DIR || 'assets/_inbox'), stem = path.basename(process.env.SYNES_SEYRIN_STEM || STEM);
      this.emitFile({ type: 'asset', fileName: 'seyrin-hero/hero.glb', source: fs.readFileSync(path.join(dir, `${stem}.glb`)) });
      this.emitFile({ type: 'asset', fileName: 'seyrin-hero/hero.manifest.json', source: fs.readFileSync(path.join(dir, `${stem}.manifest.json`)) });
    },
  };
}

export function seyrinInbox(): Plugin {
  return {
    name: 'synes-seyrin-inbox',
    apply: 'serve',
    configureServer(server) {
      const dir = path.resolve(process.env.SYNES_SEYRIN_DIR || 'assets/_inbox');
      const stem = path.basename(process.env.SYNES_SEYRIN_STEM || STEM);
      const files: Record<string, [string, string]> = {
        '/__seyrin/hero.glb': [`${stem}.glb`, 'model/gltf-binary'],
        '/__seyrin/hero.manifest.json': [`${stem}.manifest.json`, 'application/json'],
      };
      server.middlewares.use((req, res, next) => {
        const hit = files[(req.url ?? '').split('?')[0]];
        if (!hit) return next();
        res.setHeader('cache-control', 'no-store');
        if (!inboxAllowed(req.socket.remoteAddress, seyrinLan())) { res.statusCode = 403; return res.end('this machine only'); }
        const file = path.join(dir, hit[0]);
        if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('no Seyrin file in the inbox'); }
        res.setHeader('content-type', hit[1]);
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}
