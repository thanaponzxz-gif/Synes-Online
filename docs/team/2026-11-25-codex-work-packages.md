# ชุดงาน Codex (P4) · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-E (โหมดกลางคืน)
ที่มา: `CODEX_PROMPTS_R5.md` (Local Art, zip v05e) + ผล QA C-2 + ข้อจำกัด WebGL2 บนเครื่องเจ้าของ
**สถานะทุกงานในไฟล์นี้ = เตรียมไว้เท่านั้น ยังไม่เริ่ม** · งานที่ยังพักอยู่ต้องให้เจ้าของอนุมัติก่อน (NEEDS OWNER) · เกณฑ์ผ่านคงเดิมจากต้นฉบับ ไม่มีข้อไหนถูกลด

## 1. ภาพรวมและลำดับตามการพึ่งพากันจริง
| ลำดับ | งาน | สถานะ | ขึ้นกับ | ต้องใช้เบราว์เซอร์ WebGL2? | ผู้ทำ / QA | ไฟล์ที่แตะ (ชนกับใคร) |
|---|---|---|---|---|---|---|
| 0 | C-1 กล้องหมุนจอ | **พัก → NEEDS OWNER (เลิกพัก)** · พรอมป์ต์ v2 พร้อม (ข้อ 3) | — (ไม่ต้องรอวินิจฉัย WebGL2) | บนคลาวด์เท่านั้น (Codex ไม่ใช้เบราว์เซอร์) | Codex เขียน + vitest · คลาวด์ QA ด้วย `c1-rotate.mjs` | `view.ts` updateCamera, `cameraField.ts`, comment ใน `envPilot.ts` |
| — | C-2 dispose ตอน rebuild | **QA PASS with notes · PM รับแล้ว รอเจ้าของยืนยัน** (`2026-11-25-pm-accept-c2.md`) | — | — | เสร็จ | `view.ts` buildLevel, `models.ts`, `arena.ts`, `opening.ts` |
| — | C-2b (F1/F2/F3 ของ C-2) | **NEEDS OWNER** · พรอมป์ต์พร้อม (`2026-11-25-dispatch-2F.md` ข้อ 5.5) | C-2 | ใช่ (วัด program) | Codex + คลาวด์ QA | ไฟล์เดียวกับ C-2 |
| 1 | **C-6** สคริปต์สร้าง patch | พัก → **NEEDS OWNER** | — | **ไม่ใช้** | Codex Local ทำจบได้ทั้งงาน · PM ตรวจ SHA บนคลาวด์ | `tools/qa/make-patch.mjs` (ไม่ชน) |
| 2 | **C-4** ตัวตรวจ HUD | **อนุมัติแผนแล้ว พรอมป์ต์พร้อม** (`2026-11-25-pm-c2-qa-and-c4-plan.md` ข้อ 4) | — | ใช่ | Codex เขียน · คลาวด์รันชุดเต็ม + QA อิสระ | `tools/qa/hud-gate.mjs` (ไม่ชน) |
| 3 | **C-5** เวลาโหลดใน `#debug` | พัก → **NEEDS OWNER** | — | ใช่ (ตรวจภาพ/ค่า) | Codex เขียน · คลาวด์ QA | `src/main.ts` เท่านั้น (ไม่ชน C-1/C-2) |
| 4 | **C-7** silhouette ต้นไม้บังปุ่ม | **พักจน C-4 ผ่าน QA** (เจ้าของสั่ง 2026-11-25) | C-4 (เทียบผล) | ไม่จำเป็น ถ้าคำนวณด้วยคณิต three.js ใน Node · เทียบ hud-gate ต้องใช้ | Codex เขียน + vitest · คลาวด์เทียบ hud-gate | ไฟล์ใหม่ใน `src/render/` หรือ `tools/qa/` · **ไม่แก้ `envPilot.ts`** (C-1 แก้ comment ในไฟล์นั้น) |
| 5 | **C-3** ภาพ medium ต่างกันระหว่างโหลด | พัก → **NEEDS OWNER** | — | ใช่ หนัก (โหลดซ้ำ 8 ครั้งต่อฉาก) | **เสนอให้ Claude คลาวด์ (Sonnet) สืบสาเหตุ** เพราะเครื่องเจ้าของติด WebGL2 | สืบอย่างเดียวก่อน · ถ้าจะแก้ต้องเปิดงานใหม่ |
| 6 | C-8 cross-fade ขอบป่า | **รอทีม A ตอบ REQ_R5_1 ข้อ 7** + เจ้าของ | ทีม A | ใช่ | — | — |
| — | C-9, D-1…D-5 | พักตามคำสั่งเจ้าของ | — | — | — | — |

