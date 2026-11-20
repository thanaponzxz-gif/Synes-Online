// Auto attack UI (DES-001 §3-4): the HUD toggle + gear (AutoBar) and the settings overlay (AutoPanel).
// Pure DOM; it never touches the sim. Every change is handed to `onChange` (main.ts sends it through Input.queueAuto, so it is logged).
import { AUTO_KINDS, AUTO_RADIUS, type AutoSettings } from '../../shared/sim/auto.ts';
import { ENEMIES, SKILLS } from '../../shared/data/tuning.ts';

export class AutoBar {
  private last = '';
  private bar: HTMLElement; private toggle: HTMLElement;
  constructor(bar: HTMLElement, toggle: HTMLElement) { this.bar = bar; this.toggle = toggle; }
  /** `allowed` false = boss area: the controls are hidden (Auto cannot run there). */
  update(enabled: boolean, allowed: boolean) {
    const key = `${enabled}|${allowed}`;
    if (key === this.last) return;
    this.last = key;
    this.bar.classList.toggle('hidden', !allowed);
    this.toggle.classList.toggle('on', enabled);
    this.toggle.setAttribute('aria-pressed', String(enabled));
    this.toggle.setAttribute('aria-label', `ตีอัตโนมัติ (${enabled ? 'เปิดอยู่' : 'ปิดอยู่'})`);
    (this.toggle.querySelector('.au-state') as HTMLElement).textContent = enabled ? 'เปิด' : 'ปิด';
  }
}

export class AutoPanel {
  private kindsEl: HTMLElement; private areaEl: HTMLElement; private skillsEl: HTMLElement;
  private radius: HTMLInputElement; private radiusVal: HTMLElement; private keep: HTMLInputElement; private radiusRow: HTMLElement;
  /**
   * @param get      current settings (the UI copy kept by main.ts)
   * @param set      called with the full new settings on every change
   * @param nearKinds bitmask of AUTO_KINDS present near the player (Q: alive, within 30 m); selected kinds are always listed
   */
  private get: () => AutoSettings; private set: (s: AutoSettings) => void; private nearKinds: () => number;
  constructor(root: HTMLElement, get: () => AutoSettings, set: (s: AutoSettings) => void, nearKinds: () => number) {
    this.get = get; this.set = set; this.nearKinds = nearKinds;
    const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
    this.kindsEl = q('#ap-kinds'); this.areaEl = q('#ap-area'); this.skillsEl = q('#ap-skills');
    this.radius = q<HTMLInputElement>('#ap-radius'); this.radiusVal = q('#ap-radius-val'); this.keep = q<HTMLInputElement>('#ap-keep'); this.radiusRow = q('.ap-radius');
    this.radius.min = String(AUTO_RADIUS.min); this.radius.max = String(AUTO_RADIUS.max);
    this.areaEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.set({ ...this.get(), hall: (b as HTMLElement).dataset.hall === '1' })));
    this.radius.addEventListener('input', () => this.set({ ...this.get(), radius: Math.max(AUTO_RADIUS.min, Math.min(AUTO_RADIUS.max, Math.round(+this.radius.value))) }));
    this.keep.addEventListener('change', () => this.set({ ...this.get(), keep: this.keep.checked }));
    this.skillsEl.querySelectorAll('button').forEach((b) => {
      const i = +(b as HTMLElement).dataset.slot!;
      b.innerHTML = `<b>${i + 1}</b><span>${SKILLS[i].nameTh}</span>`;
      b.addEventListener('click', () => { const sk = [...this.get().skills] as AutoSettings['skills']; sk[i] = !sk[i]; this.set({ ...this.get(), skills: sk }); });
    });
    this.kindsEl.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button'); if (!b) return;
      const s = this.get(), v = b.dataset.kind;
      if (v === 'all') this.set({ ...s, kinds: 0 });
      else { const bit = 1 << +v!; this.set({ ...s, kinds: s.kinds ^ bit }); }
    });
    // any change re-renders (the ones above call `set`, which main.ts forwards to the sim input; we redraw from the new state)
    const redraw = () => this.render();
    root.addEventListener('click', redraw); root.addEventListener('input', redraw); root.addEventListener('change', redraw);
  }

  render() {
    const s = this.get();
    // enemy kinds near the player (plus any already selected)
    const shown = this.nearKinds() | s.kinds;
    let html = `<button type="button" data-kind="all" aria-pressed="${s.kinds === 0}">ทุกชนิด</button>`;
    AUTO_KINDS.forEach((k, i) => { if (shown & (1 << i)) html += `<button type="button" data-kind="${i}" aria-pressed="${!!(s.kinds & (1 << i))}">${ENEMIES[k].nameTh}</button>`; });
    if (!(shown & ((1 << AUTO_KINDS.length) - 1))) html += '<small class="ap-none">ไม่มีศัตรูใกล้ตัว</small>';
    this.kindsEl.innerHTML = html;
    this.areaEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.hall === (s.hall ? '1' : '0'))));
    this.radius.value = String(s.radius); this.radiusVal.textContent = `${s.radius} ม.`;
    this.radius.disabled = s.hall; this.radiusRow.classList.toggle('dim', s.hall);
    this.skillsEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(s.skills[+(b as HTMLElement).dataset.slot!])));
    this.keep.checked = s.keep;
  }
}
