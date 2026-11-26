// Free roam (ruleset roam-1) render pieces. Reads the level data the sim uses (shared/data/roam.ts); never writes sim state.
//  - roamScatter: every solid obstacle gets its model exactly on the sim's collision circle; the map edge becomes dense forest with
//    rock cliffs at the north end and along the boss corridor; inside the meadow only walk-through small props (flowers, small bushes,
//    small crystals, mushrooms) are scattered, so nothing the player can see as solid lacks collision.
//  - makeRoamWater: the pond (water obstacles) painted into the ground canvas + one transparent shiny water mesh.
import { CircleGeometry, Mesh, MeshPhongMaterial, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LevelDef } from '../../shared/data/level.ts';

type Add = (name: string, x: number, z: number, s: number, rot: number) => void;

export function roamScatter(o: {
  L: LevelDef; bounds: { x0: number; x1: number; z0: number; z1: number }; dens: number; rnd: () => number; add: Add;
  field: (x: number, z: number) => number; path: (x: number, z: number) => number; treeMix: string[];
}) {
  const { L, bounds: B, rnd, add, field, path } = o;
  // 1. solid obstacles: model on the collision circle
  for (const ob of L.obstacles) if (ob.model) add(ob.model, ob.x, ob.z, ob.s ?? 1, ob.rot ?? 0);
  const nearObstacle = (x: number, z: number, pad: number) => L.obstacles.some((ob) => Math.hypot(x - ob.x, z - ob.z) < ob.r + pad);
  // 2. cliffs: big rocks in a band just outside the edge at the north end of the meadow and both sides of the boss corridor
  const cliffs: [number, number][] = [];
  const corridor = (x: number, z: number) => z < -52 && z > -67 && x > -10 && x < 6;
  for (let z = -36; z > -68; z -= 0.8) for (let x = B.x0 + 1; x < B.x1 - 1; x += 0.8) {
    const d = field(x, z);
    if (d < 1.3 || d > 3.4 || (!corridor(x, z) && z > -38)) continue;
    if (cliffs.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 2.7)) continue;
    cliffs.push([x, z]);
    const s = 1.9 + rnd() * 0.9;
    add('rock_a', x, z, s, rnd() * 6.28);
  }
  const cliffNear = (x: number, z: number) => cliffs.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 2.6);
  // the field camera looks toward -z from ~5.5 m behind the player: the band south of the camp is behind it (thin it out)
  const southZ = L.start.z + 8;
  // 3. forest wall: two staggered rows of trees following the edge (continuous, so the edge reads as "too thick to enter"),
  //    then a sparse forest behind; spacing-based, so the count stays close to the path-only level's tree count
  const trees: [number, number][] = [];
  const row = (lo: number, hi: number, gap: number, gapSouth: number, sc: number) => {
    for (let z = B.z0 + 1; z < B.z1 - 0.5; z += 0.7) for (let x = B.x0 + 0.5; x < B.x1 - 0.5; x += 0.7) {
      const jx = x + (rnd() - 0.5) * 0.6, jz = z + (rnd() - 0.5) * 0.6, d = field(jx, jz);
      if (d < lo || d > hi || cliffNear(jx, jz)) continue;
      const g = jz > southZ ? gapSouth : gap;
      if (trees.some(([tx, tz]) => Math.hypot(jx - tx, jz - tz) < g)) continue;
      trees.push([jx, jz]);
      add(o.treeMix[Math.floor(rnd() * o.treeMix.length)], jx, jz, sc + rnd() * 0.45, rnd() * 6.28);
    }
  };
  row(1.3, 2.6, 2.5, 4.5, 1.05);
  row(3.8, 5.4, 3.1, 9, 1.15);
  // 4. sparse forest behind + walk-through props inside the meadow
  const tries = Math.round(2600 * o.dens);
  for (let i = 0; i < tries; i++) {
    const x = B.x0 + rnd() * (B.x1 - B.x0), z = B.z0 + rnd() * (B.z1 - B.z0), r = rnd(), rot = rnd() * 6.28, k = rnd();
    const d = field(x, z);
    if (d >= 1.1) {
      if (cliffNear(x, z) || z > southZ) continue;
      if (d > 6.5 && r < (d < 14 ? 0.06 : 0.025)) add(d >= 14 ? 'tree_pine' : o.treeMix[Math.floor(k * o.treeMix.length)], x, z, 0.9 + rnd() * 0.5, rot);
      else if (d < 3.4 && r > 0.9) add('bush', x, z, 0.8 + k * 0.6, rot);
      continue;
    }
    if (d > -0.5 || path(x, z) < 0.6 || nearObstacle(x, z, 0.6)) continue;
    if (r < 0.03) add('bush', x, z, 0.45 + k * 0.3, rot);
    else if (r < 0.105) add('flower_patch', x, z, 0.8 + k * 0.6, rot);
    else if (r < 0.12) add('crystal_cluster', x, z, 0.35 + k * 0.25, rot);
    else if (r < 0.14) add('mushroom_glow', x, z, 0.7 + k * 0.5, rot);
  }
}

export interface RoamWater { mesh: Mesh; dispose(): void }
/** Paint the pond into the ground canvas (wet rim, depth gradient) and return one shiny transparent water surface (1 draw call). */
export function makeRoamWater(L: LevelDef, c: { g: CanvasRenderingContext2D; U: (x: number) => number; V: (z: number) => number; sx: number }): RoamWater | null {
  const ws = L.obstacles.filter((o) => o.kind === 'water');
  if (!ws.length) return null;
  const { g, U, V, sx } = c;
  g.save();
  // wet mud rim, then the water body (dark centre, lighter shallow edge)
  g.fillStyle = 'rgba(70,58,40,0.55)';
  for (const w of ws) { g.beginPath(); g.arc(U(w.x), V(w.z), (w.r + 0.45) * sx, 0, Math.PI * 2); g.fill(); }
  for (const w of ws) {
    const gr = g.createRadialGradient(U(w.x), V(w.z), 0, U(w.x), V(w.z), (w.r + 0.1) * sx);
    gr.addColorStop(0, '#1d4d63'); gr.addColorStop(0.7, '#2f7690'); gr.addColorStop(1, '#5fa9b6');
    g.fillStyle = gr; g.beginPath(); g.arc(U(w.x), V(w.z), (w.r + 0.1) * sx, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  const geos: BufferGeometry[] = ws.map((w, i) => { const ge = new CircleGeometry(w.r + 0.05, 48); ge.rotateX(-Math.PI / 2); ge.translate(w.x, 0.035 + i * 0.002, w.z); return ge; });
  const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos, false)!;
  if (geos.length > 1) for (const ge of geos) ge.dispose();
  const mat = new MeshPhongMaterial({ color: 0x4fb3cf, specular: 0xbff6ff, shininess: 90, transparent: true, opacity: 0.55, depthWrite: false });
  const mesh = new Mesh(geo, mat);
  mesh.renderOrder = 1; mesh.name = 'roam_water';
  return { mesh, dispose() { geo.dispose(); mat.dispose(); } };
}
