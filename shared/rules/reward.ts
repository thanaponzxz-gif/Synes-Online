// Reward rules. Only the server calls rewardFor() with a server-secret roll; the client may preview rank only.
export interface RunResult { victory: boolean; seconds: number; damageTaken: number; deaths: number; perfect: number; }
export type Rank = 'S' | 'A' | 'B' | 'C';

export function rankFor(r: RunResult): Rank {
  if (!r.victory) return 'C';
  if (r.deaths === 0 && r.damageTaken <= 60 && r.seconds <= 180) return 'S';
  if (r.deaths === 0 && r.damageTaken <= 150) return 'A';
  if (r.deaths <= 1) return 'B';
  return 'C';
}

export const DROPS = [
  { id: 'dewlight_shard', nameTh: 'เศษน้ำค้างแสง', rarity: 'common', w: 70 },
  { id: 'prism_horn_fragment', nameTh: 'เศษเขาปริซึม', rarity: 'uncommon', w: 25 },
  { id: 'chime_blade_dawn', nameTh: 'ใบระฆัง: จูนรุ่งอรุณ', rarity: 'rare', w: 5 },
] as const;

const MUL: Record<Rank, number> = { S: 2, A: 1.5, B: 1.2, C: 1 };

/** roll ∈ [0,1) must come from the server (HMAC of runId with a server secret). */
export function rewardFor(r: RunResult, roll: number) {
  if (!r.victory) return { rank: 'C' as Rank, gold: 0, exp: 40, drop: null };
  const rank = rankFor(r);
  const gold = Math.round(120 * MUL[rank]) + Math.min(r.perfect, 4) * 5;
  const exp = Math.round(300 * MUL[rank]);
  const weights = DROPS.map((d) => (d.rarity === 'rare' && rank === 'S' ? d.w * 3 : d.w));
  let x = roll * weights.reduce((a, b) => a + b, 0), drop: (typeof DROPS)[number] = DROPS[0];
  for (let i = 0; i < DROPS.length; i++) { if (x < weights[i]) { drop = DROPS[i]; break; } x -= weights[i]; }
  return { rank, gold, exp, drop: { id: drop.id, nameTh: drop.nameTh, rarity: drop.rarity } };
}
