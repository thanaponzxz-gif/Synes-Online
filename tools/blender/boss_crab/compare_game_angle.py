"""Private v01/v02 comparison at 844x390, fixed game-like perspective and scale.

This is a Blender pose/silhouette review, not a screenshot of the game or a
reproduction of its lighting, warning compositing, camera pull or fade system.
"""
import bpy
import math
import json
import hashlib
import numpy as np
import struct
import zlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
OUT=Path(__file__).resolve().parents[3]/'assets'/'_inbox'
DIR=OUT/'qa_boss_crab_pose_v02';DIR.mkdir(exist_ok=True)
SHOTS=[('idle',0),('walk',6),('sweep',17),('slam',17),('charge_windup',17),('roar',15),('sweep',30),('slam',30)]
def png(path,a):
 h,w,_=a.shape
 def c(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+c(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+c(b'IDAT',zlib.compress(b''.join(b'\0'+r.tobytes() for r in a),9))+c(b'IEND',b''))
def pixels(file):
 im=bpy.data.images.load(str(file),check_existing=False);im.colorspace_settings.name='Non-Color'
 w,h=im.size[:];a=np.empty(w*h*4,np.float32);im.pixels.foreach_get(a);a=np.clip(np.round(a.reshape(h,w,4)[::-1,:,:3]*255),0,255).astype(np.uint8);bpy.data.images.remove(im);return a
report={'scope':'Blender comparison, no in-game or mobile QA claim','viewport':[844,390],'verticalFovDeg':48,'pitchDeg':math.degrees(math.atan2(4.35,10.5)),'versions':{},'sha256':{}}
camera_position=None
for version in ['v01','v02']:
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.render.fps=30
 bpy.ops.import_scene.gltf(filepath=str(OUT/('mon_boss_crab_'+version+'.glb')))
 report['sha256'][version]=hashlib.sha256((OUT/('mon_boss_crab_'+version+'.glb')).read_bytes()).hexdigest()
 arm=next(o for o in scene.objects if o.type=='ARMATURE');body=next(o for o in scene.objects if o.type=='MESH')
 actions={a.name:a for a in bpy.data.actions};arm.animation_data_create()
 for tr in arm.animation_data.nla_tracks:tr.mute=True
 def pose(name,k):
  arm.animation_data.action=actions[name];arm.animation_data.action_slot=actions[name].slots[0];scene.frame_set(k);bpy.context.view_layer.update()
 def points():
  ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();p=[ev.matrix_world@v.co for v in m.vertices];ev.to_mesh_clear();return p
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=8;scene.cycles.use_denoising=True
 scene.render.resolution_x=844;scene.render.resolution_y=390;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.film_transparent=False
 scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
 world=bpy.data.worlds.new('review_world');world.use_nodes=True;scene.world=world
 bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.12,.14,.17,1);bg.inputs['Strength'].default_value=.75
 ld=bpy.data.lights.new('review_sun','SUN');ld.energy=1.6;lo=bpy.data.objects.new('review_sun',ld);scene.collection.objects.link(lo);lo.rotation_euler=(math.radians(25),math.radians(-20),math.radians(-25))
 cd=bpy.data.cameras.new('game_angle');cam=bpy.data.objects.new('game_angle',cd);scene.collection.objects.link(cam);scene.camera=cam
 cd.type='PERSP';cd.sensor_fit='VERTICAL';cd.sensor_height=32;cd.lens=32/(2*math.tan(math.radians(24)))
 target=Vector((0,-1,.15));cam.location=Vector((0,-11.5,4.5));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();bpy.context.view_layer.update()
 pose('idle',0)
 if camera_position is None:
  for _ in range(5):
   xs=[world_to_camera_view(scene,cam,p).x*844 for p in points()];width=max(xs)-min(xs)
   cam.location=target+(cam.location-target)*(width/110);bpy.context.view_layer.update()
  camera_position=cam.location.copy()
 cam.location=camera_position;bpy.context.view_layer.update();stats={}
 original=body.data.materials[0]
 black=bpy.data.materials.new('silhouette_black');black.use_nodes=True;nodes=black.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');em.inputs['Color'].default_value=(0,0,0,1);black.node_tree.links.new(em.outputs[0],out.inputs['Surface'])
 for name,k in SHOTS:
  pose(name,k);label=name+'_'+str(k);p=points();projected=[world_to_camera_view(scene,cam,v) for v in p]
  stats[label]={'widthPx':(max(v.x for v in projected)-min(v.x for v in projected))*844,'heightPx':(max(v.y for v in projected)-min(v.y for v in projected))*390,'clawHeadsPx':{}}
  for bn in ['claw_l','claw_r']:
   v=world_to_camera_view(scene,cam,arm.matrix_world@arm.pose.bones[bn].head);stats[label]['clawHeadsPx'][bn]=[v.x*844,(1-v.y)*390]
  file=DIR/(version+'_'+label+'.png');scene.render.filepath=str(file);bpy.ops.render.render(write_still=True)
  if label in ['idle_0','walk_6','sweep_17','slam_17','charge_windup_17','roar_15']:
   body.data.materials[0]=black;scene.render.filepath=str(DIR/(version+'_'+label+'_silhouette.png'));bpy.ops.render.render(write_still=True);body.data.materials[0]=original
 report['versions'][version]=stats
for name,k in SHOTS:
 label=name+'_'+str(k)
 for suffix in ['', '_silhouette']:
  a=DIR/('v01_'+label+suffix+'.png');b=DIR/('v02_'+label+suffix+'.png')
  if a.exists() and b.exists():png(DIR/('compare_'+label+suffix+'.png'),np.concatenate([pixels(a),pixels(b)],axis=1))
report['cameraBlenderM']=list(camera_position)
(DIR/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('CRAB_GAME_ANGLE_COMPARE complete',flush=True)
