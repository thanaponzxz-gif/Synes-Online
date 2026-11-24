# วิเคราะห์ตัวบล็อก C-1: WebGL2 ค้างบนเครื่องเจ้าของภายใต้ Gaming Mode v2

วันที่ 2026-11-25 · วิเคราะห์อย่างเดียว ไม่แก้โค้ด ไม่ commit ไม่ติดตั้ง · ฐาน `art/env-polish` `47389cf`
เจ้าของหลับอยู่: ทุกข้อที่ต้องให้เจ้าของตัดสินเขียนว่า **NEEDS OWNER** การไม่ตอบไม่ถือเป็นการอนุมัติ

ที่มาของไฟล์อ้างอิง: `v05d/…` และ `v05e/…` คือ zip ที่เจ้าของแนบ (Gaming Mode v1 และ v2) บนเครื่องเจ้าของคือ `C:\SYNES_ASSETS\SYNES_OUTPUT\tools\gaming_mode\`

## 0. สรุปสั้น

1. **หลักฐานที่มีไม่พอจะบอกว่า Gaming Mode เป็นสาเหตุ** อาการเดียวที่เรามีคือ "ค้างเกิน 60 วินาที ไม่มี JSON" ซึ่งตัว probe ให้ผลแบบนี้ได้จากสาเหตุเกือบทุกแบบ เพราะ probe พิมพ์ JSON ครั้งเดียวตอนจบ และ Playwright รอเปิดเบราว์เซอร์ได้ถึง 180 วินาที (ข้อ 1.3)
2. **เพดาน CPU 30% ไม่น่าใช่ตัวการโดยตรง** งานถูกจำกัดที่ 4 จาก 16 logical processor (25%) อยู่แล้ว จึงไปไม่ถึงเพดาน 30% และไปไม่ถึงเกณฑ์พักงาน 35% ถ้าการวัดถูกต้อง (ข้อ 1.2)
3. **สมมติฐานอันดับ 1:** ความต่างอยู่ที่ "ทางเปิดเบราว์เซอร์" ไม่ใช่ที่เพดาน CPU รอบที่สำเร็จ (Local Art) กับรอบที่ค้าง (Codex) ใช้ตัวเปิดคนละตัว, Playwright คนละชุด และ runtime ของ agent คนละตัว (ข้อ 2 H1)
4. **การวินิจฉัยชี้ขาดที่ถูกที่สุด:** ไม่ต้องรันอะไรเพิ่ม ให้เจ้าของแนบไฟล์ที่มีอยู่แล้วบนเครื่อง 2 ไฟล์ คือ `gaming_mode_log.csv` และรายงาน BLOCKED ของ C-1 (ข้อ 4) **NEEDS OWNER**
5. **C-1 ไม่ต้องรอการวินิจฉัยนี้** ทำต่อได้ด้วยเส้นทางเดียวกับ C-2: Codex เขียนโค้ดและเทสต์ที่ไม่ใช้เบราว์เซอร์บน PC → patch → QA บนคลาวด์ (ข้อ 5, 6) **NEEDS OWNER** (สั่งเลิกพัก C-1)

## 1. ข้อเท็จจริง

### 1.1 สิ่งที่เกิด

| เรื่อง | ข้อเท็จจริง | ที่มา |
|---|---|---|
| อาการ | Codex รัน `webgl2-probe.mjs --channel msedge` ผ่าน Gaming Mode 1 ครั้ง ค้างเกิน 60 วินาที ไม่มี JSON และไม่มีค่า renderer | handoff C-2 ของ Codex |
| รายงาน C-1 | PM ไม่มีรายงาน BLOCKED ของ C-1 จึงไม่ทราบอาการ WebGL2 ของรอบวินิจฉัยเดิม | `docs/team/2026-11-24-pm-qa-env-and-c2.md` |
| รอบที่สำเร็จ | วันเดียวกัน Local Art รัน QA เต็มชุดบน PC เดียวกันด้วย Edge headless + SwiftShader ได้ (22 วินาทีต่อรอบของประตู HUD) | `v05c/qa/round5/fix2/QA_FIX2.md:3,17` |
| ตัวเปิดเบราว์เซอร์ของรอบที่สำเร็จ | **ไม่ใช่ Playwright** เป็นตัวเปิด CDP ของ Local Art เอง (`launch(port)` จาก `qa_cdp.mjs`, port 19451) ไฟล์ `qa_cdp.mjs` ไม่อยู่ใน zip จึงไม่ทราบ flag ที่ใช้ | `v05c/r5/pilot_fix2/tools/qa_capture.mjs:4,10` |
| ตัวเปิดของรอบที่ค้าง | Playwright ที่มากับ Codex (ผ่าน `NODE_PATH`) + `--channel msedge` + `LAUNCH_ARGS` ไม่ทราบเวอร์ชัน Playwright และ Edge | `v05e/CODEX_HANDOFF_R5.md:81-85`, `tools/qa/pw.mjs`, `tools/qa/profiles.mjs` (LAUNCH_ARGS) |
| Gaming Mode รอบที่สำเร็จ | v1: จำกัด 9/16 logical processor + BelowNormal ใส่ทีละ process หลังเปิดแล้ว ไม่มี Job Object | `v05d/tools/gaming_mode/gaming_mode.ps1:13,21-24,41-45` |
| Gaming Mode รอบที่ค้าง | v2: ดูข้อ 1.2 | `v05e/tools/gaming_mode/` |
| v2 กับเบราว์เซอร์จริง | README ของ v2 เขียนเองว่า **ยังไม่ได้ทดสอบที่เพดาน 30% กับงานจริงเต็มชุด** ทดสอบแค่ตัวเผา CPU | `v05e/tools/gaming_mode/README.md:65-77` |

ดังนั้นรอบที่สำเร็จกับรอบที่ค้างต่างกันอย่างน้อย 5 อย่างพร้อมกัน: (1) รุ่น Gaming Mode, (2) ตัวเปิดเบราว์เซอร์, (3) ชุด Playwright, (4) runtime ของ agent ที่สั่งรัน, (5) ตัวทดสอบ ยังไม่มีรอบไหนที่เปลี่ยนแค่อย่างเดียว

### 1.2 Gaming Mode v2 ทำอะไรกับ process จริง (อ่านจากโค้ด)

| กลไก | รายละเอียด | บรรทัด |
|---|---|---|
| ตัวรันเข้า Job เอง | PowerShell ของ `gaming_run.ps1` สร้าง Job `Local\SynesGM_r_<PID>` แล้วใส่ตัวเองเข้าไป จากนั้นเรียกงานด้วย `& $exe @rest` → node, Edge และ process ลูกทั้งหมดเกิดใน Job นี้ | `gaming_run.ps1:28-33` |
| ข้อจำกัดของ Job | `LimitFlags = AFFINITY \| PRIORITY_CLASS` (BelowNormal) + CPU rate `ENABLE \| HARD_CAP` ที่ `cpuPercent*100` = 3000 (30% ของทั้งเครื่อง) **ไม่มี** `BREAKAWAY_OK`, `SILENT_BREAKAWAY_OK`, `KILL_ON_JOB_CLOSE` | `gaming_native.cs:36-37,46-48` |
| Affinity | เลือก logical processor **หมายเลขท้ายสุด** k ตัว, k = floor(16 × 30%) = 4 | `gaming_native.cs:73`, `gaming_run.ps1:27` |
| ตัวเฝ้าจับใคร | `msedge.exe` ที่มี `--headless` หรือ `--remote-debugging-port`, node จากโฟลเดอร์ Synes, blender `-b` และลูกทั้งหมด ส่วน PowerShell **ทุกตัว**ที่ command line มีคำว่า `gaming_run.ps1` ถือเป็น launcher | `gaming_mode.ps1:47,86-99` |
| วัด | ทุก 2 วินาที: เวลา CPU ของทุก Job ที่รู้จัก ÷ เวลา CPU ทั้งเครื่อง | `gaming_mode.ps1:120-134` |
| พักงาน | เกิน 35% ติดกัน 3 รอบ → `NtSuspendProcess` ทุก process ใต้ roots + launchers 10 วินาที | `gaming_mode.ps1:137-151`, `gaming_native.cs:70` |
| พักค้าง (HELD) | พัก 3 ครั้งใน 2 นาที → ตัวเฝ้าวนรอไม่สิ้นสุด **ไม่ปล่อย process** จนกว่าจะรัน `stop_gaming_mode.ps1` | `gaming_mode.ps1:143-148`, `stop_gaming_mode.ps1` |
| ตัวรันปฏิเสธ | สถานะไม่ใช่ `ON` หรือเก่ากว่า 15 วินาที → exit 3 · มีงานหนักอื่น → exit 5 | `gaming_run.ps1:12-15,19-24` |

เลขที่ได้จากโค้ด:

- งานใช้ CPU ได้สูงสุด 4/16 = **25%** ของเครื่อง ต่ำกว่าเพดานบังคับ 30% → **เพดานบังคับไม่ทำงานในทางปฏิบัติ** (README ข้อ "เพดานรวม" บรรทัด 19 และ 77 ยืนยันเลขเดียวกัน)
- ด้วยเหตุผลเดียวกัน ค่าที่วัดได้ไม่ควรเกิน 25% จึงไม่ควรถึงเกณฑ์พักงาน 35% **ถ้าการวัดไม่นับซ้ำ** (ดู H4)
- สิ่งที่บีบงานจริงคือ 4 logical processor + BelowNormal

### 1.3 ตัว probe บอกอะไรได้และไม่ได้

| ข้อเท็จจริง | ที่มา |
|---|---|
| probe พิมพ์ JSON **ครั้งเดียวตอนจบ** หลัง `browser.close()` ไม่มีบรรทัดบอกความคืบหน้ารายขั้น | `tools/qa/webgl2-probe.mjs:63-68` |
| ไม่มี timeout ของตัวเองเลย | ทั้งไฟล์ |
| `chromium.launch` รอได้ถึง **180 วินาที** ก่อนแจ้ง error (Playwright 1.63 บนคลาวด์: `DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT = 3 * 60 * 1e3`) เวอร์ชันของ Codex ไม่ทราบ | `playwright-core/lib/coreBundle.js:4595` |
| `page.evaluate` และ `browser.close()` ไม่มี timeout | Playwright API |

ผลคือ "ค้างเกิน 60 วินาที ไม่มี JSON" **แยกสาเหตุไม่ได้** ระหว่าง: เบราว์เซอร์ยังเปิดไม่เสร็จ, GPU process ค้าง, ปิดเบราว์เซอร์ไม่ลง, หรือ node ถูก suspend ถ้า Codex ตัดที่ 60 วินาที อาการจะเหมือนกันทุกกรณี

## 2. สมมติฐานสาเหตุ (เรียงตามความน่าจะเป็น)

ตัวเลขความน่าจะเป็นเป็นการประเมินของผู้วิเคราะห์จากโค้ดและอาการเดียวที่มี ไม่ใช่ผลวัด

| อันดับ | สมมติฐาน | ประเมิน |
|---|---|---|
| H1 | ทางเปิดเบราว์เซอร์ต่างจากรอบที่สำเร็จ (runtime ของ Codex + Playwright ที่มากับ Codex + `--channel msedge`) | ~35% |
| H2 | ขาด CPU: 4 logical processor ท้ายสุด + BelowNormal + มีงานอื่นแย่ง หรือมี process ค้างจากรอบก่อน | ~25% |
| H3 | GPU process ของ Edge ค้างหรือวนเริ่มใหม่ตอนเตรียม SwiftShader | ~15% |
| H4 | ตัวเฝ้าพักงานจนถึง HELD เพราะวัดเกินจริง | ~10% |
| H5 | Job Object ขัดกับการสร้าง process ของ Edge (breakaway, Job ซ้อน) | ~7% |
| H6 | Playwright กับ Edge เวอร์ชันไม่เข้ากัน | ~5% |
| H7 | ตัวห่อ PowerShell (`$ErrorActionPreference='Stop'` กับ stderr) | ~3% |
| ตัดออก | เพดานบังคับ 30% บีบจนเบราว์เซอร์ timeout | ต่ำมาก (ข้อ 1.2) |

### H1. ทางเปิดเบราว์เซอร์ต่างจากรอบที่สำเร็จ ไม่เกี่ยวกับเพดาน CPU

- **หลักฐาน:**
  - รอบที่สำเร็จใช้ตัวเปิด CDP ของ Local Art (`qa_capture.mjs:4,10`) รอบที่ค้างใช้ Playwright ผ่าน pipe + `--channel msedge` (`webgl2-probe.mjs:17,21`)
  - Playwright มาจาก `NODE_PATH` ของ Codex (`CODEX_HANDOFF_R5.md:82,85`, `tools/qa/pw.mjs`) ไม่ทราบเวอร์ชัน
  - `--channel msedge` ทำให้ Playwright เปิด Edge ตัวเต็มในโหมด headless ใหม่ ซึ่งหนักกว่าและมี process มากกว่า headless shell ที่คลาวด์ใช้
  - Codex ติด WebGL2 มาตั้งแต่ C-1 ด้วยเครื่องมืออื่น (ไม่ใช่ probe นี้) ตลอดจำนวนรอบที่เจ้าของให้ แปลว่าปัญหาอยู่กับ "Codex เปิดเบราว์เซอร์" ไม่ใช่เฉพาะ probe
- **สิ่งที่ยังไม่ทราบ:** runtime ของ Codex บน Windows รันคำสั่งภายใต้ sandbox หรือ token จำกัดสิทธิ์แบบไหน และ Edge เปิดภายใต้สิ่งนั้นได้หรือไม่
- **ยืนยัน:** `gaming_mode_log.csv` ช่วงเวลาที่รัน probe แสดง `state=ON`, `ours_pct` ต่ำ (ใกล้ 0), `machine_pct` ต่ำ = เบราว์เซอร์ไม่ได้ใช้ CPU เลย จึงไม่ใช่ปัญหาทรัพยากร
- **หักล้าง:** log แสดง `ours_pct` สูงค้างใกล้ 25% (งานกำลังคำนวณอยู่จริงแต่ช้า) หรือมีแถว PAUSED/HELD

### H2. ขาด CPU เพราะ 4 logical processor ท้ายสุด + BelowNormal + มีงานแย่ง

- **หลักฐานจากโค้ด:**
  - `TopMask` เลือก logical processor หมายเลขท้ายสุด (`gaming_native.cs:73`) ถ้า CPU เป็น Intel แบบผสม ตัวท้ายสุดมักเป็น E-core ถ้าเป็น CPU ที่มี SMT 4 ตัวท้ายคือ 2 คอร์จริง
  - BelowNormal บังคับผ่าน Job (`gaming_native.cs:46`) งานปกติของเจ้าของ (เช่น เกม) ที่ใช้คอร์ชุดเดียวกันจะได้ CPU ก่อนเสมอ
  - Job ไม่มี `KILL_ON_JOB_CLOSE` (`gaming_native.cs:46`) ถ้า Codex ตัดคำสั่งที่ค้าง ต้นไม้ process ของ Edge อาจเหลืออยู่และใช้ 4 ตัวเดิมต่อ รอบวินิจฉัย C-1 หลายรอบจึงอาจทิ้ง process ค้างสะสมไว้
  - v1 ให้ 9 ตัว v2 ให้ 4 ตัว (`v05d/…/gaming_mode.ps1:13` เทียบ README v2 บรรทัด 14, 19)
- **หลักฐานค้าน:** บนคลาวด์ probe ใช้ CPU รวมเพียง ~0.5 วินาที (headless shell) ถึง ~1 วินาที (Chromium ตัวเต็ม) (ข้อ 3) ถ้าเครื่องว่าง 4 logical processor เกินพอ สมมติฐานนี้จึงต้องมี "งานแย่ง" ร่วมด้วย
- **ยืนยัน:** log แสดง `machine_pct` สูงในช่วงนั้น หรือ `procs` มากผิดปกติ**ก่อน** probe เริ่ม (process ค้าง)
- **หักล้าง:** `machine_pct` ต่ำและ `procs` เป็น 0 ก่อนเริ่ม

### H3. GPU process ของ Edge ค้างหรือวนเริ่มใหม่ตอนเตรียม SwiftShader

- **หลักฐาน:** probe บังคับ `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` (`tools/qa/profiles.mjs` LAUNCH_ARGS) กับ Edge ตัวเต็ม ไม่ทราบว่า Local Art ใช้ flag ชุดเดียวกันหรือไม่ · `getContext('webgl2')` ใน `page.evaluate` ไม่มี timeout (`webgl2-probe.mjs:28-33`) ถ้า GPU process ไม่ตอบ จะค้างเงียบ (ทดลองแล้วในข้อ 3 แถว P5)
- **ยืนยัน:** probe ที่พิมพ์ความคืบหน้ารายขั้นหยุดที่ขั้น `context`
- **หักล้าง:** หยุดที่ขั้น `launch` (เบราว์เซอร์ยังต่อไม่ติด)

### H4. ตัวเฝ้าพักงานจนถึง HELD เพราะวัดเกินจริง

- **ทำไมเข้ากับอาการ:** HELD คือ suspend ทุก process รวม node และ PowerShell ตัวรัน โดยไม่ปล่อย (`gaming_mode.ps1:139-148`) ผลคือค้างเงียบไม่มี JSON และกฎของ Codex คือ "ถ้า Gaming Mode พักงาน ให้หยุดรอ" (`CODEX_HANDOFF_R5.md:47`)
- **ทำไมอันดับไม่สูง:** ตามเลขข้อ 1.2 งานใช้ได้ไม่เกิน 25% จึงไม่ควรเกิน 35% จะเกินได้ต้องมีการนับซ้ำ
- **จุดในโค้ดที่นับซ้ำได้:** ตัวเฝ้าสร้าง Job `w_` ให้ process ที่ "ไม่อยู่ใต้ launcher" (`gaming_mode.ps1:97-110`) แต่เพิ่งเปิด Job `r_` ของตัวรันหลังจากนั้น (`:115-118`) ถ้าสายพ่อลูกจาก PowerShell ตัวรันไปถึง Edge ขาด (process กลางจบไปแล้ว) ในรอบแรก Edge จะได้ Job `w_` ซ้อนอยู่ใน `r_` แล้วเวลา CPU ถูกนับทั้งสอง Job (`:124-128`) ค่าที่วัดจะเป็น 2 เท่า (สูงสุด 50%) → พัก → HELD · **ไม่ทราบ**ว่า Edge บนเครื่องนั้นทำให้สายพ่อลูกขาดจริงหรือไม่
- **ทดลองบนคลาวด์:** การพัก 10 วินาทีครั้งเดียว probe ฟื้นได้เองทุกแบบ (ข้อ 3 แถว P1–P4) ดังนั้นต้องเป็น HELD เท่านั้นจึงจะตรงอาการ
- **ยืนยัน/หักล้าง:** คอลัมน์ `state` ใน `gaming_mode_log.csv` มีแถว `PAUSED`/`HELD` ในช่วงนั้นหรือไม่ และมีไฟล์ `gaming_mode_suspended.txt` หรือไม่

### H5. Job Object ขัดกับการสร้าง process ของ Edge

- **หลักฐานจากโค้ด:** Job ไม่อนุญาต breakaway (`gaming_native.cs:46`) ถ้า Edge หรือตัวช่วยของ Edge สร้าง process ด้วย `CREATE_BREAKAWAY_FROM_JOB` การสร้างจะล้มเหลว
- **ทำไมอันดับต่ำ:** Windows 8 ขึ้นไปรองรับ Job ซ้อน, Playwright เปิด Chromium ด้วย `--no-sandbox` เป็นค่าเริ่มต้น และ Chromium headless ทำงานใน Job ของระบบ CI และ container ทั่วไปได้ · v1 ไม่ใช้ Job จึงไม่เคยทดสอบจุดนี้ (`README.md:77`)
- **ยืนยัน:** stderr ของ Edge มี error การสร้าง process (access denied) · **หักล้าง:** Edge มี process ลูกครบ (gpu, renderer) ระหว่างที่ค้าง

### H6. Playwright กับ Edge เวอร์ชันไม่เข้ากัน

- **หลักฐาน:** Playwright ของ Codex ไม่ทราบเวอร์ชัน Edge อัปเดตเอง · Playwright รุ่นเก่าส่ง `--headless=old` ซึ่ง Chromium รุ่นใหม่ตัดออกแล้ว
- **ทำไมอันดับต่ำ:** กรณีนี้เบราว์เซอร์มักปิดตัวทันที Playwright จะแจ้ง error เร็ว และ probe พิมพ์ JSON ขั้น `launch` (`webgl2-probe.mjs:21-22`) ไม่ใช่ค้างเงียบ
- **ยืนยัน/หักล้าง:** เลขเวอร์ชัน Playwright (`package.json` ใน `NODE_PATH`) และ Edge

### H7. ตัวห่อ PowerShell

- **หลักฐานจากโค้ด:** `gaming_run.ps1:8` ตั้ง `$ErrorActionPreference = 'Stop'` แล้วเรียกงานด้วย `& $exe @rest` (`:33`) ใน Windows PowerShell 5.1 ข้อความ stderr ของโปรแกรมภายนอกอาจถูกแปลงเป็น error และหยุดสคริปต์ก่อนถึง `exit $code` โดย process ลูกยังทำงานต่อ
- **ทำไมอันดับต่ำ:** probe ไม่เขียน stderr ในกรณีปกติ และ vitest/tsc ของ C-2 รันผ่านตัวห่อเดียวกันได้
- **ยืนยัน/หักล้าง:** ข้อความ `NativeCommandError` ในผลลัพธ์ของ Codex

### ตัดออก: เพดานบังคับ 30% บีบจน GPU process timeout

เพดาน 30% สูงกว่าที่ affinity ยอมให้ใช้ (25%) จึงไม่ถูกใช้งาน (ข้อ 1.2) ข้อนี้เป็นการคำนวณจากโค้ด ยังไม่ได้วัดบน Windows ว่าการเปิด rate control มีผลข้างเคียงกับตัวจัดคิวหรือไม่

## 3. ผลทดลองบน container Linux

**ข้อจำกัด:** Linux ไม่มี Job Object การทดลองใช้ `taskset`, `nice`, `chrt -i` และ `SIGSTOP/SIGCONT` ซึ่งเลียนแบบได้เพียงคร่าว ๆ ตัวจัดคิวของ Linux ต่างจาก Windows และเบราว์เซอร์คือ Playwright Chromium 158 ไม่ใช่ Edge · container มี 4 คอร์ และมี agent อื่นใช้งานพร้อมกัน เวลาจึงแกว่งได้ · ทุกคำสั่งมี `timeout` ไม่เกิน 100 วินาที และปิด process ของตัวเองหลังจบ

| # | การทดลอง | ผล |
|---|---|---|
| E1 | probe ปกติ 3 ครั้ง | READY ทุกครั้ง 0.45–0.66 วินาที |
| E2 | จำกัด 1 คอร์ (`taskset -c 0`) 2 ครั้ง | READY 0.51 วินาที |
| E3 | 1 คอร์ + `nice 19` + ตัวเผา CPU 4 ตัวบนคอร์เดียวกัน | READY 1.3 วินาที |
| E4 | เหมือน E3 แต่ตัวเผา 16 ตัว | READY 1.3 วินาที |
| E5 | 1 คอร์ + `SCHED_IDLE` + ตัวเผา 2 ตัว | READY 2.3 วินาที |
| E6 | CPU รวมที่ probe ใช้ทั้งต้นไม้ process | headless shell ~0.5 วินาที CPU · Chromium ตัวเต็ม (`--channel chromium`, headless ใหม่) ~0.9 วินาที CPU, 1.1 วินาทีจริง |
| P1 | หยุดทั้งต้นไม้ 10 วินาที ตั้งแต่ +0.15 วินาที แล้วปล่อย | READY รวม 10.8 วินาที |
| P2 | หยุดทั้งต้นไม้ (7 process) 10 วินาที ที่ +0.45 วินาที | READY รวม 10.9 วินาที |
| P3 | หยุดเฉพาะเบราว์เซอร์ 10 วินาที | READY รวม 11.0 วินาที |
| P4 | หยุดเฉพาะ node 10 วินาที | READY รวม 10.7 วินาที |
| P5 | หยุด GPU process ค้างไว้ | **ไม่มี JSON** ตลอด 40 วินาที จนถูก `timeout` ตัด |
| P6 | หยุดเบราว์เซอร์ทั้งหมดค้างไว้ | **ไม่มี output เลย (0 byte)** ตลอด 40 วินาที |

หมายเหตุ E3/E4: ลูป CPU ล้วนภายใต้เงื่อนไขเดียวกันช้าลงกว่า 10 เท่า (4.5 → เกิน 50 วินาที) แต่ probe ช้าลงแค่ ~2 เท่า เพราะใช้ CPU น้อยและเป็นช่วงสั้น ๆ ผลนี้**ไม่**รับประกันว่า Windows จะไม่ปล่อยให้งาน BelowNormal อดจนค้าง

สิ่งที่ผลทดลองบอก:

- งานของ probe เบามาก (ไม่ถึง 1 วินาที CPU) การจำกัดคอร์หรือ priority อย่างเดียวไม่น่าทำให้เกิน 60 วินาที ต้องมีการอด CPU เกือบสมบูรณ์ หรือการค้างเชิงหน้าที่ (ไม่ใช่ช้า)
- การพักชั่วคราว 10 วินาทีไม่ทำให้ probe พัง → ถ้าตัวเฝ้าเกี่ยว ต้องเป็น HELD
- probe เงียบสนิทเมื่อเบราว์เซอร์หรือ GPU process ไม่ตอบ → ยืนยันข้อ 1.3

## 4. การวินิจฉัยชี้ขาด 1 อย่างบนเครื่อง PC — NEEDS OWNER

**ข้อเสนอ: ไม่รันอะไรเพิ่ม ให้เจ้าของแนบไฟล์ที่มีอยู่แล้ว 2 ไฟล์ในแชต PM**

| ไฟล์ | ที่อยู่ | ใช้ตัดสินอะไร |
|---|---|---|
| `gaming_mode_log.csv` | `C:\SYNES_ASSETS\SYNES_OUTPUT\tools\gaming_mode\` | แถวช่วงเวลาที่ Codex รัน probe (และรอบวินิจฉัย C-1) |
| รายงาน BLOCKED ของ C-1 | handoff ของ Codex ใน worktree `codex-r5` (`docs/HANDOFF.md` ส่วนบนสุด) หรือข้อความที่ Codex ตอบ | อาการจริงของรอบวินิจฉัยเดิม เวอร์ชัน Edge/Playwright ถ้า Codex จดไว้ |

ถ้ามีไฟล์ `gaming_mode_suspended.txt` ในโฟลเดอร์เดียวกัน ให้แนบด้วย

**วิธีอ่าน log** (คอลัมน์ `time,ours_pct,machine_pct,procs,jobs,fallback,state` ตาม `gaming_mode.ps1:44,67`):

| สิ่งที่เห็นในช่วงที่ probe ค้าง | สรุป |
|---|---|
| `state=ON`, `ours_pct` ใกล้ 0, `machine_pct` ต่ำ, `procs` > 0 | ไม่ใช่ปัญหา CPU → H1 / H3 / H5 (ค้างเชิงหน้าที่) ระบบคุมทรัพยากรไม่ใช่ตัวการ |
| `state=ON`, `ours_pct` ต่ำ, `machine_pct` สูง | H2 (ถูกงานอื่นแย่ง 4 ตัวท้าย) |
| `procs` สูงตั้งแต่ก่อน probe เริ่ม | H2 แบบ process ค้างสะสมจากรอบก่อน |
| `ours_pct` ค้างใกล้ 25% | เบราว์เซอร์ทำงานอยู่จริงแต่ไม่จบ → H3 |
| มีแถว `PAUSED` หรือ `HELD`, `ours_pct` > 35 | H4 และถ้า `ours_pct` เกิน 25 แปลว่าการวัดนับซ้ำ |
| `fallback` > 0 | ใส่ Job ไม่สำเร็จบาง process → H5 |

**เหตุผลที่เลือกข้อนี้:**

- ไม่ใช้ CPU เครื่องเจ้าของ ไม่เปิดเบราว์เซอร์ ไม่แตะ Gaming Mode
- ไม่ใช่การวนวินิจฉัยซ้ำ เพราะเป็นการอ่านบันทึกของสิ่งที่เกิดไปแล้ว
- แยกคำถามหลักได้ทันที: "ระบบคุมทรัพยากรเกี่ยวหรือไม่"
- log มีแต่เวลาและตัวเลข ไม่มี path หรือชื่อผู้ใช้ (ตรวจจากรูปแบบบรรทัด `gaming_mode.ps1:67`) ส่วนรายงานของ Codex ให้ตรวจว่าไม่มี path ที่มีชื่อผู้ใช้ก่อน commit เข้า repo Public

**สิ่งที่ไม่เสนอ:**

- ไม่เสนอปิด, ผ่อน หรือเลี่ยง Gaming Mode และไม่เสนอเพิ่มจำนวนคอร์ (การเปลี่ยนกฎ Gaming Mode = NEEDS OWNER และไม่จำเป็นต่อ C-1)
- ไม่เสนอให้ Codex ลองเปิดเบราว์เซอร์ซ้ำด้วย flag อื่น
- **ไม่เสนอรัน probe ซ้ำบน PC ตอนนี้** ถ้าภายหลังเจ้าของต้องการให้ PC กลับมารัน QA เบราว์เซอร์ได้ ค่อยพิจารณารัน probe รุ่นที่พิมพ์ความคืบหน้ารายขั้นและมี timeout ในตัว 1 ครั้ง (ต้องแก้ `webgl2-probe.mjs` ก่อน ซึ่งเป็นงานของ PM และเป็น NEEDS OWNER แยกอีกข้อ) สำหรับ C-1 ใช้คลาวด์ได้เลยโดยไม่ต้องทำข้อนี้

## 5. ใช้คลาวด์เป็นสภาพแวดล้อม QA ของ C-1 ได้แค่ไหน

### ข้อเท็จจริงที่ทำให้คลาวด์ตรวจ C-1 ได้ตรงจุด

- เกมตัดสิน portrait จาก `camera.aspect < 1` (`src/render/view.ts:709`) ไม่ได้อ่าน `orientationchange`
- เกมฟังเฉพาะ event `resize` (`src/main.ts:275` → `view.resize()`) ไม่มี listener ของ `orientationchange` หรือ `visualViewport`
- ดังนั้น `page.setViewportSize(390x844)` ของ Playwright วิ่งผ่านโค้ดเส้นเดียวกับการหมุนจอจริง
- บั๊กอยู่ที่ `view.ts:731-736`: portrait ตั้ง `need = 0` แต่ `camPull` ลดช้า (ค้าง 0.7 วินาที แล้วลด 0.9 ต่อวินาที) และบรรทัด 736 คูณ `(1 + camPull)` ทุกกรณี
- คลาวด์เคยรัน QA เต็มชุดของ C-2 ผ่านแล้ว (`docs/qa/c2-v01/QA_C2.md`)

### ตรวจได้บนคลาวด์

| รายการ | เครื่องมือ |
|---|---|
| Minimal WebGL2 Test ก่อนรันชุดเต็ม | `tools/qa/webgl2-probe.mjs` |
| vitest, tsc, build | `npm test`, `npm run typecheck`, `npm run build` |
| lifecycle 20/20 | `tools/qa/lifecycle.mjs` |
| หมุน landscape → portrait โดยบังคับ pull ค้างไว้ แล้ววัดทีละเฟรมว่ากล้อง portrait ไม่เกินระยะที่ควรเป็น | `tools/qa/c1-rotate.mjs` (agent อื่นกำลังเขียนคู่ขนาน, ค่าก่อนแก้อยู่ที่ `docs/qa/c1-prep/`) |
| ภาพ landscape เหมือนฐานทุกพิกเซล (C-1 ต้องไม่เปลี่ยน landscape) | `tools/qa/stage1-shots` + pixel diff แบบเดียวกับ C-2 |
| portrait → landscape (ข้อมูลประกอบ) | `tools/qa/c1-rotate.mjs` |
| QA อิสระโดย agent ที่ไม่ได้เขียนโค้ด | ขั้นตอนเดิมของ PM |

### ตรวจไม่ได้บนคลาวด์ (ต้องเขียนว่า "ยังไม่ได้ทดสอบ")

- การหมุนเครื่องจริงบน iPhone/Android: ลำดับและจังหวะของ event `resize` ระหว่างแอนิเมชันหมุน, แถบ URL ของ Safari ที่เปลี่ยนขนาด viewport
- WebKit/Safari (คลาวด์เป็น Chromium)
- GPU มือถือ, FPS และ DPR จริง
- ความรู้สึกของผู้เล่นตอนกล้องเปลี่ยน (เป็นเรื่องดีไซน์ ต้องให้ทีม A/เจ้าของดู)

ส่วนที่ตรวจไม่ได้ปิดได้ด้วยการที่เจ้าของหมุนจอ iPhone 1 ครั้งบนบิลด์ทดสอบ ซึ่งต้องขึ้น Pages (NEEDS OWNER ตาม PROJECT_SYNES ข้อ 4) จึงไม่รวมในเกณฑ์รับของ C-1 รอบนี้

## 6. เส้นทางที่แนะนำสำหรับ C-1 (ข้อเสนอ)

1. **เจ้าของสั่งเลิกพัก C-1** และยืนยันทางแก้ข้อ 1 (ล้าง pull ในแนวตั้ง) ตามเงื่อนไขเดิมใน `CODEX_HANDOFF_R5.md:59` — NEEDS OWNER
2. **Codex บน PC (worktree `codex-r5`, งานค้างที่ยังไม่ commit):**
   - ทำโค้ด C-1 ให้จบ + เทสต์ที่ไม่ใช้เบราว์เซอร์ (vitest ของ `cameraField`, tsc, build) ผ่าน `gaming_run.ps1` ตามกฎเดิม
   - **ไม่เปิดเบราว์เซอร์ ไม่รัน probe ไม่วินิจฉัย WebGL2**
   - commit เดียวบน `lane/codex-r5` แล้วสร้างไฟล์ด้วย `git format-patch` (ห้ามใช้ `>` หรือ `Set-Content`)
3. **เจ้าของแนบไฟล์ patch ในแชต PM** (พร้อมไฟล์ในข้อ 4 ถ้าสะดวก) — NEEDS OWNER (การกระทำของเจ้าของ)
4. **PM บนคลาวด์:** ตรวจ SHA256 → apply บนฐาน `839c9c0` → `webgl2-probe` → vitest/tsc/build → lifecycle → `c1-rotate.mjs` (ก่อน/หลัง) → pixel diff landscape → QA อิสระ
5. **ไม่ push** branch pilot ขึ้น repo Public (ยังไม่อนุมัติ) ผลอยู่ใน `docs/qa/` ของ `art/env-polish`

**ทางเลือกถ้าเจ้าของไม่ต้องการให้ Codex แตะ C-1 ต่อ:** งาน C-1 เป็นการแก้บั๊กให้ตรงดีไซน์เดิม (comment `view.ts:729-730` เขียนว่า "Portrait is untouched") Claude บนคลาวด์ทำเองได้ตาม CLAUDE.md ข้อ 0 แต่จะซ้ำกับงานค้างของ Codex ใน `codex-r5` จึงต้องให้เจ้าของเลือก — NEEDS OWNER

**ความเสี่ยง:**

| ความเสี่ยง | ผล | การลด |
|---|---|---|
| Codex เขียนโค้ดโดยไม่ได้เห็นผลในเบราว์เซอร์ | patch แรกอาจไม่ผ่าน ต้องส่งกลับ 1–2 รอบผ่านเจ้าของ | ส่งค่าก่อนแก้จาก `docs/qa/c1-prep/` และเกณฑ์ผ่านของ `c1-rotate.mjs` ให้ Codex พร้อมพรอมป์ต์ |
| C-1 กับ C-2 แตะ `view.ts` ทั้งคู่ | patch ชนกันตอน apply | C-2 ถูกห้ามแตะ `updateCamera`/`resize`/`camPull*` แล้ว (`docs/team/2026-11-24-pm-qa-env-and-c2.md` ข้อ 3) PM apply C-1 บนฐานเดียวกันแล้วค่อยรวม |
| การย้ายไฟล์ต้องผ่านมือเจ้าของ | ช้า ขึ้นกับเวลาของเจ้าของ | รวมไฟล์ที่ต้องแนบเป็นครั้งเดียว |
| `setViewportSize` ไม่เท่าการหมุนจริง | อาจมีบั๊กเฉพาะเครื่องจริงหลงเหลือ | รายงานว่า Android/iPhone "ยังไม่ได้ทดสอบ" |
| QA เบราว์เซอร์บน PC ยังใช้ไม่ได้ | งานถัดไปที่ต้องใช้เบราว์เซอร์ (C-4, C-5, C-3) ต้องพึ่งคลาวด์ทั้งหมด | ข้อ 4 ตอบได้ว่าคุ้มจะซ่อมฝั่ง PC หรือไม่ |

**รุ่นที่แนะนำสำหรับขั้นถัดไป (CLAUDE.md ข้อ 5.2):** Opus ตรวจ patch และ QA อิสระ · Sonnet รันชุดเทสต์และ apply patch

## 7. รายการ NEEDS OWNER

| # | เรื่อง | ถ้าไม่ตอบ |
|---|---|---|
| 1 | สั่งเลิกพัก C-1 และยืนยันทางแก้ข้อ 1 (ล้าง pull ในแนวตั้ง) | C-1 พักต่อ |
| 2 | เลือกผู้ทำ C-1: Codex ทำต่อจากงานค้างใน `codex-r5` แล้วส่ง patch (แนะนำ) หรือให้ Claude ทำบนคลาวด์ | C-1 พักต่อ |
| 3 | แนบ `gaming_mode_log.csv` + รายงาน BLOCKED ของ C-1 (+ `gaming_mode_suspended.txt` ถ้ามี) ในแชต PM | สาเหตุฝั่ง PC ยังไม่ทราบ, QA เบราว์เซอร์ใช้คลาวด์ต่อ |
| 4 | แนบไฟล์ patch ของ C-1 เมื่อ Codex ทำเสร็จ | QA คลาวด์เริ่มไม่ได้ |
| 5 | (ไม่เร่ง, ไม่แนะนำตอนนี้) อนุมัติให้ PM แก้ probe ให้พิมพ์ความคืบหน้ารายขั้น + timeout แล้วให้ Codex รัน 1 ครั้งผ่าน Gaming Mode | ไม่ทำ |
| 6 | (ไม่เสนอให้ทำ, บันทึกไว้เท่านั้น) การเปลี่ยนกฎ Gaming Mode ใด ๆ เช่น จำนวน logical processor หรือการแก้จุดนับซ้ำใน H4 | ไม่เปลี่ยน |

## 8. สิ่งที่ยังไม่ทราบ

- อาการ WebGL2 จริงของรอบวินิจฉัย C-1 (ไม่มีรายงาน)
- probe ค้างที่ขั้นไหน (launch, context, close) และ Codex ตัดคำสั่งที่กี่วินาที
- สถานะของตัวเฝ้า (`ON`/`PAUSED`/`HELD`) และค่า `ours_pct`, `machine_pct`, `procs` ในช่วงนั้น
- เวอร์ชัน Edge, เวอร์ชัน Playwright ที่มากับ Codex และ flag ที่ตัวเปิดของ Local Art (`qa_cdp.mjs`) ใช้
- runtime ของ Codex บน Windows รันคำสั่งภายใต้ sandbox หรือ Job ของตัวเองหรือไม่
- รุ่น CPU ของเครื่อง (4 logical processor ท้ายสุดเป็น E-core, คู่ SMT หรือคอร์เต็ม)
- ขณะนั้นเจ้าของใช้เครื่องทำงานหนักอื่นอยู่หรือไม่ และมี process ของ Edge/node ค้างจากรอบก่อนหรือไม่
- Edge + SwiftShader ภายใต้ Job Object ของ v2 ทำงานได้หรือไม่ (v2 ยังไม่เคยทดสอบกับเบราว์เซอร์จริง)
- ผลบนคลาวด์เป็น Linux + Chromium 158 จึงใช้ยืนยันพฤติกรรมของ Windows Job Object ไม่ได้
- สถานะทดสอบ C-1: PC (เบราว์เซอร์จริง) ยังไม่ได้ทดสอบ · Android ยังไม่ได้ทดสอบ · iPhone ยังไม่ได้ทดสอบ · คลาวด์ (Chromium + SwiftShader) รอ patch