เหตุผลของลำดับ
- C-6 เป็นงานเดียวที่ไม่ต้องใช้เบราว์เซอร์ จึงทำจบได้ทั้งงานบนเครื่องเจ้าของแม้ WebGL2 ยังติด และช่วยให้การส่ง patch ของงานถัดไปไม่เสีย (TD-3: BOM/CRLF)
  **PM ตรวจแล้วบนคลาวด์ (ข้อเท็จจริง):** วิธีในพรอมป์ต์ (index ชั่วคราว → `read-tree 24f56b4` → `add -N` → `diff --binary --output`) ได้ SHA256 `8E37A1B7…0654` ตรงกับ `fix2_code.patch` ทุก byte · เกณฑ์ของ C-6 จึงทำได้จริง
- C-4 ต้องมาก่อน C-7 เพราะ C-7 ต้องเทียบผลกับ hud-gate และทั้งคู่เป็นเกณฑ์ของงาน R5.2 ที่ทีม A กำลังออกแบบ
- C-5 แตะ `src/main.ts` เท่านั้น (จับเวลารอบ `loadKit`/`loadEnvLib`/`view.buildLevel` จากฝั่งผู้เรียก) จึงไม่ชนกับ C-1 และ C-2 ที่แก้ `view.ts`
- Codex Local ทำได้ทีละงาน (Gaming Mode ห้ามงานหนักซ้อน) ส่วนคลาวด์ตรวจงานที่ส่งมาได้ระหว่างนั้น

## 2. ช่องทางส่งงาน (ใช้ทุกงาน)
Codex commit ใน worktree ของงาน → `git format-patch -1 HEAD -o C:\SYNES_ASSETS\SYNES_OUTPUT\<งาน>` → `Get-FileHash` → เจ้าของแนบ patch ในแชต PM → PM ตรวจ SHA256 + อ่านโค้ด → apply บนฐานเดียวกันบนคลาวด์ → `node tools/qa/webgl2-probe.mjs` → ชุดทดสอบเต็ม → QA อิสระ (agent ที่ไม่ได้เขียนโค้ด) → PM ตัดสิน → เจ้าของอนุมัติ
**ไม่มีการ push** (ฐาน `839c9c0` ยังไม่อยู่บน remote และยังไม่อนุมัติ push pilot)

