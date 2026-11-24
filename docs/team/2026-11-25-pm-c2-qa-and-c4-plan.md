# PM: ผล QA อิสระ C-2 + แผน C-4 · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-E
## 1. รับ patch
- ไฟล์ `0001-C-2-Dispose-level-owned-render-resources-on-rebuild.patch` · SHA256 `1368EC32C4EF2221113F703DB8D26836B681EBB7B64B331E6C035753B6CDE3C8` **ตรงกับที่แจ้ง** · commit ของ Codex `69301b5` (branch ในเครื่อง `lane/codex-c2`)
- PM อ่านโค้ดแล้ว: ไม่มี network/eval/child_process, URL มีแค่ localhost, path Edge เป็น path ระบบทั่วไป (ไม่มีชื่อผู้ใช้)
- ฐานทดสอบบนคลาวด์: `24f56b4` + `fix2_code.patch` (= โค้ดของ `839c9c0`) → C-2 apply ได้สะอาด (ยกเว้น hunk ของ `docs/HANDOFF.md` ซึ่งเป็นเอกสาร)

## 2. QA อิสระ (agent ที่ไม่ได้เขียน C-2) · ผล: **PASS with notes** · Blocker 0 · Major 0 · Minor 3 · Info 2
รายงานเต็ม + หลักฐานดิบ (ไม่มีภาพ pilot): `docs/qa/c2-v01/QA_C2.md` · Chromium 158 + SwiftShader, Minimal WebGL2 Test = READY ก่อนเริ่ม
| # | เกณฑ์ | ผล | ค่าที่วัด |
|---|---|---|---|
| 1 | รั่วต่อ rebuild (10 ครั้ง × low / medium / medium+envlib) | PASS | หลังแก้ geometries/textures +0 ทุกครั้ง (คงที่ 38/40/47, 3/4/4) · ก่อนแก้ +16/+17/+17 และ +1 texture (เครื่องมือของ Codex) · เครื่องมือของ QA เอง (บังคับ upload ทุกวัตถุ) หลังแก้ +0 geometry/texture/program, ก่อนแก้ +17/+18/+18 · `arena=B&spire=B`, `vfx=cur`, `nokit` = +0 |
| 2 | error / double-dispose / วัตถุครบ | PASS (ดู F1, F2) | page/console error 0 · double-dispose 0 · ของที่ใช้ร่วมถูก dispose ขณะยังใช้ (มี kit) 0 · ภาพหลัง rebuild 5 ครั้ง ตรงก่อนแก้ 6/6 |
| 3 | context loss/restore หลัง rebuild | PASS | กลับมา playing, error 0, memory เท่าโหลดใหม่, ภาพ 6/6 ตรง · `opening-smoke` 10/10 |
| 4 | stage1-shots low/medium, envlib ปิด/เปิด | PASS | 100 ภาพต่อฝั่ง · draw calls ตรง 100/100 · tris ตรง 92/100 (8 ภาพที่ต่างเป็น VFX ที่สุ่มด้วย `Math.random` ก่อนแก้รันซ้ำก็ต่าง เมื่อ seed สุ่มแล้วตรง) · ฉาก 3D ตรงทุกพิกเซล ความต่างอยู่ใน HUD ที่เคลื่อนตามเวลาจริงเท่านั้น |
| 5 | lifecycle | PASS | หลังแก้ 20/20 · ก่อนแก้ 20/20 |
| 6 | vitest / tsc / build | PASS | 168/168 · ผ่าน · ผ่าน |
PM ตรวจซ้ำหลักฐานดิบ: `level-leak-author-after.json` คงที่ทุกเงื่อนไข error 0 · `-before.json` เพิ่ม +16/+17 ต่อรอบ · `programs-per-rebuild.jsonl` ตรงกับ F2

