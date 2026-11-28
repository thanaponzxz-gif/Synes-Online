# DES-010 · ปูหินหลังคริสตัลแทนภาพปริซึมแบ็ก

**ทีม A / Codex · 2026-11-28 · ฉบับ 1 · ตอบ REQ-010 Q1–Q6**

## 1. Q1 — รุ่นแรกที่เร็วที่สุด

**เลือกเปลี่ยนภาพ/rig/ท่าแสดงผลของบอสเฉพาะ `ninja-roam-1` ก่อน คงบอสชื่อ “ปริซึมแบ็ก ผู้พิทักษ์ทุ่ง” และกติกาสี่ท่าเดิมทั้งหมด** ใช้ร่างปูหิน ผลึกม่วง–ลูเมน ก้ามใหญ่ และขาเดินตามต้นทาง แทนโมเดล kit เดิม ไม่เพิ่ม phase หรือสกิลใหม่ในรอบแรก เอฟเฟกต์ตาม §4 ทำให้ท่าเดิมอ่านเป็นการโจมตีของปูได้

- sim ยังคง `kind='prismback'`, attack IDs `sweep/slam/charge/shard`, HP/radius/ความเร็ว/การเลือกท่า/รางวัลเดิม ห้ามเพิ่ม hitbox ที่ก้ามหรือใช้ mesh ชนผู้เล่น
- renderer เลือก `visualProfile='prismback_crab_v01'` เฉพาะ ruleset นี้ ไม่เปลี่ยน tuning hash/input log/server ruleset เพราะเป็น presentation อย่างเดียว บันทึกรุ่น/hash asset แยกในหลักฐาน QA
- `combat-1/2`, `combo-A/B/C`, `roam-1`, log ไม่มี ruleset และทางเข้าเผยแพร่เดิมยังใช้ปริซึมแบ็กเดิม ค่าเริ่ม production/review gate ไม่เปลี่ยนเพราะงานเปลี่ยนภาพ
- ชื่อสกิล/คำแนะนำใน UI คงเดิมใน C1 แม้ `sweep` จะใช้ก้ามร่วมกับเขาหน้าผากแสดงการกวาด ไม่เพิ่มแถว UI หรือเปลี่ยนชื่อใน `shared/` เพื่อแต่งภาพ
- หัวใจการต่อสู้คง **อ่านท่า → หลบ/หลบเพอร์เฟกต์ → ตีสวนตอนเสียหลัก ✦ → ล่อชนเสา** ไม่มี parry/จับล็อก/ตัดก้าม/โล่กระดองหรือจุดอ่อนใหม่

จุดส่งที่นับว่ารุ่นแรกแทนบอสได้คือ **C1: rig และ 10 คลิปครบ + สี่ท่าเดิม + VFX ตามแบบ + QA ในฉากจริง** หากต้นแบบผลิตเสร็จทีละส่วน ส่ง C0 สองคลิป idle/walk ให้เจ้าของดูในเครื่องมือส่วนตัวได้ก่อน แต่ C0 เป็นดูภาพ/ท่าอย่างเดียว ไม่ใช้ idle ปลอมเป็นการโจมตีและไม่นับว่าทดแทนบอสในการต่อสู้สำเร็จ

**ไม่ต้องให้เจ้าของตอบคำถามใหม่ก่อนทีม B เริ่ม Engineering ตามขอบเขตนี้** หากภายหลังต้องการเปลี่ยนความเสียหาย ระยะ ลำดับท่า/phase หรือเพิ่มสกิล ให้ทีม A ออกแบบและเจ้าของตัดสินแยก พร้อม ruleset ใหม่ ไม่แทรกการเปลี่ยนสมดุลไว้กับการนำโมเดลเข้าเกม

## 2. Q2 — คำตัดสินต้นทางและสิ่งที่ตรวจจริง

**รับ `mon_boss_crab_raw_v01.glb` เป็นต้นทางผลิต C1 ได้ ไม่ต้องขอเจนตัวใหม่** รูปทรงอ่านเป็นปูหินหลังผลึกได้ครบและมีพื้นที่ให้ทำก้าม/ขา ไม่ใช่ไฟล์เกมสำเร็จ ยังไม่รับรองคุณภาพ skin หรือความเป็นต้นฉบับ/สิทธิ์จากรูปร่างอย่างเดียว

### 2.1 หลักฐานที่ทีม A ตรวจเอง

- อ่าน GLB/accessors/material/embedded images จริง และ import ใน **Blender 5.3.0 แบบ headless process ใหม่** เพื่ออ่าน geometry/bbox ไม่เชื่อม Blender ที่เปิดอยู่ ไม่ save/แก้ raw ไม่ทำ rig/reduction/export ในรอบนี้
- ดู PNG ส่วนตัวที่ทีม B ส่งทั้งหน้า ข้าง หลัง และสามในสี่ เห็นก้ามสองข้าง เขาหน้าผาก ตาลูเมน กระดองหินติดมอส และกลุ่มผลึกด้านหลัง ขาเดินหลักสองคู่ตามภาพ ไม่เพิ่มขาใหม่เพื่อให้เท่าปูจริง ไม่พบหัวซ้ำ/ฐาน/ตัวอักษรหรือโลโก้ที่อ่านได้จากสี่ภาพนี้
- ภาพข้าง/หลังแสดงรูปทรงผลึกสูงมากกว่าเกราะลำตัว ต้องควบคุมการบังผู้เล่น ไม่แก้กล้องเพื่อให้โมเดลผ่าน

| รายการจากไฟล์ | ผลตรวจ |
|---|---|
| SHA-256 | `05b6130b99ec0fc9a5e807696551671c3635af53b1767f1c09c8f220de72ce2d` |
| ขนาด | 43,246,240 bytes ประมาณ 41.24 MiB |
| Geometry | 49,934 tris / 38,663 accessor vertices; 1 mesh / 1 primitive / 1 material; POSITION/NORMAL/TEXCOORD_0 |
| Rig/clip | ไม่มี skin/animation |
| Texture | PNG ฝัง 4096² สามภาพ baseColor/normal/metallicRoughness |
| วัสดุ raw | double-sided และ `KHR_materials_specular` factor 2/2/2; ไม่ส่งค่าดิบนี้ต่อ runtime |
| ขนาดหลัง node transform ใน Blender (X/Y/Z) | 0.69646 × 0.88819 × 0.78901 หน่วย glTF; ยังไม่ใช่ขนาดบอสในเกม |
| จุดกลางเท้าประมาณใน Blender | (0.001564, −0.030927, ≈0) จาก bbox ของ vertices ช่วงล่าง 8% ของความสูง |
| รัศมีแนวราบรวมทุก vertex จากจุดกลางเท้านั้น | 0.500123 หน่วยไฟล์ |
| ตรวจผิวด้วย position weld ความละเอียด 1e−6 | 24,923 unique positions, 1 connected component, boundary edges 0, non-manifold edges 0; ไม่รับรองว่าไม่มีผิวซ้อน/ทะลุหรือพร้อม deform |

generator `Khronos glTF Blender I/O v4.0.43` เป็นข้อมูล exporter ไม่ได้พิสูจน์บริการ/รุ่น/วันที่เจนหรือ license ไม่คัดลอกภาพส่วนตัวเข้าเอกสารสาธารณะและไม่อ้างว่าตรวจเงื่อนไขบริการแล้ว

### 2.2 ขนาดและขอบเขตภาพที่ใช้ผลิต

