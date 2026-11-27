// DES-008 R3-4: replay a frame trace recorded by the damage-number DOM layer (__synesQA.floatTrace*) through FloatBook, with only
// the side inset changed. Same events, same event times and the same geometry in every frame, so two replays differ by the placement
// rule alone. The host's order per frame is mirrored: clock -> live labels checked against this frame's geometry -> waiting batches
// placed -> checked again -> painted (notePaint with opacityAt). Replaying with the live inset must reproduce the live attempts and
// ends (tests/dmgReplay.test.ts, and tools/qa/dmg-cohort.mjs checks it on every real window). Run in node >= 22.6 (TS types stripped).
import { FloatBook, LAYOUT, opacityAt } from '../../src/ui/floatCore.ts';

export const boxKey = (kind, S, text, count) => `${kind}|${S.toFixed(3)}|${text}|${count > 1 ? count : 0}`;

/** px from R to the nearest protected rect: along the better axis (any), and for rects that overlap R sideways only (vertical) */
function clearance(R, prot) {
  let any = Infinity, vertical = Infinity;
  for (const p of prot) {
    const dx = Math.max(p.l - R.r, R.l - p.r), dy = Math.max(p.t - R.b, R.t - p.b);
    any = Math.min(any, Math.max(dx, dy));
    if (dx < 0) vertical = Math.min(vertical, dy);
  }
  return { any, vertical };
}

/** boxes: text sizes the live host measured, by boxKey; keys the replay needed and did not find are listed in `missing` (then the
 *  replay is not valid: measure them in the page and run again). attempts carry the index of the trace entry that placed them. */
export function replay(trace, { boxes = {}, inset = LAYOUT.inset } = {}) {
  const saved = LAYOUT.inset;
  LAYOUT.inset = inset;
  try { return run(trace, boxes); } finally { LAYOUT.inset = saved; }
}

function run(trace, boxes) {
  const book = new FloatBook(), attempts = [], ends = [], missing = new Set(), gaps = {};
  let at = 0;
  book.onAttempt = (a) => attempts.push({ ...a, frame: at });
  book.onRetire = (l, cause, why) => ends.push({ uid: l.uid, cause, why, age: Math.round(book.age(l)), readable: l.readable, painted: l.painted, frame: at });
  for (; at < trace.length; at++) {
    const f = trace[at];
    if (f.start) { book.resync(f.start.clock); book.uid = f.start.uid; continue; }
    if (f.clear !== undefined) { book.clear(f.clear); continue; }
    if (f.resync !== undefined) { book.resync(f.resync); continue; }
    book.q = f.q; book.reduced = f.reduced;
    book.setClock(f.c);
    const geo = {
      S: f.S, safe: f.safe, prot: f.prot,
      actor: (id, out) => { const a = f.actors[id]; if (!a) return 1; if (a[0] === 0) Object.assign(out, a[1]); return a[0]; },
      box: (kind, text, count) => { const k = boxKey(kind, f.S, text, count); if (k in boxes) return boxes[k]; missing.add(k); return null; },
    };
    book.frame(geo);
    if (f.batches.length) { for (const b of f.batches) book.ingest(b.list, geo, b.eventMs); book.frame(geo); }
    for (const l of book.labels) {
      const op = opacityAt(l.kind, book.age(l), l.life, book.reduced);
      book.notePaint(l, op);
      if (op > 0) {
        const c = clearance(l.screen, f.prot), g = (gaps[l.uid] ??= { any: Infinity, vertical: Infinity });
        g.any = Math.min(g.any, c.any); g.vertical = Math.min(g.vertical, c.vertical);
      }
    }
  }
  return { attempts, ends, stats: book.stats, gaps, alive: book.labels.map((l) => l.uid), missing: [...missing] };
}
