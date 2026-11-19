# Technical spike: PlayCanvas vs Three.js (2026-11-19)

**ขอบเขต:** ฉากเดียวกันทั้งสองเอนจิน ได้แก่ พื้น 80×80, ต้นไม้ 300 ต้นแบบ instancing (2 draw call), ตัวผู้เล่น,
ศัตรู 1 ตัวที่มีวงเตือนก่อนโจมตี, กล้องติดตาม, จอยสติ๊กสัมผัส + ปุ่มโจมตี/หลบ, เงาจาก directional light 1024²
โค้ด input/logic ใช้ร่วมกัน (`spike/common/`) จึงต่างกันเฉพาะชั้น render

**วิธีวัด:** `node tools/qa/spike-bench.mjs` (Chromium + Playwright จำลองอุปกรณ์, ให้บริการแบบ gzip ผ่าน `tools/qa/serve.mjs`)

## ข้อจำกัดที่ต้องรู้ก่อนอ่านตัวเลข
- **ยังไม่ได้ทดสอบบนมือถือจริง** ทั้ง Android และ iPhone ทุกตัวเลขมาจาก Chromium จำลองใน container
- GPU เป็น SwiftShader (เรนเดอร์ด้วย CPU) ค่า FPS **ใช้เทียบระหว่างเอนจินเท่านั้น** ห้ามตีความเป็น FPS บนเครื่องจริง
- โปรไฟล์ "iphone-class" ใช้แค่ขนาดจอและ DPR ของ iPhone บน Chromium ไม่ใช่ Safari/WebKit
- CPU throttle ของ CDP มีผลกับ main thread ของ renderer ไม่ใช่ GPU process

## ผล (มีเงา)
| profile | engine | first frame (ms) | transfer (KB, gzip) | FPS avg | heap (MB) |
|---|---|---|---|---|---|
| android-low (CPU 6×, Slow 4G) | PlayCanvas | 2278 | 296 | 4.1 | 10.4 |
| android-low | Three.js | 1483 | 132 | 7.6 | 6.3 |
| android-mid (CPU 4×, Fast 4G) | PlayCanvas | 773 | 296 | 3.6 | 8.2 |
| android-mid | Three.js | 553 | 132 | 6.9 | 6.3 |
| pc | PlayCanvas | 137 | 296 | 6.6 | 9.7 |
| pc | Three.js | 232 | 132 | 13.2 | 6.0 |

## ผล (ปิดเงา `?shadows=0`)
| profile | engine | first frame (ms) | FPS avg | heap (MB) |
|---|---|---|---|---|
| android-low | PlayCanvas | 2238 | 9.8 | 8.4 |
| android-low | Three.js | 1408 | 12.2 | 5.1 |
| android-mid | PlayCanvas | 685 | 8.9 | 8.4 |
| android-mid | Three.js | 538 | 10.9 | 5.1 |
| pc | PlayCanvas | 137 | 16.2 | 8.1 |
| pc | Three.js | 113 | 21.0 | 4.5 |

PlayCanvas ตั้งค่าให้เทียบได้แล้ว คือใช้ `AppBase` ที่ลงทะเบียนเฉพาะ component ที่ใช้, ปิด clustered lighting และใช้ PCF3

## สรุป
ดูเหตุผลการเลือกที่ `docs/DECISIONS.md` ADR-001 หน้า spike ทั้งสองอยู่ในลิงก์ทดลองเล่น (`/spike/playcanvas/`, `/spike/three/`)
และมีตัวนับ FPS บนจอ เจ้าของจึงเปิดเทียบบนมือถือจริงได้เอง
