"""Synes Online - build the third-party (CC0) Environment Asset Library GLB from a manifest.

Headless, from the repo root:
    tools/blender/.venv/bin/python tools/blender/build_env_library.py \
        [--manifest tools/blender/env_library_manifest.json] [--src-root DIR] \
        [--out public/assets/models/env_library_v01.glb] [--report PATH.json] [--skip-missing] [--check-determinism]

Per manifest entry: import (.gltf/.glb/.fbx/.obj) into a clean scene -> join all meshes (or the `src_node`
sub-tree) into ONE mesh -> bake world transforms -> uniform-scale to `target_height_m` -> origin at base
centre (min Z, centre XY) -> palette colours baked into vertex colours (COLOR_0) -> decimate only if over
`max_tris` -> one top-level node `env_*` at the world origin.  Every node uses ONE shared material
`env_vcol` (white Principled + COLOR_0); a source material that is an image texture (alpha-clip leaves) is
kept as an extra material `env_tex_<node>_<mat>` and reported ("texture" mode).

Colours: `color_map` {source material name -> palette key or "#RRGGBB"}; otherwise nearest palette colour
by hue/lightness.  A source colour in the reserved telegraph zone (orange #FF7A1A / red #FF3355) is NEVER
auto-snapped, so it fails the reserved-colour check until the manifest maps it explicitly.
Exit code 1 on: reserved colour anywhere, GLB > 1.5 MB, missing source (unless --skip-missing), import error.
Deterministic: no random/time state; same input + same Blender build -> same GLB bytes.
"""
import argparse
import colorsys
import hashlib
import json
import math
import os
import re
import sys

import bpy
import bmesh
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
MAX_GLB_BYTES = int(1.5 * 1024 * 1024)
COLLECTION = "env_library"
VCOL = "Col"
PALETTE = {
    "lumen": "#5CF2E6", "violet": "#A78BFA", "blossom": "#FF9EC7", "gold": "#FFC857", "leaf": "#7CCB5E",
    "leaf_dark": "#3F8F4A", "bark": "#8A5A3B", "stone": "#B9B4C7", "path": "#E8C99B", "white": "#F4F1FA",
    "sky": "#8EC9F2",
}
RESERVED = ("#FF7A1A", "#FF3355")  # attack-telegraph colours: never on a model
DEFAULT_MAX_TRIS = {"tree": 1500, "bush": 400, "rock": 400, "log": 400, "mushroom": 400, "grass": 120, "flower": 120}
CATEGORIES = tuple(DEFAULT_MAX_TRIS)
EXTS = (".gltf", ".glb", ".fbx", ".obj")


# ----------------------------------------------------------------------------- colour helpers
def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def rgb_hex(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v * 255))) for v in c)


def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def to_srgb(c):
    return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def is_reserved(rgb):
    """True if an sRGB (0..1) colour is near orange #FF7A1A / red #FF3355."""
    for r in RESERVED:  # RGB distance (0..255), same idea as build_kit.verify (>= 98 away)
        if math.dist([v * 255 for v in rgb], [v * 255 for v in hex_rgb(r)]) < 100:
            return True
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    h *= 360
    return (h <= 35 or h >= 345) and s > 0.45 and v > 0.6  # bark #8A5A3B (v .54) stays legal


def palette_distance(a, b):
    ha, la, sa = colorsys.rgb_to_hls(*a)
    hb, lb, sb = colorsys.rgb_to_hls(*b)
    dh = min(abs(ha - hb), 1 - abs(ha - hb)) * 2
    return (dh * min(sa, sb) * 1.5) ** 2 + ((la - lb) * 1.2) ** 2 + ((sa - sb) * 0.6) ** 2


def nearest_palette(rgb):
    return min(PALETTE, key=lambda k: (palette_distance(rgb, hex_rgb(PALETTE[k])), k))


