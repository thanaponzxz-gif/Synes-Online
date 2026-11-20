# Baseline 2-B: สภาพปัจจุบันของภาพ (วัดและเก็บภาพเท่านั้น)

ทีม B วัดและบันทึก **ไม่มีข้อเสนอดีไซน์ งบประมาณ หรือวัสดุใหม่** (CLAUDE.md ข้อ 0 / ADR-007) ข้อมูลนี้ให้ทีม A ใช้ออกแบบงานพื้น/ผนัง/หิน และงบ texture/draw call ต่อไป
สร้างโดย `node tools/qa/baseline.mjs` (ข้อมูลดิบ `docs/qa/baseline-2b/baseline.json`, ตารางเต็มอยู่ท้ายไฟล์นี้) · บิลด์ที่วัด: `dist/` ของ branch `lane/baseline-2b` (ไม่แก้โค้ดเกม)

## 1. สิ่งที่วัด / ข้อจำกัด
- วัด 5 ฉาก x 3 tier (`?q=low|medium|high`, ล็อก tier ผ่าน localStorage จึงไม่มี adaptive resolution) ที่ viewport 844x390, deviceScaleFactor 2, Chromium มือถือจำลอง
- **ไม่ใช่เครื่องจริง:** Chromium + SwiftShader (GPU ซอฟต์แวร์) ใน container **FPS ใช้เทียบกันเองเท่านั้น ห้ามอ่านเป็นตัวเลขของมือถือ** (วัด 5 วินาทีหลังถ่ายภาพ โดยปล่อยให้ sim วิ่งต่อ) ตัวเลข draw calls / triangles / geometries / textures / programs อ่านจาก `renderer.info` ของเฟรมล่าสุด (รวมรอบเงาใน tier high) จึงไม่ขึ้นกับ GPU
- **iPhone / Android เครื่องจริง: ยังไม่ได้ทดสอบ** (ไม่มี FPS, หน่วยความจำ GPU จริง, หรือสี/ภาพจริงของจอ)
- ฉากถูกจัดผ่าน `window.__synes` โดยหยุด sim แล้วเดินทีละ tick เอง: camp = จุดเริ่ม (0,1.5) · trail = (1,-9.5) · clearing = (3,-33.5) จนมีวงเตือน 2 วง (ผ่านไป 44 tick) · spring = `?start=boss` (เช็กพอยต์น้ำพุ) · boss = ผู้เล่นที่ (-2,-70) เดินจน boss เริ่ม phase 1 และมีวงเตือนท่า `slam` (208 tick) ทุกฉากเลือดผู้เล่นถูกตั้งเป็น 99999 เพื่อไม่ให้แพ้ จึง **หลอดเลือดในภาพแสดง 99999** (ไม่ใช่ UI จริง) และคำแนะนำ "ลากนิ้ว..." ที่เห็นในภาพคือ hint ของเกมที่ยังไม่ถูกปิด
- ตัวเลขไม่ได้วัดบน tier ตามที่ `guessTier()` เลือกเอง แต่บังคับด้วย `?q=` ตัวเลขหน่วยความจำ texture เป็นค่าประมาณจากขนาด (w x h x 4 x 1.33 ถ้ามี mipmap) ไม่ใช่ค่าที่ GPU จัดสรรจริง
- "texture ใน scene graph" นับเฉพาะที่ผูกกับ material ของ mesh ที่มองเห็น; `renderer.info.memory.textures` ใน tier high เป็น 4 เพราะรวม depth map ของเงา 2 ใบ (ไม่ใช่ texture วัสดุ) shadow map ประมาณ 1024x1024 x 4 B = 4.00 MB แสดงแยกในตาราง
- ผู้เล่นไม่เห็นภาพ tier low ที่ canvas 844x390 (pixelRatio 1) ที่ dpr 2 เป็นการขยายภาพโดยเบราว์เซอร์ จึงดูนุ่มกว่า medium (1266x585) และ high (1688x780)

