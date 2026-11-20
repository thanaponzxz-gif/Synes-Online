// Regenerates tests/fixtures/combat1-golden.json. ONLY run this on code whose `combat-1` behaviour is known good
// (it was first generated before the combo ruleset change). Run: npx vite-node tools/qa/combo-golden.ts
import fs from 'node:fs';
import { GOLDEN_CASES } from '../../tests/golden.ts';
const out: Record<string, unknown> = {};
for (const c of GOLDEN_CASES) out[c.id] = c.run();
fs.writeFileSync(new URL('../../tests/fixtures/combat1-golden.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(Object.keys(out).length, 'cases written');
