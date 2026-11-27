// Engineering tracking (DES-008 §14.5 R3-5): what grows on the JS heap across game restarts. Heap snapshot after GC before and
// after N restarts of a bot game; objects grouped by type and constructor name (strings / code grouped by type), growth listed.
//   node tools/qa/dmg-heap.mjs <distRoot> <port> <restarts> [outFile]      (run from the repo root; PC Edge + SwiftShader only)
// No QA hooks of the number overlay are used, so it runs on builds from before DES-008 too.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const [root0, port, n, outFile] = process.argv.slice(2);
const root = path.resolve(root0);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(+port);
const edge = process.env.SYNES_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({ args: LAUNCH_ARGS, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
await context.addInitScript(() => localStorage.setItem('synes.quality', 'medium'));
const page = await context.newPage();
await page.goto(`http://localhost:${port}/?offline&autostart&seed=3&bot=1&botskills=1`);
await page.waitForFunction(() => window.__synes?.state === 'playing', null, { timeout: 90000 });
const cdp = await context.newCDPSession(page);

const gc = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); };
async function snapshot() {
  await gc();
  let text = '';
  const on = (e) => { text += e.chunk; };
  cdp.on('HeapProfiler.addHeapSnapshotChunk', on);
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  cdp.off('HeapProfiler.addHeapSnapshotChunk', on);
  const s = JSON.parse(text), f = s.snapshot.meta.node_fields, kinds = s.snapshot.meta.node_types[0], step = f.length;
  const iType = f.indexOf('type'), iName = f.indexOf('name'), iSize = f.indexOf('self_size'), iDet = f.indexOf('detachedness');
  const groups = new Map(); let total = 0, detached = 0;
  for (let i = 0; i < s.nodes.length; i += step) {
    const type = kinds[s.nodes[i + iType]], size = s.nodes[i + iSize];
    const key = type === 'object' || type === 'native' || type === 'closure' ? `${type}:${s.strings[s.nodes[i + iName]].slice(0, 80)}` : type;
    const g = groups.get(key) ?? { count: 0, bytes: 0 }; g.count++; g.bytes += size; groups.set(key, g); total += size;
    if (iDet >= 0 && s.nodes[i + iDet] === 2) detached++;
  }
  const usage = await cdp.send('Runtime.getHeapUsage');
  return { groups, totalMB: +(total / 1048576).toFixed(2), usedMB: +(usage.usedSize / 1048576).toFixed(2), detached };
}
const restart = async () => {
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector('#btn-restart').click());
  await page.waitForFunction(() => window.__synes.state === 'playing' && window.__synes.world.tick > 3, null, { timeout: 60000 });
};

await page.waitForTimeout(4000);
for (let i = 0; i < 2; i++) await restart(); // first-time caches settle
const a = await snapshot();
for (let i = 0; i < +n; i++) await restart();
const b = await snapshot();
const growth = [...new Set([...a.groups.keys(), ...b.groups.keys()])].map((k) => {
  const x = a.groups.get(k) ?? { count: 0, bytes: 0 }, y = b.groups.get(k) ?? { count: 0, bytes: 0 };
  return { key: k, countBefore: x.count, countAfter: y.count, count: y.count - x.count, kb: +((y.bytes - x.bytes) / 1024).toFixed(1) };
}).sort((p, q) => q.kb - p.kb);
const report = { build: path.basename(path.dirname(root)) + '/' + path.basename(root), restartsBetween: +n, before: { selfMB: a.totalMB, usedMB: a.usedMB, detachedNodes: a.detached },
  after: { selfMB: b.totalMB, usedMB: b.usedMB, detachedNodes: b.detached }, topGrowth: growth.slice(0, 30), topShrink: growth.slice(-5) };
if (outFile) fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ before: report.before, after: report.after }));
for (const g of report.topGrowth.slice(0, 15)) console.log(String(g.kb).padStart(8), 'KB', String(g.count).padStart(7), g.key);
await browser.close(); srv.close();
