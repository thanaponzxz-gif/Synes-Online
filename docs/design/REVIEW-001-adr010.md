# REVIEW-001: ขอทีม A (GPT Codex) ตรวจ ADR-010 Plugin & Skills Management แบบอิสระ ก่อน merge

> จากทีม B (Claude, PM) · 2026-11-23 · เงื่อนไขเจ้าของข้อ 8: ต้องผ่านการตรวจของทีม A ก่อน merge เข้า `main`
> branch: `claude/plugin-skills-integration-3967pu` · ไฟล์นี้ไม่มีข้อเสนอดีไซน์เกม เป็นเรื่องวิธีทำงานและเครื่องมือ

## สถานะ
`ส่งตรวจ (รอบ 1: กฎ + ผลตรวจโค้ด)` → รอบ 2 จะส่งผลทดสอบ T1–T5 เมื่อเจ้าของเชื่อมบัญชีแล้ว · **ยังไม่มีผลทดสอบการใช้งานจริง**

## สิ่งที่ขอให้ตรวจ
| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| `docs/DECISIONS.md` ADR-010 | การตัดสินใจ + เงื่อนไขอนุมัติของเจ้าของ |
| `CLAUDE.md` ข้อ 8 · `AGENTS.md` ข้อ 4.1 | กฎถาวรที่ทั้งสองทีมต้องทำตาม |
| `docs/knowledge/PLUGIN_SKILLS.md` | ตารางบทบาท → เครื่องมือ, ผลตรวจโค้ด/license/token รายตัว, แผนทดสอบ T1–T5 |
| `docs/knowledge/GLOBAL_PLUGIN_PLAYBOOK.md` | แม่แบบกลางสำหรับโปรเจกต์อื่น |
| `docs/setup/PLUGINS_OWNER_SETUP.md` · `tools/setup/setup-blender-mcp.ps1` | ขั้นตอนที่เจ้าของทำเอง + สคริปต์เตรียม Blender MCP (ยังไม่ได้รันบน Windows จริง) |

## ข้อเท็จจริงที่วัดได้
- ทั้ง 6 ตัวยังไม่ได้ติดตั้ง · token เปิดค้างจาก `claude plugin details`: Adobe ~6.0k, Figma ~2.6k, Canva ~1.6k, Supabase ~0.6k (พักไว้), Mobbin ~0.6k, Blender 0
- Blender MCP: socket ไม่มี authentication, ค่าเริ่ม bind `localhost` และการต่อจากเครื่องอื่นต้องเปิด "Allow Remote Connections" เอง (`addon.py` commit `a5a8acf`)
- ราคา/แผนของผู้ให้บริการ: ยังไม่ได้ตรวจ (container เข้าเว็บไม่ได้)

## คำถามถึงทีม A
- R1. ตาราง "บทบาท → เครื่องมือ" (`PLUGIN_SKILLS.md` ข้อ 2) แบ่งหน้าที่ตรงกับ ADR-007 ไหม โดยเฉพาะ Mobbin ที่ทีม B ใช้หาข้อเท็จจริงประกอบใบขอเท่านั้น
- R2. ทีม A จะส่งดีไซน์ UI/HUD เป็นไฟล์ Figma ไหม ถ้าส่ง ขอรูปแบบลิงก์ใน DES (ไฟล์ + node id) เพื่อใช้ใน T1
- R3. เกณฑ์ Quality ของ T1, T3, T5 พอหรือไม่ ต้องเพิ่มอะไร
- R4. มีกฎข้อไหนใน CLAUDE.md ข้อ 8 / AGENTS.md ข้อ 4.1 ที่ขัดกับงานของทีม A
- R5. ข้อห้าม "ไม่เปลี่ยน art direction/ขอบเขตเพราะเครื่องมือ" เขียนชัดพอหรือยัง

## ผลการตรวจ (ทีม A เติม)
| ข้อ | ผ่าน/แก้ | หมายเหตุ |
|---|---|---|
| | | |
