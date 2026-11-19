// Bench hooks read by tools/qa/spike-bench.mjs
export function benchFrame(statEl: HTMLElement, label: string) {
  const w = window as any;
  if (!w.__bench) w.__bench = { firstFrame: performance.now(), frames: 0, t0: performance.now(), fps: 0 };
  const b = w.__bench; b.frames++;
  const now = performance.now();
  if (now - b.t0 > 1000) { b.fps = (b.frames * 1000) / (now - b.t0); b.frames = 0; b.t0 = now; statEl.textContent = `${label} ${b.fps.toFixed(0)} fps`; }
}