## 3. C-1 (พัก): เส้นทางที่เสนอหลังวิเคราะห์ blocker · NEEDS OWNER (เลิกพัก)
ที่มา: `docs/team/2026-11-25-c1-blocker-analysis.md` (Fable 5.2) + `docs/qa/c1-prep/README.md` (เครื่องมือ `tools/qa/c1-rotate.mjs`)
- **ข้อเท็จจริง:** คลาวด์ตรวจ C-1 ได้ตรงจุด เพราะเกมตัดสินแนวตั้งจาก `camera.aspect < 1` และฟังแค่ event `resize` (ไม่มี `orientationchange`) การเปลี่ยนขนาด viewport จึงวิ่งโค้ดเส้นเดียวกับการหมุนจอ
- **baseline บนคลาวด์ (ข้อเท็จจริง):** `c1-rotate.mjs` กับบิลด์ฐาน (ก่อนและหลัง C-2) = **FAIL 0/4** ทั้ง 2 บิลด์ = TD-2 ทำซ้ำได้ · จุด z −41.02: เฟรมแรกแนวตั้งเห็นถึง −29.96 แย่สุด −25.64 (เฟรม 21) เทียบขอบ −29.62 และค่าที่ควรเป็น −35.35 · pull ค้างถึงเฟรม 60 (~2 วินาที) · จุดเริ่ม z 1.5: แย่สุด 16.86 เทียบที่ควรเป็น 7.17 · ตัวทดสอบตัวเอง (`--emulate-fix` ล้าง pull หลังหมุน) = PASS
- **ไม่ต้องรอการวินิจฉัย WebGL2:** C-1 ไม่ต้องใช้เบราว์เซอร์บนเครื่องเจ้าของเลย Codex เขียนโค้ด + vitest (ไม่ใช้เบราว์เซอร์) → patch → คลาวด์รันส่วนเบราว์เซอร์ทั้งหมด
- **ห้ามรัน probe หรือวินิจฉัย WebGL2 ซ้ำบนเครื่องเจ้าของ** (เลี่ยงการวนซ้ำ) · ถ้าเจ้าของต้องการรู้สาเหตุ ให้แนบ `gaming_mode_log.csv` + รายงาน BLOCKED ของ C-1 ที่มีอยู่แล้ว (ไม่ต้องรันอะไรเพิ่ม) แล้ว PM อ่านตามตารางในรายงาน Fable ข้อ 4
- เกณฑ์ผ่านคงเดิมจาก `CODEX_PROMPTS_R5.md` งานที่ 1 ทุกข้อ · บนคลาวด์ใช้ `c1-rotate.mjs` วัดเกณฑ์ (ก) ซึ่งตรงกับ vitest (ข) เดิม "กล้องเท่ากับแนวตั้งที่ไม่มี pull ในเฟรมแรก"
```text
Task ID: C-1 (Tech Debt TD-2 และ TD-1) · reasoning สูง · ทำต่อใน worktree เดิม
<WT> = C:\SYNES_ASSETS\_repo_worktrees\codex-r5 · branch lane/codex-r5 · ฐาน 839c9c00ab8ab3a447d1f9798e2f11995c34ac8b
เจ้าของสั่งเลิกพัก C-1 แล้ว ทางแก้ที่อนุมัติ = ข้อ 1 (ล้าง pull ในแนวตั้ง)

สำคัญ: งานนี้ห้ามใช้เบราว์เซอร์บนเครื่องนี้ทั้งหมด (ไม่รัน webgl2-probe, lifecycle, stage1-shots, hud หรือ headless ใด ๆ และห้ามวินิจฉัย WebGL2 ซ้ำ)
ส่วนที่ต้องใช้เบราว์เซอร์ PM จะรันบนคลาวด์ด้วย tools/qa/c1-rotate.mjs + stage1-shots + lifecycle แล้วให้ QA อิสระตรวจ
ถ้ามีงาน C-1 ที่ยังไม่ commit อยู่ใน worktree ให้ตรวจว่าตรงกับขอบเขตด้านล่างก่อนใช้ต่อ

ปัญหา (ตามเดิม)
- src/render/view.ts updateCamera: ตั้ง need = 0 ในแนวตั้ง แต่ยังคูณตำแหน่งกล้องด้วย (1 + camPull) → หมุนจอขณะ pull ค้าง กล้องแนวตั้งเห็นเกิน viewLimitZ ราว 2 วินาที (คลาวด์วัดได้: แย่สุด z -25.64 เทียบขอบ -29.62)
- comment หัว src/render/cameraField.ts อ้างว่าสูตร "can never drift" แต่ใช้ร่วมกันแค่ค่าคงที่
- comment ใน src/render/envPilot.ts อ้างที่มา 5,724 poses ผิด (มาจาก QA_FIX1 ไม่ใช่ FIX1_NOTES)

ให้ทำ
1. ในแนวตั้งห้ามใช้ camPull ตอนวางกล้อง และตั้ง camPull = 0 เมื่อเข้าแนวตั้ง
2. ให้ updateCamera ใช้ fieldCamera() จาก cameraField.ts แทนสูตรสำเนา ถ้าทำได้โดยตำแหน่งกล้องแนวนอนไม่เปลี่ยน ถ้าไม่ได้ ให้คงสูตรไว้แต่เพิ่ม test เทียบสองสูตร
3. แก้ comment ทั้งสองจุดให้ตรงความจริง ห้ามใส่ path ในเครื่อง
4. คงชื่อ field camPull และ camPullHold ของ View ไว้ (เครื่องมือ QA บนคลาวด์อ่านค่านี้) ถ้าต้องเปลี่ยนชื่อ ให้หยุดและรายงาน
ห้าม: เปลี่ยน viewLimitZ, PILOT_OFF_SEES_Z, ค่าคงที่กล้อง, พฤติกรรม pull-back ในแนวนอน · ห้ามแตะไฟล์ที่ C-2 แก้ (models.ts, arena.ts, opening.ts, buildLevel ใน view.ts)

เกณฑ์ผ่าน (ไม่ลด)
- vitest ใหม่: (ก) ตำแหน่งกล้องจาก updateCamera เท่ากับ fieldCamera ในแนวนอนอย่างน้อยหลายพันกรณีสุ่ม (ข) หมุนเป็นแนวตั้งขณะ pull ค้าง แล้วกล้องเท่ากับแนวตั้งที่ไม่มี pull ในเฟรมแรก
- vitest ทั้งหมดผ่าน, tsc ผ่าน, build ผ่าน (รันผ่าน gaming_run.ps1 ทีละคำสั่ง)
- ส่วนเบราว์เซอร์ (lifecycle 20/20, ภาพแนวนอน low ตรงทุก byte เทียบ 839c9c0, medium อยู่ใน noise P-4, draw calls/tris เท่าเดิม, c1-rotate PASS) ให้เขียนว่า "ยังไม่ได้รัน รอ PM รันบนคลาวด์" (ห้ามเขียนว่าผ่าน)
- handoff ระบุว่ายังไม่ได้ทดสอบการหมุนจอจริงบนมือถือ

ส่งงาน: commit เดียว "C-1: ..." บน lane/codex-r5 (+ handoff บนสุดของ docs/HANDOFF.md) → git -C <WT> format-patch -1 HEAD -o C:\SYNES_ASSETS\SYNES_OUTPUT\c1 → Get-FileHash → รายงานเจ้าของพร้อมชื่อไฟล์ + SHA256
```
QA บนคลาวด์เมื่อได้ patch (ขั้นตอนเต็มใน `docs/qa/c1-prep/README.md`): ตรวจ SHA → apply บน `b84ad90` (= โค้ด `839c9c0`) → webgl2-probe → vitest/tsc/build → `c1-rotate.mjs` ต้อง PASS 4/4 → stage1-shots แนวนอน + pixeldiff เทียบ baseline 100 ภาพที่มีอยู่ → lifecycle 20/20 → QA อิสระ (Sonnet) → PM (Opus) ตัดสิน

