// Touch + keyboard input → quantized TickInput once per sim tick. Engine-agnostic.
import { BTN, quantize, type TickInput } from '../shared/sim/input.ts';

type BtnName = 'attack' | 'dodge' | 'skill' | 'potion' | 'retry';
const BIT: Record<BtnName, number> = { attack: BTN.ATTACK, dodge: BTN.DODGE, skill: BTN.SKILL, potion: BTN.POTION, retry: BTN.RETRY };

export class Input {
  private pending: Record<BtnName, number> = { attack: 0, dodge: 0, skill: 0, potion: 0, retry: 0 };
  private held: Record<BtnName, boolean> = { attack: false, dodge: false, skill: false, potion: false, retry: false };
  private lastBits = 0;
  private stickId: number | null = null; private ox = 0; private oy = 0;
  sx = 0; sy = 0; // stick vector, screen space (y down)
  private keys = new Set<string>();
  bot: (() => TickInput) | null = null;
  enabled = true;
  usedStick = false; usedAttack = false; usedDodge = false;

  private zone: HTMLElement; private base: HTMLElement; private knob: HTMLElement;
  constructor(zone: HTMLElement, base: HTMLElement, knob: HTMLElement) {
    this.zone = zone; this.base = base; this.knob = knob;
    const R = 58;
    zone.addEventListener('pointerdown', (e) => {
      if (this.stickId !== null) return;
      this.stickId = e.pointerId; zone.setPointerCapture(e.pointerId);
      this.ox = e.clientX; this.oy = e.clientY;
      base.style.left = `${e.clientX}px`; base.style.top = `${e.clientY}px`; base.classList.add('on');
      knob.style.transform = 'translate(-50%,-50%)';
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stickId) return;
      let dx = e.clientX - this.ox, dy = e.clientY - this.oy;
      const l = Math.hypot(dx, dy);
      if (l > R) { // drag the base along (floating stick)
        this.ox += (dx / l) * (l - R); this.oy += (dy / l) * (l - R); dx = (dx / l) * R; dy = (dy / l) * R;
        base.style.left = `${this.ox}px`; base.style.top = `${this.oy}px`;
      }
      const dead = 8; const m = Math.max(0, Math.hypot(dx, dy) - dead) / (R - dead);
      const n = Math.hypot(dx, dy) || 1;
      this.sx = (dx / n) * m; this.sy = (dy / n) * m;
      if (m > 0.3) this.usedStick = true;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    const end = (e: PointerEvent) => { if (e.pointerId !== this.stickId) return; this.stickId = null; this.sx = this.sy = 0; base.classList.remove('on'); knob.style.transform = 'translate(-50%,-50%)'; };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
    addEventListener('keydown', (e) => {
      if (e.repeat) return; this.keys.add(e.code);
      const map: Record<string, BtnName> = { KeyJ: 'attack', KeyZ: 'attack', KeyK: 'dodge', KeyX: 'dodge', Space: 'dodge', KeyL: 'skill', KeyC: 'skill', KeyQ: 'potion', KeyH: 'potion', KeyR: 'retry', Enter: 'retry' };
      const b = map[e.code]; if (b) { this.press(b); e.preventDefault(); }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.releaseAll(); });
  }

  bindButton(el: HTMLElement, name: BtnName, holdRepeat = false) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.press(name); if (holdRepeat) this.held[name] = true; el.classList.add('down'); });
    const up = () => { this.held[name] = false; el.classList.remove('down'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  }
  press(name: BtnName) { this.pending[name] = Math.min(2, this.pending[name] + 1); if (name === 'attack') this.usedAttack = true; if (name === 'dodge') this.usedDodge = true; }
  releaseAll() { for (const k of Object.keys(this.held) as BtnName[]) this.held[k] = false; this.stickId = null; this.sx = this.sy = 0; this.base.classList.remove('on'); }

  /** One quantized input per sim tick. Every tap yields a rising edge (0→1) the sim can see. */
  sample(): TickInput {
    if (this.bot) return this.bot();
    if (!this.enabled) { this.lastBits = 0; return quantize(0, 0, 0); }
    let bits = 0;
    for (const k of Object.keys(BIT) as BtnName[]) {
      const bit = BIT[k];
      if (this.lastBits & bit) continue; // force release this tick so the next press is an edge
      if (this.pending[k] > 0) { bits |= bit; this.pending[k]--; }
      else if (this.held[k]) bits |= bit;
    }
    this.lastBits = bits;
    let x = this.sx, y = this.sy;
    const kx = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const ky = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; this.usedStick = true; }
    // camera looks toward −Z with no yaw, so screen-down maps to +Z
    return quantize(x, y, bits);
  }
}
