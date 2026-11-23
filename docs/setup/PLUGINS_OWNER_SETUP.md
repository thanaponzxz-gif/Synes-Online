# ขั้นตอนติดตั้งเครื่องมือที่เจ้าของต้องทำเอง (ADR-010 ตามเงื่อนไขอนุมัติ 2026-11-23)

> Claude ติดตั้งหรือเชื่อมบัญชีแทนเจ้าของไม่ได้ ทุกขั้นในไฟล์นี้เจ้าของต้องกดเอง และตรวจสิทธิ์ในหน้าขออนุญาตก่อนยืนยัน
> ลิงก์ทั้งหมดเป็นของผู้ให้บริการเอง · ราคาและแผน**ยังไม่ได้ตรวจ** (container เข้าเว็บผู้ให้บริการไม่ได้) ถ้าหน้าไหนขอให้อัปเกรดหรือใส่บัตร ให้หยุดแล้วแจ้ง PM ก่อน
> เมื่อเชื่อมเสร็จต้อง **เปิดเซสชันใหม่** เพราะ connector ถูกอ่านตอนเริ่มเซสชัน

## ขั้น 0: ตรวจว่ามีอะไรอยู่แล้ว (กันติดตั้งซ้ำ)
- เปิด https://claude.ai/customize/connectors ดูว่ามี Figma / Mobbin / Adobe / Canva แล้วหรือยัง ถ้ามีแล้ว ไม่ต้องติดตั้งซ้ำ ให้ข้ามไปขั้นเชื่อมบัญชี
- ผลตรวจของ PM วันที่ 2026-11-23: บัญชีนี้ยังไม่มี plugin เลย และมี connector แค่ Gmail กับ Google Drive

## ขั้น 1–4: plugin บน claude.ai (Figma, Mobbin, Adobe, Canva)
**วิธีติดตั้ง:** กดปุ่มติดตั้งในการ์ดที่ PM แสดงในแชต หรือค้นชื่อจากหน้า Customize ของ claude.ai แล้วเลือกรุ่นตามตารางนี้ (ตรวจโค้ดรุ่นนี้แล้ว)
**วิธีเชื่อมบัญชี:** https://claude.ai/customize/connectors → เลือกเครื่องมือ → Connect → ล็อกอินในหน้าของผู้ให้บริการ → อ่านรายการสิทธิ์ → Allow

| ขั้น | เครื่องมือ (รุ่นที่ตรวจแล้ว) | เว็บทางการ | บัญชีที่ใช้ | สิทธิ์ที่จำเป็น | สิทธิ์/สิ่งที่ห้ามให้ |
|---|---|---|---|---|---|
| 1 | **Figma** จาก Knowledge Work catalog (ผู้เผยแพร่ Figma, 2.2.211) ไม่ใช่รุ่น community ใน Directory | https://www.figma.com · โค้ด: https://github.com/figma/mcp-server-guide | บัญชี Figma ที่ทีม A ใช้วางไฟล์ HUD | อ่านไฟล์ (design context, screenshot, variables) · เขียนไฟล์ใช้เฉพาะเมื่อทีม A ขอ | ถ้าขอให้อัปเกรด seat/แผน ให้หยุดก่อน |
| 2 | **Mobbin** (partner, 1.5.0) | https://mobbin.com · โค้ด: https://github.com/mobbin/skills (MIT) | บัญชี Mobbin | ค้นหาหน้าจอ/flow (อ่านอย่างเดียว) | ห้ามสมัครแผนเสียเงินโดยไม่ถาม |
| 3 | **Adobe** for creativity (partner, 3.4.0) | https://www.adobe.com · โค้ด: https://github.com/adobe/skills (Apache-2.0) | Adobe ID | แก้ภาพ (ตัดพื้นหลัง, ย่อขนาด) | **ห้ามซื้อ Stock Asset หรือ license ใด ๆ** (เงื่อนไขข้อ 2) · ไม่ใส่บัตรในขั้นนี้ |
| 4 | **Canva** (partner, 1.1.0) | https://www.canva.com · โค้ด: https://github.com/canva-sdks/canva-skills (Apache-2.0) | บัญชี Canva | อ่าน/สร้างดีไซน์ในบัญชี | ห้ามเผยแพร่/แชร์ดีไซน์สาธารณะผ่าน Claude |

**ไม่ต้องติดตั้ง:** Supabase (พักไว้ตามเงื่อนไขข้อ 3) และ plugin รุ่นอื่นที่ชื่อคล้ายกัน (Figma to Code, design-dev-bridge ฯลฯ ยังไม่ได้ตรวจโค้ด)