## 4. ส่วนกลาง v2 (วางก่อนพรอมป์ต์ของทุกงานด้านล่าง)
```text
คุณคือ Codex ทำงาน Local บนเครื่องของเจ้าของโปรเจกต์ Synes Online เฉพาะงานที่เจ้าของอนุมัติแล้ว
อ่านก่อนเริ่ม: CLAUDE.md, AGENTS.md, docs/HANDOFF.md ส่วนบนสุด, C:\SYNES_ASSETS\SYNES_OUTPUT\CODEX_HANDOFF_R5.md

กฎ
1. ทีม A เป็น Design Authority (ADR-007) ห้ามเปลี่ยนสิ่งที่ผู้เล่นเห็นหรือรู้สึก เว้นแต่งานระบุไว้ ถ้าต้องเลือกรูปทรง สี ตำแหน่ง หรือกฎใหม่ ให้หยุดและถาม
2. ห้าม push ห้าม merge ห้ามจ่ายเงิน ห้ามติดตั้ง (ห้าม npm install / npm ci) ห้ามใส่ไฟล์ Hero หรือข้อมูลส่วนตัว (อีเมล ชื่อผู้ใช้ path ที่มีชื่อผู้ใช้) ในไฟล์ใด ๆ
3. Gaming Mode: เปิดตัวเฝ้าก่อนงานหนัก รันงานหนักผ่าน gaming_run.ps1 ทีละ process (ข้อ 4 ของ CODEX_HANDOFF_R5.md) ถ้าปฏิเสธ (exit 3/4/5) หรือพักงาน ให้หยุดรอ ห้ามหาทางเลี่ยง ห้ามแก้หรือปิดระบบควบคุมทรัพยากร
4. ทำใน worktree ของงานนี้เท่านั้น ห้ามแตะ worktree codex-r5, codex-c2, codex-c4 (ยกเว้นอ่าน node_modules target), synes-env-r5 และ checkout หลักของเจ้าของ
   สร้าง worktree: git -C C:\SYNES_ASSETS\_repo_worktrees\codex-r5 worktree add <WT> -b <branch> 839c9c00ab8ab3a447d1f9798e2f11995c34ac8b (ถ้า branch มีอยู่แล้ว ให้หยุดและรายงาน)
   node_modules: $t = (Get-Item C:\SYNES_ASSETS\_repo_worktrees\codex-r5\node_modules).Target ; cmd /c mklink /J <WT>\node_modules "$t"
5. ขั้น 0 (เฉพาะงานที่ต้องใช้เบราว์เซอร์): Minimal WebGL2 Test ครั้งเดียว
     git -C <WT> fetch origin art/env-polish
     git -C <WT> restore --source=origin/art/env-polish --worktree -- tools/qa/webgl2-probe.mjs   (ห้าม add ไฟล์นี้)
   รันผ่าน gaming_run.ps1 พร้อม --out "<WT>\webgl2_probe.json" · READY = รันขั้นเบราว์เซอร์ได้ · NOT READY หรือค้างเกิน 90 วินาที = ข้ามขั้นเบราว์เซอร์ทั้งหมด ห้ามวินิจฉัยซ้ำ เขียนว่า "ยังไม่ได้รัน รอ PM รันบนคลาวด์" (ห้ามเขียนว่าผ่าน)
6. ก่อน commit: vitest ผ่านทั้งหมด, tsc --noEmit ผ่าน, vite build ผ่าน · lifecycle 20/20 เฉพาะเมื่อขั้น 0 READY
7. commit เดียว ข้อความขึ้นต้นด้วย Task ID ลงท้าย attribution ตามที่ระบบกำหนด · git add ทีละ path (ห้าม git add -A / .) · handoff บนสุดของ docs/HANDOFF.md ใน commit เดียวกัน (ทำอะไร, ผลขั้น 0, ผลทดสอบแต่ละข้อ ผ่าน/ไม่ผ่าน/ยังไม่ได้รัน, ours_pct สูงสุดจาก gaming_mode_log.csv, งานค้าง)
8. ส่งงาน: git -C <WT> format-patch -1 HEAD -o C:\SYNES_ASSETS\SYNES_OUTPUT\<งาน> แล้ว Get-FileHash (ห้ามสร้างไฟล์ด้วย > หรือ Set-Content)
9. คุณตรวจงานตัวเองแทน QA อิสระไม่ได้ รายงานผลวัดเป็นข้อเท็จจริง PM จะให้ QA อิสระตรวจบนคลาวด์
10. รายงานภาษาไทย แยก ข้อเท็จจริง / ข้อเสนอ / สิ่งที่ยังไม่ทราบ · Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: ระบุเบราว์เซอร์จริงหรือ "ยังไม่ได้รัน"
```

