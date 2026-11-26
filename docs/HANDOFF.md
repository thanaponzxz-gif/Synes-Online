# Handoff: Synes Online

## ส่งต่อไป Claude Code บนเครื่องเจ้าของ · 2026-11-27 · จาก 🟡 MAIN · Synes Online · รอบ 3-A (`session_01A1roa3XrBJNzodYD5BNRKZ`)
- **เหตุผล:** งานตัวละครนินจาต้องใช้ Blender MCP บนเครื่องเจ้าของ (addon ขึ้น Connected ที่ localhost:9876 แล้ว) แต่แชตคลาวด์มองไม่เห็นเครื่องมือ Blender และแก้ไฟล์ตั้งค่าแอป Claude แทนเจ้าของไม่ได้
- **ตัวละคร (ไฟล์ .glb ที่เจ้าของแนบ, ไม่อยู่ใน repo เพราะ 51 MB และ repo เป็น Public):** นินจาจิบิผมเงิน ผ้าพันคอแดง ถือมีดสั้น · ข้อเท็จจริง: 1 mesh/1 material, ~49k tris, texture 4096² × 3, export จาก Blender I/O 4.0.43 · **เป็น "ชีตตัวละคร" ไม่ใช่ตัวเดียว**: ตัวใหญ่ด้านหน้าซ้าย + ตัวเล็กหมุนรอบ 4 ตัว + ชิ้นส่วนแยก + หัว 5 หัว + มีด รวมอยู่ในเมชเดียว (8 ชิ้นที่ต่อกัน) · ที่มา/license ยังไม่ทราบ ต้องลงทะเบียน `docs/ASSETS.md`
- **แผนที่คุยไว้ (ยังไม่เริ่มทำ):** ใน Blender ตัดตัวใหญ่ด้านหน้าซ้ายออก → ลดเหลือขนาดมือถือ (เป้า ≤ ~10k tris, texture ≤ 1024², ไฟล์ ≤ ~1–2 MB) → ใส่กระดูก + ท่า (เดิน/วิ่ง/ตี/หลบ/โดนตี/ล้ม) → three.js เพิ่มตัวเล่นคลิปกระดูก (ตอนนี้เกมขยับชิ้นส่วนด้วยโค้ด ไม่มี AnimationMixer)
- **ติดอยู่ / รอเจ้าของ:** (1) ตัวละครนี้ **ก) แทน Wayfarer** ใช้คอมโบ/หลบ/3 สกิลเดิม (Claude แนะนำ) หรือ **ข) คลาสใหม่** มีสกิลนินจาของตัวเอง (ต้องให้ทีม A ออกแบบก่อน, ADR-007) · (2) ผ้าพันคอแดงชนกฎ "แดง/ส้มสงวนไว้สำหรับวงเตือน" → ข้อเสนอ: เปลี่ยนเป็น teal แบบ Wayfarer (ต้องผ่านทีม A) · (3) Meshy/Mixamo/Tripo ใส่กระดูกได้แต่ต้องใช้บัญชี/เครดิต → ต้องอนุมัติก่อน · ทางฟรี = Blender (Rigify/ทำเอง)
- **Brainstorming:** ค้างที่คำถาม ก/ข → ต่อด้วยวางทางเลือก → design doc `docs/superpowers/specs/2026-11-27-char-ninja-design.md` → อนุมัติ → writing-plans (ห้ามลงมือก่อนอนุมัติ)
- free roam ขั้น 1 อยู่บน `lane/free-roam` `f78123a` (ดูรอบ 3-A ด้านล่าง) ยังไม่ merge
- **โมเดล:** วางแผน/ตัดเมช/ตรวจผล **Opus** · ลดเมช/ใส่ท่าซ้ำ ๆ/โค้ดตัวเล่นคลิป **Sonnet**

## รอบ 3-A: เดินอิสระขั้น 1 · 2026-11-27 · 🟡 MAIN · Synes Online · รอบ 3-A
- ต่อจากแชต "หญ้าพริ้วไหว": **หญ้า r4 (`d7ff5c5` บน `art/grass-wind`) ไม่อยู่บน remote และไม่ได้แนบ patch มาในแชตนี้** → งานนี้แตกจาก `art/env-polish` `c33fa5b` (ไม่มีหญ้า r4) · ได้ patch เมื่อไรให้ `git am` แล้ว rebase/merge
- เจ้าของตัดสิน 2026-11-27: ด่านแรกต้องยาว+ท้าทายขึ้น, มอนเกิดใหม่ไม่จำกัด, อนุมัติแก้กติกา (ทีม A ออกแบบค่า ทีม B เขียนโค้ด) → ADR-012
- **branch `lane/free-roam`:** ruleset `roam-1` (ด่าน `shared/data/roam.ts`), สิ่งกีดขวางวงกลมใน sim, ประตูผลึกย้ายไปปากทางลานบอส, Auto ทั้งทุ่ง, render (`src/render/roam.ts`): โมเดลตรงวงชน, ขอบป่า 2 แถว + หินผา, บ่อน้ำ · กล้องเดิม (ตรวจแล้วที่ขอบ) · ค่าเริ่มของ branch นี้ = roam (`?roam=0` = เดิม)
- ทดสอบ: vitest 165/165, typecheck, lifecycle 20/20 · bench: tris 75k → 91–93k, draw calls +3 ถึง +6, FPS ไม่ต่าง (SwiftShader) · ด่านเดิมฉากนิ่งต่าง 0 px · **Android/iPhone ยังไม่ได้ทดสอบ** → `docs/qa/roam-v01/README.md`
- **ลิงก์ลองเล่น (Artifact ส่วนตัว, บิลด์ `3dcc35d`, ออฟไลน์):** https://claude.ai/artifact/T4LK7cJv8fKgAqtDNr45nE
- ส่งทีม A: `docs/design/REQ-006-free-roam-values.md` (Q1–Q9: ขนาดทุ่ง, สิ่งกีดขวาง, ขอบ, ประตู, กล้อง, โซนเกิด, ความท้าทาย)
- **งานถัดไป:** ขั้น 2 มอนเกิดสุ่มในโซน (PRNG ของ sim + ruleset ใหม่) เมื่อได้ค่าจากทีม A หรือเจ้าของสั่งให้ใช้ค่าทดลอง · ไม่ merge `main` ไม่ขึ้น Pages
- **ขั้นถัดไปควรใช้โมเดล:** ขั้น 2 (กติกาใหม่ใน sim) **Opus** · QA ซ้ำ/วัดผล **Sonnet**

## รอบ 2-G: เตรียมความพร้อม Claude-First (Preparation เท่านั้น) · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-G (`session_01A1roa5SiRHs91xT3uQQqXP`)
- ปิดแชต 2-F แล้ว (⚪ + archive หลังตรวจ `0a8c27c` บน remote) · lineage **8/8** (สร้างเซสชันลูกไม่ได้ · เปลี่ยนเซสชัน = เจ้าของเปิดเองพร้อมพรอมป์ต์ master handoff ข้อ 8)
- เจ้าของอนุมัติ **Preparation เท่านั้น (ไม่ใช่ A2)** → `docs/team/2026-11-25-2G-prep.md`: ตรวจ A1–A11 + dependency, WP C-6 (AC-1…8, Test Plan T0–T3, ความเสี่ยง SHA ข้ามเวอร์ชัน git), วิเคราะห์ C-5/SEC คู่ขนาน
- ข้อสรุป: SEC-1/2a/3/5 พร้อมเริ่มเมื่ออนุมัติ (ไม่ขึ้นกับ P1/F1) · C-6 พร้อมหลัง P1 (AC-1/3 ต้องมี F1) · C-5 BLOCKED (P1 + F1) · SEC-2b (TTL/เพดาน runs) BLOCKED รอค่าจากทีม A ผ่าน REQ-005
- ไม่มี implementation · ไม่มี push/merge pilot · ไม่มีงานบน PC · ทดสอบ: vitest 155/155, typecheck (ต้นรอบ) · Android/iPhone ยังไม่ได้ทดสอบ

## Rollover → 🟡 MAIN · Synes Online · รอบ 2-G · 2026-11-25 · จาก รอบ 2-F (`session_01A1roa4D5M2pZxQPQegFexE`)
- **อ่านก่อน:** `docs/team/2026-11-25-master-handoff-2F.md` → `docs/team/2026-11-25-claude-first-allocation.md` (แผนปัจจุบัน, ADR-011)
- เจ้าของสั่ง Claude-First Quota Allocation: Claude = Engineering หลัก ~65% · Codex = Technical Production ~35% · ทีม A คุมดีไซน์ทั้งหมด → ADR-011 + แผน (ตารางจัดสรร, A1–A11, โมเดล/ที่ทำงาน/port ต่องาน, พรอมป์ต์ P1–P5, กล่องงาน SEC/PERF, ไฟล์แนบ F1–F6, ระลอก 0–4) · AGENTS.md เพิ่มแถว Technical Production
- **ยังไม่เริ่ม implementation ใด ๆ** · ไม่ได้รัน QA ซ้ำ · ไม่มี push/merge pilot · ไม่ได้ติดตั้งเครื่องมือ · ขั้นแรกเมื่ออนุมัติ = P1 ถามสถานะ Codex (กันงานซ้ำ)
- rollover เพราะเซสชัน 2-F ถูกบีบอัด (ใช้ rollover อัตโนมัติครั้งสุดท้าย) → **2-G = lineage 8/8 สร้างเซสชันลูกไม่ได้**
- ทดสอบ: ไม่มีการเปลี่ยนโค้ดตั้งแต่ vitest 155/155 + typecheck ต้นรอบ 2-F · Android/iPhone ยังไม่ได้ทดสอบ

## รอบ 2-F: เตรียมสั่งงาน + Checkpoint · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-F (`session_01A1roa4D5M2pZxQPQegFexE`)
- **อ่านก่อน:** `docs/team/2026-11-25-master-handoff-2F.md` (Master Handoff + พรอมป์ต์เริ่มเซสชันใหม่) · checkpoint = commit `69299a1` (push tag ถูกปฏิเสธ 403)
- คำสั่งเจ้าของ 9 ข้อ → `docs/team/2026-11-25-dispatch-2F.md` (รายการตัดสิน D0–D8, ลำดับ C-6 → C-5 → C-1 v2 → C-2b → C-4, พรอมป์ต์ Codex/ทีม A/QA คลาวด์, แผน meshopt EXP-103) · `docs/team/2026-11-25-pm-accept-c2.md` (PM รับ C-2, F1/F2/F3 เปิดต่อ → C-2b) · แพ็ก zip REQ-004/005 ส่งเจ้าของในแชต (SHA `6de10b5c…`)
- ตรวจ license จากแหล่งทางการ (อ่านอย่างเดียว): meshoptimizer/gltfpack MIT, glTF-Transform MIT · **ไม่ได้ติดตั้ง ไม่ได้สร้าง `exp/meshopt`**
- พัก: C-7 (จน C-4 ผ่าน QA), KTX2, C-9 · ไม่มี push/merge pilot · ไม่ได้รัน QA ซ้ำ
- ทดสอบ: vitest 155/155, typecheck (ต้นรอบ) · Android/iPhone ยังไม่ได้ทดสอบ