def lerp(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def base_name(n):
    return re.sub(r"\.\d{3}$", "", n)


# ----------------------------------------------------------------------------- source materials
def principled(mat):
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if mat and mat.node_tree else None


def texture_image(mat):
    """Image node feeding Principled Base Color (directly), else None."""
    bsdf = principled(mat)
    if bsdf is None:
        return None
    for link in bsdf.inputs["Base Color"].links:
        if link.from_node.type == "TEX_IMAGE" and link.from_node.image:
            return link.from_node.image
    return None


def source_srgb(mat):
    bsdf = principled(mat)
    if bsdf is not None and not bsdf.inputs["Base Color"].links:
        c = tuple(bsdf.inputs["Base Color"].default_value)[:3]
    else:
        c = tuple(mat.diffuse_color)[:3] if mat else (0.7, 0.7, 0.7)
    return tuple(to_srgb(v) for v in c)


def image_reserved_fraction(img):
    """Fraction of (sampled, mostly opaque) texels in the reserved colour zone."""
    px = np.empty(len(img.pixels), dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, img.channels if img.channels in (3, 4) else 4)
    px = px[:: max(1, len(px) // 65536)]
    if px.shape[1] == 4:
        px = px[px[:, 3] > 0.5]
    if len(px) == 0:
        return 0.0
    rgb = px[:, :3]
    mx, mn = rgb.max(1), rgb.min(1)
    d = np.where(mx - mn == 0, 1, mx - mn)
    h = np.where(mx == rgb[:, 0], ((rgb[:, 1] - rgb[:, 2]) / d) % 6, np.where(mx == rgb[:, 1], (rgb[:, 2] - rgb[:, 0]) / d + 2,
                                                                              (rgb[:, 0] - rgb[:, 1]) / d + 4)) * 60
    s = np.where(mx == 0, 0, (mx - mn) / np.where(mx == 0, 1, mx))
    bad = ((h <= 35) | (h >= 345)) & (s > 0.45) & (mx > 0.6)
    for r in RESERVED:
        bad |= np.linalg.norm((rgb - np.array(hex_rgb(r))) * 255, axis=1) < 100
    return float(bad.mean())


# ----------------------------------------------------------------------------- scene / import
def clean_scene():
    for o in list(bpy.data.objects):
        if not o.get("env_keep"):  # finished library nodes survive between entries
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.orphans_purge(do_recursive=True)


def import_source(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".gltf", ".glb"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    else:
        raise ValueError("unsupported source type %s" % ext)


def select_meshes(src_node):
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and not o.get("env_keep")]
    if src_node:
        def under(o):
            while o:
                if o.name == src_node or base_name(o.name) == src_node:
                    return True
                o = o.parent
            return False
        meshes = [o for o in meshes if under(o)]
    return sorted(meshes, key=lambda o: o.name)


# ----------------------------------------------------------------------------- one entry
def build_entry(e, path):
    name, cat = e["name"], e["category"]
    clean_scene()
    import_source(path)
    meshes = select_meshes(e.get("src_node"))
    if not meshes:
        raise RuntimeError("no mesh found (src_node=%r)" % e.get("src_node"))
    cmap = {k: v for k, v in e.get("color_map", {}).items()}
    tint = e.get("tint")
    tint_c, tint_a = (None, 0.0)
    if tint:
        tint_c, tint_a = (hex_rgb(tint), 0.25) if isinstance(tint, str) else (hex_rgb(tint["color"]), tint.get("amount", 0.25))

    # slot table: (object, slot index) -> ("vcol", srgb, key) | ("tex", material)
    verts, faces, face_mat, face_smooth, uvs = [], [], [], [], []
    slot_info, tex_mats, used_maps = {}, {}, set()
    dg = bpy.context.evaluated_depsgraph_get()
    for ob in meshes:
        me = ob.evaluated_get(dg).to_mesh()
        me.calc_loop_triangles()
        mw = ob.matrix_world
        used = sorted({v for t in me.loop_triangles for v in t.vertices})
        remap = {v: len(verts) + i for i, v in enumerate(used)}
        verts += [tuple(mw @ me.vertices[v].co) for v in used]
        uv = me.uv_layers.active
        for t in me.loop_triangles:
            si = t.material_index
            mat = ob.material_slots[si].material if si < len(ob.material_slots) else None
            key = (id(mat), mat.name if mat else None)
            if key not in slot_info:
                slot_info[key] = classify(mat, cmap, tint_c, tint_a, name, tex_mats, used_maps)
            faces.append(tuple(remap[v] for v in t.vertices))
            face_mat.append(key)
            face_smooth.append(bool(me.polygons[t.polygon_index].use_smooth))
            uvs.append([tuple(uv.data[l].uv) if uv else (0.0, 0.0) for l in t.loops])
        ob.evaluated_get(dg).to_mesh_clear()
    unused = [k for k in cmap if k not in used_maps and base_name(k) not in used_maps]
    tris_before = len(faces)

    arr = np.array(verts, dtype=np.float64)
    lo, hi = arr.min(0), arr.max(0)
    height = hi[2] - lo[2]
    if height <= 1e-9:
        raise RuntimeError("zero height")
    sc = e["target_height_m"] / height
    arr = (arr - np.array([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]])) * sc

    has_tex = bool(tex_mats)
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in arr], [], faces)
    me.update()
    slots = []  # material slot order: shared vcol first (if used), then textures in first-use order
    if any(slot_info[k][0] == "vcol" for k in face_mat):
        slots.append("vcol")
    for k in face_mat:
        if slot_info[k][0] == "tex" and slot_info[k][1].name not in slots:
            slots.append(slot_info[k][1].name)
    for s in slots:
        me.materials.append(vcol_material() if s == "vcol" else tex_mats[s])
    for p, k, sm in zip(me.polygons, face_mat, face_smooth):
        p.material_index = slots.index("vcol" if slot_info[k][0] == "vcol" else slot_info[k][1].name)
        p.use_smooth = sm
    ca = me.color_attributes.new(VCOL, "FLOAT_COLOR", "CORNER")
    col = np.zeros((len(me.loops), 4), dtype=np.float32)
    col[:, 3] = 1.0
    for p, k in zip(me.polygons, face_mat):
        c = slot_info[k][1] if slot_info[k][0] == "vcol" else (1.0, 1.0, 1.0)
        col[p.loop_start:p.loop_start + 3, :3] = [to_linear(v) for v in c]
    ca.data.foreach_set("color", col.ravel())
    if has_tex:
        uvl = me.uv_layers.new(name="UVMap")
        uvl.data.foreach_set("uv", np.array(uvs, dtype=np.float32).ravel())
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for o in list(bpy.data.objects):  # drop the imported source objects, keep only the joined one
        if o is not ob and not o.get("env_keep"):
            bpy.data.objects.remove(o, do_unlink=True)
    ob["env_keep"] = True

    max_tris = e.get("max_tris", DEFAULT_MAX_TRIS[cat])
    tris_after = decimate(ob, max_tris)
    return ob, dict(tris_before=tris_before, tris_after=tris_after, max_tris=max_tris, scale=round(sc, 5),
                    unused_color_map=unused, has_tex=has_tex)


