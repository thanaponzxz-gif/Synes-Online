// Vertical slice: "Dewlight Glade" (ทุ่งน้ำค้างแสง). Path runs toward −Z (away from the camera) so the way ahead is visible.
import type { EnemyKind } from './tuning';

export type Shape =
  | { id: string; type: 'circle'; x: number; z: number; r: number; gate?: string }
  | { id: string; type: 'capsule'; ax: number; az: number; bx: number; bz: number; r: number; gate?: string };

/** Solid circle in the field (free-roam levels): the player and small enemies are pushed out of it. `model`/`s`/`rot` are read by the
 *  renderer only (kind 'prop' = collision for a landmark the renderer already draws, no model). rot is radians, render-only. */
export interface Obstacle { kind: 'tree' | 'rock' | 'ruin' | 'water' | 'prop'; x: number; z: number; r: number; model?: string; s?: number; rot?: number; }
export interface Gate { id: string; x: number; z: number; dirx: number; dirz: number; width: number; startsOpen: boolean; }

export interface LevelDef {
  id: string; nameTh: string; start: { x: number; z: number };
  /** ground plane extent (render) */
  bounds: { x0: number; x1: number; z0: number; z1: number };
  /** collision: the union of open shapes is where actors may stand */
  walkable: Shape[];
  /** render only: the dirt trail painted on the ground (== walkable for the path-only level) */
  paths: Shape[];
  obstacles: Obstacle[];
  /** true = free roam (open field + obstacles); false = the original path-only slice */
  roam: boolean;
  gates: Gate[];
  spawns: { kind: EnemyKind; x: number; z: number; group: string }[];
  clearingTrigger: { x: number; z: number; r: number };
  spring: { x: number; z: number; r: number };
  boss: { kind: EnemyKind; x: number; z: number; trigger: { x: number; z: number; r: number } };
  pillars: { x: number; z: number; r: number }[];
  autoZones: { id: string; nameTh: string; shapes: string[] }[];
}

const PATH_SHAPES: Shape[] = [
    { id: 'camp', type: 'circle', x: 0, z: 0, r: 7 },
    { id: 'trailA', type: 'capsule', ax: 0, az: -4, bx: 3, bz: -29, r: 3 },
    { id: 'clearing', type: 'circle', x: 3, z: -37, r: 8.5 },
    { id: 'trailC', type: 'capsule', ax: 3, az: -44, bx: -2, bz: -58, r: 3, gate: 'clearingExit' },
    { id: 'arenaEntry', type: 'capsule', ax: -2, az: -56, bx: -2, bz: -66, r: 3, gate: 'arenaEntry' },
    { id: 'arena', type: 'circle', x: -2, z: -76, r: 11.5 },
];

export const LEVEL: LevelDef = {
  id: 'dewlight-glade',
  nameTh: 'ทุ่งน้ำค้างแสง',
  start: { x: 0, z: 1.5 },
  bounds: { x0: -34, x1: 34, z0: -100, z1: 16 },
  walkable: PATH_SHAPES,
  paths: PATH_SHAPES,
  obstacles: [],
  roam: false,
  gates: [
    { id: 'clearingExit', x: 2.6, z: -45.2, dirx: 1, dirz: 0.25, width: 6, startsOpen: false },
    { id: 'arenaEntry', x: -2, z: -64.2, dirx: 1, dirz: 0, width: 6, startsOpen: true },
  ],
  spawns: [
    { kind: 'puffcap' as EnemyKind, x: 1.4, z: -16, group: 'trail' },
    { kind: 'puffcap' as EnemyKind, x: 2.6, z: -24, group: 'trail' },
    { kind: 'puffcap' as EnemyKind, x: 0, z: -38, group: 'clearing' },
    { kind: 'puffcap' as EnemyKind, x: 6.5, z: -36, group: 'clearing' },
    { kind: 'puffcap' as EnemyKind, x: 3.5, z: -41.5, group: 'clearing' },
    { kind: 'thornling' as EnemyKind, x: 4, z: -40, group: 'clearing' },
  ],
  clearingTrigger: { x: 3, z: -37, r: 6.5 },
  spring: { x: -0.4, z: -52, r: 2.2 },
  boss: { kind: 'prismback' as EnemyKind, x: -2, z: -80, trigger: { x: -2, z: -76, r: 10.2 } },
  pillars: [
    { x: -8.2, z: -70.5, r: 0.85 }, { x: 4.2, z: -70.5, r: 0.85 },
    { x: -8.2, z: -81.5, r: 0.85 }, { x: 4.2, z: -81.5, r: 0.85 },
  ],
  /** Auto attack zones (DES-001 §4 "ทั้งโถง"): groups of walkable shape ids before the boss. The boss approach ('arenaEntry') and the
   *  arena belong to no zone, so Auto is off there. Two zones may overlap near their junction; a point can be in more than one. */
  autoZones: [
    { id: 'path', nameTh: 'ค่ายและทางเดิน', shapes: ['camp', 'trailA'] },
    { id: 'clearing', nameTh: 'ลานกลาง', shapes: ['clearing'] },
    { id: 'exit', nameTh: 'ทางไปลานบอส', shapes: ['trailC'] },
  ],
  // decoration scatter is client-only (render), never affects the sim
};
