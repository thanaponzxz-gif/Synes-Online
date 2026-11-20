// DOM HUD: bars, buttons, hints, damage numbers, menus, results. Thai-first copy.
import type { World, SimEvent, DefeatCause } from '../../shared/sim/world.ts';
import { PLAYER, ENEMIES } from '../../shared/data/tuning.ts';
import { rankFor, RANK_RULES } from '../../shared/rules/reward.ts';

/** Hint copy. `when` = only show while the thing it talks about is on screen (round-1 playtest: hints arrived before/after the event). */
export const HINTS: Record<string, { icon: string; text: string; when?: (w: World) => boolean; urgent?: boolean }> = {
  move: { icon: '🕹', text: 'ลากนิ้วที่ครึ่งจอซ้ายเพื่อเดิน เดินตามทางไปยังคริสตัลข้างหน้า' },
  attack: { icon: '⚔', text: 'แตะ ⚔ เพื่อฟัน แตะต่อเนื่องเพื่อคอมโบ 3 จังหวะ', when: (w) => w.actors.some((e) => e.kind !== 'player' && e.alive && e.active) },
  dodge: { icon: '↯', text: 'วงสีส้มคือจุดที่จะโดนโจมตี เดินออกนอกวง หรือกด ↯ พุ่งหลบ', when: (w) => w.tele.some((t) => t.area && t.t > 0.35), urgent: true },
  perfectTeach: { icon: '✨', text: 'เคล็ดลับ: กด ↯ ตอนวงใกล้เต็ม ถ้าพุ่งผ่านการโจมตีพอดีจะได้ PERFECT ตีแรงขึ้น ×1.5' },
  counter: { icon: '✦', text: 'ศัตรูที่มีดาว ✦ หมุนบนหัวกำลังเสียหลัก ตีสวนตอนนี้!', when: (w) => w.actors.some((e) => e.kind !== 'player' && e.alive && (e.state === 'recover' || e.state === 'stunned')) },
  skill: { icon: '✧', text: 'ศัตรูหลายตัว! ✧ ระฆังสะท้อนตีรอบตัวและขัดจังหวะท่าที่กำลังชาร์จ', when: (w) => w.actors.filter((e) => e.kind !== 'player' && e.alive && e.active).length >= 2 },
  line: { icon: '➤', text: 'แถบยาวคือแนวพุ่งชน ก้าวออกด้านข้าง อย่าถอยหลังตามแถบ', when: (w) => w.tele.some((t) => t.shape === 'line' && t.t > 0.3), urgent: true },
  perfect: { icon: '✨', text: 'หลบเพอร์เฟกต์! ตีครั้งถัดไปแรงขึ้น ×1.5 และคูลดาวน์สกิลลดลง' },
  spring: { icon: '💧', text: 'บ่อแสงฟื้นพลังและเติมยา ถ้าแพ้ที่บอส จะกลับมาเริ่มที่นี่' },
  pillar: { icon: '💎', text: 'ยืนหน้าเสาคริสตัลเพื่อล่อบอสพุ่งชน แล้วก้าวหลบด้านข้าง บอสจะมึนนาน', when: (w) => w.boss.state !== 'intro' },
  phase2: { icon: '⚠', text: 'บอสโกรธแล้ว! เสางอกใหม่ ท่าเร็วขึ้น และมีฝนผลึก ให้เดินตลอด', urgent: true },
  pillarP2: { icon: '💎', text: 'หลังฝนผลึก บอสจะพุ่งชนทุกครั้ง รีบไปยืนหน้าเสาแล้วหลบด้านข้าง!', urgent: true },
};
const HINT_SECS = 4.5, HINT_GAP = 0.5;
const POTION_SVG = (full: boolean) => `<svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true"><rect x="4" y="0.5" width="4" height="3" rx="0.6" fill="#e9dcc4"/><path d="M4 3.5h4v2l2.6 3.2a4.6 4.6 0 1 1-9.2 0L4 5.5z" fill="${full ? '#6ee07a' : 'rgba(255,255,255,0.12)'}" stroke="#fff" stroke-width="0.9"/></svg>`;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class Hud {
  private hp = $('#hp-fill'); private hpText = $('#hp-text'); private potions = $('#potions');
  private boss = $('#boss'); private bossFill = $('#boss-fill'); private bossName = $('#boss-name');
  private timer = $('#timer'); private hint = $('#hint'); private hintTimer = 0; private hintGap = 0; private hintQueue: string[] = []; private hintCur = ''; private hintShown = 0;
  private lastPotions = -1; private taughtPerfect = false;
  private skillBtn = $('#btn-skill'); private dodgeBtn = $('#btn-dodge'); private potionBtn = $('#btn-potion');
  private layer = $('#floaters'); private vignette = $('#vignette'); private banner = $('#banner');
  private bars = new Map<number, HTMLElement>();
  private tmp = { x: 0, y: 0, vis: false };
  netChip = $('#net-chip');

  constructor() {
    this.bossName.textContent = ENEMIES.prismback.nameTh;
  }

  update(w: World, dt: number, project: (id: number, h: number, out: { x: number; y: number; vis: boolean }) => typeof this.tmp) {
    const p = w.player, ps = w.ps;
    this.hp.style.width = `${(p.hp / p.maxHp) * 100}%`;
    this.hp.classList.toggle('low', p.hp / p.maxHp < 0.3);
    this.hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    if (ps.potions !== this.lastPotions) { this.lastPotions = ps.potions; this.potions.innerHTML = Array.from({ length: PLAYER.potion.charges }, (_, i) => POTION_SVG(i < ps.potions)).join(''); this.potions.title = `ยาฟื้นพลัง ${ps.potions} ขวด`; }
    this.potionBtn.classList.toggle('empty', ps.potions <= 0);
    this.potionBtn.querySelector('.count')!.textContent = String(ps.potions);
    cd(this.skillBtn, Math.max(0, ps.skillCd) / PLAYER.skill.cooldown);
    cd(this.dodgeBtn, Math.max(0, ps.dodgeCd) / PLAYER.dodge.cooldown);
    this.skillBtn.classList.toggle('empowered', ps.empowered);
    $('#btn-attack').classList.toggle('empowered', ps.empowered);
    this.timer.textContent = fmt(w.tick / 30);
    const showBoss = w.bossStarted && w.boss.alive;
    this.boss.classList.toggle('show', showBoss);
    if (showBoss) {
      this.bossFill.style.width = `${(w.boss.hp / w.boss.maxHp) * 100}%`;
      this.boss.classList.toggle('stunned', w.boss.state === 'stunned');
      this.boss.classList.toggle('p2', w.phase === 2);
    }
    // enemy HP bars (only once engaged)
    for (const e of w.actors) {
      if (e.kind === 'player' || e.kind === 'prismback') continue;
      let bar = this.bars.get(e.id);
      const show = e.alive && e.active && e.hp < e.maxHp;
      if (!show) { if (bar) bar.style.display = 'none'; continue; }
      if (!bar) { bar = document.createElement('div'); bar.className = 'ebar'; bar.innerHTML = '<i></i>'; this.layer.appendChild(bar); this.bars.set(e.id, bar); }
      project(e.id, e.kind === 'puffcap' ? 1.35 : 1.25, this.tmp);
      bar.style.display = this.tmp.vis ? 'block' : 'none';
      bar.style.transform = `translate(${this.tmp.x - 22}px, ${this.tmp.y}px)`;
      (bar.firstChild as HTMLElement).style.width = `${(e.hp / e.maxHp) * 100}%`;
    }
    this.tickHints(w, dt);
  }

  onEvents(evts: SimEvent[], w: World, project: (id: number, h: number, out: { x: number; y: number; vis: boolean }) => typeof this.tmp) {
    for (const e of evts) {
      // teach perfect dodge right after the first hit from a dodgeable area attack (the moment the lesson is relevant)
      if (e.t === 'hit' && !e.byPlayer && !this.taughtPerfect && w.stats.perfect === 0 && w.ps.cause && !['rush', 'charge'].includes(w.ps.cause.attackId)) { this.taughtPerfect = true; this.queueHint('perfectTeach'); }
      if (e.t === 'hint') this.queueHint(e.id);
      else if (e.t === 'hit') {
        project(e.target, e.byPlayer ? 1.6 : 2.0, this.tmp);
        if (this.tmp.vis) this.floater(this.tmp.x, this.tmp.y, String(e.amount), e.byPlayer ? (e.crit ? 'crit' : 'dmg') : 'hurt');
        if (!e.byPlayer) { this.vignette.classList.remove('flash'); void this.vignette.offsetWidth; this.vignette.classList.add('flash'); try { navigator.vibrate?.(35); } catch { /* not allowed */ } }
      } else if (e.t === 'perfect') { project(w.player.id, 2.3, this.tmp); this.floater(this.tmp.x, this.tmp.y, 'PERFECT!', 'perfect'); }
      else if (e.t === 'heal') { project(w.player.id, 2.0, this.tmp); this.floater(this.tmp.x, this.tmp.y, `+${e.amount}`, 'heal'); }
      else if (e.t === 'interrupt') { project(e.id, 1.6, this.tmp); this.floater(this.tmp.x, this.tmp.y, 'ขัดจังหวะ!', 'crit'); }
      else if (e.t === 'stun' && e.long) this.showBanner('💥 บอสชนเสา! มึนงง — โจมตีเลย!', 2.2);
      else if (e.t === 'stun') { project(e.id, 3.5, this.tmp); this.floater(this.tmp.x, this.tmp.y, 'เสียหลัก', 'perfect'); }
      else if (e.t === 'gate' && e.open && e.id === 'clearingExit') this.showBanner('ประตูคริสตัลเปิดแล้ว เดินต่อตามทางข้างหน้า', 2.5);
      else if (e.t === 'checkpoint') this.showBanner('💧 บันทึกจุดเกิดใหม่แล้ว', 1.8);
      else if (e.t === 'boss-start') this.showBanner(`⚔ ${ENEMIES.prismback.nameTh}`, 2.4, true);
      else if (e.t === 'boss-phase') this.showBanner('⚠ ปริซึมแบ็กเกรี้ยวกราด!', 2, true);
    }
  }

  private floater(x: number, y: number, text: string, cls: string) {
    const el = document.createElement('div'); el.className = `floater ${cls}`; el.textContent = text;
    el.style.left = `${x + (Math.random() - 0.5) * 36}px`; el.style.top = `${y + (Math.random() - 0.5) * 14}px`;
    this.layer.appendChild(el); setTimeout(() => el.remove(), 900);
  }
  showBanner(text: string, secs: number, big = false) {
    this.banner.textContent = text; this.banner.className = big ? 'show big' : 'show';
    clearTimeout((this.banner as any)._t); (this.banner as any)._t = setTimeout(() => (this.banner.className = ''), secs * 1000);
  }
  queueHint(id: string) { if (!HINTS[id] || this.hintQueue.includes(id) || this.hintCur === id) return; this.hintQueue.push(id); }
  /** One hint at a time, short gap between them, and context hints wait until what they describe is visible. Urgent ones cut a hint that has been read for 1.5 s. */
  private tickHints(w: World, dt: number) {
    if (this.hintTimer > 0) { this.hintTimer -= dt; this.hintShown += dt; if (this.hintTimer <= 0) { this.hint.classList.remove('show'); this.hintCur = ''; this.hintGap = HINT_GAP; } }
    else if (this.hintGap > 0) this.hintGap -= dt;
    const ready = (id: string) => !HINTS[id].when || HINTS[id].when!(w);
    if (this.hintCur && this.hintShown > 1.5) {
      const u = this.hintQueue.find((id) => HINTS[id].urgent && ready(id));
      if (u && !HINTS[this.hintCur].urgent) { this.show(u); return; }
    }
    if (this.hintTimer > 0 || this.hintGap > 0) return;
    const next = this.hintQueue.find(ready);
    if (next) this.show(next);
  }
  private show(id: string) {
    this.hintQueue = this.hintQueue.filter((x) => x !== id);
    const h = HINTS[id];
    this.hint.innerHTML = `<b>${h.icon}</b><span>${h.text}</span>`; this.hint.classList.add('show');
    this.hintCur = id; this.hintShown = 0; this.hintTimer = id === 'move' ? 7 : HINT_SECS;
  }
  dismissHintIf(id: string) { if (this.hintCur === id) this.hintTimer = Math.min(this.hintTimer, 0.6); }

  showDefeat(c: DefeatCause, atSpring: boolean, onRetry: () => void) {
    const el = $('#defeat');
    el.querySelector('.cause')!.innerHTML = `แพ้ให้ <b>${c.enemyTh}</b> ด้วยท่า <b>“${c.attackTh}”</b>`;
    el.querySelector('.tip')!.textContent = `เคล็ดลับ: ${c.tipTh}`;
    el.querySelector('.where')!.textContent = atSpring ? 'จะกลับไปเริ่มที่บ่อแสงหน้าลานบอส บอสจะฟื้นเต็ม' : 'จะกลับไปเริ่มที่จุดพักล่าสุด';
    el.classList.add('show');
    const btn = el.querySelector('button')!;
    btn.onclick = () => { el.classList.remove('show'); onRetry(); };
  }

  showVictory(w: World, onReplay: () => void) {
    const s = w.summary();
    const rank = rankFor({ victory: true, seconds: s.seconds, damageTaken: s.damageTaken, deaths: s.deaths, perfect: s.perfect });
    const el = $('#victory');
    el.querySelector('.rank')!.textContent = rank;
    el.querySelector('.rank')!.className = `rank r${rank}`;
    el.querySelector('.stats')!.innerHTML = [
      ['เวลา', fmt(s.seconds)], ['ดาเมจที่ได้รับ', String(s.damageTaken)], ['หลบเพอร์เฟกต์', String(s.perfect)], ['พ่ายแพ้', `${s.deaths} ครั้ง`],
    ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
    el.querySelector('.rankinfo')!.innerHTML = rankInfo(rank, s);
    el.querySelector('.reward')!.innerHTML = '<span class="pending">กำลังบันทึกผล…</span>';
    el.classList.add('show');
    (el.querySelector('.replay') as HTMLButtonElement).onclick = () => { el.classList.remove('show'); onReplay(); };
  }
  setReward(html: string) { $('#victory .reward').innerHTML = html; }
}

function rankInfo(rank: string, s: { damageTaken: number; deaths: number; seconds: number }) {
  const R = RANK_RULES;
  const rules = `S: ไม่แพ้ · โดน ≤ ${R.S.damage} · ไม่เกิน ${fmt(R.S.seconds)} &nbsp;|&nbsp; A: ไม่แพ้ · โดน ≤ ${R.A.damage}`;
  let next = '';
  if (rank === 'A') next = `อีกนิดได้ S: โดนดาเมจให้ไม่เกิน ${R.S.damage}${s.seconds > R.S.seconds ? ` และจบใน ${fmt(R.S.seconds)}` : ''} (หลบเพอร์เฟกต์ช่วยได้มาก)`;
  else if (rank !== 'S') next = s.deaths > 0 ? 'ได้ A ถ้าชนะโดยไม่แพ้เลย' : `ได้ A ถ้าโดนดาเมจไม่เกิน ${R.A.damage}`;
  return `<div>${rules}</div>${next ? `<div class="nextrank">${next}</div>` : ''}`;
}

function cd(el: HTMLElement, frac: number) {
  el.style.setProperty('--cd', String(frac));
  el.classList.toggle('cooling', frac > 0.001);
}
