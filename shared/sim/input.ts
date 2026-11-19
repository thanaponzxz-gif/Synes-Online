// Quantized per-tick input. World-space movement (client rotates camera-relative input before quantizing).
export const AXIS = 64;
export const BTN = { ATTACK: 1, DODGE: 2, SKILL: 4, POTION: 8, RETRY: 16 } as const;
export interface TickInput { mx: number; mz: number; b: number; }
export const NO_INPUT: TickInput = { mx: 0, mz: 0, b: 0 };
export function quantize(x: number, z: number, b: number): TickInput {
  const q = (v: number) => Math.max(-AXIS, Math.min(AXIS, Math.round(v * AXIS)));
  return { mx: q(x), mz: q(z), b: b & 31 };
}
/** Run-length encoded log: flat array [count, mx, mz, b, count, mx, mz, b, ...] */
export class InputLog {
  data: number[] = [];
  ticks = 0;
  push(i: TickInput) {
    const d = this.data, n = d.length;
    if (n && d[n - 3] === i.mx && d[n - 2] === i.mz && d[n - 1] === i.b && d[n - 4] < 65535) d[n - 4]++;
    else d.push(1, i.mx, i.mz, i.b);
    this.ticks++;
  }
  static *iterate(data: number[]): Generator<TickInput> {
    for (let k = 0; k + 3 < data.length; k += 4) {
      const inp = { mx: data[k + 1] | 0, mz: data[k + 2] | 0, b: data[k + 3] | 0 };
      for (let c = 0; c < (data[k] | 0); c++) yield inp;
    }
  }
}
