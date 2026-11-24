# Claude-First Quota Allocation · แผนจัดสรรงาน · 2026-11-25 · 🟡 MAIN · Synes Online · รอบ 2-F
คำสั่งเจ้าของ 2026-11-25: Claude Code เป็นกำลังหลักด้าน Engineering (เป้า 65%) · Codex เป็นกำลังเฉพาะทางด้าน Technical Production (เป้า 35%) · ทีม A (ChatGPT) ควบคุม Design และ Artwork ทั้งหมด
**สถานะ: แผนเท่านั้น ยังไม่เริ่ม implementation ใด ๆ** · ใช้หลักฐานเดิม ไม่ได้รัน QA ซ้ำ · กฎเหล็ก (ADR-007), ระบบอนุมัติ (CLAUDE.md ข้อ 5.2, 6) และเกณฑ์ผ่านทุกงานคงเดิม · บันทึกเป็น ADR-011
**ยังไม่อนุมัติ:** push/merge งาน pilot · ติดตั้งเครื่องมือใหม่ · ขึ้น Pages · ผลิต asset ก่อน Design ผ่านอนุมัติ
**Android: ยังไม่ได้ทดสอบ · iPhone: ยังไม่ได้ทดสอบ · PC: หลักฐานเดิมมาจาก Chromium headless + SwiftShader บนคลาวด์**

## 0. ข้อเท็จจริงที่กำหนดแผน
| เรื่อง | ข้อเท็จจริง | ผลต่อแผน |
|---|---|---|
| WebGL2 บน PC ของเจ้าของ | ค้างภายใต้ Gaming Mode v2 · สาเหตุยังไม่ทราบ | งานที่ต้องใช้เบราว์เซอร์ทำบนคลาวด์ทั้งหมด · ไม่วนวินิจฉัยซ้ำ |
| คลาวด์ | Chromium 158 + SwiftShader, `webgl2-probe` READY (QA C-2 สำเร็จแล้ว) | Claude ทำ Engineering + Browser QA ครบวงจรได้ |
| ฐาน pilot `839c9c0` | ไม่อยู่บน remote · สร้างบนคลาวด์ได้จาก `24f56b4` + `fix2_code.patch` | งานที่แตะโค้ด pilot ต้องรอไฟล์แนบ และส่งผลเป็น patch (push ไม่ได้) |
| fix2 แตะไฟล์อะไร | 7 ไฟล์: `cameraField.ts`, `envPilot.ts`, `models.ts`, `view.ts`, `tests/cameraField.test.ts`, `tools/qa/arena-probe.mjs`, GLB | งานที่ไม่แตะ 7 ไฟล์นี้ (`main.ts`, `server/`, `fx.ts`, `hud.ts`, `buttonFade.ts`, `tools/qa/*` ใหม่) ทำบนฐาน Public `art/env-polish` ได้ และ apply ลงฐาน pilot ได้ด้วย |
| container คลาวด์ | ถูกเก็บคืนเมื่อไม่ใช้ · scratchpad หายเมื่อขึ้นเซสชันใหม่ | งานบนฐาน pilot ต้องส่ง patch ให้เจ้าของเก็บทันทีที่ผ่าน (L-025) |
| lineage | เซสชัน 2-F = 7/8 · ใช้ rollover อัตโนมัติครั้งสุดท้ายแล้วหลังการบีบอัด (2026-11-25) → รอบ 2-G = 8/8 สร้างเซสชันลูกไม่ได้ | งานของ Claude ทำผ่าน subagent (Agent tool) ในเซสชัน MAIN ที่ใช้อยู่ · ห้ามเปลี่ยนเซสชันระหว่างที่ agent ยังทำงาน |
| งาน Codex ที่ส่งไปแล้ว | **PM ไม่ทราบ** ว่าเจ้าของส่งพรอมป์ต์ C-6 (หรืองานอื่น) ให้ Codex แล้วหรือยัง และไม่ทราบว่ามีงาน C-1 ค้างใน `codex-r5` | ต้องถามสถานะ Codex ก่อนย้ายงาน (พรอมป์ต์ P1) เพื่อไม่ทำซ้ำ |
| โควตา | Claude รอบ 5 ชั่วโมง allowed · รายสัปดาห์ไม่ทราบ · Codex ไม่ทราบ · agent กลางคืน 5 ตัวใช้ 168k–271k token ต่อตัว (ระบบรายงาน) | เดินงานเป็นระลอก ≤ 3 agent พร้อมกัน ตรวจ `rate_limit_info` ก่อนเริ่มทุกระลอก |

