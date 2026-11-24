# Pending Queue: งานที่ต้องใช้ GPT/Codex (รอโควตารีเซ็ต)
เจ้าของสั่ง 2026-11-23 (ADR-010) · เพิ่มรายการใหม่ไว้บนสุด · เมื่อทีม A ตอบแล้วให้ย้ายลง "เสร็จ"

| # | เรื่อง | ไฟล์อ้างอิง | ทำไมต้องรอทีม A |
|---|---|---|---|
| P6 | ~~เพดาน draw calls ฉากบอสชั่วคราว~~ → เจ้าของสั่ง 2026-11-24: เพดาน Golden Reference คง low 56 / medium 60, บอส phase 2 (62/65) เป็น Known Performance Issue KPI-001 ไม่เพิ่มเพดาน, C-9 ยังไม่เปิด · ทางแก้ TD-2 เจ้าของอนุมัติแล้ว (C-1) | `docs/qa/KNOWN_ISSUES.md`, `docs/team/2026-11-24-pm-accept-r5-fix2.md` | ทีม A ทบทวนเมื่อเปิด C-9 |
| P5 | ทบทวนตัวเลือกดีไซน์ที่ Claude ทำเองในงาน Environment (E1…En) | `docs/qa/env-art-v01/r1-sample/README.md` | Claude รับช่วงชั่วคราว ต้องให้ทีม A รับรองก่อนเป็นมาตรฐานถาวร |
| P4 | spire/ศาล S1–S10 | `docs/qa/spire-shrine-v01/README.md` | ดีไซน์ที่ DES-004 ไม่ได้ระบุ |
| P3 | กล้อง C1–C4, สีวงเตือน 4 จุด, แถบ HP บอส, HUD B1–B11 | `docs/design/DES-006-teamB.md` | คำถามดีไซน์ค้าง |
| P2 | ลานบอส 1–6, VFX 1–7, ฉากเปิด AQ1–AQ4, โลก S1–S16 | `DES-004` §8, `docs/qa/*-v01/README.md` | คำถามดีไซน์ค้าง |
| P1 | Golden Reference ของ Hero 001 + ไฟล์ Tripo | `assets/source/hero_001/` (**ยังไม่มีใน repo**) | ต้นฉบับมาจาก GPT + Tripo |
