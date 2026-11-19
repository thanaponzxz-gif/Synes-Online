# synes_kit.glb: รายงานชุดโมเดล

- ไฟล์: `public/assets/models/synes_kit.glb` ขนาด **537.6 KB** (550,472 bytes), SHA-256 `2237c1cf39610620…`
- triangles รวม **15,232 / 60,000** ประกอบด้วย 30 asset, 41 node, 37 mesh และ 22 material ไม่มี texture, Draco/meshopt, กล้อง, ไฟ หรือ UV
- สร้างโดย `tools/blender/build_kit.py` (Blender 5.3 bpy, glTF I/O v5.3.43) และ build ซ้ำแล้วได้ไฟล์เดิมทุกไบต์
- ภาพพรีวิว: `docs/art/kit_preview.png` (Cycles CPU, 16 samples × supersample 2×, กล้อง ortho ก้มลง 48°)
- ผลตรวจ: `tools/blender/verify_kit.py --rebuild-check` → **VERIFY PASSED** ผ่าน 293 ข้อ ไม่มี FAIL และไม่มี warning (log เต็มอยู่ท้ายไฟล์)

## Triangles ต่อ asset
| asset | tris | กว้าง × ยาว × สูง (m) | หมายเหตุ |
|---|---:|---|---|
| `hero` | 1,556 | 1.27 × 0.93 × 1.52 | body 650, head 756, sword 150 |
| `puffcap` | 1,700 | 0.91 × 0.87 × 0.98 | cap 1,062, stem 638 |
| `thornling` | 888 | 0.93 × 0.85 × 0.96 | body 888 |
| `prismback` | 2,582 | 3.93 × 5.18 × 3.09 | body 858, shell 902, horn 54, legs 768 |
| `tree_round` | 304 | 2.65 × 2.03 × 3.40 | scatter cap 350 |
| `tree_round_b` | 328 | 2.20 × 1.83 × 3.37 | scatter cap 350 |
| `tree_pine` | 124 | 2.57 × 2.63 × 4.10 | scatter cap 350 |
| `bush` | 144 | 1.46 × 1.06 × 0.88 | scatter cap 150 |
| `rock_a` | 125 | 1.96 × 1.48 × 1.02 | scatter cap 150 |
| `rock_b` | 117 | 1.74 × 1.33 × 0.68 | scatter cap 150 |
| `crystal_cluster` | 128 | 1.15 × 1.18 × 1.36 | scatter cap 150 |
| `flower_patch` | 146 | 0.77 × 0.89 × 0.34 | scatter cap 150 |
| `mushroom_glow` | 138 | 0.75 × 0.49 × 0.55 | scatter cap 150 |
| `tent` | 164 | 2.67 × 2.62 × 2.14 | |
| `campfire` | 356 | 1.17 × 1.20 × 0.66 | รวม `campfire_flame` 60 |
| `signpost` | 246 | 1.23 × 0.43 × 1.97 | |
| `lantern_post` | 194 | 0.46 × 0.46 × 2.81 | |
| `crystal_pillar` | 220 | 1.48 × 1.48 × 4.02 | สัญญา: ~4 m, Ø ~1.6 m |
| `crystal_gate` | 610 | 6.10 × 1.82 × 3.04 | สัญญา: 6 × 3 m |
| `lumen_spring` | 352 | 2.20 × 2.22 × 0.96 | สัญญา: ~2 m |
| `fence` | 188 | 2.06 × 0.19 × 1.08 | |
| `house_a` | 946 | 4.13 × 4.02 × 4.32 | |
| `house_b` | 476 | 4.15 × 4.33 × 5.22 | |
| `market_stall` | 670 | 2.55 × 1.38 × 2.50 | |
| `fountain` | 346 | 3.00 × 2.85 × 2.26 | |
| `ruin_arch` | 634 | 3.67 × 2.01 × 3.85 | |
| `ruin_column` | 304 | 2.01 × 1.58 × 2.36 | |
| `shop_counter` | 554 | 2.37 × 0.92 × 1.39 | |
| `weapon_rack` | 502 | 1.64 × 0.60 × 1.72 | |
| `banner` | 190 | 1.04 × 0.50 × 3.46 | |
| **รวม** | **15,232** | | GLB 537.6 KB |

ขนาดวัดจากแกนของ Blender: กว้าง = x, ยาว = แกนหน้า–หลัง (z ใน glTF), สูง = ขึ้น

