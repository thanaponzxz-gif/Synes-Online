# ข้อมูลประกอบการตัดสินใจ 8 ข้อ (Morning Brief ข้อ 7) · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-F
คำสั่งเจ้าของ: เตรียมข้อมูล 6 ข้อก่อนอนุมัติ · ใช้หลักฐานที่มีอยู่แล้วเท่านั้น (**ไม่ได้รัน QA หรือวิเคราะห์ซ้ำ**) · **ยังไม่เริ่ม implementation ใด ๆ** · ทีม A ยังเป็น Design Authority (ADR-007) และระบบอนุมัติเดิมใช้ทุกข้อ
**Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: หลักฐานทั้งหมดมาจาก Chromium headless + SwiftShader บนคลาวด์ (ไม่ใช่เครื่องจริง)**

---

## 1. รายงาน QA อิสระของ C-2 + ทำไมต้องมี C-2b + ผลถ้ารับ C-2 ก่อน

### 1.1 รายงานฉบับเต็ม
- **ฉบับเต็ม (อังกฤษ, เขียนโดย QA agent ที่ไม่ได้เขียนโค้ด):** `docs/qa/c2-v01/QA_C2.md`
  https://github.com/thanaponzxz-gif/Synes-Online/blob/927464a98d4796198689287c6672f46411748c9e/docs/qa/c2-v01/QA_C2.md
- สรุปภาษาไทย + การตรวจซ้ำของ PM: `docs/team/2026-11-25-pm-c2-qa-and-c4-plan.md` ข้อ 1–3
- หลักฐานดิบ (JSON) อยู่ใน `docs/qa/c2-v01/` · ภาพ/บิลด์ของ pilot ไม่ได้ commit (repo เป็น Public)
- patch ที่ตรวจ: `0001-C-2-Dispose-level-owned-render-resources-on-rebuild.patch` · SHA256 `1368EC32C4EF2221113F703DB8D26836B681EBB7B64B331E6C035753B6CDE3C8` · commit ของ Codex `69301b5`

### 1.2 ผล (ข้อเท็จจริง)
**PASS with notes** · Blocker 0 · Major 0 · Minor 3 · Info 2 · ผ่านครบทั้ง 6 เกณฑ์เดิม (ไม่ได้ลดเกณฑ์)
| # | เกณฑ์ | ผล | ตัวเลขสำคัญ |
|---|---|---|---|
| 1 | หน่วยความจำไม่รั่วเมื่อ rebuild 10 ครั้ง | PASS | ก่อนแก้: geometry +16/+17 และ texture +1 **ทุกครั้งที่เริ่มใหม่** · หลังแก้: +0 ทุกเงื่อนไข (low/medium/envlib/nokit/arena B/spire B/vfx cur) |
| 2 | ไม่มี error / ไม่ dispose ซ้ำ / วัตถุครบ | PASS (F1, F2) | error 0 · dispose ซ้ำ 0 (ก่อนแก้ 1 ครั้งต่อ rebuild) · ภาพหลัง rebuild 5 ครั้งตรงก่อนแก้ 6/6 |
| 3 | context loss/restore | PASS | กลับมาเล่นได้ error 0 · `opening-smoke` 10/10 |
| 4 | ภาพ/draw calls/tris | PASS | draw calls ตรง 100/100 · ฉาก 3D ตรงทุกพิกเซล |
| 5 | lifecycle | PASS | 20/20 |
| 6 | vitest/tsc/build | PASS | 168/168 · ผ่าน · ผ่าน |

ข้อค้นพบ
- **F1 (Minor):** เมื่อไม่มี kit (`?nokit` หรือโหลด GLB ไม่สำเร็จ) material ที่แคชใช้ร่วม 15 ชิ้นถูก dispose ทุก rebuild แล้วถูกใช้ต่อ · ไม่มี error ภาพไม่เปลี่ยน แต่ต้องคอมไพล์ใหม่ · **เกมปกติ (มี kit) ไม่เกิด**
- **F2 (Minor, ผู้เล่นอาจรู้สึก):** dispose ถูกต้องแล้ว three.js จึงลบ shader program ที่ไม่มีใครอ้าง แล้วคอมไพล์ใหม่ตอนสร้างด่านใหม่ → program ใหม่ต่อ rebuild medium 9 → 15 · **เฟรมแรกหลังเริ่มใหม่ช้าขึ้น** (SwiftShader medium ~230–290 → 330–380 ms, low+nokit ~120–155 → 270–350 ms) · เกิดตอน "เริ่มใหม่" / เปลี่ยนคุณภาพ / context restore
- **F3 (Minor, เครื่องมือ):** `level-leak.mjs` ของ Codex นับเฉพาะของที่กล้องตอนเริ่มเห็น ไม่นับ program และ console error → ไวไม่พอ (แต่ผล 0 ตรงกับเครื่องมือของ QA)
- F4 (ดีขึ้น): เลิก dispose material ของ kit ที่ใช้ร่วมซ้ำ 3 ครั้งต่อ rebuild · F5 (มีมาก่อน C-2): phase อนิเมชันไฟ/พัฟแคปหลัง rebuild ต่างจากโหลดใหม่
- **ไม่ได้ตรวจ:** มือถือ/GPU จริง, พิกเซล VFX (สุ่มด้วย `Math.random`), เล่นยาวแบบกดเริ่มใหม่ผ่าน UI, หน่วยความจำ GPU เป็นไบต์

