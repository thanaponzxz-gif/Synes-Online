"""Read-only source audit in a separate Blender background process; no live-session access."""
import bpy
import hashlib
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
INBOX = ROOT / 'assets' / '_inbox'
SOURCE = INBOX / 'char_hero001_ninja_hy3d_raw_v01.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
out = {'blender': bpy.app.version_string, 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'meshes': [], 'images': []}
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    points = [obj.matrix_world @ v.co for v in obj.data.vertices]
    out['meshes'].append({'name': obj.name, 'vertices': len(points), 'polygons': len(obj.data.polygons),
                         'matrix': [list(row) for row in obj.matrix_world],
                         'bbox': [[min(p[a] for p in points), max(p[a] for p in points)] for a in range(3)],
                         'materials': [m.name for m in obj.data.materials]})
    # Cross sections expose the actual anatomy in the imported Blender coordinate system.
    out['meshes'][-1]['crossSections'] = []
    zlo, zhi = min(p.z for p in points), max(p.z for p in points)
    for f in (0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.72, 0.8, 0.9):
        ps = [p for p in points if abs(p.z - (zlo + f * (zhi-zlo))) < (zhi-zlo) * .012]
        out['meshes'][-1]['crossSections'].append({'fraction': f, 'bboxXY': [[min(p[a] for p in ps), max(p[a] for p in ps)] for a in range(2)] if ps else []})
for img in bpy.data.images:
    out['images'].append({'name': img.name, 'size': list(img.size), 'colorSpace': img.colorspace_settings.name})
out['exportProperties'] = [p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties]
(INBOX / 'char_hero001_ninja_source_inspect_v01.json').write_text(json.dumps(out, indent=2), encoding='utf-8')
print('SOURCE_AUDIT ' + json.dumps(out), flush=True)
