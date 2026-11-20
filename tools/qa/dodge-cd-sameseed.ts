// Same-seed dodge cooldown comparison WITH skills (DES-001 §6.3). Scripted bot, boss start, 17 vs 26 ticks.
// Run: npx vite-node tools/qa/dodge-cd-sameseed.ts  → prints a markdown table (per seed + summary)
import { World } from '../../shared/sim/world.ts';
import { Bot } from '../../tests/bot.ts';
import { TICK } from '../../shared/data/tuning.ts';
type R = { win: boolean; t: number; dmg: number; deaths: number; dodges: number; blocked: number; hitsAfterBlocked: number };
function run(seed: number, cd: 17 | 26, skill: number): R {
  const w = new World(seed, { dodgeCdTicks: cd, start: 'boss' });
  const bot = new Bot(skill, { useSkills: true });
  let blocked = 0, hitsAfterBlocked = 0, lastBlocked = -999;
  const maxT = Math.round(180 / TICK);
  for (let i = 0; i < maxT && !w.finished; i++) {
    const inp = bot.think(w);
    const wantDodge = (inp.b & 2) !== 0, cdBefore = w.ps.dodgeCd;
    const ev = w.step(inp);
    if (wantDodge && cdBefore > 0 && !ev.some((e: any) => e.t === 'dodge')) { blocked++; lastBlocked = i; }
    if (ev.some((e: any) => e.t === 'hit' && !e.byPlayer) && i - lastBlocked <= 9) hitsAfterBlocked++;
  }
  const s = w.summary();
  return { win: s.victory, t: s.seconds, dmg: s.damageTaken, deaths: s.deaths, dodges: s.dodges, blocked, hitsAfterBlocked };
}
const seeds = Array.from({ length: 40 }, (_, i) => i + 1), skills = [0.7, 1.0];
const out: string[] = ['| bot | cd | wins | median s | mean dmg | deaths | dodges/run | blocked dodge presses/run | hits ≤9 tick after a blocked press |', '|---|---|---|---|---|---|---|---|---|'];
const perSeed: string[] = ['| seed | bot | 17: result / s / dmg | 26: result / s / dmg |', '|---|---|---|---|'];
for (const sk of skills) {
  const agg: Record<number, R[]> = { 17: [], 26: [] };
  for (const sd of seeds) {
    const a = run(sd, 17, sk), b = run(sd, 26, sk); agg[17].push(a); agg[26].push(b);
    if (sd <= 10) perSeed.push(`| ${sd} | ${sk} | ${a.win ? 'ชนะ' : 'แพ้'} / ${a.t.toFixed(1)} / ${a.dmg} | ${b.win ? 'ชนะ' : 'แพ้'} / ${b.t.toFixed(1)} / ${b.dmg} |`);
  }
  for (const cd of [17, 26] as const) {
    const r = agg[cd], ts = r.map((x) => x.t).sort((x, y) => x - y), m = (f: (x: R) => number) => (r.reduce((s, x) => s + f(x), 0) / r.length).toFixed(2);
    out.push(`| ${sk} | ${cd} | ${r.filter((x) => x.win).length}/${r.length} | ${ts[ts.length >> 1].toFixed(1)} | ${m((x) => x.dmg)} | ${m((x) => x.deaths)} | ${m((x) => x.dodges)} | ${m((x) => x.blocked)} | ${r.reduce((s, x) => s + x.hitsAfterBlocked, 0)} |`);
  }
}
console.log(out.join('\n') + '\n\nตัวอย่างรายซีด (10 ซีดแรก):\n' + perSeed.join('\n'));
