// DES-009 §2.2: the P1 pose viewer exists only on the owner's machine (loopback) in development. It is not a way into
// the game, and a production build or a phone on the LAN never gets it.
import { describe, it, expect } from 'vitest';
import { previewAllowed, ninjaQaAllowed } from '../src/seyrin/gate.ts';

const q = (s: string) => new URLSearchParams(s);

describe('previewAllowed', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', 'game.localhost'])('dev server on %s with ?seyrin=preview', (host) => {
    expect(previewAllowed(true, host, q('seyrin=preview'))).toBe(true);
  });
  it.each(['192.168.1.20', '10.0.0.5', 'thanaponzxz-gif.github.io', 'localhost.example.com', 'mylocalhost', '127.0.0.1.nip.io', ''])('not on %s', (host) => {
    expect(previewAllowed(true, host, q('seyrin=preview'))).toBe(false);
  });
  it('never in a production build, and never without the explicit flag', () => {
    expect(previewAllowed(false, 'localhost', q('seyrin=preview'))).toBe(false);
    expect(previewAllowed(true, 'localhost', q(''))).toBe(false);
    expect(previewAllowed(true, 'localhost', q('seyrin=1'))).toBe(false);
  });
});

describe('ninjaQaAllowed (ninja-roam-1 with the Wayfarer placeholder)', () => {
  it('only a dev server on this machine, only with ?ruleset=ninja-roam-1', () => {
    expect(ninjaQaAllowed(true, 'localhost', q('ruleset=ninja-roam-1'))).toBe(true);
    expect(ninjaQaAllowed(true, '127.0.0.1', q('ruleset=ninja-roam-1&bot=1'))).toBe(true);
    expect(ninjaQaAllowed(false, 'localhost', q('ruleset=ninja-roam-1'))).toBe(false);
    for (const host of ['192.168.1.20', 'thanaponzxz-gif.github.io', 'mylocalhost']) expect(ninjaQaAllowed(true, host, q('ruleset=ninja-roam-1')), host).toBe(false);
    for (const s of ['', 'ruleset=ninja', 'ruleset=roam-1', 'combo=ninja-roam-1']) expect(ninjaQaAllowed(true, 'localhost', q(s)), s).toBe(false);
  });
});
