# Master Handoff รอบ 2-F · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-F (`session_01A1roa4D5M2pZxQPQegFexE`)
เอกสารนี้เขียนไว้ให้ PM คนถัดไปทำงานต่อได้ทันที ไม่ว่าจะเปิดเซสชันใหม่ด้วย rollover อัตโนมัติครั้งสุดท้าย หรือเจ้าของเปิดเองจาก claude.ai
**Checkpoint:** commit `69299a1` บน `origin/art/env-polish` (commit ที่เพิ่มไฟล์นี้ · push tag ถูกระบบปฏิเสธ 403 จึงไม่มี tag)

## 1. lineage ของเซสชัน (ข้อเท็จจริงจาก `get_session`)
- เซสชัน 2-F depth **7 / limit 8** · **ใช้ rollover อัตโนมัติครั้งสุดท้ายแล้ว** (2026-11-25 หลังการบีบอัด, ไม่มี agent ค้าง) → รอบ 2-G = **8/8 สร้างเซสชันลูกต่อไม่ได้**
- เซสชัน 2-G: ทำงานผ่าน subagent ในเซสชันเดียว · เมื่อเกิดการบีบอัดหรือ context ใกล้ 450k ให้ checkpoint + อัปเดตไฟล์นี้ แล้วขอเจ้าของเปิดเซสชันใหม่เอง
- เมื่อถึง 8/8 หรือ rollover ไม่ได้: **เจ้าของเปิดเซสชันใหม่เองจาก claude.ai/code** (repo `thanaponzxz-gif/Synes-Online`, branch `art/env-polish`) แล้ววางพรอมป์ต์ในข้อ 8 · lineage ของเซสชันที่เปิดเองน่าจะเริ่มนับใหม่ (**ยังไม่ทราบแน่ชัด** ให้ตรวจด้วย `get_session` ในเซสชันใหม่)
- เซสชัน 2-F ถูกบีบอัดแล้วหลังเขียนแผน Claude-First · โควตา 5 ชั่วโมง allowed (ตอนเขียน) · รายสัปดาห์ไม่ทราบ

## 2. สถานะ repo (ข้อเท็จจริง)
| ที่ | SHA / สถานะ |
|---|---|
| `main` | `b46ca7f` (stage1 + combat-2) · ไม่แตะในรอบ 2-E/2-F |
| `gh-pages` | `1aa6088` (บิลด์ `b46ca7f`) · ห้ามอัปเดตโดยไม่ถามเจ้าของ |
| `art/env-polish` (branch งาน) | checkpoint `69299a1` (+ commit แก้เอกสารเล็กน้อยหลังจากนั้น) · ฐานโค้ด = `24f56b4` (Env v01 Golden Reference) · เอกสาร 2-E/2-F อยู่บนนี้ |
| `baseline/env-v01` | `8b4f602` |
| `lane/env-assets` | สาย SUB env-assets (`session_01A1roa4B7XoiVyVoHkVStEs`) · สถานะเซสชันไม่ได้ตรวจในรอบนี้ |
| เฉพาะบน PC ของเจ้าของ (ไม่อยู่บน remote) | `839c9c0` (`lane/codex-r5`, pilot R5 fix2) · `69301b5` (`lane/codex-c2`, C-2) · `art/env-r5-pilot` (**ไม่อนุมัติ push**) |
| ทดสอบล่าสุดบน `art/env-polish` | vitest 155/155, typecheck ผ่าน (2-F) · build + lifecycle 20/20 (2-E) · Android/iPhone **ยังไม่ได้ทดสอบ** |

