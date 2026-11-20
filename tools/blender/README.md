# tools/blender: ชุดโมเดล Synes (สร้างด้วยสคริปต์ Blender)

โมเดลทุกชิ้นใน `public/assets/models/synes_kit.glb` สร้างจากโค้ด Python ล้วน (bmesh + modifier ที่ apply แล้ว)
ไม่มีไฟล์ .blend ไม่มี texture และไม่มี asset จากภายนอก สเปกอยู่ที่ `docs/art/ASSET_CONTRACT.md`

| ไฟล์ | หน้าที่ |
|---|---|
| `build_kit.py` | สร้างทุก node ตามสัญญา แล้ว export GLB (deterministic: build ซ้ำได้ไฟล์เดิมทุกไบต์) |
| `verify_kit.py` | ตรวจ GLB กับสัญญา (อ่านรายชื่อ node จาก ASSET_CONTRACT.md เอง) ถ้ามีข้อผิดพลาดจะจบด้วย exit 1 |
| `render_preview.py` | เรนเดอร์ contact sheet ไปที่ `docs/art/kit_preview.png` (Cycles CPU) |
| `render_chars.py` | contact sheet เทียบตัวละคร: 1 แถวต่อ GLB, `hero` 3 มุม + `prismback` 3 มุม (มุมกล้องเกม) ได้ภาพสี + ขาวดำ (`-gray`) + เงาทึบ (`-sil`) |
| `kit_stats.py` | Python ธรรมดา (ไม่ต้องใช้ bpy): tris และจำนวน primitive (material) ต่อ node ของ GLB หลายไฟล์เทียบกัน |
| `.venv/` | Blender 5.3 แบบ Python module (`bpy`) ถูก gitignore ไว้ อยู่ใน checkout หลักเท่านั้น |

## สร้างใหม่ (headless)
รันจาก root ของ repo (ใน worktree ให้ใช้ path เต็มของ venv ใน checkout หลัก)

```bash
PY=/home/user/synes-online/tools/blender/.venv/bin/python
$PY tools/blender/build_kit.py                    # ~1 วินาที, เขียน public/assets/models/synes_kit.glb
$PY tools/blender/verify_kit.py --rebuild-check   # ~10 วินาที, ตรวจทั้งหมด + build ซ้ำ 2 รอบเทียบ SHA-256
$PY tools/blender/render_preview.py               # ~20 วินาที, docs/art/kit_preview.png
```

### ตัวเลือกตัวละคร (DES-004 ขั้น 3–4, branch `exp/stage1-chars`)
`hero` และ `prismback` มี 3 แบบ ส่วน asset อื่นทุกชิ้นเหมือนกันทุกแบบ เลือกด้วย env `SYNES_CHAR_VARIANT` หรือ `--variant`
| แบบ | ความหมาย |
|---|---|
| `r0` (หรือ `current`) | แบบ DES-003 ที่เจ้าของอนุมัติ 2026-11-21 (ก่อน DES-004 ขั้น 3–4) build ได้ไบต์ตรงกับไฟล์เดิมเมื่อใช้ Blender รุ่นเดียวกัน |
| `A` (**ค่าเริ่มต้น**) | แก้จาก r0 แบบระมัดระวัง |
| `B` | เปลี่ยน silhouette แรงกว่า |

```bash
SYNES_CHAR_VARIANT=B SYNES_KIT_OUT=docs/qa/chars-v01/synes_kit_B.glb $PY tools/blender/build_kit.py
SYNES_CHAR_VARIANT=B $PY tools/blender/verify_kit.py --rebuild-check --glb docs/qa/chars-v01/synes_kit_B.glb
$PY tools/blender/render_chars.py --glb r0=/tmp/kit_r0.glb --glb A=public/assets/models/synes_kit.glb \
    --glb B=docs/qa/chars-v01/synes_kit_B.glb --out /tmp/chars.png      # ~1 นาที
python3 tools/blender/kit_stats.py /tmp/kit_r0.glb public/assets/models/synes_kit.glb --nodes hero,prismback
```
รายละเอียดและผลเทียบในเกมอยู่ที่ `docs/qa/chars-v01/README.md`

- `--rebuild-check` จะ build ลงไฟล์ชั่วคราว 2 รอบ แล้วยืนยันว่าทั้งสองไฟล์และไฟล์ที่ commit ไว้ตรงกันทุกไบต์
  (ถ้าแก้ `build_kit.py` แล้วลืม build ใหม่ การตรวจนี้จะไม่ผ่าน)
  ไบต์ตรงกันได้เฉพาะเมื่อใช้ Blender รุ่นเดียวกัน: 4.5.3 กับ 5.3 เรียง node และ material ในไฟล์ต่างกัน (เรขาคณิตทุก node เหมือนเดิม)
  GLB บน `exp/stage1-chars` export ด้วย 5.3.0