## รอบ 2-F เริ่ม · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-F (`session_01A1roa4D5M2pZxQPQegFexE`)
- ปิดแชต 2-E แล้ว (⚪ + archive หลังตรวจ `927464a` บน remote) · vitest 155/155, typecheck ผ่าน · lineage 7/8 (rollover อัตโนมัติเหลือ 1 ครั้ง)
- เจ้าของยังไม่อนุมัติ 8 ข้อ ขอข้อมูลก่อน → `docs/team/2026-11-25-pm-owner-review-pack.md` (QA C-2 + เหตุผล C-2b, พรอมป์ต์ C-1 v2, ลิงก์ REQ-004/005 ให้ทีม A, อันดับงาน, meshopt/KTX2, ไฟล์ที่ต้องแนบใหม่) · ใช้หลักฐานเดิม ไม่ได้รัน QA ซ้ำ · **ไม่เริ่ม implementation**
- ทดสอบ: Android/iPhone ยังไม่ได้ทดสอบ · PC = Chromium headless (หลักฐานเดิม)

## โหมดกลางคืน → Rollover 🟡 MAIN · Synes Online · รอบ 2-F · 2026-11-25 · จาก รอบ 2-E (`session_01A1roa3dorP6krBJf4hzHmZ`)
- **อ่านก่อน:** `docs/team/2026-11-25-morning-brief.md` (สรุปงานกลางคืนทั้งหมด + รายการ NEEDS OWNER 8 ข้อ) · ไม่มีงานไหนที่เจ้าของอนุมัติค้างอยู่ → **รอเจ้าของตัดสินก่อนเริ่มงานใหม่**
- งานกลางคืน (คลาวด์เท่านั้น, ไม่มี merge/Pages/push pilot): P1 วิเคราะห์ C-1 blocker (Fable) `docs/team/2026-11-25-c1-blocker-analysis.md` + `tools/qa/c1-rotate.mjs` baseline FAIL 0/4 (TD-2 ทำซ้ำได้) `docs/qa/c1-prep/` · P2 audit `docs/qa/audit-2026-11-25.md` · P3 perf + KPI-001 (บอส 20 calls = 31%) `docs/qa/mobile-perf-2026-11-25.md` · P4 ชุดงาน Codex `docs/team/2026-11-25-codex-work-packages.md` (C-1 v2, C-6, C-5, C-7, C-3) · P5 `docs/art/ART_INTEGRATION_READINESS.md` + `tools/qa/glb-check.mjs` · REQ-004/005 ถึงทีม A · `.gitignore` กัน Hero/third-party · `webgl2-probe.mjs` พิมพ์ขั้นตอน + `--timeout` (exit 3 บอกขั้นที่ค้าง)
- ฐาน QA บนคลาวด์อยู่ใน scratchpad ของเซสชัน 2-E (หายเมื่อ container ถูกคืน): ถ้าต้องใช้ใหม่ ให้สร้างจาก `24f56b4` + `fix2_code.patch` (SHA `8E37A1B7…`) ที่เจ้าของแนบ = โค้ด `839c9c0` · ภาพ baseline 100 ภาพสร้างใหม่ตาม `docs/qa/c1-prep/README.md`
- ทดสอบ: vitest 155/155, typecheck ผ่าน (audit) · Android/iPhone ยังไม่ได้ทดสอบ · PC = Chromium headless + SwiftShader

## รอบ 2-E เริ่ม · 2026-11-24 · 🟡 MAIN · Synes Online · รอบ 2-E (`session_01A1roa3dorP6krBJf4hzHmZ`)
- ปิดแชต 2-D แล้ว (⚪ + archive) · `art/env-polish`: test 155/155, typecheck, build, lifecycle 20/20
- ยังไม่มีไฟล์ใหม่: ไม่มี branch ใหม่จาก Local Art/Codex, Drive `SYNES_ASSETS` ไม่เปลี่ยนตั้งแต่ 11-23, zip v05c/d/e ไม่อยู่ใน container
- เตรียมเทียบ v01/v02 แล้ว: `stage1-shots.mjs --qs envlib=1` เทียบ `pixeldiff.mjs` ได้ 0 px ทั้ง 18 ภาพ (ไม่มีไฟล์ library = no-op, harness deterministic)
- **ได้ zip v05c/d/e จากเจ้าของ (SHA256 ตรง)** → PM ตรวจซ้ำ `fix2_code.patch` บน `24f56b4`: 168/168, typecheck, build, lifecycle 20/20, ปิด flag ฉาก 3D ตรง v01, ฉากบอสกับ `envlib=1` ตรง v01 → **ตรวจรับ QA รอบแก้ 2 ผ่าน** (`docs/team/2026-11-24-pm-accept-r5-fix2.md`) · ภาพเทียบ v01/v02 ส่งเจ้าของในแชต (ไม่ commit) · ข้อใหม่: บอส phase 2 calls 62/65 เกินเพดานชั่วคราว 56/60 อยู่แล้วในเกมเดิม
- **C-2 (Codex `69301b5`, patch SHA256 `1368EC32…` ตรง) QA อิสระบนคลาวด์ = PASS with notes** (Blocker 0, Major 0, Minor 3: F1 material cache ถูก dispose ตอนไม่มี kit, F2 คอมไพล์ shader ใหม่มากขึ้นหลัง rebuild เฟรมแรกช้าขึ้น ~100 ms บน SwiftShader, F3 เครื่องมือวัดไม่ครบ) · `docs/qa/c2-v01/`, `docs/team/2026-11-25-pm-c2-qa-and-c4-plan.md` · ไม่ merge/push · รอเจ้าของ: รับ C-2 หรือทำ C-2b ก่อน · พรอมป์ต์ C-4 พร้อม
- **C-1 พัก (BLOCKED WebGL2 บนเครื่องเจ้าของ)** → QA Environment ทางเลือก = container คลาวด์ (Chromium 158 + SwiftShader, `tools/qa/webgl2-probe.mjs` READY, วัดรั่ว C-2 ได้: +16/+17 geometries, +1 texture ต่อ rebuild ที่ฐาน `839c9c0`) · ส่งงานด้วย `git format-patch` ผ่านเจ้าของ ไม่ต้อง push · พรอมป์ต์ C-2 (worktree `codex-c2`, branch `lane/codex-c2`, port 8095) ใน `docs/team/2026-11-24-pm-qa-env-and-c2.md`
- **คำสั่งเจ้าของหลังรับผล Fix2:** เพดาน Golden Reference คง 56/60 · บอส phase 2 62/65 = KPI-001 (`docs/qa/KNOWN_ISSUES.md`) ไม่เพิ่มเพดาน C-9 ยังไม่เปิด · ทีม A ออกแบบ R5.2 (ต้นไม้บัง Potion, ต้นสน, Visual Identity) · Codex ทำ C-1 ต่อในเซสชันเดิม → QA อิสระ · **ยังไม่อนุมัติ push `art/env-r5-pilot`** · ไม่รัน QA ซ้ำจนมีงานใหม่
- เจ้าของอนุมัติ C-1 ให้ Codex Local, พัก C-2…C-9 จนตรวจรับ C-1 (ข้อความ Local Art) → ตอบใน `docs/team/2026-11-24-pm-reply-local-art.md` ข้อความที่ 3

## Rollover → 🟡 MAIN · Synes Online · รอบ 2-E (Environment v02) · 2026-11-24 · จาก รอบ 2-D (`session_01A1roa4t58WN2ZvXKFKGAPa`)
- **branch งาน = `art/env-polish`** (ยังไม่ merge `main`, ไม่ขึ้น Pages ตามคำสั่งเจ้าของ) · baseline v01 = `baseline/env-v01` (`8b4f602`)
- ประสาน Local Art (เครื่อง Windows ของเจ้าของ) ผ่านไฟล์เท่านั้น: `docs/team/2026-11-23-pm-to-local-art.md`, `docs/team/2026-11-24-pm-reply-local-art.md` (`ab3a4e2`) · เซสชันคลาวด์ส่งข้อความหาเครื่องเจ้าของไม่ได้ (เจ้าของปฏิเสธการเชื่อมข้ามเครื่อง — ห้ามขอซ้ำ)
- คำตัดสินล่าสุด: Codex ทำบนเครื่องเจ้าของตามลำดับทีม A C-1 → C-2 → C-4 → C-5 → C-6 → C-7 → C-3 → C-8, C-9 พัก · C-1 (TD-2 กล้อง pull ค้างเมื่อหมุนเป็นแนวตั้ง, `src/render/view.ts:731/736`) เริ่มได้ทันที เกณฑ์รับอยู่ในไฟล์ตอบ · QA อิสระหลัง C-1 = เซสชัน Opus ใหม่บนเครื่องเจ้าของ
- **ติดรอเจ้าของ:** แนบ zip (`SYNES_Handoff_v05c_r5_fix2.zip`, `v05d_r5_commit.zip`, `v05e_codex_local.zip`, `MESSAGE_TO_PM_2026-11-24.md`) · อนุมัติ push `art/env-r5-pilot`/ชุดย่อย library ขึ้น repo Public (ห้าม Hero) · Hero 001 Q4 (ตัวตน + ผ้าพันคอแดง vs teal) · Environment v02 + เทียบ v01/v02 + QA อิสระ ทำต่อได้เมื่อได้ไฟล์ library
- ทดสอบ: Android/iPhone ยังไม่ได้ทดสอบ · PC = Chromium headless เท่านั้น

