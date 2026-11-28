// Measures DES-007 §5.3's "looks natural" checks for the cloth solver on the TEST rig (tests/clothRig.ts: empty bones, not
// Codex's rig or rest shape). The numbers say how the design values behave in this solver; they are not a pass of Q4, which
// needs the real file. Prints a markdown table. CPU numbers are this PC's (Node), not a phone's.
// Run: node --experimental-strip-types --no-warnings tools/qa/seyrin-cloth.ts
import * as THREE from 'three';
import { ClothSolver, type ClothQuality } from '../../src/seyrin/cloth.ts';
import { clothRig, runCloth, maxBend, type Motion } from '../../tests/clothRig.ts';

const DEG = 180 / Math.PI;
const rows: [string, string][] = [];
const row = (k: string, v: string) => rows.push([k, v]);
const fresh = (q: ClothQuality = 'medium') => { const r = clothRig(); return { ...r, s: new ClothSolver(r.root, q) }; };
const local = (root: THREE.Object3D, w: THREE.Vector3) => root.worldToLocal(w.clone());

// 1. rest
{ const { root, s } = fresh(); runCloth(s, root, () => ({}), 2); row('ยืนนิ่ง 2 s: มุมงอสูงสุด', `${(maxBend(s) * DEG).toExponential(1)}°`); }

// 2. accelerate, then a steady run
{
  const { root, s } = fresh();
  const rest = local(root, s.tips()[0]).z;
  let t = runCloth(s, root, () => ({}), 0.2), back = 0, bend = 0;
  t = runCloth(s, root, (u) => ({ z: 5 * (u - 0.2) ** 2 }), 0.3, 60, t, () => { back = Math.max(back, rest - local(root, s.tips()[0]).z); bend = Math.max(bend, maxBend(s)); });
  row('เร่ง 10 m/s² 0.3 s: ปลายผ้าพันคอลู่หลังสูงสุด / มุมงอสูงสุด', `${back.toFixed(3)} m / ${(bend * DEG).toFixed(1)}°`);
  const z0 = root.position.z, v = 3;
  runCloth(s, root, (u) => ({ z: z0 + v * (u - t) }), 1.5, 60, t);
  row('ต่อด้วยความเร็วคงที่ 3 m/s 1.5 s: มุมงอสูงสุดตอนท้าย', `${(maxBend(s) * DEG).toFixed(2)}° (ผ้าห้อยกลับ ไม่ลู่หลังตอนความเร็วคงที่ เพราะ v01 ไม่มีลม/แรงต้านอากาศ)`);
}

// 3. stop from a run
{
  const { root, s } = fresh();
  const tStop = runCloth(s, root, (u) => ({ z: 5.2 * u }), 1.0), z1 = root.position.z;
  const last: Record<number, number> = { 1: tStop, 2: tStop, 5: tStop };
  let at1 = 0, peak = 0;
  runCloth(s, root, (u) => { const d = Math.min(u - tStop, 0.1); return { z: z1 + 5.2 * d - 26 * d * d }; }, 3, 60, tStop, (u) => {
    const b = maxBend(s) * DEG; peak = Math.max(peak, b);
    for (const k of [1, 2, 5]) if (b >= k) last[k] = u;
    if (Math.abs(u - tStop - 1) < 1e-6) at1 = b;
  });
  row('หยุดจาก 5.2 m/s ใน 0.1 s: มุมงอสูงสุดหลังหยุด', `${peak.toFixed(1)}°`);
  row('หยุดแล้ว: เวลาจนทุกข้อต่ำกว่า 5° / 2° / 1°', `${(last[5] - tStop).toFixed(2)} / ${(last[2] - tStop).toFixed(2)} / ${(last[1] - tStop).toFixed(2)} s`);
  row('หยุดแล้ว 1.0 s: มุมงอสูงสุด', `${at1.toFixed(2)}°`);
}

// 4. turns: a steady turn, at once, and as the view turns a model today (src/render/view.ts: min(1, dt*16) of what is left a frame)
const conflictsText = (c: Record<string, number>) => Object.entries(c).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(', ') || 'ไม่มี';
const sum = (a: Record<string, number>, b: Record<string, number>) => { for (const k in b) a[k] = (a[k] ?? 0) + b[k]; };
const turns: [string, Motion][] = [
  ['เลี้ยว 90° ใน 0.1 s (900°/s คงที่)', (u) => ({ yaw: Math.min(1, Math.max(0, (u - 0.2) / 0.1)) * (Math.PI / 2) })],
  ['เลี้ยว 90° ในเฟรมเดียว', (u) => ({ yaw: u > 0.2 + 1e-9 ? Math.PI / 2 : 0 })],
  ['เลี้ยว 180° ในเฟรมเดียว', (u) => ({ yaw: u > 0.2 + 1e-9 ? Math.PI : 0 })],
  ['เลี้ยว 180° แบบที่ view หมุนโมเดล', (u) => ({ yaw: Math.PI * (1 - Math.pow(1 - 16 / 60, Math.max(0, Math.round((u - 0.2) * 60)))) })],
];
for (const q of ['medium', 'low'] as const) for (const [name, turn] of turns) {
  const { root, s } = fresh(q);
  let snap = 0, flip = false, bend = 0;
  const c: Record<string, number> = {};
  runCloth(s, root, () => ({}), 0.2);
  runCloth(s, root, turn, 1.5, 60, 0.2, () => {
    snap = Math.max(snap, s.stats().maxSnapDeg); bend = Math.max(bend, maxBend(s)); sum(c, s.stats().conflicts);
    for (const tp of s.tips().slice(0, 4)) if (local(root, tp).z >= 0) flip = true;
  });
  row(`${name} (${q}): snap ต่อเฟรมสูงสุด / มุมงอสูงสุด / ปลายพลิกมาหน้าตัว / conflict`, `${snap.toFixed(1)}° / ${(bend * DEG).toFixed(1)}° / ${flip ? 'พลิก' : 'ไม่พลิก'} / ${conflictsText(c)}`);
}