## 2. ตัวเลขหลัก (draw calls / triangles / texture)

| ฉาก | tier | draw calls | triangles | texture ใน scene (ประมาณ MB) | shadow map |
|---|---|---:|---:|---:|---|
| clearing | low | 86 | 33,965 | 0.69 | ปิด |
| clearing | medium | 92 | 52,925 | 2.68 | ปิด |
| clearing | high | 176 | 125,495 | 2.68 | เปิด (4.00 MB) |
| boss | low | 89 | 31,649 | 0.69 | ปิด |
| boss | medium | 95 | 50,609 | 2.68 | ปิด |
| boss | high | 170 | 118,733 | 2.68 | เปิด (4.00 MB) |

ข้อเท็จจริงที่เห็นจากการวัด: ทุกฉากมี texture ใน scene แค่ 2 ใบ คือ (1) **ground canvas texture** (RGBA, mipmap, สร้างจาก canvas 2D ขนาด groundRes/2 x groundRes = 256x512 / 512x1024 / 512x1024 สำหรับ low / medium / high) บน plane เดียวใน `view.buildLevel` และ (2) texture เงากลมนุ่ม 64x64 (blob shadow) ของ `fx.ts` ส่วนรูปทรงอื่นทั้งหมด (ต้นไม้ หิน ผลึก ตัวละคร บอส) ไม่มี texture เป็นสีล้วน (MeshLambertMaterial + flatShading, สี/emissive จาก GLB kit `kit: true` ในทุกการวัด) พื้นนอกขอบ (plane 400x400) เป็นสีเดียว ไม่มี texture
ไฟล์ GLB ไม่มี texture ฝัง (GLTFLoader ไม่สร้าง texture ใดใน scene)

## 3. ไฟล์ต้นทางของพื้น/ผนัง/หิน/หน้าผา (สิ่งที่การทดสอบวัสดุจะแตะ)
| ส่วน | ไฟล์ | อะไร |
|---|---|---|
| พื้นหลัก (ground) | `src/render/view.ts` `buildLevel()` (~บรรทัด 109-139) | canvas 2D วาดไล่สีหญ้า (`grassA/grassB`) + จุดสุ่ม + ทางเดินจาก `LEVEL.walkable` (สามชั้น `pathEdge`, `path`) + วงรูนลานบอส -> `CanvasTexture` บน `PlaneGeometry(68x116)` + `MeshLambertMaterial({map})` |
| ขนาด texture พื้นต่อ tier | `src/render/quality.ts` | `groundRes` low 512 / medium 1024 / high 1024 (texture จริง = groundRes/2 x groundRes) |
| พื้นนอกขอบ | `src/render/view.ts` ~บรรทัด 140 | plane 400x400 สีเดียว (`MeshLambertMaterial({color: grassA})`) |
| สีพื้น/ทาง/รูน | `src/render/tones.ts` | โทน (`grassA`, `grassB`, `path`, `pathEdge`, `rune`, fog, `treeMix`) ที่ buildLevel อ่าน |
| รูปร่างทางเดิน | `shared/data/level.ts` (`LEVEL.walkable`, `gates`, `pillars`, `spring`) | ข้อมูลฉากที่ sim ใช้ ภาพพื้นวาดตามข้อมูลนี้ (ห้ามเปลี่ยนค่าโดยไม่ผ่านดีไซน์: กระทบการเดิน) |
| พื้นของ tone study | `src/study.ts` | canvas 1024x1024 อีกชุดสำหรับแกลเลอรีโทน (ไม่ใช่ในเกมจริง) |
| ขอบลานบอส (ผนังหิน) | `src/render/view.ts` ~บรรทัด 153-158 | วงแหวน rock_a / crystal_cluster 30 ชิ้นรอบลาน (instanced) เว้นช่องทางเข้าด้านใต้ ไม่มีผนังหรือหน้าผาจริง ไม่มี collision เพิ่ม |
| หิน/พุ่มรอบทาง (scatter) | `src/render/view.ts` ~บรรทัด 141-176 | `rock_a`, `bush`, `flower_patch`, `crystal_cluster`, `mushroom_glow`, ต้นไม้ตาม `decoDensity` สร้างเป็น `InstancedMesh` ผ่าน `nearFade()` (patch shader แบบ dither หน้ากล้อง) |
| prop หิน/ซาก/รั้ว ในโค้ด (fallback) | `src/render/models.ts` ตาราง prop (`rock_a`, `rock_b`, `ruin_arch`, `ruin_column`, `fence`, `crystal_gate`, `crystal_pillar`, `lumen_spring`, `fountain`) | รูปทรง procedural + `lam(color)` (Lambert ไม่มี texture) ใช้เมื่อ GLB โหลดไม่ได้และสำหรับ prop ที่ไม่มีใน kit |
| โมเดลจริงใน GLB | `tools/blender/build_kit.py` (`build_rock_a`, `build_rock_b`, `build_crystal_cluster`, `build_tree_*`, `build_prismback`, วัสดุ `stone` `#B9B4C7` / `stone_dark` `#8F89A6`) -> `dist/assets/models/synes_kit.glb` | วัสดุทั้งหมดเป็นสีเดียวต่อวัสดุ (ไม่มี UV texture) `loadKit()` ใน `models.ts` สลับ PBR เป็น `MeshLambertMaterial` ตอนโหลด |
| ตัวละครและ HUD ที่เกี่ยวกับสีพื้น | `src/render/fx.ts` | blob shadow texture 64x64, วงเตือน (`ShaderMaterial`), particles |

