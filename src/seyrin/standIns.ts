// TEMPORARY, dev playtest only (owner order 2026-11-28: "put the main character in the game so I can test now").
// The P1 file has six of the twenty clips. DES-009 §3.2 says a missing clip gets no stand-in; the owner asked to play before
// the other fourteen exist, so here each missing clip borrows the nearest one the file has. This is a deviation from the
// design that team A reviews afterwards, and it goes away when the full file arrives (nothing is replaced then).
// Presentation only: the sim's timing, hits and cancels are untouched.
import type { AnimPlan, ClipPose } from './animPlan.ts';
import { FULL_CLIPS, FPS } from './spec.ts';

/** missing clip -> the clip shown in its place (null: shown by nothing) */
export const STAND_INS: Record<string, string | null> = {
  ready: 'idle', walk: 'run',
  attack_02: 'attack_01',
  dodge_b: 'dodge_f', dodge_l: 'dodge_f', dodge_r: 'dodge_f',
  skill_echo_needle: 'attack_01', skill_resonant_knot: 'attack_03', ult_lumen_loom: 'attack_03',
  potion: 'idle', hit_add: null, down: 'idle', respawn: 'idle', victory: 'idle',
};
const SECONDS: Record<string, number> = Object.fromEntries(FULL_CLIPS.map((c) => [c.name, c.ticks / FPS]));

/** the plan with every clip the file lacks replaced by its stand-in at the same fraction of the clip; `used` = what was replaced */
export function standIn(plan: AnimPlan, have: ReadonlySet<string>): { plan: AnimPlan; used: string[] } {
  const used = new Set<string>();
  const group = (poses: readonly ClipPose[]): ClipPose[] => {
    const out: ClipPose[] = [];
    for (const p of poses) {
      if (have.has(p.clip)) { out.push(p); continue; }
      used.add(p.clip);
      const to = STAND_INS[p.clip];
      if (to && have.has(to)) out.push({ clip: to, time: (p.time / SECONDS[p.clip]) * SECONDS[to], weight: p.weight });
    }
    return out;
  };
  const upper = group(plan.upper), lower = group(plan.lower), additive = group(plan.additive);
  if (!used.size) return { plan, used: [] };
  return { plan: { upper, lower, additive, pelvisLift: plan.pelvisLift }, used: [...used] };
}
