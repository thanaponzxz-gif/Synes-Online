# PM: QA Environment ทางเลือก + พรอมป์ต์ C-2 · 2026-11-24 · 🟡 MAIN · Synes Online · รอบ 2-E
คำสั่งเจ้าของ: Codex รายงาน C-1 = BLOCKED (วินิจฉัย WebGL2 ครบจำนวนรอบที่อนุมัติ) → **พัก C-1** · PM จัดหา QA Environment ทางเลือก โดยตรวจ Browser Runtime ที่ PM เคยผ่าน · ใช้ Minimal WebGL2 Test ก่อนรันเกมเต็มชุด · **ห้ามลดมาตรฐาน QA หรือฝืนปิดระบบควบคุมทรัพยากร** · เตรียมพรอมป์ต์ C-2 ใน worktree แยกจาก C-1 ที่ยังไม่ commit
หมายเหตุ: PM **ไม่ได้รับรายงาน BLOCKED ของ Codex** (อยู่บนเครื่องเจ้าของ) จึงไม่ทราบอาการ WebGL2 ที่แน่ชัด

## 1. QA Environment ทางเลือก = container คลาวด์ของ PM (ตรวจแล้ว)
| เรื่อง | ผล (2026-11-24) |
|---|---|
| Runtime | Playwright Chromium 158.0.8127.36 headless · flags `LAUNCH_ARGS` ใน `tools/qa/profiles.mjs` (ANGLE + SwiftShader) · ตัวเดียวกับที่รัน stage1-shots 34 ภาพ, pixeldiff, lifecycle 20/20 ในรอบนี้ |
| Minimal WebGL2 Test | `node tools/qa/webgl2-probe.mjs` → **WEBGL2 READY** · WebGL 2.0 / GLSL ES 3.00 · SwiftShader (Vulkan 1.3) · max texture 8192 · วาดสามเหลี่ยมอ่านพิกเซลกลับถูก (0,255,0,255) · glError 0 · 0.7 วินาที |
| วัด C-2 ได้จริง | ฐาน `839c9c0` (fix2) เรียก `view.buildLevel(world)` 6 รอบ: geometries low 38→134, medium 40→142, medium+envlib 47→149 (**+16/+17 ต่อรอบ**), textures +1 ต่อรอบ, programs คงที่ → ตรงกับตัวเลข QA เดิมของ Local Art |
| ระบบควบคุมทรัพยากร | container แยกจากเครื่องเจ้าของ ไม่ใช้ CPU เครื่องเจ้าของ จึงไม่ต้องปิดหรือเลี่ยง Gaming Mode |
| ข้อจำกัด | ไม่ใช่มือถือจริง · GPU เป็นซอฟต์แวร์ · เปิดผ่าน repo Public ไม่ได้ เพราะยังไม่อนุมัติ push pilot |

**วิธีส่งงานเข้า QA คลาวด์ (ไม่ต้อง push):** Codex สร้างไฟล์ patch ด้วย `git format-patch` (ห้ามผ่าน `>`/`Set-Content` ของ PowerShell) → เจ้าของแนบไฟล์ในแชต PM แบบเดียวกับ zip v05c/d/e → PM ตรวจ SHA256 → apply บน worktree ฐานเดียวกัน → รัน Minimal WebGL2 Test → รันชุดเต็ม → QA อิสระ (agent ที่ไม่ได้เขียนงานนั้น)
**มาตรฐานไม่ลด:** เกณฑ์รับเหมือนเดิมทุกข้อ (vitest, tsc, build, lifecycle 20/20, ภาพ, calls) แค่ย้ายที่รันส่วนที่ต้องใช้ WebGL2 จากเครื่องเจ้าของมาที่คลาวด์ · งานที่ไม่ผ่านชุดเต็มบนคลาวด์ = ไม่ตรวจรับ

**C-1 (พัก):** ใช้ช่องทางเดียวกันได้เมื่อเจ้าของสั่งให้กลับมาทำ: Codex ส่ง patch ของ C-1 ที่ทำค้างไว้ (ถ้ามี) PM รันชุดเต็ม + การทดสอบหมุนจอบนคลาวด์