## สิ่งที่ต่างจากสัญญาหรือเพิ่มเข้ามา
- **node เสริม `campfire_flame`** เป็นลูกของ `campfire` โดยมี pivot ที่โคนเปลว เพื่อให้เกมทำไฟกะพริบหรือ scale ได้ ถ้าเกมไม่ใช้ก็ไม่มีผลอะไร
- **emission นอกเหนือจากคริสตัล** ใช้กับ `lumen` (คริสตัล, ใบดาบ Chime Blade และน้ำของ lumen_spring ซึ่งตรงกับความหมาย "แสงที่โต้ตอบได้") และ `glow_gold` (กระจกตะเกียง, หน้าต่าง, เปลวไฟ)
  สัญญาเขียนถึง emission เฉพาะคริสตัล ถ้าต้องการให้เคร่งครัด ให้ตั้ง strength ของ `glow_gold` เป็น 0 ใน `PALETTE`
- **สีเสริม 12 สี** นอก palette (ดูรายการใน `tools/blender/README.md`) ซึ่งจำเป็นสำหรับผิว ผม ตา ผ้ากรม และหินเข้ม ทุกสีห่างจากสีสงวนส้มและแดง ≥ 98
  ส่วนเปลวไฟใช้สีทองกับแกน lumen แทนสีส้ม
- **ดาบในท่าพักเอียง** ไปข้างหน้า 15° และออกด้านนอก 22° (bake ลง mesh) เพราะดาบที่ตั้งตรงบังหน้าฮีโร่ในมุม 3/4 ส่วน origin ยังอยู่ที่ด้ามจับตามสัญญา
- **ขนาด** อยู่ในช่วงประมาณของสัญญาทั้งหมด (ตัวตรวจยอมให้ต่างได้ ±18%) โดย prismback ยาว 5.18 m เทียบกับ 5 m ที่ระบุ ซึ่งรวมเขาและหางแล้ว
  ส่วน crystal_pillar กว้าง 1.48 m เพราะ bbox วัดข้ามด้านแบนของฐานแปดเหลี่ยม (ถ้าวัดถึงมุมจะได้ Ø 1.6 m)

## กระบวนการและสิ่งที่แก้ระหว่างทำ (ดูจากพรีวิวจริงทุกรอบ)
1. **รอบแรก:** ภาพสว่างจ้าจนสีพาสเทลซีด จึงแยกสีท้องฟ้าที่กล้องเห็นออกจากแสงเติม (LightPath) และลด sun
   นอกจากนี้หน้าของ puffcap ถูกหมวกบังเมื่อมองจากกล้องสูง จึงขยายท้องไปข้างหน้า ลดขนาดหมวก และเอียงหมวกไปข้างหลัง 10°
   prismback ก็อ่านไม่ออกว่าเป็นบอส จึงขยายกลุ่มคริสตัลและเขา และทำตาให้กลมโต
   foliage และหินที่ใช้ icosphere 20 หน้าดูหยาบ จึงเปลี่ยนเป็น 80 หน้า
2. **รอบสอง (ภาพ close-up และมุมกล้องเกม):** ผมสองปอยด้านข้างของฮีโร่ดูเหมือนหูแมว จึงหวีไปข้างหลัง ดาบบังหน้าจึงเอียงออก
   ส่วนจุดมอสบนกระดองดูเป็นลายเสือดาว จึงเปลี่ยนเป็น scute หกเหลี่ยม (เข้าธีม prism)
3. **ตัวตรวจจับได้:** มีชิ้นที่จมต่ำกว่าพื้นจึงเพิ่มการตัดที่ z=0 ใน `finish()` crystal_pillar กว้างเกิน (2.07 m) จึงลดการเอนของคริสตัล
   crystal_gate ไม่สมมาตรเพราะมุม azimuth ถูกกลับซ้ำสองครั้งที่เสาซ้าย และพบว่า build ไม่ deterministic
   เพราะ `bmesh.ops.create_uvsphere` เรียงหน้าไม่คงที่ จึงเขียน UV sphere เองและเลิกใช้ `set` กับลำดับ geometry
4. **close-up บ้าน:** ซุ้มประตูโค้งเป็นสีดำ เพราะหน้าของจานครึ่งวงกลมทับระนาบเดียวกับประตูพอดี
   (Cycles เกิด self-shadow และ Three.js จะเกิด z-fighting) จึงร่นจานเข้าไปเล็กน้อย
