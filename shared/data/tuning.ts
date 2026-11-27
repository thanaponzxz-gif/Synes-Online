// All gameplay numbers live here. Tune from playtests; tests in tests/ guard fairness constraints.
export const TICK = 1 / 30;

export const PLAYER = {
  name: 'Wayfarer', radius: 0.42, maxHp: 120, speed: 5.2, attackMoveMul: 0.35,
  combo: [ // duration s, hit moment (fraction), damage, range m
    { dur: 0.32, hitAt: 0.4, dmg: 12, range: 2.3 },
    { dur: 0.32, hitAt: 0.4, dmg: 12, range: 2.3 },
    { dur: 0.5, hitAt: 0.45, dmg: 22, range: 2.6 },
  ],
  arcCos: 0.34, // ~70° half-arc
  comboResetS: 0.6, autoAimRange: 4.2, inputBufferS: 0.25,
  dodge: { dur: 0.3, speed: 12, iframes: 0.3, cooldown: 0.55 },
  perfect: { critMul: 1.5, skillCdRefund: 2 },
  skill: { name: 'Chime Burst', cast: 0.35, radius: 3.6, dmg: 34, cooldown: 8 },
  potion: { charges: 2, heal: 45, dur: 0.6 },
};

/** Active skills (DES-001 §2). Slot 1 = Chime Burst (legacy seconds-based code in world.ts: cast resolves on the 11th tick,
 *  i.e. 10 ticks after the start tick; cooldown timer 8 s needs 241 decrements). Slots 2-3 are integer-tick skills.
 *  Ticks are counted from the start tick (= 0). cdTicks = minimum ticks between two accepted presses. */
export interface SkillDef {
  slot: 1 | 2 | 3; id: 'chime' | 'crescent' | 'crystal'; nameTh: string; nameEn: string;
  cdTicks: number; prepTicks: number; hitTick: number; endTick: number;
  radius: number; cosHalf?: number; ahead?: number; dmg: number;
}
export const SKILLS: readonly SkillDef[] = [
  { slot: 1, id: 'chime', nameTh: 'ระฆังสะท้อน', nameEn: 'Chime Burst', cdTicks: 241, prepTicks: 10, hitTick: 10, endTick: 10, radius: PLAYER.skill.radius, dmg: PLAYER.skill.dmg },
  { slot: 2, id: 'crescent', nameTh: 'ฟันเสี้ยวจันทร์', nameEn: 'Crescent Cut', cdTicks: 135, prepTicks: 6, hitTick: 6, endTick: 12, radius: 3.0, cosHalf: 0.642788, dmg: 22 },
  { slot: 3, id: 'crystal', nameTh: 'ผลึกพิฆาต', nameEn: 'Crystal Break', cdTicks: 360, prepTicks: 15, hitTick: 15, endTick: 24, radius: 1.5, ahead: 2.6, dmg: 48 },
];
/** Ultimate: separate, locked slot in 2-B (no sim effect; BTN.ULT is ignored). */
export const ULT = { id: 'grand', nameTh: 'มหาระฆัง', nameEn: 'Grand Resonance', locked: true } as const;

/** Cone telegraphs also hit everything within this radius (m) of the origin, whatever the angle. Renderer draws the same disc. */
export const CONE_INNER_R = 1.2;

export type AttackShape = 'circle' | 'cone' | 'line';
export interface AttackDef { id: string; nameTh: string; shape: AttackShape; windup: number; dmg: number; r: number; w?: number; tipTh: string; }

export const ENEMIES = {
  puffcap: {
    nameTh: 'พัฟแคป', radius: 0.55, maxHp: 40, speed: 2.2, aggro: 7, attackRange: 3.2, recover: 1.0,
    attacks: { hop: { id: 'hop', nameTh: 'สปอร์กระโดด', shape: 'circle', windup: 1.2, dmg: 14, r: 1.7, tipTh: 'วงส้มคือจุดที่มันจะกระโดดลง ให้เดินออกนอกวงหรือกด ↯ ตอนวงใกล้เต็ม' } as AttackDef },
  },
  thornling: {
    nameTh: 'ธอร์นลิง', radius: 0.5, maxHp: 55, speed: 3.0, aggro: 9, attackRange: 7, recover: 1.2, rushSpeed: 14,
    attacks: { rush: { id: 'rush', nameTh: 'พุ่งหนาม', shape: 'line', windup: 0.9, dmg: 16, r: 7.5, w: 1.4, tipTh: 'แถบยาวคือแนวพุ่งชน ให้ก้าวออกด้านข้าง ไม่ใช่ถอยหลัง' } as AttackDef },
  },
  prismback: {
    nameTh: 'ปริซึมแบ็ก ผู้พิทักษ์ทุ่ง', radius: 1.9, maxHp: 1000, speed: 2.0, speedP2: 2.4, phase2At: 0.5,
    windupMulP2: 0.85, stunPillar: 2.6, stunMiss: 0.9, chargeSpeed: 15, stunDmgMul: 1.5, roar: 1.1,
    // phase 2: every shard rain is followed by a charge with a longer, earlier warning so the pillar lure stays the core beat
    p2FollowCharge: true, followChargeWindup: 1.35, shardStagger: 0.22, p2ShardEvery: 3, // rhythm: 2 moves → shard rain → charge
    attacks: {
      sweep: { id: 'sweep', nameTh: 'กวาดเขา', shape: 'cone', windup: 0.95, dmg: 18, r: 5.2, w: 0.5, tipTh: 'รูปพัดด้านหน้าบอส ให้หลบไปด้านข้างหรือด้านหลังบอส' } as AttackDef,
      slam: { id: 'slam', nameTh: 'กระแทกปริซึม', shape: 'circle', windup: 1.25, dmg: 26, r: 4.6, tipTh: 'วงทองรอบตัวบอส ให้วิ่งออกนอกวง หรือกด ↯ ตอนวงเต็ม' } as AttackDef,
      charge: { id: 'charge', nameTh: 'พุ่งคริสตัล', shape: 'line', windup: 1.0, dmg: 24, r: 18, w: 4.64, // = 2×(boss r 1.9 + player r 0.42): drawn width == hit width
        tipTh: 'ยืนหน้าเสาคริสตัลแล้วหลบด้านข้าง บอสจะชนเสาและมึนนาน' } as AttackDef,
      shard: { id: 'shard', nameTh: 'ฝนผลึก', shape: 'circle', windup: 1.0, dmg: 12, r: 1.5, tipTh: 'วงเล็กตกตามตำแหน่งคุณ ให้เคลื่อนที่ต่อเนื่อง อย่ายืนนิ่ง' } as AttackDef,
    },
  },
} as const;

