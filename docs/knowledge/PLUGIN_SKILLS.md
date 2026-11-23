# Plugin & Skills Management: Synes Online (ADR-010)

> กฎสั้นอยู่ใน CLAUDE.md ข้อ 8 และ AGENTS.md ข้อ 4.1 ไฟล์นี้เก็บรายละเอียด **อ่านเมื่อจะเลือกเครื่องมือเท่านั้น**
> ตรวจล่าสุด 2026-11-23 (Claude Code 2.1.330) ข้อมูลราคาและเงื่อนไขเปลี่ยนได้ ให้ตรวจหน้าทางการซ้ำก่อนสมัครทุกครั้ง

## 1. หลักการ
1. **เลือกเครื่องมือก่อนเริ่มงาน** ดูตารางข้อ 2 ถ้ามีเครื่องมือเฉพาะทางที่เชื่อมแล้ว ให้ใช้ตัวนั้นก่อนเขียนโค้ดเอง
   (ตัวอย่าง: ทีม A ส่งดีไซน์ HUD เป็น Figma → อ่านค่าสี ระยะ และ asset ผ่าน `get_design_context` / `get_variable_defs` แทนการวัดจากภาพหน้าจอ)
2. **เปิดเฉพาะตัวที่งานนั้นใช้** skill ของ plugin ที่เปิดไว้โหลดคำอธิบายเข้า context ทุกเซสชัน (ตารางข้อ 3) และเปิดทั้ง 6 ตัวพร้อมกันกินราว 11k token ก่อนเริ่มงาน
3. **แหล่งทางการเท่านั้น:** Anthropic Directory / Knowledge Work catalog หรือ repo ของผู้ผลิต ต้องอ่านโค้ดและ license ก่อนติดตั้ง
4. **ระดับการติดตั้ง:** plugin ของ claude.ai ผูกกับบัญชี (Global) จึงมีผลกับทุกโปรเจกต์ (Synes, K.N.D., TERRAVIA) ให้เปิดเฉพาะตอนใช้แล้วปิดเมื่อเสร็จ
   ส่วน skill ที่เป็นของโปรเจกต์ให้เก็บใน `.claude/skills/` ของ repo นั้น (Project)
5. **ไม่ได้ทดสอบ = ไม่รายงานว่าใช้ได้** สถานะ "พร้อมใช้" ต้องมีผลการเรียก tool จริงอย่างน้อย 1 ครั้งบันทึกไว้ในข้อ 4
6. **เครื่องมือไม่เปลี่ยนกฎ:** ADR-007 (ทีม A ออกแบบ), CLAUDE.md ข้อ 5.2 (Claude ไม่สร้างภาพสำเร็จรูปเอง), ADR-002 (server ตัดสินผล), L-009 (ห้ามเก็บภาพจากเกม/แอปอื่นใน repo สาธารณะ)

## 2. บทบาท → เครื่องมือ
"ออกแบบ" = ทีม A (Codex) + เจ้าของ ตาม ADR-007 · ทีม B (Claude) ใช้เครื่องมือเดียวกันเพื่ออ่าน นำเข้า และตรวจ

| บทบาท | ใครสวมหมวก | เครื่องมือหลัก | ทีม B ใช้ทำอะไร | ห้าม |
|---|---|---|---|---|
| PM | เซสชันหลัก (skill `synes-pm`) · Opus | ตารางนี้, `ListPlugins`/`ListConnectors` | เปิด/ปิดเครื่องมือตามงาน, ดูต้นทุน token/เงิน, รวบรวมรายการขออนุมัติ | เปิดทุกตัวค้างไว้ |
| Art Director | ทีม A + เจ้าของ | Figma, Adobe, Blender | อ่านไฟล์/บรีฟที่ทีม A ส่งมา ไม่ตัดสินหน้าตา | เลือกสไตล์เอง |
| UI/UX Designer | ทีม A (ออกแบบ) · ทีม B (ทำตาม) | Figma, Mobbin | Figma: ดึงค่า token/ระยะ/ภาพ frame มาทำ HUD · Mobbin: หาตัวอย่าง pattern ประกอบ **ใบขอ REQ** (ข้อเท็จจริง ไม่ใช่ข้อเสนอดีไซน์) | commit ภาพ Mobbin, ลอกหน้าจอแอปอื่น |
| Technical Artist | ทีม B · Sonnet ทำ, Opus ตรวจ | Blender MCP, Adobe | Blender: ปรับโมเดลจาก `build_kit.py` แบบเห็นผลสดบนเครื่องเจ้าของ · Adobe: ตัดพื้นหลัง/ย่อขนาด asset ที่ APPROVED แล้ว | นำเข้า asset จาก Sketchfab/Poly Pizza หรือโมเดล AI (Tripo/Meshy ฯลฯ) ผ่าน Blender MCP โดยไม่ผ่าน pipeline |
| Marketing Agent | เจ้าของสั่ง · ทีม A ออกแบบ | Canva, Adobe | ทำสื่อโปรโมตตามบรีฟ, resize ภาพสำหรับโซเชียล | เผยแพร่เอง, ใช้ภาพที่ยังไม่ APPROVED |
| Backend Engineer | ทีม B · Opus วางแผน | Supabase | **ยังไม่ใช้** ตัวเลือกสำหรับ backlog ข้อ 7 (เลเวล/อุปกรณ์) หลังมี ADR · เมื่อทดลองให้ใช้ `read_only=true` + `project_ref` เฉพาะโปรเจกต์ทดลอง | สร้างโปรเจกต์/เปิดฟีเจอร์เสียเงิน, ย้ายการตัดสินผลออกจาก server |
| QA Agent | skill `synes-playtest` + `tools/qa/*` + PM ตรวจซ้ำ | Playwright (มีแล้ว), Figma `get_screenshot` (เทียบดีไซน์กับเกม) | ตรวจผลแยกจากคนทำ ใช้ตัวชี้วัดใน playbook ข้อ 1.1 | ใช้รายงาน agent อื่นโดยไม่ตรวจซ้ำ |