**ข้อค้นพบ**
- **F1 (Minor):** ตอนไม่มี kit (`?nokit` หรือโหลด GLB ไม่สำเร็จ) material ที่แคชร่วม (`lam()`, `models.ts:17`) ถูก dispose 15 ชิ้นต่อ rebuild แล้วถูกใช้ต่อ → ไม่มี error ภาพไม่เปลี่ยน แต่ต้องคอมไพล์ใหม่ และขัดกับ comment ของ patch (`view.ts:112`) · เกมปกติที่มี kit ไม่เกิด
- **F2 (Minor, perf/ความรู้สึก):** rebuild แต่ละครั้งคอมไพล์ shader program ใหม่มากขึ้น (medium 9 → 15, nokit 6–7 → 15–16) เพราะ dispose ถูกต้องแล้ว three.js ลบ program ที่ไม่มีใครอ้าง แล้วคอมไพล์ใหม่ · เฟรมแรกหลัง rebuild บน SwiftShader medium ~230–290 → 330–380 ms · เกิดตอนเริ่มใหม่ / เปลี่ยนคุณภาพ / context restore · บนมือถือจริงยังไม่ทราบ
- **F3 (Minor, เครื่องมือ):** `level-leak.mjs` นับเฉพาะของที่กล้องตอนเริ่มเห็น ไม่นับ console error และ program แต่ผลหลังแก้ (0) ตรงกับการวัดของ QA
- F4 (Info, ดีขึ้น): ก่อนแก้ dispose material baked ของ kit ที่ใช้ร่วม 3 ครั้งต่อ rebuild · patch แก้แล้ว
- F5 (Info, ไม่ใช่ C-2): phase อนิเมชันไฟ/พัฟแคปหลัง rebuild ต่างจากโหลดใหม่ (มาจาก `Object3D.id`) เหมือนกันทั้งก่อน/หลัง
**ไม่ได้ตรวจ:** มือถือจริง/GPU จริง, พิกเซล VFX (สุ่มตามเวลาจริง), เล่นยาวแบบ retry ผ่าน UI, หน่วยความจำ GPU เป็นไบต์, พิกเซลของ `arena=B`/`spire=B`

**สถานะ:** ผ่านเกณฑ์ C-2 ครบ 6 ข้อ · **ยังไม่ merge ยังไม่ push** (ฐาน `839c9c0` ยังไม่อยู่บน remote และยังไม่อนุมัติ push pilot) · F2 เป็นเรื่องที่ผู้เล่นอาจรู้สึก (เฟรมแรกหลังเริ่มใหม่ช้าขึ้น) → **เจ้าของตัดสิน** ว่าจะรับ C-2 ตามนี้ หรือให้ทำ C-2b ก่อน

## 3. ข้อเสนอ C-2b (ต้องให้เจ้าของอนุมัติ · ไม่เปลี่ยนภาพ)
- F1: ไม่ใส่ material จาก cache `lam()` ลงชุดที่จะ dispose (เก็บเฉพาะ geometry/material ที่สร้างใหม่จริง)
- F2: dispose ของด่านเก่า **หลัง** เฟรมแรกของด่านใหม่ (program ยังถูกอ้างอยู่ จึงไม่ต้องคอมไพล์ใหม่) · เกณฑ์: รั่ว +0 เหมือนเดิม และ program ใหม่ต่อ rebuild ≤ ค่าก่อนแก้ (medium ≤ 9, nokit ≤ 7)
- แก้ `level-leak.mjs` ตาม F3 (บังคับ upload ทุกวัตถุ, นับ program และ console error)
- branch เดิม `lane/codex-c2` เป็น commit ที่ 2 · ใช้ช่องทาง patch → QA อิสระบนคลาวด์เหมือน C-2

## 4. แผน C-4 (ตัวตรวจ HUD ใน repo) · เริ่มได้โดยไม่รอ C-1
- **ทำไมได้เลย:** แตะแค่ `tools/qa/` ไม่ชนกับ C-1 (กล้องใน `view.ts`) และ C-2 (dispose) · เป็นเกณฑ์ผ่านของงาน R5.2 ที่ทีม A กำลังออกแบบ (ต้นไม้บัง Potion) จึงควรพร้อมก่อนแบบใหม่มาถึง
- **ข้อจำกัด:** ต้องใช้เบราว์เซอร์ WebGL2 → บนเครื่องเจ้าของน่าจะติดเหมือนเดิม → Codex เขียนโค้ด + vitest/tsc/build แล้วส่ง patch, PM รันชุดเต็มบนคลาวด์ + QA อิสระ (เหมือน C-2)
- worktree `codex-c4` · branch `lane/codex-c4` · ฐาน `839c9c0` (ไม่ขึ้นกับ C-2) · port 8096

