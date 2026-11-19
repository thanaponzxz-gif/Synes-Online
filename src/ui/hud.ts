// DOM HUD: bars, buttons, hints, damage numbers, menus, results. Thai-first copy.
import type { World, SimEvent, DefeatCause } from '../../shared/sim/world.ts';
import { PLAYER, ENEMIES } from '../../shared/data/tuning.ts';
import { rankFor } from '../../shared/rules/reward.ts';

export const HINTS: Record<string, { icon: string; text: string }> = {
  move: { icon: '🕹', text: 'แตะค้างแล้วลากนิ้วที่ครึ่งจอซ้ายเพื่อเดิน แล้วเดินตามทางไปยังคริสตัลข้างหน้า' },
  attack: { icon: '⚔', text: 'ศัตรูเห็นคุณแล้ว! แตะ ⚔ เพื่อฟัน แตะต่อเนื่องหรือกดค้างเพื่อคอมโบ 3 จังหวะ' },
  dodge: { icon: '↯', text: 'วงสีส้มกำลังเติม! เดินออกนอกวง หรือกด ↯ เพื่อพุ่งหลบ (ระหว่างพุ่งจะไม่โดนโจมตี)' },
  counter: { icon: '✦', text: 'ดาว ✦ บนหัวศัตรูหมายถึงมันเสียหลัก ตีสวนตอนนี้ได้เลย!' },
  skill: { icon: '✧', text: 'ศัตรูมากันหลายตัว ใช้ ✧ ระฆังสะท้อน ทำดาเมจรอบตัวและขัดจังหวะท่าที่กำลังชาร์จ' },
  line: { icon: '➤', text: 'แถบยาวคือแนวพุ่งชน ให้ก้าวออกด้านข้าง อย่าถอยหลังตามแนวแถบ' },
  perfect: { icon: '✨', text: 'หลบได้เพอร์เฟกต์! การโจมตีครั้งถัดไปแรงขึ้น ×1.5 และคูลดาวน์สกิลลดลง' },
  spring: { icon: '💧', text: 'บ่อแสงฟื้นพลังและเติมยา ถ้าพ่ายแพ้ที่บอส คุณจะกลับมาเริ่มที่นี่' },
  pillar: { icon: '💎', text: 'บอสปริซึมแบ็ก! ยืนหน้าเสาคริสตัลเพื่อล่อให้บอสพุ่งชน บอสจะมึนนานและรับดาเมจแรงขึ้น' },
  phase2: { icon: '⚠', text: 'บอสโกรธแล้ว! ท่าเร็วขึ้นและเพิ่มฝนผลึก ให้เคลื่อนที่ตลอด อย่ายืนนิ่ง' },
};

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class Hud {
  private hp = $('#hp-fill'); private hpText = $('#hp-text'); private potions = $('#potions');
  private boss = $('#boss'); private bossFill = $('#boss-fill'); private bossName = $('#boss-name');
  private timer = $('#timer'); private hint = $('#hint'); private hintTimer = 0; private hintQueue: string[] = [];
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
    this.potions.textContent = `×${ps.potions}`;
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
    if (this.hintTimer > 0) { this.hintTimer -= dt; if (this.hintTimer <= 0) this.nextHint(); }
  }

  onEvents(evts: SimEvent[], w: World, project: (id: number, h: number, out: { x: number; y: number; vis: boolean }) => typeof this.tmp) {
    for (const e of evts) {
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
  queueHint(id: string) { if (!HINTS[id]) return; this.hintQueue.push(id); if (this.hintTimer <= 0) this.nextHint(); }
  private nextHint() {
    const id = this.hintQueue.shift();
    if (!id) { this.hint.classList.remove('show'); return; }
    const h = HINTS[id];
    this.hint.innerHTML = `<b>${h.icon}</b><span>${h.text}</span>`; this.hint.classList.add('show');
    this.hintTimer = id === 'move' ? 7 : 5.5;
  }
  dismissHintIf(id: string) { if (this.hint.classList.contains('show') && this.hint.textContent?.includes(HINTS[id].text.slice(0, 10))) this.hintTimer = Math.min(this.hintTimer, 0.6); }

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
    el.querySelector('.reward')!.innerHTML = '<span class="pending">กำลังให้ server ตรวจผล…</span>';
    el.classList.add('show');
    (el.querySelector('.replay') as HTMLButtonElement).onclick = () => { el.classList.remove('show'); onReplay(); };
  }
  setReward(html: string) { $('#victory .reward').innerHTML = html; }
}

function cd(el: HTMLElement, frac: number) {
  el.style.setProperty('--cd', String(frac));
  el.classList.toggle('cooling', frac > 0.001);
}
