"""Render a labelled contact sheet of synes_kit.glb to docs/art/kit_preview.png.

    tools/blender/.venv/bin/python tools/blender/render_preview.py [--samples 16] [--out PATH]

It imports the exported GLB (so the preview shows exactly what the game loads), then renders
each asset in its own cell with Cycles on the CPU: orthographic camera pitched 48 degrees down
like the game camera, yawed to a 3/4 view from the front-left, soft sky world, a pale ground
disc to show contact/shadows, and a label (name, height, triangles). Cells are rendered at
2x and box-filtered down, then tiled into one 1600x900 PNG. Requires only bpy (+ its numpy).
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
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SHEET_W, SHEET_H = 1600, 900
PITCH, YAW = 48.0, 35.0  # degrees: camera looks down 48 deg, from 35 deg left of the front
LABEL_BAND = 0.25  # fraction of a cell kept for the label
ROWS = [  # (row height px, asset names); None = legend cell
    (300, ["hero", "puffcap", "thornling", "prismback"]),
    (200, ["tree_round", "tree_round_b", "tree_pine", "bush", "rock_a", "rock_b", "crystal_cluster",
           "flower_patch", "mushroom_glow"]),
    (200, ["tent", "campfire", "signpost", "lantern_post", "crystal_pillar", "crystal_gate", "lumen_spring",
           "fence", "house_a"]),
    (200, ["house_b", "market_stall", "fountain", "ruin_arch", "ruin_column", "shop_counter", "weapon_rack",
           "banner", None]),
]
SKY = "#CDEBFA"
GROUND = "#E9F3D8"
INK = "#2B2440"
GUTTER = "#FFFFFF"
SWATCHES = ["#5CF2E6", "#A78BFA", "#FF9EC7", "#FFC857", "#7CCB5E", "#3F8F4A", "#8A5A3B", "#E8C99B",
            "#B9B4C7", "#2BB3A3"]


def lin(hex_):
    h = hex_.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def flat_material(name, hex_, emissive=False):
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    if emissive:  # exact colour regardless of lighting (labels, swatches)
        out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = lin(hex_)
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    else:
        bsdf.inputs["Base Color"].default_value = lin(hex_)
        bsdf.inputs["Roughness"].default_value = 1.0
    return mat


def camera_only(obj):
    for attr in ("visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter",
                 "visible_shadow"):
        setattr(obj, attr, False)


def setup_scene(samples, sun_energy, sky_light):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = False  # this bpy build ships without OIDN; supersampling instead
    sc.cycles.max_bounces = 4
    sc.cycles.caustics_reflective = sc.cycles.caustics_refractive = False
    sc.cycles.seed = 0
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    world = bpy.data.worlds.new("sky")
    sc.world = world
    nt = world.node_tree
    bg_light = next(n for n in nt.nodes if n.type == "BACKGROUND")  # dim sky fill for lighting
    bg_light.inputs["Color"].default_value = lin(SKY)
    bg_light.inputs["Strength"].default_value = sky_light
    bg_seen = nt.nodes.new("ShaderNodeBackground")  # full-strength sky where the camera sees it
    bg_seen.inputs["Color"].default_value = lin(SKY)
    path = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(path.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(bg_light.outputs["Background"], mix.inputs[1])
    nt.links.new(bg_seen.outputs["Background"], mix.inputs[2])
    out = next(n for n in nt.nodes if n.type == "OUTPUT_WORLD")
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = sun_energy
    sun.data.angle = math.radians(12)
    sun.rotation_euler = (math.radians(40), math.radians(-18), math.radians(-35))
    sc.collection.objects.link(sun)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.type = "ORTHO"
    cam.data.clip_end = 500
    sc.collection.objects.link(cam)
    sc.camera = cam
    ground = bpy.data.objects.new("ground", bpy.data.meshes.new("ground"))
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=48, radius=1.0)
    bm.to_mesh(ground.data)
    bm.free()
    ground.data.materials.append(flat_material("ground", GROUND))
    sc.collection.objects.link(ground)
    return sc, cam, ground


def add_text(cam, body, size, mat):
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body = body
    cu.size = size
    obj = bpy.data.objects.new("txt", cu)
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = cam
    camera_only(obj)
    return obj


def hierarchy(root):
    return [root] + list(root.children_recursive)


def world_corners(objs):
    pts = []
    for o in objs:
        if o.type == "MESH":
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    return pts


def tris(objs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs if o.type == "MESH")


def frame(cam, pts, w_px, h_px):
    """Aim the ortho camera and fit the points into the area above the label band."""
    p, y = math.radians(PITCH), math.radians(YAW)
    fwd = Vector((math.sin(y) * math.cos(p), math.cos(y) * math.cos(p), -math.sin(p)))
    cam.rotation_euler = fwd.to_track_quat("-Z", "Y").to_euler()
    rot = cam.rotation_euler.to_matrix()
    local = [rot.transposed() @ q for q in pts]
    xs, ys, zs = [q.x for q in local], [q.y for q in local], [q.z for q in local]
    aspect = w_px / h_px
    usable = 1.0 - LABEL_BAND - 0.06
    view_h = max((max(ys) - min(ys)) / usable, (max(xs) - min(xs)) / 0.88 / aspect)
    cam.data.ortho_scale = view_h * aspect if aspect >= 1.0 else view_h
    cx = (max(xs) + min(xs)) / 2
    cy = (max(ys) + min(ys)) / 2 - (LABEL_BAND - 0.06) / 2 * view_h
    cam.location = rot @ Vector((cx, cy, max(zs) + 40.0))
    return view_h * aspect, view_h


def place_labels(labels, view_w, view_h, h_px, lines):
    px = view_h / h_px  # world units per output pixel
    pad = 7 * px
    sizes = (17 * px, 13 * px)
    y = -view_h / 2 + pad + sizes[1] * 0.3
    for txt, body, size in zip(labels, reversed(lines), reversed(sizes)):
        txt.data.body = body
        txt.data.size = size
        txt.location = (-view_w / 2 + pad, y, -1.0)
        y += size * 1.25


def render_cell(sc, path, w_px, h_px, ss):
    sc.render.resolution_x = w_px * ss
    sc.render.resolution_y = h_px * ss
    sc.render.resolution_percentage = 100
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def load_pixels(path, ss):
    img = bpy.data.images.load(path)
    w, h = img.size
    buf = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    bpy.data.images.remove(img)
    arr = buf.reshape(h, w, 4)[::-1, :, :3]  # top-down rows
    return arr.reshape(h // ss, ss, w // ss, ss, 3).mean(axis=(1, 3))


def build_legend(sc, mat_ink, glb_kb, total_tris, n_assets):
    origin = Vector((1000, 0, 0))
    objs = []
    for i, hx in enumerate(SWATCHES):
        at = origin + Vector(((i % 5) * 0.2 - 0.4, -(i // 5) * 0.2 - 0.22, 0))
        bpy.ops.mesh.primitive_plane_add(size=0.17, location=at)
        sw = bpy.context.active_object
        sw.data.materials.append(flat_material("sw%d" % i, hx, emissive=True))
        camera_only(sw)
        objs.append(sw)
    lines = ["synes_kit.glb", "%d assets" % n_assets, "%s tris" % format(total_tris, ","), "%.0f KB" % glb_kb]
    texts = []
    for k, body in enumerate(lines):
        cu = bpy.data.curves.new("legend", "FONT")
        cu.body = body
        cu.size = 0.11 if k == 0 else 0.085
        t = bpy.data.objects.new("legend", cu)
        t.data.materials.append(mat_ink)
        sc.collection.objects.link(t)
        t.location = origin + Vector((-0.5, 0.47 - k * 0.12 - (0.03 if k else 0), 0))
        camera_only(t)
        texts.append(t)
    cu = bpy.data.curves.new("legend", "FONT")
    cu.body = "contract palette"
    cu.size = 0.07
    t = bpy.data.objects.new("legend", cu)
    t.data.materials.append(mat_ink)
    sc.collection.objects.link(t)
    t.location = origin + Vector((-0.5, -0.55, 0))
    camera_only(t)
    texts.append(t)
    return objs + texts, origin


def main():
    if not bpy.app.background:  # it resets to factory settings: never inside a live session/MCP
        raise SystemExit("render_preview.py is headless-only; run it with tools/blender/.venv/bin/python")
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", default=os.path.join(REPO, "public", "assets", "models", "synes_kit.glb"))
    ap.add_argument("--out", default=os.path.join(REPO, "docs", "art", "kit_preview.png"))
    ap.add_argument("--samples", type=int, default=16)
    ap.add_argument("--supersample", type=int, default=2)
    ap.add_argument("--sun", type=float, default=1.6)
    ap.add_argument("--sky-light", type=float, default=0.45)
    ap.add_argument("--only", default="", help="comma-separated asset names (quick look)")
    args = ap.parse_args(sys.argv[1:] if "--" not in sys.argv else sys.argv[sys.argv.index("--") + 1:])

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.glb)
    imported = list(bpy.context.scene.objects)
    sc, cam, ground = setup_scene(args.samples, args.sun, args.sky_light)
    only = set(filter(None, args.only.split(",")))
    mat_ink = flat_material("ink_label", INK, emissive=True)
    labels = [add_text(cam, "", 0.1, mat_ink), add_text(cam, "", 0.1, mat_ink)]

    names = [n for _, row in ROWS for n in row if n]
    total = tris(imported)
    glb_kb = os.path.getsize(args.glb) / 1024.0
    legend_objs, legend_origin = build_legend(sc, mat_ink, glb_kb, total, len(names))
    sheet = np.zeros((SHEET_H, SHEET_W, 3), dtype=np.float32)
    tmp = tempfile.mkdtemp(prefix="synes_preview_")
    ss = args.supersample
    try:
        y0 = 0
        for row_h, row in ROWS:
            edges = [round(i * SHEET_W / len(row)) for i in range(len(row) + 1)]
            for i, name in enumerate(row):
                w = edges[i + 1] - edges[i]
                if only and name not in only:
                    continue
                for o in imported + legend_objs:
                    o.hide_render = True
                if name is None:  # legend: top-down over the swatch board
                    for o in legend_objs:
                        o.hide_render = False
                    ground.hide_render = True
                    labels[0].hide_render = labels[1].hide_render = True
                    cam.rotation_euler = (0, 0, 0)
                    cam.location = legend_origin + Vector((0, 0, 10))
                    cam.data.ortho_scale = 1.25
                else:
                    root = bpy.data.objects[name]
                    objs = hierarchy(root)
                    for o in objs:
                        o.hide_render = False
                    pts = world_corners(objs)
                    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
                    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
                    ground.hide_render = False
                    labels[0].hide_render = labels[1].hide_render = False
                    span = max(hi.x - lo.x, hi.y - lo.y)
                    ground.scale = (span * 0.55 + 0.3,) * 3
                    ground.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0.0)
                    view_w, view_h = frame(cam, pts, w, row_h)
                    place_labels(labels, view_w, view_h, row_h,
                                 [name, "%.2f m tall  |  %s tris" % (hi.z - lo.z, format(tris(objs), ","))])
                path = os.path.join(tmp, "%02d_%s.png" % (len(os.listdir(tmp)), name or "legend"))
                render_cell(sc, path, w, row_h, ss)
                sheet[y0:y0 + row_h, edges[i]:edges[i + 1]] = load_pixels(path, ss)
                print("rendered", name or "legend", flush=True)
            y0 += row_h
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    gut = np.array(lin(GUTTER)[:3]) ** 0 * np.array([int(GUTTER[i:i + 2], 16) / 255 for i in (1, 3, 5)])
    y0 = 0
    for row_h, row in ROWS:
        sheet[max(y0 - 1, 0):y0 + 1, :] = gut
        edges = [round(i * SHEET_W / len(row)) for i in range(len(row) + 1)]
        for x in edges[1:-1]:
            sheet[y0:y0 + row_h, x - 1:x + 1] = gut
        y0 += row_h
    img = bpy.data.images.new("kit_preview", SHEET_W, SHEET_H, alpha=False)
    rgba = np.concatenate([sheet[::-1], np.ones((SHEET_H, SHEET_W, 1), np.float32)], axis=2)
    img.pixels.foreach_set(np.clip(rgba, 0, 1).ravel())
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    sc.render.image_settings.compression = 100  # smallest PNG for the docs folder
    img.save_render(args.out, scene=sc)
    print("wrote", args.out)


if __name__ == "__main__":
    main()
