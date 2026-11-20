// Pure-sim comparison of the combo rulesets (DES-006 §1/§5): scripted bot over the whole stage + Auto clearing the plaza.
// Run: npx vite-node tools/qa/combo-compare.ts   -> writes docs/qa/combo-v01/combo-compare.md
// The bot is NOT a human and its timing is not tuned for any ruleset. Same seeds for every ruleset. Damage / HP are NOT compensated.
import fs from 'node:fs';
import { World } from '../../shared/sim/world.ts';
import { NO_INPUT } from '../../shared/sim/input.ts';
import { packAuto, defaultAuto } from '../../shared/sim/auto.ts';
import { RULESETS, tuningHash, type Ruleset } from '../../shared/sim/ruleset.ts';
import { TICK } from '../../shared/data/tuning.ts';
import { Bot } from '../../tests/bot.ts';

const SEEDS = 40, BOT_SKILLS = [0.7, 1.0], MAX = Math.round(480 / TICK);
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const med = (a: number[]) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
const f = (x: number, d = 1) => (Number.isNaN(x) ? '-' : x.toFixed(d));

function botRun(r: Ruleset, seed: number, skill: number, start: 'normal' | 'boss') {
  const w = new World(seed, { dodgeCdTicks: 17, start }, r), bot = new Bot(skill);
  let hitsTaken = 0, last = 0, firstBossHit = -1;
  while (!w.finished && w.tick < MAX) {
    w.step(bot.think(w));
    if (w.stats.damageTaken > last) { hitsTaken++; last = w.stats.damageTaken; }
    if (firstBossHit < 0 && w.boss.hp < w.boss.maxHp) firstBossHit = w.tick;
  }
  return { win: w.victory, secs: w.tick * TICK, hitsTaken, dmg: w.stats.damageTaken, deaths: w.stats.deaths, landed: w.stats.hitsLanded, bossFightSecs: firstBossHit < 0 ? NaN : (w.tick - firstBossHit) * TICK };
}

/** Auto ("whole hall") clears one enemy group. The player is placed at the hall (QA state write, same as tools/qa/auto-clip.mjs). */
function autoRun(r: Ruleset, seed: number, group: 'trail' | 'clearing', skills: boolean) {
  const w = new World(seed, undefined, r);
  if (group === 'clearing') { w.player.x = 3; w.player.z = -31; w.player.fx = 0; w.player.fz = -1; }
  w.step({ ...NO_INPUT, auto: packAuto({ ...defaultAuto(), enabled: true, hall: true, skills: [skills, skills, skills] }) });
  const g = w.actors.filter((e) => e.group === group);
  let last = 0, hits = 0;
  while (w.tick < 60 / TICK && g.some((e) => e.alive) && !w.ps.down) { w.step(NO_INPUT); if (w.stats.damageTaken > last) { hits++; last = w.stats.damageTaken; } }
  const cleared = g.every((e) => !e.alive);
  return { cleared, secs: w.tick * TICK, hits, n: g.length };
}

let md = `# เทียบ combo ruleset (combat-1 / A / B / C) · sim ล้วน

> **ข้อควรระวัง:** ตัวเลขมาจาก **บอทสคริปต์ (tests/bot.ts) และตัวควบคุม Auto ใน sim ไม่ใช่ผู้เล่นจริง** · บอทไม่ได้ปรับจังหวะให้เข้ากับ ruleset ใด · **ไม่มีการชดเชยดาเมจ/HP** ตาม DES-006 §1
> สร้างโดย \`npx vite-node tools/qa/combo-compare.ts\` · seed 1..${SEEDS} ต่อช่อง (n = ${SEEDS} รอบต่อช่อง) · จำกัด 8 นาทีเกมต่อรอบ

tuning hash: ${RULESETS.map((r) => `${r} \`${tuningHash(r)}\``).join(' · ')}

## 1. บอทเล่นทั้งด่าน (เริ่มที่จุดเริ่ม, ไปจนชนะบอส)
| ruleset | บอท skill | ชนะ | เวลาเคลียร์ด่าน กลาง s | เฉลี่ย s | โดนตี (ครั้ง/รอบ) | ดาเมจที่รับ/รอบ | ตาย/รอบ | ตีโดนศัตรู/รอบ |
|---|---|---|---|---|---|---|---|---|
`;
for (const r of RULESETS) for (const sk of BOT_SKILLS) {
  const rs = Array.from({ length: SEEDS }, (_, i) => botRun(r, i + 1, sk, 'normal'));
  const wins = rs.filter((x) => x.win);
  md += `| ${r} | ${sk} | ${wins.length}/${SEEDS} | ${f(med(wins.map((x) => x.secs)))} | ${f(mean(wins.map((x) => x.secs)))} | ${f(mean(rs.map((x) => x.hitsTaken)))} | ${f(mean(rs.map((x) => x.dmg)))} | ${f(mean(rs.map((x) => x.deaths)), 2)} | ${f(mean(rs.map((x) => x.landed)))} |\n`;
}
md += `\n## 2. บอทสู้บอสอย่างเดียว (start=boss)
| ruleset | บอท skill | ชนะ | เวลาทั้งรอบ กลาง s | จากโดนบอสครั้งแรกถึงจบ กลาง s | โดนตี (ครั้ง/รอบ) |
|---|---|---|---|---|---|
`;
for (const r of RULESETS) for (const sk of BOT_SKILLS) {
  const rs = Array.from({ length: SEEDS }, (_, i) => botRun(r, i + 1, sk, 'boss'));
  const wins = rs.filter((x) => x.win);
  md += `| ${r} | ${sk} | ${wins.length}/${SEEDS} | ${f(med(wins.map((x) => x.secs)))} | ${f(med(wins.map((x) => x.bossFightSecs)))} | ${f(mean(rs.map((x) => x.hitsTaken)))} |\n`;
}
md += `\n## 3. Auto เคลียร์ ("ทั้งโถง") · รอบละ 1 โถง, เริ่มจากจุดที่ตั้ง Auto
| ruleset | โถง | สกิลเปิด | เคลียร์ได้ | เวลากลาง s | เวลาเฉลี่ย s | โดนตี (ครั้ง/รอบ) | จำนวนมอน |
|---|---|---|---|---|---|---|---|
`;
for (const r of RULESETS) for (const g of ['trail', 'clearing'] as const) for (const sk of [false, true]) {
  const rs = Array.from({ length: SEEDS }, (_, i) => autoRun(r, i + 1, g, sk));
  const ok = rs.filter((x) => x.cleared);
  md += `| ${r} | ${g === 'trail' ? 'ทางเดิน (trail)' : 'ลานโล่ง/plaza (clearing)'} | ${sk ? '3 สกิล' : 'ตีปกติอย่างเดียว'} | ${ok.length}/${SEEDS} | ${f(med(ok.map((x) => x.secs)))} | ${f(mean(ok.map((x) => x.secs)))} | ${f(mean(rs.map((x) => x.hits)))} | ${rs[0].n} |\n`;
}
md += `\n- เวลา Auto นับจากเปิด Auto (รวมเดินไปหามอน) · "ตีปกติอย่างเดียว" แยกผลของ combo ออกจากสกิล
- ลานโล่งตั้งตำแหน่งผู้เล่นด้วยการเขียน state ตรง ๆ (เหมือน tools/qa/auto-clip.mjs) เพื่อข้ามการเดินจากจุดเริ่ม
`;
fs.mkdirSync('docs/qa/combo-v01', { recursive: true });
fs.writeFileSync('docs/qa/combo-v01/combo-compare.md', md);
console.log(md);
