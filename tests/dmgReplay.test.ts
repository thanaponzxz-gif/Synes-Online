// R3-4 harness check: a frame trace recorded by the real DOM host, replayed through FloatBook (tools/qa/dmg-replay.mjs), must give the
// same placements and the same ends as the live host. That is what lets one recorded game be replayed with only the side inset changed.
import { describe, it, expect, beforeAll } from 'vitest';
import { installFakeDom, FakeElement } from './fakeDom.ts';
// @ts-ignore plain-JS QA tool without types
import { replay } from '../tools/qa/dmg-replay.mjs';
import { Floaters } from '../src/ui/floaters.ts';
import type { World, SimEvent } from '../shared/sim/world.ts';
import type { Rect, Attempt } from '../src/ui/floatCore.ts';

beforeAll(() => installFakeDom(844, 390));

/** a tall target whose above spot is off the top edge, so numbers go to the sides; areas can close in */
function record() {
  const bodies = new Map<number, Rect>([[1, { l: 370, r: 470, t: 40, b: 330 }]]);
  const f = new Floaters(new FakeElement() as unknown as HTMLElement);
  f.setHost({
    actorRect: (id, out) => { const a = bodies.get(id); if (!a) return 1; Object.assign(out, a); return 0; },
    project: (_x, _y, _z, out) => { out.x = 422; out.y = 200; out.vis = true; return out; },
  });
  const make = () => ({ tick: 0, tele: [], actors: [{ id: 1, x: 3, z: 0 }], player: { id: 0, x: 0, z: 0 }, finished: false }) as unknown as World;
  let world = make();
  f.record(true);
  const draw = (tick: number, alpha: number | null = 0, dt = 1 / 60) => { world.tick = tick; f.frame(world, alpha, dt, []); };
  const hit = (tick: number, amount: number) => { world.tick = tick; f.take(world, [{ t: 'hit', byPlayer: true, crit: false, target: 1, amount } as SimEvent], () => true); };
  draw(0); f.drain();
  f.qaTrace(true);
  // both side lanes end just above the preferred y (185), so the free band's end decides where a number goes
  const base = [{ l: 480, r: 600, t: 215, b: 390 }, { l: 240, r: 360, t: 215, b: 390 }];
  f.qaBlockers(base);
  // run 1: a number on each side, then an area closes in on the first side lane and retires it
  hit(1, 5); draw(2, 0.5); draw(3, 0.5); hit(8, 6); draw(9, 0.2);
  f.qaBlockers([...base, { l: 480, r: 600, t: 120, b: 230 }]); draw(10, 0.4); f.qaBlockers(base);
  for (let t = 11; t < 40; t += 2) draw(t, 0.5);
  hit(41, 7); draw(42, 0.5);
  // victory: the result screen clears what is left
  world.finished = true; draw(43, 1); f.resultScreen(world); draw(43, 1);
  // retry: a new world starts its clock at 0
  world = make(); draw(0); hit(2, 9); draw(3, 0.5); draw(4, 0.5);
  const live = f.drain();
  return { trace: f.qaTakeTrace(), boxes: f.qaTraceBoxes(), live, stats: f.book.stats };
}

const key = (a: Attempt) => ({ t: a.t, uid: a.uid, result: a.result, R: a.R && { l: a.R.l, t: a.R.t, r: a.R.r, b: a.R.b }, n: a.n });
const endKey = (e: { uid: number; cause: string; why: string; readable: boolean }) => ({ uid: e.uid, cause: e.cause, why: e.why, readable: e.readable });

describe('QA replay of a recorded frame trace', () => {
  it('the same inset gives the same placements, ends and counters as the live host', () => {
    const { trace, boxes, live } = record();
    const r = replay(trace, { boxes, inset: 7.5 });
    expect(r.missing).toEqual([]);
    expect(live.attempts.filter((a) => a.uid).length).toBeGreaterThanOrEqual(3);
    expect(r.attempts.map(key)).toEqual(live.attempts.map(key));
    expect(r.ends.map(endKey)).toEqual(live.ends.map(endKey));
    expect(live.ends.some((e) => e.cause === 'safety')).toBe(true);
    expect(live.ends.some((e) => e.cause === 'clear' && e.why === 'result-screen') || live.ends.some((e) => e.cause === 'clear')).toBe(true);
  });
  it('inset 0 (the round-2 rule) replays the same events on the same geometry with other side positions', () => {
    const { trace, boxes } = record();
    const a = replay(trace, { boxes, inset: 7.5 }), b = replay(trace, { boxes, inset: 0 });
    expect(b.attempts.map((x: Attempt) => x.t)).toEqual(a.attempts.map((x: Attempt) => x.t));
    const side = (list: Attempt[]) => list.filter((x) => x.result === 'right' || x.result === 'left').map((x) => (x.R!.t + x.R!.b) / 2);
    expect(side(a.attempts).length).toBeGreaterThan(0);
    expect(side(b.attempts)).not.toEqual(side(a.attempts));
  });
  it('leaves the production inset as it found it', async () => {
    const { LAYOUT } = await import('../src/ui/floatCore.ts');
    const { trace, boxes } = record();
    replay(trace, { boxes, inset: 0 });
    expect(LAYOUT.inset).toBe(7.5);
  });
});
