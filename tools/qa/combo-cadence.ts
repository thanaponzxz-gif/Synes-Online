// Prints swing start/hit ticks while mashing attack, per ruleset (no enemies near). Run: npx vite-node tools/qa/combo-cadence.ts
import { World } from '../../shared/sim/world.ts';
import { BTN, NO_INPUT } from '../../shared/sim/input.ts';
import { RULESETS } from '../../shared/sim/ruleset.ts';
for (const r of RULESETS) {
  const w = new World(1, undefined, r), starts: number[] = [], hits: number[] = []; let done = true;
  for (let i = 0; i < 120; i++) {
    for (const e of w.step(i % 2 === 0 ? { mx: 0, mz: 0, b: BTN.ATTACK } : NO_INPUT)) if (e.t === 'swing') starts.push(i);
    if (w.ps.hitDone && !done) hits.push(i); done = w.ps.hitDone;
  }
  const gaps = starts.slice(1, 4).map((s, k) => s - starts[k]);
  console.log(r, 'starts', starts.slice(0, 7).join(','), '| hit-from-start', hits.slice(0, 6).map((h, k) => h - starts[k]).join(','), '| gaps 1-2,2-3,3-1', gaps.join('/'), '| combo ticks', starts[3] - starts[0]);
}
