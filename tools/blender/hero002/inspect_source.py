"""Read the private owner's VRM in an isolated Blender process; never save raw."""
import bpy
import json
import hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[3];out=root/'assets'/'_inbox';file=out/'char_hero002_vroid_raw_v01.vrm'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(file))
report={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'meshes':[],'bones':[]}
for o in bpy.context.scene.objects:
 if o.type=='ARMATURE':report['bones']=[{'name':b.name,'head':list(o.matrix_world@b.head_local),'parent':b.parent.name if b.parent else None}for b in o.data.bones]
 if o.type=='MESH' and len(o.vertex_groups)>0 and len(o.data.materials)>0:
  p=[o.matrix_world@v.co for v in o.data.vertices];o.data.calc_loop_triangles()
  report['meshes'].append({'name':o.name,'triangles':len(o.data.loop_triangles),'vertices':len(p),'bounds':[[min(v[k]for v in p),max(v[k]for v in p)]for k in range(3)],'materials':[m.name for m in o.data.materials]})
(out/'char_hero002_source_inspect_v01.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('HERO002_SOURCE '+json.dumps({'sha256':report['sha256'],'meshes':report['meshes'],'bones':len(report['bones'])}))