## 1. ตารางจัดสรรงาน (Claude 65% / Codex 35%)
หน่วย = คะแนนขนาดงาน (S = 1, M = 2, L = 3, XL = 4) ประเมินจากขอบเขตใน work packages และ audit · **ไม่ใช่อัตราการใช้ token จริง** · ปรับทุกระลอกตามโควตาที่ระบบแสดงและผลที่วัดได้
| ฝั่ง | งาน | คะแนน | สถานะ |
|---|---|---|---|
| Claude | C-6 สคริปต์สร้าง patch | 1 | ย้ายจาก Codex (ขออนุมัติ) |
| Claude | C-5 เวลาโหลดใน `#debug` | 1 | ย้ายจาก Codex (ขออนุมัติ) |
| Claude | SEC-1/2/3/5 (server) | 1 | ขออนุมัติ |
| Claude | C-1 กล้องหมุนจอ v2 | 2 | ย้ายจาก Codex (ขออนุมัติ + เลิกพัก) |
| Claude | C-2b First Frame + Peak Memory + Context Restore | 3 | ย้ายจาก Codex (ขออนุมัติ + ยืนยันรับ C-2) |
| Claude | C-4 ตัวตรวจ HUD | 2 | ย้ายจาก Codex (ขออนุมัติ) |
| Claude | PERF-1/3/4 (client, ไม่เปลี่ยนภาพ) | 2 | ขออนุมัติ |
| Claude | PERF-2 (`view.ts` กล้อง) | 1 | หลัง C-1 |
| Claude | C-3 สืบสาเหตุภาพ medium ต่างกัน | 2 | ขออนุมัติ (เสนอให้ทำท้ายสุด) |
| Claude | EXP-103 meshopt (บีบอัดตอน build) | 2 | รออนุมัติติดตั้ง |
| Claude | รับและนำ asset R5.2 เข้าเกม + QA ภาพอิสระ + perf (glb-check, Before/After) | 3 | รอทีม A + Codex |
| Claude | รวม patch ชุด pilot + ทดสอบทั้งชุด (Integration) | 1 | หลังแต่ละงานผ่าน |
| Claude | PM, Final Acceptance, Handoff | 3 | ต่อเนื่อง |
| **Claude รวม** | | **24 (≈ 65%)** | |
| Codex Sol | ผลิตต้นไม้/หิน R5.2 ตามแบบทีม A ผ่าน Blender MCP | 4 | รอทีม A + อนุมัติ |
| Codex Sol | Texture และ Material ตามแบบ | 2 | รอทีม A (REQ-004 ข้อ 1–2) |
| Codex Sol | asset ของพื้นที่ Golden Reference K2 | 2 | รอทีม A |
| Codex Sol | Technical Art Pipeline / Blender MCP (สคริปต์ export, naming, LOD ตามแบบ) | 1 | รอทีม A (REQ-004 ข้อ 3, 5, 6) |
| Codex Sol | Asset Optimization ที่ต้นทาง (polycount, LOD, ขนาด texture) | 1 | รอทีม A |
| Codex Astra | Technical Art Planning (แผนผลิต R5.2 จากแบบที่อนุมัติ) | 1 | รอทีม A |
| Codex Astra | สำรอง: Engineering เสี่ยงสูง/เฉพาะทาง, Complex Code Review, งานที่ต้องใช้ PC Windows | 2 | ตามความจำเป็น |
| **Codex รวม** | | **13 (≈ 35%)** | |
ข้อสังเกต: ช่วงนี้งาน Codex ส่วนใหญ่รอแบบจากทีม A สัดส่วนตามเวลาจริงจะเอียงไปทาง Claude จนกว่าแบบ R5.2 จะมาถึง
แบ่งหน้าที่ Optimization: Codex ลดที่ต้นทาง (Blender) · Claude ทำส่วน runtime/build (meshopt, draw call, วัดผล)

## 2. งานที่เริ่มได้ทันทีตามสิทธิเดิม (ไม่ต้องขออนุมัติใหม่)
| # | งาน | ทำไมทำได้ | ผู้ทำ |
|---|---|---|---|
| N1 | รับไฟล์แนบ → ตรวจ SHA256 → สร้างฐาน `839c9c0` บนคลาวด์ → `webgl2-probe` | ช่องทางรับงานเดิมที่อนุมัติแล้ว · ไม่เปลี่ยนโค้ด | PM Opus (+ Sonnet รันคำสั่ง) |
| N2 | QA อิสระและตรวจรับ patch ของ Codex ที่ส่งไปแล้ว (ถ้ามี เช่น C-6) | ช่องทางเดิม · ไม่ทำงานซ้ำกับ Codex | QA Sonnet · PM Opus |
| N3 | เอกสาร: แผนนี้, ADR-011, handoff, ทะเบียนเครื่องมือ | งาน PM | PM Opus |
ไม่มีงาน implementation ในรายการนี้ ทุกงานโค้ดอยู่ในข้อ 3

