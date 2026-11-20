"""Character comparison contact sheet: hero + prismback from game-like angles, one row per GLB.

    tools/blender/.venv/bin/python tools/blender/render_chars.py \
        --glb current=/tmp/kit_current.glb --glb A=public/assets/models/synes_kit.glb --glb B=/tmp/kit_B.glb \
        --out docs/qa/chars-v01/sheet.png [--samples 16] [--supersample 2]

Writes three images with the same layout: <out> (colour, Cycles CPU), <out>-gray.png (Rec.709 luma)
and <out>-sil.png (alpha silhouette, black on white: what the shape alone says).
Columns (ortho camera, Blender axes: characters face -Y):
  hero  back game   yaw 180, pitch 31  ~ the landscape gameplay camera behind the hero (src/render/view.ts)
  hero  back 3/4    yaw 145, pitch 25
  hero  front 3/4   yaw  35, pitch 15
  boss  front game  yaw   0, pitch 14  ~ boss-open camera (boss faces the player, camera 12 m away, 4.5 m up)
  boss  side        yaw  90, pitch 14
  boss  back 3/4    yaw 150, pitch 35  (back crystals and armour plates)
Reuses the scene, labels and cell helpers of render_preview.py so the lighting matches the kit sheet.
"""
import argparse
import math
import os
import shutil
import sys
import tempfile

import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True  # no __pycache__ next to the scripts
import render_preview as rp  # noqa: E402  (helpers only; its main() is not run on import)

VIEWS = [  # (asset, label, yaw deg, pitch deg, cell width px)
    ("hero", "hero back (game cam)", 180, 31, 270),
    ("hero", "hero back 3/4", 145, 25, 270),
    ("hero", "hero front 3/4", 35, 15, 270),
    ("prismback", "boss front (game cam)", 0, 14, 380),
    ("prismback", "boss side", 90, 14, 380),
    ("prismback", "boss back 3/4", 150, 35, 380),
]
ROW_H = 330


def frame(cam, pts, w_px, h_px, yaw, pitch):
    """Same fit as render_preview.frame, with the view direction as parameters."""
    p, y = math.radians(pitch), math.radians(yaw)
    fwd = Vector((math.sin(y) * math.cos(p), math.cos(y) * math.cos(p), -math.sin(p)))
    cam.rotation_euler = fwd.to_track_quat("-Z", "Y").to_euler()
    rot = cam.rotation_euler.to_matrix()
    local = [rot.transposed() @ q for q in pts]
    xs, ys, zs = [q.x for q in local], [q.y for q in local], [q.z for q in local]
    aspect = w_px / h_px
    usable = 1.0 - rp.LABEL_BAND - 0.02
    view_h = max((max(ys) - min(ys)) / usable, (max(xs) - min(xs)) / 0.9 / aspect)
    cam.data.ortho_scale = view_h * aspect if aspect >= 1.0 else view_h
    cx = (max(xs) + min(xs)) / 2
    cy = (max(ys) + min(ys)) / 2 - (rp.LABEL_BAND - 0.02) / 2 * view_h
    cam.location = rot @ Vector((cx, cy, max(zs) + 40.0))
    return view_h * aspect, view_h


def save_png(arr, path, sc):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=False)
    rgba = np.concatenate([arr[::-1], np.ones((h, w, 1), np.float32)], axis=2)
    img.pixels.foreach_set(np.clip(rgba, 0, 1).ravel())
    sc.render.image_settings.compression = 100
    img.save_render(path, scene=sc)
    bpy.data.images.remove(img)
    print("wrote", path, flush=True)


