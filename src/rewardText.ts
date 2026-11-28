// What the victory screen says about the server's verdict on a finished run. A ruleset that is still in review (DES-009, server
// started with SYNES_REVIEW_RULESETS=1) comes back verified with `review: true` and no reward: it is never shown as saved.
export const REVIEW_TEXT = 'ทดสอบเพื่อตรวจรับ · ไม่บันทึกผล/ไม่ได้รับรางวัล';

interface Reward { rank: string; gold: number; exp: number; drop?: { rarity: string; nameTh: string } | null }
export interface FinishVerdict { verified?: boolean; review?: boolean; reward?: Reward | null; error?: unknown }

/** text only from team A's review answer or the old screen; a verified run without a reward falls back to the old "not saved" line */
export function rewardHtml(res: FinishVerdict): string {
  if (res.verified && res.review) return REVIEW_TEXT;
  if (res.verified && res.reward) {
    const r = res.reward;
    return `✅ บันทึกผลแล้ว: อันดับ <b>${r.rank}</b><br>💰 ${r.gold} ทอง · ✨ ${r.exp} EXP${r.drop ? `<br>ได้รับ <span class="${r.drop.rarity}">${r.drop.nameTh}</span>` : ''}`;
  }
  return `⚠ บันทึกผลไม่สำเร็จ จึงยังไม่ได้รับรางวัล <small>(${res.error ?? 'no-reward'})</small>`;
}