### 1.3 ทำไมต้องมี C-2b
C-2b **ไม่ได้แก้ความผิดพลาดของ C-2** (C-2 ถูกต้องและผ่านเกณฑ์) แต่แก้ผลข้างเคียงที่ C-2 ทำให้เกิด
| ข้อ | ปัญหา | C-2b แก้อย่างไร (ข้อเสนอทางเทคนิค ไม่เปลี่ยนภาพ) | หลักฐานว่าได้ผล |
|---|---|---|---|
| F2 | เฟรมแรกหลังเริ่มใหม่ช้าขึ้น | dispose ของด่านเก่า **หลัง**เฟรมแรกของด่านใหม่ → program ยังมีคนอ้าง จึงไม่ต้องคอมไพล์ใหม่ | ทดลองจำลองจากภายนอกบนบิลด์ C-2 (ไม่แก้ src) 6 rebuild × 2 รอบ: program ใหม่ medium 15 → **0**, low 14 → **0** · เฟรมแรก medium ~330 → **~100 ms**, low ~270 → **~45 ms** · ไม่รั่ว (`docs/qa/mobile-perf-2026-11-25.md`, `f2-deferred-dispose.json`) |
| F1 | ทางสำรองเมื่อไม่มี kit dispose ของใช้ร่วม | ไม่ใส่ material จากแคช `lam()` ลงชุดที่จะ dispose | ยังไม่ได้ทดลอง |
| F3 | เครื่องมือวัดรั่วไวไม่พอ | บังคับ upload ทุกวัตถุ + นับ program + fail เมื่อมี console error | QA ทำเครื่องมือแบบนี้แล้วใน C-2 (`scripts/c2-indep.mjs` ใน scratchpad เดิม หายไปแล้ว) |
เกณฑ์ที่เสนอสำหรับ C-2b: รั่ว +0 เหมือน C-2 และ program ใหม่ต่อ rebuild ≤ ค่าก่อน C-2 (medium ≤ 9, nokit ≤ 7)

### 1.4 ถ้ารับ C-2 ก่อน (ยังไม่ทำ C-2b) จะเกิดอะไร
| ด้าน | ผล |
|---|---|
| ผู้เล่น ตอนนี้ | **ไม่มีผลทันที** · C-2 ยังไม่อยู่ใน `main` และไม่อยู่บน Pages การ "รับ" คือรับเป็น commit บน lane รอ merge ซึ่งต้องให้เจ้าของสั่งอีกครั้ง |
| ผู้เล่น ถ้าภายหลัง merge โดยไม่มี C-2b | ได้: หน่วยความจำไม่โตทุกครั้งที่เริ่มใหม่ (ก่อนแก้ +16–17 geometry +1 texture ต่อครั้ง ซึ่งเสี่ยงบนมือถือเมื่อเล่นซ้ำนาน ๆ) · เสีย: กระตุกตอนเริ่มใหม่/เปลี่ยนคุณภาพนานขึ้น (+~100 ms บน SwiftShader medium) · **ขนาดบนมือถือจริงยังไม่ทราบ** |
| ภาพ | ไม่เปลี่ยน (ตรงทุกพิกเซลในฉาก 3D) |
| งานอื่น | C-1, C-4, C-5, C-6, C-7 ใช้ฐาน `839c9c0` ไม่ขึ้นกับ C-2 จึงไม่ถูกบล็อก · C-2b จะเป็น commit ที่ 2 บน `lane/codex-c2` แล้ว QA อิสระอีกรอบ |
| ความเสี่ยงของการรับก่อน | ต่ำ: ถ้า C-2b ไม่ผ่าน ยังมี C-2 ที่ผ่านแล้วเป็นจุดถอย |
| ถ้าเลือก "ทำ C-2b ก่อนแล้วรับพร้อมกัน" | QA รอบเดียวสำหรับทั้งคู่ (ประหยัดโควตาคลาวด์เล็กน้อย) แต่ไม่มีจุดถอยที่รับแล้ว |
| ความเสี่ยงของ C-2b เอง (ยังไม่ทราบ) | ช่วงเฟรมแรกจะมีของทั้งด่านเก่าและใหม่อยู่พร้อมกัน ทำให้หน่วยความจำสูงสุดสูงขึ้นชั่วครู่ (การทดลองวัดแค่ว่าไม่รั่ว **ยังไม่ได้วัดค่าสูงสุด**) · ทาง context restore ต้องตรวจว่า dispose ทีหลังไม่ชนกับ context ที่หายไป |
**ข้อเสนอของ PM (เหมือนเดิม):** รับ C-2 แล้วทำ C-2b เป็น commit ที่ 2 · เพิ่มเกณฑ์ให้ C-2b วัดค่าหน่วยความจำสูงสุดช่วงเฟรมแรก และทดสอบ context restore
หมายเหตุ: พรอมป์ต์ C-2b จะเขียนหลังเจ้าของเลือก (ยังไม่มี)