**ปิดเมื่อไม่ใช้:** plugin ผูกกับบัญชี จึงมีผลกับทุกโปรเจกต์ (Synes, K.N.D.) และทั้ง 4 ตัวกินราว 10.8k token ทุกเซสชัน PM จะบอกว่ารอบไหนต้องเปิดตัวไหน

## ขั้น 5: Blender MCP บน Windows (เครื่องของเจ้าของ)
> ใช้ได้เฉพาะเซสชันที่รันบนเครื่อง Windows (Claude Code ในเครื่อง หรือเซสชันคลาวด์ที่ต่อเข้าเครื่องผ่าน Remote Control) เซสชันคลาวด์ล้วนไม่เห็น MCP นี้

| ขั้นย่อย | ทำอะไร | ลิงก์ทางการ | สิทธิ์ที่ใช้ |
|---|---|---|---|
| 5.1 | ตรวจของเดิมก่อน: `powershell -ExecutionPolicy Bypass -File tools\setup\setup-blender-mcp.ps1` (ตรวจอย่างเดียว ไม่แก้อะไร) จะบอกว่ามี Blender, uv, add-on และค่า MCP อยู่แล้วหรือยัง | — | ผู้ใช้ปกติ (ไม่ต้อง Administrator) |
| 5.2 | ถ้าไม่มี Blender: ติดตั้งเอง | https://www.blender.org/download/ | ตัวติดตั้งของ Blender อาจขอสิทธิ์ Administrator |
| 5.3 | ถ้าไม่มี uv: `winget install --id=astral-sh.uv -e` แล้วเปิด terminal ใหม่ | https://docs.astral.sh/uv/ | ผู้ใช้ปกติ |
| 5.4 | รันสคริปต์ซ้ำด้วย `-Apply`: ติดตั้ง add-on เฉพาะเมื่อยังไม่มี และเพิ่ม MCP ชื่อ `blender` ระดับผู้ใช้ โดยเปิด safe mode, ปิด telemetry, ต่อเฉพาะ `localhost:9876` (ล็อกรุ่น `mcp-for-blender@2.3.1` ที่ตรวจโค้ดแล้ว) | โค้ด: https://github.com/ahujasid/blender-mcp (MIT) | เขียนไฟล์ใน `%APPDATA%\Blender Foundation\Blender\<รุ่น>\` และ `%USERPROFILE%\.claude.json` |
| 5.5 | ใน Blender: Edit → Preferences → Add-ons → เปิด "MCP for Blender" · ตั้ง **Bind Address = localhost**, **Allow Remote Connections = ปิด**, **Allow Telemetry = ปิด** | — | — |
| 5.6 | กด N → แท็บ MCP for Blender → ปิด Poly Haven, Sketchfab, Hyper3D และบริการสร้างโมเดล AI ทั้งหมด → กด Connect | — | ห้ามใส่ API key ของบริการ premium |
| 5.7 | ตรวจ: `...setup-blender-mcp.ps1 -Verify` ต้องขึ้น "ผ่าน: ฟังเฉพาะ localhost" และไม่มีกฎ firewall ของพอร์ต 9876 · ถ้า Windows ถาม "Allow access" สำหรับ Blender ให้กด **Cancel/ไม่อนุญาต** | — | ห้ามเปิดพอร์ตใน Windows Firewall |
| 5.8 | กด Disconnect ใน Blender เมื่อเลิกใช้ | — | — |

**ข้อควรรู้:** add-on นี้รันโค้ด Python อะไรก็ได้ที่ได้รับผ่าน socket โดยไม่มีรหัสผ่าน safe mode กันการอ่านเขียนไฟล์ การต่อเน็ต และการรันโปรแกรมอื่น
การต่อเฉพาะ localhost ทำให้เครื่องอื่นสั่งไม่ได้ · สคริปต์ยังไม่ได้ทดสอบบน Windows จริง (container ไม่มี PowerShell) ถ้า error ให้ส่งข้อความมาให้ PM

## ขั้น 6: แจ้ง PM
พิมพ์ในแชตว่าเชื่อมตัวไหนแล้ว แล้วเปิดเซสชันใหม่ PM จะรันงานทดสอบขนาดเล็กตาม `docs/knowledge/PLUGIN_SKILLS.md` ข้อ 4 แล้วกลับไปทำด่านแรกต่อทันที