## Environment Art v01: Golden Reference ผ่านตรวจอิสระ · 2026-11-23 · 🟡 MAIN · Synes Online · รอบ 2-D
**คำสั่งเจ้าของ (2026-11-23):** Environment Art & Visual Polish เป็นงานหลัก · Free Asset First (CC0) · Claude รับช่วง Technical Art ชั่วคราว (โควตา GPT/Codex หมด) · QA ภาพแยกจากผู้ผลิต · ทุกงานภาพมี Before/After + perf · ไม่ขยายแมพที่สอง → **ADR-010**
- branch งาน `art/env-polish` (**ยังไม่ merge `main`, ไม่แตะ Pages**): baseline `docs/qa/env-art-v01/r0-baseline/`, พื้นที่ตัวอย่าง r1→r3 (`exp/env-sample-a` `212c989`) ตรวจอิสระ 3 รอบ ผล r3 **ผ่าน** = Golden Reference (กฎ 6 ข้อใน `docs/qa/env-art-v01/README.md`) · `?env=0` = ภาพเดิมตรงทุกพิกเซลในฉาก 3D
- หลัง merge เข้า `art/env-polish`: test 155/155 · typecheck · build · lifecycle 20/20 · **Android / iPhone: ยังไม่ได้ทดสอบ**
- เวลาโหลด: headless แยกความต่างไม่ได้ (−11 ถึง +287 ms, noise ±400) → ต้องวัดบน Android จริงก่อนขึ้น Pages
- **สาย `🟡 SUB · Synes · env-assets`** (`session_01A1roa4B7XoiVyVoHkVStEs`, environment `synes-online`, branch `lane/env-assets`): สคริปต์ `build_env_library.py` พร้อม แต่**ยังไม่มี asset** — ดาวน์โหลดจากเว็บถูกตัวกรองสิทธิ์ปฏิเสธ, Drive connector จำกัด 10 MB/ไฟล์ → รอเจ้าของแบ่ง zip เป็นไฟล์ย่อย 9 MB ใน Drive/SYNES_ASSETS · เกมมี hook `?envlib=1` รอ `public/assets/models/env_library_v01.glb`
- **Hero 001:** ไม่มีไฟล์ใน repo, ไม่มีเครื่องเจ้าของเชื่อม · เจ้าของสั่งห้ามขึ้น repo สาธารณะ (ผ่านสาย env-assets) → รอไฟล์แบ่งย่อยใน Drive · งานตัวละครยังไม่เริ่ม
- งานรอทีม A: `docs/design/PENDING_QUEUE.md`
- ของค้างใน container: server ทดสอบของ agent พอร์ต 8792/8793, worktree `.claude/worktrees/agent-*` (ระบบไม่อนุญาตให้ลบ)
**งานถัดไป:** (1) ขยายตาม Golden Reference: ลวดลายลานแรก, ช่วงบ่อน้ำ→ทางเข้าลานบอส, ตรวจอิสระซ้ำ (2) นำ env_library เข้าเมื่อได้ไฟล์ (3) Hero 001 เมื่อได้ไฟล์ (4) เจ้าของ: merge `art/env-polish` → `main`, วัดบนมือถือจริง
**ขั้นถัดไปควรใช้โมเดล:** งานภาพ/ตรวจภาพ **Opus** · นำ asset เข้า + สคริปต์ **Sonnet**

## merge stage1 → main + จังหวะตี A + Pages · 2026-11-21 · 🟡 MAIN · Synes Online · รอบ 2-D
**เจ้าของอนุมัติ:** merge `stage1/polish` เข้า `main` และขึ้น GitHub Pages · เลือกจังหวะตี **ชุด A** (ตอบผ่านคำถามในแชต เพราะข้อความเดิมเว้นช่องว่างไว้)
- `main` `7a52680` = merge `stage1/polish` (test 154/154, typecheck, build, lifecycle 20/20)
- `main` `b46ca7f`: ruleset ถาวร `combat-2` = ตัวเลขชุด A เป็นค่าเริ่มของ client · `?combo=1` = `combat-1` เดิม · `?combo=A|B|C` ยังเทียบได้ · server อ่าน field ที่หายเป็น `combat-1` (log เก่าเล่นซ้ำผลเดิม) · ไม่ชดเชยดาเมจ (ADR-009) · test 155/155, lifecycle 20/20
- เทสต์ server path ข้าม `combo-A` (ตัวเลขเท่า `combat-2` มีเทสต์ระดับ sim ยืนยัน) เพื่อไม่ชน rate limit 30/IP ของ server
- Pages: `gh-pages` `1aa6088` = บิลด์ `b46ca7f` โหมดออฟไลน์ · smoke test ที่ sub-path: เข้าเกมได้ ไม่มี error ไม่มี 4xx นอกจาก `/api/health`
**Android / iPhone: ยังไม่ได้ทดสอบ** (ขอเจ้าของเล่นบน iPhone ผ่าน Pages ด้วย `#debug` เพื่อจด FPS และความรู้สึกจังหวะตี A)
**ขั้นถัดไปควรใช้โมเดล:** ตรวจคำตอบทีม A / ปรับภาพ **Opus** · QA ซ้ำ **Sonnet**

## รอบ stage1 ต่อ: spire + shrine · 2026-11-21 · 🟡 MAIN · Synes Online · รอบ 2-D (`session_01A1roa4t58WN2ZvXKFKGAPa`)
**ทีม A:** ยังไม่มีคำตอบใหม่บน `main` (ล่าสุด `90d3b4d` ซึ่งทำตามแล้ว) · ปัญหาค้างใน r1-final ทุกข้อรอทีม A (C1 กล้องถอยล่วงหน้า, ลานบอสมืด, ต้นไม้ลายตาข่าย, แถบ HP บอส) · DES-006 §3 ชื่อบอส 14 px / ผลึกซ้าย 0.39 ทำแล้วรอบก่อน
**ทำแล้ว:** DES-004 ขั้น 2 ส่วน Blender `crystal_spire` + `ruin_arch_shrine` A/B (subagent Opus, `exp/stage1-spire-shrine` `291bda5`) → merge เข้า `stage1/polish` เลือก A เป็นค่าเริ่ม (`?spire=B`, `?spire=0` ภาพเดิม)
- tris A +1,149 / B +1,318 (งบ +6k) · GLB 585.8 → 631.8 KB (งบ 700) · draw calls ลานบอส +1 ทุกช็อต · วงเตือน: พิกเซลอุ่นไม่เปลี่ยน · verify_kit ผ่าน, build ซ้ำไบต์ตรง
- PM ตรวจซ้ำหลัง merge: test 154/154 · typecheck · build · lifecycle 20/20 · ภาพ `docs/qa/spire-shrine-v01/ingame/` · **placeholder ยังไม่ APPROVED** · ไฟล์เสริม `public/assets/models/spire_shrine_B.glb` 54.7 KB โหลดเฉพาะ `?spire=B`
- **ถามทีม A:** S1–S10 ใน `docs/qa/spire-shrine-v01/README.md` (เด่น: S4 ศาลถูกกล้องต่ำตัดครึ่งบน, S1 จำนวน spire 4 ต้น)
**Android / iPhone: ยังไม่ได้ทดสอบ · PC: headless เท่านั้น**
**งานถัดไป:** ไม่มีงานด่านแรกที่ทำได้โดยไม่ต้องรอทีม A/เจ้าของ → รอคำตอบ (DES-006-teamB, DES-004 §8, `docs/qa/*-v01`) แล้วทำตาม · เจ้าของ: เลือก combo A/B/C, อนุมัติโมเดล, merge `stage1/polish` → `main`
**ขั้นถัดไปควรใช้โมเดล:** ตรวจคำตอบทีม A / ปรับภาพ **Opus** · QA ซ้ำ / โค้ดไม่เปลี่ยนภาพ **Sonnet**

## รอบ stage1 (ด่านแรก) จบรอบ · 2026-11-21 · 🟡 MAIN · Synes Online · รอบ 2-C (`session_01A1roa2KGrJBDidSksZdrwK`)
**คำสั่งเจ้าของ:** ทำต่อเนื่องไม่หยุดรออนุมัติ เฉพาะงานปรับปรุงด่านแรก บน branch งาน · หยุดเมื่อ: จ่ายเงิน/สมัคร, เปิดเผย secret, ลบงานต้นฉบับ, เขียนทับที่กู้ไม่ได้, เปลี่ยนกฎความปลอดภัย, **merge เข้า `main`**, เผยแพร่สาธารณะ · แผน `docs/stage1/PLAN.md`
**ทีม A ส่ง DES-006 แล้ว** (`main` `90d3b4d`) → ข้อความส่ง Codex ที่เตรียมไว้ก่อนหน้าไม่ต้องส่งแล้ว
**branch รวม `stage1/polish` = `ea3d371`+ (ยังไม่ merge `main` — รอเจ้าของสั่ง)** ผลรวมก่อน→หลัง: `docs/qa/stage1-v01/r1-final/README.md`
| งาน | branch | ผล (Chromium headless) |
|---|---|---|
| baseline + เครื่องมือถ่ายซ้ำ `tools/qa/stage1-shots.mjs` | `qa/stage1-baseline` | `docs/qa/stage1-v01/r0-baseline/` |
| ลด draw calls ภาพไม่เปลี่ยน | `lane/perf-field` | ทุ่ง 149→45 · พิกเซลตรง main |
| จังหวะตี A/B/C (`?combo=`) + `rulesetVersion`/`tuningHash` | `lane/combo` | ค่าเริ่ม `combat-1` เหมือนเดิมทุกไบต์ · **REQ-003 ผิด: รอบคอมโบจริง 0.73 s** → A/B/C ช้ากว่าเดิม 1.9–2.4× |
| สีวงเตือน (DES-006 §2) | `lane/tele-color` | ΔE00 23→4 (sRGB + เลิกผสมขาว) · +0 call |
| กล้องถอยชั่วคราว (DES-006 §1) | `lane/camera-pullback` | กลางเวลาเตือน 23/23 (เดิม 8/23) · tick แรก 14/23 |
| HUD (DES-006) | `lane/hud-fixes` | แก้บั๊กปุ่มไม่จาง 5/8 · ตัวอักษร ≥12/14 px |
| Q17 | `lane/q17` | ล้าง token ค้างของท่าพุ่ง + 4 เทสต์ |
| ฉากเปิด A (เลือก) / B `?opening=B` | `exp/stage1-opening` | O1–O9 ผ่านที่ medium (เดิมตก O1–O5) · คริสตัลนำทางตกแต่ง (AQ4) |
| ลานบอส A (เลือก) / B `?arena=B` | `exp/stage1-arena` | พื้นหิน Voronoi, หญ้าขอบ, น้ำตก, ศาลย้ายขวา · ขอบวงยังชัดในขาวดำ (B เสีย 40–50%) |
| ตัวละคร A (เลือก) / B GLB ใน `docs/qa/chars-v01/` | `exp/stage1-chars` | ผมเป็นปอย, ผ้าพันคอ teal ชัด, บอสเกราะหิน+ผลึกใหญ่ · **placeholder ยังไม่ APPROVED** |
| VFX A (เลือก) / B `?vfx=B` | `exp/stage1-vfx` | Chime prep cue (Q26), Crescent เอียงหากล้อง, hit flash, วงฮีโร่บาง, ประกาย 1 call · ไม่มีสีอุ่น |
| เอกสาร: โลก 5 โซน + มอน 15 แบบ / เป้าภาพฉากเปิด | `docs/world-structure`, `docs/art-target-opening` | S1–S16, AQ1–AQ4 |
**รวม (844×390):** draw calls ทุ่ง 149–155 → 45–50 · ลานบอส 97–116 → 48–58 · bench 144–150 → 43–46 · transfer 838→863 KB · test 154/154 · typecheck · build · lifecycle 20/20 · **Android / iPhone: ยังไม่ได้ทดสอบ**
**ตัวเลือกที่ไม่ได้เลือกยังอยู่** (สลับด้วย URL) ไม่ลบ branch ใด
**รอทีม A:** combo คงช่วงต่อท่า 62%? · กล้อง C1–C4 · สีวงเตือน 4 จุด + แดงในขาวดำ + แถบ HP บอส · ตัวละคร (สีที่ทีม B เลือก) · HUD B1–B11 · ลานบอส 1–6 · VFX 1–7 · ฉากเปิด AQ1–AQ4 + ลายตาข่ายต้นไม้ · โลก S1–S16 (ทั้งหมดอยู่ใน `docs/design/DES-006-teamB.md`, `DES-004` §8, `docs/qa/*-v01/README.md`)
**รอเจ้าของ:** เลือก combo A/B/C (คลิป `docs/qa/combo-v01/`) · อนุมัติโมเดลตัวละคร A · merge `stage1/polish` เข้า `main` · Pages (ห้ามอัปเดตเอง) · เล่นบนมือถือจริง
**งานถัดไป (ยังอยู่ในขอบเขตด่านแรก):** Blender `crystal_spire`/`ruin_arch_shrine` (DES-004 ขั้น 2 ส่วนที่เหลือ) · แก้ตามคำตอบทีม A · ห้ามขยายด่านใหญ่/มอนใหม่จนด่านแรกผ่านเกณฑ์
**หมายเหตุ:** GLB สร้างด้วย Blender 5.3 แล้ว (เดิม 4.5.3) · ไฟล์ค้าง `/v_puff.png` (รูปเทียบ 65 KB ที่ agent เขียนผิดที่) ลบไม่ได้เพราะ safety check — เจ้าของลบเองได้ · subagent หลายตัวใช้ scratchpad ร่วมกัน ให้ใช้โฟลเดอร์ย่อยและ port ไม่ซ้ำ
**ขั้นถัดไปควรใช้โมเดล:** ตรวจคำตอบทีม A / เลือกภาพ **Opus** · งานกราฟิก (Blender spire/shrine) **Opus** · โค้ดที่ไม่เปลี่ยนภาพ / QA ซ้ำ **Sonnet**