## 3. กฎและการอนุมัติที่มีผลอยู่
- **ห้าม:** merge `main` · ขึ้น Pages · push งาน pilot (`839c9c0`, `env_library_v01.glb`, ภาพ pilot) · ติดตั้งเครื่องมือใหม่ (รวม meshopt/gltfpack) · ใส่ไฟล์ Hero/third-party ใน repo Public (`.gitignore` กันไว้) · ขอเชื่อมเครื่องเจ้าของซ้ำ (เจ้าของปฏิเสธแล้ว)
- **พัก:** C-7 (จน C-4 ผ่าน QA) · KTX2 · C-9 (KPI-001 คงเป็น Known Issue, เพดาน 56/60 คงเดิม) · C-8 · D-1…D-5 · C-3/PERF/SEC รออนุมัติตามแผน Claude-First
- **ADR-011 Claude-First:** Claude = Engineering หลัก (~65%) · Codex = Technical Production (~35%) · ทีม A คุมดีไซน์ · **ห้ามทำงานซ้ำกับ Codex: ถามสถานะด้วยพรอมป์ต์ P1 ก่อนย้ายงาน** · ห้ามผลิต asset ก่อนแบบอนุมัติ
- **อนุมัติแล้ว:** แผน C-4 · ทางแก้ TD-2 ของ C-1 (ล้าง pull ในแนวตั้ง) แต่ C-1 ยังพักจนเจ้าของสั่งเลิกพัก
- **ช่องทางรับงาน Codex:** `format-patch` → เจ้าของแนบในแชต MAIN → ตรวจ SHA256 + อ่านโค้ด → apply บนฐาน `839c9c0` ที่สร้างบนคลาวด์ → `webgl2-probe` → ชุดเต็ม → QA อิสระ (agent ที่ไม่ได้เขียน) → PM ตัดสิน → เจ้าของอนุมัติ · **ไม่มีการ push**
- ทีม A เป็น Design Authority · ทุกการเปลี่ยนสิ่งที่ผู้เล่นเห็นต้องผ่านทีม A

## 4. รายการตัดสินที่ค้าง
**ใช้รายการ A1–A11 ใน `docs/team/2026-11-25-claude-first-allocation.md` ข้อ 3** (แทน D2–D5, D8 ของ dispatch ที่ให้ Codex ทำ) · D0 (แนบ F1/F2), D1 (รับ C-2), D6 (แพ็ก REQ ทีม A), D7 (meshopt ยังไม่อนุมัติ) ยังใช้ตาม `dispatch-2F.md` ข้อ 2

## 5. คิวงานและพรอมป์ต์
**ตามแผน Claude-First (เมื่ออนุมัติ):** ระลอก 0 สร้างฐาน + QA งาน Codex ที่ส่งแล้ว → 1 C-6 · SEC · C-5 → 2 Fable วิเคราะห์ C-2b · C-1 → 3 C-2b · C-4 · PERF-1/3/4 → 4 Integration ชุด pilot · PERF-2 · (C-3/EXP-103 ถ้าอนุมัติ) · C-7 หลัง C-4 ผ่าน · Codex: ผลิต asset R5.2/K2 หลังแบบทีม A อนุมัติ
| เอกสาร | ใช้ทำอะไร |
|---|---|
| `docs/team/2026-11-25-claude-first-allocation.md` | **แผนปัจจุบัน**: ตารางจัดสรร, A1–A11, โมเดล/ที่ทำงาน/port ต่องาน, พรอมป์ต์ P1–P5 + กล่อง SEC/PERF, ไฟล์ F1–F6, ระลอก |
| `docs/team/2026-11-25-dispatch-2F.md` | กล่องงาน + เกณฑ์ (C-6, C-5, C-1 v2, C-2b) ที่ Claude ใช้ผ่านพรอมป์ต์ P4, ข้อความทีม A (5.6), พรอมป์ต์ QA คลาวด์ (ข้อ 6), แผน meshopt (ข้อ 8) |
| `docs/team/2026-11-25-pm-accept-c2.md` | คำตัดสินรับ C-2 + Minor F1/F2/F3 ที่ยังเปิด |
| `docs/team/2026-11-25-pm-owner-review-pack.md` | ข้อมูลประกอบ (เหตุผล C-2b, C-1 v2 แก้ blocker อย่างไร, อันดับงาน, meshopt/KTX2, ไฟล์ที่ต้องแนบ) |
| `docs/team/2026-11-25-morning-brief.md` | สรุปงานกลางคืน 2-E |
| `docs/team/2026-11-25-codex-work-packages.md` | ต้นฉบับชุดงาน Codex (C-4 อยู่ใน `2026-11-25-pm-c2-qa-and-c4-plan.md` ข้อ 4) |
| `docs/qa/c2-v01/QA_C2.md`, `docs/qa/c1-prep/README.md` | QA ของ C-2 · ขั้นตอน QA ของ C-1 |
| `docs/design/PENDING_QUEUE.md`, `docs/design/README.md` | งานที่รอทีม A |

