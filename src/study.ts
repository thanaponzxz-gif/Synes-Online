// Tone-study renderer: ?study=<town|shop|trail|mystery|combat|clearing>&tone=<id>
// Renders in-engine at the real gameplay camera so each image shows what a phone can actually draw.
import { CanvasTexture, Mesh, MeshLambertMaterial, PlaneGeometry, SRGBColorSpace, type Object3D } from 'three';
import { World } from '../shared/sim/world.ts';
import { quantize } from '../shared/sim/input.ts';
import type { View } from './render/view.ts';
import { makeProp, makePuffcap, makeHero, makeThornling } from './render/models.ts';
import type { Tone } from './render/tones.ts';
import type { Hud } from './ui/hud.ts';

export async function runStudy(view: View, hud: Hud, kind: string, tone: Tone) {
  view.atmosOn = false; // tone studies compare the tone presets themselves; the DES-004 arena atmosphere would override them
  view.applyTone(tone);
  const w = new World(5);
  w.player.hp = w.player.maxHp = 99999; // studies must never end in a defeat screen
  let steps = 0;
  if (kind === 'trail') {
    w.player.x = 1.0; w.player.z = -9.5; w.player.fx = 0.1; w.player.fz = -1;
    view.buildLevel(w, 7);
  } else if (kind === 'combat') {
    w.player.x = -2.5; w.player.z = -71; view.buildLevel(w, 7);
    // advance the real sim until the boss is mid-telegraph
    for (steps = 0; steps < 30 * 40; steps++) {
      view.beforeTick(); w.step(quantize(0, 0, 0));
      const t = w.tele[0];
      if (w.bossStarted && t && t.atk.id !== 'charge' && 1 - t.t / t.total > 0.55) break;
    }
  } else if (kind === 'clearing') {
    w.player.x = 3; w.player.z = -33.5; view.buildLevel(w, 7);
    for (steps = 0; steps < 30 * 20; steps++) { view.beforeTick(); w.step(quantize(0, 0, 0)); if (w.tele.length >= 2 && w.tele.every((t) => 1 - t.t / t.total > 0.35)) break; }
  } else {
    w.player.x = 0; w.player.z = 1; w.player.fx = 0; w.player.fz = -1;
    view.buildLevel(w, 7);
    for (const a of w.actors) if (a.kind !== 'player') a.alive = false;
    view.env.clear();
    diorama(view, kind, tone);
  }
  w.player.hp = w.player.maxHp = 120; // display normal HP in the HUD
  hud.queueHint(kind === 'combat' ? 'pillar' : kind === 'clearing' ? 'dodge' : kind === 'trail' ? 'move' : '__none');
  for (let i = 0; i < 45; i++) { view.render(w, 1, 1 / 60); hud.update(w, 1 / 60, (id, h, out) => view.actorScreenPos(id, h, out)); }
  (window as any).__studyReady = { kind, tone: tone.id, steps, telegraphs: w.tele.length, calls: view.renderer.info.render.calls, tris: view.renderer.info.render.triangles };
}