## 2. C-2 ทดสอบได้โดยไม่ติด WebGL2 Blocker เดิมหรือไม่ (ข้อเท็จจริง)
- **บนเครื่องเจ้าของ: บางส่วน** · vitest, tsc, vite build ไม่ใช้ WebGL → รันได้ · การวัด `renderer.info.memory`, stage1-shots และ lifecycle ต้องสร้าง `WebGLRenderer` ในเบราว์เซอร์ → ถ้า Minimal WebGL2 Test ไม่ผ่านบนเครื่องนั้น ก็จะติดเหมือน C-1
- **บนคลาวด์: ได้ครบ** (ตารางข้างบน)
- ดังนั้นพรอมป์ต์ C-2 ให้ Codex รัน Minimal WebGL2 Test **ครั้งเดียว** ถ้าไม่ผ่าน ให้ข้ามขั้นที่ใช้เบราว์เซอร์ (ห้ามวินิจฉัย WebGL2 ซ้ำ ห้ามแก้ flag/Gaming Mode) แล้วส่ง patch ให้ PM รันบนคลาวด์

## 3. Worktree แยกจาก C-1
- C-1 ค้างใน `C:\SYNES_ASSETS\_repo_worktrees\codex-r5` (branch `lane/codex-r5`, ยังไม่ commit) → **ห้ามแตะ**
- C-2 ใช้ worktree ใหม่ `C:\SYNES_ASSETS\_repo_worktrees\codex-c2` · branch `lane/codex-c2` · ฐาน `839c9c0` · port ทดสอบ 8095
- C-2 อาจแตะ `src/render/view.ts` (ส่วน `buildLevel`/dispose) ซึ่ง C-1 ก็แตะ (ส่วน `updateCamera`/`resize`) → **ห้ามแก้ `updateCamera`, `resize`, `camPull*`, `cameraField.ts`** เพื่อให้ PM merge สองงานได้โดยไม่ชนกัน (แทนกฎเดิม "C-2 ทำหลัง C-1 commit" เพราะ C-1 พัก)

---

## 4. พรอมป์ต์ C-2 (คัดลอกทั้งกล่อง วางใน Codex เซสชันใหม่)