## 4. ภาพ (JPEG q80, 1688x780 พิกเซล ที่ dpr 2)
ไฟล์ใน `docs/qa/baseline-2b/` ชื่อ `<ฉาก>-<tier>.jpg`: camp / trail / clearing / spring / boss x low / medium / high (15 ไฟล์)
ภาพ boss และ clearing มีวงเตือนบนจอ (ดูหมายเหตุ setup ในตารางด้านล่าง)

## 5. ตารางเต็ม (สร้างอัตโนมัติ)

### Download sizes (dist/)

| file | raw KB | gzip KB |
|---|---:|---:|
| assets/index-C1Wu9jiZ.js | 741.1 | 197.4 |
| assets/index-DEgg5_qv.css | 10.8 | 3.3 |
| assets/models/synes_kit.glb | 537.6 | 192.2 |
| assets/study-CxVln3H-.js | 5.2 | 2.2 |
| index.html | 7.6 | 2.8 |
| **total** | 1302.2 | 397.9 |

### Renderer (renderer.info after the last frame)

| scene | tier | canvas px | pixelRatio | draw calls | triangles | geometries | textures | programs | shadows | FPS (5 s, SwiftShader, relative) |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|
| camp | low | 844x390 | 1 | 65 | 28587 | 62 | 2 | 8 | off | 36.9 |
| trail | low | 844x390 | 1 | 67 | 31067 | 86 | 2 | 8 | off | 33.3 |
| clearing | low | 844x390 | 1 | 86 | 33965 | 101 | 2 | 9 | off | 29.7 |
| spring | low | 844x390 | 1 | 48 | 27651 | 47 | 2 | 8 | off | 28.5 |
| boss | low | 844x390 | 1 | 89 | 31649 | 76 | 2 | 9 | off | 18.4 |
| camp | medium | 1266x585 | 1.5 | 71 | 47547 | 68 | 2 | 8 | off | 9.6 |
| trail | medium | 1266x585 | 1.5 | 70 | 49883 | 78 | 2 | 8 | off | 10 |
| clearing | medium | 1266x585 | 1.5 | 92 | 52925 | 104 | 2 | 9 | off | 9.7 |
| spring | medium | 1266x585 | 1.5 | 54 | 46611 | 53 | 2 | 8 | off | 10.4 |
| boss | medium | 1266x585 | 1.5 | 95 | 50609 | 82 | 2 | 9 | off | 8.8 |
| camp | high | 1688x780 | 2 | 130 | 114117 | 77 | 4 | 12 | on | 4.5 |
| trail | high | 1688x780 | 2 | 136 | 117965 | 78 | 4 | 12 | on | 4.4 |
| clearing | high | 1688x780 | 2 | 176 | 125495 | 104 | 4 | 13 | on | 4.3 |
| spring | high | 1688x780 | 2 | 103 | 111299 | 74 | 4 | 12 | on | 6.1 |
| boss | high | 1688x780 | 2 | 170 | 118733 | 96 | 4 | 13 | on | 5 |