// 5. dodges back to back (0.4 m per sim tick for ticks 0..8, every 24 ticks, alternating sides; render at 60 FPS)
for (const q of ['medium', 'low'] as const) {
  const { root, get, s } = fresh(q);
  let snap = 0, side = 0;
  const c: Record<string, number> = {};
  const dodgeX = (u: number) => { // even dodges go 0 → 3.6 m, odd ones come back
    const tick = u * 30, n = Math.floor(tick / 24), inDodge = Math.min(tick - n * 24, 9) * 0.4;
    return n % 2 ? 3.6 - inDodge : inDodge;
  };
  runCloth(s, root, (u) => ({ x: dodgeX(u) }), 4, 60, 0, () => {
    snap = Math.max(snap, s.stats().maxSnapDeg); sum(c, s.stats().conflicts);
    const px = get('pelvis').getWorldPosition(new THREE.Vector3()).x;
    for (const tp of s.tips().slice(0, 2)) side = Math.max(side, Math.abs(tp.x - px));
  });
  row(`หลบซ้ายขวาต่อเนื่อง (${q}): snap ต่อเฟรมสูงสุด / ปลายผ้าพันคอออกข้างสูงสุด / conflict`, `${snap.toFixed(1)}° / ${side.toFixed(3)} ม. / ${conflictsText(c)}`);
}

// 6. down: the ground plane against the cones. The test rig is only lowered (still upright, no down clip), so the hip chains
// start at the ground and their cones (sash 12°, tassels 18°) cannot lift them; the real check needs the real down pose.
{
  const { root, s } = fresh();
  runCloth(s, root, () => ({ y: -0.78 }), 0.5, 60, 0, undefined, { down: true, groundY: 0 });
  const low = (from: number, to: number) => Math.min(...s.points().filter((p) => p.chain >= from && p.chain <= to).map((p) => p.y));
  row('ล้ม (ตัวต่ำลง 0.78 m, พื้นกัน 0.02 m): จุดต่ำสุด ผ้าพันคอ / ผ้าเอว / พู่ · conflict', `${low(0, 1).toFixed(3)} / ${low(2, 3).toFixed(3)} / ${low(4, 5).toFixed(3)} m · ${conflictsText(s.stats().conflicts)}`);
}
// 6b. standing / running bounds of §5.3: the scarf tip from its anchor, every tip above the ground
{
  const { root, get, s } = fresh();
  let reach = 0, lowTip = Infinity;
  runCloth(s, root, (u) => ({ z: u < 1 ? 2.6 * u * u : 2.6 + 5.2 * (u - 1) }), 3, 60, 0, () => {
    const tips = s.tips();
    for (const [i, a] of [[0, 'anchor_scarf_l'], [1, 'anchor_scarf_r']] as const) reach = Math.max(reach, tips[i].distanceTo(get(a).getWorldPosition(new THREE.Vector3())));
    for (const tp of tips) lowTip = Math.min(lowTip, tp.y);
  });
  row('ยืน → วิ่ง 5.2 m/s: ปลายผ้าพันคอห่าง anchor สูงสุด (เกณฑ์ ≤ 0.65) / ปลายผ้าต่ำสุดจากพื้น (เกณฑ์ ≥ 0.12)', `${reach.toFixed(3)} / ${lowTip.toFixed(3)} ม. (rig ทดสอบ: ความสูงมาจาก rest ของ rig ทดสอบ)`);
}

// 7. CPU
for (const [q, dt, label] of [['medium', 1 / 60, 'Medium 60 FPS (1 step)'], ['medium', 4 / 60 - 1e-9, 'Medium 15 FPS (4 steps)'], ['low', 2 / 30 - 1e-9, 'Low 15 FPS (2 steps)']] as const) {
  const { root, s } = fresh(q);
  const ms: number[] = [];
  for (let i = 1; i <= 2000; i++) {
    root.position.z = 0.5 * Math.sin(i / 20); root.rotation.y = 0.5 * Math.sin(i / 33);
    const a = performance.now(); s.update(dt); ms.push(performance.now() - a);
  }
  ms.sort((x, y) => x - y);
  row(`CPU ${label}: median / p95 ต่อเฟรม`, `${ms[1000].toFixed(3)} / ${ms[1900].toFixed(3)} ms`);
}

console.log('| รายการ (rig ทดสอบ ไม่ใช่ rig จริง) | ผล |\n|---|---|');
for (const [k, v] of rows) console.log(`| ${k} | ${v} |`);
