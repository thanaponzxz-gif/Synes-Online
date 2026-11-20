# Asset & License Registry

ทุก asset ที่อยู่ใน build ต้องมีแถวในตารางนี้ ถ้าเงื่อนไขกำหนดให้ใส่เครดิต ให้ใส่ในหน้าเครดิตในเกมด้วย

| asset | path | ผู้สร้าง | แหล่งที่มา | license | เงื่อนไขเครดิต | ตรวจโดย/วันที่ |
|---|---|---|---|---|---|---|
| three.js r187 | node_modules/three | three.js authors | npm `three` | MIT | ใส่ license ใน build (มี) | gameplay · 2026-11-19 |
| playcanvas 2.24.2 (ใช้ใน spike เท่านั้น ไม่อยู่ในเกม) | node_modules/playcanvas | PlayCanvas Ltd | npm `playcanvas` | MIT | ไม่อยู่ใน build เกม | gameplay · 2026-11-19 |
| Blender 5.3 (bpy) เป็นเครื่องมือ ไม่ได้แจกจ่าย | tools/blender/.venv | Blender Foundation | PyPI `bpy` | GPL-3.0 (ตัวเครื่องมือ) | ผลงานที่สร้างด้วย Blender เป็นของผู้สร้าง ไม่ติด GPL | gameplay · 2026-11-19 |
| โมเดล synes_kit.glb (30 asset, 15,604 tris, 579.4 KB) | public/assets/models/ | ทีม Synes (สคริปต์ ไม่ใช้ asset ภายนอก) | `tools/blender/build_kit.py` ส่งออกด้วย Blender 4.5.3 LTS | เป็นของโปรเจกต์ | ไม่ต้อง | ต้นแบบตรวจในเครื่องตาม DES-003 · `verify_kit.py` ผ่าน 0 คำเตือน · **เจ้าของอนุมัติแบบใหม่ 2026-11-21** (3 ชิ้นที่เปลี่ยน: `hero`, `prismback`, `crystal_pillar` ภาพเทียบ `docs/qa/models-old-vs-new-*.png`) · **บน branch `exp/stage1-chars` ไฟล์นี้เป็นแบบ A ของ DES-004 ขั้น 3–4 (15,988 tris, 585.8 KB, Blender 5.3.0) ยังไม่อนุมัติ** ดูแถว placeholder ด้านล่าง แบบที่อนุมัติแล้ว build ได้ด้วย `SYNES_CHAR_VARIANT=r0` |
| ลานหิน ซากศาล น้ำตก และผลึกรอบปริซึมแบ็ก | `src/render/arena.ts` | ทีม Synes | สร้างพื้นผิวด้วย Canvas และประกอบทรงใน Three.js ตาม DES-003 | เป็นของโปรเจกต์ | ไม่ต้อง | ต้นแบบตรวจในเครื่อง |
| เสียง SFX | src/audio.ts | ทีม Synes (สังเคราะห์) | โค้ด | เป็นของโปรเจกต์ | ไม่ต้อง | gameplay · 2026-11-19 |
| HUD skin v01: ภาพต้นแบบ 1 แผ่น (RGBA 1774×887) + 8 ชิ้นที่ตัดแล้ว (กรอบปุ่ม, จอยฐาน/ปุ่ม, กรอบหลอดผู้เล่น/บอส, แผง, ปุ่มตั้งค่า, สวิตช์) 528 KB | `assets/source/ui_hud_sheet_v01.webp` → `public/assets/ui/ui_*_v01.png` | GPT Image ตามทิศทางของทีม A (Codex) เจ้าของเป็นผู้เลือกภาพ | ไฟล์ที่เจ้าของแนบในแชต 2026-11-20 · ตัดด้วย `tools/art/slice_hud.py` (คัดลอกพิกเซลตรง ไม่วาดเพิ่ม ลบเฉพาะจุดรบกวน alpha < 8) · prompt ฉบับเต็ม: **ยังไม่ทราบ** (ขอจากเจ้าของ/ทีม A) | เงื่อนไขการใช้งานของ OpenAI ให้ผู้ใช้เป็นเจ้าของผลลัพธ์ (ยังไม่ได้ยืนยันบัญชีที่ใช้สร้าง) | ไม่ต้อง | PM · 2026-11-20 ตรวจขอบโปร่งใส: ไม่มีขอบขาว/ดำ, มีจุดรบกวน alpha 1–15 ทั่วแผ่น (ลบแล้ว), ยอดเพชรบนของกรอบรูปผู้เล่นชิดขอบบนของภาพต้นฉบับ |
| ฟอนต์ | ใช้ system-ui (ไม่ฝังฟอนต์) | n/a | n/a | n/a | n/a | gameplay · 2026-11-19 |

