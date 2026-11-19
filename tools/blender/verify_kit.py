"""Verify public/assets/models/synes_kit.glb against docs/art/ASSET_CONTRACT.md.

    tools/blender/.venv/bin/python tools/blender/verify_kit.py [--rebuild-check]

Two independent passes:
  1. raw glTF JSON: required node names (parsed from the contract itself), character
     hierarchy, root transforms, no textures/cameras/lights/Draco/meshopt, palette safety
     (reserved telegraph colours), facing (+Z) and per-asset triangle counts.
  2. fresh Blender scene: re-import the GLB, assert every node exists with the right parent,
     feet on the ground, centred origins, approximate contract sizes, animation pivots.
--rebuild-check also runs build_kit.py twice into temp files and compares SHA-256 with the
committed GLB (determinism). Exits with status 1 and a FAIL list if anything is wrong.
"""
import hashlib
import json
import os
import re
import struct
import subprocess
import sys
import tempfile

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
GLB = os.path.join(REPO, "public", "assets", "models", "synes_kit.glb")
CONTRACT = os.path.join(REPO, "docs", "art", "ASSET_CONTRACT.md")
TRI_BUDGET = 60000
# instanced scatter props get hard caps (requested after the first in-game test: ~70k tris on screen)
SCATTER_CAPS = {"tree_round": 350, "tree_round_b": 350, "tree_pine": 350, "bush": 150, "rock_a": 150,
                "rock_b": 150, "flower_patch": 150, "mushroom_glow": 150, "crystal_cluster": 150}
SIZE_LIMIT = 1.2 * 1024 * 1024
SIZE_TARGET = 700 * 1024
RESERVED = {"telegraph orange #FF7A1A": (0xFF, 0x7A, 0x1A), "telegraph red #FF3355": (0xFF, 0x33, 0x55)}
RESERVED_MIN_DIST = 60.0  # sRGB 0..255 euclidean distance a model colour must keep
FORBIDDEN_EXT = ("KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_meshopt_compression",
                 "KHR_texture_basisu", "KHR_texture_transform", "EXT_texture_webp", "KHR_lights_punctual")
# approximate sizes from the contract (Blender axes: Z up, Y = length, X = width), +-18 %
EXPECTED = {
    "hero": {"height": 1.5}, "puffcap": {"height": 1.0}, "thornling": {"height": 0.9},
    "prismback": {"height": 3.0, "length": 5.0},
    "crystal_pillar": {"height": 4.0, "diameter": 1.6},
    "crystal_gate": {"width": 6.0, "height": 3.0},
    "lumen_spring": {"diameter": 2.0},
}
TOLERANCE = 0.18

failures, warnings, log = [], [], []


def say(msg=""):
    log.append(msg)
    print(msg, flush=True)


def check(ok, msg):
    say(("  ok    " if ok else "  FAIL  ") + msg)
    if not ok:
        failures.append(msg)
    return ok


def warn(msg):
    say("  warn  " + msg)
    warnings.append(msg)


# ----------------------------------------------------------------------------- contract
def parse_contract(path):
    """Required node names + character parent -> children, read from the markdown tables."""
    text = open(path, encoding="utf-8").read()
    section = text.split("## node ที่ต้องมี", 1)[1]
    required, parts = [], {}
    for line in section.splitlines():
        if line.startswith("|") and "`" in line:
            cols = [c.strip() for c in line.strip("|").split("|")]
            parents = re.findall(r"`([a-z0-9_]+)`", cols[0])
            children = re.findall(r"`([a-z0-9_]+)`", cols[1]) if len(cols) > 1 else []
            if parents and children:
                parts[parents[0]] = children
            required += parents + children
        else:
            required += re.findall(r"`([a-z0-9_]+)`", line)
    seen = []
    for n in required:
        if n not in seen:
            seen.append(n)
    return seen, parts


