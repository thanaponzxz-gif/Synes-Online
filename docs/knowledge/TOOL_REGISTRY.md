# Tool Registry: Synes Online

> เครื่องมือ AI, บริการ และ asset ที่ทีมพิจารณาหรือใช้อยู่ พร้อมสถานะตามวงจรใน `AI_DEVELOPMENT_PLAYBOOK.md` ข้อ 1
> สถานะ: `ADOPTED` ใช้จริง · `TRIAL` กำลังทดลอง · `CANDIDATE` รอตรวจ/รออนุมัติ · `ON-HOLD` รอเงื่อนไข · `REJECTED` ไม่ใช้
> ข้อมูลราคาและ license เปลี่ยนได้ ให้ตรวจหน้าทางการซ้ำก่อนสมัครหรือใช้จริงทุกครั้ง **นี่ไม่ใช่คำปรึกษากฎหมาย**
> asset ที่อยู่ใน build จริงลงทะเบียนที่ `docs/ASSETS.md` ไฟล์นี้เก็บเฉพาะการประเมินเครื่องมือ

## 1. ใช้อยู่แล้ว (ADOPTED)
| เครื่องมือ | ใช้ทำอะไรใน Synes | ที่มาของการตัดสินใจ | หมายเหตุ |
|---|---|---|---|
| Three.js r187 + Vite | render + build | ADR-001 (spike ชนะ PlayCanvas) | เอนจินอยู่แค่ใน `src/render/` เปลี่ยนได้ถ้าผลเครื่องจริงกลับด้าน |
| Blender 5.3 (`bpy` headless) | สร้างโมเดลทั้งชุดจากสคริปต์ | ADR-003, มติ ข-2 | build ซ้ำได้ไฟล์เดิมทุกไบต์ · container ไม่มี GPU (เรนเดอร์ CPU) |
| GPT Image (ผ่าน ChatGPT ของเจ้าของ) | ภาพต้นแบบ, UI (HUD skin v01) | ADR-006 | เงื่อนไข OpenAI: ผู้ใช้เป็นเจ้าของ output (ตรวจ openai.com/terms 2026-11-21) · **prompt ของ HUD skin ไม่ได้บันทึก** และยังไม่ยืนยันบัญชีที่ใช้ (ดู L-010) |
| GPT Codex (ทีม A) | ออกแบบทุกประเภท, เขียนบรีฟ asset | ADR-007 | อ่านกฎผ่าน `AGENTS.md` |
| Claude Code: subagents | `project-synes` (PM ความเห็นแยก), ผู้เล่นทดสอบ (skill `synes-playtest`) | CLAUDE.md ข้อ 3–4 | ไม่ได้ลด token รวม ช่วยเรื่องบริบทและความเร็ว (playbook ข้อ 3.2) |
| Claude Code: skills | `synes-pm`, `synes-playtest` | CLAUDE.md ข้อ 3 | โหลดเมื่อใช้เท่านั้น ประหยัดกว่าใส่ใน CLAUDE.md |
| Claude Code: worktree isolation + branch `lane/*` | แยกสายงานขนาน ≤ 3 สาย | CLAUDE.md ข้อ 4 | vitest ไม่เก็บเทสต์ใน `.claude/worktrees` (L-002) |
| Claude Code: hook `SessionStart` (compact) | ใส่กฎ rollover กลับหลังบีบอัด | CLAUDE.md ข้อ 5 | `tools/hooks/after-compact.cjs` |
| GitHub + GitHub Pages | ที่เก็บงานหลัก · ลิงก์ทดสอบ iPhone | PROJECT_SYNES ข้อ 4 | Pages อนุมัติเฉพาะบิลด์ V4 ต้องถามก่อนอัปเดต |
| Playwright/Chromium ในชุด QA | ภาพ, คลิป, lifecycle, เพลย์เทสต์ | `tools/qa/` | GPU ซอฟต์แวร์ ไม่ใช่ตัวเลขเครื่องจริง |