### Texture memory (scene-graph textures, est. w x h x 4 x (mipmaps ? 1.33 : 1))

| scene | tier | unique scene textures | est. MB | shadow map est. MB | largest texture |
|---|---|---:|---:|---|---|
| camp | low | 2 | 0.69 | - | canvas 256x512 (Mesh:PlaneGeometry) |
| trail | low | 2 | 0.69 | - | canvas 256x512 (Mesh:PlaneGeometry) |
| clearing | low | 2 | 0.69 | - | canvas 256x512 (Mesh:PlaneGeometry) |
| spring | low | 2 | 0.69 | - | canvas 256x512 (Mesh:PlaneGeometry) |
| boss | low | 2 | 0.69 | - | canvas 256x512 (Mesh:PlaneGeometry) |
| camp | medium | 2 | 2.68 | - | canvas 512x1024 (Mesh:PlaneGeometry) |
| trail | medium | 2 | 2.68 | - | canvas 512x1024 (Mesh:PlaneGeometry) |
| clearing | medium | 2 | 2.68 | - | canvas 512x1024 (Mesh:PlaneGeometry) |
| spring | medium | 2 | 2.68 | - | canvas 512x1024 (Mesh:PlaneGeometry) |
| boss | medium | 2 | 2.68 | - | canvas 512x1024 (Mesh:PlaneGeometry) |
| camp | high | 2 | 2.68 | 4.00 (1024x1024) | canvas 512x1024 (Mesh:PlaneGeometry) |
| trail | high | 2 | 2.68 | 4.00 (1024x1024) | canvas 512x1024 (Mesh:PlaneGeometry) |
| clearing | high | 2 | 2.68 | 4.00 (1024x1024) | canvas 512x1024 (Mesh:PlaneGeometry) |
| spring | high | 2 | 2.68 | 4.00 (1024x1024) | canvas 512x1024 (Mesh:PlaneGeometry) |
| boss | high | 2 | 2.68 | 4.00 (1024x1024) | canvas 512x1024 (Mesh:PlaneGeometry) |

### Mesh / material inventory (visible meshes)

