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
    attacks: {
      sweep: { id: 'sweep', nameTh: 'กวาดเขา', shape: 'cone', windup: 0.8, dmg: 18, r: 5.2, w: 0.5, tipTh: 'รูปพัดด้านหน้าบอส ให้หลบไปด้านข้างหรือด้านหลังบอส' } as AttackDef,
      slam: { id: 'slam', nameTh: 'กระแทกปริซึม', shape: 'circle', windup: 1.25, dmg: 26, r: 4.6, tipTh: 'วงทองรอบตัวบอส ให้วิ่งออกนอกวง หรือกด ↯ ตอนวงเต็ม' } as AttackDef,
      charge: { id: 'charge', nameTh: 'พุ่งคริสตัล', shape: 'line', windup: 1.0, dmg: 24, r: 18, w: 3.0, tipTh: 'ยืนหน้าเสาคริสตัลแล้วหลบด้านข้าง บอสจะชนเสาและมึนนาน' } as AttackDef,
      shard: { id: 'shard', nameTh: 'ฝนผลึก', shape: 'circle', windup: 1.0, dmg: 12, r: 1.5, tipTh: 'วงเล็กตกตามตำแหน่งคุณ ให้เคลื่อนที่ต่อเนื่อง อย่ายืนนิ่ง' } as AttackDef,
    },
  },
} as const;

export type EnemyKind = keyof typeof ENEMIES;