## 3. งานที่ต้องขออนุมัติ (เรียงตามลำดับที่เสนอ)
| ID | ขออนุมัติ | ข้อเสนอ PM | ขึ้นกับ |
|---|---|---|---|
| A1 | **ส่งพรอมป์ต์ P1 ให้ Codex** (รายงานสถานะ ห้ามเริ่มงานใหม่) | ทำก่อนทุกข้อ | — |
| A2 | **ระลอก 1:** ย้าย C-6, C-5 ให้ Claude + เปิดรอบ SEC-1/2/3/5 · ทำบนฐาน Public, push branch `lane/claude-*` (ไม่มีงาน pilot) | อนุมัติ | A1 (Codex ยังไม่เริ่มงานนั้น) · ตรวจรับ C-6/C-5 ต้องมีฐาน pilot (F1) |
| A3 | **ระลอก 2:** ย้าย C-1 ให้ Claude + เลิกพัก C-1 | อนุมัติ · ถ้า Codex มีงานค้าง ให้ Codex ส่งงานค้างด้วยพรอมป์ต์ P2 แล้ว Claude ทำต่อ | A1, F1 |
| A4 | **ระลอก 2:** ยืนยันรับ C-2 (D1) + ย้าย C-2b ให้ Claude (Fable วิเคราะห์ก่อน แล้ว Sonnet ทำ) | อนุมัติ | F1, F2 |
| A5 | **ระลอก 3:** ย้าย C-4 ให้ Claude + อนุญาต push `tools/qa/hud-gate.mjs` (port จากเครื่องมือในชุด pilot ของ Local Art, ไม่มีภาพ/GLB) ขึ้น repo Public | อนุมัติ หรือให้เก็บเป็น patch แทน | F1 (zip v05c มีต้นฉบับ hud_gate) |
| A6 | **ระลอก 3:** PERF-1/3/4 (+ PERF-2 หลัง C-1) | อนุมัติ | PERF-2 หลัง C-1 |
| A7 | **ระลอก 4:** C-3 (สืบสาเหตุ, แพงที่สุด) | เลื่อนไว้จนกว่า noise ของ medium บล็อกการตรวจรับจริง | — |
| A8 | ใช้ Drive `SYNES_ASSETS` เป็นที่แลก patch (เจ้าของอัปโหลดไฟล์แนบไว้ครั้งเดียว · Claude อ่าน และถ้าอนุญาต ให้ Claude เขียน patch ที่ผ่านแล้วกลับไป) | อนุมัติ เพื่อไม่ต้องแนบซ้ำทุกเซสชัน (ไฟล์ละ ≤ 10 MB) | — |
| A9 | ติดตั้ง `gltfpack@1.3.0` บน `exp/meshopt` (EXP-103) | **ยังไม่อนุมัติ** ตามคำสั่ง · เสนอหลัง C-2b | C-2b (ชน `models.ts`) |
| A10 | (ไม่บังคับ) Codex Astra รีวิวโค้ด C-2b/C-1 แบบข้ามผู้ผลิต | ใช้เมื่อ QA อิสระของ Claude พบข้อสงสัยเท่านั้น (ประหยัดโควตา Codex) | ผล QA |
| A11 | (ภายหลัง) Codex Sol ผลิต asset R5.2 / K2 | หลังทีม A ส่งแบบและเจ้าของอนุมัติแบบ | ข้อ 4 |
ทุกข้อ: การไม่ตอบไม่ถือเป็นการอนุมัติ · ไม่มี push/merge pilot

## 4. งานที่ต้องรอทีม A
| เรื่อง | ไฟล์ | บล็อกงาน |
|---|---|---|
| แบบ R5.2: ต้นไม้บัง Potion, ต้นสน, Visual Identity | (ทีม A กำลังออกแบบ) | Codex Sol ผลิต asset, Claude นำเข้า/QA, C-7 |
| REQ-004 ข้อจำกัดไฟล์ศิลป์ (vertex colour/texture/alpha/เพดาน/LOD/ชื่อ node) | `docs/design/REQ-004-art-intake-tech.md` (แพ็ก zip ส่งเจ้าของแล้ว) | โค้ดรองรับ texture/vertex colour ในเกม, Texture & Material, KTX2 |
| REQ-005 นโยบายรางวัล + ข้อความเน็ตล้ม | `docs/design/REQ-005-audit-policy-and-messages.md` | GAME-1, NET-1…4 (Claude ทำโค้ดหลังได้แบบ) |
| Golden Reference K2 (พื้นที่) | ข้อเสนอเบื้องต้นของทีม A: Concept B, K2 = พื้นที่ Golden Reference (`2026-11-24-pm-reply-local-art.md`) | Codex Sol asset K2 |
| C-8 cross-fade ขอบป่า | REQ_R5_1 ข้อ 7 | C-8 |
| คำถามค้าง P2–P6 | `docs/design/PENDING_QUEUE.md` | งานภาพ stage1/บอส |
| Hero 001 | `PENDING_QUEUE.md` P1 | งานตัวละคร |
C-7 พักจน C-4 ผ่าน QA (คำสั่งเจ้าของ) · KTX2 และ C-9 พัก