| scene | tier | meshes | instanced meshes (instances) | transparent | opaque | shadow casters | hidden meshes | unique materials | by material type (meshes) |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| camp | low | 172 | 24 (350) | 24 | 148 | 146 | 45 | 82 | MeshLambertMaterial (opaque): 148; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9 |
| trail | low | 172 | 24 (350) | 24 | 148 | 146 | 45 | 82 | MeshLambertMaterial (opaque): 148; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9 |
| clearing | low | 174 | 24 (350) | 26 | 148 | 146 | 45 | 84 | MeshLambertMaterial (opaque): 148; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9; ShaderMaterial (transparent): 2 |
| spring | low | 127 | 24 (350) | 19 | 108 | 106 | 90 | 81 | MeshLambertMaterial (opaque): 108; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 4 |
| boss | low | 133 | 24 (350) | 25 | 108 | 111 | 85 | 87 | MeshLambertMaterial (opaque): 108; MeshLambertMaterial (transparent): 20; MeshBasicMaterial (transparent): 4; ShaderMaterial (transparent): 1 |
| camp | medium | 175 | 27 (611) | 24 | 151 | 146 | 45 | 82 | MeshLambertMaterial (opaque): 151; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9 |
| trail | medium | 175 | 27 (611) | 24 | 151 | 146 | 45 | 82 | MeshLambertMaterial (opaque): 151; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9 |
| clearing | medium | 177 | 27 (611) | 26 | 151 | 146 | 45 | 84 | MeshLambertMaterial (opaque): 151; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9; ShaderMaterial (transparent): 2 |
| spring | medium | 130 | 27 (611) | 19 | 111 | 106 | 90 | 81 | MeshLambertMaterial (opaque): 111; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 4 |
| boss | medium | 136 | 27 (611) | 25 | 111 | 111 | 85 | 87 | MeshLambertMaterial (opaque): 111; MeshLambertMaterial (transparent): 20; MeshBasicMaterial (transparent): 4; ShaderMaterial (transparent): 1 |
| camp | high | 175 | 27 (769) | 24 | 151 | 146 | 45 | 82 | MeshLambertMaterial (opaque): 151; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9 |
| trail | high | 175 | 27 (769) | 24 | 151 | 146 | 45 | 82 | MeshLambertMaterial (opaque): 151; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9 |
| clearing | high | 177 | 27 (769) | 26 | 151 | 146 | 45 | 84 | MeshLambertMaterial (opaque): 151; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 9; ShaderMaterial (transparent): 2 |
| spring | high | 130 | 27 (769) | 19 | 111 | 106 | 90 | 81 | MeshLambertMaterial (opaque): 111; MeshLambertMaterial (transparent): 15; MeshBasicMaterial (transparent): 4 |
| boss | high | 136 | 27 (769) | 25 | 111 | 111 | 85 | 87 | MeshLambertMaterial (opaque): 111; MeshLambertMaterial (transparent): 20; MeshBasicMaterial (transparent): 4; ShaderMaterial (transparent): 1 |

### Texture inventory per scene x tier

**camp / low** (player at start (0,1.5), sim idle)

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 256x512 | RGBA/UnsignedByte | yes | 681.0 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**trail / low** (player on trail (1,-9.5))

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 256x512 | RGBA/UnsignedByte | yes | 681.0 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**clearing / low** (player in clearing (3,-33.5), stepped 44 ticks, 2 telegraph(s))

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 256x512 | RGBA/UnsignedByte | yes | 681.0 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**spring / low** (start=boss checkpoint (spring), sim idle)

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 256x512 | RGBA/UnsignedByte | yes | 681.0 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**boss / low** (arena, bossStarted=true, phase=1, stepped 208 ticks, 1 telegraph(s) [slam])

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 256x512 | RGBA/UnsignedByte | yes | 681.0 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**camp / medium** (player at start (0,1.5), sim idle)

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**trail / medium** (player on trail (1,-9.5))

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**clearing / medium** (player in clearing (3,-33.5), stepped 44 ticks, 2 telegraph(s))

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**spring / medium** (start=boss checkpoint (spring), sim idle)

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**boss / medium** (arena, bossStarted=true, phase=1, stepped 208 ticks, 1 telegraph(s) [slam])

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**camp / high** (player at start (0,1.5), sim idle)

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**trail / high** (player on trail (1,-9.5))

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**clearing / high** (player in clearing (3,-33.5), stepped 44 ticks, 2 telegraph(s))

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**spring / high** (start=boss checkpoint (spring), sim idle)

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |

**boss / high** (arena, bossStarted=true, phase=1, stepped 208 ticks, 1 telegraph(s) [slam])

| texture | slot | source | size | format/type | mipmaps | est. KB | used by (meshes) | materials |
|---|---|---|---|---|---|---:|---|---|
| (unnamed) | map | canvas | 512x1024 | RGBA/UnsignedByte | yes | 2723.8 | 1: Mesh:PlaneGeometry | MeshLambertMaterial |
| (unnamed) | map | canvas | 64x64 | RGBA/UnsignedByte | yes | 21.3 | 1: Mesh:CircleGeometry | MeshBasicMaterial |