## 2. ตัวเลือกงานภาพ 2D
| เครื่องมือ | สถานะ | เหมาะกับ Synes แค่ไหน | ค่าใช้จ่าย/บัญชี | สิทธิ์ผลงาน (แหล่งทางการ, วันที่ตรวจ) | ความเสี่ยง |
|---|---|---|---|---|---|
| Gemini (สร้างภาพ) | CANDIDATE | ภาพแนวคิดสำรองเมื่อ GPT Image ไม่ได้ผล | บัญชี Google ของเจ้าของ | ภาพมีลายน้ำมองไม่เห็น SynthID และ metadata C2PA ติดไปเสมอ แม้ปิดลายน้ำที่มองเห็นได้ (support.google.com/gemini, 2026-11-21) · **เงื่อนไขเชิงพาณิชย์ของ output ยังไม่ได้ตรวจจาก ToS ฉบับเต็ม** | ใช้เป็น concept ก่อน ห้ามใช้เป็น asset สุดท้ายจนกว่าตรวจ ToS |
| PixelLab | REJECTED (สำหรับ Synes) | เป็นเครื่องมือ pixel art 2D (sprite, tileset) แต่ Synes เป็น 3D low-poly และตัวละคร/ศัตรูต้องเป็น `.glb` (ASSET_PIPELINE ข้อ 2) | มีแผนรายเดือน (ราคายังไม่ได้ตรวจจากหน้าทางการ) | ยังไม่ได้ตรวจ | ไม่ตรงสไตล์และรูปแบบไฟล์ · อาจเหมาะกับโปรเจคอื่น |

## 3. ตัวเลือกภาพ → โมเดล 3D
| เครื่องมือ | สถานะ | ข้อเท็จจริงที่ตรวจแล้ว | ปัญหากับ Synes | ต้องให้เจ้าของทำ/อนุมัติ |
|---|---|---|---|---|
| Tripo (tripo3d.ai) | CANDIDATE (รออนุมัติ) | ส่งออก GLB ได้ · หน้า Help ของ Tripo ระบุว่าผลงานของผู้ใช้ฟรี Tripo ถือสิทธิ์ทั้งหมดและใช้เชิงพาณิชย์ไม่ได้ ต้องใช้แผนเสียเงิน · แผน Pro ระบุ $19.90/เดือน 3,000 เครดิต (หน้าของ Tripo, ตรวจ 2026-11-21) · แผนเสียเงินมีฟีเจอร์ Animation/Smart Low-Poly | **หน้าของ Tripo เองขัดกัน:** บางบทความบอกแผนฟรีเป็น CC BY 4.0 แต่หน้า Help/ToS บอกว่าไม่ให้ใช้เชิงพาณิชย์ → ถือว่า**แผนฟรีใช้กับ Synes ไม่ได้** (repo และเกมเป็นสาธารณะ) | สมัครแผนเสียเงิน (CLAUDE.md ข้อ 6) · ตรวจราคาที่ tripo3d.ai/pricing ก่อนจ่าย |
| Hunyuan3D 2.x (Tencent, open weights รันเอง) | ON-HOLD | VRAM (README ทางการ 2.1): สร้างรูปทรง 10 GB, texture 21 GB, รวม 29 GB · รุ่น 2.0: รูปทรง 6 GB, รวม 16 GB · มีโหมด low VRAM · ส่งออก GLB ได้ · License "Tencent Hunyuan 3D Community License": ให้สิทธิ์เฉพาะ Territory ซึ่ง**ไม่รวม EU, UK และเกาหลีใต้** และห้ามใช้/แสดง output นอก Territory (LICENSE บน Hugging Face, 2026-11-21) | container ไม่มี GPU · สเปก GPU เครื่องเจ้าของยังไม่ทราบ · เกมบนเว็บเปิดได้จาก EU/UK/เกาหลี จึงมีคำถามว่าแสดง output ให้ผู้เล่นที่นั่นได้ไหม (ต้องให้เจ้าของตัดสิน) · ต้องติดตั้ง Python/CUDA หลายสิบ GB | บอกรุ่น GPU · อนุมัติการติดตั้ง · ตัดสินเรื่อง Territory |
| Blender สคริปต์ (ของเดิม) | ADOPTED | ดูหมวด 1 | งานชิ้นที่รูปทรงซับซ้อนทำช้า | ไม่ต้อง |

