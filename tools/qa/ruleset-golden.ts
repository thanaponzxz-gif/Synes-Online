// Generates tests/fixtures/ruleset-golden.json: input logs + whole-state digests for every ruleset that existed before
// `ninja-roam-1` (DES-009 §3.4). It was generated at implementation base fc1ada5, BEFORE any change under shared/.
// ONLY run it again on code whose old rulesets are known good: it overwrites the proof.
// Run: node --experimental-strip-types --no-warnings tools/qa/ruleset-golden.ts
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { World } from '../../shared/sim/world.ts';
import { InputLog, BTN, quantize, type TickInput } from '../../shared/sim/input.ts';
import { tuningHash, type Ruleset } from '../../shared/sim/ruleset.ts';
import { DEFAULT_VARIANT, type RunVariant } from '../../shared/sim/variant.ts';
import { packAuto, defaultAuto } from '../../shared/sim/auto.ts';
import { Rng } from '../../shared/sim/rng.ts';
import { DIRS16 } from '../../shared/sim/math.ts';
import { Bot } from '../../tests/bot.ts';
import { runCase, levelFingerprint, enemyFingerprint, type GoldenCase } from '../../tests/rulesetDigest.ts';

const OLD: Ruleset[] = ['combat-1', 'combo-A', 'combo-B', 'combo-C', 'combat-2', 'roam-1'];

function record(ruleset: Ruleset, seed: number, variant: RunVariant, next: (w: World, i: number) => TickInput, maxTicks: number): number[] {
  const w = new World(seed, variant, ruleset), log = new InputLog();
  for (let i = 0; i < maxTicks && !w.finished; i++) { const inp = next(w, i); log.push(inp); w.step(inp); }
  return log.data;
}
/** Random but reproducible play: stick changes, every button (including ULT, which old rulesets ignore) and retries. */
function chaos(seed: number) {
  const r = new Rng(seed);
  let mx = 0, mz = 0;
  const BTNS = [BTN.ATTACK, BTN.ATTACK, BTN.ATTACK, BTN.DODGE, BTN.SKILL, BTN.SKILL2, BTN.SKILL3, BTN.POTION, BTN.RETRY, BTN.ULT];
  return (_w: World, i: number): TickInput => {
    if (i % 14 === 0) { const d = r.int(20); [mx, mz] = d < 16 ? DIRS16[d] : [0, 0]; if (r.next() < 0.35) [mx, mz] = [0, -1]; }
    const b = r.next() < 0.16 ? BTNS[r.int(BTNS.length)] : 0;
    return quantize(mx, mz, b);
  };
}
const autoRun = (_w: World, i: number): TickInput => ({ mx: 0, mz: 0, b: i % 40 === 0 ? BTN.RETRY : 0, ...(i === 0 ? { auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [true, true, true], keep: true }) } : {}) });

const cases: GoldenCase[] = [];
const add = (id: string, ruleset: Ruleset, seed: number, variant: RunVariant, next: (w: World, i: number) => TickInput, max: number) =>
  cases.push({ id: `${ruleset}/${id}`, ruleset, seed, variant, log: record(ruleset, seed, variant, next, max) });
for (const r of OLD) {
  const bot = new Bot(1, { useSkills: true });
  add('bot-skills-s1', r, 1, { ...DEFAULT_VARIANT }, (w) => bot.think(w), 30 * 60 * 4);
  const bossBot = new Bot(0.7);
  add('bot-boss-dodge26-s4', r, 4, { dodgeCdTicks: 26, start: 'boss' }, (w) => bossBot.think(w), 30 * 60 * 3);
  add('chaos-s7', r, 7, { ...DEFAULT_VARIANT }, chaos(70), 2400);
  add('chaos-boss-s9', r, 9, { dodgeCdTicks: 17, start: 'boss' }, chaos(90), 2400);
  add('auto-s3', r, 3, { ...DEFAULT_VARIANT }, autoRun, 1800);
}

const out = {
  implementationBase: execSync('git rev-parse HEAD').toString().trim(),
  sharedLastChanged: execSync('git log -1 --format=%H -- shared').toString().trim(),
  tuningHash: Object.fromEntries(OLD.map((r) => [r, tuningHash(r)])),
  level: Object.fromEntries(OLD.map((r) => [r, levelFingerprint(r)])),
  enemies: enemyFingerprint(),
  cases: cases.map((c) => ({ ...c, expect: runCase(c) })),
};
const head = JSON.stringify({ ...out, cases: undefined }, null, 1);
const body = out.cases.map((c) => '  ' + JSON.stringify(c)).join(',\n');
fs.writeFileSync(new URL('../../tests/fixtures/ruleset-golden.json', import.meta.url), head.replace(/\n}$/, `,\n "cases": [\n${body}\n ]\n}\n`));
console.log(out.cases.length, 'cases from', out.implementationBase);
for (const c of out.cases) console.log(c.id.padEnd(34), 'ticks', c.expect.ticks, JSON.stringify(c.expect.summary));
