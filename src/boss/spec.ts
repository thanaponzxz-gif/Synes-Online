// The delivery contract of the crab boss picture (DES-010 §3.1, §3.2, §3.4), copied from the design.
// A separate contract from the hero's (`synes.hero-manifest/1`): a boss file never goes through the hero checker.
// Presentation only: the sim keeps kind 'prismback' and every number of the fight (DES-010 §1).
export const FPS = 30;
export const BOSS_SCHEMA = 'synes.boss-manifest/1';
export const BOSS_PROFILE = 'prismback_crab_v01';
export const BOSS_RULESET = 'ninja-roam-1';
export type BossStage = 'preview' | 'combat';

export interface BossClipSpec {
  name: string; ticks: number; loop: boolean;
  markers: Record<string, number[]>; phases: Record<string, [number, number]>;
  poseHolds?: [number, number][]; holdLast?: boolean;
}
const clip = (name: string, ticks: number, loop: boolean, phases: Record<string, [number, number]>, extra: Partial<BossClipSpec> = {}): BossClipSpec =>
  ({ name, ticks, loop, markers: {}, phases, ...extra });

/** §3.2: the ten clips of C1 (`stage: 'combat'`) */
export const COMBAT_CLIPS: readonly BossClipSpec[] = [
  clip('idle', 48, true, { loop: [0, 48] }),
  clip('walk', 24, true, { loop: [0, 24] }, { markers: { step: [0, 12] } }),
  clip('sweep', 51, false, { windup: [0, 30], recover: [30, 51] }, { markers: { impact: [30] }, poseHolds: [[30, 31]] }),
  clip('slam', 60, false, { windup: [0, 30], recover: [30, 60] }, { markers: { impact: [30] }, poseHolds: [[30, 31]] }),
  clip('charge_windup', 30, false, { windup: [0, 30] }, { markers: { release: [30] } }),
  clip('charge', 12, true, { loop: [0, 12] }),
  clip('shard_cast', 45, false, { cast: [0, 27], recover: [27, 45] }, { markers: { castAccent: [9] } }),
  clip('stunned', 30, true, { loop: [0, 30] }),
  clip('roar', 33, false, { once: [0, 33] }),
  clip('down', 12, false, { once: [0, 12] }, { holdLast: true }),
];
/** §3.2: C0 is look-only, two clips; it never passes as `combat` */
export const PREVIEW_CLIPS: readonly BossClipSpec[] = COMBAT_CLIPS.filter((c) => c.name === 'idle' || c.name === 'walk');
export const STAGE_CLIPS: Record<BossStage, readonly BossClipSpec[]> = { preview: PREVIEW_CLIPS, combat: COMBAT_CLIPS };

const leg = (n: string): [string, string][] => [[`leg_${n}_upper`, 'body'], [`leg_${n}_lower`, `leg_${n}_upper`], [`leg_${n}_foot`, `leg_${n}_lower`]];
/** §3.1: the 22 bones, [name, parent] */
export const BOSS_BONES: readonly (readonly [string, string | null])[] = [
  ['root', null], ['body', 'root'], ['shell', 'body'], ['head', 'body'],
  ['arm_l', 'body'], ['claw_l', 'arm_l'], ['pincer_l', 'claw_l'], ['arm_r', 'body'], ['claw_r', 'arm_r'], ['pincer_r', 'claw_r'],
  ...leg('fl'), ...leg('fr'), ...leg('bl'), ...leg('br'),
];
/** §3.1: sockets are empty nodes, not joints: socket -> direct parent */
export const BOSS_SOCKETS: Record<string, string> = {
  socket_fx_ground: 'root', socket_fx_shell: 'shell', socket_fx_claw_l: 'claw_l', socket_fx_claw_r: 'claw_r', socket_fx_head: 'head',
};
/** §3.1 budget and §2.2 / §5.3 sizes */
export const BOSS_BUDGET = {
  trisTarget: 8000, trisMax: 10000, materialsMax: 1, primitivesMax: 1, jointsMax: 22, influencesMax: 4,
  baseColor: 1024, orm: 512, bytesTarget: 1.5 * 1024 * 1024, bytesMax: 2 * 1024 * 1024,
  bindRadiusMaxM: 1.8, topM: 2.84, topTolM: 0.1, feetTolM: 0.01,
} as const;