## 5. โมเดล, reasoning, Session และ Working Directory ต่องาน
ทุกงานของ Claude ทำในเซสชัน **🟡 MAIN ที่ใช้อยู่** (ตั้งแต่ rollover 2026-11-25 = รอบ 2-G, lineage 8/8) ผ่าน Agent tool · repo `/home/user/Synes-Online` · `$SP` = scratchpad ของเซสชัน · ฐาน pilot = `$SP/wt/base-839c` (PM สร้างจาก F1) · พอร์ตคลาวด์ไม่ชนกัน · browser job ทีละตัว · ≤ 3 agent พร้อมกัน
| งาน | วิเคราะห์ | ลงมือ | QA อิสระ | ตรวจรับ | ฐาน / working dir | branch | port | ผลลัพธ์ไปที่ |
|---|---|---|---|---|---|---|---|---|
| C-6 | — | Sonnet · medium | PM ตรวจ SHA (ไม่ต้องใช้ agent) | Opus | ฐาน Public: Agent `isolation: worktree` | `lane/claude-c6` | — | push branch · ทดสอบ SHA บน `$SP/wt/base-839c` |
| C-5 | — | Sonnet · medium | Sonnet · high (agent ใหม่) | Opus | ฐาน Public: `isolation: worktree` · เทียบภาพบนฐาน pilot ด้วย | `lane/claude-c5` | 8111/8112 | push branch + patch สำหรับสาย pilot |
| SEC-1/2/3/5 | — | Sonnet · medium | Sonnet · medium | Opus | ฐาน Public: `isolation: worktree` | `lane/claude-sec` | 8151 | push branch |
| C-1 | — (สเปกชัด) | Sonnet · high | Sonnet · high + `c1-rotate.mjs` | Opus | `$SP/wt/c1` (จาก base-839c) | `lane/claude-c1` (ในเครื่อง ไม่ push) | 8121/8122 | patch → เจ้าของ (+ Drive ถ้า A8) |
| C-2b | **Fable 5.2 · high** (ทบทวนแนวทาง deferred dispose + context loss ก่อนลงมือ, อ่านอย่างเดียว) | Sonnet · high | Sonnet · high (agent ใหม่, วัด 3 บิลด์) | Opus | `$SP/wt/c2b` (base-839c + patch C-2) | `lane/claude-c2b` (ไม่ push) | 8131–8133 | patch |
| C-4 | — | Sonnet · high | Sonnet · high | Opus | ฐาน Public: `isolation: worktree` · วัดบนบิลด์ pilot | `lane/claude-c4` | 8141 | push ถ้า A5 อนุมัติ ไม่งั้น patch |
| PERF-1/3/4 | — | Sonnet · high | Sonnet · high (pixel-diff) | Opus | ฐาน Public: `isolation: worktree` | `lane/claude-perf` | 8161 | push branch |
| PERF-2 | Fable · medium ถ้าแนวทางไม่ชัด | Sonnet · high | Sonnet · high | Opus | `$SP/wt/perf2` (หลัง C-1) | ไม่ push | 8162 | patch |
| C-3 | Sonnet · high 1 รอบ → Fable · high อีก ≤ 1 รอบถ้ายังไม่พบ แล้วหยุด | — (สืบอย่างเดียว) | — | Opus | `$SP/wt/base-839c` อ่านอย่างเดียว | `lane/claude-c3` (เอกสาร) | 8171 | `docs/qa/c3-v01/` |
| EXP-103 | — | Sonnet · medium | Sonnet · medium | Opus | `exp/meshopt` จาก `art/env-polish` | `exp/meshopt` | 8181 | ตามแผน dispatch ข้อ 8 (เมื่อ A9) |
| Integration | — | Sonnet · medium (apply ชุด C-2 → C-2b → C-1 → C-5 → C-4 บน base-839c แบบ 3-way) | — | Opus | `$SP/wt/stack` | ไม่ push | 8191 | รายงาน + patch ชุดรวม |
| Codex Sol (R5.2/K2/texture/pipeline) | — | Codex Sol (reasoning ตามความยาก กลาง-สูง) | Claude Sonnet (visual QA อิสระ, glb-check, perf) | Opus + ทีม A + เจ้าของ | PC: `C:\SYNES_ASSETS\_repo_worktrees\codex-r52-assets` (ตั้งเมื่อเริ่ม) | `lane/codex-r52-assets` (ไม่ push) | — | `assets/_inbox/` ตาม ASSET_PIPELINE |
| Codex Astra | — | Codex Astra · สูง | — | Opus | PC | ตามงาน | — | รายงาน/รีวิว |
กฎร่วม: ผู้ลงมือกับผู้ QA ต้องเป็น agent คนละตัว (QA ได้โค้ดและเกณฑ์ ไม่ได้ข้อสรุปของผู้ลงมือ) · ถ้า webgl2-probe ไม่ READY หรือ blocker ใด ๆ: วินิจฉัยได้ 1 รอบ แล้วไปทำงานอื่นและรายงาน · ใช้ Opus/Fable เฉพาะช่องที่ระบุ

## 6. พรอมป์ต์พร้อมส่ง ตามลำดับ
| ลำดับ | ผู้ส่ง → ผู้รับ | พรอมป์ต์ | เมื่อไร |
|---|---|---|---|
| 1 | เจ้าของ → Codex (Sol หรือ Astra ตัวใดก็ได้, reasoning ต่ำ) | **P1** สถานะงาน | ทันที |
| 2 | เจ้าของ → MAIN | ไฟล์แนบข้อ 7 + ผล P1 + **P3** (ข้อความอนุมัติ) | หลัง P1 |
| 3 | เจ้าของ → ทีม A | แพ็ก REQ-004/005 (`dispatch-2F.md` ข้อ 5.6) | ทันที (ถ้ายังไม่ส่ง) |
| 4 | เจ้าของ → Codex | **P2** ส่งงานค้างให้ Claude | เฉพาะเมื่อ P1 รายงานว่ามีงานค้างในงานที่ย้าย |
| 5 | MAIN (PM) → agent | **P4** (ส่วนกลางของ implementer) + กล่องงานใน `dispatch-2F.md` / ข้อ 6.5 · QA ใช้ `dispatch-2F.md` ข้อ 6 | หลัง P3 ตามระลอก |
| 6 | เจ้าของ → Codex Sol | **P5** (แม่แบบผลิต asset) | หลังทีม A ส่งแบบที่เจ้าของอนุมัติแล้วเท่านั้น |