1. กำหนดหน้า **glTF +Z = Blender −Y** ให้ตา/ก้าม/เขาหน้าผากหันไปตาม facing เดิมของ actor; origin ที่พื้นกลางเท้า สเกล object/bones = 1 ไม่มี negative scale
2. รักษาสัดส่วนต้นทาง ใช้ uniform scale หลังลบจุดกลางเท้า ให้ **รัศมีแนวราบรวมทุก vertex ใน bind/idle ≤1.80 ม.** ค่า scale เริ่มต้นจาก raw ประมาณ **3.59912** ได้กว้างประมาณ **2.507 ม.**, ลึก **3.197 ม.**, สูงถึงยอดผลึก **2.840 ม.** เป็นเป้าประเมินจาก geometry ยังไม่ได้ผลิตจริง หลังลด mesh ต้องวัด/จัด origin อีกครั้ง
3. กายภาพของ sim คงวง r **1.90 ม.** ไม่ขยาย collider ตามผลึกหรือย่อ r ให้ตามความกว้างกระดอง แถบพุ่ง **4.64 ม. = 2×(1.90+0.42)** ยังคงเป็นแถบเดิม ไม่ใช้ความกว้าง mesh แทน
4. ท่าแสดงผลระหว่างโจมตีปลายก้าม/ขาเลยรัศมี bind ได้ แต่แนวราบรวม **≤2.10 ม.**; การเลยนี้เป็นภาพเท่านั้น ไม่มี collider เพิ่ม ท่าพุ่งคงก้ามชิดให้ r ภาพ ≤1.80 ม. เพื่อไม่สื่อว่าชนถึงข้างนอกแถบ
5. วาง debug วง r1.90 และขอบแถบ4.64 เทียบหน้า/หลัง/ข้าง รวมตำแหน่งตัวผู้เล่น r0.42 ที่ขอบชนก่อนรับไฟล์จริง ไม่ใส่วง debug เป็นวงถาวรในเกม หากต้องบิดสัดส่วน/ขยาย hitbox เพื่อให้พอดี ให้ส่งทีม A ไม่ทำเอง
6. ผลึกเป็นชิ้นแข็งติด shell ไม่ใช้ transparency/refraction/bloom/โครงกระดูกแยกทุกแท่ง มอสไม่ทำ alpha cards หรือผ้า simulation

## 3. Q3 — เส้นทางผลิตและสัญญาส่งต่อ

### 3.1 ขอบเขต Codex / งบ asset

ทำบนสำเนาใน headless Blender 5.3 เท่านั้นเมื่อแบบเข้าสู่ขั้นผลิตตาม ADR-011: weld จุดที่ตรงกันโดยรักษา UV, ลด/เก็บ topology ข้อก้ามและขา, เก็บ normal/atlas, แยกผิวข้อต่อที่ผสานผิดเฉพาะจำเป็น ไม่สร้างตัวใหม่จากศูนย์ ไม่เรียกบริการเจนเพิ่ม

| รายการ | เป้า / เพดาน C1 |
|---|---|
| Tris รวมทุกชิ้น | เป้า **8,000**, เพดาน **10,000** ไม่ส่ง raw49k หรือเก็บ raw ซ่อนไว้ใน GLB |
| Mesh/material | **1 skinned mesh / 1 material / 1 drawn primitive** รวมก้าม ขา มอส ผลึก ไม่ใช้ material เฉพาะทุกผลึก |
| Skin | custom rig **22 bones** ด้านล่าง, สูงสุด 4 influences/vertex; FLOAT sum tolerance ≤1e−4 หรือ normalized UINT8 รวม255/UINT16รวม65535พอดี; ไม่มี vertex ไร้น้ำหนัก |
| Texture | baseColor PNG1024² sRGB + packed ORM PNG512² linear (R=AO,G=roughness,B=metallic), ฝังครบ; ไม่มี normal/emissive/alpha map ใน C1 |
| วัสดุ | OPAQUE single-sided; ผิวด้านหลังของก้าม/ขาทำ geometry จริงในงบ ไม่แก้การหายด้วย doubleSided; ไม่ใช้ extensions/Draco/meshopt/KTX2 |
| Runtime bytes | เป้า ≤1.5 MiB; **เพดาน 2 MiB ก่อน HTTP compression** รวมสิบคลิป/skin/texture |
| คลิป | 30 samples/s รวม key ปลาย, glTF root translation0/rotationคง rest/scale1; ไม่มี constraint/IK/controller ที่ต้องให้เกมแก้เอง |
| Draw | 1 color-pass draw + shadow pass ตามระบบเดิม ไม่มี outline/additional shell pass |

rig **22 bones**: `root`, `body`, `shell`, `head` (4); `arm_l`, `claw_l`, `pincer_l`, `arm_r`, `claw_r`, `pincer_r` (6); ขา `leg_fl/leg_fr/leg_bl/leg_br` แต่ละชุด `_upper`, `_lower`, `_foot` (12) ตีความ l/r เป็นด้านของตัวปู ไม่ใช่ด้านผู้ชม root อยู่พื้น; body ลูก root, shell/head/arm/ต้นขาเป็นลูก body, claw ลูก arm, pincer ลูก claw, ขาแต่ละสายต่อ upper→lower→foot ผลึก weight shell, ตา/เขา weight head, มอส weight ตามเกราะที่เกาะ ไม่มี spring bones

socket เป็น empty node ไม่ใช่ skin joint: `socket_fx_ground` ลูก root, `socket_fx_shell` ลูก shell ที่ฐานผลึกกลาง, `socket_fx_claw_l/r` ลูก claw ข้างนั้นที่ปลายก้าม และ `socket_fx_head` ลูก head ทุกตัว scale1; ลง offsets/แกนที่วัดจากไฟล์ส่งจริงใน manifest

### 3.2 คลิปขั้นต่ำ C1 — สิบท่า ไม่เพิ่มกลไก

เวลาในคอลัมน์ clip เป็น **template ของ pose**; การทำผล/ความยาว state จริงใช้ sim ตาม §3.3 ไม่บังคับ windup ให้เท่ากันทุก phase

| Clip | Tick / loop | Pose/marker/การใช้ |
|---|---|---|
| `idle` | 48 / loop | ก้ามต่ำ แบกเกราะหนัก body ขึ้นลง ≤0.02 ม.; ไม่แสดงไฟอันตราย |
| `walk` | 24 / loop | สองคู่ขาสลับแตะพื้น reference2.0ม./s, แตะคู่สลับ0/12; cadenceจากระยะจริง (phase2 speed2.4จึงเร็ว1.2เท่า); หยุดเดินชนผนังไม่เล่นก้าวฟรี |
| `sweep` | 51 / once | windup0–30 บิด head/ก้ามขวาถอยแล้วกวาดก้ามผ่านหน้า; `impact:[30]`, hold30→31, recover30–51; ไม่หมุน root/facing ตามก้าม |
| `slam` | 60 / once | windup0–30 ยก body/สองก้าม แล้วทุบพร้อมกัน; `impact:[30]`, hold30→31, recover30–60; body liftสูงสุด0.35ม. ไม่มี root lift/iframe |
| `charge_windup` | 30 / once | ก้ามชิดเป็นเกราะ body ย่อสูงสุด0.15ม.; `release:[30]`; ไม่เลื่อน root ถอยหลังด้วย clip |
| `charge` | 12 / loop | ก้ามชิด เขาหันหน้า ขาก้าวถี่; reference15ม./s; actorเดินจากsimเท่านั้น พุ่งได้ไกล18ม.ตามกฎเดิม |
| `shard_cast` | 45 / once | cast0–27 ยกกระดอง/ผลึกและก้าม, `castAccent:[9]` เป็นภาพสะสมพลัง; recover27–45; **ไม่มี impact marker ที่ใช้แทนวันตกของห้าวง** |
| `stunned` | 30 / loop | bodyทรุด ก้ามอ้าเล็กน้อย ก้าวไม่ได้; poseตั้งแต่key0สื่อเสียหลัก วนตามเวลามึนจริง ไม่รอวนจบถึงคืนตัว |
| `roar` | 33 / once | ใช้ตั้งใจร่วมกันกับ intro/phase2: bodyยืด ก้ามแยก ผลึกชู; retimeกับstateจริง ไม่เพิ่มเวลา/พื้นที่โจมตีจาก roar |
| `down` | 12 / once+hold | ลด bodyพับขา/ก้าม ไม่กระเด็น ไม่แตกชิ้นถาวร ไม่เลือด; holdท้ายก่อนจางออกตามอายุภาพเดิม0.45s |

C0 ดูอย่างเดียวใช้โครง/หน่วยเดียวกันแต่ allowlistเพียง `idle`, `walk`; ห้ามให้ไฟล์สองคลิปผ่าน allowlistของ `stage=combat` ค่อยส่ง C1 ครบ10ก่อนแทนใน battle review

### 3.3 Clock/state mapping ที่ทีม B ต้องใช้