- `render_preview.py --only hero,prismback --out /tmp/x.png` ใช้ดูเฉพาะบางชิ้นได้เร็ว และปรับแสงได้ด้วย `--sun` กับ `--sky-light`
- ตัวแปรแวดล้อม: `SYNES_KIT_OUT` เปลี่ยนไฟล์ปลายทางของ GLB และ `SYNES_REPO` ระบุ root ของ repo เมื่อรันแบบไม่มี `__file__`

## งบ (สคริปต์และตัวตรวจจะหยุดทันทีถ้าเกิน)
| รายการ | งบ | ปัจจุบัน |
|---|---|---|
| triangles รวมทั้งไฟล์ | ≤ 60,000 | **15,988** (แบบ A) |
| ขนาด GLB | ≤ 1.2 MB (เป้า ≤ 700 KB) | **585.6 KB** (แบบ A) |
| scatter ต้นไม้ (`tree_round`, `tree_round_b`, `tree_pine`) | ≤ 350 ต่อชิ้น | 304 / 328 / 124 |
| scatter เล็ก (`bush`, `rock_a`, `rock_b`, `flower_patch`, `mushroom_glow`, `crystal_cluster`) | ≤ 150 ต่อชิ้น | 144 / 125 / 117 / 146 / 138 / 128 |
| texture, Draco, meshopt, กล้อง, ไฟ, animation, UV | ห้ามมี | ไม่มี |
| สีสงวน #FF7A1A / #FF3355 | ห้ามใช้บนโมเดล | ทุก material ห่างจากสองสีนี้ ≥ 98 (ระยะ sRGB 0–255) |

งบ scatter เพิ่มหลังทดสอบในเกม เพราะ props เหล่านี้ถูก instance เป็นร้อยชิ้น (ฉากเคยขึ้นไปถึงราว 70k tris)

## ข้อตกลงที่เกมใช้
- หน่วยเมตร ใน Blender แกน Z ชี้ขึ้นและตัวละครหันไป −Y ซึ่ง exporter แปลงเป็น **+Y up และหันไป +Z ใน glTF**
- root ทุกตัวอยู่ที่ origin ของโลก มี transform เป็น identity และ origin อยู่บนพื้นตรงกลางฐาน ไม่มีส่วนใดต่ำกว่าพื้น เพราะสคริปต์ตัดส่วนใต้ z=0 ทิ้ง
- ฉากที่มีด้านหน้า (บ้าน, เต็นท์, ป้าย, แผง, เคาน์เตอร์, ชั้นอาวุธ, ธง) หันประตูหรือหน้าป้ายไป +Z เหมือนกัน
- material แชร์กันตามชื่อ palette (Principled: base color, roughness, metallic 0) ชุดเปล่งแสงมี `lumen`, `crystal_violet`, `crystal_mid` และ `glow_gold`
- node ที่มีหลาย material จะโหลดใน Three.js เป็น `Group` ซึ่งมี `Mesh` ลูกหนึ่งตัวต่อ material จึงควรใช้ `traverse` เมื่อต้องแก้ material
- draw calls: เกมรวม mesh ลูกของแต่ละ node เป็น 1 draw call (`bakeKit` ใน `src/render/models.ts`) **ยกเว้น `prismback`** ที่แยกไว้เพื่อจางและเรืองแสง
  ดังนั้นจำนวน material ของ hero และ prop ไม่เพิ่ม draw call แต่ทุก material ใน node ของ prismback คือ 1 draw call (r0 = 28, แบบ A/B = 20)
- `hero_sword`: origin อยู่กลางด้ามจับ แกนของ node ขนานกับ `hero` ส่วนใบดาบในท่าพักชี้ขึ้นและเอียงไปข้างหน้า 15° ออกด้านนอก 22° (bake ลง mesh แล้ว)
  ดังนั้น rotation = 0 คือท่าพัก และการหมุนรอบแกน X ของ node คือการฟันไปข้างหน้า

## ใช้กับ Blender MCP บน Windows (เครื่องของเจ้าของ)
สคริปต์ใช้ `bpy` อย่างเดียว จึงวางลงใน Blender ตัวเต็มได้ (ต้องเป็น **Blender 4.1 ขึ้นไป** และทดสอบแล้วกับ 5.3)
เมื่อรันใน Blender ที่เปิดอยู่ สคริปต์จะ **ไม่ล้าง session** แต่ลบเฉพาะ object และ material ที่เป็นของชุดนี้
(ชื่อ node ตามสัญญา, collection `synes_kit` และ material ชื่อ palette) แล้วสร้างใหม่ ของอื่นในไฟล์จึงยังอยู่ครบ