---

## 2. พรอมป์ต์ C-1 v2 และวิธีที่มันแก้ blocker เดิม

### 2.1 blocker เดิมคืออะไร (ข้อเท็จจริง)
- C-1 = แก้ TD-2 (กล้องแนวตั้งเห็นเกินขอบราว 2 วินาทีหลังหมุนจอ, `src/render/view.ts` updateCamera) + TD-1 (comment ผิด 2 จุด)
- Codex รายงาน **BLOCKED**: ต้องรันเบราว์เซอร์ WebGL2 บน PC ของเจ้าของเพื่อทดสอบ แต่ภายใต้ Gaming Mode v2 ตัว probe ค้างเกิน 60 วินาที ไม่มีผล
- Fable วิเคราะห์แล้ว (`docs/team/2026-11-25-c1-blocker-analysis.md`): **หาสาเหตุชี้ขาดไม่ได้จากหลักฐานที่มี** · สมมติฐานอันดับ 1 (~35%, เป็นการประเมิน ไม่ใช่ผลวัด) = ทางเปิดเบราว์เซอร์ของ Codex ต่างจากรอบของ Local Art ที่สำเร็จ · เพดาน CPU 30% ไม่น่าใช่ตัวการ (งานถูกจำกัดที่ 4/16 core = 25% อยู่แล้ว)

### 2.2 v2 แก้อย่างไร
**v2 ไม่ได้แก้สาเหตุ WebGL2 บน PC แต่ตัดงานที่ต้องใช้เบราว์เซอร์ออกจาก PC ทั้งหมด**
| เดิม (v1) | v2 |
|---|---|
| Codex ต้องรัน lifecycle / stage1-shots / ทดสอบหมุนจอในเบราว์เซอร์บน PC → ค้าง | Codex **ห้ามเปิดเบราว์เซอร์บน PC** เขียนโค้ด + vitest (Node ไม่ใช้ GPU) + tsc + build เท่านั้น |
| ส่วนที่ต้องใช้เบราว์เซอร์ไม่มีใครรันแทน | คลาวด์รันแทน: Chromium 158 + SwiftShader, `webgl2-probe` = READY (ใช้ QA C-2 สำเร็จแล้ว) |
| ไม่มีเครื่องมือวัดการหมุนจอ | `tools/qa/c1-rotate.mjs`: ฐานปัจจุบัน **FAIL 0/4** (ทำซ้ำ TD-2 ได้: แย่สุดเห็นถึง z −25.64 ขณะขอบอยู่ −29.62) · ทดสอบตัวเองด้วยการจำลองทางแก้ = PASS → เครื่องมือแยกถูก/ผิดได้ |
| วนวินิจฉัย WebGL2 ซ้ำ | ห้ามวินิจฉัยซ้ำ · ถ้าอยากรู้สาเหตุให้แนบไฟล์ log ที่มีอยู่แล้ว (ข้อ 6) |
เหตุผลที่คลาวด์ทดสอบแทนได้: เกมตัดสินแนวตั้งจาก `camera.aspect < 1` และฟังแค่ event `resize` (ไม่มี `orientationchange`) การเปลี่ยนขนาด viewport จึงวิ่งโค้ดเส้นเดียวกับการหมุนจอ
**ข้อจำกัดที่ยังเหลือ:** การเปลี่ยนขนาดหน้าต่างใน headless ไม่ใช่การหมุนเครื่องจริง · Codex มองไม่เห็นผลภาพเอง · ต้องสร้างฐาน `839c9c0` บนคลาวด์ใหม่ (ต้องใช้ `fix2_code.patch`, ข้อ 6) · การหมุนจอจริงบน iPhone/Android **ยังไม่ได้ทดสอบ**
เกณฑ์ผ่านคงเดิมจาก `CODEX_PROMPTS_R5.md` งานที่ 1 ทุกข้อ · ทางแก้ (ล้าง pull ในแนวตั้ง) เจ้าของอนุมัติแล้วเมื่อ 2026-11-24