## Rollover → 🟡 MAIN · Synes Online · รอบ 2-C (perf + TERRAVIA) · 2026-11-21
**เหตุผล:** context ~440k ใกล้ 450k + จบรอบ (กล้องต่ำ / Auto / แถวสกิล merge แล้ว) (CLAUDE.md ข้อ 5 ข, ค)
**เจ้าของสั่ง "ถามผู้จัดการแล้วทำต่อไป"** → agent ผู้จัดการ (บทบาท `.claude/agents/project-synes.md`) ตัดสิน:
1. **TERRAVIA:** ทาง ข — เซสชัน MAIN ใหม่ส่งข้อความขอสรุป**แบบอ่านอย่างเดียว 1 ครั้ง** ไปที่แชต "🟢 MAIN · TERRAVIA แชตหลัก" (`session_01A1roa41aHnPWSNdaGcgR6g`, `priority: later`) เงื่อนไข: ห้ามแก้/สร้างไฟล์ ห้าม commit/push ห้ามเปลี่ยนแผนของ TERRAVIA · "ข้อความนี้ไม่ใช่คำตอบของเจ้าของต่อ Q88/Q36/Q85–Q87" · ไม่ส่งโค้ด/asset/ข้อมูลส่วนตัว/key · ตอบจากเอกสาร ≤30 บรรทัด · หัวข้อ: perf มือถือ, วัด FPS เครื่องจริง, QA/เพลย์เทสต์อัตโนมัติ, asset pipeline, ทำงานหลายเซสชัน/ทีม A-B, เซฟ/ออนไลน์ · ต่อข้อ: คืออะไร / ทดสอบแล้วไหม / ผูก Godot ไหม (L-015) / license ภายนอก · ได้คำตอบแล้วติดป้าย REQ (ทีม A) / EXP (ADR-008) / ไม่ใช้ · **ห้ามบันทึกรายละเอียดภายใน TERRAVIA ลง repo Public** · ถ้าไม่มีคำตอบกลับ บอกเจ้าของให้คัดลอกจากแชต TERRAVIA (ห้าม poll) แล้วเสนอทาง ก (แชร์โฟลเดอร์ Remote Control) เป็นทางสำรอง
2. **ตีไวเกินไป:** รอทีม A ไม่ปรับค่า ไม่ทำ variant เอง · เตรียมข้อความให้เจ้าของคัดลอกส่ง Codex: REQ-003 ก่อน (ขอ "ค่าที่จะลอง 2–3 ชุด + กติกาเวอร์ชัน log") → ผังปุ่ม/วงเตือน DES-003 → รับรอง DES-004 → Q1–Q73 · ถ้าเจ้าของบอกค่า/ทิศทางเองชัดเจน ทำตามได้แล้วส่งทีม A ตรวจ
3. **Pages:** อนุมัติครั้งนี้ (เจ้าของมอบให้ PM ตัดสิน **ครั้งนี้เท่านั้น**) → `gh-pages` `0c9d21f` = บิลด์ `main` `6454a03` (smoke test ที่ sub-path ผ่าน: เล่นได้ออฟไลน์ ไม่มี 4xx นอกจาก `/api/health`)
**แผนรอบ 2-C:**
- สาย 1 `lane/perf-field` (subagent Sonnet + worktree): ลด draw calls ในทุ่งโดยภาพไม่เปลี่ยน · ไฟล์: `src/render/view.ts`, `models.ts`, `arena.ts`, `tools/qa/**`, `docs/qa/perf-field-v01/**` · ห้ามแตะ `shared/**`, `src/ui/**`, `index.html`, `src/style.css`, `public/assets/models/**` · เสร็จเมื่อ: ตาราง draw calls แยกหมวด (low/medium, 3 ฉากทุ่ง + ลานบอส), ทุ่ง ≤ 75, ลานบอสไม่สูงกว่าตอนนี้, ภาพเทียบพิกเซลตรงกับ `main` ใน 5 ฉากของ `camera-low-v01`, test/typecheck/build/lifecycle ผ่าน, bench ก่อน/หลัง · ข้อเท็จจริง: ของกระจายเป็น InstancedMesh ต่อชิ้นส่วน (bounding sphere คลุมทั้งแผนที่), landmark ใช้ `makeProp` ทีละชิ้น, ต้นไม้ castShadow
- สาย 2 PM: TERRAVIA (ข้อ 1) + ข้อความส่งทีม A (ข้อ 2)
**ของค้างในเครื่อง (container เดิม):** worktree `/home/user/cam`, `/home/user/trial-merge`, `/home/user/pages-deploy` · branch ที่ merge แล้ว `lane/auto|camera|hud-skin|skill-row` (ลบ remote ต้องให้เจ้าของยืนยัน) · เขียนขั้นแพ็ก Pages ลง skill `synes-pm` (ทำมือ 3 ครั้งแล้ว)
**บีบอัด 450k:** เซสชันนี้ยังใช้ค่า model-default (784k) เจ้าของยังไม่ได้ตั้ง `CLAUDE_CODE_AUTO_COMPACT_WINDOW=450000`

## กล้องต่ำ + Auto + แถวสกิล · 2026-11-21 · 🟡 MAIN · Synes Online · รอบ 2-B (ต่อ)
**คำสั่งเจ้าของ:** "ตีไวเกินไปและอยากให้มุมกล้องแบบนี้ตลอด และเพิ่มระบบโจมตีอัตโนมัติ" (ภาพ DES-003 + ภาพ Auto เกมอื่นภาพเดิมของ REQ-001) · "ปรับจุดวางสกิลตามนี้" (ภาพแนวคิด TERRAVIA ข้อ 3) · "ให้เอเจ้นตรวจดูระบบของ Terravia"
**ทำแล้ว (merge เข้า `main`):**
- กล้องต่ำตลอดในแนวนอน (`lane/camera` → `e4e59e1`) + ตัดวัตถุที่ลึกเกินหมอก (ภาพไม่เปลี่ยน) · `docs/qa/camera-low-v01/`
- Auto ตาม DES-001 §4 (`lane/auto`, sonnet subagent → `6edb182`): `shared/sim/auto.ts`, input log v2 (`[0,0,2,0]` header + คำสั่ง `[0,1,a,b]`, log ที่ไม่ใช้ Auto ยังเป็น v1), server ตรวจ v2, HUD AUTO + เฟือง มุมซ้ายล่าง, แผงตั้งค่า (หยุดเกมตอนเปิด), ฟาร์มออฟไลน์ "ยังไม่เปิด" · Q50–Q68 ใน `DES-001-teamB.md` · `docs/qa/auto-v01/`
- แถวสกิลล่าง (`lane/skill-row` → `c0af790`): สกิล 1–3 + อัลติเรียงแถวล่าง, หลบ/ยาแนวตั้งเหนือปุ่มโจมตี, ทุกปุ่ม ≥ 44 px · Q69–Q73 ใน `docs/qa/skill-row-v01/README.md`
**ยังไม่ทำ:** ตีไวเกินไป → `REQ-003` ส่งทีม A (ตัวเลขสมดุล) · TERRAVIA: ไม่อยู่บน GitHub ที่เข้าถึงได้, `list_computer_folders` ว่าง → รอเจ้าของแชร์โฟลเดอร์ผ่าน Remote Control หรือเลือกวิธีอื่น
**ผลทดสอบหลัง merge ทั้งหมด:** test 115/115 · typecheck ผ่าน · build ผ่าน · lifecycle 20/20 (Chromium headless) · draw calls ในทุ่งที่ 844: 48–75 → ~150 (กล้องเห็นไกล)
**Pages:** ยังเป็น `260d107` (ยังไม่มีกล้อง/Auto/แถวสกิล) รอเจ้าของสั่งอัปเดต
**ขั้นถัดไปควรใช้โมเดล:** ตรวจผลทีม A + ตรวจ TERRAVIA **Opus** · ลด draw calls (instancing ฉากนิ่ง) และแก้ตามผลตรวจ **Sonnet**

