// Pure-sim scan: which seeds give a boss fight where the scripted bot uses all 3 skills (on the boss) and wins, and how long it takes.
// Run: npx vite-node tools/qa/clip-seeds.ts [dodgeCdTicks=17] [bot skill=1]   (used to pick the seed for the boss-fight clip)
import { World } from '../../shared/sim/world.ts';
import { Bot } from '../../tests/bot.ts';

const cd = (+(process.argv[2] ?? 17) === 26 ? 26 : 17) as 17 | 26, lvl = +(process.argv[3] ?? 1) || 1;
for (let seed = 1; seed <= 40; seed++) {
  const w = new World(seed, { dodgeCdTicks: cd, start: 'boss' }), bot = new Bot(lvl, { useSkills: true });
  const hit = [0, 0, 0], bossHit = [0, 0, 0], at: number[][] = [[], [], []];
  while (!w.finished && w.tick < 30 * 150) {
    for (const e of w.step(bot.think(w))) if (e.t === 'skill-hit') { hit[e.slot - 1]++; if (e.hits > 0) bossHit[e.slot - 1]++; at[e.slot - 1].push(w.tick); }
  }
  console.log(`seed ${seed}: ${w.finished ? 'end' : 'timeout'} tick ${w.tick} (${(w.tick / 30).toFixed(1)}s) victory=${(w as any).victory ?? '?'} deaths=${w.stats.deaths} hits(slot1/2/3)=${hit.join('/')} withTargets=${bossHit.join('/')} first=${at.map((a) => a[0] ?? '-').join('/')}`);
}
