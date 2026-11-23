"""Synthetic stand-ins for the Quaternius pack (test only): tools/blender/.venv/bin/python _make_test_env_src.py OUT_DIR"""
import json, os, sys, bpy, bmesh

out = sys.argv[-1]
os.makedirs(out, exist_ok=True)


def mat(name, rgb, image=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    if image:
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = image
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
        m.node_tree.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    else:
        b.inputs["Base Color"].default_value = (*rgb, 1)
    return m


def prim(kind, loc, mats, scale=(1, 1, 1), **kw):
    getattr(bpy.ops.mesh, "primitive_%s_add" % kind)(location=loc, **kw)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    for m in mats:
        o.data.materials.append(m)
    return o


def export(name):
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, name + ".gltf"), export_format="GLTF_SEPARATE", export_yup=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)


bpy.ops.wm.read_factory_settings(use_empty=True)
# tree: brown trunk + ORANGE foliage (autumn leaves) -> must fail until color_map fixes it. Big (12 units) to test scaling.
prim("cylinder", (0, 0, 2), [mat("Trunk", (0.30, 0.17, 0.09))], (1, 1, 4), radius=0.4, depth=1, vertices=8)
prim("ico_sphere", (0, 0, 6), [mat("Leaves", (1.0, 0.25, 0.012))], (2.5, 2.5, 2.5), subdivisions=3)  # ~1280 tris
export("TestTree")
prim("ico_sphere", (0, 0, 0.5), [mat("Rock", (0.42, 0.40, 0.46))], (1, 0.8, 0.5), subdivisions=4)  # 5120 tris -> decimate to 400
export("TestRock")
# grass tuft with alpha-textured blades (kept as alpha-clip material)
img = bpy.data.images.new("blade", 8, 8, alpha=True)
px = []
for y in range(8):
    for x in range(8):
        px += [0.2, 0.55, 0.15, 1.0 if (x + y) % 2 == 0 else 0.0]
img.pixels = px
img.filepath_raw = os.path.join(out, "blade.png"); img.file_format = "PNG"; img.save()
for i in range(5):
    p = prim("plane", (0.1 * i, 0, 0.5), [mat("Blade", None, img)], (0.1, 0.5, 1), size=1)
    p.rotation_euler = (1.5708, 0, 0.6 * i)
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.transform_apply(rotation=True)
export("TestGrass")
prim("cylinder", (0, 0, 0.15), [mat("Stem", (0.2, 0.5, 0.15))], (1, 1, 1), radius=0.01, depth=0.3, vertices=6)
prim("uv_sphere", (0, 0, 0.32), [mat("Petal", (1.0, 0.62, 0.78))], (1, 1, 0.5), radius=0.06, segments=8, ring_count=4)
export("TestFlower")
# patch the grass glTF: alphaMode MASK (what Quaternius-style leaf cards use)
gp = os.path.join(out, "TestGrass.gltf")
j = json.load(open(gp))
for m in j["materials"]:
    m["alphaMode"], m["alphaCutoff"] = "MASK", 0.5
json.dump(j, open(gp, "w"))
json.dump({"src_root": out, "entries": [
    {"name": "env_test_tree", "src": "TestTree.gltf", "category": "tree", "target_height_m": 5.0},
    {"name": "env_test_rock", "src": "TestRock.gltf", "category": "rock", "target_height_m": 1.0},
    {"name": "env_test_grass", "src": "TestGrass.gltf", "category": "grass", "target_height_m": 0.4},
    {"name": "env_test_flower", "src": "TestFlower.gltf", "category": "flower", "target_height_m": 0.35}]},
    open(os.path.join(out, "manifest_fail.json"), "w"), indent=1)
j = json.load(open(os.path.join(out, "manifest_fail.json")))
j["entries"][0]["color_map"] = {"Leaves": "leaf", "Trunk": "bark"}
json.dump(j, open(os.path.join(out, "manifest_ok.json"), "w"), indent=1)
