// Actual owner's output validation; fixture code is not used to create character art.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { inspectHeroFiles, parseGlb } from '../../../src/seyrin/inspect.ts';
import { PREVIEW_CLIPS } from '../../../src/seyrin/spec.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),inbox=path.join(root,'assets/_inbox');
const file=path.join(inbox,'char_hero001_ninja_preview_v01.glb'),data=fs.readFileSync(file),hash=crypto.createHash('sha256').update(data).digest('hex');
const production=JSON.parse(fs.readFileSync(path.join(inbox,'char_hero001_ninja_preview_v01.production.json'),'utf8'));
const {json:j}=parseGlb(data);
const manifest={schema:'synes.hero-manifest/1',assetId:'hero001_ninja',version:'v01',stage:'preview',units:'meter',axes:{up:'+Y',forward:'+Z'},rootMotion:0,
 output:{file:path.basename(file),sha256:hash,bytes:data.length},clips:structuredClone(PREVIEW_CLIPS),
 source:{file:'char_hero001_ninja_hy3d_raw_v01.glb',sha256:production.sourceSha256,ownerDecision:'REQ-009 section 5, 2026-11-28: use this v01; skip waiting on additional provenance/terms'},
 tools:{blender:production.blender,production:'Codex, owner-authorised local headless Blender; no service used'},
 cloth:{status:'P1 static rest, Q4 not accepted; do not enable full solver with these flared source rest chains',chains:production.cloth},
 presentation:{motionProfile:'DES-007 rev4 / DES-009 P1, owner source override 2026-11-28',fps:30,rootMotion:0,backWeapons:'decorative, chest-weighted',remainingClips:14},
};
const report=await inspectHeroFiles(data,JSON.stringify(manifest));manifest.measurements=report.stats;
fs.writeFileSync(path.join(inbox,'char_hero001_ninja_preview_v01.manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(inbox,'char_hero001_ninja_preview_v01.inspect.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.accepted,stats:report.stats,failures:report.items.filter(i=>!i.ok)},null,2));
if(!report.accepted||report.items.some(i=>!i.ok))process.exitCode=1;
