# Asset contract: `public/assets/models/synes_kit.glb`

render layer (`src/render/`) โหลดไฟล์นี้ครั้งเดียว แล้วค้นหา node ตามชื่อ **ชื่อ node ต้องตรงตามตารางทุกตัวอักษร**
node ใดหายไป เกมจะใช้ procedural fallback แทน (เล่นได้ แต่ภาพจะเรียบกว่า)

## กติกาทั่วไป
- หน่วยเป็นเมตร และ glTF เป็น +Y up (exporter ของ Blender แปลงให้อัตโนมัติ) ตัวละคร **หันหน้าไป +Z ของ glTF** (= −Y ใน Blender)
- **origin ของ node แม่อยู่ที่พื้นใต้เท้า** ตรงกลาง และทุกวัตถุวางที่ origin ของโลก (render layer จะ clone ไปวางเอง)
- ไม่ใช้ texture ใช้ material แบบ Principled ที่มีแค่ base color (และ emission สำหรับคริสตัล) แชร์ material ตาม palette
- งบรวม: ไม่เกิน 60k triangles ทั้งไฟล์, ขนาดไฟล์ไม่เกิน 1.2 MB (เป้า ≤ 700 KB) และไม่ใช้ Draco/meshopt
- สัดส่วน chibi: หัวใหญ่ราว 40% ของความสูง เพื่อให้อ่านท่าทางได้จากกล้องมุมสูง
- เงาของรูปทรงต้องอ่านออกจากมุมกล้องเกม (สูง ~11 m หลัง ~10 m มองลง ~48°)

## Palette (ตัวตน Synes)
| ชื่อ | hex | ใช้กับ |
|---|---|---|
| lumen | #5CF2E6 | คริสตัล Synes, แสงที่โต้ตอบได้ |
| synes_violet | #A78BFA | คริสตัลเฉดสอง, เวทมนตร์ |
| blossom | #FF9EC7 | ดอกไม้, ของตกแต่ง |
| gold | #FFC857 | ของมีค่า, ขอบ UI, ตะเกียง |
| leaf | #7CCB5E / dark #3F8F4A | ใบไม้ |
| bark | #8A5A3B | ไม้ |
| path | #E8C99B | ทางเดิน |
| stone | #B9B4C7 | หิน (เทาอมม่วง) |
| cloth_teal | #2BB3A3 | ผ้าพันคอผู้เล่น (ซิลูเอ็ตจำได้) |

**ห้ามใช้สีส้ม #FF7A1A และแดง #FF3355 บนโมเดล** เพราะสองสีนี้สงวนไว้สำหรับวงเตือนการโจมตี

## node ที่ต้องมี
### ตัวละคร: node แม่ (Empty) + mesh ลูกตามชื่อ เพื่อทำ procedural animation (เด้ง, เหวี่ยงดาบ, squash)
| node แม่ | ลูกที่ต้องมี | ขนาดโดยประมาณ | หมายเหตุ |
|---|---|---|---|
| `hero` | `hero_body`, `hero_head`, `hero_sword` | สูง 1.5 m | Wayfarer ผมเงิน ผ้าคลุมม่วง เสื้อครีม/กรม เกราะขอบทอง มีดาบ "Chime Blade" ใบดาบสี lumen และ origin ของดาบอยู่ที่ด้ามจับ |
| `puffcap` | `puffcap_cap`, `puffcap_stem` | สูง 1.0 m | สัตว์เห็ดอ้วนกลม หมวกสีชมพูอ่อนมีจุดครีม หน้าน่ารัก (ตาเป็นทรงกลมดำเล็ก) |
| `thornling` | `thornling_body` | สูง 0.9 m | สัตว์กลมมีหนามใบไม้สีเขียวเข้มพร้อมปลายหนามสีม่วง วิ่งพุ่งชน |
| `prismback` | `prismback_body`, `prismback_shell`, `prismback_horn`, `prismback_legs` | สูง 3.0 m ยาว 5 m | บอสด้วงเต่าเกราะหินขอบทอง หลังเป็นกลุ่มคริสตัล lumen/violet และมีเขาคริสตัลด้านหน้า หันหน้าไป +Z |

### ฉาก (mesh เดียว หรือ node แม่ + ลูก)
`tree_round`, `tree_round_b`, `tree_pine`, `bush`, `rock_a`, `rock_b`, `crystal_cluster`, `flower_patch`, `mushroom_glow`,
`tent`, `campfire`, `signpost`, `lantern_post`, `crystal_pillar` (สูง ~4 m, เส้นผ่านศูนย์กลาง ~1.6 m), `crystal_gate` (กว้าง 6 m สูง 3 m),
`lumen_spring` (บ่อฟื้นพลัง ~2 m), `fence`

### ของสำหรับ tone study (เมือง/ร้านค้า/ซากลึกลับ)
`house_a`, `house_b`, `market_stall`, `fountain`, `ruin_arch`, `ruin_column`, `shop_counter`, `weapon_rack`, `banner`