### พรอมป์ต์ C-4 (คัดลอกทั้งกล่อง)
```text
คุณคือ Codex ทำงาน Local บนเครื่องของเจ้าของโปรเจกต์ Synes Online ตามที่เจ้าของอนุมัติ
Task ID: C-4 (ย้ายตัวตรวจ HUD เข้า repo) · reasoning ปานกลาง
C-1 พักอยู่ (BLOCKED) และ C-2 รอเจ้าของตัดสิน ห้ามแตะงานทั้งสอง

ที่ทำงาน (ใหม่ แยกจาก C-1/C-2)
- Worktree: C:\SYNES_ASSETS\_repo_worktrees\codex-c4 · branch lane/codex-c4 · ฐาน 839c9c00ab8ab3a447d1f9798e2f11995c34ac8b
    git -C C:\SYNES_ASSETS\_repo_worktrees\codex-r5 worktree add C:\SYNES_ASSETS\_repo_worktrees\codex-c4 -b lane/codex-c4 839c9c00ab8ab3a447d1f9798e2f11995c34ac8b
  ถ้า branch มีอยู่แล้ว ให้หยุดและรายงาน
- ห้ามแตะ worktree codex-r5, codex-c2, synes-env-r5 และ checkout หลักของเจ้าของ
- node_modules: junction ไปเป้าหมายเดียวกับ codex-r5 ห้าม npm install / npm ci
    $t = (Get-Item C:\SYNES_ASSETS\_repo_worktrees\codex-r5\node_modules).Target
    cmd /c mklink /J C:\SYNES_ASSETS\_repo_worktrees\codex-c4\node_modules "$t"
- ตัวแปรคำสั่ง: ข้อ 4 ของ C:\SYNES_ASSETS\SYNES_OUTPUT\CODEX_HANDOFF_R5.md โดยเปลี่ยน $WT = 'C:\SYNES_ASSETS\_repo_worktrees\codex-c4', port 8096, ตัวกรองปิดเซิร์ฟเวอร์ 'codex-c4\\server\\index\.ts'

อ่านก่อนเริ่ม: CLAUDE.md, AGENTS.md, docs/HANDOFF.md ส่วนบนสุด, CODEX_HANDOFF_R5.md

กฎ (เหมือนเดิมทุกข้อ)
1. ทีม A เป็น Design Authority งานนี้เป็นเครื่องมือ QA ห้ามแก้ไฟล์ใน src/ shared/ server/ public/ และห้ามเปลี่ยนสิ่งที่ผู้เล่นเห็นหรือรู้สึก
2. ห้าม push ห้าม merge ห้ามจ่ายเงิน ห้ามติดตั้ง ห้ามใส่ไฟล์ Hero หรือข้อมูลส่วนตัว (อีเมล ชื่อผู้ใช้ path ที่มีชื่อผู้ใช้) ในไฟล์ใด ๆ
3. Gaming Mode: เปิดตัวเฝ้าก่อนงานหนัก รันงานหนักผ่าน gaming_run.ps1 ทีละ process ถ้าปฏิเสธ (exit 3/4/5) หรือพักงาน ให้หยุดรอ ห้ามหาทางเลี่ยง ห้ามแก้หรือปิดระบบควบคุมทรัพยากร
4. commit เดียว ข้อความขึ้นต้น "C-4:" ลงท้าย attribution ตามที่ระบบกำหนด · git add ทีละ path (ห้าม git add -A / .)
5. คุณตรวจงานตัวเองแทน QA อิสระไม่ได้

ขั้น 0: Minimal WebGL2 Test ครั้งเดียว (เหมือน C-2): ดึงไฟล์แบบไม่ stage
    git -C $WT fetch origin art/env-polish
    git -C $WT restore --source=origin/art/env-polish --worktree -- tools/qa/webgl2-probe.mjs
  รันผ่าน gaming_run.ps1 พร้อม --out "$WT\c4_webgl2_probe.json" · ห้าม add ไฟล์นี้ · READY = รันขั้นเบราว์เซอร์ได้ · NOT READY = ข้ามขั้นเบราว์เซอร์ ห้ามวินิจฉัยซ้ำ เขียนว่า "ยังไม่ได้รัน รอ PM รันบนคลาวด์"

ต้นฉบับ (อ่านอย่างเดียว ห้ามแก้): C:\SYNES_ASSETS\SYNES_OUTPUT\r5\pilot_fix2\tools\hud_gate.mjs, hud_gate_measure.mjs, qa_core.mjs และไฟล์ที่มัน import
- ตัวเดิมต้องมีเซิร์ฟเวอร์ 2 ตัวที่ใช้ path ในเครื่อง (start_srv.mjs) จึงรันได้แค่เครื่องนี้
- วัด 4 ปุ่ม (Potion, Dodge, Attack, Joystick) ทั้ง low และ medium ทุกจุดในโซนเดินได้ (player z >= -41, ตาราง 1.5 m, กล้องสนาม 844x390, วาดเฉพาะ scatter บนพื้นดำ) แล้วรายงาน 2 เกณฑ์แยกกัน: (1) ไม่แย่กว่า baseline (จำนวนจุด >60% และค่าเฉลี่ย) (2) 0 จุดที่บังเกิน 60% · exit 1 เมื่อเกณฑ์ 1 ไม่ผ่าน, 2 เมื่อเครื่องมือพัง, 0 เมื่อผ่าน

ให้ทำ
- สร้าง tools/qa/hud-gate.mjs (+ ไฟล์ช่วยใน tools/qa/ ถ้าจำเป็น) ที่
  - ใช้ tools/qa/pw.mjs + LAUNCH_ARGS จาก tools/qa/profiles.mjs (ตัวแปร SYNES_BROWSER เลือก executable ได้ ค่าเริ่ม = Playwright Chromium; ห้าม hard-code path Windows)
  - เสิร์ฟ dist/ ในตัวแบบ stage1-shots.mjs (ไม่ต้องเปิดเซิร์ฟเวอร์แยก) · baseline = --baseline-dist <โฟลเดอร์ dist ของบิลด์ฐาน> หรือ --baseline-base http://host:port · current = dist ของ worktree ด้วย ?envlib=1 (หรือ --qs)
  - ตัวเลือก --tiers, --thr (ค่าเริ่ม 0.6), --jobs (ค่าเริ่ม 1 เพื่อเครื่องเจ้าของ; ห้ามค่าเริ่มสูงกว่า 1), --out
  - เขียน hud_gate.json + hud_gate.txt และ exit code เหมือนตัวเดิม
- เพิ่ม docs ในหัวไฟล์ว่าเกณฑ์ไหนเป็นของเจ้าของที่ยังไม่เลือก (เกณฑ์ 2 เป็นข้อมูล)
- ห้ามเปลี่ยนวิธีวัด/นิยามจากตัวเดิม ถ้าต้องเปลี่ยนให้หยุดและรายงาน

ทดสอบ (ผ่าน gaming_run.ps1 ทีละคำสั่ง)
- vitest ผ่านทั้งหมด · tsc --noEmit ผ่าน · vite build ผ่าน (ต้องเท่าเดิม เพราะไม่แตะ src)
- ถ้า READY: รัน hud-gate 2 ครั้ง + lifecycle 20/20 (port 8096)
- ถ้า NOT READY: ไม่รันส่วนเบราว์เซอร์ เขียนว่า "ยังไม่ได้รัน รอ PM รันบนคลาวด์" (ห้ามเขียนว่าผ่าน)

เกณฑ์ผ่าน (PM/QA อิสระตรวจบนคลาวด์ เกณฑ์เดิมไม่ลด)
- ที่ 839c9c0 + ?envlib=1 เทียบ baseline 24f56b4 ไม่ใส่ flag: Potion จุดบังเกิน 60% low 16 เทียบ 13, medium 25 เทียบ 20 · Dodge low 2 เทียบ 1, medium 4 เทียบ 5 (ตรงกับที่ Local Art/QA_FIX2 วัด)
- exit 1 ตามที่ควรเป็นตอนนี้ และรายงานทั้งสองเกณฑ์
- รันซ้ำ 2 ครั้งได้ผลเดียวกัน
- ไม่มี path ในเครื่องหรือข้อมูลส่วนตัวในไฟล์
- vitest, tsc, build, lifecycle 20/20

ส่งงาน
1. commit เดียวบน lane/codex-c4 (ไม่ push) + handoff บนสุดของ docs/HANDOFF.md ใน commit เดียวกัน (ทำอะไร, ผลขั้น 0, ผลทดสอบแต่ละข้อ ผ่าน/ไม่ผ่าน/ยังไม่ได้รัน, ours_pct สูงสุด, งานค้าง)
2. git -C $WT format-patch -1 HEAD -o C:\SYNES_ASSETS\SYNES_OUTPUT\c4 แล้ว Get-FileHash (ห้ามผ่าน > หรือ Set-Content)
3. รายงานภาษาไทยให้เจ้าของ: ข้อเท็จจริง / ข้อเสนอ / สิ่งที่ยังไม่ทราบ · Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: ระบุเบราว์เซอร์จริง · ชื่อไฟล์ patch + SHA256 (PM มีต้นฉบับ hud_gate จาก zip v05c แล้ว ไม่ต้องแนบซ้ำ)
```
