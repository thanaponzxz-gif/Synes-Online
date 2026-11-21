# Stage 1 · ผลรวมหลังรอบปรับปรุง (ก่อน → หลัง)

**ก่อน:** R0 baseline (`docs/qa/stage1-v01/r0-baseline/`, build = `main` 90d3b4d ภาพเท่ากับ 762b985) · **หลัง:** `stage1/polish` `ea3d371` (ค่าเริ่มทุกอย่าง ไม่มี URL param)
เครื่องมือเดียวกัน `node tools/qa/stage1-shots.mjs <out> --tag final --jpeg` · seed 1 · tick เดียวกัน · Chromium headless + SwiftShader (**ไม่ใช่เครื่องจริง**)

## สิ่งที่อยู่ใน "หลัง"
- ลด draw calls ภาพไม่เปลี่ยน (`lane/perf-field`) · สีวงเตือนตรง hex (`lane/tele-color`) · กล้องถอยชั่วคราว (`lane/camera-pullback`)
- HUD ตาม DES-006 (`lane/hud-fixes`) · Q17 (`lane/q17`) · จังหวะตี A/B/C เป็นตัวเลือก `?combo=` (ค่าเริ่มยังเป็นของเดิม)
- ภาพ: ฉากเปิด A (`?opening=B` / `?opening=0`), ลานบอส A (`?arena=B` / `?arena=0`), ตัวละคร A (B: `docs/qa/chars-v01/synes_kit_B.glb`), VFX A (`?vfx=B` / `?vfx=cur`)

## Draw calls ที่ 844×390 (renderer.info)
| ช็อต | low ก่อน → หลัง | medium ก่อน → หลัง |
|---|---|---|
| boss-circle-844 | 97 → 49 | 108 → 53 |
| boss-dash-844 | 97 → 55 | 108 → 58 |
| boss-fan-844 | 97 → 49 | 108 → 53 |
| boss-open-844 | 105 → 48 | 116 → 52 |
| chars-hero-844 | 149 → 48 | 152 → 50 |
| chars-prismback-844 | 178 → 69 | 181 → 71 |
| chars-puffcap-844 | 149 → 48 | 152 → 50 |
| chars-thornling-844 | 149 → 48 | 152 → 50 |
| opening-start-844 | 149 → 48 | 152 → 50 |
| opening-walk2s-844 | 150 → 48 | 153 → 50 |
| pathA-844 | 152 → 47 | 155 → 49 |
| plaza-844 | 146 → 45 | 152 → 48 |
| pool-844 | 124 → 50 | 130 → 53 |
| vfx-hit-spark-844 | 150 → 51 | 153 → 53 |
| vfx-perfect-dodge-844 | 148 → 50 | 151 → 52 |
| vfx-skill1-chime-844 | 156 → 54 | 159 → 56 |
| vfx-skill2-crescent-844 | 154 → 51 | 157 → 53 |
| vfx-skill3-crystal-844 | 142 → 49 | 145 → 51 |
| vfx-ult-locked-844 | 146 → 49 | 149 → 51 |

## Bench (`bench.txt`, FPS เป็นค่าสัมพัทธ์ของ SwiftShader เท่านั้น)
| profile | draw calls ก่อน → หลัง | FPS ก่อน → หลัง | transfer KB ก่อน → หลัง |
|---|---|---|---|
| android-low | 144 → 43 | 21.6 → 21.9 | 838 → 863 |
| android-mid | 144 → 43 | 18.2 → 22.4 | 838 → 863 |
| iphone-class | 144 → 43 | 25.5 → 28.8 | 838 → 863 |
| pc (medium) | 150 → 46 | 15.1 → 20.2 | 838 → 863 |

## ภาพเทียบ (`compare/`, ซ้าย = ก่อน, ขวา = หลัง)
opening-start, pathA, plaza, boss-open, boss-circle, boss-dash, chars-hero, chars-prismback, vfx crescent, vfx hit-spark (medium 844×390)
คลิปหลัง: `bot-start-to-plaza.webm` (26 s, บอทเล่นจากค่ายถึงทางเข้าลานบอส, ตาย 0, error 0) · คลิปก่อน: `../r0-baseline/bot-start-to-plaza.webm`

## ผลทดสอบของ build นี้
`npm test` 154/154 · typecheck ผ่าน · build ผ่าน · lifecycle 20/20 · shots 50 ภาพ error 0 · bench error 0 ทุก profile
**Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: headless เท่านั้น**

## ที่ยังไม่ผ่าน / ยังไม่ทราบ
- tick แรกของวงเตือนยังหลุดจอ 9/23 กรณี (กล้องถอยหลังวงเกิด) · ลานบอส A ยังมืดทั้งภาพ (luma ~0.31) · ต้นไม้ใกล้กล้องยังเป็นลายตาข่าย (ต้องให้ทีม A ตัดสิน)
- แถบ HP บอสใน HUD สดเท่าขอบวงแดง · จังหวะตี: เจ้าของยังไม่เลือก · FPS/ความรู้สึกบนมือถือจริง
