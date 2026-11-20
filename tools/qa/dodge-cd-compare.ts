// Pure-sim comparison of dodge cooldown 0.55 vs 0.87 (boss start, scripted bot). Run: npx vite-node tools/qa/dodge-cd-compare.ts
// Writes docs/qa/dodge-cd-compare.md. The bot is NOT a human and its dodge logic is not tuned for either value.
import fs from 'node:fs';
import { World } from '../../shared/sim/world.ts';
import { BTN } from '../../shared/sim/input.ts';
import { TICK } from '../../shared/data/tuning.ts';
import { Bot } from '../../tests/bot.ts';

const CDS = [17, 26] as const, SEC: Record<number, string> = { 17: '0.55', 26: '0.87' }, SKILLS = [0.7, 1.0, 1.3], SEEDS = 40, MAX_TICKS = Math.round(180 / TICK);
const pct = (a: number[], p: number) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f = (x: number, d = 2) => (Number.isNaN(x) ? '-' : x.toFixed(d));

interface Cell { wins: number; n: number; times: number[]; winTimes: number[]; dmg: number[]; deaths: number[]; byAtk: Record<string, number>; blockedHits: number; totalHits: number; blockedPress: number; dodgesDone: number; }
const gaps: Record<string, { 1: number[]; 2: number[] }> = { '17': { 1: [], 2: [] }, '26': { 1: [], 2: [] } };
const cells = new Map<string, Cell>();
const atkIds = new Set<string>();

for (const cd of CDS) for (const skill of SKILLS) {
  const c: Cell = { wins: 0, n: 0, times: [], winTimes: [], dmg: [], deaths: [], byAtk: {}, blockedHits: 0, totalHits: 0, blockedPress: 0, dodgesDone: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const w = new World(seed, { dodgeCdTicks: cd, start: 'boss' }), bot = new Bot(skill);
    const pressTicks: number[] = []; // blocked dodge presses (edge while on cooldown, not executed within the 0.2 s buffer)
    const pending: { tick: number }[] = [];
    let prevB = 0, lastStart: number | null = null, lastDmg = 0;
    while (!w.finished && w.tick < MAX_TICKS) {
      const inp = bot.think(w);
      const edge = inp.b & BTN.DODGE & ~prevB; prevB = inp.b;
      if (edge && w.ps.dodgeCd > 0) pending.push({ tick: w.tick });
      const evs = w.step(inp);
      if (evs.some((e) => e.t === 'dodge')) pending.length = 0;
      while (pending.length && w.tick - pending[0].tick > 6) pressTicks.push(pending.shift()!.tick); // buffer 0.2 s = 6 ticks expired
      if (w.ps.down) lastStart = null;
      for (const e of evs) {
        if (e.t !== 'telegraph') continue;
        const t = w.tele.find((x) => x.id === e.id);
        if (!t || t.owner !== w.boss.id || !w.bossStarted) continue;
        if (!w.insideTele(t, w.player.x, w.player.z, 0.7)) continue;
        const now = w.tick * TICK;
        if (lastStart !== null) gaps[String(cd)][w.phase === 2 ? 2 : 1].push(now - lastStart);
        lastStart = now;
      }
      if (w.stats.damageTaken > lastDmg) {
        lastDmg = w.stats.damageTaken;
        const id = w.ps.cause?.attackId ?? '?'; atkIds.add(id);
        c.byAtk[id] = (c.byAtk[id] ?? 0) + 1; c.totalHits++;
        // dodge pressed in the last 0.3 s (9 ticks) but could not execute (cooldown)
        if (pressTicks.concat(pending.map((p) => p.tick)).some((t) => w.tick - t <= 9)) c.blockedHits++;
      }
    }
    c.blockedPress += pressTicks.length; c.dodgesDone += w.stats.dodges; c.n++; if (w.victory) { c.wins++; c.winTimes.push(w.tick * TICK); }
    c.times.push(w.tick * TICK); c.dmg.push(w.stats.damageTaken); c.deaths.push(w.stats.deaths);
  }
  cells.set(`${cd}|${skill}`, c);
}