### 2.3 พรอมป์ต์ (คัดลอกทั้ง 2 กล่องต่อกัน ส่งให้ Codex **หลังเจ้าของสั่งเลิกพัก C-1 แล้วเท่านั้น** เพราะบรรทัดที่ 3 ของกล่อง C-1 เขียนว่าเจ้าของสั่งเลิกพักแล้ว)
ต้นฉบับ: `docs/team/2026-11-25-codex-work-packages.md` ข้อ 4 (ส่วนกลาง v2) + ข้อ 3 (C-1)

กล่อง 1: ส่วนกลาง v2
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

กล่อง 2: C-1
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
QA บนคลาวด์เมื่อได้ patch: ตรวจ SHA → apply บนฐาน `839c9c0` ที่สร้างใหม่ → webgl2-probe → vitest/tsc/build → `c1-rotate.mjs` ต้อง PASS 4/4 → stage1-shots แนวนอน + pixeldiff (ต้องสร้าง baseline 100 ภาพใหม่ เพราะชุดเดิมอยู่ใน scratchpad ที่หายไปแล้ว ตาม `docs/qa/c1-prep/README.md`) → lifecycle 20/20 → QA อิสระ (Sonnet) → PM (Opus) ตัดสิน

---

## 3. REQ-004 และ REQ-005 สำหรับทีม A: ไฟล์และที่ดาวน์โหลด
PM ส่งถึงทีม A โดยตรงไม่ได้ (ทีม A คือ GPT Codex ที่เจ้าของเป็นคนส่งต่อ) · ไฟล์ทั้งหมดอยู่บน repo Public ที่ branch `art/env-polish` · ลิงก์ด้านล่าง**ตรึงที่ commit `927464a`** (เนื้อหาไม่เปลี่ยนแม้ branch ขยับ) · PM ตรวจแล้วว่าลิงก์ raw ทั้ง 4 ตอบ HTTP 200 (2026-11-25)

| ไฟล์ | สถานะ | ดูบนเว็บ | ดาวน์โหลดตรง (raw) |
|---|---|---|---|
| REQ-004 ข้อจำกัดไฟล์ศิลป์ R5.2 (6 คำถาม) | REQ เปิด · **ควรถึงทีม A ก่อนส่งไฟล์ R5.2** | https://github.com/thanaponzxz-gif/Synes-Online/blob/927464a98d4796198689287c6672f46411748c9e/docs/design/REQ-004-art-intake-tech.md | https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/design/REQ-004-art-intake-tech.md |
| ประกอบ REQ-004: ความพร้อมรับงานศิลป์ (รายละเอียดเต็ม G1–G11) | ข้อเท็จจริง | https://github.com/thanaponzxz-gif/Synes-Online/blob/927464a98d4796198689287c6672f46411748c9e/docs/art/ART_INTEGRATION_READINESS.md | https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/art/ART_INTEGRATION_READINESS.md |
| REQ-005 นโยบายรางวัล + ข้อความเมื่อเน็ตล้ม (GAME-1, NET-1…4) | REQ เปิด · ไม่เร่ง (server ยังไม่เปิดสาธารณะ) | https://github.com/thanaponzxz-gif/Synes-Online/blob/927464a98d4796198689287c6672f46411748c9e/docs/design/REQ-005-audit-policy-and-messages.md | https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/design/REQ-005-audit-policy-and-messages.md |
| ประกอบ REQ-005: Technical Audit ฉบับเต็ม | ข้อเท็จจริง | https://github.com/thanaponzxz-gif/Synes-Online/blob/927464a98d4796198689287c6672f46411748c9e/docs/qa/audit-2026-11-25.md | https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/qa/audit-2026-11-25.md |
ดาวน์โหลดทั้ง branch เป็น zip: https://github.com/thanaponzxz-gif/Synes-Online/archive/927464a98d4796198689287c6672f46411748c9e.zip
**ข้อจำกัดที่ทีม A ควรรู้:** REQ-004 อ้างโค้ด pilot (`839c9c0`: `LibLambert`, `paintLib`, `env_library_v01.glb`) ซึ่ง**ไม่อยู่บน repo Public** (ยังไม่อนุมัติ push) ทีม A จึงเห็นได้แค่ข้อเท็จจริงที่สรุปไว้ในเอกสาร ไม่เห็นโค้ดจริง
**ขั้นตอนตอบ:** ทีม A เขียน DES ตอบ (commit บน `design/<หัวข้อ>` หรือเจ้าของวางในแชต PM) → ทีม B ทำตาม (`docs/design/README.md`)

