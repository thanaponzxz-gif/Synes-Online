---
name: synes-playtest
description: ให้ agent ผู้ทดสอบที่ไม่รู้กลไกเกมเข้าไปเล่น Synes Online หนึ่งรอบผ่านจอสัมผัสจำลอง แล้วเขียนรายงานเพลย์เทสต์ ใช้หลังแก้ gameplay, UI หรือภาพ เพื่อเทียบคะแนนกับรอบก่อน
---

# synes-playtest

1. **เตรียม build และ server**
   `npm run build && (PORT=8080 nohup npm run server > /tmp/synes-server.log 2>&1 &)`
2. **เปิดชุดควบคุม** (เกมหยุดระหว่าง turn และควบคุมด้วยจอสัมผัสจำลองผ่าน CDP)
   `(nohup node tools/qa/playtest-harness.mjs "http://localhost:8080/?q=medium" tools/qa/out/playtest-rN 7777 > tools/qa/out/playtest-rN.log 2>&1 &)`
3. **ส่ง agent ผู้ทดสอบ** (Agent tool, general-purpose, run_in_background) ด้วยบรีฟจาก `docs/qa/playtest-agent-round1.md` รอบแรก หลักสำคัญคือ:
   - **ห้ามบอกกลไกเกม** และห้ามให้อ่าน source หรือ docs เพราะต้องเหมือนผู้เล่นใหม่
   - บอกวิธีใช้ API: `/start`, `/act {move, ms, taps}`, `/ui {target}`, `/screen` และ `/log` (เรียก `/log` ได้ตอนจบเท่านั้น)
   - งบไม่เกิน ~140 `/act` ให้ใช้ turn สั้น 300–800 ms ตอนต่อสู้ (turn ที่ยาวกว่าเวลาเตือนจะทำให้มองไม่เห็นวงเตือน)
   - รายงานภาษาไทย 10 หัวข้อ (ผลรวม, ไทม์ไลน์, สับสน, ความชัด, สนุก/ยาก, ภาพ, บั๊ก, Top 5, คะแนน 1–10, log) เขียนลง `docs/qa/playtest-agent-roundN.md`
4. **ตรวจซ้ำ:** เปิดภาพหน้าจอ step ที่รายงานว่าร้ายแรงด้วยตัวเองก่อนสรุปให้เจ้าของ
5. **เทียบกับรอบก่อน:** ทำตารางคะแนน รอบ N เทียบกับ N-1 แล้วบันทึกลง `docs/PROJECT_SYNES.md` หัวข้อ 4
6. ปิดชุดควบคุมด้วย `pkill -f playtest-harness.mjs`

**ข้อจำกัดที่ต้องระบุทุกครั้ง:** เกมหยุดระหว่าง turn จึงง่ายกว่าเล่นจริง และไม่ใช่การทดสอบบนอุปกรณ์จริง