## PM ตรวจรับ `lane/prismatic-graphics` (`dd04146`) · 2026-11-21 · 🟡 MAIN · Synes Online · รอบ 2-B (ต่อ)
**อัปเดต:** เจ้าของ "อนุมัติแบบใหม่" (โมเดล 3 ชิ้น) และขอลิงก์เล่น → **merge เข้า `main` แล้ว** (`4fdc1b3`, test 62/62, typecheck, build, lifecycle 20/20) · ขึ้น GitHub Pages แล้ว (`gh-pages` `260d107`, ตรวจที่ sub-path ในเครื่อง: เล่นได้ออฟไลน์ ไม่มี 4xx นอกจาก `/api/health` ที่คาดไว้) · คำถามถึงทีม A ด้านล่างยังเปิดอยู่ ถ้าทีม A ไม่รับส่วนใด ให้แก้ทีหลังด้วย commit ใหม่ (ไม่ revert ทั้งก้อน)
**ผลก่อนอนุมัติ:** ยัง**ไม่ merge** เข้า `main` เพราะ handoff ของสายเองระบุว่าต้องรอทีม A กับเจ้าของตรวจภาพก่อน, GLB ใหม่ยังไม่ได้รับอนุมัติ (CLAUDE.md ข้อ 6) และข้อยกเว้น ADR-007 ยังไม่ได้บันทึกเป็น ADR
**ลอง merge แยก (branch ในเครื่อง `trial/prismatic-merge`):** ชนเฉพาะ `docs/HANDOFF.md` (แก้โดยเก็บทุกส่วน) ส่วน `CLAUDE.md` merge อัตโนมัติ คงกฎ 🟡 + ADR-008 + บรรทัด Opus กราฟิก
test 62/62 · typecheck ผ่าน · build ผ่าน (JS 780.8 KB / gzip 211 KB) · lifecycle 20/20 (Chromium headless, server ของ repo)
**สิ่งที่พบเพิ่ม (วัดที่ 844×390):** สายนี้เปลี่ยนผังปุ่มของ DES-001 §3 (งานของทีม A) ด้วย ไม่ได้แตะแค่แสง
- โจมตี 68→76 px · หลบ 56→48 · ยา 48→**40** · สกิล 54→49 · อัลติ 48→**43** · จอย 124→106 · ลำดับสกิล 1–3 กลับด้าน (สกิล 1 อยู่ซ้ายสุด)
- ตัวคูณจอ `--s` เปลี่ยนจาก 1 / 1.15 เป็น 0.88 / 1.25 / 1.65 / 2 · เพิ่มผังแนวตั้ง
- คูลดาวน์เปลี่ยนจากเงามืดกวาดเป็นวงแหวน lumen · สีหลอดเลือดผู้เล่นเปลี่ยนจากเขียวเป็นฟ้าเขียว, บอสไล่ชมพู-แดงเข้ม (กระทบคำถาม DES-002 Q35–Q49 บางข้อ)
- ชื่อบอส 13 px (เกณฑ์ 14) ตามที่สายรายงานไว้
- ภาพเทียบ HUD/ฉากเปิด `main` กับ trial merge ที่ 844×390: `docs/qa/prismatic-review-844.png` · ใน Chromium headless (SwiftShader) ที่ DPR 2 trial merge ยังไม่วาดฉากที่ 3.5 วินาทีหลังกดเริ่ม (จอว่าง) ส่วน `main` วาดแล้ว · ที่ 6–7 วินาทีวาดปกติ ไม่มี error · ยังไม่ทราบว่าเครื่องจริงช้าลงหรือไม่
**ส่งทีม A ตัดสิน:** ผังปุ่ม/ขนาดใหม่เทียบ DES-001 §3, ความเด่นของวงเตือนส้ม/แดงหลังเปิดบรรยากาศ, ผลึกซ้ายมืดกว่าพื้น, ชื่อบอส 13 px
**รอเจ้าของ:** ยืนยันข้อยกเว้น ADR-007 ของ DES-003/004 เพื่อบันทึก ADR · อนุมัติ GLB ใหม่ · เล่น `?start=boss` บนมือถือจริงด้วย `#debug` (เทียบ `&atmos=0`)
**คำตอบเจ้าของ (2026-11-21):** DES-003/004 เป็นงานของ**ทีม A** ("ทีมAดิ") จึง**ไม่บันทึกข้อยกเว้น ADR-007** · DES-004 ที่ Claude เขียนต้องส่งให้ Codex ตรวจ/รับรองก่อนผลิตขั้นต่อไป
**โมเดลที่เปลี่ยนใน GLB ของสาย (เทียบทีละชิ้น 30 ชิ้น):** เปลี่ยน 3 ชิ้น คือ `hero` (1,556→1,968 tris: ผมเงิน, หางผ้าม่วง+เงิน, บ่าทอง, อัญมณีที่ด้ามดาบ), `prismback` (2,582→2,542: ตัวหินเทาเข้ม, ผลึกหลังใหญ่ขึ้น, ขอบทอง, ขาเป็นเหลี่ยม, ไม่มีหญ้าบนหลัง), `crystal_pillar` (220→220: สีและหน้าตัดผลึก) อีก 27 ชิ้นเหมือนเดิมทุกไบต์ ภาพ: `docs/qa/models-old-vs-new-{hero,prismback,crystal_pillar}.png`
หมายเหตุ: PROJECT_SYNES ข้อ 2 ระบุ Wayfarer "ผ้าพันคอสี teal" ฮีโร่ใหม่ยังมีปลอกคอ teal แต่หางผ้าเป็นม่วง/เงิน ต้องให้ทีม A ยืนยัน
**ขั้นถัดไปควรใช้โมเดล:** ตรวจผลทีม A + merge **Opus** · งานกราฟิกขั้น 2–6 **Opus** (คำสั่งเจ้าของ) · โค้ดที่ไม่เปลี่ยนภาพ **Sonnet**

## Rollover → 🟡 MAIN · Synes Online · รอบ 2-B (ต่อ) · 2026-11-21
**เหตุผล:** จบงาน ADR-008 และเจ้าของสั่ง (CLAUDE.md ข้อ 5 ข/ง)
**คำสั่งใหม่ของเจ้าของ:** ขึ้นเซสชันใหม่เอง**อัตโนมัติทุกครั้ง**ไม่ต้องถาม · Synes ใช้สี 🟡 (🟢 เป็นของ TERRAVIA) แก้แล้วใน CLAUDE.md ข้อ 5–5.1, skill `synes-pm` D และ `tools/hooks/after-compact.cjs`
**วิธีสร้างเซสชันครั้งนี้:** แชตโปรเจคเดิมไม่มี `create_session` จึงใช้ scheduled task แบบครั้งเดียว (ดู CLAUDE.md ข้อ 5 ขั้น 3)
**เซสชันเดิม:** `session_01A1roa5V1LencXdcrbPpfsW` (แชตในโปรเจค claude.ai "Synes") ปิดได้เฉพาะถ้ามีแท็ก `project-synes`
**งานของเซสชันใหม่:** ดูส่วน "ระบบเรียนรู้ต่อเนื่อง ADR-008" ด้านล่าง (รอเจ้าของ 4 เรื่อง) และงานค้างเดิม: รอทีม A ตอบ Q1–Q49 (DES-001/002) · ห้ามเริ่ม Auto Attack จนสกิลผ่านตรวจ

## ระบบเรียนรู้ต่อเนื่อง ADR-008 · 2026-11-21 · แชตโปรเจค Synes
**คำสั่งเจ้าของ:** "AI Continuous Learning & Workflow Optimization" (ให้ทุกฝ่ายศึกษาเทคนิคจากชุมชน แล้วนำมาใช้อย่างเป็นระบบ)
**ทำแล้ว (เอกสารอย่างเดียว ไม่แตะโค้ดเกม):**
- `docs/knowledge/AI_DEVELOPMENT_PLAYBOOK.md` (วงจร 7 ขั้น, บทบาท → ใครทำจริง, โมเดล/effort, ข้อเท็จจริงเรื่อง token, pipeline asset ที่แปลงเป็น Three.js, DevOps, ด่านลิขสิทธิ์, infra แบบศึกษาอย่างเดียว)
- `docs/knowledge/TOOL_REGISTRY.md` (สถานะ + license/ราคาที่ตรวจจากแหล่งทางการ 2026-11-21), `EXPERIMENT_RESULTS.md` (EXP-001–005 ย้อนหลัง + EXP-101–105 ที่เสนอ), `LESSONS_LEARNED.md` (L-001–L-019)
- `AGENTS.md` ใหม่ (สำหรับ Codex/ทีม A), CLAUDE.md ข้อ 1.5 + ข้อ 7, ADR-008, OWNERSHIP 2 แถว, PROJECT_SYNES ข้อ 3/5/7, skill `synes-pm` (อ่านบทเรียนต้นรอบ/เขียนท้ายรอบ)
**ผลทดสอบ:** `npm test` 62/62 (ไม่มีโค้ดเปลี่ยน) · typecheck ผ่าน
**พบระหว่างตรวจ:** merge `b5d20dc` (DES-002 HUD skin) ยังไม่มีส่วน handoff ของตัวเองในไฟล์นี้ รายละเอียดอยู่ใน `docs/design/DES-002-teamB.md`
**รอเจ้าของ:** asset สำเร็จรูป CC0 ใช้ได้แค่ไหน · EXP-102 (Tripo แบบเสียเงิน หรือรุ่น GPU) · EXP-101 ลดขนาดไฟล์ที่โหลดทุกเซสชัน · EXP-103 ติดตั้ง meshopt
**ขั้นถัดไปควรใช้โมเดล:** ตัดสิน/วางแผนการทดลอง **Opus** · ลงมือ EXP-101/103/105 **Sonnet**