5. **หลังทดสอบในเกม (คำขอของ coordinator):** ฉากขึ้นไปราว 70k tris เพราะ scatter ถูก instance จำนวนมาก
   จึงลดต้นไม้ให้ ≤350 และ props เล็กให้ ≤150 แล้วเพิ่ม `SCATTER_CAPS` ทั้งใน build และ verify
   ผลคือ tree_round 477→304, tree_round_b 538→328, bush 447→144, rock_a 191→125, rock_b 167→117,
   flower_patch 442→146, mushroom_glow 504→138, crystal_cluster 202→128 (รวม 16,770→15,232 และไฟล์ 581→538 KB)

## จุดอ่อนที่รู้อยู่
- ตัวละครยังไม่มี rig (ไม่ได้ขอ) มีเพียงชิ้นส่วนแยกสำหรับ procedural animation และขาทั้ง 6 ของ prismback รวมเป็น mesh เดียว จึงขยับแยกขาไม่ได้
- หลัง cap แล้ว `flower_patch` บางลง (ดอก 5 ดอก กอหญ้า 3 กอ ไม่มีเกสรทอง) และพุ่มข้างของ `bush` เป็น icosahedron 20 หน้า ดูเป็นเหลี่ยมเมื่อมองใกล้
- พรีวิวเป็น Cycles ไม่ใช่ renderer ของ Three.js สีที่เปล่งแสง (emissive 0.45–0.8) อาจดูจ้ากว่าในเกมถ้าใช้ tone mapping ต่างกัน ปรับได้ที่ `PALETTE`
- `ruin_arch` อ่านเป็นซากซุ้มได้จากมุม 3/4 แต่จากมุมบนตรง ๆ ทับหลังที่หักอาจดูเป็นรูปตัว L
- ยังไม่ได้ทดสอบเส้นทาง Blender MCP บน Windows กับ add-on ตัวจริง ทดสอบเพียงการจำลองแบบ headless (exec โดยไม่มี `__file__` และ rebuild ในที่เดิม ซึ่งได้ GLB ตรงกันทุกไบต์)
- `docs/ASSETS.md` ยังเขียนว่า "art · (รอ)" ในแถว synes_kit.glb ซึ่งไฟล์นี้อยู่นอกขอบเขตของงานนี้ จึงให้ lead อัปเดตตอน merge

## Verification log
คำสั่ง: `tools/blender/.venv/bin/python tools/blender/verify_kit.py --rebuild-check` (ตัด log ของ exporter ออกแล้ว)

<details><summary>log เต็ม (293 ok, 0 FAIL)</summary>