**อ่านจาก `world` ของ ruleset ที่กำลังเล่น ไม่ import ENEMIES กลางมาเขียนทับ snapshot ของ NinjaWorld** ค่าต่อไปนี้ตรวจตรงกับ NINJA_ENEMIES ปัจจุบันและเป็นรายการต้องคง ไม่ใช่คำสั่งให้แก้ shared:

| รายการ | คงเดิม |
|---|---|
| r / HP / phase2At | 1.90 ม. / 1000 / 50% |
| เดิน phase1/2 / พุ่ง | 2.0 / 2.4 / 15 ม./s |
| sweep | cone r5.2, cosHalf0.5 (มุมรวม120°), inner disc1.2; windup0.95s, damage18 |
| slam | circle r4.6; windup1.25s, damage26 |
| charge | line length18,width4.64; windup1.0s, damage24; `area=false` ทำผลจากระยะชนจริงระหว่าง charge |
| ฝนผลึก | **5 วง** r1.5, damage12ต่อวง; จุดแรกตามผู้เล่นตอนเลือกท่า อีก4จุดจากsim; windup `(1.0+i×0.22)×mul` s, i=0..4 |
| phase2 windup | mul0.85 สำหรับ sweep/slam/chargeปกติ/ฝน; chargeที่ถูกบังคับหลังฝนใช้ **1.35s ไม่คูณ0.85** |
| ลำดับ phase2 | 2ท่า → ฝน → chargeตามเงื่อนไขเสาที่ยังมีชีวิตของsim; คงการงอกเสา/roar1.1sเดิม |
| Recover | sweep0.7s, slam1.0s, cast0.6sหลังcast0.9s, หลังมึน0.3s; เลือกท่าใหม่/phaseจริงจากstateเท่านั้น |
| มึน/ตีสวนใน Ninja | ชนเสา78 tick / พุ่งพลาด27 tick, damage multiplier1.5, ได้ meterจากเสา/ตีตอนมึนตาม DES-007 เดิม ไม่ใช้ timerของclip |

**แยก telegraph impact กับ actor-state transition:** โค้ดลด timer วงใน step ที่สร้างวง แต่ลด state timer คนละช่วง จึงห้ามตั้งภาพ impact ตอน `windup → recover` เสมอ หรือแปลง0.95sเป็นจำนวน tickด้วยการปัดแล้วเชื่อว่าเท่ากฎจริง

ตัวเล่นภาพใหม่ทำ snapshot ก่อน/หลัง **ทุก sim step** ของ actor และ telegraph ที่มีอยู่แล้ว ไม่เพิ่ม events/fieldsใน shared/server เพื่องานนี้:

1. ให้ processed tick = `world.tick−1` หลังstep; sampleภาพที่ `renderTick=world.tick−2+alpha` ตรงกับการ interpolateตำแหน่งก่อน/หลังstep เก็บประวัติstate/หมายเลขtickของเหตุการณ์และseekตามrenderTick ไม่ตัดไปstateล่าสุดก่อนเวลาในภาพ ไม่ใช่อายุเริ่มที่rAFมองเห็นครั้งแรก
2. ผูกคำเตือนตาม `tele.id/owner/atk.id` (เก็บ origin/facing/r/w/cos/total ที่simส่ง) สำหรับฝนใช้ทั้งห้าวงตามid ไม่ใช้วงแรกแทนวงอื่น
3. คาด deadlineเพื่อ retimeภาพจาก **จำนวนครั้งที่ลบ TICK=1/30 แล้ว t<=0 จริง** ของค่าremainingที่อ่านได้ ไม่ใช้ Math.round/ceil+epsilon: helperฝั่งrenderนับด้วย `for(n=0; left>0; n++) left-=TICK`; `impactTick=processedTick+n` สำหรับวงที่เพิ่ง observe หลังstep; ใช้helperเดียวกันหา `totalSteps` จากtele.total แล้ว `startTick=impactTick−totalSteps+1` จึงหาprogressด้วย `clamp((renderTick−startTick)/(impactTick−startTick),0,1)` (ถ้าspan≤0ให้ปลายท่า) วิธีนี้ทำสำเนาเพียงนาฬิกาภาพ ไม่ตัดสินdamage
4. ยืนยัน impact เพื่อวาดเอฟเฟกต์เมื่อวงมีในsnapshotก่อนstepและหายหลังstep โดยค่าเดิม `t−TICK<=0` จริง; ถ้าหายจากcancel/player-down/respawn/reset/เจ้าของวงตายให้ล้างโดยไม่สร้างimpactที่ค้าง วาดเศษแตกได้เมื่อวงหมดแม้ผู้เล่นหลบพ้น แต่ hit spark/เลข damage ใช้ผล hitจริงเท่านั้น อายุimpact=`renderTick−impactTick` ไม่เริ่มภาพก่อนtickนั้น
5. sweep/slam retime template0→30 ตั้งแต่startถึง **tick impact จริงของวง**; ณ tickนั้น poseอยู่marker30 ถ้าวงหมดแต่actorยังwindupให้hold30 จนstate recover แล้ว map30→51/60 ด้วย progressของrecoverที่อ่านจากsim (รวมpose hold30→31ที่อบไว้) ไม่เพิ่มเวลารับinputหรือหยุดsim
6. charge_windup retime0→30ให้releaseตรง **การเข้า state charge จริง** ไม่ใช้การหายของแถบเตือนเป็นการชน; charge loopหยุดทันทีที่simstunned/dead rootมาจากตำแหน่งที่interpolateจริง
7. shard_cast map0→27ด้วยcast0.9sที่simแสดง แล้ว27→45ด้วยrecover; วงอาจตกขณะบอสrecoverหรือเตรียมท่าถัดไปอยู่ ให้แต่ละ id ดำเนินภาพของตัวเองต่อ ไม่รอcast animation/ไม่ปล่อยห้าวงพร้อมกัน
8. stunnedเริ่ม/จบตรงstate มึน78/27tick; ขึ้น ✦ เมื่อ state=stunned เท่านั้น กระดูกชูผลึกไม่ได้เป็น weak-point/hitbox; downเริ่มจากdeathจริง ภาพdown0→12ใน0.4s visible timeแล้วholdจนระบบจางเดิม0.45s หยุดนาฬิกาภาพเมื่อpause/hidden ไม่ไล่เล่นเวลาที่หายไป
9. Priority: dead > stunned > roar/intro > charge > windup/cast/recover ของท่าปัจจุบัน > walk/idle; ไม่มีการเลือกท่าจากความใกล้ของmesh/เหตุการณ์ที่animationปล่อยเอง seekทันทีเมื่อโหลดช้า ไม่ replay VFX ที่ผ่านแล้ว
10. fadeเดิน/idle3tick, เข้าท่า1.5tick, stun/down≤1tick, กลับidle/walk2.4tick; phase lockทุกคลิปทำให้fadeไม่เลื่อนmarker ปิด procedural branchเดิมเฉพาะcrab profile ไม่ซ้อน old bob/scale/horn rotation กับmixer ไม่ให้ old shell-emissive logicแก้วัสดุPBRใหม่โดยไม่ตั้งใจ

### 3.4 ไฟล์ส่งต่อ/manifest

ไฟล์ source/.blend/texture/ภาพ/full production notes **อยู่ `assets/_inbox/` ที่ignoreทั้งหมด** ตรวจignoreก่อนส่ง ไม่ทำURLในpublicให้เกมโหลด raw ไม่มี assetใหม่ผลิตในรอบเอกสารนี้

| ไฟล์ | เนื้อหา |
|---|---|
| `mon_boss_crab_preview_v01.glb` + `.manifest.json` | C0ดูอย่างเดียวสองคลิป ถ้าส่งต้นแบบก่อน; ไม่ใช่ทางลัดเข้าcombat |
| `mon_boss_crab_v01.glb` + `mon_boss_crab_v01.manifest.json` | C1หนึ่งskin/22joints/10clips/textureฝังครบ พร้อมSHA/bytesจริง |
| `mon_boss_crab_work_v01.blend` | สำเนาผลิตส่วนตัว topology/rig/clip แก้ต่อได้ ห้ามแทนraw |
| `tex_boss_crab_basecolor_v01.png`, `tex_boss_crab_orm_v01.png` | atlasและORMตามขนาด ไม่โหลดซ้ำจากภายนอกเมื่อฝังGLBแล้ว |
| `concept_boss_crab_turnaround_v01.png`, `concept_boss_crab_posecheck_v01.png` | ภาพหน้า/ข้าง/หลัง + markerกวาด/ทุบ/พุ่ง/มึน และภาพdebugวงชน/แถบพุ่งส่วนตัว |
| `mon_boss_crab_v01.md` + `.inspect.json` | ขั้นตอน/เครื่องมือ/รุ่น/ที่มาที่มี/สิ่งที่ไม่ทราบ, hashesก่อน–หลัง, ตัวเลขงบ, ผลload/pose/สี, ข้อจำกัดจริง |

