// Free roam (owner 2026-11-27, ruleset `roam-1`): the same glade, but the whole meadow is walkable. Trees, rocks, ruins and the pond
// are solid; the map edge is dense forest / cliffs (render). The boss arena is still entered through gates only.
// The old path stays as a painted dirt trail (render) so the way to the boss is still readable, and every spawn, trigger, checkpoint
// and the boss arena keep their old coordinates.
//
// STATUS: placeholder layout by team B so the mechanism can be played (owner order 2026-11-27). Field size, obstacle positions and
// the zone themes are design values for team A (REQ-006) — change them here only; tests/roam.test.ts checks the safety rules.
import { LEVEL, type LevelDef, type Obstacle, type Shape } from './level.ts';

/** walkable field: union of circles (organic outline). Ids camp/clearing are kept because Auto zones and QA refer to them. */
const FIELD: Shape[] = [
  { id: 'camp', type: 'circle', x: 0, z: 0, r: 8 },
  { id: 'meadowS', type: 'circle', x: -3, z: -10, r: 12 },
  { id: 'meadowE', type: 'circle', x: 11, z: -13, r: 10 },
  { id: 'meadowW', type: 'circle', x: -14, z: -26, r: 10.5 },
  { id: 'meadowC', type: 'circle', x: 2, z: -25, r: 11 },
  { id: 'clearing', type: 'circle', x: 3, z: -37, r: 8.5 },
  { id: 'meadowEE', type: 'circle', x: 14, z: -35, r: 9.5 },
  { id: 'meadowSW', type: 'circle', x: -13, z: -40, r: 9 },
  { id: 'meadowN', type: 'circle', x: -1, z: -47, r: 8.5 },
];

const tree = (x: number, z: number, model: string, s: number, rot: number): Obstacle => ({ kind: 'tree', x, z, r: +(0.5 * s).toFixed(2), model, s, rot });
const rock = (x: number, z: number, model: 'rock_a' | 'rock_b', s: number, rot: number): Obstacle =>
  ({ kind: 'rock', x, z, r: +((model === 'rock_a' ? 0.85 : 0.75) * s).toFixed(2), model, s, rot });
const column = (x: number, z: number, s: number, rot: number): Obstacle => ({ kind: 'ruin', x, z, r: +(0.8 * s).toFixed(2), model: 'ruin_column', s, rot });
const prop = (x: number, z: number, r: number): Obstacle => ({ kind: 'prop', x, z, r });

const OBSTACLES: Obstacle[] = [
  // meadow tree clumps
  tree(-9, -11, 'tree_round', 1.2, 0.4), tree(-11.5, -14, 'tree_round_b', 1.0, 2.1), tree(-8, -15.5, 'tree_pine', 1.0, 1.0),
  tree(12, -6, 'tree_round', 1.15, 3.0), tree(15, -9.5, 'tree_round_b', 1.0, 0.7), tree(11, -19, 'tree_pine', 1.1, 5.2),
  tree(16, -18, 'tree_round', 0.95, 1.8), tree(7, -15, 'tree_round_b', 0.9, 4.4), tree(-6, -20, 'tree_pine', 1.0, 2.6),
  tree(-17, -19, 'tree_round', 1.1, 0.2), tree(-8, -36, 'tree_round_b', 1.0, 3.7), tree(-17, -45, 'tree_pine', 1.2, 1.4),
  tree(-9, -47, 'tree_round', 1.0, 5.9), tree(6, -50, 'tree_round_b', 1.1, 2.9),
  // pond (west) + rim stones
  { kind: 'water', x: -15, z: -30, r: 3.4 }, { kind: 'water', x: -11, z: -32, r: 2.2 },
  rock(-18.6, -28, 'rock_a', 1.1, 0.9), rock(-12.5, -26.2, 'rock_b', 0.7, 2.4),
  // ruins (east)
  column(12, -31, 1.0, 0.3), column(16.5, -33, 1.1, 0.6), column(13, -39.5, 0.9, 2.1),
  rock(18, -38.5, 'rock_a', 1.6, 4.0), rock(20, -30, 'rock_a', 1.3, 1.2),
  // landmarks the renderer already draws (camp + trail lanterns): collision only
  prop(-3.6, -1.2, 1.25), prop(1.6, 1.2, 0.6), prop(2.6, -4.2, 0.3),
  prop(-3.93, 3.32, 0.42), prop(-5.07, 3.68, 0.42), prop(5.35, 3.43, 0.42), prop(4.25, 2.97, 0.42),
  prop(-2.4, -6, 0.22), prop(2.8, -10, 0.22), prop(6.5, -44, 0.22), prop(-0.4, -46, 0.22),
];

export const ROAM_LEVEL: LevelDef = {
  ...LEVEL,
  id: 'dewlight-glade-roam',
  walkable: [
    ...FIELD,
    // boss approach: a corridor out of the north end of the meadow; locked until the clearing is cleared (same rule as before)
    { id: 'approach', type: 'capsule', ax: -2, az: -54, bx: -2, bz: -60, r: 3, gate: 'clearingExit' },
    { id: 'arenaEntry', type: 'capsule', ax: -2, az: -58, bx: -2, bz: -66, r: 3, gate: 'arenaEntry' },
    { id: 'arena', type: 'circle', x: -2, z: -76, r: 11.5 },
  ],
  paths: LEVEL.walkable,
  obstacles: OBSTACLES,
  roam: true,
  gates: [
    { id: 'clearingExit', x: -2, z: -55.6, dirx: 1, dirz: 0, width: 6, startsOpen: false },
    { id: 'arenaEntry', x: -2, z: -64.2, dirx: 1, dirz: 0, width: 6, startsOpen: true },
  ],
  autoZones: [
    { id: 'field', nameTh: 'ทุ่งหญ้า', shapes: FIELD.map((s) => s.id) },
    { id: 'exit', nameTh: 'ทางไปลานบอส', shapes: ['approach'] },
  ],
};