### P1 · เจ้าของ → Codex: รายงานสถานะ (ห้ามเริ่มงานใหม่)
```text
งานนี้เป็นการรายงานสถานะเท่านั้น อ่านอย่างเดียว ไม่ใช้เบราว์เซอร์ ไม่รันงานหนัก ไม่แก้ไฟล์ใด ๆ
เจ้าของปรับการจัดสรรงาน: งาน Engineering C-1 ถึง C-6 กำลังพิจารณาย้ายไปให้ Claude บนคลาวด์ Codex จะสำรองไว้สำหรับงาน Technical Production หลังทีม A ออกแบบ
1. รายงานสถานะของ C-1, C-2, C-2b, C-3, C-4, C-5, C-6, C-7 ทีละงาน: ยังไม่เริ่ม / กำลังทำ / commit แล้ว (SHA) / ส่ง patch แล้ว (ชื่อไฟล์ + SHA256)
2. ทุก worktree ใน C:\SYNES_ASSETS\_repo_worktrees\ : ชื่อโฟลเดอร์, branch, HEAD SHA, จำนวนไฟล์ที่ยังไม่ commit (git -C <WT> status --porcelain)
3. ไฟล์ใน C:\SYNES_ASSETS\SYNES_OUTPUT\ ที่ชื่อขึ้นต้นด้วย 0001- หรือเป็น .patch: path เต็ม + SHA256 (Get-FileHash)
4. ตำแหน่งเต็มของ fix2_code.patch และ SYNES_Handoff_v05c_r5_fix2.zip บนเครื่องนี้ พร้อม SHA256
ห้าม: เริ่มหรือทำงานใดต่อ, ลบหรือ reset งานค้าง, push, merge, ติดตั้ง
รายงานภาษาไทย แยก ข้อเท็จจริง / สิ่งที่ยังไม่ทราบ
```

### P2 · เจ้าของ → Codex: ส่งงานค้างให้ Claude (ใช้เมื่อ P1 พบงานค้าง)
```text
Task: ส่งงานค้าง <C-x> ให้ Claude และหยุดงานนี้ · reasoning ต่ำ · ไม่ใช้เบราว์เซอร์
<WT> = worktree ของ <C-x> ตามที่รายงานใน P1
1. git -C <WT> status แล้วรายงานไฟล์ทั้งหมดที่เปลี่ยน
2. git add ทีละ path เฉพาะไฟล์ในขอบเขตของ <C-x> (ห้าม git add -A / .) ห้ามใส่ไฟล์ Hero ข้อมูลส่วนตัว หรือ path ในเครื่อง
3. commit ข้อความ "WIP <C-x>: handover to Claude (not reviewed)" บน branch เดิม (ห้าม push)
4. git -C <WT> format-patch -1 HEAD -o C:\SYNES_ASSETS\SYNES_OUTPUT\handover\<C-x> แล้ว Get-FileHash (ห้ามใช้ > หรือ Set-Content)
5. หยุดงาน <C-x> ทั้งหมด ห้ามทำต่อ
รายงาน: ชื่อไฟล์ patch + SHA256, งานที่ทำไปแล้ว, สิ่งที่ยังไม่ได้ทำ, ผลทดสอบที่รันแล้ว (ถ้ามี)
```

### P3 · เจ้าของ → MAIN: ข้อความอนุมัติ (ลบข้อที่ไม่อนุมัติออกก่อนส่ง)
```text
ผล P1 ของ Codex: <วางผล>
แนบไฟล์: <รายการ> (หรืออัปโหลดไว้ที่ Drive SYNES_ASSETS/<โฟลเดอร์>)
อนุมัติตามแผน docs/team/2026-11-25-claude-first-allocation.md:
- A2 ระลอก 1: C-6, C-5, SEC-1/2/3/5 ให้ Claude
- A3 ระลอก 2: เลิกพัก C-1 และย้ายให้ Claude
- A4 ยืนยันรับ C-2 และย้าย C-2b ให้ Claude
- A5 ระลอก 3: C-4 ให้ Claude · push hud-gate: อนุญาต / ไม่อนุญาต (เก็บเป็น patch)
- A6 PERF-1/3/4 (+PERF-2 หลัง C-1)
- A8 ใช้ Drive SYNES_ASSETS แลก patch: อ่านอย่างเดียว / อ่านและเขียน
ไม่อนุมัติ: A7 C-3, A9 meshopt
```

