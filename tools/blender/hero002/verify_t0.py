"""Reimport the delivered GLB and measure/render it, independent of the working rig."""
import bpy
import math
import json
import hashlib
import sys
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets'/'_inbox'
FILE=OUT/'char_hero002_vroid_t0_v01.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.fps=30; scene.render.fps_base=1
bpy.ops.import_scene.gltf(filepath=str(FILE))
arm=next(o for o in scene.objects if o.type=='ARMATURE')
body=next(o for o in scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers))
actions={}
for name in ['idle','run','attack_01','attack_03','skill_shadow_thread','dodge_f']:
    match=[a for a in bpy.data.actions if a.name==name or a.name.startswith(name+'_') or a.name.startswith(name+'.')]
    if not match:
        match=[a for a in bpy.data.actions if name in a.name]
    if len(match)!=1:
        raise RuntimeError('ambiguous imported clip '+name+': '+str([a.name for a in match]))
    actions[name]=match[0]
arm.animation_data_create()
for tr in arm.animation_data.nla_tracks:
    tr.mute=True
def pose(name,k):
    arm.animation_data.action=actions[name]
    if actions[name].slots:
        arm.animation_data.action_slot=actions[name].slots[0]
    scene.frame_set(math.floor(k),subframe=k-math.floor(k))
    bpy.context.view_layer.update()
def bone_state():
    return np.array([np.array(arm.matrix_world @ b.matrix).flatten() for b in arm.pose.bones])
def evaluated_points():
    dg=bpy.context.evaluated_depsgraph_get()
    ob=body.evaluated_get(dg)
    mesh=ob.to_mesh()
    co=np.array([tuple(ob.matrix_world @ v.co) for v in mesh.vertices])
    ob.to_mesh_clear()
    return co
arm.animation_data.action=None
for pb in arm.pose.bones:
    pb.matrix_basis.identity()
bpy.context.view_layer.update()
rest=evaluated_points()
rest_pelvis=(arm.matrix_world @ arm.pose.bones['pelvis'].matrix).translation.copy()
report={'sha256':hashlib.sha256(FILE.read_bytes()).hexdigest(),'importedActions':{n:a.name for n,a in actions.items()},
        'bindBBoxBlender':[[float(rest[:,i].min()),float(rest[:,i].max())] for i in range(3)],
        'bindHeightM':float(rest[:,2].max()-rest[:,2].min()), 'bones':len(arm.data.bones),'clips':{}}
for name,ticks in [('idle',48),('run',10),('attack_01',11),('attack_03',18),('skill_shadow_thread',18),('dodge_f',9)]:
    pose(name,0); first=bone_state(); pose(name,ticks); last=bone_state()
    item={'ticks':ticks,'actualFrameRange':list(actions[name].frame_range),'loopEndMaxMatrixDifference':float(np.max(np.abs(first-last))) if name in ('idle','run') else None}
    all_min=1e9; all_max=-1e9
    for k in [i/4 for i in range(ticks*4+1)]:
        pose(name,k); co=evaluated_points()
        assert np.all(np.isfinite(co)), (name,k,'nonfinite skin')
        all_min=min(all_min,float(co[:,2].min())); all_max=max(all_max,float(co[:,2].max()))
    item['minZAcrossSamples']=all_min; item['maxZAcrossSamples']=all_max
    assert all_min>=-.01,(name,'feet below floor')
    if name in ('attack_01','attack_03'):
        h=5 if name=='attack_01' else 9
        pose(name,h); a=bone_state(); pose(name,h+1); b=bone_state()
        item['holdMaxMatrixDifference']=float(np.max(np.abs(a-b)))
    if name=='attack_03':
        item['pelvisLiftM']={}
        for k in (3,6,9):
            pose(name,k)
            p=(arm.matrix_world @ arm.pose.bones['pelvis'].matrix).translation
            item['pelvisLiftM'][str(k)]=float(p.z-rest_pelvis.z)
    report['clips'][name]=item