function diorama(view: View, kind: string, tone: Tone) {
  const env = view.env;
  const put = (o: Object3D, x: number, z: number, rot = 0, s = 1) => { o.position.set(x, 0, z); o.rotation.y = rot; o.scale.setScalar(s); env.add(o); return o; };
  const prop = (n: string, x: number, z: number, rot = 0, s = 1) => put(makeProp(n), x, z, rot, s);
  // ground
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d')!;
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
  g.fillStyle = hex(tone.grassA); g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,40,0,0.06)'; g.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3); }
  const S = 1024 / 60, U = (x: number) => (x + 30) * S, V = (z: number) => (z + 33) * S; // plane centred at (0,-3)
  if (kind === 'town') {
    g.fillStyle = hex(tone.pathEdge); g.beginPath(); g.arc(U(0), V(-3), 9.2 * S, 0, 7); g.fill();
    g.fillStyle = hex(tone.path); g.beginPath(); g.arc(U(0), V(-3), 8.8 * S, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 2;
    for (let r = 1.5; r < 9; r += 1.4) { g.beginPath(); g.arc(U(0), V(-3), r * S, 0, 7); g.stroke(); }
    for (let a = 0; a < 24; a++) { g.beginPath(); g.moveTo(U(0), V(-3)); g.lineTo(U(Math.cos(a / 3.82) * 9), V(-3 + Math.sin(a / 3.82) * 9)); g.stroke(); }
    g.fillStyle = hex(tone.path); g.fillRect(U(-2.5), V(4), 5 * S, 12 * S);
  } else if (kind === 'shop') {
    g.fillStyle = hex(tone.pathEdge); g.fillRect(U(-9), V(-9), 18 * S, 14 * S);
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? hex(tone.path) : shade(tone.path, -12); g.fillRect(U(-8.6), V(-8.6 + i * 0.75), 17.2 * S, 0.72 * S); }
    g.fillStyle = '#8e2f4f'; g.fillRect(U(-1.2), V(-2), 2.4 * S, 7 * S);
    g.fillStyle = hex(tone.rune); g.fillRect(U(-1.2), V(-2), 0.12 * S, 7 * S); g.fillRect(U(1.08), V(-2), 0.12 * S, 7 * S);
  } else {
    g.fillStyle = hex(tone.pathEdge); g.beginPath(); g.ellipse(U(0), V(-2), 6 * S, 7.5 * S, 0, 0, 7); g.fill();
    g.fillStyle = shade(tone.path, -10); g.beginPath(); g.ellipse(U(0), V(-2), 5.4 * S, 6.9 * S, 0, 0, 7); g.fill();
    g.strokeStyle = hex(tone.rune); g.globalAlpha = 0.55; g.lineWidth = 0.18 * S;
    g.beginPath(); g.arc(U(0), V(-2.5), 3.2 * S, 0, 7); g.stroke(); g.beginPath(); g.arc(U(0), V(-2.5), 2.6 * S, 0, 7); g.stroke();
    for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(U(Math.cos(a * 0.785) * 2.6), V(-2.5 + Math.sin(a * 0.785) * 2.6)); g.lineTo(U(Math.cos(a * 0.785) * 3.2), V(-2.5 + Math.sin(a * 0.785) * 3.2)); g.stroke(); }
    g.globalAlpha = 1;
  }
  const tex = new CanvasTexture(c); tex.colorSpace = SRGBColorSpace; tex.anisotropy = 4;
  const ground = new Mesh(new PlaneGeometry(60, 60), new MeshLambertMaterial({ map: tex }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -3); ground.receiveShadow = true; env.add(ground);
  const trees = tone.treeMix;
  const ring = (n: number, r0: number, r1: number, zMin: number) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = r0 + Math.random() * (r1 - r0); const x = Math.cos(a) * r, z = -3 + Math.sin(a) * r; if (z > zMin) continue; prop(trees[i % trees.length], x, z, Math.random() * 6, 0.9 + Math.random() * 0.4); } };

  if (kind === 'town') {
    prop('fountain', 0, -4.5);
    prop('house_a', -7.5, -8, 0.3); prop('house_b', 7.2, -8.5, -0.3); prop('house_b', -10.5, -2, 1.2); prop('house_a', 10.5, -1.5, -1.3);
    prop('market_stall', -5, 1.2, 0.5); prop('market_stall', 5.2, 1.5, -0.5);
    prop('banner', -3.5, -8.5); prop('banner', 3.5, -8.5); prop('lantern_post', -3, 4.5); prop('lantern_post', 3, 4.5);
    prop('crystal_cluster', -1.8, -2.4, 0, 0.7); prop('crystal_cluster', 2.1, -2.2, 1, 0.6); prop('flower_patch', -6, -4); prop('flower_patch', 6, -3.5); prop('bush', -8, 3); prop('bush', 8.5, 3.5);
    put(makePuffcap(), -2.6, -0.4, 0.6, 1.1); put(makePuffcap(), 3.4, -1.2, -0.8, 0.9);
    put(makeHero(), 3.0, -1.9, -2.3, 1.15);
    ring(26, 13, 20, 6);
  } else if (kind === 'shop') {
    prop('shop_counter', 0, -4.5); prop('weapon_rack', -4.2, -7.6); prop('weapon_rack', 4.2, -7.6);
    prop('banner', -7.5, -7.5); prop('banner', 7.5, -7.5); prop('banner', 0, -8.4, 0, 1.1);
    prop('market_stall', -6.5, -2.5, 1.3); prop('market_stall', 6.5, -2.5, -1.3);
    prop('lantern_post', -2.8, -3.2); prop('lantern_post', 2.8, -3.2); prop('lantern_post', -7.8, 2.5); prop('lantern_post', 7.8, 2.5);
    prop('crystal_cluster', -5.5, -6.6, 0, 0.8); prop('crystal_cluster', 5.6, -6.4, 1, 0.8);
    prop('house_b', -10.5, -9, 0.2, 1.1); prop('house_a', 10.8, -9.5, -0.2, 1.1); prop('house_a', 0, -12.5, 0, 1.25);
    const keeper = put(makeHero(), 0.4, -5.7, 0, 1.15); keeper.rotation.y = 0;
    put(makePuffcap(), -1.6, -5.4, 0.2, 0.75);
    prop('rock_b', -8.5, 4); prop('flower_patch', 8.5, 4.5);
    ring(18, 15, 21, 4);
  } else { // mystery
    prop('ruin_arch', 0, -7.2); prop('ruin_column', -4.2, -4, 0.4); prop('ruin_column', 4.5, -5, 2.0); prop('ruin_column', -5.5, 1, 1.0, 0.8); prop('ruin_column', 5.8, 0.8, 3.1, 0.9);
    for (const [x, z, s] of [[-2.8, -6, 1.2], [3, -6.4, 1.0], [-6.5, -3, 1.3], [6.8, -2.2, 1.1], [-3.5, 2.8, 0.8], [3.8, 3, 0.9], [0, -9.5, 1.6]] as const) prop('crystal_cluster', x, z, x, s);
    for (let i = 0; i < 14; i++) prop('mushroom_glow', (Math.random() - 0.5) * 14, -8 + Math.random() * 12, 0, 0.8 + Math.random() * 0.8);
    prop('lumen_spring', 0, -3.2, 0, 0.8);
    put(makeThornling(), -3.2, -1.5, 0.8, 1.1);
    prop('rock_a', -7.5, -6); prop('rock_a', 7.6, -7); prop('rock_b', 8, 2);
    ring(30, 9, 19, 5);
  }
}

function shade(c: number, d: number) {
  const r = Math.max(0, Math.min(255, ((c >> 16) & 255) + d)), g = Math.max(0, Math.min(255, ((c >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (c & 255) + d));
  return `rgb(${r},${g},${b})`;
}