### P4 · PM → agent ผู้ลงมือ (Claude Sonnet): ส่วนกลาง
```text
คุณเป็น Claude Sonnet ฝั่ง Implementation ของทีม B (Synes Online) บนคลาวด์ ทำเฉพาะงาน <Task> ที่เจ้าของอนุมัติแล้ว
อ่าน CLAUDE.md, docs/HANDOFF.md ส่วนบนสุด และ docs/team/2026-11-25-claude-first-allocation.md ข้อ 5 (แถวของ <Task>)
ที่ทำงาน <WT> · branch <branch> · port <port> · ฐาน <ฐาน> (PM เตรียมไว้แล้ว ห้ามสร้างฐานใหม่เอง)
งานและเกณฑ์ผ่าน: ตามกล่อง <Task> ที่ <ไฟล์ + ข้อ> ทุกข้อ ยกเว้นส่วนที่เป็นของเครื่อง Windows (gaming_run.ps1, Gaming Mode, path C:\, format-patch ไปโฟลเดอร์ C:\, junction node_modules) ซึ่งไม่ใช้บนคลาวด์ · ห้ามลดเกณฑ์
กฎ
1. ทีม A เป็น Design Authority (ADR-007) ห้ามเปลี่ยนสิ่งที่ผู้เล่นเห็นหรือรู้สึกเว้นแต่งานระบุ ถ้าต้องเลือกรูปทรง สี ตำแหน่ง ข้อความ หรือกติกาใหม่ ให้หยุดส่วนนั้นและรายงานเป็นคำถาม
2. ห้าม push ห้าม merge (PM เป็นคน push) · ห้ามติดตั้งแพ็กเกจใหม่ (npm ci จาก lockfile เดิมได้) · ห้าม commit ภาพหรือ GLB ของ pilot ไฟล์ Hero หรือข้อมูลส่วนตัว · โค้ดใน shared/ ห้ามใช้ Math.random, Date, trig
3. เบราว์เซอร์: รัน node tools/qa/webgl2-probe.mjs --timeout 60 ก่อน · ไม่ READY = วินิจฉัยได้ 1 รอบ แล้วหยุดรายงาน · เปิดเบราว์เซอร์ทีละตัว · ทุกคำสั่ง timeout ≤ 300 วินาที · รันแบบ foreground · ปิดเบราว์เซอร์และเซิร์ฟเวอร์ทุกตัวตอนจบ
4. ก่อน commit: npm test, npm run typecheck, npm run build ผ่าน · lifecycle 20/20 เมื่องานแตะ src/ หรือ server/
5. commit เดียว ข้อความขึ้นต้นด้วย Task ID ลงท้าย attribution ตามที่ระบบกำหนด · git add ทีละ path · ไม่แก้ docs/HANDOFF.md (PM รวมเอง)
6. ผลทดสอบของคุณเป็นข้อมูลของผู้ผลิต ไม่ใช่ QA อิสระ
รายงานกลับ (ภาษาไทย): SHA ของ commit, ไฟล์ที่แตะ, ผลแต่ละเกณฑ์ (ผ่าน / ไม่ผ่าน / ไม่ได้รัน พร้อมตัวเลข), ข้อสงสัยด้านดีไซน์, สิ่งที่ยังไม่ทราบ · Android/iPhone: ยังไม่ได้ทดสอบ
```

### P5 · เจ้าของ → Codex Sol: แม่แบบผลิต asset (ใช้หลังแบบทีม A ผ่านอนุมัติเท่านั้น)
```text
Task ID: <R5.2-xx / K2-xx> · Codex Sol · reasoning <กลาง/สูง>
แบบที่อนุมัติ: <DES-NNN หรือบรีฟ docs/handoff/<asset>.md> (ทีม A) · วันที่เจ้าของอนุมัติ: <วันที่> · ห้ามเปลี่ยนรูปทรง สี สัดส่วน หรือจำนวนชิ้นจากแบบ ถ้าแบบไม่ระบุ ให้หยุดและถามทีม A ผ่านเจ้าของ
ข้อจำกัดทางเทคนิค: ตามคำตอบ REQ-004 ของทีม A + docs/art/ART_INTEGRATION_READINESS.md (ชื่อไฟล์ ประเภท_ชื่อ_vNN, ชื่อ node, เพดาน tris/texture, สีส้ม #FF7A1A และแดง #FF3355 ห้ามใช้)
ที่ทำงาน: C:\SYNES_ASSETS\_repo_worktrees\codex-r52-assets · branch lane/codex-r52-assets · Blender ผ่าน Blender MCP · Gaming Mode ตามเดิม
ส่งงาน: ไฟล์ .glb (+ texture ถ้าแบบระบุ) ไปที่ assets/_inbox/ ของ worktree + บันทึกที่มา (เครื่องมือ, เวอร์ชัน Blender, สคริปต์, license ของ asset ฐานถ้ามี) · รัน node tools/qa/glb-check.mjs <ไฟล์> --expect <node,...> --max-tris <N> [--max-tex <N>] ก่อนส่ง (ไม่ใช้เบราว์เซอร์)
ห้าม: ไฟล์ Hero, asset third-party ใน repo Public, push, merge, จ่ายเงิน, ติดตั้งโดยไม่ได้อนุมัติ, เปิดเบราว์เซอร์ WebGL บน PC
Claude บนคลาวด์จะนำเข้าเกมหลัง flag ทำ Before/After + perf + QA ภาพอิสระ แล้วส่งให้ทีม A ตรวจ และเจ้าของอนุมัติ (ADR-006)
```

