"""Contact sheet of an environment-library GLB: one labelled cell per top-level node, each next to a
1.5 m grey capsule ("hero scale" reference).  Camera = game-like 48 deg down (ortho), or --front (eye level).

    tools/blender/.venv/bin/python tools/blender/render_env_gallery.py \
        [--glb public/assets/models/env_library_v01.glb] [--out docs/art/env_library_gallery.png] \
        [--sheet-cols 4] [--front] [--samples 16] [--no-hero]

Cycles CPU (like render_preview.py, which supplies the scene/camera/label helpers): handles alpha-clip leaf
cards and vertex colours exactly as imported from the GLB.  Headless only.
"""
import argparse
import os
import shutil
import sys
import tempfile

import bpy
import bmesh
import numpy as np

sys.dont_write_bytecode = True  # importing render_preview must not leave __pycache__ in the repo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_preview as rp  # noqa: E402  (helpers only; its main() is guarded)

REPO = rp.REPO


def capsule(mat):
    """1.5 m tall capsule, radius 0.25, standing on z=0 at the origin."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=0.25)
    for v in bm.verts:
        v.co.z += (1.25 if v.co.z > 0 else 0.25)
    me = bpy.data.meshes.new("capsule")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("hero_scale", me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def main():
    if not bpy.app.background:
        raise SystemExit("render_env_gallery.py is headless-only")
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", default=os.path.join(REPO, "public", "assets", "models", "env_library_v01.glb"))
    ap.add_argument("--out", default=os.path.join(REPO, "docs", "art", "env_library_gallery.png"))
    ap.add_argument("--sheet-cols", type=int, default=4)
    ap.add_argument("--cell-w", type=int, default=420)
    ap.add_argument("--cell-h", type=int, default=380)
    ap.add_argument("--samples", type=int, default=16)
    ap.add_argument("--supersample", type=int, default=2)
    ap.add_argument("--front", action="store_true", help="eye-level front view instead of the 48 deg game angle")
    ap.add_argument("--no-hero", action="store_true", help="omit the 1.5 m capsule (small items fill the cell)")
    ap.add_argument("--only", default="", help="comma-separated node names")
    args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    rp.PITCH, rp.YAW = (4.0, 0.0) if args.front else (48.0, 35.0)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.glb)
    tops = sorted((o for o in bpy.context.scene.objects if o.parent is None), key=lambda o: o.name)
    only = set(filter(None, args.only.split(",")))
    tops = [o for o in tops if not only or o.name in only]
    if not tops:
        raise SystemExit("no top-level nodes in " + args.glb)
    sc, cam, ground = rp.setup_scene(args.samples, 1.6, 0.45)
    ink = rp.flat_material("ink_label", rp.INK, emissive=True)
    labels = [rp.add_text(cam, "", 0.1, ink), rp.add_text(cam, "", 0.1, ink)]
    hero = capsule(rp.flat_material("hero_grey", "#9A9AA8"))
    cols = max(1, min(args.sheet_cols, len(tops)))
    rows = -(-len(tops) // cols)
    cw, ch, ss = args.cell_w, args.cell_h, args.supersample
    sheet = np.ones((rows * ch, cols * cw, 3), dtype=np.float32)
    tmp = tempfile.mkdtemp(prefix="synes_envgal_")
    try:
        for i, root in enumerate(tops):
            for o in bpy.context.scene.objects:
                o.hide_render = o.type == "MESH"
            ground.hide_render = False
            labels[0].hide_render = labels[1].hide_render = False
            objs = rp.hierarchy(root)
            for o in objs:
                o.hide_render = False
            pts = rp.world_corners(objs)
            lo = [min(getattr(p, a) for p in pts) for a in "xyz"]
            hi = [max(getattr(p, a) for p in pts) for a in "xyz"]
            if not args.no_hero:  # capsule left of the item, same depth
                hero.hide_render = False
                hero.location = (lo[0] - 0.55, (lo[1] + hi[1]) / 2, 0)
                pts += rp.world_corners([hero])
            else:
                hero.hide_render = True
            span = max(hi[0] - lo[0], hi[1] - lo[1])
            ground.scale = ((span + 1.4) * 0.6 + 0.3,) * 3
            ground.location = ((lo[0] + hi[0]) / 2 - (0 if args.no_hero else 0.3), (lo[1] + hi[1]) / 2, -0.001)
            view_w, view_h = rp.frame(cam, pts, cw, ch)
            n_tris = rp.tris(objs)
            rp.place_labels(labels, view_w, view_h, ch, [root.name, "%.2f m tall  |  %s tris" % (hi[2] - lo[2], format(n_tris, ","))])
            path = os.path.join(tmp, "%03d.png" % i)
            rp.render_cell(sc, path, cw, ch, ss)
            r, c = divmod(i, cols)
            sheet[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = rp.load_pixels(path, ss)
            print("rendered", root.name, flush=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    for r in range(1, rows):
        sheet[r * ch - 1:r * ch + 1, :] = 1.0
    for c in range(1, cols):
        sheet[:, c * cw - 1:c * cw + 1] = 1.0
    H, W = sheet.shape[:2]
    img = bpy.data.images.new("env_gallery", W, H, alpha=False)
    img.pixels.foreach_set(np.clip(np.concatenate([sheet[::-1], np.ones((H, W, 1), np.float32)], axis=2), 0, 1).ravel())
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    sc.render.image_settings.compression = 100
    img.save_render(args.out, scene=sc)
    print("wrote", args.out)


if __name__ == "__main__":
    main()