## สาย 🔵 lane/prismatic-graphics: DES-003 ต้นแบบ + DES-004 ขั้น 1 · 2026-11-21 · Claude Code Opus 5.5 (เครื่องเจ้าของ, Windows)
**ที่มา:** เซสชันเดิม `d1e1b0df-…` ชน max turns ระหว่างทำแสง/บรรยากาศ เซสชันนี้รับช่วงงานที่ยังไม่ได้ commit มาตรวจ ทดสอบ แล้ว commit และ push branch นี้ **ไม่ได้ merge `main`** (PM เป็นคน merge ตาม CLAUDE.md ข้อ 4)
**base:** `b5d20dc` แต่ `origin/main` ไปถึง `a8c9abb` แล้ว (มี 2 commit ใหม่: ADR-008, กฎ label 🟡) ทั้งสอง commit แก้ `CLAUDE.md` ส่วน branch นี้ก็แก้ `CLAUDE.md` 1 บรรทัด (ห้ามใช้ Sonnet ทำกราฟิก) **PM ต้องตรวจ conflict ตอน merge**
**ขอบเขตไฟล์ที่แตะ:**
- กล้อง/ฉาก/แสง (render อย่างเดียว ไม่แตะ sim): `src/render/view.ts`, `src/render/arena.ts` (ใหม่), `src/render/atmosphere.ts` (ใหม่), `src/render/quality.ts` (เพิ่ม `glow`/`rays`), `src/render/fx.ts` (shader วงเตือนแบบขอบบาง ตาม DES-003), `src/study.ts` (ปิดบรรยากาศในหน้าโทน)
- HUD: `index.html` (ไอคอน SVG ปุ่มโจมตี/หลบ/ยา, เลขช่องสกิล, ชื่อไทย), `src/style.css`, `src/input.ts` (รัศมีจอยตามขนาดฐาน + คืนตำแหน่งจอย)
- Blender: `tools/blender/build_kit.py` → `public/assets/models/synes_kit.glb` (579.4 KB, 15,604 tris, Blender 4.5.3)
- เอกสาร: `docs/design/DES-003-prismatic-battle.md`, `docs/design/DES-004-prismatic-graphics.md` (+§8 ความคืบหน้า), `docs/design/README.md`, `docs/ASSETS.md`, `docs/art/ASSET_CONTRACT.md`, `CLAUDE.md`, `docs/qa/des004-step1/` (report.json + ภาพ 4 ภาพ)
- เครื่องมือ: `tools/qa/atmos-shots.mjs` (ใหม่), `tools/qa/lifecycle.mjs` (ใช้ Edge ถ้าไม่มี Chromium ของ Playwright), `server/index.ts` (แก้บั๊ก Windows: server ไม่ listen เมื่อ path มีไดรฟ์/เว้นวรรค ใช้ `fileURLToPath`)
**สถานะ DES-004:** ขั้น 1 ทำเป็นต้นแบบแล้ว · ขั้น 2–4 ทำบางส่วน (จาก DES-003) · ขั้น 5–6 ยังไม่เริ่ม รายละเอียดอยู่ใน DES-004 §8 · **ยังไม่มีใครตรวจ ทั้งทีม A และเจ้าของ**
**ผลทดสอบ (รันจริงในเซสชันนี้):**
- vitest 62/62 · `tsc --noEmit` ผ่าน · `vite build` ผ่าน (bundle 780.8 KB / gzip 211 KB) · lifecycle 20/20 (Edge headless)
- `atmos-shots.mjs` (Edge headless, ไม่มี page error): draw calls ที่ 844 ก่อน→หลัง ได้แก่ low 95→96, medium 105→107, high 204→207
- จุดที่ยังไม่ผ่านหรือต้องตัดสิน: พิกเซลส้ม/แดงสดลดลงเมื่อเปิดบรรยากาศ · ผลึกซ้ายในช็อตเปิดมืดกว่าพื้น · ชื่อบอสบนจอ 844 สูง 13 px (เกณฑ์คือ 14)
- ตรวจ secrets ใน diff และไฟล์ใหม่แล้ว ไม่พบ · ไม่ commit `tools/qa/out/` (มี blender-portable อยู่) และ `node_modules`
- **Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: Edge headless เท่านั้น (ไม่ใช่การเล่นจริงแบบเวลาจริง)**
- ไม่ได้รัน `verify_kit.py` / Blender ซ้ำในเซสชันนี้ ตัวเลข GLB มาจากเซสชันเดิม
**งานยังไม่ยืนยัน:** การตีความภาพอ้างอิงของ DES-004 (ข้อยกเว้น ADR-007 ยังไม่ได้บันทึกเป็น ADR) · FPS บนเครื่องจริง · งบทดลองใน DES-004 §4 (เจ้าของยังไม่อนุมัติ) · โมเดล GLB ใหม่ยังไม่ได้รับอนุมัติให้ใช้จริง (ADR-006 ข้อ ข-2)
**ขั้นถัดไปสำหรับ PM:**
1. `git fetch && git checkout lane/prismatic-graphics` ตรวจ diff เทียบกับ `origin/main` (ระวัง `CLAUDE.md`) **ห้าม merge จนกว่าทีม A และเจ้าของตรวจภาพ** เพราะเปลี่ยนภาพที่ผู้เล่นเห็น
2. ส่ง DES-004 §8 + `docs/qa/des004-step1/` ให้ทีม A ตัดสิน 3 จุดข้างบน และบันทึกข้อยกเว้น ADR-007 ของงานนี้เป็น ADR
3. ให้เจ้าของเล่น `?start=boss` บนมือถือจริงด้วย `#debug` (เทียบกับ `&atmos=0`) และจด FPS
4. ขั้น 2–6 ใช้ **Opus 5.5** ตามคำสั่งเจ้าของ (ห้ามใช้ Sonnet ทำกราฟิก) ส่วนงานโค้ดที่ไม่เปลี่ยนภาพใช้ Sonnet ได้

## Rollover รอบ 2-B → รอบ 2-B (ต่อ) · 2026-11-20
**เหตุผล:** context ของแชตนี้ 494k เกินเกณฑ์ 450k (CLAUDE.md ข้อ 5 ก)
แชตนี้เริ่มที่ `/home/user` ไม่ใช่โฟลเดอร์ repo เลยน่าจะไม่ได้อ่าน `autoCompactWindow` จาก `.claude/settings.json` (get_session แสดง `source: model-default`, 980k) ยังไม่ยืนยันสาเหตุ
**สถานะ:** `main` push แล้ว, test 62/62, lifecycle 20/20 · ส่งคลิปให้เจ้าของแล้ว
**งานของเซสชันใหม่:**
1. **รอ** คำตอบทีม A ต่อ Q1–Q34 + ผลตรวจขั้น 1 และ **รอ** เจ้าของอนุมัติขึ้น GitHub Pages ด้วยบิลด์ต้นแบบ
   (แพ็กใหม่: `npm run build` → copy `dist` + `.nojekyll` ไปเป็น branch `gh-pages` แบบเดียวกับ `b142dfa`)
2. ได้อนุมัติแล้ว: ขึ้น Pages แล้วส่งลิงก์
   - ลิงก์ปกติ
   - `?start=boss&dodgecd=17` และ `?start=boss&dodgecd=26` บน `?seed=` เดียวกัน
   - วิธีดู FPS: ต่อท้าย `#debug`
3. **ห้ามเริ่ม Auto Attack** จนกว่าทีม A ตรวจต้นแบบสกิลผ่าน (คำสั่งเจ้าของ) · ฟาร์มออฟไลน์รอบหลัง
4. ถ้าทีม A ตอบเปลี่ยนดีไซน์ ให้ทำตาม ADR-007 (`docs/design/README.md`)

## ต้นแบบสกิล DES-001 ขั้น 1 · 2026-11-20 · 🟢 MAIN · Synes Online · รอบ 2-B
**ทำแล้ว:** sim 3 สกิล (`25faaad`) · ผังปุ่ม + อัลติล็อก (`d8de018`) · ท่า + VFX + เครื่องมืออัดคลิป (`928f12e`) · เทียบคูลดาวน์หลบบน seed เดียวกัน (`22d4cf6`, `77f4e18`)
**ผลทดสอบ:**
- test 62/62, typecheck ผ่าน, lifecycle 20/20 · log รอบ 3 เล่นซ้ำได้ผลเดิม
- VFX ซ้อนกันเพิ่ม draw calls +3 ทั้ง Medium และ Low (เพดาน +5/+3)
- คลิป `docs/qa/clips/boss-3skills-seed1.mp4`
**ผลเทียบคูลดาวน์หลบ:** บอทแยกไม่ออก · agent 2 คนเทียบกันตรง ๆ ไม่ได้ · replay ชี้ว่าโดนเพราะหลบเร็วไป ไม่ใช่ติดคูลดาวน์ (สรุปใน `docs/design/DES-001-teamB.md`)
**บิลด์ iPhone:** แพ็กไว้ที่ `tools/qa/out/pages-proto/` (ไม่อยู่ใน git, สร้างใหม่ด้วย `npm run build` แล้ว copy `dist` + `.nojekyll`) smoke test ผ่าน · **รอเจ้าของอนุมัติขึ้น GitHub Pages**
**ค้าง:** คำถาม Q1–Q34 ถึงทีม A · ขั้น 2 (iPhone เวลาจริง + FPS) · ขั้น 3 (Auto โถงมอน หลังทีม A ตรวจสกิลผ่าน)
**ขั้นถัดไปควรใช้โมเดล:** ตรวจคำตอบทีม A และตัดสินขอบเขต **Opus** · Auto และแก้ตาม feedback **Sonnet**

## รอ DES-001 + งานเตรียมระหว่างรอ · 2026-11-20
**DES-001:** เจ้าของส่งคำสั่งพร้อมไฟล์แนบ `DES-001-skills-auto.md` แต่**ไฟล์ไม่เข้ามาในเซสชัน** (ไม่มีในโฟลเดอร์อัปโหลด, repo หรือ Drive) จึงยังไม่ได้ทำสกิล
รู้จากข้อความเจ้าของแค่ชื่อสกิล Crescent Cut, Crystal Break และคูลดาวน์เทียบ 26 tick
**ทำแล้ว:**
- `c3a52f2` คูลดาวน์หลบแบบนับ tick ตรงตาม DES-001: 17 tick = 0.55 s (ค่าเดิม) และ 26 tick (เดิมที่ตั้ง 0.87 นั้นใน sim จริงเป็น 27 tick)
  ผลเทียบรอบใหม่ใน `docs/qa/dodge-cd-compare.md` (บอทแยก 2 ค่าไม่ออก)
