"""Local skin quality diagnostics; reads only the delivered P1 GLB."""
import bpy
import json
import hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets'/'_inbox'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(OUT/'char_hero001_ninja_preview_v01.glb'))
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
body=next(o for o in bpy.context.scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers))
rest=[v.co.copy() for v in body.data.vertices]
for tr in arm.animation_data.nla_tracks: tr.mute=True
result={'sha256':hashlib.sha256((OUT/'char_hero001_ninja_preview_v01.glb').read_bytes()).hexdigest(),'clips':{}}
for name,k in [('run',2),('attack_03',6),('skill_shadow_thread',5)]:
    action=next(a for a in bpy.data.actions if a.name==name)
    arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
    bpy.context.scene.frame_set(k);bpy.context.view_layer.update()
    obj=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=obj.to_mesh()
    rows=[]
    for e in body.data.edges:
        a,b=e.vertices;before=(rest[a]-rest[b]).length;after=(mesh.vertices[a].co-mesh.vertices[b].co).length
        if before<.001 or after<.07: continue
        def describe(i):
            return {'rest':list(rest[i]),'weights':{body.vertex_groups[g.group].name:g.weight for g in body.data.vertices[i].groups}}
        rows.append({'ratio':after/before,'before':before,'after':after,'a':describe(a),'b':describe(b)})
    rows.sort(key=lambda r:r['ratio'],reverse=True)
    result['clips'][name]=rows[:10];obj.to_mesh_clear()
(OUT/'char_hero001_ninja_preview_v01.skin-audit.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('SKIN_AUDIT '+json.dumps({name:{'maxListedEdgeStretch':rows[0]['ratio'] if rows else 0} for name,rows in result['clips'].items()}),flush=True)
