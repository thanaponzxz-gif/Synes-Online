// DES-008 §14.7 / §15.3: what the game loop (src/main.ts) gives the damage-number clock each rendered frame.
/** the loop state main keeps: game state, QA freeze, page hidden, the sim accumulator and the tick length (s) */
export interface LoopState { state: 'menu' | 'playing' | 'paused' | 'done'; qaFrozen: boolean; hidden: boolean; acc: number; tick: number }

/** alpha: 0..1 between ticks while the sim plays, null when it does not (paused / frozen / finished); dt: UI seconds of this frame,
 *  0 while the page is hidden, paused or QA-frozen, in every game state (after a win pause('hidden') does not change the state, so
 *  the hidden page is checked here). The time spent hidden is never added later: main resyncs its frame clock on visibilitychange. */
export function numberClockInput(s: LoopState, dt: number): { alpha: number | null; dt: number } {
  return {
    alpha: s.state === 'playing' && !s.qaFrozen ? Math.min(1, s.acc / s.tick) : null,
    dt: s.hidden || s.state === 'paused' || s.qaFrozen ? 0 : dt,
  };
}