ใช้ common reader/hash/PNG/skin validation และ GLTFLoader/lifecycleแนวเดียวกับเซย์รินได้ แต่ **ห้ามส่งปูเข้า contract `synes.hero-manifest/1` หรือใส่45bones/20clipsปลอมให้ผ่าน** ทีม Bแยก boss spec/allowlistจากhero ไม่แก้ความเข้มของตัวตรวจเซย์ริน

contractใหม่ `schema='synes.boss-manifest/1'`, `assetId='boss_crab'`, `version='v01'`, `profileId='prismback_crab_v01'`, `simKind='prismback'`, `rulesets=['ninja-roam-1']`, `stage='preview'|'combat'`, `units='meter'`, `axes={up:'+Y',forward:'+Z'}`, `rootMotion=0`, `status='REVIEW'` (statusในmanifestไม่แทนเจ้าของอนุมัติ)

fieldบังคับเพิ่มเติม: `output={file,bytes,sha256}`; `clips=[{name,ticks,loop,markers,poseHolds?,holdLast?,phases}]` ตรงตาราง3.2/allowlistตามstage; `bones`22ชื่อและparent; `sockets`ชื่อ/parent/positionM/axesจริง; `measurements={tris,vertices,primitives,materials,joints,bindBoundsM,horizontalRadiusM,bytes,textureSizes}`; `source={file,sha256,originStatus}`; `tools`ชื่อ/รุ่น/วันที่; `motionProfile={fps:30,referenceSpeeds:{walk:2,charge:15},clock:'telegraph-and-state',rootMotion:0}`

ชื่อphasesที่ใช้ตรงกัน: sweep `{windup:[0,30],recover:[30,51]}`, slam `{windup:[0,30],recover:[30,60]}`, charge_windup `{windup:[0,30]}`, shard_cast `{cast:[0,27],recover:[27,45]}`; idle/walk/charge/stunned ใช้ `{loop:[0,ticks]}` และ roar/down ใช้ `{once:[0,ticks]}` `markers`ว่างเมื่อไม่มีmarkerตามตาราง ห้ามเติมdamage callbackจากfieldเหล่านี้

measurementsมาจากGLBที่ส่ง ไม่คัดลอกเป้าหมายเป็นผลวัด validatorblockเมื่ออ่านไม่ได้/เกินbytes/มีexternal URIหรือrequiredextension/shaไม่ตรง/missingclipหรือdurationไม่ตรง/ชื่อboneผิด; ตรวจงบและน้ำหนัก/OPAQUE/ORM/หน่วยด้วยไฟล์จริงให้ผ่านทั้งหมดก่อนปิดC1 ห้ามเชื่อ `status` หรือ `measurements` ที่ไฟล์บอกโดยไม่วัด

## 4. Q4 — ท่า/VFX/วงเตือนและงบ

### 4.1 คงวงเตือนทั้งหมด

- อ่าน `world.tele` จริง คงตำแหน่ง ทิศ พื้นที่ ค่าcos วงใน1.2 ช่วงเวลา/phase และจำนวนห้าวงตามกฎเดิม **ไม่วาดตามปลายก้ามหรือขนาดclip** ไม่แก้สีทองในข้อความ tip ให้เป็นสีวงใหม่หรือเปลี่ยนความหมายของวงเดิม
- แดง **#FF3355** และส้ม **#FF7A1A** ใช้กับคำเตือนการโจมตีเท่านั้น ไม่ย้อมเกราะ/มอส/ผลึก/ดวงตา/เศษหินเป็นสองสีนี้
- วงเตือนวาดทับตัว/ขา/ก้าม/ผลึก/VFX: depthTest=false, renderOrder10ตาม ADR-005 ไม่เอาmeshใหม่ไปวาดทับ warning; หากเส้นขอบใต้บอสถูกfadeจนอ่านไม่ได้ให้แก้เฉพาะpresentationของcrab profileให้คำเตือนอ่านครบ ไม่ลดพื้นที่วง ไม่แก้sim
- ปูบังผู้เล่นให้วัสดุของinstanceจางเหลือ **28%** รวมก้าม/มอส/ผลึก โดยไม่เพิ่มoutline/pass คงวงใต้เท้าผู้เล่น/HP/UIตามเดิม; กล้องFOV/ระยะ/pull-backเดิม ไม่ซูมเพื่อซ่อนปลายผลึก

### 4.2 Palette และเอฟเฟกต์ที่เลือก

หิน **#526A70**, ข้อต่อ **#353643**, มอส **#7B8F43**, ลายทองหม่น **#B49B64**, ผลึก **#A78BFA** กับปลายลูเมน **#5CF2E6**; ค่าตั้งต้นใช้คุมภาพจากtexture ไม่ใช่บังคับทุกtexelเป็นสีล้วน รักษารูปทรง/ลายต้นทางที่เจ้าของเลือกแต่ทำความสะอาดรายละเอียดnoiseตามงบ ไม่เพิ่มข้อความ/โลโก้

ไม่มี bloom/point light/refraction/fullscreen flash/camera shakeใหม่ ไม่มี global hit-stop ทุกภาพเกิดฝั่งrender ไม่เพิ่มdamageหรือpauseนาฬิกาต่อสู้

| ท่า/เหตุการณ์ | Medium | Low |
|---|---|---|
| sweepหมดวงจริง | เส้นโค้งlumenบางตามพัดเดิมที่r5.2, หนา0.06ม., y0.12ม., opacityเริ่ม0.45→0ใน **4tick**; เศษแสงไม่เกิน4ชิ้น | ไม่สร้างเส้นโค้งเพิ่ม; เศษlumen2ชิ้น **3tick** |
| slamหมดวงจริง | แหวนลูเมนr4.6ทั้งวงปรากฏพร้อมกัน หนา0.10ม., opacity0.45→0ใน **5tick**, เศษหินสูง≤0.45ม.ไม่เกิน8ชิ้น | ไม่สร้างแหวนเพิ่ม; เศษ4ชิ้น **4tick** |
| chargeระหว่างเคลื่อนจริง | ฝุ่นหินสี **#9AA79D** ทุกระยะ0.75ม.ที่เดินจริง สูง≤0.30ม., อายุ **8tick**, อยู่พร้อมกัน≤12ชิ้น ไม่สร้างฝุ่นเมื่อblocked/หยุด | ทุก1.50ม., อายุ **6tick**, พร้อมกัน≤6ชิ้น |
| ฝนผลึกแต่ละวง | ผลึกม่วงหนึ่งชิ้น/วง ลดYจาก5.5→0.10ม. linearใน **6tickสุดท้ายก่อนdeadlineจริง** ลงตรงtele.xz; เศษimpact≤3ชิ้น/จุด อายุ5tick | หนึ่งชิ้น/วงใน **3tickสุดท้าย**, เศษimpact≤1ชิ้น อายุ3tick |
| ชนเสาจนมึน | ใช้ pillar-break ที่เกิดจริงเป็นตัวเริ่มเศษหิน ไม่สร้างเสาแตกจากระยะก้าม; ใช้ ✦ เดิม3ดวงสี **#FFC857** วนเหนือยอดผลึก0.18ม., รัศมี0.55ม. เห็นเฉพาะstunned | คง ✦ อ่านได้เหมือนกัน ลดเศษหินเหลือครึ่ง |
| phase2/roar | ก้ามแยก/ผลึกชูตามclip + particlesลูเมน4ชิ้นที่shell socket อายุ9tick; คงข้อมูลphaseในHUD ไม่ใช้วงแดง/ส้มแบบไม่ทำdamageเพิ่ม | ใช้clip/HUDเดิม ไม่เพิ่มparticles |

