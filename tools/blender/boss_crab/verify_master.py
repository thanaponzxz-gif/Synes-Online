"""Read the private v02 production master after an interrupted production run."""
import bpy
import json
import math
import hashlib
from pathlib import Path
out=Path(__file__).resolve().parents[3]/'assets'/'_inbox'
file=out/'mon_boss_crab_work_v02.blend'
bpy.ops.wm.open_mainfile(filepath=str(file),load_ui=False)
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
names={'idle','walk','sweep','slam','charge_windup','charge','shard_cast','stunned','roar','down'}
actions=[a for a in bpy.data.actions if a.name in names]
assert len(arm.data.bones)==22 and len(meshes)==1 and len(actions)==10
for b in arm.data.bones:assert all(math.isfinite(x) for x in [*b.head_local,*b.tail_local])
for a in actions:
 for layer in a.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     for key in fc.keyframe_points:assert all(math.isfinite(x) for x in key.co)
report={'accepted':True,'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bones':22,'meshCount':1,'clips':sorted(a.name for a in actions),'scope':'master read, bone positions and action keys finite; GLB checked separately'}
(out/'mon_boss_crab_work_v02.inspect.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('CRAB_MASTER '+json.dumps(report))