ข้อความสั้นสำหรับวางส่งทีม A:
```text
ทีม B (Claude PM) ส่งใบขอออกแบบ 2 ใบให้ทีม A ตรวจ ใบขอมีข้อเท็จจริงกับคำถามเท่านั้น ไม่มีข้อเสนอดีไซน์ (ADR-007)
1) REQ-004 ข้อจำกัดทางเทคนิคของไฟล์ศิลป์ R5.2 (vertex colour/texture/alpha/ด้านหลังหน้า/เพดาน tris และ texture/LOD/ชื่อ node) มี 6 คำถาม ขอคำตอบก่อนส่งไฟล์ R5.2
   https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/design/REQ-004-art-intake-tech.md
   ประกอบ: https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/art/ART_INTEGRATION_READINESS.md
2) REQ-005 นโยบายรางวัล (บอท/โหมดทดสอบได้รางวัลเต็ม) และข้อความที่ผู้เล่นเห็นเมื่อเน็ตล้ม/เกินเวลา ไม่เร่ง
   https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/design/REQ-005-audit-policy-and-messages.md
   ประกอบ: https://raw.githubusercontent.com/thanaponzxz-gif/Synes-Online/927464a98d4796198689287c6672f46411748c9e/docs/qa/audit-2026-11-25.md
หมายเหตุ: โค้ด pilot 839c9c0 ยังไม่อยู่บน repo Public ข้อเท็จจริงของ pilot จึงมีเฉพาะที่สรุปไว้ในเอกสาร
ตอบกลับเป็น DES-NNN ตามขั้นตอนใน docs/design/README.md
```

---

## 4. จัดอันดับ C-6, C-5, C-7, C-3 และงาน SEC/PERF
เกณฑ์: ความคุ้มค่า (ผลต่อผู้เล่นหรือต่องานถัดไป ÷ ต้นทุน) · ความพร้อม (เริ่มได้ทันทีไหม ติดอะไร) · โควตา
**โควตา (ข้อเท็จจริงจาก `get_session` ของเซสชันนี้):** Claude รอบ 5 ชั่วโมง = allowed, ไม่ใช้ overage, รีเซ็ต 03:00 น. เวลาไทย 25 พ.ย. · โควตารายสัปดาห์: **ไม่ทราบ** · โควตา Codex/GPT: **ไม่ทราบ** (เคยหมดเมื่อ 2026-11-23, ADR-010) · **lineage เซสชัน 7/8** → rollover อัตโนมัติได้อีก 1 ครั้ง จากนั้นเจ้าของต้องเปิดเซสชันใหม่เองจาก claude.ai · context ใช้ไปราว 123k/450k

