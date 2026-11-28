# DES-011 · Hero 002 VRM รุ่นทดลอง T0

ทีม A / Codex · 2026-11-28 · ตอบ REQ-011 Q1–Q5 · **ทดลองส่วนตัว ไม่แทนเซย์ริน** เจ้าของสั่งให้ลองและให้ผลิตทันทีในรอบนี้ ไม่ตั้งด่านอนุมัติแบบซ้ำ การอนุมัติใช้จริง/เผยแพร่ยังเป็นของเจ้าของ

## 1. Q1 / Q3 — ขอบเขตที่เลือก

เป็นตัวเลือก **Hero 002 (ทดลอง)** ข้างเซย์ริน เฉพาะ dev/local review ของ `ninja-roam-1` ค่าเริ่มยังเป็นเซย์ริน ไม่ลบ/แทนไฟล์หรือเปลี่ยนกติกา/กล้อง/รางวัล ชื่อไม่ได้หมายถึงตัวละครใหม่ที่ยืนยัน lore แล้ว

T0 สูง **1.50ม.**, rootพื้น0, +Yup/+Zforward, scale1; ใช้ชุด/หน้า/ผมจากVRMต้นทาง และดาบทดลองทรงเรียบต้นฉบับของCodex 1เล่มติดมือขวา มีblade socketsให้VFXเดิมอ่าน ไม่ใช้ดาบคู่/ผ้าของเซย์ริน

คลิปขั้นต่ำตรง P1: idle48loop, run10loop(step0/5), attack_01จำนวน11tick(hit5/hold5→6), attack_03จำนวน18(hit9/hold9→10/lift0.12ม.ที่6), skill_shadow_thread18(dashStart3/dashEnd8), dodge_f9; sim30Hz/root motion0เหมือนเดิม คลิปที่ยังไม่มีให้แสดงสถานะขาด ไม่รายงานว่าเป็นfull20คลิป

หากทีม Bให้ลองเล่นด้วยท่าแทนแบบP1เดิม ต้องบอกชัดว่าattack_02/สกิลอื่น/อัลติ/หลบทิศอื่นยังใช้fallbackตามตารางP1ที่รับรองแล้ว ห้ามเงียบๆนับท่าแทนเป็นคลิปจริง กฎการต่อสู้คงเดิม

## 2. Q2 — วิธีผลิตที่เร็วที่สุด

ตรวจVRMจริงแล้วถอดเป็นglTFปกติด้วยBlender5.3 headless ใช้humanoidเดิมช่วยถ่ายweightsสู่ **27 body bones** ชื่อตามBODY_BONESของเซย์ริน ไม่ใส่18กระดูกผ้าปลอมให้ครบ45 ผมweightตามhead/เสื้อweightตามbody ปิดspring/กลอกตา/blend shapesในT0

ทำท่าใหม่/retargetจากชุดท่าที่Codexผลิตให้Synesแล้ว อบทุกtick ไม่โหลดท่าจากบริการภายนอก ลดgeometryเป้า8k/เพดาน10k trisรวมอาวุธ, GLB≤2MiB, ≤2materials/2primitives, อิทธิพล≤4/vertex normalized; รวมatlas1024²และORM512²

แปลงMToon/unlit/outlineเป็นMeshStandardMaterial roughnessประมาณ0.85/metallic0 ไม่มีnormal/emissive mapหรือVRM extensionในruntime **อนุญาตMASK alphaCutoff0.5 และdoubleSidedเฉพาะผิวavatarที่ต้องรักษาผม/ตา/ช่องเสื้อ** ไม่ใช้BLEND; ดาบOPAQUE/single-sided ไม่มีoutline passหรือVRM loaderใหม่

## 3. สัญญาที่เหมือน/ต่างจากเซย์ริน

- ใช้ `synes.hero-manifest/1`, `assetId=hero002_vroid`, `version=v01`, `stage=preview`, `status=REVIEW`, ชื่อคลิป/markers/holds/yLift/หน่วย/แกน/output SHA256+bytesเหมือนรูปแบบP1เดิม
- สูง1.50ม.เท่ากัน แต่สัดส่วนจากVRoid ไม่ใช่หัวโตแบบเซย์ริน ต้องวัดความอ่านง่ายในกล้องจริง
- **27 body bonesแทน45** ไม่มีcloth bones/cloth anchors ไม่เปิดSeyrin cloth solver; ไม่ให้ตัวตรวจเซย์รินยอมรับ27แทน45ทั่วไป
- socket7ชื่อ/parentตรงเดิม: socket_weapon_r→hand_r, socket_sheath→chest (จุดสำรอง ไม่มีฝักในT0), socket_blade_base/tip→weapon_katana, socket_throw_l→hand_l, socket_fx_chest→chest, socket_fx_ground→root
- alpha MASK/doubleSidedของavatarต่างจากข้อOPAQUE/single-sidedของเซย์ริน ต้องเป็นprofile exceptionเฉพาะHero002 ข้ออื่น bytes/tris/weights/noURI/clip/hashยังเข้มเท่าเดิม
- **ตัวโหลดเดิมพิจารณาblockแยกจากcheck:** เป้าคือblockผ่านทั้งหมด แต่reportเซย์รินจะเตือนbones/anchors/materialที่ต่างตามจริง ทีม BแยกprofileตรวจHero002ตามmanifestนี้ ไม่แก้ผลเตือนให้ดูผ่านหรือสร้างbone/anchorปลอม ส่วนGLTFLoader/MixerDriverใช้body namesเดิมได้