# ----------------------------------------------------------------------------- glTF pass
def read_glb(path):
    data = open(path, "rb").read()
    magic, version, _ = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF" and version == 2, "not a glTF 2.0 binary"
    jlen, jtype = struct.unpack_from("<I4s", data, 12)
    assert jtype == b"JSON"
    return json.loads(data[20:20 + jlen].decode("utf-8")), len(data)


def lin_to_srgb255(c):
    c = max(0.0, min(1.0, c))
    s = c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return s * 255.0


def gltf_pass(required, parts):
    say("== glTF JSON pass: %s" % os.path.relpath(GLB, REPO))
    j, size = read_glb(GLB)
    check(size <= SIZE_LIMIT, "file size %.1f KB <= 1200 KB" % (size / 1024))
    if size > SIZE_TARGET:
        warn("file size %.1f KB is above the 700 KB target" % (size / 1024))
    else:
        say("  ok    file size within the 700 KB target")
    used = set(j.get("extensionsUsed", [])) | set(j.get("extensionsRequired", []))
    check(not any(e in used for e in FORBIDDEN_EXT), "no Draco/meshopt/texture/light extensions (%s)"
          % (sorted(used) or "none used"))
    for key in ("images", "textures", "samplers", "cameras", "animations", "skins"):
        check(not j.get(key), "no %s" % key)

    nodes = j["nodes"]
    by_name = {n.get("name"): i for i, n in enumerate(nodes)}
    for name in required:
        check(name in by_name, "node `%s` present" % name)
    parent_of = {}
    for i, n in enumerate(nodes):
        for c in n.get("children", []):
            parent_of[c] = i
    for parent, children in parts.items():
        for c in children:
            ok = c in by_name and parent in by_name and parent_of.get(by_name[c]) == by_name[parent]
            check(ok, "`%s` is a child of `%s`" % (c, parent))
        if parent in by_name:
            check("mesh" not in nodes[by_name[parent]], "`%s` is an empty parent node" % parent)
    roots = j["scenes"][j.get("scene", 0)]["nodes"]
    for r in roots:
        n = nodes[r]
        ident = (all(abs(v) < 1e-6 for v in n.get("translation", [0, 0, 0]))
                 and all(abs(a - b) < 1e-6 for a, b in zip(n.get("rotation", [0, 0, 0, 1]), [0, 0, 0, 1]))
                 and all(abs(v - 1) < 1e-6 for v in n.get("scale", [1, 1, 1])))
        check(ident, "root `%s` sits at the world origin with identity transform" % n.get("name"))
    extra = sorted(n.get("name") for n in nodes if n.get("name") not in required)
    say("  info  nodes beyond the contract: %s" % (", ".join(extra) or "none"))

    # palette safety
    for m in j.get("materials", []):
        pbr = m.get("pbrMetallicRoughness", {})
        cols = [("base", pbr.get("baseColorFactor", [1, 1, 1, 1])[:3])]
        if m.get("emissiveFactor"):
            cols.append(("emissive", m["emissiveFactor"]))
        textured = any(k in pbr for k in ("baseColorTexture", "metallicRoughnessTexture")) or any(
            k in m for k in ("normalTexture", "emissiveTexture", "occlusionTexture"))
        desc, nearest = [], (1e9, "")
        for kind, lin in cols:
            if kind == "emissive" and max(lin) < 1e-6:
                continue
            rgb = [lin_to_srgb255(c) for c in lin]
            if kind == "emissive":  # compare the hue of the glow, normalised to full brightness
                peak = max(rgb)
                rgb = [c * 255.0 / peak for c in rgb]
            desc.append("%s #%02X%02X%02X" % (kind, *[round(c) for c in rgb]))
            for label, ref in RESERVED.items():
                d = sum((a - b) ** 2 for a, b in zip(rgb, ref)) ** 0.5
                nearest = min(nearest, (d, label))
        check(not textured and nearest[0] >= RESERVED_MIN_DIST,
              "material `%s` (%s), untextured, %.0f away from %s"
              % (m.get("name"), ", ".join(desc), nearest[0], nearest[1].split()[1]))

    # triangles per mesh, then per asset
    acc = j["accessors"]
    mesh_tris = []
    for mesh in j["meshes"]:
        t = 0
        for prim in mesh["primitives"]:
            src = acc[prim["indices"]] if "indices" in prim else acc[prim["attributes"]["POSITION"]]
            t += src["count"] // 3
        mesh_tris.append(t)
    bad_prims = [m.get("name") for m in j["meshes"] for p in m["primitives"] if p.get("mode", 4) != 4]
    check(not bad_prims, "all primitives are triangle lists")
    uv = [m.get("name") for m in j["meshes"] for p in m["primitives"] if "TEXCOORD_0" in p["attributes"]]
    check(not uv, "no UV sets exported (no textures)")

    def subtree(i):
        out = [i]
        for c in nodes[i].get("children", []):
            out += subtree(c)
        return out

    per_asset = {}
    for r in roots:
        per_asset[nodes[r]["name"]] = sum(mesh_tris[nodes[k]["mesh"]] for k in subtree(r) if "mesh" in nodes[k])
    total = sum(per_asset.values())
    check(total <= TRI_BUDGET, "total triangles %d <= %d" % (total, TRI_BUDGET))
    for name, cap in SCATTER_CAPS.items():
        check(per_asset.get(name, 0) <= cap, "scatter prop `%s` %d tris <= cap %d" % (name, per_asset.get(name, 0), cap))

    # facing: characters' eyes (material `ink`) must sit on the +Z side in glTF space
    mats = [m.get("name") for m in j.get("materials", [])]
    for char in parts:
        zs = []
        for k in subtree(by_name[char]):
            node = nodes[k]
            if "mesh" not in node:
                continue
            t = node.get("translation", [0, 0, 0])
            for prim in j["meshes"][node["mesh"]]["primitives"]:
                if prim.get("material") is not None and mats[prim["material"]] == "ink":
                    a = acc[prim["attributes"]["POSITION"]]
                    zs.append((a["min"][2] + a["max"][2]) / 2 + t[2])
        check(bool(zs) and min(zs) > 0.05, "`%s` faces +Z (eyes at z=%s)" % (char, ", ".join("%.2f" % z for z in zs)))
    horn = nodes[by_name["prismback_horn"]].get("translation", [0, 0, 0])
    check(horn[2] > 1.5, "`prismback_horn` is at the front (+Z %.2f m)" % horn[2])
    return per_asset, size, j


