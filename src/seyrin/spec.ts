// The delivery contract for Seyrin (Hero 001), copied from DES-007 rev 4 §6-8 and DES-009 §3.2/§4.
// The manifest FIELD NAMES are team B's proposal (DES lists the content, not the JSON keys) — to be confirmed by team A.
export const FPS = 30;
export const MANIFEST_SCHEMA = 'synes.hero-manifest/1';
export type Stage = 'preview' | 'full';

export interface ClipSpec {
  name: string; ticks: number; loop: boolean;
  markers?: Record<string, number[]>; poseHold?: [number, number];
  yLift?: { fromTick: number; peakTick: number; toTick: number; peakM: number };
  additive?: boolean; holdLast?: boolean;
}

const once = (name: string, ticks: number, extra: Partial<ClipSpec> = {}): ClipSpec => ({ name, ticks, loop: false, ...extra });
const loop = (name: string, ticks: number, extra: Partial<ClipSpec> = {}): ClipSpec => ({ name, ticks, loop: true, ...extra });

/** DES-009 §3.2: the six clips of the P1 preview. */
export const PREVIEW_CLIPS: readonly ClipSpec[] = [
  loop('idle', 48),
  loop('run', 10, { markers: { step: [0, 5] } }),
  once('attack_01', 11, { markers: { hit: [5] } }),
  once('attack_03', 18, { markers: { hit: [9] }, poseHold: [9, 10], yLift: { fromTick: 3, peakTick: 6, toTick: 9, peakM: 0.12 } }),
  once('skill_shadow_thread', 18, { markers: { dashStart: [3], dashEnd: [8] } }),
  once('dodge_f', 9),
];

/** DES-007 §8.2: all twenty clips of the playable version. */
export const FULL_CLIPS: readonly ClipSpec[] = [
  ...PREVIEW_CLIPS,
  loop('ready', 36),
  loop('walk', 24, { markers: { step: [0, 12] } }),
  once('attack_02', 12, { markers: { hit: [5] } }),
  once('dodge_b', 9), once('dodge_l', 9), once('dodge_r', 9),
  once('skill_echo_needle', 18, { markers: { emit: [5] } }),
  once('skill_resonant_knot', 24, { markers: { hit: [14] } }),
  once('ult_lumen_loom', 33, { markers: { hit: [9, 15, 21] } }),
  once('potion', 19, { markers: { heal: [18] } }),
  once('hit_add', 6, { additive: true }),
  once('down', 18, { holdLast: true }),
  once('respawn', 9),
  once('victory', 36),
];

export const STAGE_CLIPS: Record<Stage, readonly ClipSpec[]> = { preview: PREVIEW_CLIPS, full: FULL_CLIPS };

const sides = (...names: string[]) => names.flatMap((n) => [`${n}_l`, `${n}_r`]);
const chains = (name: string, count: number) => ['l', 'r'].flatMap((s) => Array.from({ length: count }, (_, i) => `${name}_${s}_0${i + 1}`));
export const BODY_BONES: readonly string[] = [
  'root', 'pelvis', 'spine_01', 'spine_02', 'chest', 'neck', 'head',
  ...sides('clavicle', 'upperarm', 'forearm', 'hand', 'thumb', 'grip', 'thigh', 'shin', 'foot', 'toe'),
];
export const CLOTH_BONES: readonly string[] = [...chains('scarf', 4), ...chains('sash', 3), ...chains('tassel', 2)];
/** DES-007 §6: 27 body bones (with root) + 18 cloth bones. */
export const BONES: readonly string[] = [...BODY_BONES, ...CLOTH_BONES];

export const WEAPON_NODE = 'weapon_katana';
/** socket -> required direct parent (DES-007 §6). */
export const SOCKETS: Record<string, string> = {
  socket_weapon_r: 'hand_r', socket_sheath: 'chest', socket_blade_base: WEAPON_NODE, socket_blade_tip: WEAPON_NODE,
  socket_throw_l: 'hand_l', socket_fx_chest: 'chest', socket_fx_ground: 'root',
};
/** cloth anchor -> bone it must hang under (any depth; the tassel anchors sit on the knot) (DES-007 §6). */
export const ANCHORS: Record<string, string> = {
  anchor_scarf_l: 'chest', anchor_scarf_r: 'chest', anchor_sash_l: 'pelvis', anchor_sash_r: 'pelvis',
  anchor_tassel_l: 'pelvis', anchor_tassel_r: 'pelvis',
};

/** DES-007 §7 / DES-009 §4. */
export const BUDGET = {
  trisMax: 10000, trisTarget: 8000, materialsMax: 2, primitivesMax: 2,
  bytesMax: 2 * 1024 * 1024, bytesTarget: 1.5 * 1024 * 1024, jointsMax: 48, baseColor: 1024, orm: 512,
} as const;