## 5. C-6 สคริปต์สร้าง patch กลาง (TD-3) · NEEDS OWNER · Codex reasoning ต่ำ
- worktree `C:\SYNES_ASSETS\_repo_worktrees\codex-c6` · branch `lane/codex-c6` · ฐาน `839c9c0` · ไม่ใช้เบราว์เซอร์ ไม่ใช้เซิร์ฟเวอร์ (ข้ามขั้น 0 และ lifecycle)
- ขอบเขต: `tools/qa/make-patch.mjs` (+ vitest ถ้าต้องการ) เท่านั้น
```text
Task ID: C-6 (Tech Debt TD-3) · reasoning ต่ำ
<WT> = C:\SYNES_ASSETS\_repo_worktrees\codex-c6 · branch lane/codex-c6 · งานนี้ไม่ใช้เบราว์เซอร์: ข้ามขั้น 0 และ lifecycle

ปัญหา: patch ที่สร้างผ่าน PowerShell redirect (Set-Content / Out-File) เคยเสีย เพราะมี BOM และไม่มีตัวขึ้นบรรทัด

ให้ทำ
- สร้าง tools/qa/make-patch.mjs <base> <out.patch> [paths...] (Node ESM ไม่มี dependency ใหม่ เรียก git ผ่าน child_process.execFileSync แบบ argument array ห้ามผ่าน shell)
- ใช้ index ชั่วคราว (ตัวแปร GIT_INDEX_FILE ชี้ไฟล์ใน os.tmpdir()) → git read-tree <base> → git add -N <paths> → git diff --binary --output=<out> <base> -- <paths> → ลบ index ชั่วคราว (ใน finally)
- ห้ามแตะ index จริง · พิมพ์ SHA256 ของไฟล์ที่ได้ (node:crypto) และจำนวนไฟล์ใน patch
- ถ้าไม่ใส่ paths ให้ใช้ทุกไฟล์ที่ต่างจาก base (รวมไฟล์ใหม่ที่ไม่ได้ ignore)

เกณฑ์ผ่าน (ไม่ลด)
- ใน worktree ที่ 839c9c0 รัน make-patch กับ base 24f56b4 สำหรับ 7 ไฟล์โค้ด แล้วได้ SHA256 8E37A1B7D8ADCC809C6C6AFD5D2DE81B6AED31FA16F38A5587A511C377D10654:
  public/assets/models/env_library_v01.glb, src/render/cameraField.ts, src/render/envPilot.ts, src/render/models.ts, src/render/view.ts, tests/cameraField.test.ts, tools/qa/arena-probe.mjs
- ถ้าไม่ตรง ให้รายงานสาเหตุ (เช่น core.autocrlf, ลำดับไฟล์) อย่าปรับให้ตรงด้วยมือ
- git status และ git diff --cached ของ index จริงเหมือนก่อนรันทุกตัวอักษร (แนบผลก่อน/หลัง)
- git apply --check ของ patch ที่ได้ผ่านบน 24f56b4
- vitest, tsc --noEmit ผ่าน (vite build ต้องเท่าเดิมเพราะไม่แตะ src)
```

