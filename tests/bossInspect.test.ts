// DES-010 §3.4 / §5.3 item 8: a boss file is judged from its bytes; a wrong file is refused (the old boss then stays).
import { describe, it, expect } from 'vitest';
import { inspectBossFiles } from '../src/boss/inspectBoss.ts';
import { inspectHeroFiles } from '../src/seyrin/inspect.ts';
import { COMBAT_CLIPS, BOSS_BONES } from '../src/boss/spec.ts';
import { buildBossGlb, buildBossManifest, type BossFixtureOptions } from './bossFixture.ts';

const run = async (o: BossFixtureOptions = {}, edit: (m: Record<string, any>) => void = () => {}, want: 'combat' | 'preview' = 'combat') => {
  const glb = buildBossGlb(o), m = await buildBossManifest(glb, o.stage ?? 'combat');
  edit(m);
  return inspectBossFiles(glb, JSON.stringify(m), want);
};
const failed = (r: Awaited<ReturnType<typeof run>>, level = 'block') => r.items.filter((i) => i.level === level && !i.ok).map((i) => i.id);

describe('boss file contract (synes.boss-manifest/1)', () => {
  it('the design has ten clips and 22 bones', () => {
    expect(COMBAT_CLIPS.map((c) => c.ticks)).toEqual([48, 24, 51, 60, 30, 12, 45, 30, 33, 12]);
    expect(BOSS_BONES.length).toBe(22);
  });
  it('a file that follows the contract is accepted, with every delivery rule met', async () => {
    const r = await run({}, (m) => { m.measurements.tris = 0; });
    const real = await run({}, (m) => { m.measurements.tris = r.stats.tris; m.measurements.vertices = r.stats.vertices; });
    expect(real.items.filter((i) => !i.ok).map((i) => `${i.id}: ${i.detail}`)).toEqual([]);
    expect(real.accepted).toBe(true);
    expect(real.stats.joints).toBe(22); expect(real.stats.clips.length).toBe(10);
  });
  it.each([
    ['a missing clip', { dropClips: ['stunned'] }, 'clip-allowlist'],
    ['a clip of the wrong length', { stretch: ['slam', 0.1] }, 'clip-length'],
    ['a wrong bone name', { renameBone: ['claw_l', 'claw_left'] }, 'bones'],
    ['an external image', { externalImage: true }, 'self-contained'],
    ['a required extension', { requiredExtension: 'KHR_draco_mesh_compression' }, 'extensions-required'],
    ['more than 2 MiB', { padBytes: 2 * 1024 * 1024 }, 'bytes-budget'],
  ] as [string, BossFixtureOptions, string][])('%s is refused', async (_n, o, id) => {
    const r = await run(o);
    expect(failed(r)).toContain(id); expect(r.accepted).toBe(false);
  });
  it('a sha256 or byte count that is not the file is refused', async () => {
    expect(failed(await run({}, (m) => { m.output.sha256 = '0'.repeat(64); }))).toContain('sha256');
    expect(failed(await run({}, (m) => { m.output.bytes += 1; }))).toContain('bytes');
  });
  it('unreadable bytes and a manifest that is not the boss contract are refused', async () => {
    const m = await buildBossManifest(buildBossGlb());
    expect((await inspectBossFiles(new Uint8Array([1, 2, 3]), JSON.stringify(m))).accepted).toBe(false);
    for (const edit of [(x: any) => { x.schema = 'synes.hero-manifest/1'; }, (x: any) => { x.simKind = 'crab'; }, (x: any) => { x.rulesets = ['combat-2']; }, (x: any) => { x.profileId = 'other'; }, (x: any) => { x.rootMotion = 1; }])
      expect(failed(await run({}, edit))).toContain('manifest');
    expect((await inspectBossFiles(buildBossGlb(), 'not json')).accepted).toBe(false);
  });
  it('the two-clip C0 file never passes as the fight, and passes as a preview', async () => {
    const asCombat = await run({ stage: 'preview' });
    expect(failed(asCombat)).toContain('stage'); expect(asCombat.accepted).toBe(false);
    expect((await run({ stage: 'preview' }, () => {}, 'preview')).accepted).toBe(true);
    // a manifest that claims `combat` over a two-clip file
    expect(failed(await run({ dropClips: COMBAT_CLIPS.slice(2).map((c) => c.name) }))).toContain('clip-allowlist');
  });
  it('delivery rules are measured and reported: size, root motion, material, contract, manifest numbers', async () => {
    expect(failed(await run({ topM: 3.2 }), 'check')).toContain('size');
    expect(failed(await run({ halfWidthM: 1.5 }), 'check')).toContain('size');
    expect(failed(await run({ rootMotion: true }), 'check')).toContain('root-motion');
    expect(failed(await run({ doubleSided: true }), 'check')).toContain('material-opaque');
    expect(failed(await run({}, (m) => { m.clips[2].markers = { impact: [28] }; }), 'check')).toContain('clip-contract');
    expect(failed(await run({}, (m) => { m.measurements.tris = 8000; }), 'check')).toContain('measurements');
  });
  it('a boss file does not pass the hero checker', async () => {
    const glb = buildBossGlb(), m = await buildBossManifest(glb);
    expect((await inspectHeroFiles(glb, JSON.stringify(m))).accepted).toBe(false);
  });
});