| อันดับ | งาน | ความคุ้มค่า | ความพร้อม | ต้นทุน Codex | ต้นทุน Claude คลาวด์ | ชนไฟล์กับ |
|---|---|---|---|---|---|---|
| **1** | **C-6** สคริปต์สร้าง patch | สูง: กัน patch เสีย (BOM/CRLF, TD-3 เคยเกิดแล้ว) ให้**ทุกงานถัดไป** | **พร้อม** · ไม่ใช้เบราว์เซอร์ ทำจบบน PC ได้ · PM พิสูจน์แล้วว่าวิธีนี้ได้ SHA `8E37A1B7…` ตรงทุก byte | ต่ำ | ต่ำมาก (PM ตรวจ SHA + อ่านโค้ด ไม่ต้องใช้ QA agent) | ไม่ชน (`tools/qa/make-patch.mjs`) |
| **2** | **C-5** เวลาโหลดใน `#debug` | กลาง-สูง: เจ้าของต้องใช้ค่านี้ตอนวัดบนมือถือจริงก่อนอนุมัติ Golden Reference (ตอนนี้ไม่ทราบเวลาโหลดจริงเลย) | **พร้อม** · ส่วนเบราว์เซอร์ให้คลาวด์ทำ | ต่ำ-กลาง | ต่ำ-กลาง (stage1-shots ชุดเล็ก + lifecycle) | `src/main.ts` เท่านั้น ไม่ชน · ถ้าทำ C-2b ภายหลัง เวลา buildLevel จะเปลี่ยน ให้วัดใหม่ |
| **3** | **SEC-1/2/3/5** (server) | กลาง-ต่ำตอนนี้ (Pages ไม่ใช้ server นี้ ผู้เล่นทุกคนอยู่โหมดออฟไลน์) แต่ต้องทำก่อนเปิด server สาธารณะ | **พร้อม** · ขนาด S · มีแนวทางแก้ใน audit · ทดสอบด้วย unit test ไม่ต้องใช้เบราว์เซอร์ | — | ต่ำ (Claude คลาวด์ทำได้ทั้งงาน) | `server/` ไม่ชนกับ Codex |
| 4 | **C-7** silhouette ต้นไม้บังปุ่ม | สูงสำหรับ R5.2 (planner บอก 25 ต้น บังจริงราว 8) แต่ผลเป็นข้อมูลให้ทีม A เท่านั้น | **ไม่พร้อม** · ต้องรอ C-4 ผ่าน QA ก่อน (C-4 ยังไม่เริ่ม) | กลาง-สูง | กลาง-สูง (เทียบกับ hud-gate ทุก tier) | ไฟล์ใหม่ · ห้ามแตะ `envPilot.ts`/`view.ts` (C-1) |
| 5 | **PERF-1…4** (client) | ไม่ทราบบนมือถือจริง (P3 ไม่ได้วัดผลต่อ FPS) | ต้องมีเทสต์ว่าภาพเท่าเดิม · **PERF-2 แก้ `view.ts:731-790` ซึ่งเป็นจุดเดียวกับ C-1 → ต้องรอ C-1 ผ่านก่อน** | — | กลาง (pixel-diff ทุกฉาก) | PERF-2 ชน C-1 · PERF-3/4 (`fx.ts`) ไม่ชน |
| 6 | **C-3** สืบสาเหตุภาพ medium ต่างกันระหว่างโหลด | ต่ำต่อผู้เล่น (ภาพที่ผู้เล่นเห็นไม่ผิด) · ช่วยให้ QA tier medium แม่นขึ้น | พร้อม (ทำบนคลาวด์ได้) | — | **สูงสุด** (โหลดเบราว์เซอร์ 8 ครั้ง × 4 เงื่อนไข + ทดลองตัดตัวแปร บน SwiftShader) | อ่านอย่างเดียว ไม่ชน |
**ข้อเสนอ:** C-6 → C-5 ให้ Codex ตามลำดับ (คลาวด์ตรวจ C-6 ระหว่างที่ Codex ทำ C-5) · SEC ทำเป็นรอบเล็กบนคลาวด์เมื่อเจ้าของสั่ง · C-7 หลัง C-4 · PERF-2 หลัง C-1 · พัก C-3 ไว้จนกว่าเสียง noise ของ medium จะบล็อกการตรวจรับงานจริง
อยู่นอกตารางแต่เกี่ยวข้อง: C-4 อนุมัติแผนแล้วและพรอมป์ต์พร้อม (ต้องมาก่อน C-7) · C-1 ขึ้นกับข้อ 2

---

## 5. meshopt / KTX2: ประโยชน์ ต้นทุน ความเสี่ยง (ก่อนขออนุมัติติดตั้ง)
ที่มา: `docs/qa/mobile-perf-2026-11-25.md` ข้อ 3.2 และ 6 (P6), `docs/art/ART_INTEGRATION_READINESS.md` G10, `docs/knowledge/TOOL_REGISTRY.md`, EXP-103

### 5.1 ข้อเท็จจริง
- GLB ในเกมตอนนี้: `synes_kit.glb` 646,964 B · `spire_shrine_B.glb` 56,020 B (โหลดเฉพาะ `?spire=B`) · pilot `env_library_v01.glb` 361,000 B (ไม่อยู่บน remote)
- ไม่มี GLB ไหนบีบอัด (ไม่มี meshopt ไม่มี quantization ทุก attribute เป็น float32) และ**ไม่มี texture ใน GLB เลย** texture ทั้งหมดเป็น canvas ที่สร้างตอนรัน
- ภาพ PNG ของ UI 8 ไฟล์ รวม 520 KB คิดเป็นราว 51% ของขนาดดาวน์โหลด (ไม่ใช่ GLB)
- ตัวถอด meshopt **มีมากับ three.js ที่ติดตั้งอยู่แล้ว** (`node_modules/three/examples/jsm/libs/meshopt_decoder.module.js`, 29,256 B ก่อน minify) ฝั่งเกมจึงไม่ต้องติดตั้งแพ็กเกจเพิ่ม แต่ต้องแก้โค้ดโหลด GLB
- ฝั่งบีบอัดต้องติดตั้งเครื่องมือใหม่ (เช่น `gltfpack` หรือ `@gltf-transform/cli` + `meshoptimizer`) = ต้องให้เจ้าของอนุมัติ (CLAUDE.md ข้อ 6)
- กฎปัจจุบันห้ามบีบอัด: `ASSET_CONTRACT.md`/`verify_kit.py` ("ไม่ใช้ Draco/meshopt") และ `glb-check` ข้อ R3 ห้าม `EXT_meshopt_compression`, `KHR_texture_basisu` เพราะเกมยังไม่มีตัวถอด