## 3. ผลตรวจรายตัว (2026-11-23)
token "เปิดค้าง" = คำอธิบาย skill ที่โหลดทุกเซสชัน วัดด้วย `claude --plugin-dir <clone> plugin details <ชื่อ>` จากโค้ดที่ clone มาตรวจ **ยังไม่ได้ติดตั้ง** · ไม่รวม schema ของ MCP tool (โหลดเมื่อค้นหาผ่าน ToolSearch)

| เครื่องมือ | แหล่ง (ทางการ) | เวอร์ชัน/commit ที่ตรวจ | สิ่งที่อยู่ข้างใน | license | token เปิดค้าง | ข้อสังเกตด้านความปลอดภัย | สถานะ |
|---|---|---|---|---|---|---|---|
| Figma | Knowledge Work catalog `figma` (upstream `figma/mcp-server-guide`) · มีอีกตัวใน Anthropic Directory (publisher community, ไม่มี upstream) | 2.2.211 · `43a06ff` | 17 skills + MCP แบบ remote `https://mcp.figma.com/mcp` · ไม่มี hook · สคริปต์ JS ใน skill รันใน Figma ผ่าน `use_figma` | ไม่พบไฟล์ LICENSE ใน repo | ~2.6k | มี tool เขียนไฟล์ (`use_figma`, `upload_assets`, `generate_figma_design`) ต้องอนุญาตทีละครั้ง | ต้องเชื่อมบัญชี |
| Mobbin | Anthropic Directory (partner `mobbin`, upstream `mobbin/skills`) | 1.5.0 · `cac3383` | 4 skills + MCP `https://api.mobbin.com/mcp` (search_screens/flows/sections) · สคริปต์ Python 1 ไฟล์ (ฝังภาพลง HTML) | MIT | ~0.6k | ภาพหน้าจอเป็นลิขสิทธิ์ของแอปต้นทาง → ใช้เป็นอ้างอิงเท่านั้น ห้าม commit | ต้องเชื่อมบัญชี |
| Adobe | Anthropic Directory (partner `adobe`, upstream `adobe/skills` → `creative-cloud/adobe-for-creativity`) | 3.4.0 · `9aa09af` | 26 skills + MCP `https://adobe-creativity.adobe.io/mcp` (109+ tools) · plugin ตัวนี้ไม่มี hook | Apache-2.0 | **~6.0k** (สูงสุด) | มี `adobe-stock-search-and-license` ซึ่งอาจซื้อ license ได้ → ห้ามใช้โดยไม่ถาม · skill หลายตัว (PDF/Excel/headshot) ไม่เกี่ยวกับเกม | ต้องเชื่อมบัญชี |
| Canva | Anthropic Directory (partner `canva-sdks`, upstream `canva-sdks/canva-skills`) | 1.1.0 · `5087533` | 10 skills + MCP `https://mcp.canva.com/mcp` · ไม่มีสคริปต์ ไม่มี hook | Apache-2.0 | ~1.6k | สร้าง/แก้ดีไซน์ในบัญชีจริง | ต้องเชื่อมบัญชี |
| Supabase | Anthropic Directory (partner `supabase-community`, upstream `supabase-community/supabase-plugin`) | 0.1.17 · `016bf5b` | 2 skills + MCP `https://mcp.supabase.com/mcp` (40 tools รวม `create_project`, `get_cost`, `confirm_cost`) · ไม่มีสคริปต์ | MIT | ~0.6k | **สร้างโปรเจกต์และสร้างค่าใช้จ่ายได้** · รองรับ `read_only=true` (SUPABASE.md) | ต้องเชื่อมบัญชี + ต้องมี ADR ก่อนใช้ |
| Blender MCP (MCP for Blender) | **ไม่อยู่ใน Anthropic Directory** · repo ผู้พัฒนา `ahujasid/blender-mcp` (มี plugin Claude ใน `integrations/claude/`) | 2.3.1 · `a5a8acf` | MCP แบบ local (`uvx mcp-for-blender`) + add-on `addon.py` ใน Blender GUI | MIT (ชุมชน ไม่ใช่ Blender Foundation) | 0 | add-on รัน Python ใดก็ได้ (`exec`) ผ่าน socket `localhost:9876` **ไม่มี authentication** · มี `BLENDER_MCP_SAFE_MODE=1` บล็อกการอ่านเขียนไฟล์/network · ส่ง telemetry แบบไม่ระบุตัวตนเป็นค่าเริ่ม ปิดด้วย `DISABLE_TELEMETRY=true` · มีบริการ premium (สร้างโมเดล AI) | ต้องติดตั้งบนเครื่องเจ้าของ |