## 6. C-5 เวลาโหลดใน `#debug` · NEEDS OWNER · Codex reasoning ต่ำถึงปานกลาง
- worktree `codex-c5` · branch `lane/codex-c5` · ฐาน `839c9c0` · port 8097 · แก้ `src/main.ts` เท่านั้น
- ข้อเท็จจริงจากโค้ดฐาน: `#debug` แสดงที่ `src/main.ts:176-178` · โหลด kit ที่ `:89-93` (`loadKit` → `loadKitExtra` เมื่อ spire B → `loadEnvLib` เมื่อ `envlib=1`) · `view.buildLevel(world, 7)` ที่ `:130`, `:258` (เริ่มใหม่), `:268` (context restore)
```text
Task ID: C-5 · reasoning ต่ำถึงปานกลาง
<WT> = C:\SYNES_ASSETS\_repo_worktrees\codex-c5 · branch lane/codex-c5 · port 8097 · ตัวกรองปิดเซิร์ฟเวอร์ 'codex-c5\\server\\index\.ts'

ตอนนี้: #debug แสดง fps, tier, px, calls, tris, kit, heap (src/main.ts:178) แต่ไม่มีเวลาโหลด
ทำไมสำคัญ: เจ้าของต้องจดค่าจาก #debug บนมือถือจริงก่อนอนุมัติ Golden Reference

ให้ทำ (แก้ src/main.ts เท่านั้น ห้ามแก้ view.ts / models.ts เพราะ C-1 และ C-2 แก้ไฟล์เหล่านั้นอยู่)
- จับเวลาด้วย performance.now() จากฝั่งผู้เรียก: synes_kit.glb, spire_shrine_B.glb (เมื่อโหลด), env_library_v01.glb (เมื่อ ?envlib=1) และ buildLevel ครั้งล่าสุด (ระบุว่าเป็นครั้งแรก / เริ่มใหม่ / context restore) เป็นมิลลิวินาที
- แสดงเฉพาะเมื่อเปิด #debug เท่านั้น เก็บค่าไว้ใน perf object เดิมเพื่อให้เครื่องมือ QA อ่านได้
- ห้ามเปลี่ยนลำดับหรือเวลาของการโหลด

เกณฑ์ผ่าน (ไม่ลด)
- ไม่เปิด #debug: ภาพตรงทุก byte (low) และ draw calls เท่าเดิม (stage1-shots PNG เทียบ 839c9c0)
- เปิด #debug: มีค่าใหม่ครบและเป็นตัวเลขที่สมเหตุสมผลใน headless
- vitest, tsc, build, lifecycle 20/20 (lifecycle ตรวจ layout ว่าไม่มีอะไรทับกัน)
- ขั้นที่ใช้เบราว์เซอร์: ถ้าขั้น 0 NOT READY ให้เขียน "ยังไม่ได้รัน รอ PM รันบนคลาวด์"
```
QA บนคลาวด์: stage1-shots (PNG, กลุ่มฉากเล็ก) low ก่อน/หลัง + pixeldiff = 0 · เปิด `#debug` อ่านค่าใหม่จาก `__synes.perf` · lifecycle 20/20