def classify(mat, cmap, tint_c, tint_a, nodename, tex_mats, used_maps):
    """Decide how one source material ends up: baked palette colour, or kept texture."""
    if mat is None:
        return ("vcol", hex_rgb(PALETTE["stone"]), "stone")
    img = texture_image(mat)
    if img is not None:
        tname = "env_tex_%s_%s" % (nodename, base_name(mat.name))  # .001 duplicates of one source material share a copy
        if tname not in tex_mats:
            tex_mats[tname] = mat.copy()
            tex_mats[tname].name = tname
        return ("tex", tex_mats[tname], "texture:" + img.name)
    src = source_srgb(mat)
    tgt = cmap.get(mat.name, cmap.get(base_name(mat.name)))
    if tgt is not None:
        used_maps.add(mat.name if mat.name in cmap else base_name(mat.name))
        key = tgt if tgt in PALETTE else "custom"
        rgb = hex_rgb(PALETTE.get(tgt, tgt))
    elif is_reserved(src):  # never auto-snap reserved-zone colours: force an explicit decision
        key, rgb = "RAW", src
    else:
        key = nearest_palette(src)
        rgb = hex_rgb(PALETTE[key])
    if tint_c is not None:
        rgb = lerp(rgb, tint_c, tint_a)
        key += "+tint"
    return ("vcol", rgb, key)


def vcol_material():
    m = bpy.data.materials.get("env_vcol")
    if m is None:
        m = bpy.data.materials.new("env_vcol")
        if m.node_tree is None:
            m.use_nodes = True
        b = principled(m)
        b.inputs["Base Color"].default_value = (1, 1, 1, 1)
        b.inputs["Roughness"].default_value = 0.9
        b.inputs["Metallic"].default_value = 0.0
    return m


