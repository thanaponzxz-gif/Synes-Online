// DES-009 §2.2: the pose viewer has its own clock (the world never ticks). One-shot clips play once and return to idle;
// time does not advance while paused or hidden and lost time is never made up; it is shown as 30 Hz tick-equivalents.
import { describe, it, expect } from 'vitest';
import { PreviewClock, PREVIEW_MAX_STEP } from '../src/seyrin/previewClock.ts';
import { PREVIEW_CLIPS } from '../src/seyrin/spec.ts';

const clock = () => new PreviewClock(PREVIEW_CLIPS);
const run = (c: PreviewClock, ticks: number) => { for (let i = 0; i < ticks; i++) c.advance(1 / 30, true); };

describe('PreviewClock', () => {
  it('starts on idle and wraps a looping clip', () => {
    const c = clock();
    expect(c.sample()).toEqual({ clip: 'idle', seconds: 0, tick: 0 });
    run(c, 47); expect(c.sample().tick).toBe(47);
    run(c, 1); expect(c.sample()).toMatchObject({ clip: 'idle', tick: 0 });
  });
  it('plays a one-shot clip once, shows its end key, then goes back to idle', () => {
    const c = clock();
    c.select('attack_01');
    run(c, 5); expect(c.sample()).toMatchObject({ clip: 'attack_01', tick: 5 });
    run(c, 6); expect(c.sample()).toMatchObject({ clip: 'attack_01', tick: 11 });
    run(c, 1); expect(c.sample()).toEqual({ clip: 'idle', seconds: 0, tick: 0 });
  });
  it('does not move while paused and continues from the same place', () => {
    const c = clock();
    c.select('attack_03'); run(c, 4); c.paused = true; run(c, 40);
    expect(c.sample()).toMatchObject({ clip: 'attack_03', tick: 4 });
    c.paused = false; run(c, 1);
    expect(c.sample().tick).toBe(5);
  });
  it('does not move while hidden, and the first frame back adds nothing (lost time is not made up)', () => {
    const c = clock();
    c.select('skill_shadow_thread'); run(c, 3);
    c.advance(5, false); c.advance(2.5, true);
    expect(c.sample()).toMatchObject({ clip: 'skill_shadow_thread', tick: 3 });
    run(c, 1); expect(c.sample().tick).toBe(4);
  });
  it('limits one long frame to PREVIEW_MAX_STEP seconds', () => {
    const c = clock();
    c.advance(10, true);
    expect(c.sample().seconds).toBeCloseTo(PREVIEW_MAX_STEP, 9);
  });
  it('steps by exactly one tick for marker checks, clamped for one-shot clips and wrapped for loops', () => {
    const c = clock();
    c.select('attack_01'); c.paused = true;
    c.step(-1); expect(c.sample().tick).toBe(0);
    for (let i = 0; i < 5; i++) c.step(1);
    expect(c.sample()).toMatchObject({ clip: 'attack_01', tick: 5 });
    expect(c.sample().seconds).toBeCloseTo(5 / 30, 9);
    for (let i = 0; i < 20; i++) c.step(1);
    expect(c.sample()).toMatchObject({ clip: 'attack_01', tick: 11 });
    c.select('run'); c.step(-1);
    expect(c.sample()).toMatchObject({ clip: 'run', tick: 9 });
  });
  it('selecting restarts at tick 0 and an unknown clip is an error', () => {
    const c = clock();
    c.select('dodge_f'); run(c, 4); c.select('dodge_f');
    expect(c.sample().tick).toBe(0);
    expect(() => c.select('walk')).toThrow(/walk/);
  });
});