### 6.5 กล่องงานใหม่ของ Claude (งานที่ยังไม่มีกล่อง)
**SEC-1/2/3/5 (server, ไม่เปลี่ยนสิ่งที่ผู้เล่นเห็น)** · ที่มา `docs/qa/audit-2026-11-25.md` (SEC-1 `server/index.ts:45-48`, SEC-2 `:18-19,26`, SEC-3 `:58`, SEC-5)
```text
Task ID: SEC-1/2/3/5 · ฐาน art/env-polish · แก้ server/ และ tests/ เท่านั้น
- SEC-1: ตรวจ path ของ static ด้วย path.relative (หรือ ROOT + path.sep) และปฏิเสธ path ที่ decode แล้วออกนอก root · /..%2fdist-spike/index.html ต้องไม่ถูกเสิร์ฟ
- SEC-2: map runs และ hits ต้องมีอายุและเพดานจำนวน (ค่าตั้งต้นที่ไม่ตัดการเล่นปกติ: run ที่ยังเล่นอยู่ภายในเพดานเวลาเดิมต้องส่งผลได้เหมือนเดิม)
- SEC-3: การอ่าน IP จาก header ของ proxy ต้องเปิดด้วยตัวแปรตั้งค่าเท่านั้น ค่าเริ่ม = ปิด (พฤติกรรมเดิม)
- SEC-5: ไม่ส่ง e.message ของ exception ที่ไม่คาดคิดกลับ client (ส่งรหัสทั่วไป แล้ว log รายละเอียดฝั่ง server)
- ห้ามแตะ shared/rules, รางวัล, ruleset, เพดานเวลา (เป็นเรื่องของ REQ-005/ทีม A) และข้อความที่ผู้เล่นเห็น
เกณฑ์ผ่าน: vitest ใหม่ครอบทุกข้อ (path traversal หลายรูปแบบ, หมดอายุด้วยนาฬิกาที่ฉีดเข้าได้, เพดาน, ค่าเริ่มของ SEC-3 = เดิม, ข้อความ error) · เทสต์เดิมทั้งหมดผ่าน (replay/validate ได้ผลเดิม) · tsc, build · lifecycle 20/20
```
**PERF-1/3/4 (client, ต้องได้ภาพเท่าเดิม)** · ที่มา audit PERF-1 (`src/ui/buttonFade.ts:107`, `src/ui/hud.ts:78-92`), PERF-3/4 (`src/render/fx.ts:28-37,50,56`)
```text
Task ID: PERF-1/3/4 · ฐาน art/env-polish · ไม่แตะไฟล์ 7 ไฟล์ของ fix2 และ view.ts
- PERF-1: เลิกเขียน DOM ซ้ำเมื่อค่าไม่เปลี่ยน และไม่อ่าน layout ในเฟรมเดียวกับที่เขียน · พฤติกรรมปุ่มโปร่งเมื่อมีวงเตือน/บอส/เสาใต้ปุ่มต้องเหมือนเดิมทุกเฟรม
- PERF-3: Rings ใช้ pool จริง (นำ geometry/material กลับมาใช้) และแก้ comment หัวไฟล์ให้ตรง
- PERF-4: Particles ไม่สร้าง array ใหม่ทุกเฟรม และตั้งสี instance เฉพาะเมื่อเปลี่ยน
เกณฑ์ผ่าน: stage1-shots low ตรงทุก byte, medium อยู่ใน noise P-4 (ความต่างอยู่ใน HUD ที่เคลื่อนตามเวลาเท่านั้น) · VFX แบบ seed Math.random: calls/tris เท่าเดิม · วัดจำนวน object/array ที่สร้างต่อเฟรมก่อน/หลัง (ต้องลดลง) · การโปร่งของปุ่มเท่าเดิมใน lifecycle และ hud ที่มีอยู่ · vitest/tsc/build · lifecycle 20/20
```
งานที่มีกล่องแล้ว: C-6 (`dispatch-2F.md` 5.2), C-5 (5.3), C-1 (5.4), C-2b (5.5), C-4 (`2026-11-25-pm-c2-qa-and-c4-plan.md` ข้อ 4), C-3 (`2026-11-25-codex-work-packages.md` ข้อ 8) · QA: `dispatch-2F.md` ข้อ 6.1–6.4 (C-4/SEC/PERF ใช้รูปแบบเดียวกับ 6.2)
C-2b ขั้นวิเคราะห์ (Fable, อ่านอย่างเดียว): "อ่านกล่อง C-2b + QA_C2.md + โค้ด buildLevel/dispose ของ C-2 แล้วประเมินแนวทาง deferred dispose: กรณี rebuild ซ้อน, context lost ระหว่างคิว, หน่วยความจำสูงสุด, ผลต่อเวลาเฟรมแรก · เสนอแนวทางที่เสี่ยงน้อยสุด 1 แบบ + กรณีทดสอบที่ต้องมี · ห้ามแก้ไฟล์"

