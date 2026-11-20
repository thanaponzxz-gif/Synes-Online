# Asset & License Registry

ทุก asset ที่อยู่ใน build ต้องมีแถวในตารางนี้ ถ้าเงื่อนไขกำหนดให้ใส่เครดิต ให้ใส่ในหน้าเครดิตในเกมด้วย

| asset | path | ผู้สร้าง | แหล่งที่มา | license | เงื่อนไขเครดิต | ตรวจโดย/วันที่ |
|---|---|---|---|---|---|---|
| three.js r187 | node_modules/three | three.js authors | npm `three` | MIT | ใส่ license ใน build (มี) | gameplay · 2026-11-19 |
| playcanvas 2.24.2 (ใช้ใน spike เท่านั้น ไม่อยู่ในเกม) | node_modules/playcanvas | PlayCanvas Ltd | npm `playcanvas` | MIT | ไม่อยู่ใน build เกม | gameplay · 2026-11-19 |
| Blender 5.3 (bpy) เป็นเครื่องมือ ไม่ได้แจกจ่าย | tools/blender/.venv | Blender Foundation | PyPI `bpy` | GPL-3.0 (ตัวเครื่องมือ) | ผลงานที่สร้างด้วย Blender เป็นของผู้สร้าง ไม่ติด GPL | gameplay · 2026-11-19 |
| โมเดล synes_kit.glb (30 asset, 15,232 tris, 537.6 KB) | public/assets/models/ | ทีม Synes (สคริปต์ ไม่ใช้ asset ภายนอก) | `tools/blender/build_kit.py` (build ซ้ำได้ไฟล์เดิมทุกไบต์) | เป็นของโปรเจกต์ | ไม่ต้อง | art · 2026-11-19, ตรวจซ้ำโดย gameplay ด้วย `verify_kit.py` (ผ่าน 293 ข้อ) |
| เสียง SFX | src/audio.ts | ทีม Synes (สังเคราะห์) | โค้ด | เป็นของโปรเจกต์ | ไม่ต้อง | gameplay · 2026-11-19 |
| ฟอนต์ | ใช้ system-ui (ไม่ฝังฟอนต์) | n/a | n/a | n/a | n/a | gameplay · 2026-11-19 |

## Placeholder (ใช้ระหว่างรอ asset จริงตาม `docs/ASSET_PIPELINE.md`)
| placeholder | path | แทนด้วย (ใบสั่งงาน) | สถานะ |
|---|---|---|---|
| ไอคอนขวดยา (SVG ในโค้ด) | `src/ui/hud.ts` `POTION_SVG` | `docs/handoff/ui_potion_v01.md` | brief DRAFT |
| ดาวเสียหลัก (ShapeGeometry 5 แฉก) | `src/render/view.ts` `starGeo()` | ยังไม่มี brief (backlog art) | placeholder |
| ขอบลานบอส (วาง `rock_a`/`crystal_cluster` จากชุดเดิม) | `src/render/view.ts` | ใช้โมเดลชุดเดิม | placeholder |
| โมเดลทั้งชุด `synes_kit.glb` | `public/assets/models/` | โมเดลใหม่ทำตามมติ ข-2 (ใบสั่งงาน + ภาพเทียบในเกม) | placeholder ที่ใช้งานอยู่ (มติ ข-2) |

ยังไม่มีการดาวน์โหลด asset หรือ plugin จากภายนอก จึงยังไม่มี plugin ที่ต้องตรวจโค้ด
