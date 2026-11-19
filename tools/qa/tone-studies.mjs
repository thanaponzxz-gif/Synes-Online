// Renders the 10 tone studies at the gameplay camera. Usage: node tools/qa/tone-studies.mjs <baseUrl> <outDir> [extraQuery]
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';
import fs from 'node:fs';
const [base = 'http://localhost:8080', out = 'docs/art/tones', extra = ''] = process.argv.slice(2);
export const PLAN = [
  ['01', 'dewlight', 'trail'], ['02', 'blossom', 'town'], ['03', 'amber', 'shop'], ['04', 'prism', 'town'], ['05', 'dusk', 'trail'],
  ['06', 'moonpetal', 'mystery'], ['07', 'mistvale', 'mystery'], ['08', 'stormglass', 'combat'], ['09', 'frostchime', 'shop'], ['10', 'verdant', 'clearing'],
];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const meta = [];
for (const [n, tone, scene] of PLAN) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${base}/?study=${scene}&tone=${tone}&q=high${extra}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__studyReady, null, { timeout: 60000 });
  const info = await page.evaluate(() => window.__studyReady);
  const file = `${out}/${n}-${tone}-${scene}.png`;
  await page.screenshot({ path: file });
  meta.push({ n, tone, scene, file, ...info, errors: errs });
  console.log(JSON.stringify(meta.at(-1)));
  await ctx.close();
}
fs.writeFileSync(`${out}/render-log.json`, JSON.stringify(meta, null, 2));
await browser.close();