แหวนslamเป็น flashทั้งพื้นที่พร้อมกัน **ไม่ใช่คลื่นขยายที่ทำdamageเมื่อเดินทางถึง** ฝนใช้deadlineของแต่ละวง ไม่ปล่อยเอฟเฟกต์ลงพื้นที่ไม่ได้มีtelegraphจริง และยกเลิกตัวที่คำเตือนถูกล้างโดยไม่หมดเวลา เศษ/ฝุ่น gravityภาพ −9.81ม./s²ได้แต่ไม่เป็นprojectileหรือcollider

### 4.3 งบวาด/การลดระดับ

- boss color1draw + shadow1ตามระบบเดิม; **VFXบอสเพิ่มจาก baselineเดิม ≤2draw Medium / ≤1draw Low** รวมเอฟเฟกต์ใหม่ทุกท่าพร้อมกัน ไม่ใช่บวกงบแยกต่อหนึ่งวงฝน
- Medium ใช้ batchเส้น/แหวนหนึ่งชุด + instancedผลึก/เศษ/ฝุ่นหนึ่งชุด (สีต่อinstance); Lowละเส้น/แหวนเหลือbatchเศษ/ผลึกหนึ่งชุด ไม่มีmesh/materialต่อparticleและไม่castShadowให้VFX
- cosmetic instancesรวม **≤32 Medium / ≤12 Low**; เมื่อเต็มลดฝุ่น→เศษแตก→เส้นตกแต่งก่อน ไม่ลดวงเตือนทั้งห้า/✦/HPหรือจำนวนการทำผล ไม่มีการปล่อยเอฟเฟกต์ซ้ำจากทั้งstate transitionกับtelegraph expiry
- ดาวมึน/วงเตือนเดิมนับใน baseline; ถ้าทีม Bเปลี่ยนวิธีbatchดาวต้องวัดยอดรวมจริง ไม่อ้างว่าเป็นของเดิมเพื่อซ่อนdrawใหม่
- เป้า backlogรวมฉาก <40draw ยังเป็นเป้าปรับปรุง ไม่ใช่หลักฐานว่าปัจจุบันทำได้แล้ว C1ต้องรักษางบที่อนุมัติของโปรไฟล์เดิม (DES-007 Low≤56/Medium≤60) และวัดdeltaฉากเดียวกัน; หาก baselineเองเกินให้รายงานแยก ไม่ตัดwarningเพื่อให้จำนวนสวย

## 5. Q5 — แบ่งงาน ลำดับ ด่านอนุมัติ และเกณฑ์รับ

### 5.1 งานคู่ขนาน

| ขั้น | Codex / ทีม A | ทีม B |
|---|---|---|
| ก่อนผลิต | DESนี้/ตรวจrawครบแล้ว; ส่งเจ้าของพิจารณาแบบตามADR-011 ไม่ผลิตassetในรอบนี้ | เริ่มแยกboss loader/spec/clock/VFX/render profileและtestsด้วยfixture/โมเดลเดิมที่มีสิทธิ์ได้ ไม่แตะตัวเลขshared |
| เมื่อแบบผ่าน/มีใบงานผลิต | Blenderheadlessสำเนาใหม่: weld/ลดงบ/atlas/rig22/weight เริ่มidle/walkให้เห็นรูปเร็วได้ แล้วทำสิบคลิปบนrigเดิม | QA loader file-input/manifestใหม่, skin/PBR/fade, state snapshots/expiry/controller, ตัวนับbudget ไม่สร้าง rig/clip/textureศิลป์แทนCodex |
| C0ถ้าส่งก่อน | ภาพprivateและสองคลิป ไม่อ้างว่าcombatพร้อม | เปิดดูส่วนตัวให้เจ้าของ ไม่เล่นรอบจริง/ไม่ใช้fake attack |
| C1ครบ | ส่งGLB/manifest/ภาพ/รายงานจริง; ทีม Aตรวจท่า/telegraph markerและความชัด | บิลด์QAส่วนตัวเฉพาะNinja เลือกไฟล์จากเครื่อง ไม่ส่งbinary/rawไปservice/public; ทดสอบการต่อสู้เดิม/งบ/รีสตาร์ตและส่งหลักฐาน |
| หลังตรวจ | แก้จุดที่เห็นจากไฟล์จริง แล้วให้เจ้าของอนุมัติruntimeรุ่น/hashจริง | PMลงทะเบียนasset/สถานะและจัดmergeตามสิทธิ์; การขึ้นPagesหรือcommitbinaryไม่ได้อนุมัติอัตโนมัติจากDESนี้ |

เครื่องมือคงของที่ติดตั้งแล้ว: Blender5.3แบบbackgroundแยกprocess, Node/Three.js/GLTFLoaderและตัววัดเดิม ไม่ใช้บัญชี/เครดิต/บริการ/แพ็กเกจใหม่ Codexรุ่น6.1ขึ้นไปผลิตศิลป์ตามADR-013; ทีม B SonnetทำEngineering/QA, Opusตรวจผล/จุดเสี่ยง ตามการแบ่งงานเดิม ไม่ย้ายงานเกมให้Codexในรอบผลิตasset

เพื่อความเร็ว **ไม่ต้องรอสิบคลิปก่อนทีม BเตรียมEngine/ไม่ต้องรอEngineก่อนCodexทำrig** และส่งผลC0ทันทีเมื่อไฟล์จริงผ่าน ไม่ตั้งretopoสมบูรณ์/สกิลใหม่/งานกันคัดลอกเป็นเส้นทางบังคับก่อนดูบอสใหม่ เวลาแรงงานยังไม่ได้วัดจากrigนี้ จึงไม่รับประกันวันส่งจากขนาดrawเพียงอย่างเดียว

### 5.2 ด่านอนุมัติ/ข้อมูลที่ยังไม่ทราบ

- รอบนี้เป็นแบบและการตรวจraw ไม่ใช่อนุมัติassetสำเร็จรูป งานผลิตตามADR-011เริ่มเมื่อแบบอนุมัติ ส่วนEngineeringตามแบบด้วยfixtureเดินคู่ขนานได้
- ที่มา/สิทธิ์ของปูยัง **UNKNOWN** ตาม REQ ไม่อ้างว่าคำสั่งข้ามการรอของเซย์รินพิสูจน์licenseของปูแล้ว และไม่อ้างว่าเห็นรูปร่างแล้วตรวจความเป็นต้นฉบับครบ PMบันทึกข้อมูลที่มี/สิ่งที่ไม่ทราบตามจริง ไม่ขอบัญชี ไม่เรียกบริการ และไม่ตั้งการขอprovenanceซ้ำเป็นงานที่หยุดการเตรียมต้นแบบโดยอัตโนมัติ
- เมื่อส่งไฟล์จริงให้เจ้าของดู ให้แนบสถานะข้อมูลข้างต้นกับหลักฐานQAเพื่ออนุมัติassetในครั้งเดียว หากมีปัญหาหรือข้อจำกัดที่พบจริงส่งเฉพาะส่วนนั้นให้เจ้าของตัดสิน ไม่สร้างข้อสรุปสิทธิ์แทนเจ้าของหรือขยายการอนุญาตไปเผยแพร่เอง
- C0/C1 REVIEWทดสอบในเครื่องส่วนตัวได้ตามขั้นตรวจasset ไม่ส่งรางวัล/ความก้าวหน้าจริง คงreview gateและข้อความบิลด์ทดสอบเดิมของNinja การใช้จริงต้องเจ้าของAPPROVEDไฟล์รุ่น/hashนั้น; การเผยแพร่/Pagesต้องคำสั่งแยก ไม่มีเหตุให้ขอเจ้าของอนุมัติไฟล์ที่ยังไม่ผลิตเพื่อหลีกเลี่ยงการสร้างหลักฐานQA

### 5.3 เกณฑ์ตรวจรับ C1

