# VFX ผู้เล่น 2-B: draw calls + ภาพ (ทีม B)

ผลงานตาม `docs/handoff/fx_player_skills_v01.md` / DES-001 §2-3 · สร้างด้วย `node tools/qa/vfx-calls.mjs` (ข้อมูลดิบ `tools/qa/out/vfx-calls.json`)
**ตัวเลขมาจาก Chromium + SwiftShader (GPU ซอฟต์แวร์) ใน container** ค่า draw calls อ่านจาก `renderer.info.render.calls` จึงไม่ขึ้นกับ GPU แต่ **ยังไม่ได้ทดสอบบน iPhone/Android เครื่องจริง** และไม่มี FPS ในไฟล์นี้

## วิธีวัด
- ฉาก/กล้อง/สถานะ sim เดียวกัน: `?offline&seed=11&start=boss&q=<tier>&autostart&qafreeze` หยุด sim แล้วเดินด้วย `__synesQA.stepTicks` จนบอสมีวงเตือน `slam` (tick 147) ผู้เล่นยืนห่างบอส 5.8 ม. หันเข้าหาบอส
- เทียบ `&vfx=0` (ปิด VFX ผู้เล่นเท่านั้น) กับเปิด VFX; ภาพซ้อนสูงสุด = สร้าง event `skill-hit` ทั้ง 3 ช่องใน tick เดียวกันฝั่ง view (sim ไม่แตะ) แล้วเดินต่อ 3 tick เพราะ sim จริงร่ายได้ทีละท่า จึงเป็นกรณีเลวร้ายสุดของพูล ไม่ใช่สถานะที่เล่นแล้วเกิดได้
- ท่าเดี่ยวใช้การกดปุ่มจริงผ่าน sim วัดที่ก่อนโดน / หลังโดน 2 tick (ผลึก +4) / หลังจบ

## ตารางหลัก
| tier | draw calls ปิด VFX | เปิด VFX (ซ้อนทั้ง 3) | เพิ่ม | เพดาน DES | ผ่าน |
|---|---:|---:|---:|---:|:--:|
| medium | 87 | 90 | **+3** | +5 | ผ่าน |
| low | 81 | 84 | **+3** | +3 | ผ่าน |
| high (ใช้เพดาน Medium, ข้อมูลเฉยๆ) | 158 | 161 | +3 | (+5) | - |

| ท่า (ร่ายจริง) | medium เพิ่มสูงสุด | low เพิ่มสูงสุด | เพดาน M / L |
|---|---:|---:|---|
| Chime Burst | +1 | +1 | +1 / +1 |
| Crescent Cut | +1 | +1 | +2 / +1 |
| Crystal Break | +1 | +1 | +2 / +1 |

หมายเหตุ: triangles เพิ่ม ~400 (medium) / ~190 (low) ในฉากซ้อน; VFX ทั้งหมดเป็น mesh แบบ dynamic buffer 3 ชิ้น (ชิ้นละท่า) สร้างตอน build level ไม่สร้างต่อการร่าย; ซ่อน (`visible=false`) เมื่อไม่มีเอฟเฟกต์ จึงเพิ่ม 0 calls ตอนว่าง. วัสดุ `forceSinglePass` (ไม่เช่นนั้น three.js วาด transparent DoubleSide สองรอบ = +6)

## ภาพ (844x390, dpr 2, JPEG q80) ใน `docs/qa/vfx-2b/`
| ท่า | ก่อนโดน | โดน | จบ |
|---|---|---|---|
| Chime medium | chime-medium-prep | chime-medium-hit | chime-medium-end |
| Chime low | chime-low-prep | chime-low-hit | chime-low-end |
| Crescent medium | crescent-medium-prep | crescent-medium-hit | crescent-medium-end |
| Crescent low | crescent-low-prep | crescent-low-hit | crescent-low-end |
| Crystal medium | crystal-medium-prep | crystal-medium-hit | crystal-medium-end |
| Crystal low | crystal-low-prep | crystal-low-hit | crystal-low-end |

ซ้อนทับวงเตือนบอส: `overlap-telegraph-medium.jpg`, `overlap-telegraph-low.jpg` (วงเตือนวาดเหนือ VFX ตาม ADR-005: telegraph renderOrder 10 + depthTest ปิด, VFX renderOrder 5 + depthTest เปิด)

## คลิป (`docs/qa/clips/`) เรนเดอร์ทีละเฟรมแบบ deterministic (`tools/qa/clip.mjs`, ไม่ใช่วิดีโอเวลาจริงจาก SwiftShader)
- `boss-3skills-seed1.mp4` 34.6 วินาที 1688x780 30 fps H.264 CRF 23 9.9 MB: บอทสคริปต์ (`?bot=1&botskills=1`, seed 1, medium) สู้บอสจน victory ใช้ Chime 4 / Crescent 6 / Crystal 3 ครั้ง (ทุกครั้งมีเป้า) เวลาในคลิป = เวลา sim จริง (เฟรมทบ 2 tick ตอนเดิน)
- `vfx-overlap-telegraph.mp4` 3.6 วินาที: Crystal → Crescent → Chime ร่ายจริงทีละท่าบนวงเตือนใหม่ (ตัดต่อระหว่างท่า; ผู้เล่นถูกย้ายไปยืนห่างบอส 5.8 ม. จึงบางช่วงอยู่ในทางเข้าลาน) แล้วท้ายคลิปบังคับให้ทั้ง 3 โดนพร้อมกัน
- ทำซ้ำได้: `node tools/qa/serve.mjs dist 8191 &` แล้ว `node tools/qa/clip.mjs fight --seed 1` (ใส่ `--dodgecd 26` สำหรับคลิปเทียบคูลดาวน์หลบ; `npx vite-node tools/qa/clip-seeds.ts` สแกน seed) ใช้เวลาเรนเดอร์ ~7 นาที/คลิปยาว
