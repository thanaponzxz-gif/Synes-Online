# AGENTS.md: กฎสำหรับ agent ที่ไม่ใช่ Claude Code (GPT Codex = ทีม A และ agent อื่น)

> Claude Code อ่าน `CLAUDE.md` ส่วน Codex และ agent อื่นอ่านไฟล์นี้ ทั้งสองไฟล์ชี้ไปที่ความจริงชุดเดียวกัน ถ้าขัดกันให้ยึด `CLAUDE.md` แล้วแจ้งเจ้าของ

## 1. โปรเจคนี้คืออะไร
- **Synes Online:** เกมแฟนตาซี 3D เล่นบนเบราว์เซอร์มือถือจากลิงก์ (Three.js + Vite, TypeScript) **แยกจาก TERRAVIA โดยเด็ดขาด**
- อ่านก่อนเริ่ม: `docs/PROJECT_SYNES.md` (เป้าหมาย, สิ่งที่ห้ามเปลี่ยน, ตัวตนของเกม, สถานะ) และ `docs/DECISIONS.md` (ADR)
- repo เป็น **Public**: ห้าม commit ข้อมูลส่วนตัว อีเมล key หรือภาพจากเกมอื่น

## 2. บทบาท (ADR-007)
| ทีม | ใคร | ทำ |
|---|---|---|
| A | GPT Codex | ออกแบบหรือเขียนบรีฟทุกงาน (ระบบเกม, สกิล/VFX, UI/UX, ตัวละคร, มอนสเตอร์, ฉาก, asset) และตรวจผลที่ทีม B ส่งกลับ |
| B | Claude | ทำตามดีไซน์ ทดสอบ และส่งผลกลับ ไม่ออกแบบเอง · กำลังหลักด้าน Engineering (ADR-011) |
| Technical Production | Codex บนเครื่องเจ้าของ (Sol: Blender MCP, asset, texture/material · Astra: วางแผน tech art, รีวิว/Engineering เสี่ยงสูง) | ผลิตตามแบบของทีม A ที่เจ้าของอนุมัติแล้วเท่านั้น ไม่เปลี่ยนแบบ · ห้ามทำงาน Engineering ที่ย้ายให้ Claude แล้ว (ADR-011, `docs/team/2026-11-25-claude-first-allocation.md`) |
| เจ้าของ | คุณหนึ่ง | ส่งต่อระหว่างทีม ตัดสินเมื่อเห็นไม่ตรงกัน และอนุมัติ asset |

ไฟล์ของทีม A: `docs/design/DES-NNN-<หัวข้อ>.md` และบรีฟ asset `docs/handoff/<asset>.md` · ทำงานบน branch `design/<หัวข้อ>` · ขั้นตอนเต็มใน `docs/design/README.md` และ `docs/ASSET_PIPELINE.md`
ห้ามแก้โค้ดเกม (`shared/`, `src/`, `server/`, `tests/`) และไฟล์ของสายอื่นตาม `docs/OWNERSHIP.md`

## 3. ข้อจำกัดที่ดีไซน์ต้องเคารพ
- เอนจินคือ Three.js (ADR-001) ไม่ใช่ Godot · server ตัดสินผลต่อสู้และรางวัลด้วย sim แบบ deterministic 30 Hz (ADR-002)
- สีส้ม #FF7A1A และแดง #FF3355 สงวนไว้สำหรับวงเตือนการโจมตีเท่านั้น · ทุกอย่างต้องเป็นต้นฉบับ
- ออกแบบแนวนอนก่อน ปุ่มต้องไม่บังตัวละคร ศัตรู หรือวงเตือน · ทำ vertical slice ก่อน ห้ามออกแบบระบบ MMORPG ทั้งหมดล่วงหน้า
- 3D ส่งเป็น `.glb`, ภาพเป็น `.png` ชื่อ `ประเภท_ชื่อ_vNN` และต้องบันทึกที่มา (เครื่องมือ, prompt ฉบับเต็ม, license)

## 4. ระบบองค์ความรู้ร่วม (เจ้าของสั่ง 2026-11-21, ADR-008)
อ่านเฉพาะส่วนที่เกี่ยวกับงาน ก่อนเสนอเครื่องมือ, pipeline หรือ asset ใหม่:
- `docs/knowledge/AI_DEVELOPMENT_PLAYBOOK.md`: วิธีทำงาน, วงจรเรียนรู้ 7 ขั้น, pipeline asset, ด่านลิขสิทธิ์
- `docs/knowledge/TOOL_REGISTRY.md`: เครื่องมือที่ใช้/พิจารณา พร้อมสถานะและ license ที่ตรวจแล้ว (เช่น แผนฟรีของ Tripo ใช้กับ Synes ไม่ได้)
- `docs/knowledge/EXPERIMENT_RESULTS.md`: ผลทดลองเทียบวิธีเดิมกับวิธีใหม่
- `docs/knowledge/LESSONS_LEARNED.md`: บทเรียนจากงานก่อนหน้า

ถ้าทีม A ได้บทเรียนใหม่ ให้เขียนไว้ท้ายไฟล์ DES ในหัวข้อ "บทเรียน" แล้วทีม B (PM) จะย้ายเข้า `LESSONS_LEARNED.md`

## 5. สิ่งที่ต้องให้เจ้าของยืนยันก่อนเสมอ
สมัครหรือจ่ายเงินบริการ (เช่น Tripo), ติดตั้งเครื่องมือ, เปิดลิงก์สาธารณะหรือโฮสต์, ใช้ asset ในเกมจริง และลบ branch