**ยังไม่ได้ตรวจ:** ราคาและแผนที่ต้องใช้กับ MCP ของ Figma, Mobbin, Adobe, Canva, Supabase และราคา premium ของ Blender MCP
เพราะ network ของ container นี้เข้าเว็บของผู้ให้บริการไม่ได้ (DNS ไม่พบ host) หน้าเชื่อมบัญชีของ claude.ai จะแสดงสิทธิ์ที่ขอ ให้เจ้าของตรวจแผนตอนเชื่อม

## 4. ผลทดสอบการใช้งานจริง
| เครื่องมือ | วันที่ | ทดสอบอะไร | ผล |
|---|---|---|---|
| ทั้ง 6 ตัว | 2026-11-23 | ยังไม่ได้ทดสอบ (ยังไม่ได้ติดตั้ง/เชื่อมบัญชี) | — |

ชุดทดสอบที่จะรันเมื่อเชื่อมแล้ว (อ่านอย่างเดียว ไม่สร้างค่าใช้จ่าย) และวัด เวลา / token / คุณภาพ เทียบวิธีเดิม:
- **Figma:** `whoami` → `get_metadata` + `get_screenshot` ของ frame ที่ทีม A ส่ง · เทียบกับการวัดค่าจากภาพ PNG ในงาน HUD skin เดิม (DES-002)
- **Mobbin:** `search_screens` "game HUD landscape" 1 ครั้ง · ตรวจว่าไม่มีไฟล์ภาพตกค้างใน repo
- **Adobe:** ลบพื้นหลังภาพ placeholder 1 ชิ้นใน scratchpad · เทียบกับ `tools/art/slice_hud.py` (ขอบ alpha, เวลา)
- **Canva:** `search-designs` ในบัญชี (อ่านอย่างเดียว)
- **Supabase:** `list_projects` แบบ `read_only=true` · ห้ามเรียก `create_project`
- **Blender MCP:** บนเครื่องเจ้าของ เปิด safe mode → `get_scene_info` → รัน `tools/blender/build_kit.py` แล้วเทียบ hash GLB กับ build headless ใน container

## 5. รายการขออนุมัติจากเจ้าของ
| # | รายการ | เจ้าของต้องทำ | ความเสี่ยง/ค่าใช้จ่าย |
|---|---|---|---|
| 1 | Figma plugin (Knowledge Work, upstream ของ Figma) | กดติดตั้ง + เชื่อมบัญชี Figma | แผนฟรีอาจจำกัดจำนวนการเรียก (ยังไม่ได้ตรวจ) |
| 2 | Mobbin plugin | กดติดตั้ง + เชื่อมบัญชี Mobbin | อาจต้องใช้แผนเสียเงิน (ยังไม่ได้ตรวจ) |
| 3 | Adobe plugin | กดติดตั้ง + เชื่อม Adobe ID | token เปิดค้างสูงสุด (~6k) และมี tool ซื้อ Stock license |
| 4 | Canva plugin | กดติดตั้ง + เชื่อมบัญชี Canva | ต่ำ |
| 5 | Supabase plugin | กดติดตั้ง + เชื่อมบัญชี · ตัดสินว่าจะเริ่ม ADR backend หรือพักไว้ | สร้างโปรเจกต์ที่มีค่าใช้จ่ายได้ แนะนำพักไว้จนถึง backlog ข้อ 7 |
| 6 | Blender MCP | ติดตั้ง Blender + add-on บนเครื่อง Windows และอนุมัติให้ Claude ต่อเข้าเครื่อง (Remote Control) | add-on รันโค้ดใดก็ได้ → เปิด safe mode, ปิด telemetry, เปิด socket เฉพาะตอนใช้ · ขั้นตอนใน `docs/BLENDER_MCP.md` |

## 6. นำไปใช้กับโปรเจกต์อื่น
- K.N.D.: ใช้หลักข้อ 1 ได้ทันที บทบาทที่เกี่ยวคือ Marketing (Canva, Adobe) · repo/ไฟล์กฎของ K.N.D. ไม่อยู่ในเซสชันนี้ จึงยังไม่ได้แก้
- โปรเจกต์ใหม่: คัดลอกข้อ 1–2 แล้วปรับตาราง ห้ามเปลี่ยนสถาปัตยกรรมเดิมเพื่อให้เข้ากับเครื่องมือ