## 4. Rig / Animation / ปรับแต่งโมเดล
| เครื่องมือ | สถานะ | ข้อเท็จจริงที่ตรวจแล้ว | ปัญหากับ Synes |
|---|---|---|---|
| Mixamo (Adobe) | CANDIDATE | ฟรี ต้องมี Adobe ID · ใช้ในวิดีโอเกมเชิงพาณิชย์ได้ ไม่ต้องใส่เครดิต · auto-rig ใช้ได้เฉพาะตัวละครคล้ายมนุษย์ที่แยกหัว/ลำตัว/แขน/ขาชัด และสัดส่วนไม่เพี้ยนเกินไป (helpx.adobe.com Mixamo FAQ, 2026-11-21) · ห้ามแจกจ่ายไฟล์ตัวละคร/animation ดิบ (Adobe community FAQ) | repo เป็น Public: commit ไฟล์ดิบจาก Mixamo อาจนับเป็นการแจกจ่าย → ต้องตัดสินว่าเก็บไฟล์ดิบนอก repo · ศัตรูที่ไม่ใช่มนุษย์ (พัฟแคป, ธอร์นลิง, ปริซึมแบ็ก) ใช้ไม่ได้ · ต้องใช้บัญชีภายนอก (ขออนุมัติ) |
| Blender armature/Rigify จากสคริปต์ | CANDIDATE | อยู่ใน Blender ที่ใช้อยู่ ไม่ต้องสมัคร | **ยังไม่ได้ทดสอบ**ว่า Rigify ใช้ได้กับ `bpy` แบบ headless · ใช้ได้ทุกรูปร่าง แต่ต้องเขียนสคริปต์เอง |
| blender-mcp (ahujasid, MIT) | CANDIDATE | ดู `docs/BLENDER_MCP.md` | add-on รัน Python ใดก็ได้ผ่าน socket **ยังไม่ได้ตรวจโค้ด** · ต้องติดตั้งบนเครื่องเจ้าของ (ขออนุมัติ) · ใช้แทนสคริปต์ headless ไม่ได้ในคลาวด์ |
| gltfpack (meshoptimizer) | CANDIDATE | backlog ข้อ 6 · EXP-103 | **MIT** (ตรวจ 2026-11-25 จาก GitHub LICENSE.md + npm) · npm 1.3.0 ไม่มี dependency · ติดตั้งต้องขออนุมัติ · ยังไม่ได้วัด |
| gltf-transform + meshopt | CANDIDATE | backlog ข้อ 6 · Three.js มีตัวถอด meshopt มาให้ | ต้องติดตั้ง npm package (ตรวจ license และขออนุมัติก่อน) · **ยังไม่ได้วัด**ว่าลดขนาดได้เท่าไร (EXP-103) |

## 5. Asset สำเร็จรูป
| แหล่ง | สถานะ | ข้อเท็จจริง | ปัญหากับ Synes |
|---|---|---|---|
| Kenney, Quaternius, KayKit | ON-HOLD | CC0 ใช้เชิงพาณิชย์ได้ไม่ต้องใส่เครดิต มี GLB/glTF (หน้าของผู้สร้าง/OpenGameArt, 2026-11-21) | **ขัด PROJECT_SYNES ข้อ 1** (โลก ตัวละคร ศัตรู ภาพต้องเป็นต้นฉบับ) และ ADR-003 · ใช้ได้แค่ทดสอบภายในบน branch `exp/*` จนกว่าเจ้าของตัดสินขอบเขต (เช่น เฉพาะพร็อพทั่วไป) และทีม A ยอมรับสไตล์ |
| Poly Pizza และคลังทั่วไป | ON-HOLD | ส่วนใหญ่ CC-BY ต้องใส่เครดิต รายชิ้นต่างกัน | เหมือนแถวบน + ต้องตรวจ license ทีละชิ้น |

## 6. Claude Code: ฟีเจอร์ที่ยังไม่ใช้
| ฟีเจอร์ | สถานะ | เหตุผล |
|---|---|---|
| Agent teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) | REJECTED | ใช้ token ราว 7 เท่าเมื่อ teammate อยู่ใน plan mode (code.claude.com/docs/en/costs, 2026-11-21) งานของ Synes แยกด้วย lane ≤ 3 สายพอแล้ว |
| subagent `Explore` ของโปรเจคที่ตั้ง `model: haiku` | CANDIDATE | ตั้งแต่ v2.1.198 Explore ใช้โมเดลเดียวกับเซสชันหลัก การ override ด้วยไฟล์ของโปรเจคช่วยให้ค้นไฟล์ถูกลง (EXP-105) |
| hook กรองผลเทสต์ (`PreToolUse`) | CANDIDATE | ผลเทสต์ตอนนี้สั้น (62 เทสต์ ~15 บรรทัด) ยังไม่คุ้ม พิจารณาเมื่อผลยาวขึ้น |

## 7. Infrastructure
| ทางเลือก | สถานะ | หมายเหตุ |
|---|---|---|
| VPS / PaaS / Dedicated | CANDIDATE (ศึกษาเท่านั้น) | ดูเกณฑ์ใน playbook ข้อ 7 · ยังไม่ได้ตรวจราคา · ห้ามเช่าโดยไม่ได้รับอนุมัติ |