## 7. ไฟล์ที่ต้องแนบ (ยืนยันด้วย SHA256 หลังได้ไฟล์ · PM เข้าเครื่องเจ้าของไม่ได้)
| # | ไฟล์ | ใช้ทำ | ตำแหน่ง (ที่มาของข้อมูล) | SHA256 |
|---|---|---|---|---|
| F1 | `SYNES_Handoff_v05c_r5_fix2.zip` | มี `fix2_code.patch` (สร้างฐาน pilot ทุกงาน) และต้นฉบับ `hud_gate.mjs`, `hud_gate_measure.mjs`, `qa_core.mjs` ใน `r5/pilot_fix2/tools/` (C-4) | path ของ zip บน PC **ไม่มีบันทึก** · ฉบับแตกแล้ว: `C:\SYNES_ASSETS\SYNES_OUTPUT\r5\pilot_fix2\tools\` (พรอมป์ต์ C-4) · โครงใน zip: `r5/pilot_fix2/tools/`, `qa/round5/fix2/` (`2026-11-25-c1-blocker-analysis.md`) | zip ขึ้นต้น `84119AC4…` · `fix2_code.patch` = `8E37A1B7D8ADCC809C6C6AFD5D2DE81B6AED31FA16F38A5587A511C377D10654` |
| F2 | `0001-C-2-Dispose-level-owned-render-resources-on-rebuild.patch` | ฐาน C-2b + บันทึกการรับ C-2 | `C:\SYNES_ASSETS\SYNES_OUTPUT\c2\` (ปลายทาง `format-patch -o` ในพรอมป์ต์ C-2) | `1368EC32C4EF2221113F703DB8D26836B681EBB7B64B331E6C035753B6CDE3C8` |
| F3 | ผลรายงาน P1 ของ Codex (ข้อความ) | กันงานซ้ำ + ยืนยัน path จริงของ F1/F2 | ข้อความตอบของ Codex | — |
| F4 | patch งานค้าง (ถ้ามี) | Claude ทำต่อจากงานค้าง | `C:\SYNES_ASSETS\SYNES_OUTPUT\handover\<C-x>\` (P2) | ตามที่ Codex รายงาน |
| F5 | `PLAN_R5_2_TECH.md` | ภายหลัง: นำเข้า R5.2, C-7 | `C:\SYNES_ASSETS\SYNES_OUTPUT\r5\plan_r5_2\PLAN_R5_2_TECH.md` (พรอมป์ต์ C-7) | — |
| F6 | (ไม่บังคับ) `gaming_mode_log.csv`, `gaming_mode_suspended.txt`, รายงาน BLOCKED ของ C-1 | หาสาเหตุ WebGL2 (สำคัญถ้า Codex ต้องดูผลในเกมบน PC) | `C:\SYNES_ASSETS\SYNES_OUTPUT\tools\gaming_mode\` · `C:\SYNES_ASSETS\_repo_worktrees\codex-r5\docs\HANDOFF.md` | — |
ทางเลือกที่ไม่ต้องแนบซ้ำทุกเซสชัน: อัปโหลด F1, F2 ไว้ใน Drive `SYNES_ASSETS` (ไฟล์ละ ≤ 10 MB) แล้วแจ้งชื่อโฟลเดอร์ (A8)
คำสั่งหาไฟล์บน PC (อ่านอย่างเดียว): `Get-ChildItem C:\SYNES_ASSETS -Recurse -File -Include fix2_code.patch,SYNES_Handoff_v05c_r5_fix2.zip,0001-C-2-*.patch -ErrorAction SilentlyContinue | Get-FileHash -Algorithm SHA256 | Format-List Path,Hash`

## 8. ระลอกงาน (เมื่ออนุมัติ) และการคุมโควตา
| ระลอก | งาน (พร้อมกันได้) | browser job | หยุดเมื่อ |
|---|---|---|---|
| 0 | N1 สร้างฐาน · N2 QA งาน Codex ที่ส่งแล้ว | probe | — |
| 1 | C-6 · SEC · C-5 (≤ 3 agent) | C-5 เท่านั้น | `rate_limit_info.status` ไม่ใช่ allowed หรือใช้ overage |
| 2 | Fable วิเคราะห์ C-2b · C-1 ลงมือ → QA | ทีละตัว | ผล QA ระลอก 1 ยังไม่ตรวจรับ |
| 3 | C-2b ลงมือ → QA · C-4 · PERF-1/3/4 | ทีละตัว | — |
| 4 | Integration ชุด pilot · PERF-2 · (C-3/EXP-103 ถ้าอนุมัติ) | ทีละตัว | — |
แต่ละงานที่ผ่าน: PM ตรวจรับ (Opus) → commit เอกสาร + push branch ฐาน Public หรือส่ง patch ฐาน pilot ให้เจ้าของทันที → บันทึก SHA ใน HANDOFF (= checkpoint)

## 9. แผน Master Handoff สำหรับเซสชันถัดไป
- ไฟล์หลัก: `docs/team/2026-11-25-master-handoff-2F.md` (อัปเดตแล้วให้ชี้แผนนี้) + ไฟล์นี้ + `dispatch-2F.md`
- checkpoint ทุกครั้งที่งานผ่านตรวจรับ (ข้อ 8) · บันทึก: branch/SHA ที่ push, ชื่อไฟล์ patch + SHA256 ที่ส่งเจ้าของ, ระลอกที่ทำถึง, agent ที่ยังทำงานอยู่ (ต้องเป็น 0 ก่อน rollover)
- **rollover ครั้งสุดท้าย (7 → 8) ใช้แล้ว** 2026-11-25 หลังการบีบอัดของเซสชัน 2-F (ไม่มี agent ทำงานค้าง) → รอบ 2-G
- เซสชัน 2-G (8/8) สร้างเซสชันลูกไม่ได้ → เมื่อเกิดการบีบอัดหรือ context ใกล้ 450k ให้ checkpoint + อัปเดต master handoff แล้ว**ขอเจ้าของเปิดเซสชันใหม่เองจาก claude.ai/code** (repo `thanaponzxz-gif/Synes-Online`, branch `art/env-polish`) และวางพรอมป์ต์ในข้อ 8 ของ master handoff (เปลี่ยนเลขรอบ)
- สิ่งที่เซสชันใหม่ต้องทำก่อน: แท็ก + ปิดเซสชันเดิม (ข้อ 5.1) → อ่าน master handoff → สร้างฐาน pilot ใหม่จาก F1 (Drive หรือแนบ) → ตรวจว่าไม่มีงานค้างของ agent → ทำต่อจากระลอกที่บันทึกไว้

## 10. สิ่งที่ยังไม่ทราบ
สถานะงาน Codex ที่ส่งไปแล้ว (รอ P1) · มีงาน C-1 ค้างใน `codex-r5` หรือไม่ · path ของ F1 บน PC · โควตารายสัปดาห์ของ Claude และโควตา Codex · token จริงต่องานของ Claude (ประเมินจาก agent กลางคืน 168k–271k ต่อตัว) · lineage ของเซสชันที่เจ้าของเปิดเอง · ผลทุกงานบนมือถือจริง