def tri_count(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def decimate(ob, max_tris):
    n = tri_count(ob)
    ratio = 1.0
    if n > max_tris:  # importers split verts per face normal; weld by position first or Collapse tears holes
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bm.to_mesh(ob.data)
        bm.free()
    for _ in range(4):
        if n <= max_tris:
            break
        ratio = 0.99 * max_tris / n  # relative to the current mesh
        mod = ob.modifiers.new("dec", "DECIMATE")
        mod.decimate_type, mod.ratio = "COLLAPSE", min(ratio, 0.999)
        old = ob.data
        ob.data = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear()
        bpy.data.meshes.remove(old)
        ob.data.name = ob.name
        n = tri_count(ob)
    return n


# ----------------------------------------------------------------------------- verify / report
def final_stats(ob):
    me = ob.data
    ca = me.color_attributes.get(VCOL)
    buf = np.empty(len(me.loops) * 4, dtype=np.float32)
    ca.data.foreach_get("color", buf)
    buf = buf.reshape(-1, 4)
    vc = [i for i, m in enumerate(me.materials) if m.name == "env_vcol"]  # texture faces carry white: not a palette use
    keep = np.zeros(len(me.loops), dtype=bool)
    for p in me.polygons:
        if p.material_index in vc:
            keep[p.loop_start:p.loop_start + p.loop_total] = True
    cols = {tuple(to_srgb(float(v)) for v in c[:3]) for c in np.unique(np.round(buf[keep], 4), axis=0)}
    keys, bad = set(), []
    pal = {k: hex_rgb(v) for k, v in PALETTE.items()}
    for c in sorted(cols):
        k = next((k for k, v in pal.items() if max(abs(a - b) for a, b in zip(c, v)) < 0.01), None)
        keys.add(k or rgb_hex(c))
        if is_reserved(c):
            bad.append(rgb_hex(c))
    for m in me.materials:  # material base colours (white vcol, texture factors)
        b = principled(m)
        if b is not None and not b.inputs["Base Color"].links and is_reserved(tuple(to_srgb(v) for v in b.inputs["Base Color"].default_value[:3])):
            bad.append("material:" + m.name)
    xs = [v.co for v in me.vertices]
    w = max(v.x for v in xs) - min(v.x for v in xs)
    d = max(v.y for v in xs) - min(v.y for v in xs)
    h = max(v.z for v in xs) - min(v.z for v in xs)
    return sorted(keys), bad, (round(h, 3), round(w, 3), round(d, 3))


def export_glb(path, objs):
    coll = bpy.data.collections.get(COLLECTION) or bpy.data.collections.new(COLLECTION)
    if coll.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(coll)
    for o in objs:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    wanted = dict(
        filepath=path, export_format="GLB", check_existing=False, collection=COLLECTION, export_yup=True,
        export_apply=True, export_cameras=False, export_lights=False, export_extras=False,
        export_texcoords=True, export_normals=True, export_tangents=False, export_materials="EXPORT",
        export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_active_vertex_color_when_no_material=True,
        export_attributes=False, export_animations=False, export_skins=False, export_morph=False,
        export_draco_mesh_compression_enable=False, export_meshopt_compression_enable=False,
        export_image_format="AUTO", export_shared_accessors=False,
    )
    avail = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in avail})


