// Per-tick digest of a run: events + every actor's position/hp + player state. Used to prove `combat-1` is byte-identical across
// changes (tests/fixtures/combat1-golden.json was generated on the code BEFORE the combo-ruleset change).
import fs from 'node:fs';
import { World } from '../shared/sim/world.ts';
import { InputLog, type TickInput } from '../shared/sim/input.ts';
import { Bot } from './bot.ts';

export function fnv(s: string, h = 0x811c9dc5): number { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
/** Steps `w` with `inputs`; the digest covers events + actor state + the legacy-visible player state (ps minus fields added later). */
export function digestRun(w: World, inputs: Iterable<TickInput>, maxTicks = 30 * 60 * 8) {
  let h = 0x811c9dc5, n = 0;
  for (const inp of inputs) {
    const ev = w.step(inp);
    h = fnv(JSON.stringify(ev), h);
    h = fnv(w.actors.map((a) => `${a.x},${a.z},${a.hp},${a.state}`).join(';') + JSON.stringify(legacyPs(w.ps)), h);
    if (++n >= maxTicks || w.finished) break;
  }
  return { digest: h.toString(16), summary: w.summary() };
}
const NEW_PS_FIELDS = new Set(['swingTk', 'swingLen', 'hitTk']);
function legacyPs(ps: object) { return Object.fromEntries(Object.entries(ps).filter(([k]) => !NEW_PS_FIELDS.has(k))); }
export function* botInputs(w: World, bot: Bot, log?: InputLog): Generator<TickInput> { while (true) { const i = bot.think(w); log?.push(i); yield i; } }

export const GOLDEN_CASES: { id: string; run: () => { digest: string; summary: unknown } }[] = [
  ...[1, 2, 3, 5].flatMap((seed) => [0.7, 1.0].map((skill) => ({ id: `bot-s${seed}-k${skill}`, run: () => { const w = new World(seed); return digestRun(w, botInputs(w, new Bot(skill))); } }))),
  { id: 'bot-skills-s1', run: () => { const w = new World(1); return digestRun(w, botInputs(w, new Bot(1, { useSkills: true }))); } },
  { id: 'bot-boss-dodge26-s4', run: () => { const w = new World(4, { dodgeCdTicks: 26, start: 'boss' }); return digestRun(w, botInputs(w, new Bot(1))); } },
  { id: 'fixture-r3', run: () => { const r = JSON.parse(fs.readFileSync(new URL('./fixtures/r3-run.json', import.meta.url), 'utf8')); const w = new World(r.seed); return digestRun(w, InputLog.iterate(r.inputLog)); } },
];