### 5.2 meshopt + quantization
| | รายละเอียด |
|---|---|
| ประโยชน์ | **ประมาณการ (คำนวณ ไม่ได้วัดด้วยเครื่องมือจริง):** ไบต์ดิบ kit ~531 KB → ~280 KB (−47%), env_library ~354 KB → ~146 KB (−59%) · เวลา parse น่าจะลดลง · **ผลบนสายจริง (gzip) น้อยกว่านี้** เพราะข้อมูลที่ quantize แล้วบีบต่อได้น้อยลง · ไม่ลด draw calls (KPI-001 ไม่ดีขึ้น) |
| ต้นทุน | ติดตั้งเครื่องมือ 1 ตัว (dev เท่านั้น) · แก้ `src/render/models.ts` ให้ตั้งตัวถอด (ไฟล์เดียวกับ C-2 → ต้องทำหลัง C-2/C-2b) · แก้ pipeline `build_kit.py`/`verify_kit.py`/`glb-check` และ `ASSET_CONTRACT.md` · QA: ขนาดก่อน/หลัง (gzip), เวลา parse, pixel-diff 0, tris/calls เท่าเดิม |
| ความเสี่ยง | (1) quantize normal/ตำแหน่งแล้วแสงหรือรอยต่อเปลี่ยน → pixel-diff ≠ 0 → **ต้องให้ทีม A ตัดสิน** · (2) ตัวถอดใช้ WebAssembly ผลบน Safari ของ iPhone เจ้าของ**ยังไม่ทราบ** · (3) ตอนนี้ build_kit สร้างซ้ำได้ไบต์ตรง ยังไม่ทราบว่าเครื่องมือบีบอัดให้ผลคงที่หรือไม่ · (4) dependency ใหม่ใน repo Public ต้องตรวจ license จากแหล่งทางการก่อน (PM เชื่อว่าเป็น MIT แต่**ยังไม่ได้ตรวจรอบนี้**) |
| ข้อเสนอ | อนุมัติเป็น 2 ขั้น: (ก) ตรวจ license จากแหล่งทางการ + ทดลองบน branch `exp/meshopt` วัดขนาดจริงหลัง gzip (EXP-103, ไม่เข้า `main`) → (ข) ใช้จริงเฉพาะเมื่อ pixel-diff 0 และลดขนาดได้คุ้ม · ควรมาหลังงาน PNG ของ UI (P3/P7) เพราะ PNG เป็นสัดส่วนใหญ่กว่า |

### 5.3 KTX2 / Basis
| | รายละเอียด |
|---|---|
| ประโยชน์ตอนนี้ | **ไม่มี** · ไม่มี texture ใน GLB ให้บีบ texture canvas สร้างตอนรันจึงแปลงเป็น KTX2 ไม่ได้ ถ้าไม่เปลี่ยน pipeline ศิลป์ |
| จะมีประโยชน์เมื่อ | ทีม A ตอบ REQ-004 ข้อ 1 ว่า R5.2 ใช้ texture จริง |
| ต้นทุน/ความเสี่ยง | เครื่องมือเข้ารหัส + ตัวถอด Basis (WASM) + เปลี่ยน pipeline ศิลป์ทั้งหมด (ต้องให้ทีม A ออกแบบ) · ผลบน GPU มือถือแต่ละรุ่นยังไม่ทราบ |
| ข้อเสนอ | **ยังไม่ขออนุมัติ** รอคำตอบ REQ-004 |

---

## 6. ไฟล์ที่เจ้าของต้องแนบใหม่
**ทำไมต้องแนบใหม่:** ไฟล์ที่แนบในเซสชัน 2-E อยู่ใน scratchpad ของ container เดิมซึ่งถูกเก็บคืนแล้ว (ตรวจแล้ว: `839c9c0` ไม่มีใน container นี้)
**path ยืนยันได้แค่ไหน:** PM ไม่มีสิทธิ์เข้าเครื่องเจ้าของ (เจ้าของปฏิเสธการเชื่อมข้ามเครื่อง ซึ่งห้ามขอซ้ำ) · path ด้านล่างมาจาก**คำสั่งที่บันทึกไว้ในพรอมป์ต์/เอกสาร** ไม่ได้มาจากการเปิดดูเครื่อง · ตัวยืนยันจริงคือ **SHA256** ที่ PM ตรวจหลังได้ไฟล์