```text
คุณคือ Codex ทำงาน Local บนเครื่องของเจ้าของโปรเจกต์ Synes Online ตามที่เจ้าของอนุมัติ 2026-11-24
Task ID: C-2 (geometry และ texture รั่วตอน buildLevel) · reasoning ปานกลาง
C-1 พักอยู่ (BLOCKED, WebGL2) ห้ามแตะงาน C-1 ทุกกรณี

ที่ทำงาน (ใหม่ แยกจาก C-1)
- Worktree ใหม่: C:\SYNES_ASSETS\_repo_worktrees\codex-c2 · branch lane/codex-c2 · ฐาน 839c9c00ab8ab3a447d1f9798e2f11995c34ac8b
- ห้ามแตะ C:\SYNES_ASSETS\_repo_worktrees\codex-r5 (C-1 ที่ยังไม่ commit), C:\SYNES_ASSETS\_repo_worktrees\synes-env-r5 (ทีม B) และ checkout หลักในโฟลเดอร์เอกสารของเจ้าของ
- สร้าง worktree (คำสั่ง git เบา ไม่ต้องผ่าน gaming_run):
    git -C C:\SYNES_ASSETS\_repo_worktrees\codex-r5 worktree add C:\SYNES_ASSETS\_repo_worktrees\codex-c2 -b lane/codex-c2 839c9c00ab8ab3a447d1f9798e2f11995c34ac8b
  (คำสั่งนี้ไม่เปลี่ยนไฟล์ใน codex-r5) ถ้า branch lane/codex-c2 มีอยู่แล้ว ให้หยุดและรายงาน
- node_modules: ทำ junction ไปที่เป้าหมายเดียวกับของ codex-r5 ห้าม npm install / npm ci
    $t = (Get-Item C:\SYNES_ASSETS\_repo_worktrees\codex-r5\node_modules).Target
    cmd /c mklink /J C:\SYNES_ASSETS\_repo_worktrees\codex-c2\node_modules "$t"
- ตัวแปรคำสั่ง: ใช้ข้อ 4 ของ C:\SYNES_ASSETS\SYNES_OUTPUT\CODEX_HANDOFF_R5.md โดยเปลี่ยน
    $WT = 'C:\SYNES_ASSETS\_repo_worktrees\codex-c2' และ port เซิร์ฟเวอร์เป็น 8095 และตัวกรองตอนปิดเซิร์ฟเวอร์เป็น 'codex-c2\\server\\index\.ts'

อ่านก่อนเริ่ม: CLAUDE.md, AGENTS.md, docs/HANDOFF.md ส่วนบนสุด, C:\SYNES_ASSETS\SYNES_OUTPUT\CODEX_HANDOFF_R5.md

กฎ (เหมือนเดิมทุกข้อ)
1. ทีม A เป็น Design Authority (ADR-007) C-2 ต้องไม่เปลี่ยนสิ่งที่ผู้เล่นเห็นหรือรู้สึก ถ้าต้องเลือกรูปทรง สี ตำแหน่ง หรือกฎใหม่ ให้หยุดและถาม
2. ห้าม push ห้าม merge ห้ามใช้บริการเสียเงิน ห้ามติดตั้งอะไรเพิ่ม ห้ามใส่ไฟล์ Hero หรือข้อมูลส่วนตัว (อีเมล ชื่อผู้ใช้ path ที่มีชื่อผู้ใช้)
3. Gaming Mode: เปิดตัวเฝ้าก่อนงานหนัก รันงานหนักทุกคำสั่งผ่าน gaming_run.ps1 ทีละ process ถ้าตัวรันปฏิเสธ (exit 3/4/5) หรือพักงาน ให้หยุดรอ ห้ามหาทางเลี่ยง ห้ามแก้หรือปิดระบบควบคุมทรัพยากร
4. ห้ามแก้ updateCamera, resize, camPull/camPullHold, src/render/cameraField.ts (เป็นพื้นที่ของ C-1)
5. commit เดียวบน lane/codex-c2 ข้อความขึ้นต้น "C-2:" ลงท้ายด้วย attribution ตามที่ระบบกำหนด · git add เฉพาะไฟล์ที่ตั้งใจแก้ ทีละ path (ห้าม git add -A / git add .)
6. คุณตรวจงานตัวเองแทน QA อิสระไม่ได้ รายงานผลวัดของคุณเป็นข้อเท็จจริง PM จะจัด QA อิสระ

ขั้น 0: Minimal WebGL2 Test (ครั้งเดียว ห้ามวินิจฉัยซ้ำ)
- ดึงไฟล์ทดสอบจาก repo ลง worktree แบบไม่ stage (ห้ามใช้ > หรือ Set-Content):
    git -C $WT fetch origin art/env-polish
    git -C $WT restore --source=origin/art/env-polish --worktree -- tools/qa/webgl2-probe.mjs
  ไฟล์นี้เป็นของ PM ห้าม add เข้า commit C-2
- รันผ่าน gaming_run.ps1: $NODE "$WT\tools\qa\webgl2-probe.mjs" --channel msedge --out "$WT\c2_webgl2_probe.json"
  (ถ้า Edge ของ Playwright ไม่มี ให้รันซ้ำโดยไม่ใส่ --channel ได้หนึ่งครั้ง ไม่ติดตั้งอะไรเพิ่ม)
- exit 0 = READY → ทำทุกขั้นตามปกติ
- exit 1 หรือ 2 = NOT READY → บันทึกผล JSON แล้ว "ข้ามขั้นที่ใช้เบราว์เซอร์" (ขั้น 3 การวัด, stage1-shots, lifecycle) ห้ามลอง flag/วิธีอื่นเพิ่ม ทำขั้น 1, 2, 4 ให้ครบ แล้วรายงานว่า "รอ PM รันชุดเบราว์เซอร์บนคลาวด์"

ปัญหา
- ทุกครั้งที่เรียก View.buildLevel ซ้ำ renderer.info.memory.geometries เพิ่ม 16 (low) / 17 (medium) และ textures เพิ่ม 1 โดยไม่ลดกลับ programs คงที่
- PM วัดซ้ำบนคลาวด์ที่ฐาน 839c9c0 แล้ว (6 rebuild): low 38→134, medium 40→142, medium+?envlib=1 47→149
- วิธีวัด: หน้าเกม ?offline&seed=1&autostart&qafreeze&q=<tier>[&envlib=1] รอ window.__synes.state === 'playing' แล้วเรียก window.__synes.view.buildLevel(window.__synes.world) + window.__synesQA.stepTicks(2) ซ้ำ อ่าน view.renderer.info.memory หลัง render หนึ่งเฟรม

ขั้น 1: หาสาเหตุ (อ่านโค้ด ไม่ต้องใช้เบราว์เซอร์)
- ไล่ทุกอย่างที่ buildLevel สร้าง (ground canvas texture, InstancedMesh, geometry clone, material ของ nearFade, arena/deco/opening/grass, pilot) เทียบกับสิ่งที่ถูก dispose ตอนต้น buildLevel
- ระบุรายการที่ไม่ถูก dispose เป็นตาราง: ชนิด, จำนวนต่อ rebuild, บรรทัดที่สร้าง, เหตุผลที่ปล่อยได้อย่างปลอดภัย

ขั้น 2: แก้
- dispose เฉพาะของที่ buildLevel รอบก่อนสร้างและไม่มีใครใช้แล้ว ห้าม dispose ของที่ยังใช้อยู่: full baseline batch ของ pilot ระหว่าง warm-up, kit/env library ที่โหลดครั้งเดียว, material/texture ที่ใช้ร่วม (เช่น libMaterial), painted ground ที่แคชไว้ข้าม build
- ห้ามเปลี่ยนลำดับการสร้าง material (มีผลกับลำดับการวาด) และห้ามเปลี่ยนค่าใดที่มีผลกับภาพ
- ถ้าต้องเลือกทางที่ทำให้ภาพเปลี่ยน ให้หยุดและรายงาน

ขั้น 3: เครื่องมือวัด (เขียนเสมอ รันเมื่อ READY)
- เพิ่ม tools/qa/level-leak.mjs: เปิดหน้าเกมด้วย LAUNCH_ARGS จาก tools/qa/profiles.mjs, rebuild N ครั้ง (ค่าเริ่ม 10) ต่อเงื่อนไข low / medium / medium+envlib=1, รายงาน geometries, textures, programs ต่อรอบ และส่วนเพิ่มต่อรอบ, exit 0 เมื่อส่วนเพิ่มของ geometries และ textures = 0 ทุกเงื่อนไข, exit 1 ถ้าไม่ใช่, รับ --base http://host:port
- ถ้า READY: รันกับฐาน 839c9c0 (ก่อนแก้) และหลังแก้ บันทึกผลทั้งสองเป็น JSON

ขั้น 4: ทดสอบที่ไม่ใช้เบราว์เซอร์ (ผ่าน gaming_run.ps1 ทีละคำสั่ง)
- vitest ผ่านทั้งหมด · tsc --noEmit ผ่าน · vite build ผ่าน
- ถ้า READY: lifecycle 20/20 (port 8095) และ stage1-shots ก่อน/หลัง แบบ PNG (--only opening,pathA,plaza,pool,boss-open) แล้ว pixeldiff
- ถ้า NOT READY: ไม่รัน lifecycle/stage1-shots เขียนในรายงานว่า "ยังไม่ได้รัน รอ PM รันบนคลาวด์" (ห้ามเขียนว่าผ่าน)

เกณฑ์ผ่าน (PM/QA อิสระตรวจซ้ำบนคลาวด์ เกณฑ์เดิมไม่ลด)
- ส่วนเพิ่มต่อ rebuild ของ geometries และ textures = 0 ทั้ง low, medium, medium+envlib=1 (10 rebuild)
- ไม่มี console error ใหม่ ไม่มี double-dispose ไม่มีวัตถุหายหลัง rebuild และหลัง WebGL context loss/restore
- ฉาก 3D ตรงทุกพิกเซลเทียบ 839c9c0 (stage1-shots PNG, low และ medium ปิด/เปิด envlib) · draw calls และ triangles เท่าเดิมทุกภาพ
- vitest, tsc, build, lifecycle 20/20

ส่งงาน
1. commit เดียวบน lane/codex-c2 (ไม่ push)
2. สร้าง patch สำหรับ PM (ห้ามผ่าน > หรือ Set-Content):
     git -C $WT format-patch -1 HEAD -o C:\SYNES_ASSETS\SYNES_OUTPUT\c2
   แล้วคำนวณ SHA256 ของไฟล์ .patch ด้วย Get-FileHash
3. เขียน handoff บนสุดของ docs/HANDOFF.md ใน commit เดียวกัน: ทำอะไร, ตารางสาเหตุ, ผลขั้น 0 (READY/NOT READY + renderer), ผลทดสอบแต่ละข้อ (ผ่าน / ไม่ผ่าน / ยังไม่ได้รัน), ค่าสูงสุด ours_pct จาก gaming_mode_log.csv, งานค้าง, commit hash
4. รายงานภาษาไทยให้เจ้าของ: แยก ข้อเท็จจริง / ข้อเสนอ / สิ่งที่ยังไม่ทราบ · สถานะทดสอบ Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: ระบุเบราว์เซอร์จริง · บอกชื่อไฟล์ patch + SHA256 เพื่อให้เจ้าของแนบให้ PM
```