- เล่นทั้ง 2 ค่าบน seed เดียวกันได้ด้วย `?offline&seed=N&start=boss&dodgecd=17|26` (ตรวจในเบราว์เซอร์แล้ว)
- `11df2a5` vitest ไม่นับเทสต์ใน worktree ของ agent
- merge `lane/baseline-2b`: ภาพ 15 ภาพ (5 ฉาก × 3 ระดับ) + draw calls/tris/texture/ขนาดดาวน์โหลด ใน `docs/qa/baseline-2b.md` สำหรับส่งให้ทีม A (ไม่มีข้อเสนอดีไซน์)
  ตัวเลขเด่น: ลานบอส draw calls 89/95/170 (low/medium/high), มี texture แค่ 2 อัน (พื้นที่วาดด้วย canvas และเงา) ที่เหลือเป็นสีล้วน
**ผลทดสอบ:** test 29/29, typecheck ผ่าน, lifecycle 20/20, replay รอบ 3 ได้ผลเหมือนเดิม

## งานเทคนิครอบ 2-B (ไม่มีดีไซน์) · 2026-11-20
**ทำแล้ว (merge `lane/2b-tech` → `53f7b33`):**
- ปุ่ม input สำรองสำหรับสกิล 2, สกิล 3 และอัลติ (sim ยังไม่ใช้)
- run variant ที่ server ตรวจและจำลองซ้ำได้: `?dodgecd=0.87`, `?start=boss`
- ตัวเทียบคูลดาวน์หลบ `tools/qa/dodge-cd-compare.ts` → `docs/qa/dodge-cd-compare.md`
- ชุดทดสอบอัดวิดีโอได้ (`VIDEO=1`, `/stop`)
**ผลทดสอบ:** test 27/27, typecheck ผ่าน, lifecycle 20/20, replay รอบ 3 ได้ผลเหมือนเดิม, `?start=boss&dodgecd=0.87` ในเบราว์เซอร์ใช้ได้ (server ตอบ variant, ค่านอก whitelist ได้ 422)
**ผลเทียบ (บอท ไม่ใช่คน):** 0.55 กับ 0.87 ชนะ 100% ทั้งคู่ ดาเมจใกล้กัน และกดหลบแล้วติดคูลดาวน์ ~0 ครั้งต่อรอบ
ท่าบอสที่ทับตัวผู้เล่นห่างกันอย่างน้อย 1.97 s → บอทแยก 2 ค่านี้ไม่ออก ต้องให้คนเล่นจริงตัดสิน
**ยังค้าง:** เนื้อหา DES-001 (สกิล 2 อันใหม่, อัลติ, ผังปุ่ม) · อนุมัติอัปเดต GitHub Pages ด้วยบิลด์ต้นแบบ

## กฎเหล็ก ADR-007 + คำสั่งรอบ 2-B ใหม่ · 2026-11-20
**คำสั่งเจ้าของ:**
1. สกิลใช้งาน 3 + อัลติช่องแยกที่ล็อกไว้
2. หลอดเลือดมอนสเตอร์ → เจ้าของตัดสินภายหลังว่า **ใช้ของเดิม** (ขึ้นเมื่อโดนตี)
3. iPhone เล่นผ่าน GitHub Pages ได้แล้ว + ภาพเรฟระบบโจมตีอัตโนมัติ
**กฎเหล็ก ADR-007:** งานออกแบบทุกประเภทให้ GPT Codex (ทีม A) ออกแบบหรือเขียนบรีฟก่อน → Claude (ทีม B) ทำ ทดสอบ แล้วส่งผลกลับ เปลี่ยนดีไซน์ระหว่างทำต้องส่งกลับก่อน
บันทึกไว้ที่ CLAUDE.md ข้อ 0 (+ข้อ 5.2, 6), `docs/DECISIONS.md` ADR-007, `docs/ASSET_PIPELINE.md`, `docs/design/README.md`, `docs/OWNERSHIP.md`, `docs/handoff/README.md`, `.claude/skills/synes-pm/SKILL.md` และ `.claude/agents/project-synes.md`
**ทำแล้ว:** ใบขอออกแบบ `docs/design/REQ-001-skills-auto.md` และ `REQ-002-review-pre-adr007.md` · บรีฟ 4 ใบของ Claude + แผน 2-B ติดป้าย "รอทีม A ทบทวน"
ภาพเรฟเป็นภาพจากเกมอื่น **ไม่ได้เก็บใน repo** (Public) บันทึกเป็นตารางฟังก์ชันใน REQ-001 แทน
**งานค้าง:** รอ DES จากทีม A ก่อนเริ่มเขียนโค้ดสกิล/ระบบอัตโนมัติ ส่วนงานเทคนิคที่ไม่เปลี่ยนสิ่งที่ผู้เล่นเห็น (เช่น ขยายรูปแบบ input ให้รองรับปุ่มเพิ่ม) ทำได้หลังรู้จำนวนปุ่มจาก DES
**ขั้นถัดไปควรใช้โมเดล:** อ่าน/ตรวจ DES และแบ่งงาน **Opus** · เขียนโค้ดตาม DES **Sonnet**

## GitHub Pages สำหรับทดสอบ iPhone · 2026-11-20
**เหตุผล:** หน้า Artifact ของ claude.ai ขึ้น "This browser isn't supported · Update iOS" ทั้งในแอป Claude และ Safari บน iPhone ของเจ้าของ
**ทำแล้ว:** เจ้าของอนุมัติ GitHub Pages **เฉพาะบิลด์ทดสอบ Version 4** · branch `gh-pages` (`b142dfa`) ใช้ไฟล์ JS/โมเดลที่ดาวน์โหลดจาก Artifact V4 ตรง ๆ (ยืนยันแล้วว่าโค้ดเหมือน `main` ทุกอย่างยกเว้น build-id)
**ผลทดสอบ:** smoke test ในเครื่อง ผ่าน (โหลดโมเดลได้, ออฟไลน์, ไม่มี error นอกจาก 404 ของ `./api/health` ที่คาดไว้) · GitHub "pages build and deployment" success · **container เปิด github.io ไม่ได้ (proxy ปฏิเสธ) จึงยังไม่ได้ยืนยันหน้าเว็บจริงจากที่นี่**
**ลิงก์:** https://thanaponzxz-gif.github.io/Synes-Online/ และ https://thanaponzxz-gif.github.io/Synes-Online/#debug

## เพลย์เทสต์รอบ 3 + แผน 2-B · 2026-11-20 · 🟢 MAIN · Synes Online · รอบ 2-B
**ทำแล้ว:** ปิดแชตเก่า (⚪ OLD · Synes · รอบ 2, archive), เพลย์เทสต์ agent รอบ 3 (Sonnet), PM ตรวจซ้ำด้วยภาพ + `diag.jsonl` + replay (seed 916771634)
**แก้ (`3389f98`):** ปุ่ม/จอยโปร่ง 35% เมื่อมีวงเตือน/บอส/เสาอยู่ใต้ (`src/ui/buttonFade.ts`), `CONE_INNER_R` ใช้ร่วม sim + shader, ชุดทดสอบส่งปุ่มตรง tick (เดิมช้า 0.57–1.07 s) และปล่อยนิ้วถูกจุด
**ผลทดสอบ:** `npm test` 19/19, typecheck ผ่าน, lifecycle 20/20, replay ของรอบ 3 ได้ผลเหมือนเดิมทุกค่า (sim ไม่เปลี่ยน)
**ยังไม่ได้ทดสอบ:** ปุ่มโปร่งกับท่าพุ่ง/เสาจริงในเกม (ทดสอบด้วยวงที่ฉีดเข้าไปเท่านั้น), Android / iPhone / PC จริง
**Artifact เกม:** Version 4 ที่ลิงก์เดิม
**งานค้าง:** รอเจ้าของอนุมัติแผน `docs/team/round-2B-plan.md` แล้วทำข้อ 2–3 ("หลบเร็วไป", นำภาพราคาถูกเข้าแบบปิดไว้) ซึ่งไม่ต้องรออนุมัติ
**ขั้นถัดไปควรใช้โมเดล:** โค้ดข้อ 2–3 **Sonnet** · ตรวจภาพเทียบ/ตัดสินงบประสิทธิภาพ **Opus**

## Rollover รอบ 2 → รอบ 2-B · 2026-11-20
**เหตุผล:** จบรอบ 2-A และเจ้าของสั่ง (CLAUDE.md ข้อ 5 ข/ง)
**มติเจ้าของ:** ข-1 ใช้ Three.js ต่อ · ข-2 โมเดลจากสคริปต์ Blender นับเป็นงาน Blender (โมเดลใหม่ต้องมีใบสั่งงาน + ภาพเทียบในเกมให้อนุมัติ, ชุดเดิมเป็น placeholder) · ข-3 คงสิทธิ์ push ส่วนการเปิด Share สาธารณะและโฮสต์ต้องอนุมัติแยก
**งานแรกของเซสชันใหม่ (ก่อนเริ่มรอบ 2-B):** เพลย์เทสต์บิลด์ล่าสุด (skill `synes-playtest`, ใช้ subagent `model: sonnet`) แล้วตรวจ 3 อย่าง
1. บอสยังเห็นชัดเมื่ออยู่ด้านล่างของจอ
2. แถบพุ่งตรงกับจุดที่โดนจริง
3. ปุ่มขวาล่างบังบอสหรือเสาในจังหวะสำคัญไหม
ถ้าฉากหายอีก ให้เก็บภาพ + seed + input log + render error (harness เขียน `run.json` ตอนเรียก `/log`) แล้วระบุสถานะบั๊กตามหลักฐานจริงเท่านั้น
**เจ้าของจะทำ:** เล่นบิลด์ล่าสุดบน iPhone ด้วย `#debug` และส่ง prompt `ui_potion_v01` ให้ GPT Image (งานภาพเริ่มจากชิ้นนี้ชิ้นเดียว)
**ขั้นถัดไปควรใช้โมเดล:** เพลย์เทสต์/แก้บั๊ก **Sonnet** · วางแผนรอบ 2-B และเขียน brief **Opus**

