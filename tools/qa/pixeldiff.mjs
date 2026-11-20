// Exact pixel diff of two directories of PNGs with the same file names (decoded in a Chromium page, no extra deps).
// Usage: node tools/qa/pixeldiff.mjs <dirA> <dirB> [outJson]   -> prints "<file>: <n differing pixels> (max channel delta d)"
// Writes <dirB>/diff-<file>.png (differing pixels in red on a dimmed copy) only when a scene differs.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './pw.mjs';

const [a, b, outJson] = process.argv.slice(2);
const files = fs.readdirSync(a).filter((f) => f.endsWith('.png') && !f.startsWith('diff-') && fs.existsSync(path.join(b, f)));
const browser = await chromium.launch();
const page = await browser.newPage();
const res = {};
for (const f of files) {
  const r = await page.evaluate(async ({ x, y }) => {
    const load = async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return { c, d: g.getImageData(0, 0, c.width, c.height) }; };
    const A = await load(x), B = await load(y);
    if (A.c.width !== B.c.width || A.c.height !== B.c.height) return { size: [A.c.width, A.c.height, B.c.width, B.c.height] };
    let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const W = A.c.width; const out = new ImageData(A.c.width, A.c.height);
    for (let i = 0; i < A.d.data.length; i += 4) {
      const dl = Math.max(Math.abs(A.d.data[i] - B.d.data[i]), Math.abs(A.d.data[i + 1] - B.d.data[i + 1]), Math.abs(A.d.data[i + 2] - B.d.data[i + 2]));
      if (dl) { n++; max = Math.max(max, dl); const px = (i / 4) % W, py = Math.floor(i / 4 / W); x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); out.data.set([255, 0, 0, 255], i); } else out.data.set([B.d.data[i] >> 2, B.d.data[i + 1] >> 2, B.d.data[i + 2] >> 2, 255], i);
    }
    let png = null;
    if (n) { const c = document.createElement('canvas'); c.width = A.c.width; c.height = A.c.height; c.getContext('2d').putImageData(out, 0, 0); png = c.toDataURL('image/png').split(',')[1]; }
    return { n, max, bbox: n ? [x0, y0, x1, y1] : null, total: A.c.width * A.c.height, png };
  }, { x: fs.readFileSync(path.join(a, f)).toString('base64'), y: fs.readFileSync(path.join(b, f)).toString('base64') });
  if (r.png) fs.writeFileSync(path.join(b, 'diff-' + f), Buffer.from(r.png, 'base64'));
  delete r.png; res[f] = r;
  console.log(f + ':', r.size ? 'SIZE MISMATCH ' + r.size : `${r.n} px differ (max channel delta ${r.max}) of ${r.total}${r.bbox ? ' bbox ' + r.bbox : ''}`);
}
if (outJson) fs.writeFileSync(outJson, JSON.stringify(res, null, 1));
await browser.close();