assert abs(report['bindHeightM']-1.5)<1e-4
for name,item in report['clips'].items():
    assert abs(item['actualFrameRange'][0])<1e-4 and abs(item['actualFrameRange'][1]-item['ticks'])<1e-4, (name,'duration')
    if item.get('loopEndMaxMatrixDifference') is not None:
        assert item['loopEndMaxMatrixDifference']<1e-5, (name,'loop seam')
    if 'holdMaxMatrixDifference' in item:
        assert item['holdMaxMatrixDifference']<1e-5, (name,'impact hold')
assert abs(report['clips']['attack_03']['pelvisLiftM']['6']-.12)<1e-5
assert abs(report['clips']['attack_03']['pelvisLiftM']['3'])<1e-5
assert abs(report['clips']['attack_03']['pelvisLiftM']['9'])<1e-5
# Inspect actual atlas bytes as display values, then restore sRGB for rendering.
im=next(n.image for m in body.data.materials for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.colorspace_settings.name=='sRGB')
original_space=im.colorspace_settings.name;im.colorspace_settings.name='Non-Color'
px=np.empty(im.size[0]*im.size[1]*4,np.float32);im.pixels.foreach_get(px);rgb=np.round(px.reshape(-1,4)[:,:3]*255).astype(np.uint8)
report['reservedTexels']=int(np.sum(np.all(rgb==[255,51,85],axis=1)|np.all(rgb==[255,122,26],axis=1)));assert report['reservedTexels']==0
im.colorspace_settings.name=original_space
report['accepted']=True
(OUT/'char_hero002_vroid_t0_v01.posecheck.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('POSECHECK '+json.dumps(report),flush=True)
if '--metrics-only' in sys.argv:
    sys.exit(0)

# Static rendered evidence from the reimported runtime, not the unexported master.
scene.render.engine='CYCLES'
scene.cycles.device='CPU'; scene.cycles.samples=12
scene.cycles.use_denoising=True
scene.render.resolution_x=720; scene.render.resolution_y=840; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGB'
scene.render.film_transparent=False
scene.world=bpy.data.worlds.new('P1_review_world'); scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.16,.16,.16,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.65
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
def area(name,location,power,size):
    data=bpy.data.lights.new(name,'AREA'); data.energy=power;data.shape='DISK';data.size=size
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=location
    ob.rotation_euler=(Vector((0,0,.8))-ob.location).to_track_quat('-Z','Y').to_euler()
area('review_key',(-2.5,-3,4),240,4)
area('review_fill',(2.5,-1,2),110,3)
area('review_rim',(1,3,3),170,3)
camdata=bpy.data.cameras.new('review_camera'); cam=bpy.data.objects.new('review_camera',camdata)
scene.collection.objects.link(cam);scene.camera=cam;camdata.type='ORTHO';camdata.ortho_scale=1.95
def render(label,clip,k,direction):
    pose(clip,k)
    focus=Vector((0,0,.77));cam.location=focus+Vector(direction).normalized()*4
    cam.rotation_euler=(focus-cam.location).to_track_quat('-Z','Y').to_euler()
    # Fixed review framing (not a proposal to change the game's camera).
    camdata.ortho_scale=3.2
    scene.render.filepath=str(OUT/('concept_hero002_t0_v01_'+label+'.png'))
    bpy.ops.render.render(write_still=True)
    print('PREVIEW '+scene.render.filepath,flush=True)
render('front','idle',0,(0,-1,.04))
render('back','idle',0,(0,1,.04))
render('side','idle',0,(1,0,.04))
render('q','idle',0,(.7,-1,.12))
render('run','run',2,(.7,-1,.12))
render('attack01_hit','attack_01',5,(.7,-1,.12))
render('attack03_lift','attack_03',6,(.7,-1,.12))
render('attack03_hit','attack_03',9,(.7,-1,.12))
render('shadow','skill_shadow_thread',5,(.7,-1,.12))
render('dodge','dodge_f',3,(.7,-1,.12))
