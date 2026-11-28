"""Reimport and evaluate the actual delivered GLB; optional private CPU renders."""
import bpy
import numpy as np
import math
import json
import hashlib
import sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets'/'_inbox'
STAGE='combat' if '--combat' in sys.argv else 'preview'
BASE='mon_boss_crab_preview_v01' if STAGE=='preview' else 'mon_boss_crab_v01'
FILE=OUT/(BASE+'.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.render.fps=30;scene.render.fps_base=1
bpy.ops.import_scene.gltf(filepath=str(FILE))
arm=next(o for o in scene.objects if o.type=='ARMATURE')
body=next(o for o in scene.objects if o.type=='MESH')
manifest=json.loads((OUT/(BASE+'.manifest.json')).read_text(encoding='utf-8'))
actions={c['name']:next(a for a in bpy.data.actions if a.name==c['name']) for c in manifest['clips']}
arm.animation_data_create()
for tr in arm.animation_data.nla_tracks:tr.mute=True
def pose(name,k):
 arm.animation_data.action=actions[name];arm.animation_data.action_slot=actions[name].slots[0]
 scene.frame_set(math.floor(k),subframe=k-math.floor(k));bpy.context.view_layer.update()
def skin():
 o=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=o.to_mesh()
 a=np.array([tuple(o.matrix_world@v.co) for v in m.vertices]);o.to_mesh_clear();return a
def state():return np.array([np.array(arm.matrix_world@b.matrix).flatten() for b in arm.pose.bones])
arm.animation_data.action=None
for b in arm.pose.bones:b.matrix_basis.identity()
bpy.context.view_layer.update();bind=skin()
report={'stage':STAGE,'sha256':hashlib.sha256(FILE.read_bytes()).hexdigest(),
 'bindHeightM':float(np.ptp(bind[:,2])),'bindHorizontalRadiusM':float(np.max(np.linalg.norm(bind[:,:2],axis=1))),
 'bindMinZ':float(bind[:,2].min()),'bones':len(arm.data.bones),'clips':{}}
for c in manifest['clips']:
 n=c['name'];ticks=c['ticks'];pose(n,0);first=state();pose(n,ticks);last=state()
 stats={'ticks':ticks,'frameRange':list(actions[n].frame_range),'loopMatrixDifference':float(np.max(np.abs(first-last))) if c['loop'] else None,'poseHolds':[],'minZ':float('inf'),'maxHorizontalRadiusM':0,'maxBoneLengthRelativeError':0}
 # Include interpolated quarter ticks, as a browser mixer samples between ticks.
 for k in [i/4 for i in range(ticks*4+1)]:
  pose(n,k);p=skin();assert np.all(np.isfinite(p)),(n,k,'invalid skin')
  if float(p[:,2].min())<stats['minZ']:
   vi=int(np.argmin(p[:,2]));stats['lowestVertex']={'tick':k,'position':p[vi].tolist(),'weights':{body.vertex_groups[g.group].name:g.weight for g in body.data.vertices[vi].groups}}
  stats['minZ']=min(stats['minZ'],float(p[:,2].min()));stats['maxHorizontalRadiusM']=max(stats['maxHorizontalRadiusM'],float(np.max(np.linalg.norm(p[:,:2],axis=1))))
  for b in arm.pose.bones:
   err=abs((b.tail-b.head).length/b.bone.length-1)
   stats['maxBoneLengthRelativeError']=max(stats['maxBoneLengthRelativeError'],err)
 for a,b in c.get('poseHolds',[]):
  pose(n,a);s=state();pose(n,b);d=float(np.max(np.abs(s-state())));stats['poseHolds'].append({'range':[a,b],'matrixDifference':d});assert d<1e-4,(n,'pose hold')
 if c['loop']:assert stats['loopMatrixDifference']<1e-4,(n,'loop seam')
 assert abs(stats['frameRange'][0])<1e-4 and abs(stats['frameRange'][1]-ticks)<1e-4
 assert stats['maxBoneLengthRelativeError']<.01,(n,'bone stretch')
 report['clips'][n]=stats
report['envelopeFailures']=[n for n,s in report['clips'].items() if s['maxHorizontalRadiusM']>(1.80 if n in ('idle','charge','charge_windup') else 2.10)+1e-4]
report['groundFailures']=[n for n,s in report['clips'].items() if s['minZ']<-.01]
report['acceptedPoseMetrics']=not report['envelopeFailures'] and not report['groundFailures']
(OUT/(BASE+'.posecheck.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
print('CRAB_POSECHECK '+json.dumps(report),flush=True)
if '--metrics-only' in sys.argv:
 if not report['acceptedPoseMetrics']:sys.exit(2)
 sys.exit(0)
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.render.resolution_x=720;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB'
scene.world=bpy.data.worlds.new('crab_review_world');scene.world.use_nodes=True
world=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');world.inputs['Color'].default_value=(.10,.10,.10,1);world.inputs['Strength'].default_value=.65
scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
def light(name,pos,energy,size):
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
 ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,1.3))-ob.location).to_track_quat('-Z','Y').to_euler()
light('review_key',(-4,-5,7),700,5);light('review_fill',(4,-2,4),350,4);light('review_rim',(0,4,6),700,4)
cd=bpy.data.cameras.new('review_camera');cam=bpy.data.objects.new('review_camera',cd);scene.collection.objects.link(cam);scene.camera=cam;cd.type='ORTHO';cd.ortho_scale=4.4
prefix='concept_boss_crab_c0_v01_' if STAGE=='preview' else 'concept_boss_crab_c1_v01_'
def render(label,clip,k,d):
 pose(clip,k);focus=Vector((0,0,1.35));cam.location=focus+Vector(d).normalized()*7
 cam.rotation_euler=(focus-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/(prefix+label+'.png'));bpy.ops.render.render(write_still=True)
 print('CRAB_PREVIEW '+Path(scene.render.filepath).name,flush=True)
render('front','idle',0,(0,-1,.09));render('side','idle',0,(1,0,.12));render('back','idle',0,(0,1,.09));render('q','idle',0,(.8,-1,.30))
render('walk','walk',6,(.8,-1,.20))
if STAGE=='combat':
 for label,clip,k in [('sweep_hit','sweep',30),('slam_windup','slam',24),('slam_hit','slam',30),('charge','charge',3),('shard_cast','shard_cast',20),('stunned','stunned',0),('down','down',12)]:
  render(label,clip,k,(.8,-1,.20))
# Debug geometry is review-only and is created after the runtime export.
pose('idle',0)
for radius,name,color in [(1.90,'debug_collision',(0.3,.9,.9,1)),(2.32,'debug_player_center_contact',(.55,.55,.55,1))]:
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=.012;sp=curve.splines.new('POLY');sp.points.add(63)
 for i,point in enumerate(sp.points):
  angle=2*math.pi*i/64;point.co=(radius*math.cos(angle),radius*math.sin(angle),.025,1)
 sp.use_cyclic_u=True;ob=bpy.data.objects.new(name,curve);scene.collection.objects.link(ob)
 mat=bpy.data.materials.new(name);mat.diffuse_color=color;ob.data.materials.append(mat)
render('collision_debug','idle',0,(.8,-1,.75))
if not report['acceptedPoseMetrics']:sys.exit(2)