## Placeholder (ใช้ระหว่างรอ asset จริงตาม `docs/ASSET_PIPELINE.md`)
| placeholder | path | แทนด้วย (ใบสั่งงาน) | สถานะ |
|---|---|---|---|
| ไอคอนขวดยา (SVG ในโค้ด) | `src/ui/hud.ts` `POTION_SVG` | `docs/handoff/ui_potion_v01.md` | brief DRAFT |
| ไอคอนสกิล 1/2/3 + อัลติล็อก (SVG ในโค้ด: ระฆังกับวงแหวน, คมเสี้ยวจันทร์เอียงขวา, ผลึกสามแฉกจากรอยแตก, ระฆังซ้อน+แม่กุญแจ) ตาม silhouette ใน DES-001 §2 (Q7) | `index.html` `#btn-skill`..`#btn-ult` | `ui_skill_icons_v01` (DES-001 บรีฟงานภาพ) | placeholder |
| ดาวเสียหลัก (ShapeGeometry 5 แฉก) | `src/render/view.ts` `starGeo()` | ยังไม่มี brief (backlog art) | placeholder |
| ขอบลานบอส (วาง `rock_a`/`crystal_cluster` จากชุดเดิม) | `src/render/view.ts` | ใช้โมเดลชุดเดิม | placeholder |
| โมเดลทั้งชุด `synes_kit.glb` | `public/assets/models/` | โมเดลใหม่ทำตามมติ ข-2 (ใบสั่งงาน + ภาพเทียบในเกม) | placeholder ที่ใช้งานอยู่ (มติ ข-2) · `hero`/`prismback`/`crystal_pillar` แบบ DES-003 เจ้าของอนุมัติแล้ว 2026-11-21 ส่วนข้อกำหนดเต็มของ DES-004 ขั้น 3–4 ยังไม่ทำ |
| `hero` + `prismback` แบบ DES-004 ขั้น 3–4 **ตัวเลือก A** (แก้จาก r0 แบบระมัดระวัง: ผม 9 ปอย, ผ้าคลุมสั้น 2 แฉก, ชายผ้า teal กลางหลัง, บอสหิน stone เกราะ 7 แผ่น ผลึก 11 ชิ้น รอยแตก lumen) hero 2,162 / boss 2,732 tris | `public/assets/models/synes_kit.glb` (เฉพาะ branch `exp/stage1-chars`) · สคริปต์ `tools/blender/build_kit.py` `SYNES_CHAR_VARIANT=A` (ค่าเริ่มต้น) · ทีม Synes (Claude Opus 5.5, สคริปต์ ไม่ใช้ asset ภายนอก) · เป็นของโปรเจกต์ | แทน `hero`/`prismback` r0 เมื่อเจ้าของเลือก (DES-004, DES-006 §3) | **placeholder ต้นแบบ ยังไม่ APPROVED** รอทีม A ตรวจ + เจ้าของเลือก A/B · หลักฐาน `docs/qa/chars-v01/` · verify ผ่าน 0 คำเตือน |
| `hero` + `prismback` แบบ DES-004 ขั้น 3–4 **ตัวเลือก B** (silhouette มาก่อน: ผมสองชั้น 9 ปอย, ผ้าคลุมยาว 2 แฉก, ชายผ้า teal ปลิวขวา, เกราะ 8 แผ่นขอบหยัก ผลึกพีระมิด 9 ชิ้น หัวบอส ×1.29) hero 2,222 / boss 2,768 tris | `docs/qa/chars-v01/synes_kit_B.glb` (588.1 KB, ไฟล์เทียบเท่านั้น เกมไม่โหลด) · `SYNES_CHAR_VARIANT=B` · ทีม Synes (Claude Opus 5.5) · เป็นของโปรเจกต์ | ตัวเลือกเทียบกับ A | **placeholder ต้นแบบ ยังไม่ APPROVED** · verify ผ่าน 0 คำเตือน |

ยังไม่มีการดาวน์โหลด asset หรือ plugin จากภายนอก จึงยังไม่มี plugin ที่ต้องตรวจโค้ด