## 7. C-7 silhouette ต้นไม้บังปุ่ม HUD (H2) · NEEDS OWNER · Codex reasoning ปานกลางถึงสูง
- worktree `codex-c7` · branch `lane/codex-c7` · ฐาน `839c9c0` · port 8098 · **เริ่มหลัง C-4 ผ่าน QA** (ต้องเทียบผลกับ hud-gate)
- ผลเป็นข้อมูลให้ทีม A เท่านั้น (ทีม A เลือก H8 แก้รูปทรงต้นไม้) · ห้ามย้าย/ลบ/เปลี่ยนต้นไม้
- ข้อเสนอทางเทคนิค (ไม่ใช่ดีไซน์): คำนวณ silhouette ด้วยคณิตของ three.js ใน Node (project สามเหลี่ยมของโมเดลด้วยกล้องสนาม `fieldCamera()` แล้ว rasterize ลงตารางพิกเซลของกรอบปุ่ม) จะไม่ต้องใช้ WebGL2 จึงทดสอบบนเครื่องเจ้าของได้ · และ**ไม่แตะ `envPilot.ts`** (ใช้ผลวางที่ export อยู่แล้ว) เพื่อไม่ชนกับ C-1
```text
Task ID: C-7 · reasoning ปานกลางถึงสูง
<WT> = C:\SYNES_ASSETS\_repo_worktrees\codex-c7 · branch lane/codex-c7 · port 8098 · ตัวกรองปิดเซิร์ฟเวอร์ 'codex-c7\\server\\index\.ts'
อ่าน: C:\SYNES_ASSETS\SYNES_OUTPUT\r5\plan_r5_2\PLAN_R5_2_TECH.md ข้อ 1.4 ถึง 1.6 (H2) และ tools/qa/hud-gate.mjs จาก C-4 (PM จะแนบ patch C-4 ที่ผ่าน QA แล้วให้ apply ก่อนเริ่ม)

ปัญหา
- planner ใน src/render/envPilot.ts ใช้ sphere test หาว่าต้นไหนอาจบังปุ่ม HUD ได้ผลบวกลวงมาก: 25 ต้น ทั้งที่บังจริงประมาณ 8 ต้น

ให้ทำ
- ใช้ silhouette จริงของโมเดลจากมุมกล้องเกม 844x390 เทียบกรอบปุ่ม Potion, Dodge, Attack, Skill
- รายงานต้นที่บังจริงพร้อมสัดส่วนที่บัง เป็นเครื่องมือใน tools/qa (+ ฟังก์ชันบริสุทธิ์ในไฟล์ใหม่ถ้าจำเป็น)
- ห้ามแก้ src/render/envPilot.ts, view.ts, cameraField.ts (C-1 แก้ไฟล์เหล่านั้น) · ถ้าจำเป็นต้องแก้ ให้หยุดและรายงาน
- ทางที่ไม่ต้องใช้ WebGL2: คณิต three.js ใน Node (Matrix4/Vector3, โหลด GLB ด้วย parser ที่มีอยู่ใน node_modules) · ถ้าใช้ไม่ได้ให้รายงาน ห้ามติดตั้งเพิ่ม
- **ห้ามย้าย ลบ หรือเปลี่ยนต้นไม้** ทีม A จะใช้ตัวเลขนี้ออกแบบ

เกณฑ์ผ่าน (ไม่ลด)
- ผลวางของ planner (moved, secondary, conifer, statics, zone) เหมือนเดิมทุกค่าทั้ง low และ medium
- ภาพตรงทุก byte (low) · เวลา buildLevel เพิ่มไม่เกิน 5 ms (วัดและรายงาน; ถ้าไม่ได้เรียกใน buildLevel ให้แสดงว่า +0)
- มี vitest ของฟังก์ชัน silhouette (กรณีรู้คำตอบ เช่น สามเหลี่ยมคลุมปุ่มครึ่งหนึ่ง)
- ผลสอดคล้องกับ hud-gate จาก C-4 (ต้นที่ hud-gate ว่าบัง >60% ต้องอยู่ในรายการ) · ถ้ารันเบราว์เซอร์ไม่ได้ ให้เขียน "รอ PM เทียบบนคลาวด์"
- vitest, tsc, build, lifecycle 20/20 (lifecycle เฉพาะเมื่อขั้น 0 READY)
```

