// Shared DOM touch input used by both engine spikes (engine-agnostic).
export interface InputState { mx: number; my: number; attack: boolean; dodge: boolean; }

export function createTouchInput(root: HTMLElement): InputState {
  const s: InputState = { mx: 0, my: 0, attack: false, dodge: false };
  const pad = document.createElement('div');
  pad.className = 'pad';
  const knob = document.createElement('div');
  knob.className = 'knob';
  pad.appendChild(knob);
  root.appendChild(pad);
  let id: number | null = null, ox = 0, oy = 0;
  const R = 56;
  pad.addEventListener('pointerdown', (e) => {
    id = e.pointerId; pad.setPointerCapture(id);
    const r = pad.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
    move(e);
  });
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
    s.mx = dx / R; s.my = dy / R;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
  };
  pad.addEventListener('pointermove', move);
  const end = (e: PointerEvent) => { if (e.pointerId !== id) return; id = null; s.mx = s.my = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  const btn = (label: string, cls: string, key: 'attack' | 'dodge') => {
    const b = document.createElement('button'); b.textContent = label; b.className = 'btn ' + cls;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); s[key] = true; });
    root.appendChild(b);
  };
  btn('⚔', 'atk', 'attack'); btn('↯', 'dodge', 'dodge');
  const keys = new Set<string>();
  addEventListener('keydown', (e) => { keys.add(e.code); if (e.code === 'KeyJ') s.attack = true; if (e.code === 'Space') s.dodge = true; });
  addEventListener('keyup', (e) => keys.delete(e.code));
  setInterval(() => {
    if (id !== null) return;
    const x = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    const y = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
    if (keys.size) { s.mx = x; s.my = y; } else if (!(window as any).__botInput) { s.mx = s.my = 0; }
  }, 16);
  (window as any).__input = s;
  return s;
}
