// DES-008 §15.3 (D3-A): the time the game loop gives the number clock. src/main.ts calls numberClockInput() every rAF frame with
// its own state and the raw frame dt; here the same function feeds the real DOM-layer host (Floaters) frame by frame, the way main
// does, through visible -> hidden -> visible after a win. A hidden page, a pause or a QA freeze must give the numbers dt 0, also
// when the game is already finished (state 'done', where pause('hidden') does nothing).
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { installFakeDom, FakeElement } from './fakeDom.ts';
import { Floaters } from '../src/ui/floaters.ts';
import { numberClockInput, type LoopState } from '../src/ui/numberClock.ts';
import type { World, SimEvent } from '../shared/sim/world.ts';
import type { Rect } from '../src/ui/floatCore.ts';

beforeAll(() => installFakeDom(844, 390));
const K = 1000 / 30, TICK = 1 / 30;

/** the loop state main keeps, and one rendered frame the way main runs it: raw dt -> numberClockInput -> host frame */
function game() {
  const bodies = new Map<number, Rect>([[1, { l: 370, r: 470, t: 240, b: 330 }]]);
  const f = new Floaters(new FakeElement() as unknown as HTMLElement);
  f.setHost({
    actorRect: (id, out) => { const a = bodies.get(id); if (!a) return 1; Object.assign(out, a); return 0; },
    project: (_x, _y, _z, out) => { out.x = 422; out.y = 200; out.vis = true; return out; },
  });
  const make = () => ({ tick: 0, tele: [], actors: [{ id: 1, x: 3, z: 0 }], player: { id: 0, x: 0, z: 0 }, finished: false }) as unknown as World;
  const g = {
    f, world: make(), loop: { state: 'playing', qaFrozen: false, hidden: false, acc: 0, tick: TICK } as LoopState,
    frame(rawDt: number) { const n = numberClockInput(g.loop, rawDt); f.frame(g.world, n.alpha, n.dt, []); },
    hit(tick: number, amount: number) { g.world.tick = tick; f.take(g.world, [{ t: 'hit', byPlayer: true, crit: true, target: 1, amount } as SimEvent], () => true); },
    age: () => Math.max(0, f.book.clock - f.book.labels[0].born),
    /** the winning tick 20: its events, then the world is finished and main's state becomes 'done' */
    win() { g.world.tick = 19; g.loop.acc = TICK / 2; g.frame(1 / 60); g.hit(20, 40); (g.world as { finished: boolean }).finished = true; g.loop.state = 'done'; },
    newRun() { g.world = make(); g.loop.state = 'playing'; g.loop.acc = 0; },
  };
  g.frame(1 / 60);
  return g;
}

describe('DES-008 §15.3: the number clock while the page is hidden after a win (through the time main gives it)', () => {
  it('visible: age 0, then 100 ms · hidden with rAF frames still coming: age stays 100 · visible again: no catch-up, then it fades', () => {
    const g = game(); g.win();
    g.frame(0.2); expect(g.age()).toBeCloseTo(0, 9); // the first finished frame joins at tick 20 and adds no dt
    g.frame(0.1); expect(g.age()).toBeCloseTo(100, 9);
    g.loop.hidden = true; // state stays 'done': pause('hidden') returns at once when not playing
    for (let i = 0; i < 8; i++) g.frame(0.25); // a browser that keeps calling rAF while hidden (clamped 0.25 s each)
    expect(g.f.book.stats.retiredLife).toBe(0); // it did not live out its life unseen
    expect(g.age()).toBeCloseTo(100, 9);
    g.loop.hidden = false; // main resyncs `last` on visibilitychange, so the first visible frame carries one frame of time
    g.frame(1 / 60); expect(g.age()).toBeCloseTo(100 + 1000 / 60, 9);
    for (let i = 0; i < 3; i++) g.frame(0.25);
    expect(g.f.book.labels.length).toBe(0); expect(g.f.book.stats.retiredLife).toBe(1); // a Medium bonus lives 850 ms
  });
  it('paused or QA-frozen also give dt 0, in play and after the win', () => {
    for (const k of ['paused', 'qaFrozen'] as const) {
      const g = game(); g.win(); g.frame(0.2); g.frame(0.1);
      if (k === 'paused') g.loop.state = 'paused'; else g.loop.qaFrozen = true;
      for (let i = 0; i < 4; i++) g.frame(0.25);
      expect(g.age()).toBeCloseTo(100, 9);
    }
    expect(numberClockInput({ state: 'playing', qaFrozen: false, hidden: true, acc: 0, tick: TICK }, 0.1).dt).toBe(0);
    expect(numberClockInput({ state: 'playing', qaFrozen: false, hidden: false, acc: TICK / 2, tick: TICK }, 0.1)).toEqual({ alpha: 0.5, dt: 0.1 });
  });
  it('the result screen opening while hidden still clears everything (result-screen), and a restart takes no old batch', () => {
    const g = game(); g.win(); g.frame(0.2); g.frame(0.1);
    g.loop.hidden = true; g.frame(0.25);
    g.hit(20, 7); // a batch still waiting when the result screen opens
    g.f.resultScreen(g.world); g.frame(0.25);
    expect(g.f.book.labels.length).toBe(0);
    expect(g.f.book.stats).toMatchObject({ retiredSafety: 0, clearWhy: { 'result-screen': 1 } });
    g.loop.hidden = false; g.newRun(); g.frame(1 / 60);
    expect(g.f.book.labels.length).toBe(0); expect(g.f.book.stats.created).toBe(1);
    g.hit(1, 9); g.world.tick = 2; g.frame(1 / 60);
    expect(g.f.book.labels.map((l) => l.total)).toEqual([9]);
  });
  it('src/main.ts gives the number clock what numberClockInput() returns, with document.hidden', () => {
    const src = readFileSync('src/main.ts', 'utf8');
    expect(src).toMatch(/numberClockInput\(\{[^}]*hidden: document\.hidden/);
    expect(src).not.toMatch(/dt: state === 'paused' \|\| qaFrozen \? 0 : dt,\s*\}\);/);
  });
});