1. **ไฟล์:** ทุก check ของboss contractผ่านจากbinaryจริงตาม §3.1/3.4; rawhashก่อน–หลังตรง; imageครบในGLB ไม่มีอัปโหลด/URIภายนอก ไม่มีไฟล์Heroหรือปูหลุดเข้าgitจากการส่งหลักฐาน
2. **ผิว/สเกล:** หน้า+Z, เท้าพื้น0±0.01ม., bind footprint≤1.80ม.และจุดสูงสุดเป้า2.84±0.10ม.; รูปทรงก้าม/ขาครบตามsource ไม่เกิดเส้นแหลมจากskinที่รอยต่อเมื่อก้ามยก/พุ่ง/ทรุด ไม่มีทะลุกระดองอย่างเห็นชัดในกล้องจริง ไม่มีการขยายcolliderเพื่อซ่อนจุดนี้
3. **ท่า:** 22bones/10clipsจริง, loopต้นท้ายต่าง≤1e−4ในtranslation/rotationที่เทียบอย่างถูกต้อง, hold30→31ของsweep/slamเหมือนกัน; rootmotion0ทุกsample 30Hz ทั้งคลิป; ดัดก้าม/ขาแล้วความยาวท่อนไม่stretchเกิน1% เท้าท่ายืนไม่จมเกิน0.01ม.
4. **เวลา/ผล:** seeded runเดิมก่อน–หลังใช้inputเดียวกันให้HP/damage/phase/stun78/27/pillars/meter/victory/reward/hashผลเหมือนเดิม; markerimpact/FXของsweep/slamตรงtickหมดวงจริง รวมphase2/forcedcharge1.35; ฝนห้าวงตรงid/ตำแหน่ง/deadline ไม่มีdamageจากmixer ไม่มีเอฟเฟกต์ซ้ำ/ตกหลังcancelหรือrespawn
5. **ความชัด:** ที่844×390และ390×844 เห็นwarningขอบ/วงใน/แถบ4.64ครบเมื่อทับก้าม/ผลึกและขณะbossใกล้กล้อง; ผู้เล่นที่ถูกบังเห็นผ่าน28% fadeครบทั้งตัวบอส ✦อยู่เหนือยอดผลึกและไม่ขึ้นผิดstate; ทดสอบslam,sweep,chargeและฝนห้าวงพร้อมอัลติเซย์ริน ไม่เพิ่มกล้อง/FOV/สีสงวนในasset
6. **หลักฐานมือถือ:** ต้องมีภาพ/ผลบนAndroidและiPhoneจริงก่อนอ้างว่าผ่านมือถือ ถ้ายังไม่มีให้เขียนยังไม่ได้ทดสอบ; ส่งPCreviewให้เจ้าของดูได้ก่อน ไม่ถือว่าPC/SwiftShaderแทนมือถือได้
7. **ประสิทธิภาพ:** วัดbefore/afterในฉาก/seed/กล้อง/qualityเดียวกัน รวมphase2ฝนห้าวง+ผู้เล่น; warmupอย่างน้อย300เฟรม เก็บอย่างน้อย600เฟรม active; delta drawsตาม §4.3, p95CPUเฉพาะcontroller+mixerบอสเป้า≤0.5ms/เฟรมบนPC, total-framep95เพิ่ม≤5%บนอุปกรณ์เป้าหมาย วัดซ้ำbaselineเพื่อแยกnoiseและระบุเครื่อง ถ้ายังสรุปไม่ได้ให้เปิดเกณฑ์perfไว้ ไม่รายงานผ่านด้วยตัวเลขNodeอย่างเดียว
8. **Lifecycle:** load→clone→สลับstage→death/victory→restart20ครั้ง ไม่มีmixer/geometry/material/texture/FXpoolเพิ่มต่อรอบ ต้องstop/uncacheและdispose instanceโดยไม่ทำลายresourceที่ยังแชร์; โหลดไฟล์ผิด/คลิปขาดให้rejectและคงบอสสำรองเดิมพร้อมบอกในQA ไม่รายงานfallbackเป็นC1ผ่าน
9. **ความเข้ากันได้:** golden replayเก่า39รายการไม่เปลี่ยนและentry productionเดิมไม่เปลี่ยน; testsต้องแสดงว่าprofileปูไม่ถูกเลือกในrulesetเก่า ไม่แตะshared/serverให้hashใหม่เพราะการเปลี่ยนภาพ

## 6. Q6 — ปริซึมแบ็กและ asset เดิม

คง `synes_kit.glb`, `prismback_body/shell/horn/legs`, `makePrismback()` และproceduralเส้นทางเก่าไว้ให้rulesetเก่าและfallbackที่ลงทะเบียนแล้ว **ไม่ลบ/แทนไบต์เก่า ไม่เปลี่ยนชื่อkindเป็นcrabในsim** ปูเป็นร่างใหม่ของบอสตัวเดิมในNinjaเท่านั้น C1ผ่านไม่ได้แปลว่างานย้ายบอสทุกrulesetเสร็จ การเก็บassetเดิมไม่บังคับให้นินจาต้องโหลดrenderบอสเก่าซ้อนกับปู

## 7. สิ่งที่รอเจ้าของ

ไม่มีคำถามเรื่องชื่อ/ท่า/ตัวเลข/ไฟล์ใหม่ที่ขวางEngineeringรุ่นแรก ใช้ขอบเขต §1 ได้เลย ยังต้องมีการอนุมัติแบบก่อนผลิตและอนุมัติruntimeจริงตามขั้นassetเดิม ไม่ขอสมัคร/เครดิต/เจนซ้ำ

**คำถามตัวเลือกสำหรับรอบหลัง C1 เท่านั้น (ไม่ต้องรอตอบเพื่อเริ่มรุ่นแรก):** หลังได้ลองภาพปูแล้วต้องการ **A — คงสี่ท่าเดิมและเก็บภาพต่อ (เร็ว/แนะนำ)** หรือ **B — ออกแบบท่า/สกิลปูใหม่ (ต้องแบบและrulesetใหม่ ใช้เวลาเพิ่ม)**? การย้ายภาพไปrulesetอื่นให้เจ้าของสั่งแยก ไม่ทำพร้อมงานนี้เอง

## 8. บทเรียน

- จำนวนmesh/materialเดียวและผิวปิดไม่ได้หมายความว่าก้าม/ขาแยกพร้อมrig ต้องดูข้อต่อหลังลดและskinจริงก่อนประกาศผ่าน
- timerวงเตือนกับtimerstateเดิมเริ่มลดคนละจังหวะ ภาพรุ่นใหม่ต้องยึดtickหมดวงจริงและidของแต่ละวง ไม่แปลงsecondsเป็นtickด้วยการปัดแล้วเปลี่ยนกฎsimให้ตามclip
- ค่าbboxจากaccessorก่อนnode rotationไม่ใช่ความสูงในเกม ต้องใช้transformจริงและรัศมีแนวราบจากจุดกลางเท้าก่อนเทียบcollider/แถบพุ่ง

## 9. ผลการทำ (ทีม B)

## 10. ทบทวนรอบ 2

**ทีม A / Codex · 2026-11-28 · ตามคำสั่งเจ้าของ “ส่งทีม A แก้ท่าก่อน”** ส่วนนี้แทนค่าที่ขัดกันใน §3.2/§4/§5.3 เฉพาะภาพปู ไม่เปลี่ยน sim/ruleset/กล้อง ไฟล์ยัง **REVIEW** ไม่ใช่อนุมัติใช้จริงหรือขึ้นหน้าทดสอบมือถือ

### 10.1 ผลตรวจและขอบเขตหลักฐาน

**ทีม A ตรวจเอง:** อ่าน [ผลทีม B](DES-010-teamB.md) และภาพจริง844×390ใน inbox โดยเฉพาะ02-walk/03-sweep-windup/05-slam-windup/06-slam-impact/14-fade เห็นว่าช่วงง้าง v01 คล้ายเดินจริง จึงแก้ท่า/น้ำหนัก/สีเป็น v02 หลังเครื่องดับตรวจใหม่พบรายงาน pose/Three เดิมอ้างhashก่อนแก้น้ำหนัก และroarกางเกิน2.10ม.; แก้แล้วรันใหม่ครบ ไม่ใช้ accepted flag ของไฟล์เก่า

**ทีม B รายงาน ไม่ใช่ทีม A รันซ้ำ:** tests584/584, seeded sim comparison, lifecycle, draws/CPU และ QA ในเกม v01 ตาม DES-010-teamB §2 มือถือ/ความชัดพร้อมอัลติเซย์ริน/perfอุปกรณ์เป้าหมายยังเปิด การผ่านตัวตรวจ asset ไม่แทนผลเหล่านี้