def resolve_src(src, override, man_root):
    """Repo-relative path; with --src-root the manifest's src_root prefix is swapped for the override."""
    if override:
        rel = src[len(man_root):].lstrip("/") if man_root and src.startswith(man_root) else src
        return rel if os.path.isabs(rel) else os.path.join(override, rel)
    return src if os.path.isabs(src) else os.path.join(REPO, src)


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def main():
    if not bpy.app.background:
        raise SystemExit("build_env_library.py is headless-only (it clears the scene)")
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default=os.path.join(HERE, "env_library_manifest.json"))
    ap.add_argument("--src-root", default=None, help="override the manifest's src_root")
    ap.add_argument("--out", default=os.path.join(REPO, "public", "assets", "models", "env_library_v01.glb"))
    ap.add_argument("--report", default=None, help="report json path (default: <out>.report.json)")
    ap.add_argument("--skip-missing", action="store_true", help="skip entries whose source file is absent")
    ap.add_argument("--check-determinism", action="store_true", help="export twice and compare bytes")
    args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])

    man = json.load(open(args.manifest, encoding="utf-8"))
    entries = man["entries"]
    errors, rows, objs, seen = [], [], [], set()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for e in entries:
        n = e.get("name", "?")
        try:
            assert n.startswith("env_") and n not in seen, "name must start with env_ and be unique"
            assert e.get("category") in CATEGORIES, "category must be one of %s" % ", ".join(CATEGORIES)
            assert e.get("target_height_m", 0) > 0, "target_height_m required"
            seen.add(n)
            p = resolve_src(e["src"], args.src_root, man.get("src_root", ""))
            if not os.path.exists(p):
                if args.skip_missing:
                    print("SKIP  %-22s missing %s" % (n, e["src"]))
                    continue
                raise FileNotFoundError(e["src"])
            ob, info = build_entry(e, p)
            keys, bad, (h, w, d) = final_stats(ob)
            mode = "vertex-color" + ("+texture(alpha-clip)" if info["has_tex"] else "")
            if info["has_tex"]:  # reserved texels in kept textures
                for m in ob.data.materials:
                    img = texture_image(m)
                    if img is not None and image_reserved_fraction(img) > 0.02:
                        bad.append("texture:%s" % img.name)
            if bad:
                errors.append("%s: reserved orange/red colour(s) %s (add a color_map for the source material)" % (n, ", ".join(sorted(set(bad)))))
            if info["tris_after"] > info["max_tris"]:
                print("WARN  %s: %d tris > max %d after decimate" % (n, info["tris_after"], info["max_tris"]))
            for k in info["unused_color_map"]:
                print("WARN  %s: color_map key %r matched no material" % (n, k))
            rows.append(dict(name=n, src=e["src"], category=e["category"], tris_before=info["tris_before"],
                             tris_after=info["tris_after"], max_tris=info["max_tris"], height_m=h,
                             footprint_m=[w, d], material_mode=mode, palette_keys=keys, reserved=sorted(set(bad))))
            objs.append(ob)
        except Exception as ex:  # noqa: BLE001 - report every entry's failure, exit 1 at the end
            errors.append("%s: %s: %s" % (n, type(ex).__name__, ex))
    if not objs and not errors:
        errors.append("no entries built")

    glb_bytes, digest = 0, None
    if objs and not [r for r in rows if r["reserved"]]:
        export_glb(args.out, objs)
        glb_bytes, digest = os.path.getsize(args.out), sha(args.out)
        if glb_bytes > MAX_GLB_BYTES:
            errors.append("GLB too large: %d bytes > %d" % (glb_bytes, MAX_GLB_BYTES))
        if args.check_determinism:
            tmp = args.out + ".chk.glb"
            export_glb(tmp, objs)
            same = sha(tmp) == digest
            os.remove(tmp)
            print("determinism: %s" % ("OK (same bytes)" if same else "MISMATCH"))
            if not same:
                errors.append("export not deterministic")
    elif objs:
        print("GLB not written: reserved colours present")

    print("%-18s %-34s %6s %6s %6s %-13s %-20s %s" % ("name", "src", "tris0", "tris", "h(m)", "footprint", "material", "palette"))
    for r in rows:
        print("%-18s %-34s %6d %6d %6.2f %-13s %-20s %s" % (r["name"], os.path.basename(r["src"])[:34], r["tris_before"], r["tris_after"],
              r["height_m"], "%.2fx%.2f" % tuple(r["footprint_m"]), r["material_mode"][:20], ",".join(r["palette_keys"])))
    print("total tris %d | GLB %s bytes %s" % (sum(r["tris_after"] for r in rows), glb_bytes, ("sha256 " + digest[:16]) if digest else ""))
    report = dict(manifest=args.manifest, out=args.out, glb_bytes=glb_bytes, sha256=digest, entries=rows, errors=errors)
    rp = args.report or args.out + ".report.json"
    os.makedirs(os.path.dirname(os.path.abspath(rp)), exist_ok=True)
    json.dump(report, open(rp, "w", encoding="utf-8"), indent=2)
    for er in errors:
        print("ERROR", er)
    print("FAIL" if errors else "OK", "-> report", rp)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
