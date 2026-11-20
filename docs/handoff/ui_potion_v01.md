# ui_potion_v01 (นำร่อง Hybrid Asset Pipeline)
**สถานะ:** DRAFT · **ผู้ผลิต:** GPT Image · **ผู้ตรวจ:** Claude (PM) → เจ้าของอนุมัติ
**ใช้ที่ไหนในเกม:** ไอคอนจำนวนยาข้างชื่อ Wayfarer (มุมซ้ายบน แสดง 2 ขวด แบบเต็ม/หมด) และบนปุ่มดื่มยา (ขวาล่าง)
**แทน placeholder:** SVG ขวดยาใน `src/ui/hud.ts` (`POTION_SVG`) และตัวอักษร ✚ บนปุ่ม `#btn-potion`
**เหตุผลที่เลือกเป็นนำร่อง:** ชิ้นเล็ก, เป็น PNG ที่ใช้เป็น asset จริงได้ตามกฎ (UI), นำเข้าเกมได้ในไม่กี่นาที และวัดผลง่าย

## Art Direction (ห้ามเปลี่ยน)
- โลก Synes: แสงมีเสียง (ลูเมน) ไหลผ่านคริสตัล ยาในโลกนี้คือ "น้ำค้างแสง" ที่เก็บในขวดแก้ว
- palette: lumen #5CF2E6 · violet #A78BFA · blossom #FF9EC7 · gold #FFC857 · teal #2BB3A3
- **ห้ามใช้ส้ม #FF7A1A และแดง #FF3355** (สงวนไว้ให้วงเตือน) และไม่ใช้กากบาทแดงแบบสัญลักษณ์การแพทย์
- สไตล์: แฟนตาซีสดใส cel-shade นุ่ม ๆ รูปทรงอ้วนกลม เส้นขอบเข้ม อ่านออกบนจอมือถือ ต้นฉบับ 100%

## สเปก
- 2 ไฟล์: `ui_potion_full_v01.png` (ขวดมีน้ำค้างแสงเรือง) และ `ui_potion_empty_v01.png` (ขวดเดียวกัน ว่างเปล่า แก้วใส)
- 512×512 PNG พื้นหลังโปร่งใส ตัวขวดอยู่กลางภาพ เว้นขอบประมาณ 8% มุมมองเดียวกันทั้ง 2 ไฟล์ (ซ้อนกันแล้วตรงกัน)
- ต้องอ่านออกที่ขนาด **16 px** (แถบสถานะ) และ **40 px** (บนปุ่ม) บนพื้นกรมท่า #1D2340 และบนพื้นทรายสีครีม
- ไม่มีตัวอักษร ตัวเลข ลายน้ำ หรือเงาตกกระทบบนพื้น

## Prompt สำหรับ GPT (คัดลอกทั้งก้อน แล้วสั่ง 2 ภาพ)
```
Game UI icon, original design for a bright fantasy mobile game called Synes.
A small round-bottomed glass potion flask with a short neck and a cork stopper wrapped in teal (#2BB3A3) cord.
Image 1 ("full"): the flask is filled with glowing liquid light — mint-cyan (#5CF2E6) fading to soft violet (#A78BFA) at the bottom, with 2–3 tiny sparkles inside. Subtle inner glow.
Image 2 ("empty"): the exact same flask, same angle and size, but empty clear glass with a faint cyan tint; no glow.
Style: chunky, cute, soft cel shading with 2–3 tone steps, clean dark navy outline (#1D2340) about 4% of the image width, simple shapes that stay readable when shrunk to 16×16 pixels. Front 3/4 view, centered, ~8% padding.
Transparent background (PNG with alpha). No text, no numbers, no watermark, no drop shadow on the ground, no red or orange anywhere, no medical cross.
512×512.
```

## เกณฑ์ตรวจ (Claude ตรวจ แล้วเจ้าของอนุมัติ)
- [ ] พื้นหลังโปร่งใสจริง (alpha) และขนาด 512×512
- [ ] ย่อเหลือ 16 px และ 40 px แล้วยังแยก "เต็ม" กับ "หมด" ได้ทันที ทั้งบนพื้นกรมท่าและพื้นทราย
- [ ] ไม่มีสีส้มหรือแดงที่สงวนไว้ (ตรวจ hue ด้วยสคริปต์)
- [ ] 2 ภาพซ้อนกันแล้วตรงกัน (ขวดเดียวกัน มุมเดียวกัน)
- [ ] เข้ากับปุ่มและ HUD ปัจจุบัน (ดูภาพเทียบที่ Claude ทำให้ตอนตรวจ)
- [ ] ไม่มีตัวอักษร ลายน้ำ หรือสิ่งที่ดูเหมือนลอกจากเกมอื่น
- [ ] ขนาดไฟล์หลังบีบอัดไม่เกิน 30 KB ต่อไฟล์ (ใช้ในเกมที่ 64×64 และ 128×128)

## วิธีส่งกลับ
บันทึกไฟล์ตามชื่อข้างบนลงใน `assets/_inbox/` (อัปโหลดผ่าน GitHub หรือ clone บนเครื่อง) หรือแนบในแชตกับ Claude
แล้วบอก Claude ว่า "ตรวจ ui_potion_v01" Claude จะเปลี่ยนสถานะเป็น REVIEW ตรวจตามเกณฑ์ และส่งภาพเทียบในเกมให้ดู

## ที่มา (กรอกเมื่อได้ไฟล์)
| ไฟล์ใน inbox | เครื่องมือ/รุ่น | prompt (ฉบับที่ใช้จริง) | license/เงื่อนไข | วันที่ | จำนวนรอบที่แก้ |
|---|---|---|---|---|---|

## บันทึกการตรวจ
- 2026-11-20 · Claude เขียน brief (DRAFT) ใช้เวลาประมาณ 10 นาที (ไม่ได้จับเวลา)
