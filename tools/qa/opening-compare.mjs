// Same-frame comparison images for docs/qa/opening-v01 from stage1-shots.mjs output dirs (one dir per option).
//   node tools/qa/opening-compare.mjs <outDir> <labelA>=<shotsDirA> <labelB>=<shotsDirB> ...
// Writes JPEG (q85: ffmpeg -q:v 3) stacks, top to bottom in the order given, each frame labelled in its top-right corner:
//   compare-<shot>.jpg for the 844 shots, plus <shot>-<label>.jpg for the 1672 opening start, and crops-844-medium.jpg
//   (crystal / gate / hair, 3x nearest-neighbour). Needs /usr/bin/ffmpeg with drawtext.
import fs from 'node:fs'; import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [outDir, ...pairs] = process.argv.slice(2);
const sets = pairs.map((p) => { const i = p.indexOf('='); return { label: p.slice(0, i), dir: p.slice(i + 1) }; });
fs.mkdirSync(outDir, { recursive: true });
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const ff = (args) => { const r = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', ...args]); if (r.status !== 0) throw new Error(r.stderr.toString()); };
const label = (l) => `drawtext=fontfile=${FONT}:text='${l}':x=w-tw-14:y=58:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6`;

const stack = (shot, name = shot) => {
  const files = sets.map((s) => path.join(s.dir, shot + '.png'));
  if (!files.every((f) => fs.existsSync(f))) return console.log('skip', shot);
  const inputs = files.flatMap((f) => ['-i', f]);
  const fc = sets.map((s, i) => `[${i}:v]${label(s.label)}[v${i}]`).join(';') + ';' + sets.map((_, i) => `[v${i}]`).join('') + `vstack=inputs=${sets.length}`;
  ff([...inputs, '-filter_complex', fc, '-q:v', '3', path.join(outDir, `compare-${name}.jpg`)]);
};
for (const shot of ['opening-start-844-medium', 'opening-start-844-medium-gray', 'opening-start-844-low', 'opening-start-844-low-gray', 'opening-walk2s-844-medium', 'opening-walk2s-844-medium-gray',
  'pathA-844-medium', 'pathA-844-low', 'plaza-844-medium', 'pool-844-medium']) stack(shot);
for (const s of sets) {
  const f = path.join(s.dir, 'opening-start-1672-medium.png');
  if (fs.existsSync(f)) ff(['-i', f, '-vf', label(s.label), '-q:v', '3', path.join(outDir, `opening-start-1672-medium-${s.label}.jpg`)]);
}
// crops of the opening start 844 medium: first crystal (500,60)-(580,125), gate (400,20)-(490,70), hero head (370,195)-(470,260), 3x
const crops = [[500, 60, 80, 65], [400, 20, 90, 50], [370, 195, 100, 65]];
const rows = sets.map((s, i) => {
  const f = path.join(s.dir, 'opening-start-844-medium.png');
  const fc = crops.map(([x, y, w, h], k) => `[0:v]crop=${w}:${h}:${x}:${y},scale=${w * 3}:${195}:flags=neighbor,pad=${w * 3 + 8}:195:0:0:black[c${k}]`).join(';') + `;[c0][c1][c2]hstack=inputs=3,${label(s.label).replace('y=58', 'y=8')}`;
  const o = path.join(outDir, `_crop-${i}.png`); ff(['-i', f, '-filter_complex', fc, o]); return o;
});
ff([...rows.flatMap((r) => ['-i', r]), '-filter_complex', rows.map((_, i) => `[${i}:v]`).join('') + `vstack=inputs=${rows.length}`, '-q:v', '3', path.join(outDir, 'crops-844-medium.jpg')]);
for (const r of rows) fs.rmSync(r);
const total = fs.readdirSync(outDir).filter((f) => f.endsWith('.jpg')).reduce((a, f) => a + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`done: ${(total / 1048576).toFixed(2)} MB of JPEG in ${outDir}`);