1. ติดตั้ง Blender MCP add-on: ดาวน์โหลด `addon.py` จาก repo `ahujasid/blender-mcp`
   จากนั้นใน Blender ไปที่ Edit → Preferences → Add-ons → Install from Disk แล้วเปิดใช้ "Blender MCP"
   ใน 3D Viewport กด N เปิดแท็บ BlenderMCP แล้วกด Connect/Start server
   ปิดตัวเลือก Poly Haven / Hyper3D ไว้ เพราะโปรเจกต์ยังไม่รับ asset จากภายนอกที่ไม่ได้ลงทะเบียนใน `docs/ASSETS.md`
2. ติดตั้ง `uv` (PowerShell: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`)
3. เพิ่มใน `%APPDATA%\Claude\claude_desktop_config.json` แล้วรีสตาร์ต Claude Desktop
   ```json
   { "mcpServers": { "blender": { "command": "uvx", "args": ["blender-mcp"] } } }
   ```
4. สั่ง Claude Desktop ให้รันโค้ดผ่านเครื่องมือ execute-code ของ Blender MCP (ชื่อปัจจุบันคือ `execute_blender_code`)
   วิธีที่สั้นที่สุดคือ exec ไฟล์ใน repo พร้อมส่ง `__file__` ไปด้วย เพื่อให้สคริปต์หา repo และเขียน GLB ไปที่เดิม
   ```python
   import bpy
   path = r"C:\dev\synes-online\tools\blender\build_kit.py"   # แก้เป็น path ของ checkout จริง
   exec(open(path, encoding="utf-8").read(), {"bpy": bpy, "__file__": path})
   ```
   หรือวางเนื้อไฟล์ทั้งไฟล์ลงไปตรง ๆ แล้วตั้ง `REPO_ROOT = r"C:\dev\synes-online"` ที่หัวไฟล์ (หรือใช้ env `SYNES_REPO`)
   ถ้าหา repo ไม่เจอ ไฟล์จะไปอยู่ที่ `~/synes_kit.glb`
5. ทุกชิ้นวางซ้อนกันที่ origin ตามสัญญา ถ้าจะดูทีละชิ้นให้ซ่อน collection หรือเลื่อน root เอง แต่อย่า save ตำแหน่งที่เลื่อนกลับเข้าสคริปต์
   `verify_kit.py` และ `render_preview.py` ใช้แบบ headless เท่านั้น เพราะจะ reset เป็น factory settings
   (สคริปต์จะปฏิเสธเมื่อถูกรันใน Blender ที่เปิดอยู่) ดังนั้นหลังแก้แล้วให้ commit `build_kit.py` และรันการตรวจบนเครื่อง dev หรือ CI

ทดสอบแล้วด้วยการจำลองแบบ headless: exec แบบ MCP โดยไม่มี `__file__` เขียนไฟล์ไปที่ `SYNES_REPO` ได้
ส่วนการ rebuild ซ้ำใน scene ที่มีชุดเดิมและมี object ของผู้ใช้ จะเก็บ object ของผู้ใช้ไว้ ไม่มีชื่อติด `.001` และได้ GLB ตรงกับการ build แบบ factory ทุกไบต์
แต่ยังไม่ได้ทดสอบบน Windows หรือกับ add-on ตัวจริง

## ตาราง node (triangles จาก GLB)
ตำแหน่ง pivot เป็นพิกัด glTF (x, y ขึ้น, z หน้า) เทียบกับ node แม่

| node | ชนิด | tris | pivot / หมายเหตุ |
|---|---|---:|---|
| `hero` | Empty | 2,162 รวม (แบบ A) | สูง 1.55 m |
| ├ `hero_body` | mesh | 1,182 | (0, 0, 0) เท้า ผ้าพันคอ teal + ปลายผ้า teal, หางผ้าม่วง/เงินที่ปลิวไปด้านหลังซ้าย (คงตาม r0), ผ้าคลุมม่วง 2 แฉก, ขอบทองที่เข็มขัด |
| ├ `hero_head` | mesh | 810 | (0, 0.86, 0) คอ หัวคิดเป็น 44% ของความสูง ผมเงิน 9 ปอย |
| └ `hero_sword` | mesh | 170 | (−0.29, 0.52, 0.14) ด้ามจับในมือขวา ใบดาบสี lumen เปล่งแสง (เหมือน r0) |
| `puffcap` | Empty | 1,700 รวม | สูง 0.98 m |
| ├ `puffcap_cap` | mesh | 1,062 | (0, 0.56, 0) จุดที่หมวกต่อกับลำต้น หมวกเอียงไปข้างหลัง 10° เพื่อให้เห็นหน้าจากกล้องสูง |
| └ `puffcap_stem` | mesh | 638 | (0, 0, 0) เท้า หน้าอยู่บนลำต้น |
| `thornling` | Empty | 888 รวม | สูง 0.96 m |
| └ `thornling_body` | mesh | 888 | (0, 0, 0) เท้า |
| `prismback` | Empty | 2,732 รวม (แบบ A) | 3.82 × 5.04 × 3.29 m (ยาวตาม z) |
| ├ `prismback_body` | mesh | 750 | (0, 0, 0) ตัว คอ หัว และตา lumen (5 material) |
| ├ `prismback_shell` | mesh | 1,008 | (0, 0, 0) กระดอง เกราะ 7 แผ่นขอบทอง รอยแตก lumen และผลึก 11 ชิ้น (8 material) |
| ├ `prismback_horn` | mesh | 80 | (0, 1.58, 2.38) โคนหงอนผลึกบนหน้าผาก (4 material) |
| └ `prismback_legs` | mesh | 894 | (0, 0, 0) ขาทั้ง 6 รวมเป็น mesh เดียว มีรอยแตก lumen (3 material) |
| `tree_round` | mesh | 304 | สูง 3.40 m |
| `tree_round_b` | mesh | 328 | สูง 3.37 m เรือนยอดเข้มประดอก blossom |
| `tree_pine` | mesh | 124 | สูง 4.10 m |
| `bush` | mesh | 144 | |
| `rock_a` | mesh | 125 | |
| `rock_b` | mesh | 117 | |
| `crystal_cluster` | mesh | 128 | |
| `flower_patch` | mesh | 146 | |
| `mushroom_glow` | mesh | 138 | หมวกเห็ดเปล่งแสง |
| `tent` | mesh | 164 | |
| `campfire` | mesh | 296 | หินและฟืน |
| └ `campfire_flame` | mesh | 60 | (0, 0.08, 0) **node เสริม** นอกสัญญา ใช้ทำไฟกะพริบ (เปลวสี glow_gold และแกน lumen) |
| `signpost` | mesh | 246 | |
| `lantern_post` | mesh | 194 | กระจกสี glow_gold |
| `crystal_pillar` | mesh | 220 | สูง 4.02 m กว้าง 1.48 m (ฐาน 1.6 m) |
| `crystal_gate` | mesh | 610 | กว้าง 6.10 m สูง 3.04 m เดินผ่านตามแกน z |
| `lumen_spring` | mesh | 352 | กว้าง 2.2 m น้ำสี lumen |
| `fence` | mesh | 188 | ยาว 2.06 m ตามแกน x |
| `house_a` | mesh | 946 | |
| `house_b` | mesh | 476 | |
| `market_stall` | mesh | 670 | |
| `fountain` | mesh | 346 | |
| `ruin_arch` | mesh | 634 | |
| `ruin_column` | mesh | 304 | |
| `shop_counter` | mesh | 554 | |
| `weapon_rack` | mesh | 502 | |
| `banner` | mesh | 190 | |
| **รวม** | | **15,988** | GLB 585.6 KB, 28 materials, 41 nodes (แบบ A, Blender 5.3.0) |

## Material
สีหลักตามสัญญา (`lumen`, `synes_violet`, `blossom`, `gold`, `leaf`, `leaf_dark`, `bark`, `path`, `stone`, `cloth_teal`) ใช้ hex ตรงตัว
ส่วนสีเสริมที่ต้องเพิ่มสำหรับตัวละครและฉากมีดังนี้
`crystal_violet` (#A78BFA เปล่งแสง), `crystal_mid` (#82BEF2 คือกึ่งกลางระหว่าง lumen กับ violet), `glow_gold` (#FFC857 เปล่งแสง),
`cream` #FFF3DC, `navy` #33437A, `skin` #FFD9BF, `hair_auburn` #9A4A3A, `ink` #2B2440, `white`, `stone_dark` #8F89A6,
`wood_light` #D2A679 และ `water` #8FDDEB
ถ้าจะเพิ่มสีใหม่ ให้เพิ่มใน `PALETTE` ของ `build_kit.py` แล้วรัน `verify_kit.py` ซึ่งจะตรวจระยะห่างจากสีสงวนให้