คำตัดสิน: ส่ง v02 ให้ทีม B เปลี่ยนไฟล์ใน local review และตรวจตาม10.5 ก่อนส่งเจ้าของดู ยังไม่ปิดเกณฑ์ความชัดในเกม/มือถือด้วยภาพ Blender

### 10.2 ท่าและไฟล์ส่งต่อ

`assets/_inbox/mon_boss_crab_v02.glb` + `mon_boss_crab_v02.manifest.json`: **1,971,004 bytes ≈1.880MiB / 8,988tris / 12,044verticesในGLB / 22joints / 10clips / 1primitive / 1material** สูงbind2.804711ม., รัศมีbind1.780ม. เก็บraw/v01ไว้ ผ่าน hard cap10k/2MiB; ยังไม่ถึงsoft target8k/1.5MiB

| คลิป | Tick เดิม | เปลี่ยนจาก v01 |
|---|---:|---|
| idle | 48 loop | ลดbody bobจาก±0.010เป็น±0.006ม.; ปลายก้าม±2°เป็น±1° ให้ท่ายืนสงบ |
| walk | 24 loop | ถือก้ามสูงขึ้นและสลับแขน±5°, body roll±1.5°; เป้าเท้า±0.11ม.แทน±0.08, ยก0.10ม.แทน0.065; ไม่เพิ่มความเร็วactor; แตะคู่สลับ0/12เดิม |
| sweep | 51 once | ง้างถึงท่าหลักที่10แล้วค้างถึง24: bodyบิด−14°, แขนขวาดึงออกข้าง−78°และยก−28° สองข้างไม่สมมาตร; กวาดเข้าmarker30/hold30→31เดิม |
| slam | 60 once | ยกสองก้ามถึงท่าหลักที่12ค้างถึง24: arm pitch−64°, claw−14°, body lift0.32→0.35ม.; marker30/hold30→31เดิม |
| charge_windup | 30 once | ถึงท่ารวบก้ามที่12ค้างถึงrelease30: bodyย่อ0.08ม., arm−20°, claw−5°, หุบเพิ่ม ให้ต่างจากก้ามต่ำของidle |
| charge | 12 loop | ใช้รูปทรงรวบก้ามเดียวกับปลายwindupและขาก้าวถี่; ไม่เลื่อนroot |
| roar | 33 once | bodyยืด0.15ม., ชูและแยกก้ามถึงท่าหลักที่8ค้างถึง24แล้วคืนที่33: arm−75°, claw−20°, เพิ่มมุมแยกข้างละ18°; ไม่ปล่อยจังหวะทุบ |
| shard_cast | 45 once | คงkey pose/timingเดิม ได้การเก็บweight/สีร่วมกัน; castAccent9ยังไม่ใช่damage |
| stunned | 30 loop | คงkey pose/timingเดิม ใช้✦ยืนยันstate ได้การเก็บweight/สีร่วมกัน |
| down | 12 once+hold | คงkey pose/timingเดิม น้ำหนักปลายก้ามใหม่ทำให้ทรงยุบดีขึ้น ไม่ย่อscale |

เก็บweightปลายก้ามไม่ให้ติดคางและเกลี่ยรอยต่อเกราะไหล่/แขน เพราะท่ากว้างเผยผิวยืดของv01; topology/bone hierarchy/socket/bind scaleเดิม ไม่มีการขยายcollider

**สัญญาไม่เปลี่ยน:** `synes.boss-manifest/1`, `assetId=boss_crab`, `profileId=prismback_crab_v01`, `stage=combat`, 22bones/5sockets, ชื่อ/เวลา/loop/marker/phases/poseHolds/holdLastเดิม, root motion0/scale1 เปลี่ยน `version=v02` และoutputชื่อ/bytes/hash/ผลวัดจริง ทีม B **ไม่ต้องแก้loader/spec/clockเพื่อรับคลิป** เลือก `SYNES_BOSS_STEM=mon_boss_crab_v02` กับmanifestคู่ใหม่ ส่วนG8/G11/G12/G13เป็นงานpresentationของทีม Bแยกจากการโหลด

ภาพ `assets/_inbox/qa_boss_crab_pose_v02/compare_<clip>_<tick>.png` และ `_silhouette.png`: ซ้ายv01/ขวาv02 แต่ละครึ่ง844×390, FOVแนวตั้ง48°, ก้ม≈22.5°ตามแนวมองหลังผู้เล่น ปรับระยะครั้งเดียวให้idle v01กว้าง110pxแล้วล็อกทุกท่า/รุ่น มีidle0/walk6/sweep17/slam17/charge_windup17/roar15/impact30 และcomparison.jsonพร้อมhash เป็น **Blenderจำลองมุมเกม/แสงพื้นเรียบ ไม่ใช่ภาพv02ในเกม** ไม่ใช้cropขยายแทนความชัดขนาดจริง

ที่tick17ในกล้องตัวอย่าง v02: จุดclaw_rของsweepยกจากidle17.18px (v01 2.80px), clawทั้งสองของslamยก34.93px (v01 13.60px); ความกว้างเงาร่างsweep146.31/slam142.20pxจากidle≈110px ตัวเลขช่วยยืนยันท่าเปลี่ยน ไม่แทนการดูในเกมจริง

### 10.3 มืด/เล็ก และ F-1–F-3

- **มืด:** แก้atlas v02ก่อน ไม่เพิ่มemissive/bloom/แสงพิเศษหรือเปลี่ยนexposureทั้งฉาก RGB8ก่อนquantizeใช้ `round(clamp(c×1.08+7×(1−max(R,G,B)/255),0,255))` ยกบริเวณมืดเล็กน้อย เก็บปลายผลึกสว่าง Textureขนาดเดิม ตรวจสีสงวนจากPNGจริงผ่าน ต้องเทียบในเกมแสงเดียวกันโดยแยกภาพทึบ/ขณะfade ไม่คูณความสว่างในrendererซ้ำโดยเดา
- **เล็ก:** คงscale1/bind radius1.78/กล้อง/FOV/pull-back แก้ด้วยเงาร่างและช่วงค้างก่อน ไม่ขยายตัวเกินhitboxหรือเปลี่ยนกล้องในรอบนี้
- **F-1:** ปัญหาซ้อนผิวโปร่งเป็นเรื่องrenderer ไม่ตัดกระดอง/ก้ามออกจากasset ใช้nearest-surface fadeตามG12 ไม่ลดopacityทุกชั้นลงอีกเพื่อกลบปัญหา
- **F-2:** แก้เส้นsweepตามG13 เป็นภาพผลหลังหมดวง ไม่ขยายวงเตือนหรือเขตทำผล
- **F-3:** รับสีแดง/ส้มจากwarningที่ทับปูตามADR-005 ไม่ชดเชยในatlas/ไม่ลดopacity warning สีสงวนยังห้ามอยู่ในปูหรือFXผลโจมตี หากสีนี้ยังค้างจากFXหลังteleหมดให้ทีม BแยกตรวจและถอดFXเดิมนั้น ไม่ถือว่าF-3อนุญาตใช้สองสีนี้เพิ่ม

### 10.4 คำตอบ G1–G13