## 8. C-3 ภาพ medium ต่างกันระหว่างโหลด (P-4) · NEEDS OWNER · เสนอให้ Claude คลาวด์ (Sonnet) สืบสาเหตุ
- เหตุผล: งานนี้ต้องโหลดเบราว์เซอร์ซ้ำหลายสิบครั้ง เครื่องเจ้าของติด WebGL2 และ Gaming Mode จำกัด CPU · คลาวด์มี Chromium + SwiftShader ที่ใช้ทำ QA C-2 แล้ว
- ขอบเขต: **สืบสาเหตุและรายงานเท่านั้น** ไม่แก้โค้ดเกม · ถ้าพบวิธีแก้ที่ไม่เปลี่ยนภาพที่ตั้งใจ ให้เสนอเป็นงานแยก (Codex เขียน, คลาวด์ QA)
- เกณฑ์ผ่านเดิม (รายงานสาเหตุพร้อมหลักฐาน · ถ้าแก้: 8 โหลดได้ภาพกลุ่มเดียวบน medium ทั้ง opening และบอส p1_close, low ตรงทุก byte, draw calls เท่าเดิม, vitest/tsc/build/lifecycle) คงไว้สำหรับงานแก้ที่ตามมา
```text
(สำหรับเซสชัน Claude คลาวด์ · Sonnet · ใช้ได้เมื่อเจ้าของอนุมัติ C-3)
Task ID: C-3 สืบสาเหตุ · ทำงานอ่านอย่างเดียวกับโค้ดเกม ห้ามแก้ src/ shared/ server/ public/ ห้าม commit ภาพ pilot ห้าม push
ปัญหา: tier medium โหลดหน้าเดิมซ้ำแล้วได้ภาพ 2 กลุ่ม (baseline ต่างราว 271 px delta ≤5 ในแถบกลางภาพ; pilot บางจุด 4,866–8,828 px delta ≤8) · time, tick, dpr, geometry เท่ากันทุกโหลด · low ตรงทุก byte
ทำ: รัน node tools/qa/webgl2-probe.mjs ก่อน → โหลดทีละหน้า (ห้ามเปิดหลายเบราว์เซอร์พร้อมกัน) 8 ครั้งต่อเงื่อนไข: opening และบอส p1_close × envlib ปิด/เปิด → จัดกลุ่มภาพด้วย pixeldiff → ทดลองตัดตัวแปรทีละตัวด้วย query/flag ที่มีอยู่หรือ page.addInitScript (ไม่แก้ src): ลำดับ compile shader / ลำดับโหลด GLB / shadow map / Math.random ในชั้น render / จำนวน thread ของ SwiftShader / antialias
ส่ง: รายงานภาษาไทย docs/qa/c3-v01/QA_C3.md + JSON ดิบ (ไม่มีภาพ pilot) · ทุกคำสั่งมี timeout ≤300 วินาที · ปิดเบราว์เซอร์/เซิร์ฟเวอร์ทุกตัว
```

## 9. C-2b (ถ้าเจ้าของเลือก) · NEEDS OWNER
**พรอมป์ต์และเกณฑ์ (รวม Peak Memory, First Frame Latency, Context Restore) อยู่ใน `2026-11-25-dispatch-2F.md` ข้อ 5.5 และ 6.4** · ลำดับส่งล่าสุดอยู่ในไฟล์นั้นข้อ 4
**หลักฐานใหม่ (คืนนี้, `docs/qa/mobile-perf-2026-11-25.md` + `f2-deferred-dispose.json`):** ทดลองเลื่อน dispose ของด่านเก่าไปหลังเฟรมแรกของด่านใหม่ บนบิลด์ C-2 (จำลองจากภายนอก ไม่แก้ src) 6 rebuild × 2 รอบ: program ใหม่ต่อ rebuild medium 15 → 0, low 14 → 0 · เฟรมแรกบน SwiftShader medium ~330 → ~100 ms, low ~270 → ~45 ms · ไม่รั่ว → ทางแก้ F2 ใน C-2b ได้ผลจริงอย่างน้อยบนคลาวด์ (มือถือจริงยังไม่ทราบ)

## 10. โมเดลที่แนะนำ
| งาน | เขียนโค้ด | QA/ตรวจรับ |
|---|---|---|
| C-6 | Codex reasoning ต่ำ | PM (Opus) ตรวจ SHA + อ่านโค้ด ไม่ต้องใช้ QA agent |
| C-4 / C-5 | Codex ปานกลาง / ต่ำ-กลาง | QA agent คลาวด์ Sonnet · PM Opus ตัดสิน |
| C-7 | Codex ปานกลาง-สูง | QA agent คลาวด์ Sonnet · PM Opus ตัดสิน |
| C-3 | Claude คลาวด์ Sonnet (สืบสาเหตุ) | PM Opus ตรวจหลักฐาน |
| C-1 | ดูข้อ 3 | QA agent คลาวด์ Sonnet + เครื่องมือ `c1-rotate.mjs` |
