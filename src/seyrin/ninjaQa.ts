// Dev-only playtest entry for `ninja-roam-1` (DES-009 §3, DES-007 rev 4): ?ruleset=ninja-roam-1 on the vite dev server, on this
// machine only (src/seyrin/gate.ts). Seyrin's model, clips, VFX, sounds and HUD are not in yet: the registered Wayfarer placeholder
// plays her rules, and the screen says so. Never part of a published build (main.ts loads this under import.meta.env.DEV only).
import type { Input } from '../input.ts';

export const NINJA_QA_LABEL = 'ninja-roam-1 · ตัวสำรอง Wayfarer · ยังไม่ผ่าน asset';

export function attachNinjaQa(input: Input, ultBtn: HTMLElement) {
  const tag = document.createElement('div');
  tag.id = 'ninja-qa'; tag.textContent = NINJA_QA_LABEL;
  Object.assign(tag.style, { position: 'fixed', left: '50%', top: '4px', transform: 'translateX(-50%)', padding: '2px 10px', font: '600 12px system-ui, sans-serif',
    color: '#1b1430', background: '#ffc857', borderRadius: '10px', zIndex: '40', pointerEvents: 'none' });
  document.body.appendChild(tag);
  // the ult is a real command in this ruleset: stop the old "locked" message (capture phase on the same element runs first)
  ultBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopImmediatePropagation(); input.press('ult'); }, { capture: true });
  addEventListener('keydown', (e) => { if (!e.repeat && e.code === 'Digit4') input.press('ult'); });
}
