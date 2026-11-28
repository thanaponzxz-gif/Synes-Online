// Prints the DES-010 §3.1 / §3.4 check of a boss GLB + manifest (private files: pass the inbox folder, nothing is copied).
// Usage: node --experimental-strip-types --no-warnings tools/qa/boss-inspect.ts <inboxDir> [stem] [preview|combat]
import fs from 'node:fs';
import path from 'node:path';
import { inspectBossFiles } from '../../src/boss/inspectBoss.ts';

const dir = process.argv[2] || process.env.SYNES_SEYRIN_DIR || 'assets/_inbox', stem = process.argv[3] || 'mon_boss_crab_v02';
const stage = process.argv[4] === 'preview' ? 'preview' : 'combat';
const r = await inspectBossFiles(new Uint8Array(fs.readFileSync(path.join(dir, `${stem}.glb`))), fs.readFileSync(path.join(dir, `${stem}.manifest.json`), 'utf8'), stage);
for (const i of r.items) console.log(`${i.ok ? 'PASS' : 'FAIL'}  [${i.level}] ${i.id}  — ${i.detail}`);
console.log(`\n${r.accepted ? 'ACCEPTED' : 'REJECTED'} · ${r.stats.tris} tris · ${r.stats.joints} joints · ${r.stats.clips.length} clips · ${r.stats.bytes} bytes · sha256 ${r.stats.sha256}`);
process.exit(r.accepted && r.items.every((i) => i.ok) ? 0 : 1);
