# Blender: สถานะ และวิธีเชื่อม Blender MCP

## สถานะในเซสชันนี้ (ข้อเท็จจริง)
- เซสชันนี้รันบน cloud container ที่ไม่มี Blender GUI และไม่มีคอมพิวเตอร์ของเจ้าของเชื่อมอยู่ (ไม่มีโฟลเดอร์ Remote Control ให้เลือก)
- ใน directory ของ connector ไม่พบ Blender MCP แบบ remote
- **จึงยังไม่ได้เชื่อม Blender MCP จริง** แต่ใช้ Blender 5.3 แบบ Python module (`bpy` จาก PyPI) รัน headless ใน container แทน
  สคริปต์ `tools/blender/build_kit.py` สร้างโมเดลทั้งชุดแล้ว export เป็น `public/assets/models/synes_kit.glb`

## วิธีเชื่อมบนเครื่อง Windows ของเจ้าของ (Claude Desktop)
1. ติดตั้ง Blender (4.x หรือ 5.x) และ `uv` (`winget install astral-sh.uv`)
2. ดาวน์โหลด add-on `addon.py` จาก repository **blender-mcp** (ผู้พัฒนา ahujasid, license MIT) แล้วเปิด Blender
   ไปที่ Edit → Preferences → Add-ons → Install… เลือก `addon.py` และเปิดใช้งาน
3. ใน Blender กด N เพื่อเปิด sidebar ไปที่แท็บ BlenderMCP แล้วกด **Connect** (เปิด socket ที่ localhost:9876)
4. แก้ไฟล์ตั้งค่า Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`):
   ```json
   { "mcpServers": { "blender": { "command": "uvx", "args": ["blender-mcp"] } } }
   ```
5. รีสตาร์ต Claude Desktop แล้วสั่งให้ Claude รันสคริปต์ในโปรเจกต์ผ่านเครื่องมือ execute code ของ Blender MCP
   เช่น "เปิด tools/blender/build_kit.py แล้วรันใน Blender" จากนั้นปรับโมเดลแบบเห็นผลสด และ export กลับเป็น GLB ไฟล์เดิม

> ก่อนติดตั้ง add-on จากภายนอก ให้อ่านโค้ด `addon.py` ก่อน เพราะ add-on นี้รันโค้ด Python ใดก็ได้ใน Blender ตามที่ได้รับคำสั่งผ่าน socket
> และควรเปิด socket เฉพาะตอนใช้งาน ทีมยังไม่ได้ตรวจโค้ด add-on นี้ในรอบนี้ เพราะไม่ได้ติดตั้ง
> ถ้าเจ้าของต้องการ เซสชันถัดไปจะตรวจให้ก่อนแล้วบันทึกผลใน `docs/ASSETS.md`
