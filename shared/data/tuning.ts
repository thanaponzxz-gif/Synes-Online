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