export type EnemyKind = keyof typeof ENEMIES;
type Plain<T> = T extends AttackDef ? AttackDef : T extends number ? number : T extends string ? string : T extends boolean ? boolean : { readonly [K in keyof T]: Plain<T[K]> };
/** The shape of ENEMIES with plain number/string types: a ruleset may carry its own snapshot of it (`ninja-roam-1`). */
export type EnemyTable = Plain<typeof ENEMIES>;

/** Combo rulesets (DES-006 §1, REQ-003). `combat-1` = the shipped combo above (seconds, 62% chain window). The `combo-*` rulesets
 *  use INTEGER ticks at 30 Hz. dur = ticks per swing; hit = tick (counted from the swing's start tick = 0) at which the hit resolves.
 *  Damage, range and angle stay PLAYER.combo[step].dmg/range/arcCos. A swing can only be chained once it has ended (dur ticks). */
export const COMBO_TICKS = {
  bufferTicks: 8,   // attack input buffer (replaces 0.25 s)
  resetTicks: 18,   // idle ticks after the END of a swing before the combo resets (replaces 0.6 s)
  sets: {
    A: { dur: [12, 12, 18], hit: [5, 5, 8] },
    B: { dur: [13, 13, 20], hit: [6, 6, 9] },
    C: { dur: [15, 15, 22], hit: [6, 6, 10] },
  },
} as const;

/** Ruleset `ninja-roam-1` (DES-007 rev 4 §3, ADR-014): Seyrin. Baseline values from team A for a fun test, not a playtested
 *  balance. Integer ticks at 30 Hz; an action started on tick t0 runs on local ticks [0, end) and "hit 5" means tick t0+5. A
 *  cooldown is ready when now >= acceptedTick + cdTicks. Distances in m. The level and enemies of this ruleset are the roam-1
 *  snapshot in shared/data/ninjaStage.ts. Nothing here is read by the Wayfarer rulesets, and their tuning hashes do not cover it. */
export const NINJA = {
  id: 'seyrin', nameTh: 'เซย์ริน', radius: 0.42, maxHp: 120, speed: 5.2,
  dodgeFacingMode: 'hold-start', canJump: false,
  combo: {
    bufferTicks: 8, resetTicks: 18, moveMul: 0.35, aimRange: 3.0, cosHalf: 0.5,
    steps: [{ end: 11, hit: 5, dmg: 10, range: 1.9 }, { end: 12, hit: 5, dmg: 12, range: 2.0 }, { end: 18, hit: 9, dmg: 20, range: 2.2 }],
  },
  /** melee areas: within this distance of the target's edge (d <= r + touchPad) the angle is not checked */
  touchPad: 0.6,
  dodge: { end: 9, stepM: 0.4, lastMoveTick: 8, lastIframeTick: 8, lastPerfectTick: 2, cdTicks: 24 },
  counterEcho: { ticks: 90, mul: 1.5 },
  potion: { charges: 2, heal: 45, healTick: 18, end: 19, moveMul: 0.4 },
  needle: { id: 'echo_needle', slot: 1, releaseTick: 5, end: 18, cdTicks: 90, dmg: 16, radius: 0.12, stepM: 0.5, moves: 12 },
  shadow: { id: 'shadow_thread', slot: 2, firstDashTick: 3, lastDashTick: 8, stepM: 0.5, end: 18, cdTicks: 150, halfWidth: 0.45, dmg: 18 },
  knot: { id: 'resonant_knot', slot: 3, hit: 14, end: 24, cdTicks: 210, dmg: 32, stunnedBonus: 12, range: 2.5, cosHalf: 0.70710678 },
  loom: { id: 'lumen_loom', meterCost: 4, end: 33, hits: [9, 15, 21], dmg: [18, 18, 36], range: 2.8, cosHalf: 0.5 },
  mark: { ticks: 90, bonus: 8 },
  meter: { max: 4, perfect: 1, stunnedHit: 1, pillar: 2 },
  bossStunMul: 1.5,
  /** exact boss stun windows in ticks (the Wayfarer seconds timer gives 78 / 28) */
  bossStunTicks: { pillar: 78, miss: 27 },
  /** team B carry-over (not in DES-007): retry is accepted from this many ticks after the fall, as the old 0.8 s */
  retryTicks: 25,
} as const;