## 6. ของที่หายเมื่อ container ถูกคืน และวิธีสร้างใหม่
| ของ | สร้างใหม่จาก |
|---|---|
| ฐาน QA `839c9c0` บนคลาวด์ | `24f56b4` + `fix2_code.patch` (SHA `8E37A1B7D8ADCC809C6C6AFD5D2DE81B6AED31FA16F38A5587A511C377D10654`) · `git apply --ignore-whitespace --binary` · ขั้นตอนใน dispatch ข้อ 6 |
| ภาพ baseline 100 ภาพของ C-1 | `docs/qa/c1-prep/README.md` (รัน stage1-shots บนฐาน) |
| ต้นฉบับ `hud_gate*.mjs` สำหรับตรวจ C-4 | zip `SYNES_Handoff_v05c_r5_fix2.zip` (SHA ขึ้นต้น `84119AC4…`) ที่เจ้าของต้องแนบใหม่ |
| สคริปต์ QA อิสระของ C-2 (`c2-indep.mjs` ฯลฯ) | ไม่มีสำเนา · QA agent ของ C-2b เขียนใหม่ตามคำอธิบายใน `QA_C2.md` |
| zip แพ็กทีม A | `git show 927464a:<path>` ของ REQ-004, REQ-005, ART_INTEGRATION_READINESS, audit + จดหมายนำใน dispatch ข้อ 5.6 · SHA zip ที่ส่งเจ้าของ `6de10b5c…7e96` |

## 7. สิ่งที่ยังไม่ทราบ
FPS/ความร้อน/หน่วยความจำบนมือถือจริง · การหมุนจอจริง · สาเหตุ WebGL2 บน PC · ผล F2/C-2b บนมือถือ · ขนาดที่ meshopt ลดได้จริงหลัง gzip · path ของ zip v05c บน PC · lineage ของเซสชันที่เปิดเอง · โควตารายสัปดาห์ของ Claude และโควตา Codex

## 8. พรอมป์ต์เริ่มเซสชัน MAIN ใหม่ (ให้เจ้าของวาง เมื่อเปิดเองจาก claude.ai · rollover อัตโนมัติก็ใช้ข้อความนี้)
```text
คุณคือผู้จัดการโปรเจค Synes (Synes Online) ทำงานต่อจากเซสชัน 🟡 MAIN · Synes Online · รอบ 2-F (session_01A1roa4D5M2pZxQPQegFexE)
0) set_session_tags เพิ่ม project-synes ให้เซสชันนี้ และตั้งชื่อ "🟡 MAIN · Synes Online · รอบ 2-G" · ตรวจ lineage ด้วย get_session แล้วรายงาน (ถ้าเป็น 8/8 ห้ามใช้ create_session: เมื่อต้องเปลี่ยนเซสชัน ให้ checkpoint แล้วขอเจ้าของเปิดเซสชันใหม่เองพร้อมพรอมป์ต์นี้) · ปิดเซสชันเดิมตาม CLAUDE.md ข้อ 5.1 เฉพาะเมื่อมีแท็ก project-synes และ handoff ถูก push แล้ว · ห้ามแตะเซสชันที่ไม่มีแท็กนี้
1) ทำขั้นเริ่มเซสชันตาม CLAUDE.md ข้อ 1 · branch งาน art/env-polish (ห้าม merge main / ห้ามขึ้น Pages / ห้าม push งาน pilot / ห้ามติดตั้งเครื่องมือใหม่ จนเจ้าของสั่ง)
2) อ่าน docs/team/2026-11-25-master-handoff-2F.md ก่อน แล้ว docs/team/2026-11-25-claude-first-allocation.md (แผนปัจจุบัน ADR-011), docs/team/2026-11-25-dispatch-2F.md และ docs/HANDOFF.md ส่วนบนสุด
3) ทำเฉพาะรายการ A1–A11 ที่เจ้าของสั่งแล้วจริง การไม่ตอบไม่ใช่การอนุมัติ · ห้ามทำงานซ้ำกับ Codex (รอผล P1) · เมื่อเจ้าของแนบไฟล์ F1/F2 ให้ตรวจ SHA256 แล้วสร้างฐาน pilot ตาม dispatch ข้อ 6 · patch ของ Codex ใช้ช่องทางรับงานใน master handoff ข้อ 3
4) รายงานเจ้าของเป็นภาษาไทย แยก ข้อเท็จจริง / ข้อเสนอ / สิ่งที่ยังไม่ทราบ และสถานะ Android / iPhone / PC
```
