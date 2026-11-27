// DES-008 §10.6: heap / DOM across plain game restarts (no QA hooks of the number overlay, so it runs on old builds too)
//   node tools/qa/dmg-restartmem.mjs <distRoot> <port> <restarts>     (run from the repo root; PC Edge + SwiftShader only)
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http'; import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(path.resolve('tools/qa/pw.mjs')).href);
const { LAUNCH_ARGS } = await import(pathToFileURL(path.resolve('tools/qa/profiles.mjs')).href);
const [root0, port, n] = process.argv.slice(2); const root = path.resolve(root0);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f)); }).listen(+port);
const browser = await chromium.launch({ args: LAUNCH_ARGS, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
await context.addInitScript(() => localStorage.setItem('synes.quality', 'medium'));
const page = await context.newPage();
await page.goto(`http://localhost:${port}/?offline&autostart&seed=3&bot=1&botskills=1`);
await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
const cdp = await context.newCDPSession(page);
const measure = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); const h = await cdp.send('Runtime.getHeapUsage'), d = await cdp.send('Memory.getDOMCounters'); return { heapMB: +(h.usedSize / 1048576).toFixed(2), nodes: d.nodes, listeners: d.jsEventListeners, elements: await page.evaluate(() => document.getElementsByTagName('*').length) }; };
await page.waitForTimeout(4000);
const rows = [{ restart: 0, ...(await measure()) }];
for (let i = 1; i <= +n; i++) {
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector('#btn-restart').click());
  await page.waitForFunction(() => window.__synes.state === 'playing' && window.__synes.world.tick > 3, null, { timeout: 60000 });
  if (i === 1 || i % 5 === 0) rows.push({ restart: i, ...(await measure()) });
}
console.log(JSON.stringify(rows));
await browser.close(); srv.close();