| # | ไฟล์ | ใช้ทำอะไร | ต้องเมื่อไร | ตำแหน่งบนเครื่องเจ้าของ (ตามบันทึก) | SHA256 ที่ PM จะตรวจ |
|---|---|---|---|---|---|
| 1 | `fix2_code.patch` | สร้างฐาน `839c9c0` บนคลาวด์ (`24f56b4` + patch) เพื่อ QA ทุกงาน Codex (C-1, C-2b, C-4, C-5, C-7) | **จำเป็น** ก่อน QA งานแรก | อยู่ใน `SYNES_Handoff_v05c_r5_fix2.zip` · **path ใน zip และบน PC ไม่ได้บันทึกไว้ใน repo** | `8E37A1B7D8ADCC809C6C6AFD5D2DE81B6AED31FA16F38A5587A511C377D10654` |
| 2 | `SYNES_Handoff_v05c_r5_fix2.zip` ทั้งไฟล์ (แทนข้อ 1 ได้) | มีทั้งข้อ 1 และต้นฉบับตัวตรวจ HUD (`hud_gate.mjs`, `hud_gate_measure.mjs`, `qa_core.mjs`) ที่ต้องใช้ตรวจ C-4 | **แนะนำ** ถ้าจะทำ C-4 | path ของ zip ไม่ได้บันทึก · ต้นฉบับที่แตกแล้วอยู่ที่ `C:\SYNES_ASSETS\SYNES_OUTPUT\r5\pilot_fix2\tools\` | ขึ้นต้น `84119AC4…` (บันทึกไว้แค่ 8 ตัวแรก) |
| 3 | `0001-C-2-Dispose-level-owned-render-resources-on-rebuild.patch` | ถ้ารับ C-2: ใช้บันทึก C-2 และเป็นฐานของ C-2b | ต้องมีถ้าเลือกรับ C-2 หรือทำ C-2b | `C:\SYNES_ASSETS\SYNES_OUTPUT\c2\` (ปลายทาง `format-patch -o` ในพรอมป์ต์ C-2) | `1368EC32C4EF2221113F703DB8D26836B681EBB7B64B331E6C035753B6CDE3C8` |
| 4 | `gaming_mode_log.csv` | อ่านหาสาเหตุ WebGL2 (ไม่บังคับ, ข้อ 7.3) | ไม่บังคับ | `C:\SYNES_ASSETS\SYNES_OUTPUT\tools\gaming_mode\gaming_mode_log.csv` | — (เป็น log) |
| 5 | `gaming_mode_suspended.txt` (ถ้ามี) | ดูว่าตัวเฝ้าพักงานหรือไม่ (H4) | ไม่บังคับ | `C:\SYNES_ASSETS\SYNES_OUTPUT\tools\gaming_mode\` | — |
| 6 | รายงาน BLOCKED ของ C-1 | อาการจริงของรอบวินิจฉัยเดิม (PM ไม่เคยได้รับ) | ไม่บังคับ | ส่วนบนสุดของ `C:\SYNES_ASSETS\_repo_worktrees\codex-r5\docs\HANDOFF.md` หรือข้อความที่ Codex ตอบเจ้าของ | — |

คำสั่งหาไฟล์ข้อ 1–3 บน PC (อ่านอย่างเดียว ไม่แก้อะไร) สำหรับวางใน PowerShell:
```powershell
Get-ChildItem C:\SYNES_ASSETS -Recurse -File -Include fix2_code.patch,SYNES_Handoff_v05c_r5_fix2.zip,0001-C-2-*.patch -ErrorAction SilentlyContinue | Get-FileHash -Algorithm SHA256 | Format-List Path,Hash
```
ข้อสังเกต: ไฟล์ที่แนบจะหายอีกเมื่อ container นี้ถูกเก็บคืน · ทางที่ไม่ต้องแนบซ้ำคือ push ฐาน `839c9c0` ขึ้น remote ซึ่ง**ยังเป็นเรื่องที่เจ้าของไม่อนุมัติ** (มี GLB ของ pilot) PM ไม่ได้ขอในเอกสารนี้

---

## สิ่งที่ยังไม่ทราบ
FPS/ความร้อนบนมือถือจริง · ขนาดของอาการ F2 บนมือถือจริง · หน่วยความจำสูงสุดช่วงเฟรมแรกของ C-2b · สาเหตุ WebGL2 บน PC · การหมุนจอจริงบน iPhone/Android · ขนาดที่ลดได้จริงหลัง gzip ของ meshopt · license ของเครื่องมือบีบอัด (ยังไม่ได้ตรวจจากแหล่งทางการรอบนี้) · โควตารายสัปดาห์ของ Claude และโควตา Codex · path ของ zip v05c บน PC

## ขั้นถัดไปควรใช้โมเดล
ตัดสิน/ตรวจรับ **Opus** · apply patch + รันชุดทดสอบ + QA อิสระ **Sonnet** · C-6 ตรวจโดย PM (Opus) ไม่ต้องใช้ QA agent