const ids = [...atkIds].sort();
let md = `# เทียบคูลดาวน์หลบ 17 tick (0.55 s) กับ 26 tick (0.87 s) (sim ล้วน, สคริปต์บอท)

> **หมายเหตุ:** รอบก่อนหน้าของเอกสารนี้ใช้ค่าวินาที 0.87 ซึ่งใน sim จริงเท่ากับ **27 tick** (0.90 s) ไม่ใช่ 26 tick ตามดีไซน์ DES-001 · รอบนี้ใช้ variant แบบนับ tick ตรงตัว (17 = 0.55 s เหมือนเดิมทุกประการ, 26 = 0.87 s)

> **ข้อควรระวัง:** ตัวเลขนี้มาจาก **บอทสคริปต์ (tests/bot.ts) ไม่ใช่ผู้เล่นจริง** และตรรกะการหลบของบอท **ไม่ได้ปรับให้เข้ากับคูลดาวน์ใดเลย** (ใช้เงื่อนไข dodgeCd <= 0 เหมือนกัน)
> ผลจึงบอกแนวโน้มของ sim เท่านั้น ไม่ใช่ความรู้สึกของคนเล่น · สร้างโดย \`npx vite-node tools/qa/dodge-cd-compare.ts\`

## วิธีทดสอบ
- เริ่มที่ \`start: 'boss'\` (จุดเซฟ spring, มอนสเตอร์ก่อนหน้าตายหมด) · ${SEEDS} seed ต่อช่อง (seed 1..${SEEDS}) · บอท skill ${SKILLS.join(' / ')} · จำกัด 3 นาทีเกม (ตาย = บอทกดลองใหม่ ไม่ตัดจบ)
- "ชนะ" = ชนะภายใน 3 นาที · เวลา = เวลาเกมนับจาก start (รวมเดินจาก spring ไปลานบอส)
- "โดนตอนกดหลบไม่ติด" = โดนตีโดยในช่วง 0.3 s ก่อนหน้ามีการกดหลบที่ถูกปฏิเสธเพราะคูลดาวน์ (กดแล้วไม่ได้หลบภายใน buffer 0.2 s)

## ผลรวมต่อช่อง
| dodgeCd (tick) | skill | ชนะ | เวลากลาง (ทุกรัน) s | เวลากลาง (เฉพาะชนะ) s | ดาเมจเฉลี่ย | ตายเฉลี่ย | โดนทั้งหมด | โดนตอนกดหลบไม่ติด | กดหลบถูกปฏิเสธ (เฉลี่ย/รัน) | หลบสำเร็จ (เฉลี่ย/รัน) |
|---|---|---|---|---|---|---|---|---|---|---|
`;
for (const cd of CDS) for (const s of SKILLS) {
  const c = cells.get(`${cd}|${s}`)!;
  md += `| ${cd} (${SEC[cd]} s) | ${s} | ${c.wins}/${c.n} (${f(100 * c.wins / c.n, 0)}%) | ${f(pct(c.times, 0.5), 1)} | ${f(pct(c.winTimes, 0.5), 1)} | ${f(mean(c.dmg), 1)} | ${f(mean(c.deaths))} | ${c.totalHits} | ${c.blockedHits} (${f(100 * c.blockedHits / Math.max(1, c.totalHits), 0)}%) | ${f(c.blockedPress / c.n, 1)} | ${f(c.dodgesDone / c.n, 1)} |\n`;
}
md += `\n## จำนวนครั้งที่โดน แยกตามท่า (รวม ${SEEDS} seed)\n| dodgeCd (tick) | skill | ${ids.join(' | ')} |\n|---|---|${ids.map(() => '---').join('|')}|\n`;
for (const cd of CDS) for (const s of SKILLS) { const c = cells.get(`${cd}|${s}`)!; md += `| ${cd} (${SEC[cd]} s) | ${s} | ${ids.map((i) => c.byAtk[i] ?? 0).join(' | ')} |\n`; }
md += `\n## ช่วงห่างระหว่างการเริ่มวงเตือนของบอสที่ทับตัวผู้เล่น (วินาที, start-to-start)
รวมทุก skill/seed ของ dodgeCd นั้น · นับเฉพาะวงเตือนที่ผู้เล่นอยู่ในพื้นที่ (pad 0.7) ตอนเริ่ม · คู่ที่ข้ามการตาย/เกิดใหม่ไม่นับ · ตำแหน่งผู้เล่นขึ้นกับบอท
| dodgeCd (tick) | phase | จำนวนคู่ | min | p10 | median | สัดส่วน < 0.55 s | สัดส่วน < 0.87 s |
|---|---|---|---|---|---|---|---|
`;
for (const cd of CDS) for (const ph of [1, 2] as const) {
  const g = gaps[String(cd)][ph];
  md += `| ${cd} (${SEC[cd]} s) | ${ph} | ${g.length} | ${f(Math.min(...g))} | ${f(pct(g, 0.1))} | ${f(pct(g, 0.5))} | ${f(100 * g.filter((x) => x < 0.55).length / Math.max(1, g.length), 1)}% | ${f(100 * g.filter((x) => x < 0.87).length / Math.max(1, g.length), 1)}% |\n`;
}
md += `\n> ช่วงห่างขึ้นกับพฤติกรรมบอท (ตำแหน่งที่ยืน/ท่าที่ถูกเลือก) จึงต่างกันระหว่าง dodgeCd ได้แม้ตารางเวลาบอสเหมือนกัน\n`;
fs.mkdirSync('docs/qa', { recursive: true });
fs.writeFileSync('docs/qa/dodge-cd-compare.md', md);
console.log(md);
