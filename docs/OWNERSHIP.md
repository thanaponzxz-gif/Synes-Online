# เจ้าของไฟล์ต่อสายงาน (ป้องกันการแก้ชนกัน)

| สายงาน | branch | เจ้าของไฟล์ |
|---|---|---|
| gameplay / engine | `main` | `shared/**`, `src/**` ยกเว้น `src/ui/**`, `server/**`, `tests/**` |
| UI/UX | `main` (เซสชันเดียวกับ gameplay ในรอบนี้) | `src/ui/**` |
| art / Blender | `lane/art` (ก่อนหน้าใช้ `art/blender-kit`, merge แล้ว) | `tools/blender/**`, `public/assets/models/**`, `docs/art/**` |
| web perf / QA | `main` | `tools/qa/**`, `docs/qa/**` |
| spike | `main` (ปิดงานแล้ว) | `spike/**`, `vite.spike.config.ts` |
| ผู้จัดการโปรเจค Synes (PM) | `main` | `CLAUDE.md`, `docs/PROJECT_SYNES.md`, `docs/HANDOFF.md`, `docs/team/**`, `docs/ASSET_PIPELINE.md`, `docs/handoff/**`, `.claude/agents/**`, `.claude/skills/**` และเป็นคนเดียวที่ merge เข้า `main` |
| **ทีม A: GPT Codex** (ADR-007, เจ้าของส่งต่อ หรือ commit บน branch `design/<หัวข้อ>`) | `design/<หัวข้อ>` | `docs/design/DES-*.md` และบรีฟ asset ใน `docs/handoff/<asset>.md` (PM ดูแลเฉพาะ README และตารางสถานะ) |
| inbox asset (เจ้าของ / GPT / Tripo วางไฟล์) | `main` | `assets/_inbox/**` (Claude ย้ายออกเมื่อ APPROVED) |

ไฟล์ที่ใช้ร่วมกัน (`docs/ASSETS.md`, `docs/HANDOFF.md`, `package.json`) ให้แก้เฉพาะส่วนของตัวเอง แล้ว merge เข้า `main` ทีละสายงาน
ทุกเซสชันต้องเริ่มด้วย `git fetch && git status && git log --oneline -5` และจบด้วย handoff ใน `docs/HANDOFF.md`
