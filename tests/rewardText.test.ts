// What the victory screen says about the server's verdict (src/rewardText.ts). Team A review of DES-009, round 1: a run of a
// ruleset that is still in review comes back verified with no reward, and must never be shown as a saved, rewarded run.
import { describe, it, expect } from 'vitest';
import { rewardHtml, REVIEW_TEXT } from '../src/rewardText.ts';

describe('rewardHtml', () => {
  it('a rewarded run shows the rank, gold, EXP and the drop (as before)', () => {
    expect(rewardHtml({ verified: true, reward: { rank: 'A', gold: 12, exp: 30, drop: { rarity: 'rare', nameTh: 'ผลึก' } } }))
      .toBe('✅ บันทึกผลแล้ว: อันดับ <b>A</b><br>💰 12 ทอง · ✨ 30 EXP<br>ได้รับ <span class="rare">ผลึก</span>');
    expect(rewardHtml({ verified: true, reward: { rank: 'B', gold: 5, exp: 10, drop: null } })).toBe('✅ บันทึกผลแล้ว: อันดับ <b>B</b><br>💰 5 ทอง · ✨ 10 EXP');
  });
  it('a run in review: says it is a review test, not saved, no reward — and does not touch the missing reward', () => {
    const s = rewardHtml({ verified: true, review: true, reward: null });
    expect(s).toContain(REVIEW_TEXT);
    expect(REVIEW_TEXT).toBe('ทดสอบเพื่อตรวจรับ · ไม่บันทึกผล/ไม่ได้รับรางวัล');
    expect(s).not.toContain('บันทึกผลแล้ว');
  });
  it('a verified run without a reward for any other reason is not shown as rewarded either', () => {
    expect(rewardHtml({ verified: true, reward: null })).not.toContain('บันทึกผลแล้ว');
  });
  it('a refused run shows the error', () => {
    expect(rewardHtml({ error: 'tuning-mismatch' })).toBe('⚠ บันทึกผลไม่สำเร็จ จึงยังไม่ได้รับรางวัล <small>(tuning-mismatch)</small>');
  });
});
