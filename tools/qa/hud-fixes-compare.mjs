// Before/after comparison images from two hud-fixes-shots.mjs runs (same scene, same tick).
//   node tools/qa/hud-fixes-compare.mjs <shotsDir> <outDir>
// <shotsDir> holds before-*.jpg and after-*.jpg. Landscape (and the top-HUD / swatch strips): before on top, after below.
// Portrait: before left, after right. A small BEFORE / AFTER tag sits at the bottom centre of each half. Shots that exist only
// for "after" (fadetip) are copied as they are. Output JPEG ~q85 (ffmpeg -q:v 3).
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';

const [dir, outDir] = process.argv.slice(2);
if (!dir || !outDir) { console.error('usage: hud-fixes-compare.mjs <shotsDir> <outDir>'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const FONT = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'].find((f) => fs.existsSync(f));
const tag = (t, size) => FONT ? `drawtext=fontfile=${FONT}:text=${t}:fontsize=${size}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4:x=(w-tw)/2:y=h-th-6` : 'null';
const names = fs.readdirSync(dir).filter((f) => f.startsWith('after-') && f.endsWith('.jpg')).map((f) => f.slice(6, -4));
for (const n of names) {
  const a = path.join(dir, `after-${n}.jpg`), b = path.join(dir, `before-${n}.jpg`), o = path.join(outDir, `${n}.jpg`);
  if (!fs.existsSync(b)) { fs.copyFileSync(a, path.join(outDir, `${n}-after.jpg`)); console.log(n, 'after only'); continue; }
  const portrait = /-P$/.test(n) && !n.startsWith('top');
  const big = n.startsWith('top') ? 24 : 13;
  const f = `[0]${tag('BEFORE', big)}[x];[1]${tag('AFTER', big)}[y];[x][y]${portrait ? 'hstack' : 'vstack'}=2`;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', b, '-i', a, '-filter_complex', f, '-q:v', '3', o]);
  if (r.status !== 0) { console.error(n, r.stderr.toString()); process.exitCode = 1; } else console.log(n, (fs.statSync(o).size / 1024).toFixed(0) + ' KB');
}