# ----------------------------------------------------------------------------- Blender pass
def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == "MESH" for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def blender_pass(required, parts, gltf_tris):
    say("== Blender re-import pass (fresh factory scene, glTF importer)")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    objs = bpy.data.objects
    for name in required:
        check(objs.get(name) is not None, "object `%s` imported" % name)
    for parent, children in parts.items():
        p = objs.get(parent)
        check(p is not None and p.type == "EMPTY", "`%s` is an Empty" % parent)
        for c in children:
            o = objs.get(c)
            check(o is not None and o.parent == p and o.type == "MESH", "`%s` is a mesh under `%s`" % (c, parent))
    rows = []
    for name in gltf_tris:
        root = objs[name]
        tree = [root] + list(root.children_recursive)
        tris = sum(sum(len(f.vertices) - 2 for f in o.data.polygons) for o in tree if o.type == "MESH")
        lo, hi = world_bbox(tree)
        dims = hi - lo
        rows.append((name, tris, dims))
        check(tris == gltf_tris[name], "`%s` triangle count matches glTF (%d)" % (name, tris))
        check(-0.03 <= lo.z <= 0.06, "`%s` stands on the ground (min z %.3f)" % (name, lo.z))
        c = (lo + hi) / 2
        lim = max(0.35, 0.12 * max(dims.x, dims.y))
        check(abs(c.x) <= lim and abs(c.y) <= lim, "`%s` origin is centred (bbox centre %.2f, %.2f)"
              % (name, c.x, c.y))
        for key, want in EXPECTED.get(name, {}).items():
            got = {"height": dims.z, "length": dims.y, "width": dims.x, "diameter": max(dims.x, dims.y)}[key]
            check(abs(got - want) <= want * TOLERANCE, "`%s` %s %.2f m ~ %.1f m" % (name, key, got, want))
    # animation pivots (Blender space: Z up, front = -Y)
    head = objs["hero_head"].matrix_world.translation
    check(0.75 <= head.z <= 1.0 and abs(head.x) < 0.05, "`hero_head` pivot at the neck (z %.2f)" % head.z)
    sword = objs["hero_sword"]
    grip = sword.matrix_world.translation
    check(0.4 <= grip.z <= 0.7 and grip.x < -0.15, "`hero_sword` pivot at the grip in the right hand (%.2f, %.2f, %.2f)"
          % tuple(grip))
    far = max((sword.matrix_world @ v.co for v in sword.data.vertices), key=lambda p: (p - grip).length)
    check(far.z > grip.z + 0.6, "`hero_sword` blade points up from the grip (tip z %.2f)" % far.z)
    cap = objs["puffcap_cap"].matrix_world.translation
    check(0.45 <= cap.z <= 0.7, "`puffcap_cap` pivot where cap meets stem (z %.2f)" % cap.z)
    horn = objs["prismback_horn"].matrix_world.translation
    body_lo, body_hi = world_bbox([objs["prismback_body"]])
    check(horn.y < (body_lo.y + body_hi.y) / 2 - 1.0, "`prismback_horn` pivot on the forehead (y %.2f)" % horn.y)
    return rows