def render_rgba(sc, path, w, h, ss):
    rp.render_cell(sc, path, w, h, ss)
    img = bpy.data.images.load(path)
    W, H = img.size
    buf = np.empty(W * H * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    bpy.data.images.remove(img)
    arr = buf.reshape(H, W, 4)[::-1]
    return arr.reshape(h, ss, w, ss, 4).mean(axis=(1, 3))


def main():
    if not bpy.app.background:
        raise SystemExit("render_chars.py is headless-only; run it with tools/blender/.venv/bin/python")
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", action="append", required=True, help="LABEL=path, one per row")
    ap.add_argument("--out", required=True)
    ap.add_argument("--samples", type=int, default=16)
    ap.add_argument("--supersample", type=int, default=2)
    ap.add_argument("--sun", type=float, default=1.6)
    ap.add_argument("--sky-light", type=float, default=0.45)
    args = ap.parse_args(sys.argv[1:] if "--" not in sys.argv else sys.argv[sys.argv.index("--") + 1:])
    rows = [g.split("=", 1) for g in args.glb]
    width = sum(v[4] for v in VIEWS)
    sheet = np.zeros((ROW_H * len(rows), width, 3), np.float32)
    sil = np.ones((ROW_H * len(rows), width), np.float32)
    tmp = tempfile.mkdtemp(prefix="synes_chars_")
    ss = args.supersample
    try:
        for r, (label, path) in enumerate(rows):
            bpy.ops.wm.read_factory_settings(use_empty=True)
            bpy.ops.import_scene.gltf(filepath=os.path.abspath(path))
            imported = list(bpy.context.scene.objects)
            sc, cam, ground = rp.setup_scene(args.samples, args.sun, args.sky_light)
            ink = rp.flat_material("ink_label", rp.INK, emissive=True)
            labels = [rp.add_text(cam, "", 0.1, ink), rp.add_text(cam, "", 0.1, ink)]
            kb = os.path.getsize(path) / 1024.0
            x0 = 0
            for k, (asset, view, yaw, pitch, w) in enumerate(VIEWS):
                for o in imported:
                    o.hide_render = True
                root = bpy.data.objects[asset]
                objs = rp.hierarchy(root)
                for o in objs:
                    o.hide_render = False
                pts = rp.world_corners(objs)
                lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
                hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
                span = max(hi.x - lo.x, hi.y - lo.y)
                ground.scale = (span * 0.55 + 0.3,) * 3
                ground.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0.0)
                view_w, view_h = frame(cam, pts, w, ROW_H, yaw, pitch)
                line2 = "%s tris  |  %.2f m tall" % (format(rp.tris(objs), ","), hi.z - lo.z)
                if k == 0:
                    line2 += "  |  GLB %.1f KB" % kb
                rp.place_labels(labels, view_w, view_h, ROW_H, ["%s  %s" % (label, view), line2])
                # colour pass (with ground disc and labels)
                ground.hide_render = False
                labels[0].hide_render = labels[1].hide_render = False
                sc.render.film_transparent = False
                sc.cycles.samples = args.samples
                cell = os.path.join(tmp, "c_%d_%d.png" % (r, k))
                sheet[r * ROW_H:(r + 1) * ROW_H, x0:x0 + w] = render_rgba(sc, cell, w, ROW_H, ss)[:, :, :3]
                # silhouette pass: the asset alone, alpha only
                ground.hide_render = True
                labels[0].hide_render = labels[1].hide_render = True
                sc.render.film_transparent = True
                sc.render.image_settings.color_mode = "RGBA"
                sc.cycles.samples = 1
                cell = os.path.join(tmp, "s_%d_%d.png" % (r, k))
                alpha = render_rgba(sc, cell, w, ROW_H, ss)[:, :, 3]
                sc.render.image_settings.color_mode = "RGB"
                sil[r * ROW_H:(r + 1) * ROW_H, x0:x0 + w] = 1.0 - alpha
                print("rendered", label, view, flush=True)
                x0 += w
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    # gutters
    x = 0
    for v in VIEWS[:-1]:
        x += v[4]
        sheet[:, x - 1:x + 1] = 1.0
        sil[:, x - 1:x + 1] = 0.6
    for r in range(1, len(rows)):
        sheet[r * ROW_H - 1:r * ROW_H + 1, :] = 1.0
        sil[r * ROW_H - 1:r * ROW_H + 1, :] = 0.6
    sc = bpy.context.scene
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    save_png(sheet, args.out, sc)
    # sheet pixels are display-referred sRGB already (Standard view transform): luma straight on them
    luma = sheet @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    base = args.out[:-4] if args.out.endswith(".png") else args.out
    save_png(np.repeat(luma[:, :, None], 3, axis=2), base + "-gray.png", sc)
    save_png(np.repeat(sil[:, :, None], 3, axis=2), base + "-sil.png", sc)


if __name__ == "__main__":
    main()