## 4. Q4 — ต้นฉบับ/สิทธิ์/สี

ไฟล์เป็นVRoidตัวอย่างสำเร็จรูป ไม่ใช่ตัวละครต้นฉบับSynes คำสั่ง “ลอง” อนุญาตT0ส่วนตัวนี้ ไม่สรุปว่าเปลี่ยนกฎต้นฉบับหรืออนุญาตขึ้นPagesแล้ว metadataระบุVRoid Project/AvatarSample_Cและlicense Other พร้อมURLเงื่อนไข; เป็นข้อมูลในไฟล์ **ยังไม่ใช่ผลตรวจหน้าเงื่อนไขจริง** ไม่อ้างCC0/ไม่ต้องเครดิตเป็นข้อสรุปสิทธิ์ บันทึกsource/hashและสถานะนี้ไว้ในmanifest/notes

ก่อนใช้เป็นตัวละครจริง/เผยแพร่ให้เจ้าของเลือกอีกครั้งว่าจะใช้ตัวอย่างนี้ต่อหรือให้ทำตัวละครต้นฉบับ และทีม BลงทะเบียนASSETS/ตรวจเงื่อนไขที่ตรงไฟล์ ไม่ตั้งการถามนี้ขวางการลองส่วนตัวที่เจ้าของสั่งแล้ว

ตาแดงปรับเป็นwineหม่นเมื่อจำเป็น (#7B2946), ไม่เรือง ไม่ใช้#FF3355/#FF7A1Aบนตัว/ดาบ/VFX ตรวจatlasจริงและภาพใต้แสง วงเตือนยังทับทุกชิ้นตามADR-005

## 5. Q5 — ส่งต่อและตรวจรับ

Codexผลิต `assets/_inbox/char_hero002_vroid_t0_v01.glb` + `.manifest.json` + `.md`, master/atlas/4มุม/ภาพท่า/ผลตรวจอยู่inboxทั้งหมด สคริปต์และตัวตรวจที่รันซ้ำได้อยู่ `tools/blender/hero002/` ไม่แก้raw/src/shared/server ไม่commit/push ไม่ติดตั้ง/ใช้บัญชีหรือบริการใหม่

ทีม Bใช้ **`hero=hero002`** เฉพาะdev/local reviewภายใต้gateเดิม เพิ่มคู่private route **`/__seyrin/hero002.glb` + `/__seyrin/hero002.manifest.json`** จากstemHero002ในinboxเดียวกัน โหลดbytesผ่านSkinnedMeshเดิม เมื่อไม่มีqueryหรือเลือกเซย์รินให้คงคู่heroเดิม ไม่เปลี่ยนglobalstemของเซย์รินเพื่อสลับทุกคน ไม่พ่วงHero002กับpublic-build emitของเซย์รินที่อนุมัติไปก่อนแล้ว

ปิดclothsolverเฉพาะprofileนี้ ไม่แก้sim/ให้รางวัลจากตัวเลือกภาพ ตรวจsocket/อาวุธ/scale1/ไม่ใส่liftซ้ำ/ไม่แปลงผ่านkit flatten

เกณฑ์T0: blockของhero inspectorผ่าน; custom27bone/7socket/งบ/weights/material profileผ่านจากbinaryจริง; คลิป6ชื่อ/เวลา/hold/loop/rootตรง, attack_03liftตรวจจริง; rawhashไม่เปลี่ยน; ภาพหน้า/หลัง/ข้าง/เฉียงและrun/attackเห็นหน้า/มือ/เท้าไม่แหลมหรือจมชัด ตรวจบนPCก่อน แล้วownerลองในเกม; Android/iPhone/perf/lifecycle/คลิปที่เหลือยังเปิดจนมีหลักฐานจริง

## 6. รอเจ้าของ

ไม่มีคำถามก่อนทำT0 รอเจ้าของลองเทียบกับเซย์รินแล้วเลือกทิศทางการใช้จริง/ความเป็นต้นฉบับและอนุมัติruntimeรุ่น/hashก่อนเผยแพร่ ไม่ถามซ้ำระหว่างการผลิตตามคำสั่งนี้

## 7. ผลผลิต T0 ของทีม A

ส่ง T0 แล้ว: **543,900 bytes (0.519MiB), 8,883trisรวมดาบ, 27joints, 6คลิปจริง, 2materials/2primitives, bindสูง1.500ม.** ตัวตรวจฮีโร่เดิมทุกblockผ่าน ข้อcheckที่ต่างมีเพียงbones/anchors/material-opaqueตาม§3; ตัวตรวจprofileT0และpose/loop/hold/liftผ่าน โหลดด้วยloaderฮีโร่ของทีม BแบบCPUได้โดยไม่แก้sourceเกม

SHA256 `b9165f6c46db1c678267e329cb285684ef67b36574bed04183e606fdc2b2fb7e` สถานะREVIEW รายละเอียดผลวัด/ภาพ/ข้อจำกัดใน `assets/_inbox/char_hero002_vroid_t0_v01.md` ไม่ใช่ผลทดสอบเกม/มือถือจริง

## ผลการทำ (ทีม B)