```
contract: 40 required nodes, 4 characters
== glTF JSON pass: public/assets/models/synes_kit.glb
  ok    file size 537.6 KB <= 1200 KB
  ok    file size within the 700 KB target
  ok    no Draco/meshopt/texture/light extensions (none used)
  ok    no images
  ok    no textures
  ok    no samplers
  ok    no cameras
  ok    no animations
  ok    no skins
  ok    node `hero` present
  ok    node `hero_body` present
  ok    node `hero_head` present
  ok    node `hero_sword` present
  ok    node `puffcap` present
  ok    node `puffcap_cap` present
  ok    node `puffcap_stem` present
  ok    node `thornling` present
  ok    node `thornling_body` present
  ok    node `prismback` present
  ok    node `prismback_body` present
  ok    node `prismback_shell` present
  ok    node `prismback_horn` present
  ok    node `prismback_legs` present
  ok    node `tree_round` present
  ok    node `tree_round_b` present
  ok    node `tree_pine` present
  ok    node `bush` present
  ok    node `rock_a` present
  ok    node `rock_b` present
  ok    node `crystal_cluster` present
  ok    node `flower_patch` present
  ok    node `mushroom_glow` present
  ok    node `tent` present
  ok    node `campfire` present
  ok    node `signpost` present
  ok    node `lantern_post` present
  ok    node `crystal_pillar` present
  ok    node `crystal_gate` present
  ok    node `lumen_spring` present
  ok    node `fence` present
  ok    node `house_a` present
  ok    node `house_b` present
  ok    node `market_stall` present
  ok    node `fountain` present
  ok    node `ruin_arch` present
  ok    node `ruin_column` present
  ok    node `shop_counter` present
  ok    node `weapon_rack` present
  ok    node `banner` present
  ok    `hero_body` is a child of `hero`
  ok    `hero_head` is a child of `hero`
  ok    `hero_sword` is a child of `hero`
  ok    `hero` is an empty parent node
  ok    `puffcap_cap` is a child of `puffcap`
  ok    `puffcap_stem` is a child of `puffcap`
  ok    `puffcap` is an empty parent node
  ok    `thornling_body` is a child of `thornling`
  ok    `thornling` is an empty parent node
  ok    `prismback_body` is a child of `prismback`
  ok    `prismback_shell` is a child of `prismback`
  ok    `prismback_horn` is a child of `prismback`
  ok    `prismback_legs` is a child of `prismback`
  ok    `prismback` is an empty parent node
  ok    root `banner` sits at the world origin with identity transform
  ok    root `bush` sits at the world origin with identity transform
  ok    root `campfire` sits at the world origin with identity transform
  ok    root `crystal_cluster` sits at the world origin with identity transform
  ok    root `crystal_gate` sits at the world origin with identity transform
  ok    root `crystal_pillar` sits at the world origin with identity transform
  ok    root `fence` sits at the world origin with identity transform
  ok    root `flower_patch` sits at the world origin with identity transform
  ok    root `fountain` sits at the world origin with identity transform
  ok    root `hero` sits at the world origin with identity transform
  ok    root `house_a` sits at the world origin with identity transform
  ok    root `house_b` sits at the world origin with identity transform
  ok    root `lantern_post` sits at the world origin with identity transform
  ok    root `lumen_spring` sits at the world origin with identity transform
  ok    root `market_stall` sits at the world origin with identity transform
  ok    root `mushroom_glow` sits at the world origin with identity transform
  ok    root `prismback` sits at the world origin with identity transform
  ok    root `puffcap` sits at the world origin with identity transform
  ok    root `rock_a` sits at the world origin with identity transform
  ok    root `rock_b` sits at the world origin with identity transform
  ok    root `ruin_arch` sits at the world origin with identity transform
  ok    root `ruin_column` sits at the world origin with identity transform
  ok    root `shop_counter` sits at the world origin with identity transform
  ok    root `signpost` sits at the world origin with identity transform
  ok    root `tent` sits at the world origin with identity transform
  ok    root `thornling` sits at the world origin with identity transform
  ok    root `tree_pine` sits at the world origin with identity transform
  ok    root `tree_round` sits at the world origin with identity transform
  ok    root `tree_round_b` sits at the world origin with identity transform
  ok    root `weapon_rack` sits at the world origin with identity transform
  info  nodes beyond the contract: campfire_flame
  ok    material `stone` (base #B9B4C7), untextured, 186 away from red
  ok    material `bark` (base #8A5A3B), untextured, 126 away from orange
  ok    material `gold` (base #FFC857), untextured, 99 away from orange
  ok    material `lumen` (base #5CF2E6, emissive #5EFFF2), untextured, 287 away from orange
  ok    material `synes_violet` (base #A78BFA), untextured, 207 away from red
  ok    material `leaf` (base #7CCB5E), untextured, 168 away from orange
  ok    material `leaf_dark` (base #3F8F4A), untextured, 199 away from orange
  ok    material `blossom` (base #FF9EC7), untextured, 156 away from red
  ok    material `glow_gold` (base #FFC857, emissive #FFC856), untextured, 98 away from orange
  ok    material `stone_dark` (base #8F89A6), untextured, 163 away from red
  ok    material `crystal_mid` (base #82BEF2, emissive #87C7FF), untextured, 244 away from red
  ok    material `crystal_violet` (base #A78BFA, emissive #A88BFF), untextured, 207 away from red
  ok    material `wood_light` (base #D2A679), untextured, 114 away from orange
  ok    material `cream` (base #FFF3DC), untextured, 229 away from orange
  ok    material `water` (base #8FDDEB), untextured, 253 away from red
  ok    material `navy` (base #33437A), untextured, 208 away from red
  ok    material `skin` (base #FFD9BF), untextured, 190 away from orange
  ok    material `cloth_teal` (base #2BB3A3), untextured, 259 away from orange
  ok    material `hair_auburn` (base #9A4A3A), untextured, 107 away from red
  ok    material `ink` (base #2B2440), untextured, 214 away from red
  ok    material `white` (base #FFFFFF), untextured, 265 away from orange
  ok    material `path` (base #E8C99B), untextured, 153 away from orange
  ok    all primitives are triangle lists
  ok    no UV sets exported (no textures)
  ok    total triangles 15232 <= 60000
  ok    scatter prop `tree_round` 304 tris <= cap 350
  ok    scatter prop `tree_round_b` 328 tris <= cap 350
  ok    scatter prop `tree_pine` 124 tris <= cap 350
  ok    scatter prop `bush` 144 tris <= cap 150
  ok    scatter prop `rock_a` 125 tris <= cap 150
  ok    scatter prop `rock_b` 117 tris <= cap 150
  ok    scatter prop `flower_patch` 146 tris <= cap 150
  ok    scatter prop `mushroom_glow` 138 tris <= cap 150
  ok    scatter prop `crystal_cluster` 128 tris <= cap 150
  ok    `hero` faces +Z (eyes at z=0.26)
  ok    `puffcap` faces +Z (eyes at z=0.32)
  ok    `thornling` faces +Z (eyes at z=0.31)
  ok    `prismback` faces +Z (eyes at z=2.37)
  ok    `prismback_horn` is at the front (+Z 2.28 m)
== Blender re-import pass (fresh factory scene, glTF importer)
  ok    object `hero` imported
  ok    object `hero_body` imported
  ok    object `hero_head` imported
  ok    object `hero_sword` imported
  ok    object `puffcap` imported
  ok    object `puffcap_cap` imported
  ok    object `puffcap_stem` imported
  ok    object `thornling` imported
  ok    object `thornling_body` imported
  ok    object `prismback` imported
  ok    object `prismback_body` imported
  ok    object `prismback_shell` imported
  ok    object `prismback_horn` imported
  ok    object `prismback_legs` imported
  ok    object `tree_round` imported
  ok    object `tree_round_b` imported
  ok    object `tree_pine` imported
  ok    object `bush` imported
  ok    object `rock_a` imported
  ok    object `rock_b` imported
  ok    object `crystal_cluster` imported
  ok    object `flower_patch` imported
  ok    object `mushroom_glow` imported
  ok    object `tent` imported
  ok    object `campfire` imported
  ok    object `signpost` imported
  ok    object `lantern_post` imported
  ok    object `crystal_pillar` imported
  ok    object `crystal_gate` imported
  ok    object `lumen_spring` imported
  ok    object `fence` imported
  ok    object `house_a` imported
  ok    object `house_b` imported
  ok    object `market_stall` imported
  ok    object `fountain` imported
  ok    object `ruin_arch` imported
  ok    object `ruin_column` imported
  ok    object `shop_counter` imported
  ok    object `weapon_rack` imported
  ok    object `banner` imported
  ok    `hero` is an Empty
  ok    `hero_body` is a mesh under `hero`
  ok    `hero_head` is a mesh under `hero`
  ok    `hero_sword` is a mesh under `hero`
  ok    `puffcap` is an Empty
  ok    `puffcap_cap` is a mesh under `puffcap`
  ok    `puffcap_stem` is a mesh under `puffcap`
  ok    `thornling` is an Empty
  ok    `thornling_body` is a mesh under `thornling`
  ok    `prismback` is an Empty
  ok    `prismback_body` is a mesh under `prismback`
  ok    `prismback_shell` is a mesh under `prismback`
  ok    `prismback_horn` is a mesh under `prismback`
  ok    `prismback_legs` is a mesh under `prismback`
  ok    `banner` triangle count matches glTF (190)
  ok    `banner` stands on the ground (min z 0.000)
  ok    `banner` origin is centred (bbox centre 0.00, 0.00)
  ok    `bush` triangle count matches glTF (144)
  ok    `bush` stands on the ground (min z 0.012)
  ok    `bush` origin is centred (bbox centre 0.01, -0.03)
  ok    `campfire` triangle count matches glTF (356)
  ok    `campfire` stands on the ground (min z -0.000)
  ok    `campfire` origin is centred (bbox centre 0.00, -0.00)
  ok    `crystal_cluster` triangle count matches glTF (128)
  ok    `crystal_cluster` stands on the ground (min z -0.000)
  ok    `crystal_cluster` origin is centred (bbox centre -0.02, 0.05)
  ok    `crystal_gate` triangle count matches glTF (610)
  ok    `crystal_gate` stands on the ground (min z 0.000)
  ok    `crystal_gate` origin is centred (bbox centre 0.00, 0.00)
  ok    `crystal_gate` width 6.10 m ~ 6.0 m
  ok    `crystal_gate` height 3.04 m ~ 3.0 m
  ok    `crystal_pillar` triangle count matches glTF (220)
  ok    `crystal_pillar` stands on the ground (min z 0.000)
  ok    `crystal_pillar` origin is centred (bbox centre 0.00, 0.00)
  ok    `crystal_pillar` height 4.02 m ~ 4.0 m
  ok    `crystal_pillar` diameter 1.48 m ~ 1.6 m
  ok    `fence` triangle count matches glTF (188)
  ok    `fence` stands on the ground (min z 0.000)
  ok    `fence` origin is centred (bbox centre 0.00, -0.02)
  ok    `flower_patch` triangle count matches glTF (146)
  ok    `flower_patch` stands on the ground (min z 0.000)
  ok    `flower_patch` origin is centred (bbox centre -0.03, 0.02)
  ok    `fountain` triangle count matches glTF (346)
  ok    `fountain` stands on the ground (min z 0.000)
  ok    `fountain` origin is centred (bbox centre 0.00, 0.00)
  ok    `hero` triangle count matches glTF (1556)
  ok    `hero` stands on the ground (min z 0.000)
  ok    `hero` origin is centred (bbox centre 0.02, 0.10)
  ok    `hero` height 1.52 m ~ 1.5 m
  ok    `house_a` triangle count matches glTF (946)
  ok    `house_a` stands on the ground (min z 0.000)
  ok    `house_a` origin is centred (bbox centre 0.00, -0.13)
  ok    `house_b` triangle count matches glTF (476)
  ok    `house_b` stands on the ground (min z 0.000)
  ok    `house_b` origin is centred (bbox centre 0.00, -0.09)
  ok    `lantern_post` triangle count matches glTF (194)
  ok    `lantern_post` stands on the ground (min z 0.000)
  ok    `lantern_post` origin is centred (bbox centre 0.00, 0.00)
  ok    `lumen_spring` triangle count matches glTF (352)
  ok    `lumen_spring` stands on the ground (min z -0.000)
  ok    `lumen_spring` origin is centred (bbox centre 0.06, 0.06)
  ok    `lumen_spring` diameter 2.22 m ~ 2.0 m
  ok    `market_stall` triangle count matches glTF (670)
  ok    `market_stall` stands on the ground (min z 0.000)
  ok    `market_stall` origin is centred (bbox centre 0.00, -0.15)
  ok    `mushroom_glow` triangle count matches glTF (138)
  ok    `mushroom_glow` stands on the ground (min z 0.000)
  ok    `mushroom_glow` origin is centred (bbox centre 0.04, 0.03)
  ok    `prismback` triangle count matches glTF (2582)
  ok    `prismback` stands on the ground (min z 0.000)
  ok    `prismback` origin is centred (bbox centre 0.00, -0.21)
  ok    `prismback` height 3.09 m ~ 3.0 m
  ok    `prismback` length 5.18 m ~ 5.0 m
  ok    `puffcap` triangle count matches glTF (1700)
  ok    `puffcap` stands on the ground (min z -0.000)
  ok    `puffcap` origin is centred (bbox centre 0.00, 0.07)
  ok    `puffcap` height 0.98 m ~ 1.0 m
  ok    `rock_a` triangle count matches glTF (125)
  ok    `rock_a` stands on the ground (min z -0.000)
  ok    `rock_a` origin is centred (bbox centre 0.06, 0.04)
  ok    `rock_b` triangle count matches glTF (117)
  ok    `rock_b` stands on the ground (min z -0.000)
  ok    `rock_b` origin is centred (bbox centre -0.03, -0.07)
  ok    `ruin_arch` triangle count matches glTF (634)
  ok    `ruin_arch` stands on the ground (min z -0.000)
  ok    `ruin_arch` origin is centred (bbox centre 0.14, -0.09)
  ok    `ruin_column` triangle count matches glTF (304)
  ok    `ruin_column` stands on the ground (min z -0.000)
  ok    `ruin_column` origin is centred (bbox centre 0.27, 0.19)
  ok    `shop_counter` triangle count matches glTF (554)
  ok    `shop_counter` stands on the ground (min z 0.000)
  ok    `shop_counter` origin is centred (bbox centre 0.00, -0.01)
  ok    `signpost` triangle count matches glTF (246)
  ok    `signpost` stands on the ground (min z -0.000)
  ok    `signpost` origin is centred (bbox centre 0.00, -0.05)
  ok    `tent` triangle count matches glTF (164)
  ok    `tent` stands on the ground (min z -0.000)
  ok    `tent` origin is centred (bbox centre 0.00, -0.01)
  ok    `thornling` triangle count matches glTF (888)
  ok    `thornling` stands on the ground (min z 0.000)
  ok    `thornling` origin is centred (bbox centre 0.00, 0.08)
  ok    `thornling` height 0.96 m ~ 0.9 m
  ok    `tree_pine` triangle count matches glTF (124)
  ok    `tree_pine` stands on the ground (min z 0.000)
  ok    `tree_pine` origin is centred (bbox centre 0.07, 0.00)
  ok    `tree_round` triangle count matches glTF (304)
  ok    `tree_round` stands on the ground (min z 0.000)
  ok    `tree_round` origin is centred (bbox centre 0.04, 0.01)
  ok    `tree_round_b` triangle count matches glTF (328)
  ok    `tree_round_b` stands on the ground (min z 0.000)
  ok    `tree_round_b` origin is centred (bbox centre 0.02, -0.04)
  ok    `weapon_rack` triangle count matches glTF (502)
  ok    `weapon_rack` stands on the ground (min z 0.000)
  ok    `weapon_rack` origin is centred (bbox centre 0.00, 0.00)
  ok    `hero_head` pivot at the neck (z 0.86)
  ok    `hero_sword` pivot at the grip in the right hand (-0.29, -0.14, 0.52)
  ok    `hero_sword` blade points up from the grip (tip z 1.29)
  ok    `puffcap_cap` pivot where cap meets stem (z 0.56)
  ok    `prismback_horn` pivot on the forehead (y -2.28)
== determinism: build_kit.py twice into temp files
  ok    two builds are byte-identical (2237c1cf39610620)
  ok    committed GLB matches a fresh build (2237c1cf39610620)
| asset | tris | W x L x H (m) |
|---|---:|---|
| `banner` | 190 | 1.04 x 0.50 x 3.46 |
| `bush` | 144 | 1.46 x 1.06 x 0.88 |
| `campfire` | 356 | 1.17 x 1.20 x 0.66 |
| `crystal_cluster` | 128 | 1.15 x 1.18 x 1.36 |
| `crystal_gate` | 610 | 6.10 x 1.82 x 3.04 |
| `crystal_pillar` | 220 | 1.48 x 1.48 x 4.02 |
| `fence` | 188 | 2.06 x 0.19 x 1.08 |
| `flower_patch` | 146 | 0.77 x 0.89 x 0.34 |
| `fountain` | 346 | 3.00 x 2.85 x 2.26 |
| `hero` | 1556 | 1.27 x 0.93 x 1.52 |
| `house_a` | 946 | 4.13 x 4.02 x 4.32 |
| `house_b` | 476 | 4.15 x 4.33 x 5.22 |
| `lantern_post` | 194 | 0.46 x 0.46 x 2.81 |
| `lumen_spring` | 352 | 2.20 x 2.22 x 0.96 |
| `market_stall` | 670 | 2.55 x 1.38 x 2.50 |
| `mushroom_glow` | 138 | 0.75 x 0.49 x 0.55 |
| `prismback` | 2582 | 3.93 x 5.18 x 3.09 |
| `puffcap` | 1700 | 0.91 x 0.87 x 0.98 |
| `rock_a` | 125 | 1.96 x 1.48 x 1.02 |
| `rock_b` | 117 | 1.74 x 1.33 x 0.68 |
| `ruin_arch` | 634 | 3.67 x 2.01 x 3.85 |
| `ruin_column` | 304 | 2.01 x 1.58 x 2.36 |
| `shop_counter` | 554 | 2.37 x 0.92 x 1.39 |
| `signpost` | 246 | 1.23 x 0.43 x 1.97 |
| `tent` | 164 | 2.67 x 2.62 x 2.14 |
| `thornling` | 888 | 0.93 x 0.85 x 0.96 |
| `tree_pine` | 124 | 2.57 x 2.63 x 4.10 |
| `tree_round` | 304 | 2.65 x 2.03 x 3.40 |
| `tree_round_b` | 328 | 2.20 x 1.83 x 3.37 |
| `weapon_rack` | 502 | 1.64 x 0.60 x 1.72 |
| **total** | **15232** | GLB 537.6 KB |
VERIFY PASSED (0 warnings)
```
</details>
