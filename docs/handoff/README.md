# ใบสั่งงาน (Art Brief / Task)
**ADR-007:** ทีม A (GPT Codex) เป็นคนเขียนบรีฟ ส่วน Claude (ทีม B) นำเข้า ทดสอบ และส่งผลกลับ บรีฟ 4 ใบด้านล่างที่ Claude เขียนก่อนกฎนี้ต้องรอทีม A ทบทวน (`docs/design/REQ-002-review-pre-adr007.md`)
1 asset = 1 ไฟล์ `ประเภท_ชื่อ_vNN.md` ใช้ `TEMPLATE.md` เป็นแม่แบบ และดูกติกาเต็มใน `docs/ASSET_PIPELINE.md`
สถานะ: DRAFT → REVIEW → APPROVED / REJECTED (APPROVED/REJECTED เจ้าของเป็นคนเปลี่ยน)

| asset | สถานะ | หมายเหตุ |
|---|---|---|
| `ui_potion_v01` | **แก้บรีฟ** (DES-001 §5) | แทนไอคอนขวดยาชั่วคราวที่เป็น SVG ในโค้ด |
| `char_kit_outline_v01` | **ยกเลิกในรอบ 2-B** (DES-001 §5) | เส้นขอบตัวละครแบบอบลง mesh (Blender) |
| `fx_boss_defeat_v01` | **พักในรอบ 2-B** (DES-001 §5) | ฉากบอสล้ม (เศษคริสตัลจาก Blender + โค้ด) |
| `fx_dodge_trail_v01` | **แก้บรีฟ** (DES-001 §5) | ร่องแสงตอนหลบ (โค้ด) |
| `ui_skill_icons_v01` | DRAFT รอเจ้าของอนุมัติผลิต (บรีฟจากทีม A) | ไอคอนสกิล 3 + อัลติล็อก |
| `fx_player_skills_v01` | ทีม B กำลังทำต้นแบบ (บรีฟจากทีม A) | VFX 3 สกิลด้วย Three.js |
