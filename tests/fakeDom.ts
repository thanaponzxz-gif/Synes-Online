// A stand-in DOM, just enough for the damage-number DOM layer (src/ui/floaters.ts) to run in vitest: elements that remember their
// style and children, a canvas 2D context that "measures" text, and the few globals it asks for. No layout, no painting: tests that
// use it check the host's queue, clock and rules, never how things look (that is checked in the real browser).
import { vi } from 'vitest';

export class FakeElement {
  className = ''; textContent = ''; width = 0; height = 0;
  children: FakeElement[] = []; parent: FakeElement | null = null;
  style = { cssText: '', setProperty(this: Record<string, unknown>, k: string, v: string) { this[k] = v; } } as Record<string, unknown> & { cssText: string; setProperty(k: string, v: string): void };
  private classes = new Set<string>();
  classList = {
    add: (c: string) => { this.classes.add(c); },
    remove: (c: string) => { this.classes.delete(c); },
    toggle: (c: string, on?: boolean) => { const v = on ?? !this.classes.has(c); if (v) this.classes.add(c); else this.classes.delete(c); return v; },
    contains: (c: string) => this.classes.has(c),
  };
  readonly tag: string;
  constructor(tag = 'div') { this.tag = tag; }
  appendChild(c: FakeElement) { c.remove(); c.parent = this; this.children.push(c); return c; }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  setAttribute() {}
  addEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  /** every glyph 0.6 em wide: stable numbers for the host's measuring */
  getContext() {
    let size = 10;
    return {
      set font(f: string) { size = parseFloat(/([\d.]+)px/.exec(f)?.[1] ?? '10'); },
      measureText(t: string) { const width = t.length * size * 0.6; return { width, actualBoundingBoxLeft: 0, actualBoundingBoxRight: width, actualBoundingBoxAscent: size * 0.75, actualBoundingBoxDescent: size * 0.2 }; },
      clearRect() {}, strokeRect() {}, set strokeStyle(_: string) {}, set lineWidth(_: number) {},
    };
  }
}

export function installFakeDom(width = 844, height = 390) {
  const body = Object.assign(new FakeElement('body'), { offsetHeight: height });
  vi.stubGlobal('document', { createElement: (tag: string) => new FakeElement(tag), body, querySelectorAll: () => [] });
  vi.stubGlobal('CSS', { supports: () => true });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {} }));
  vi.stubGlobal('addEventListener', () => {});
  vi.stubGlobal('getComputedStyle', () => ({ paddingLeft: '0px', paddingRight: '0px', paddingTop: '0px', paddingBottom: '0px' }));
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
}
