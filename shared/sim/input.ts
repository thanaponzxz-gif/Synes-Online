// Quantized per-tick input. World-space movement (client rotates camera-relative input before quantizing).
//
// INPUT LOG FORMAT (ADR-002: the server replays the log; it never trusts a client result)
// -------------------------------------------------------------------------------------
// The log is a flat integer array of 4-tuples. Two versions exist and are told apart without ambiguity:
//
//  v1 (original, rounds 1-3; still accepted unchanged):  [count, mx, mz, b] ...
//     count 1..65535 = how many consecutive ticks carry the same input (run-length encoding),
//     mx / mz in -64..64 (AXIS), b = button bits 0..255 (BTN: ATTACK..ULT, all 8 bits used).
//     In v1 a count of 0 never occurs and is rejected.
//
//  v2 (Auto attack, DES-001 §4):  [0, 0, 2, 0]  <header, always the first tuple>
//                                 then a mix of
//                                   tick runs    [count>=1, mx, mz, b]      (exactly as v1)
//                                   commands     [0, op, a, b]              (count == 0 marks a command)
//     A command applies at the start of the NEXT tick run (i.e. at the tick index = sum of counts before it).
//     op 1 = AUTO_SET: a full snapshot of the Auto settings, packed by packAuto() in auto.ts
//            (a = enabled|hall<<1|skill1<<2|skill2<<3|skill3<<4|keep<<5, b = kindMask | radius<<8).
//     Header op 0 only appears once, at index 0. Any other opcode, a count-0 tuple in a log without the header, a command whose
//     fields do not decode to valid settings, or a trailing partial tuple makes the log malformed.
//
// Because the Auto controller itself lives in the sim (shared/sim/auto.ts) and is deterministic, the log only needs the SETTINGS
// changes (a few ints each): the walking / attacking Auto does is re-derived by the server's replay, tick for tick.
// A log that never uses Auto is written as plain v1 (the header is added lazily by the first command), so old servers/fixtures
// keep working for it.
import type { AutoCmd } from './auto.ts';
export type { AutoCmd } from './auto.ts';

export const AXIS = 64;
export const BTN = { ATTACK: 1, DODGE: 2, SKILL: 4, POTION: 8, RETRY: 16, SKILL2: 32, SKILL3: 64, ULT: 128 } as const;
/** `auto`: optional Auto-settings command that takes effect at the start of this tick (it is what goes into the log as a v2 command). */
export interface TickInput { mx: number; mz: number; b: number; auto?: AutoCmd; }
export const NO_INPUT: TickInput = { mx: 0, mz: 0, b: 0 };
export function quantize(x: number, z: number, b: number): TickInput {
  const q = (v: number) => Math.max(-AXIS, Math.min(AXIS, Math.round(v * AXIS)));
  return { mx: q(x), mz: q(z), b: b & 255 };
}

export const LOG_OP = { VERSION: 0, AUTO_SET: 1 } as const;
export const LOG_V2_HEADER = [0, LOG_OP.VERSION, 2, 0] as const;
/** true when the log starts with the v2 header tuple */
export const isV2Log = (d: ArrayLike<number>) => d.length >= 4 && d[0] === 0 && d[1] === LOG_OP.VERSION && d[2] === 2 && d[3] === 0;

/** Run-length encoded log (see the format notes at the top of the file). */
export class InputLog {
  data: number[] = [];
  ticks = 0;
  private v2 = false;
  push(i: TickInput) {
    if (i.auto) this.pushCmd(LOG_OP.AUTO_SET, i.auto.a, i.auto.b);
    const d = this.data, n = d.length;
    // never merge into a command tuple (count 0) — only into a previous tick run with the identical input
    if (n && d[n - 4] >= 1 && d[n - 3] === i.mx && d[n - 2] === i.mz && d[n - 1] === i.b && d[n - 4] < 65535) d[n - 4]++;
    else d.push(1, i.mx, i.mz, i.b);
    this.ticks++;
  }
  private pushCmd(op: number, a: number, b: number) {
    if (!this.v2) { this.data.unshift(...LOG_V2_HEADER); this.v2 = true; }
    this.data.push(0, op, a, b);
  }
  /** Plain ticks of a log, with Auto commands attached to the tick they apply to. Works for v1 and v2 (the server validates first). */
  static *iterate(data: number[]): Generator<TickInput> {
    let pending: AutoCmd | undefined;
    for (let k = isV2Log(data) ? 4 : 0; k + 3 < data.length; k += 4) {
      const c = data[k] | 0;
      if (c === 0) { if ((data[k + 1] | 0) === LOG_OP.AUTO_SET) pending = { a: data[k + 2] | 0, b: data[k + 3] | 0 }; continue; }
      const mx = data[k + 1] | 0, mz = data[k + 2] | 0, b = data[k + 3] | 0;
      for (let t = 0; t < c; t++) {
        if (t === 0 && pending) { yield { mx, mz, b, auto: pending }; pending = undefined; }
        else yield { mx, mz, b };
      }
    }
  }
}