# ----------------------------------------------------------------------------- determinism
def rebuild_check():
    say("== determinism: build_kit.py twice into temp files")
    digests = []
    tmp = tempfile.mkdtemp(prefix="synes_verify_")
    for i in range(2):
        out = os.path.join(tmp, "kit_%d.glb" % i)
        env = dict(os.environ, SYNES_KIT_OUT=out)
        subprocess.run([sys.executable, os.path.join(HERE, "build_kit.py")], env=env, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        digests.append(hashlib.sha256(open(out, "rb").read()).hexdigest())
    committed = hashlib.sha256(open(GLB, "rb").read()).hexdigest()
    check(digests[0] == digests[1], "two builds are byte-identical (%s)" % digests[0][:16])
    check(digests[0] == committed, "committed GLB matches a fresh build (%s)" % committed[:16])


def main():
    if not bpy.app.background:  # it resets to factory settings: never inside a live session/MCP
        raise SystemExit("verify_kit.py is headless-only; run it with tools/blender/.venv/bin/python")
    required, parts = parse_contract(CONTRACT)
    say("contract: %d required nodes, %d characters" % (len(required), len(parts)))
    gltf_tris, size, _ = gltf_pass(required, parts)
    rows = blender_pass(required, parts, gltf_tris)
    if "--rebuild-check" in sys.argv:
        rebuild_check()
    say("")
    say("| asset | tris | W x L x H (m) |")
    say("|---|---:|---|")
    for name, tris, d in rows:
        say("| `%s` | %d | %.2f x %.2f x %.2f |" % (name, tris, d.x, d.y, d.z))
    total = sum(r[1] for r in rows)
    say("| **total** | **%d** | GLB %.1f KB |" % (total, size / 1024))
    say("")
    if failures:
        say("VERIFY FAILED: %d problem(s)" % len(failures))
        for f in failures:
            say("  - " + f)
        sys.exit(1)
    say("VERIFY PASSED (%d warnings)" % len(warnings))


if __name__ == "__main__":
    main()
