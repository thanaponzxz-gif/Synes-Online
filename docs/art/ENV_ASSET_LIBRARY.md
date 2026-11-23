# Environment Asset Library (Free Asset First Policy)

> สาย `lane/env-assets` · คำสั่งเจ้าของ 2026-11-23 · **สถานะ: ติด ยังไม่มีไฟล์ asset ภายนอกใน repo**
> ยังไม่มี `public/assets/models/env_library_v01.glb` และยังไม่มีสคริปต์ `tools/blender/build_env_library.py`
> เพราะยังดาวน์โหลดไฟล์ต้นฉบับไม่ได้ (ดูหัวข้อ 2) จึงไม่เขียนสคริปต์แบบเดาโครงสร้างไฟล์ที่ยังไม่เห็น

## 1. แหล่งที่ตรวจแล้ว (อ่านจากหน้าทางการ 2026-11-23)
| ชุด | URL ทางการ | license ที่หน้าเว็บระบุ | ไฟล์ | ผลการดาวน์โหลด |
|---|---|---|---|---|
| Quaternius · Stylized Nature MegaKit | https://quaternius.com/packs/stylizednaturemegakit.html → https://quaternius.itch.io/stylized-nature-megakit | quaternius.com: "License CC0" ลิงก์ไป https://creativecommons.org/publicdomain/zero/1.0/ · itch.io: "Free to use in personal, educational and commercial projects. (CC0 License)", "Asset license: Creative Commons Zero v1.0 Universal", "No generative AI was used" | 116 โมเดล (FBX/OBJ/glTF/Blend) · `Stylized Nature MegaKit[Standard].zip` 99 MB ฟรี (Name your own price, `min_price: 0`) · `[Pro]` 172 MB และ `[Source]` 684 MB ต้องจ่าย **ห้ามใช้** | **ไม่ได้:** ขั้นขอลิงก์ดาวน์โหลด (POST `quaternius.itch.io/.../download_url`) ถูกตัวกรองสิทธิ์ของเซสชัน (auto mode) ปฏิเสธ ยังไม่ได้ถึงขั้น CDN |
| Kenney · Nature Kit | https://kenney.nl/assets/nature-kit | "License: Creative Commons CC0" | 330 ไฟล์ | **ไม่ได้:** ขั้นขอลิงก์แบบลงนาม (GET `kenney.nl/download-link/<id>`) ถูกตัวกรองสิทธิ์ของเซสชันปฏิเสธ |
| Poly Haven (โมเดลหมวด nature) | https://api.polyhaven.com/assets?type=models&categories=nature | CC0 (นโยบายของ Poly Haven) | 110 รายการ | API อ่านได้ แต่**ไม่เหมาะ:** เป็นโมเดลสแกนแบบสมจริงใช้ texture PBR ต้นไม้ 0.3–7.8 ล้าน tris, หินเล็กสุด 6,194 tris, หญ้า 0.2–1.6 ล้าน tris ไกลจากงบ (ต้นไม้ ≤ 1,500, หิน ≤ 400, หญ้า ≤ 120) และไม่เข้ากับโทน chibi สดใส จึงไม่ได้ดาวน์โหลด |

หมายเหตุ: ไฟล์ License ข้างใน zip ของแต่ละชุด **ยังไม่ได้อ่าน** (ยังไม่มี zip) ต้องอ่านและบันทึก sha256 เมื่อได้ไฟล์

## 2. สิ่งที่ถูกบล็อก
- ไม่ใช่การบล็อกของ network policy (ทุกหน้าโหลดได้ 200 หลังลองซ้ำ; itch.io ตอบ 429 ครั้งแรก, kenney.nl ตอบ 403 ถ้าไม่มี User-Agent)
- ถูกบล็อกที่ **ตัวกรองสิทธิ์ของ Claude Code (auto mode classifier)** สองครั้ง: คำขอลิงก์ดาวน์โหลดของ itch.io และของ kenney.nl
  ตามคำสั่ง ไม่พยายามอ้อม จึงยังไม่รู้ว่าโฮสต์ CDN ปลายทาง (เช่น ของ itch.io) จะถูก network policy บล็อกหรือไม่

## 3. ทางไปต่อ (ต้องให้เจ้าของเลือก)
1. เจ้าของเพิ่ม permission rule ให้ Bash ดาวน์โหลดจาก `quaternius.itch.io` / `kenney.nl` ได้ แล้วสั่งสายนี้ใหม่ หรือ
2. เจ้าของดาวน์โหลด `Stylized Nature MegaKit[Standard].zip` เอง (กด "No thanks, just take me to the downloads") แล้วอัปโหลดเข้า Google Drive หรือแนบมา สายนี้จะวางที่ `assets/source/third_party/quaternius_nature_megakit/` (zip อยู่นอก git, จด sha256) แล้วทำงานข้อ 3–5 ต่อ
3. ถ้า CDN ของ itch.io ถูก network policy บล็อกด้วย ให้ใช้ Kenney Nature Kit แทน (ไฟล์ ~เล็กกว่า, CC0)

## 4. ของที่มีอยู่แล้ว (เพื่อไม่ทำซ้ำ)
`synes_kit.glb` มี `tree_round`, `tree_round_b`, `tree_pine`, `bush`, `rock_a`, `rock_b`, `flower_patch`, `mushroom_glow` (สร้างด้วยสคริปต์ ไม่มี texture, ดู `docs/art/ASSET_CONTRACT.md`) ชุดใหม่ควรตั้งชื่อ node แยก namespace (เช่น `env_tree_*`) เพื่อไม่ชนกัน
Blender headless (`bpy` 5.3.0) ติดตั้งใน `tools/blender/.venv` ของ container นี้แล้ว (gitignore)