| ข้อ | คำตัดสิน/ค่าที่ใช้ |
|---|---|
| **G1** | รับแหวนslam **y=0.12ม.เหนือพื้นตรงศูนย์telegraph** เช่นเดียวกับsweep ไม่ใช้yจากปลายก้าม |
| **G2** | รับเศษหินslam **Medium5tick / Low4tick** เริ่มที่impactจริงของวง ไม่ใช่ตอนactorเข้าrecover |
| **G3** | รับและกำหนดขนาดเต็ม: หินslamขอบ0.16ม., รัศมีกระจาย0.55–0.95ของtele.r, สูง≤0.45ม., ≤8/4ชิ้น; ประกายsweepยาว0.10/กว้าง0.035ม., สูง≤0.50ม., Medium≤4ชิ้น/4tick, Low≤2ชิ้น/3tick; ฝุ่นchargeกว้าง×สูง0.20×0.20ม., สูง≤0.30ม., ระยะ/อายุ/เพดานเดิม§4.2; ผลึกตกกว้าง×สูง×ลึก0.34×1.10×0.34ม., **y5.5→0.10เป็นปลายล่าง** ถ้าpivotกลางให้บวก0.55ม. ไม่ให้แทงพื้นก่อนdeadline; เศษผลึกขอบ0.14ม.สูง≤0.35ม., จำนวน/อายุเดิม§4.2 การกระจายหินใช้q=(i+0.5)/N,r=tele.r×(0.55+0.40q),มุมแบ่งรอบวงเท่ากัน; sweepกระจายภายในมุมพัดจริง จุดนอกพื้นเปิดละได้ ไม่สุ่มตำแหน่งใหม่ทุกเฟรมและไม่เพิ่มcollider |
| **G4** | รับเศษเสา **6Medium/3Low**, อายุ8tick, รัศมีกระจาย≤1.20ม.จากเสาที่แตกจริง, สูง≤0.45ม., ขอบเต็ม0.16ม., มุมแบ่งรอบวงเท่ากัน ไม่สร้างเสาแตก/damageจากภาพ |
| **G5** | รับ **เฉพาะphase2 state roar**: Medium4ชิ้น ขอบ0.12ม., กระจายแนวราบ≤0.45ม.รอบshell socket, ลอยเพิ่ม≤0.70ม., อายุ9tick; Low0ชิ้น **introไม่ปล่อย** แม้เล่นคลิปเดียวกัน อ่านsocketของเฟรมจริง |
| **G6** | รับintro map **roar0→33ตลอดintroจริง1.6s**; phase2ใช้progressของstateจริง1.1s ไม่ตัดintroให้เหลือความยาวclip ไม่ไล่เวลาที่หยุดเมื่อpause/hidden |
| **G7** | รับrecoverหลังcharge/หลังมึนใช้ **idleเมื่อระยะเคลื่อนจริง0**, walkเมื่อเคลื่อนจริงตามcadence; fadeกลับ2.4tick ไม่ก้าวฟรี/ไม่ค้างstunnedหลังstateจบ dead/stunnedใหม่แทรกตามpriorityเดิม |
| **G8** | **ถอดburstลูเมน60ชิ้นของบอสเดิมเฉพาะcrab** ไม่เพิ่มburstใหม่ down0→12ใน0.4sแล้วholdจนactorหาย0.45s ไม่ย่อscale; opacityตาย=1ถึงอายุภาพ0.35sแล้วlinear→0ที่0.45s คูณocclusion fadeถ้ามี ใช้visible clockเดิม ไม่ยืดอายุactor/รางวัล |
| **G9** | รับ **ไม่มีhit scale/bounce** ใช้hit event/ประกาย/เลขเดิม นับประกายในงบจริง ไม่เปิดproceduralบอสเดิมกลับมาซ้อน |
| **G10** | รับ **ไม่เปลี่ยนemissive/materialตามstate** มึนอ่านจากclip+✦เฉพาะstunned, phase2อ่านจากHUD/roar ไม่ย้อมกระดอง/ผลึกแดงส้ม |
| **G11** | Proxyภาพบังผู้เล่น **สูง3.60ม./รัศมี2.10ม.** จากพื้น/ศูนย์actorเพื่อครอบท่าง้าง เป็นproxyภาพเท่านั้น simยังr1.90; anchorเลข **สูง3.60ม.แทน4.20ม.** DES-008ยังเลือก/ละเลขด้วยactorRect/protected rectเฟรมจริง ห้ามบังคับทับตัว/วง actorRectต้องครอบท่าแสดงไม่ใช้bind bboxอย่างเดียว |
| **G12** | **แก้กฎไม่เพิ่มpassใน§4.1เฉพาะปูที่fade:** อนุญาตnearest-surface depth pre-pass **เพิ่ม≤1draw ทั้งMedium/Lowเฉพาะ0<opacity<1** รวมfadeตาย colorWrite=false/depthWrite=true แล้วcolor passโปร่ง0.28กรณีบังผู้เล่น วาดเพียงผิวหน้าสุด ผลเทียบ0.28ชั้นเดียว ไม่บวกopacityของกระดอง ใช้geometry/skeleton/poseเดียวกัน ไม่เพิ่มoutline/fullscreen/render target/rigใหม่ จัดให้สีผู้เล่น/opaque sceneวาดก่อนpre-passแล้วboss color; warningเดิมdepthTest=false/renderOrder10ยังทับครบ depthปูต้องไม่ลบผู้เล่นด้านหลัง/สัญญาณสำคัญ ลบpassเมื่อทึบหรือหาย ไม่ทิ้งdepthค้างตอนcancel/restart ถ้าทำผลนี้ไม่ได้ให้รายงาน ไม่ลดopacityเดาสุ่ม งบVFXยัง+2/+1 แต่total bossขณะfadeเพิ่มอีก1draw (รวมฉาก≤60Medium/≤56Low) วัดจริงและQAการdisposeใหม่ |
| **G13** | **Mediumเส้นsweepหนา0.16ม., opacity0.75→0linearใน6tick**, y0.12ม., r/มุมตามteleเดิม สีlumen#5CF2E6 เริ่มเฉพาะtickหมดวงที่ยืนยันแล้ว ไม่เติมพัดทึบ/ทำdamageซ้ำ ถ้าprojectedความหนา<1.5CSSpxให้ขยายเฉพาะความหนาเชิงภาพถึง1.5px โดยcapความหนาโลก0.24ม. ใช้กล้องสุดท้ายเฟรมเดียวกัน ไม่เปลี่ยนเขตทำผล Lowคงไม่มีเส้นและประกาย2ชิ้น/3tickตามG3 ใช้batchเดิม |

ทุกparticleใช้poolรวม≤32Medium/≤12Lowเดิม เต็มแล้วลดฝุ่น/เศษก่อน คงwarning/✦/สัญญาณหลัก ไม่มีassetใหม่สำหรับG1–G13หรือข้อยกเว้นสีสงวน

### 10.5 งานถัดไป / รอเจ้าของ

1. ทีม Bเลือกstem v02 ตรวจhash/manifestแล้วจับภาพที่normalized clip8/12/17/24/30ด้วยกล้องเดียวกัน ทั้งMedium/Low เปรียบv01/v02และภาพเงาร่างที่idle≈110px ต้องเห็น **sweepง้างข้างเดียว / slamสองก้ามสูง** ตั้งแต่12ถึง24 แนวตรวจที่17: จุดclaw_rของsweepเคลื่อนจากidle≥12CSSpx, ก้ามทั้งสองของslamยก≥15CSSpx; ถ้าprojectionเกมต่างให้ส่งหลักฐานกลับ ไม่ขยายกล้องหรือscaleเอง ตัวเลขนี้ไม่แทนการตรวจผิว/ความรู้สึกที่ความเร็ว1×จริง
2. เทียบสีทึบใต้แสงเดียวกัน แยกwarning/fade ตรวจรอยต่อก้าม/คาง/เกราะอย่างน้อย4มุมและท่าง้าง/พุ่ง ภาพBlenderแสดงปรับดีขึ้นแต่ยังต้องดูผิวในเกม
3. ทำG8/G11/G12/G13 แล้วตรวจผู้เล่นหลังปูหลายชั้น, warning/✦, แนวตั้ง390×844, ฝน5วงพร้อมอัลติเซย์ริน, death/cancel/pause/hidden/restart20ครั้ง แยกmemory leakเดิมของด่านด้วยbaselineเดียวกัน
4. วัดdraw deltaใหม่และCPUเดิม≤0.5msก่อนส่งlocal review เกณฑ์total frame≤5%บนอุปกรณ์เป้าหมาย/Android/iPhoneยังเปิด ไม่ใช้SwiftShaderแทนมือถือ การขึ้นหน้าทดสอบ/เผยแพร่ยังตามคำสั่งและด่านเดิม

**รอเจ้าของ:** ไม่มีคำถามดีไซน์ใหม่ขวางรายการนี้ รอเจ้าของดูv02ในเกมและอนุมัติassetรุ่น/hashจริงหลังผลทีม Bเท่านั้น ไม่ขอบัญชี/เครดิต/สิทธิ์ซ้ำ ไม่เปลี่ยนกล้องหรือกติกาบอส

**บทเรียน:** ตรวจท่าที่ขนาดใช้งาน≈110pxตั้งแต่ต้น ไม่ใช้ภาพstudioใหญ่แทนความชัดของง้าง หลังไฟดับต้องยืนยันว่าinspect/pose/Three/ภาพใช้hashเดียวกับGLBก่อนเชื่อaccepted flag