## รอบ 2-A (ความชัด) · 2026-11-20 · 🟢 MAIN · Synes Online · รอบ 2
**ทำแล้ว:** วงเตือนวาดทับทุกอย่าง, บอส/เสา/ประตูที่บังจางลง + วงใต้เท้าผู้เล่น, phase 2 มีจังหวะ 2 ท่า → ฝนผลึก → พุ่งชน (เตือน 1.35 s) และเสางอกใหม่,
คำแนะนำขึ้นทีละอันตามสถานการณ์ใต้แถบ HP, ไอคอนขวดยา (placeholder), ศัพท์สำหรับผู้เล่น, ตัวเลขดาเมจมีขอบเข้ม, เกณฑ์อันดับในหน้าผลจบ, กล้องตามบอสที่อยู่ใต้ผู้เล่น, ขอบลานบอส,
ความกว้างจริงของท่าพุ่งเท่ากับแถบที่วาด และบันทึก render-error (ADR-005)
**ผลทดสอบ:** `npm test` 19/19, typecheck ผ่าน, lifecycle 20/20, เพลย์เทสต์ agent รอบ 2 ได้ ชัด 6 (รอบ 1 ได้ 5) ส่วนการแก้หลังเพลย์เทสต์ยังไม่ได้เพลย์เทสต์ซ้ำ
**Asset pipeline:** รับกฎ Hybrid Asset Pipeline v1 (ADR-006, `docs/ASSET_PIPELINE.md`) มีใบสั่งงานนำร่อง `docs/handoff/ui_potion_v01.md` (DRAFT) และมี 3 ข้อที่รอเจ้าของตัดสิน
**Artifact เกม:** อัปเดตแล้วที่ลิงก์เดิม (Version 3)
**งานค้าง:** เพลย์เทสต์ซ้ำ, หาสาเหตุฉากหาย, ของใต้ปุ่มขวาล่าง แล้วต่อด้วยรอบ 2-B (ความสวยราคาถูก) ซึ่งต้องทำตามกฎ asset ใหม่
**ขั้นถัดไปควรใช้โมเดล:** เพลย์เทสต์และแก้ UI ใช้ **Sonnet** ส่วนการตัดสิน 3 ข้อของ pipeline และ brief ของรอบ 2-B ใช้ **Opus**

## Rollover รอบ 1–2 → รอบ 2 · 2026-11-20
**เหตุผล:** แชตหลักใช้ไป ~535k token ซึ่งเกินเกณฑ์ 450k (CLAUDE.md ข้อ 5)
**สถานะ:** `main` push แล้วที่ https://github.com/thanaponzxz-gif/Synes-Online, test 16/16, lifecycle 20/20 (ผลเดิม ยังไม่ได้รันซ้ำหลังเพิ่มไฟล์ governance)
**สิ่งที่ทำหลัง handoff รอบ 1:**
- เพลย์เทสต์ agent รอบ 1 (`docs/qa/playtest-agent-round1.md`) และชุดควบคุม (`tools/qa/playtest-harness.mjs`)
- ต้นแบบปรับภาพบน branch `art/visual-pass-poc` (ยังไม่ merge)
- มติทีม (`docs/team/2026-11-20-review.md`) ให้ทำความชัดก่อน
- ตั้งกฎโปรเจค (CLAUDE.md, PROJECT_SYNES.md, agent `project-synes`, skills `synes-pm`/`synes-playtest`), บีบอัดที่ 450k + hook หลังบีบอัด และสคริปต์ Windows Remote Control
**งานถัดไปของเซสชันใหม่:** รอบ 2-A (backlog ข้อ 1–3) แล้วเพลย์เทสต์ซ้ำเพื่อเทียบคะแนนความชัด (รอบ 1 ได้ 5/10)
**หมายเหตุสำหรับเซสชันใหม่:**
- ต้องรัน `npm ci` ก่อน (node_modules ไม่อยู่ใน repo)
- Blender ใช้ได้หลัง `uv venv tools/blender/.venv && uv pip install --python tools/blender/.venv/bin/python bpy==5.3.0`
- จะอัปเดต Artifact เดิมต้องส่ง `url` ของ artifact นั้นและ `read` ก่อน (ลิงก์อยู่ใน PROJECT_SYNES.md)

## รอบที่ 1 · 2026-11-19
**commit ล่าสุด:** ดู `git log --oneline` บน `main` (merge `art/blender-kit` ที่ f07a730)
**สายงานที่ทำในรอบนี้:** gameplay/engine, UI/UX, web perf/QA (เซสชันหลัก บน `main`) และ art/Blender (agent แยก บน worktree `art/blender-kit` แล้ว merge เข้า `main`)

### สิ่งที่ทำเสร็จ
- ตรวจพื้นที่ทำงาน: ไม่มี repo ของ Synes Online มาก่อน, บัญชีมองไม่เห็น repo ใดเลย (รวมถึง TERRAVIA) และ GH_TOKEN ใช้ไม่ได้
  จึงสร้าง repo ใหม่ที่ `/home/user/synes-online` (local git, branch `main`, **ยังไม่มี remote**)
- Technical spike PlayCanvas เทียบ Three.js แล้วเลือก Three.js (ADR-001, `docs/spike-results.md`)
- Simulation แบบ deterministic + server ที่ตัดสินผลโดยจำลองจาก input ซ้ำ (ADR-002)
- Vertical slice "ทุ่งน้ำค้างแสง" เล่นได้ครบ: ค่ายพัก → เส้นทางสอนหลบ → ลานโล่งที่ยากขึ้น → บ่อแสง → บอสปริซึมแบ็ก (2 เฟส) → ผลจบ/รางวัลที่ server ตรวจ
- UI ภาษาไทยแนวนอน: จอยสติ๊กลอย, ปุ่ม 4 ปุ่ม, คำแนะนำตามสถานการณ์, หน้าจอแพ้ที่บอกสาเหตุและเคล็ดลับ
- ระบบคุณภาพภาพ 3 ระดับ + adaptive resolution, หยุดเกมเมื่อสลับแอป, รองรับสัญญาณหลุดและ WebGL context loss
- โมเดลต้นฉบับจากสคริปต์ Blender headless (`tools/blender/`) และภาพโทน 10 แบบที่เรนเดอร์จากเอนจินจริง
- ลิงก์ทดลองเล่น (claude.ai Artifact เป็นส่วนตัว ต้องกด Share ก่อนส่งให้คนอื่น):
  - เกม: https://claude.ai/artifact/5jsDtTKaLN22JGykznhNnA (โหมดออฟไลน์ เพราะโฮสต์แบบ static ไม่มี server)
  - เทียบเอนจิน: https://claude.ai/artifact/8jRQgx5Rp3jNVFznHGkSZ8
  - แกลเลอรีโทนภาพ 10 แบบ: https://claude.ai/artifact/B512M87CqpnicvUrNCrCvT
  - โฮสต์ Artifact ไม่รับ `.glb` build สำหรับ Artifact จึงใช้โมเดลแบบ glTF JSON ฝังข้อมูล (`synes_kit.json` 699 KB) แทน

### ผลทดสอบ
- `npm test` ผ่าน 16/16 รายการ และ `node tools/qa/lifecycle.mjs` ผ่าน 20/20 รายการทั้งก่อนและหลัง merge โมเดล (รายละเอียดใน `docs/qa/round-1.md`)
- โมเดล Blender: รัน `verify_kit.py` ซ้ำเองแล้ว ผ่าน 293 ข้อ, 15,232 tris, 537.6 KB และ hash ตรงกับรายงานของ agent
- **ยังไม่ได้ทดสอบบน Android, iPhone หรือเบราว์เซอร์ในแอปแชตของจริง** ตัวเลขทั้งหมดมาจาก Chromium จำลองที่ใช้ GPU แบบซอฟต์แวร์
- ยังไม่ได้เปิดลิงก์ Artifact ใน viewer ของ claude.ai เพื่อยืนยันว่าเกมรันได้ เพราะ container เปิดหน้า claude.ai ที่ต้องล็อกอินไม่ได้
  ส่วนรูปแบบไฟล์ทดสอบแล้วในเบราว์เซอร์ local

### งานค้าง / ความเสี่ยง
1. **ไม่มี remote git:** ถ้า container ถูกเก็บคืน งานจะหายทั้งหมด เจ้าของต้องสร้าง GitHub repo (เช่น `synes-online`) แล้วเปิดสิทธิ์ให้ Claude ก่อน จึงจะ push ได้
2. **ลิงก์สาธารณะที่มี server ตรวจผล:** ต้องมีโฮสต์ (static CDN + Node server) ซึ่งต้องใช้บัญชีของเจ้าของ
3. ความยากปรับจากบอทเท่านั้น ต้องให้คนเล่นจริง
4. draw calls ~81 (เป้าต่ำกว่า 40) เพราะตัวละครแยกชิ้นเพื่อทำแอนิเมชัน ส่วน triangle ในฉากอยู่ที่ 30k (tier low) ถึง 49k (tier medium)
   ขนาดดาวน์โหลดขึ้นกับว่าโฮสต์บีบอัด GLB ให้หรือไม่ (192 KB ถ้าบีบอัด, 538 KB ถ้าไม่) และ meshopt คืองานรอบถัดไป
5. ยังไม่มี "ร่วมมือ" (co-op) และ "พัฒนาตัวละคร" (EXP/อุปกรณ์ถาวร) ในวงจรเล่น
6. iOS Safari: fullscreen และการล็อกแนวจอใช้ไม่ได้ จึงใช้ข้อความให้หมุนจอแทน ต้องตรวจบนเครื่องจริง

### งานถัดไป (เรียงตามลำดับ)
1. **เจ้าของ:** เปิดลิงก์เกมบนมือถือจริง (Android/iPhone/LINE) ใส่ `#debug` ต่อท้ายลิงก์เพื่อดู FPS แล้วเปิดหน้าเทียบเอนจินและจดผลลง ADR-001
2. **เจ้าของ:** เลือกโทนภาพจากหน้าแกลเลอรี และสร้าง GitHub repo + โฮสต์
3. Gameplay: เล่นทดสอบกับคน 5 คนแล้วปรับ `shared/data/tuning.ts`, เพิ่มระบบเลเวลและอุปกรณ์ที่ server บันทึก (guest id → DB)
4. Online: ย้าย sim ไปรันบน server แบบ real-time (WebSocket) เพื่อทำ co-op 2–4 คนในลานบอส
5. Art: ทำตามโทนที่เลือก, เพิ่ม toon ramp/outline เฉพาะตัวละคร และ rig แอนิเมชันพื้นฐาน
6. Perf: รวม mesh ของตัวละครและพร็อพเดี่ยว, ทำ LOD และทดสอบบนเครื่องจริง 3 ระดับ
7. PWA/ปุ่มเพิ่มลงหน้าจอหลัก ทำหลังจากยืนยันว่าการเล่นจากลิงก์ใช้ได้แล้ว

### วิธีเริ่มเซสชันถัดไป
```bash
cd /home/user/synes-online && git status && git log --oneline -10
npm install && npm test && npm run build && npm run server
```
อ่าน `docs/OWNERSHIP.md` ก่อนแก้ไฟล์ของสายงานอื่น
