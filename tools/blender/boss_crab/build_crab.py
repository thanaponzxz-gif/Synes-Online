"""Owner-approved DES-010 production, isolated Blender background process.

First run: --stage preview. Then --stage combat loads the exact same private rig
and adds the other eight actions. All art outputs are in the ignored inbox.
"""
import bpy
import bmesh
import numpy as np
import math
import json
import sys
import hashlib
import struct
import zlib
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets'/'_inbox'
SOURCE=OUT/'mon_boss_crab_raw_v01.glb'
MASTER=OUT/'mon_boss_crab_work_v01.blend'
SOURCE_SHA='05b6130b99ec0fc9a5e807696551671c3635af53b1767f1c09c8f220de72ce2d'
ARGS=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
STAGE=ARGS[ARGS.index('--stage')+1] if '--stage' in ARGS else 'preview'
VERSION=ARGS[ARGS.index('--version')+1] if '--version' in ARGS else 'v01'
assert VERSION in ('v01','v02')
INPUT_MASTER=MASTER
if VERSION=='v02':
 assert STAGE=='combat','v02 revises the full C1 rig'
 MASTER=OUT/'mon_boss_crab_work_v02.blend'
assert STAGE in ('preview','combat')
BASENAME='mon_boss_crab_preview_'+VERSION if STAGE=='preview' else 'mon_boss_crab_'+VERSION
def log(x): print('CRAB_PRODUCTION '+json.dumps(x),flush=True)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_SHA

CLIPS=[
 {'name':'idle','ticks':48,'loop':True,'markers':{},'phases':{'loop':[0,48]}},
 {'name':'walk','ticks':24,'loop':True,'markers':{'step':[0,12]},'phases':{'loop':[0,24]}},
 {'name':'sweep','ticks':51,'loop':False,'markers':{'impact':[30]},'poseHolds':[[30,31]],'phases':{'windup':[0,30],'recover':[30,51]}},
 {'name':'slam','ticks':60,'loop':False,'markers':{'impact':[30]},'poseHolds':[[30,31]],'phases':{'windup':[0,30],'recover':[30,60]}},
 {'name':'charge_windup','ticks':30,'loop':False,'markers':{'release':[30]},'phases':{'windup':[0,30]}},
 {'name':'charge','ticks':12,'loop':True,'markers':{},'phases':{'loop':[0,12]}},
 {'name':'shard_cast','ticks':45,'loop':False,'markers':{'castAccent':[9]},'phases':{'cast':[0,27],'recover':[27,45]}},
 {'name':'stunned','ticks':30,'loop':True,'markers':{},'phases':{'loop':[0,30]}},
 {'name':'roar','ticks':33,'loop':False,'markers':{},'phases':{'once':[0,33]}},
 {'name':'down','ticks':12,'loop':False,'markers':{},'holdLast':True,'phases':{'once':[0,12]}},
]
def png_rgb(path,pixels):
 h,w,_=pixels.shape
 def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 raw=b''.join(b'\0'+row.tobytes() for row in pixels[::-1])
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

if STAGE=='preview':
 bpy.ops.wm.read_factory_settings(use_empty=True)
 scene=bpy.context.scene;scene.render.fps=30;scene.render.fps_base=1
 bpy.ops.import_scene.gltf(filepath=str(SOURCE))
 body=next(o for o in scene.objects if o.type=='MESH');body.name='boss_crab_body'
 bpy.context.view_layer.objects.active=body
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 ps=[v.co.copy() for v in body.data.vertices]
 z0=min(p.z for p in ps);z1=max(p.z for p in ps)
 feet=[p for p in ps if p.z<z0+(z1-z0)*.08]
 center=Vector(((min(p.x for p in feet)+max(p.x for p in feet))/2,(min(p.y for p in feet)+max(p.y for p in feet))/2,z0))
 radius=max(math.hypot(p.x-center.x,p.y-center.y) for p in ps)
 for v in body.data.vertices: v.co=(v.co-center)*(1.78/radius)
 bm=bmesh.new();bm.from_mesh(body.data)
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5)
 bm.to_mesh(body.data);bm.free()
 dec=body.modifiers.new('crab_budget','DECIMATE');dec.ratio=.18;dec.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=dec.name)
 tri=body.modifiers.new('crab_triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
 zmin=min(v.co.z for v in body.data.vertices)
 for v in body.data.vertices: v.co.z-=zmin
 r=max(math.hypot(v.co.x,v.co.y) for v in body.data.vertices)
 for v in body.data.vertices: v.co*=1.78/r
 for p in body.data.polygons:p.use_smooth=True
 if body.data.has_custom_normals:body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))
 if hasattr(body.data,'set_sharp_from_angle'):body.data.set_sharp_from_angle(angle=math.radians(35))
 body.data.update();body.data.calc_loop_triangles()
 log({'stage':'mesh','triangles':len(body.data.loop_triangles),'vertices':len(body.data.vertices),'horizontalRadius':max(math.hypot(v.co.x,v.co.y) for v in body.data.vertices),'height':max(v.co.z for v in body.data.vertices)})
 old=body.data.materials[0]
 image=next(n.image for n in old.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.colorspace_settings.name=='sRGB').copy()
 mr=next(n.image for n in old.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'roughness' in n.image.name).copy()
 image.scale(1024,1024);rgb=np.empty(1024*1024*4,np.float32);image.pixels.foreach_get(rgb)
 rgb=np.clip(rgb.reshape(1024,1024,4)[...,:3],0,1)
 rgb=np.round(rgb*63)/63
 basepath=OUT/'tex_boss_crab_basecolor_v01.png';png_rgb(basepath,np.round(rgb*255).astype(np.uint8))
 mr.scale(512,512);px=np.empty(512*512*4,np.float32);mr.pixels.foreach_get(px);px=px.reshape(512,512,4)
 orm=np.ones((512,512,3),np.float32);orm[...,1]=np.clip(px[...,1],.60,.97);orm[...,2]=np.clip(px[...,2],0,.45)
 ormpath=OUT/'tex_boss_crab_orm_v01.png';png_rgb(ormpath,np.round(orm*255).astype(np.uint8))
 base=bpy.data.images.load(str(basepath),check_existing=False);base.colorspace_settings.name='sRGB'
 packed=bpy.data.images.load(str(ormpath),check_existing=False);packed.colorspace_settings.name='Non-Color'
 mat=bpy.data.materials.new('boss_crab_atlas');mat.use_nodes=True;mat.use_backface_culling=True
 nodes=mat.node_tree.nodes;links=mat.node_tree.links
 bsdf=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
 bc=nodes.new('ShaderNodeTexImage');bc.image=base;mrn=nodes.new('ShaderNodeTexImage');mrn.image=packed
 sep=nodes.new('ShaderNodeSeparateColor');sep.mode='RGB'
 links.new(bc.outputs['Color'],bsdf.inputs['Base Color']);links.new(mrn.outputs['Color'],sep.inputs['Color'])
 links.new(sep.outputs['Green'],bsdf.inputs['Roughness']);links.new(sep.outputs['Blue'],bsdf.inputs['Metallic'])
 group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
 group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat');group.nodes.new('NodeGroupInput')
 node=nodes.new('ShaderNodeGroup');node.node_tree=group;links.new(sep.outputs['Red'],node.inputs['Occlusion'])
 body.data.materials.clear();body.data.materials.append(mat)

 data=bpy.data.armatures.new('boss_crab_22');arm=bpy.data.objects.new('boss_crab_rig',data);scene.collection.objects.link(arm)
 body.select_set(False);arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
 rest={}
 def bone(name,h,t,parent=None):
  eb=data.edit_bones.new(name);eb.head=h;eb.tail=t;eb.use_deform=name!='root'
  if parent:eb.parent=data.edit_bones[parent]
  rest[name]=(tuple(h),tuple(t),parent)
 bone('root',(0,0,0),(0,0,.18))
 bone('body',(0,.15,.85),(0,.15,1.25),'root')
 bone('shell',(0,.25,1.25),(0,.30,2.65),'body')
 bone('head',(0,-.62,1.02),(0,-1.03,1.08),'body')
 for side,sgn in [('l',1),('r',-1)]:
  bone('arm_'+side,(sgn*.44,-.30,1.15),(sgn*.80,-.62,1.10),'body')
  bone('claw_'+side,(sgn*.80,-.62,1.10),(sgn*.90,-1.05,.67),'arm_'+side)
  bone('pincer_'+side,(sgn*.94,-1.08,.63),(sgn*.58,-1.40,.20),'claw_'+side)
  for loc,y,pts in [('f',-.03,[(.65,-.03,.80),(.93,-.08,.52),(1.05,-.28,.10),(1.03,-.45,.01)]),('b',.80,[(.62,.80,.70),(.90,1.04,.43),(.86,1.30,.10),(.78,1.40,.01)])]:
   chain='leg_'+loc+side
   for i,stem in enumerate(['upper','lower','foot']):
    h=pts[i];t=pts[i+1]
    bone(chain+'_'+stem,(sgn*h[0],h[1],h[2]),(sgn*t[0],t[1],t[2]),'body' if i==0 else chain+'_'+['upper','lower'][i-1])
 bpy.ops.object.mode_set(mode='OBJECT');assert len(data.bones)==22
 arm['crab_rest_spec']=json.dumps(rest)
 body.parent=arm;mod=body.modifiers.new('crab_skin','ARMATURE');mod.object=arm
 names=[n for n in rest if n!='root'];groups={n:body.vertex_groups.new(name=n) for n in names}
 def dist(p,name):
  a,b,_=rest[name];a=Vector(a);b=Vector(b);d=b-a;u=min(1,max(0,(p-a).dot(d)/d.length_squared));return(p-a-d*u).length
 def env(p,ns):
  values=sorted([(n,1/(dist(p,n)+.04)**4) for n in ns],key=lambda x:x[1],reverse=True)[:4]
  total=sum(w for _,w in values);return{n:w/total for n,w in values}
 W=np.zeros((len(body.data.vertices),len(names)),np.float64);ni={n:i for i,n in enumerate(names)}
 locked=np.zeros(len(body.data.vertices),bool)
 for v in body.data.vertices:
  x,y,z=v.co;side='l' if x>=0 else 'r';a=abs(x)
  if z>1.65 or(z>1.30 and y>-.45):w={'shell':1};locked[v.index]=True
  elif a<.48 and y<-.55 and z>.64:w={'head':1}
  elif y<-.55 and a>.34:w=env(v.co,['arm_'+side,'claw_'+side,'pincer_'+side])
  elif z<.95 and a>.50 and y>-.55:
   ns=['leg_'+loc+side+'_'+s for loc in ['f','b'] for s in ['upper','lower','foot']]
   w=env(v.co,ns)
  elif a>.60 and y<-.17 and z<1.40:w=env(v.co,['body','arm_'+side,'claw_'+side])
  else:w=env(v.co,['body','shell','head'])
  for n,t in w.items():W[v.index,ni[n]]=t
 # Surface smoothing keeps a fused generated source from tearing at analytic masks.
 edges=np.array([tuple(e.vertices) for e in body.data.edges],np.int32)
 u=np.r_[edges[:,0],edges[:,1]];v=np.r_[edges[:,1],edges[:,0]]
 co=np.array([tuple(p.co) for p in body.data.vertices]);ew=1/(np.linalg.norm(co[u]-co[v],axis=1)+.02)
 degree=np.bincount(u,weights=ew,minlength=len(co));original=W.copy()
 for iteration in range(4):
  mean=np.zeros_like(W);np.add.at(mean,u,W[v]*ew[:,None]);mean/=np.maximum(degree[:,None],1e-12)
  W=.5*W+.5*mean;W[locked]=original[locked]
 for i,row in enumerate(W):
  top=np.argsort(row)[-4:];total=row[top].sum()
  for k in top:
   if row[k]>1e-8:groups[names[k]].add([i],float(row[k]/total),'REPLACE')
 sockets=[('socket_fx_ground','root',(0,0,0)),('socket_fx_shell','shell',(0,.30,1.65)),('socket_fx_claw_l','claw_l',(.58,-1.40,.20)),('socket_fx_claw_r','claw_r',(-.58,-1.40,.20)),('socket_fx_head','head',(0,-1.03,1.08))]
 for name,parent,pos in sockets:
  ob=bpy.data.objects.new(name,None);scene.collection.objects.link(ob);ob.empty_display_size=.04;ob.parent=arm;ob.parent_type='BONE';ob.parent_bone=parent
  bpy.context.view_layer.update();ob.matrix_world=Matrix.Translation(Vector(pos))
 log({'stage':'rigged','bones':len(data.bones)})
else:
 assert INPUT_MASTER.exists(),'produce C0 first'
 bpy.ops.wm.open_mainfile(filepath=str(INPUT_MASTER),load_ui=False)
 scene=bpy.context.scene
 arm=next(o for o in scene.objects if o.type=='ARMATURE');body=next(o for o in scene.objects if o.type=='MESH')
 rest=json.loads(arm['crab_rest_spec'])

scene.render.fps=30;scene.render.fps_base=1;scene.frame_start=0;scene.frame_end=60
rest={n:(Vector(v[0]),Vector(v[1]),v[2]) for n,v in rest.items()}
rest_q={n:arm.data.bones[n].matrix_local.to_quaternion() for n in rest}
if VERSION=='v02':
 # Stronger approved poses expose v01's mixed chin/claw tip weights and its
 # hard shoulder/shell boundary. Clean those weights without changing topology.
 ns=[g.name for g in body.vertex_groups];ix={n:i for i,n in enumerate(ns)}
 W=np.zeros((len(body.data.vertices),len(ns)),np.float64)
 for v in body.data.vertices:
  for g in v.groups:W[v.index,g.group]=g.weight
  x,y,z=v.co
  if y<-.95 and abs(x)>.12 and z<.85:
   blend=min(1,max(0,(.85-z)/.30))*min(1,max(0,(-y-.95)/.20))
   target=np.zeros(len(ns));target[ix['pincer_'+('l' if x>0 else 'r')]]=1
   W[v.index]=W[v.index]*(1-blend)+target*blend
 co=np.array([tuple(v.co) for v in body.data.vertices]);band=(co[:,2]>1.20)&(co[:,2]<1.95)
 edges=np.array([tuple(e.vertices) for e in body.data.edges],np.int32);u=np.r_[edges[:,0],edges[:,1]];v=np.r_[edges[:,1],edges[:,0]]
 ew=1/(np.linalg.norm(co[u]-co[v],axis=1)+.02);degree=np.bincount(u,weights=ew,minlength=len(co))
 for _ in range(10):
  avg=np.zeros_like(W);np.add.at(avg,u,W[v]*ew[:,None]);avg/=np.maximum(degree[:,None],1e-12)
  W[band]=.65*W[band]+.35*avg[band]
 for group in body.vertex_groups:group.remove(list(range(len(co))))
 for i,row in enumerate(W):
  top=np.argsort(row)[-4:];total=row[top].sum()
  for k in top:
   if row[k]>1e-8:body.vertex_groups[k].add([i],float(row[k]/total),'REPLACE')
def delta(name,rx=0,ry=0,rz=0):
 q=Quaternion((0,0,1),math.radians(rz))@Quaternion((0,1,0),math.radians(ry))@Quaternion((1,0,0),math.radians(rx))
 arm.pose.bones[name].rotation_quaternion=rest_q[name].inverted()@q@rest_q[name]
def move(name,d):arm.pose.bones[name].location=arm.data.bones[name].matrix_local.to_3x3().inverted()@Vector(d)
def leg_pose(key,target):
 upper,lower,foot=[key+'_'+p for p in ['upper','lower','foot']]
 bpy.context.view_layer.update();pb=arm.pose.bones[upper]
 transform=pb.parent.matrix@pb.parent.bone.matrix_local.inverted();hip=transform@rest[upper][0]
 l1=(rest[upper][1]-rest[upper][0]).length;l2=(rest[lower][1]-rest[lower][0]).length
 d=Vector(target)-hip;length=min(l1+l2-.0001,max(.1,d.length));d.normalize();ankle=hip+d*length
 sign=1 if '_l' in key or key.endswith('l') else -1
 pole=Vector((sign,0,.1));pole-=d*pole.dot(d);pole.normalize()
 along=(l1*l1-l2*l2+length*length)/(2*length)
 knee=hip+d*along+pole*math.sqrt(max(0,l1*l1-along*along))
 for name,h,t in [(upper,hip,knee),(lower,knee,ankle)]:
  q=(rest[name][1]-rest[name][0]).normalized().rotation_difference((t-h).normalized())@rest_q[name]
  arm.pose.bones[name].matrix=Matrix.Translation(h)@q.to_matrix().to_4x4();bpy.context.view_layer.update()
 arm.pose.bones[foot].matrix=Matrix.Translation(ankle)@rest_q[foot].to_matrix().to_4x4();bpy.context.view_layer.update()

BASE={'z':0,'lean':0,'twist':0,'shell':0,'arm':0,'claw':0,'pinch':0,'sweep':0,'roll':0,'rightLift':0,'open':0}
def interp(t,keys):
 if t<=keys[0][0]:return {**BASE,**keys[0][1]}
 for (ta,a),(tb,b) in zip(keys,keys[1:]):
  if t<=tb:
   f=(t-ta)/(tb-ta);a={**BASE,**a};b={**BASE,**b};return{k:a[k]+(b[k]-a[k])*f for k in BASE}
 return{**BASE,**keys[-1][1]}
POSES={
 'sweep':[(0,{}),(24,{'twist':-10,'sweep':-20,'pinch':4}),(30,{'lean':3,'twist':10,'sweep':32,'pinch':-3}),(31,{'lean':3,'twist':10,'sweep':32,'pinch':-3}),(51,{})],
 'slam':[(0,{}),(24,{'z':.35,'arm':-8,'claw':-25,'pinch':6}),(30,{'z':-.10,'lean':3,'claw':12,'pinch':-3}),(31,{'z':-.10,'lean':3,'claw':12,'pinch':-3}),(60,{})],
 'charge_windup':[(0,{}),(30,{'z':-.08,'lean':0,'pinch':-4,'arm':-12,'claw':-8})],
 'shard_cast':[(0,{}),(9,{'z':.08,'shell':-2,'pinch':8}),(20,{'z':.12,'shell':-3,'arm':-8,'pinch':10}),(27,{'z':.12,'shell':-3,'arm':-8,'pinch':10}),(45,{})],
 'roar':[(0,{}),(12,{'z':.08,'shell':-4,'arm':-12,'pinch':12}),(20,{'z':.08,'shell':-4,'arm':-12,'pinch':12}),(33,{})],
 'down':[(0,{}),(12,{'z':-.22,'roll':3,'arm':-15,'claw':-15,'pinch':14})],
}
if VERSION=='v02':
 POSES.update({
  'sweep':[(0,{}),(10,{'twist':-14,'sweep':-78,'rightLift':-28,'pinch':3}),(24,{'twist':-14,'sweep':-78,'rightLift':-28,'pinch':3}),(30,{'lean':3,'twist':12,'sweep':38,'pinch':-3}),(31,{'lean':3,'twist':12,'sweep':38,'pinch':-3}),(51,{})],
  'slam':[(0,{}),(12,{'z':.32,'arm':-64,'claw':-14,'pinch':6,'open':8}),(24,{'z':.35,'arm':-64,'claw':-14,'pinch':6,'open':8}),(30,{'z':-.10,'lean':3,'claw':12,'pinch':-3}),(31,{'z':-.10,'lean':3,'claw':12,'pinch':-3}),(60,{})],
  'charge_windup':[(0,{}),(12,{'z':-.08,'arm':-20,'claw':-5,'pinch':-10,'open':-8}),(30,{'z':-.08,'arm':-20,'claw':-5,'pinch':-10,'open':-8})],
  'roar':[(0,{}),(8,{'z':.15,'shell':-5,'arm':-75,'claw':-20,'pinch':10,'open':18}),(24,{'z':.15,'shell':-5,'arm':-75,'claw':-20,'pinch':10,'open':18}),(33,{})],
 })
arm.animation_data_create()
existing={a.name:a for a in bpy.data.actions}
todo=CLIPS if VERSION=='v02' else CLIPS[:2] if STAGE=='preview' else CLIPS[2:]
for clip in todo:
 name=clip['name'];ticks=clip['ticks']
 if name in existing:bpy.data.actions.remove(existing[name])
 action=bpy.data.actions.new(name);action.use_fake_user=True;arm.animation_data.action=action
 for k in range(ticks+1):
  scene.frame_set(k)
  for pb in arm.pose.bones:pb.rotation_mode='QUATERNION';pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
  phase=2*math.pi*k/ticks
  if name=='idle':p={**BASE,'z':.010*math.sin(phase),'pinch':2*math.sin(phase)}
  elif name=='walk':p={**BASE,'z':-.025+.012*(1-math.cos(2*phase))}
  elif name=='charge':p={**BASE,'z':-.08+.008*(1-math.cos(2*phase)),'pinch':-4,'arm':-12,'claw':-8}
  elif name=='stunned':p={**BASE,'z':-.14,'roll':.6*math.sin(phase),'pinch':10}
  else:p=interp(k,POSES[name])
  if VERSION=='v02':
   if name=='idle':p={**BASE,'z':.006*math.sin(phase),'pinch':math.sin(phase)}
   elif name=='walk':p={**BASE,'z':-.02+.014*(1-math.cos(2*phase)),'arm':-12,'claw':-8,'roll':1.5*math.sin(phase)}
   elif name=='charge':p={**BASE,'z':-.08+.008*(1-math.cos(2*phase)),'arm':-20,'claw':-5,'pinch':-10,'open':-8}
  move('body',(0,0,p['z']));delta('body',rx=p['lean'],ry=p['roll'],rz=p['twist'])
  delta('shell',rx=p['shell']);delta('head',rx=-p['lean']*.35,rz=-p['twist']*.25)
  for side,sign in [('l',1),('r',-1)]:
   # Positive arm opening is symmetric; right arm carries the authored sweep.
   rx=p['arm']+(p['rightLift'] if side=='r' else 0)
   if VERSION=='v02' and name=='walk':rx+=5*math.sin(phase+(0 if side=='l' else math.pi))
   delta('arm_'+side,rx=rx,rz=(-p['arm']*.25*sign)+p['open']*sign+(p['sweep'] if side=='r' else 0))
   delta('claw_'+side,rx=p['claw'],rz=-p['sweep']*.15 if side=='r' else 0)
   delta('pincer_'+side,rz=sign*p['pinch'])
  for label,offset in [('fl',0),('br',0),('fr',math.pi),('bl',math.pi)]:
   key='leg_'+label;target=rest[key+'_lower'][1].copy()
   if name in ('walk','charge'):
    ph=(phase+offset)%(2*math.pi);stride=(.11 if VERSION=='v02' else .08) if name=='walk' else .015
    if ph<math.pi:target.y+=-stride+2*stride*(ph/math.pi)
    else:
     f=(ph-math.pi)/math.pi;target.y+=stride-2*stride*f;target.z+=((.10 if VERSION=='v02' else .065) if name=='walk' else .015)*math.sin(math.pi*f)
    if VERSION=='v02' and name=='walk':target.z+=.008
   elif name=='down':target.z+=.08*k/ticks
   leg_pose(key,target)
  # Fit the authored FK to this fused source: lift a claw/head only when its
  # actual weighted surface would go below the floor. Body/root remain authored.
  extra={'l':0,'r':0,'head':0}
  for correction in range(65):
   bpy.context.view_layer.update()
   ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
   low=min(mesh.vertices,key=lambda v:v.co.z);vi=low.index;z=low.co.z;ev.to_mesh_clear()
   if z>=-.004:break
   vg=body.data.vertices[vi].groups
   weights={body.vertex_groups[g.group].name:g.weight for g in vg}
   left=sum(w for n,w in weights.items() if n in ('arm_l','claw_l','pincer_l'))
   right=sum(w for n,w in weights.items() if n in ('arm_r','claw_r','pincer_r'))
   if weights.get('head',0)>max(left,right) and extra['head']<28:
    extra['head']+=1;delta('head',rx=-p['lean']*.35-extra['head'],rz=-p['twist']*.25)
   elif max(left,right)>.25:
    side='l' if left>=right else 'r'
    if extra[side]>=28:break
    extra[side]+=1;sign=1 if side=='l' else -1
    rx=p['arm']+(p['rightLift'] if side=='r' else 0)-extra[side]
    if VERSION=='v02' and name=='walk':rx+=5*math.sin(phase+(0 if side=='l' else math.pi))
    delta('arm_'+side,rx=rx,rz=(-p['arm']*.25*sign)+p['open']*sign+(p['sweep'] if side=='r' else 0))
   else:break
  for bn in rest:
   pb=arm.pose.bones[bn];pb.keyframe_insert(data_path='location',frame=k,group=bn);pb.keyframe_insert(data_path='rotation_quaternion',frame=k,group=bn)
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     for kp in fc.keyframe_points:kp.interpolation='LINEAR'
 log({'stage':'clip','name':name,'frameRange':list(action.frame_range)})
arm.animation_data.action=None
for pb in arm.pose.bones:pb.matrix_basis.identity()
scene.frame_set(0);bpy.context.view_layer.update()
actions=[a for a in bpy.data.actions if a.name in {c['name'] for c in CLIPS}]
# Keep the production master independent of later delivery PNG quantization.
for image in bpy.data.images:
 if image.source=='FILE' and image.has_data and not image.packed_file:image.pack()
bpy.data.libraries.write(str(MASTER),{scene,*actions},fake_user=True,compress=True)
bpy.ops.object.select_all(action='DESELECT')
for ob in scene.objects:
 if ob.type in ('MESH','ARMATURE','EMPTY'):ob.select_set(True)
bpy.context.view_layer.objects.active=arm
file=OUT/(BASENAME+'.glb')
bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,
 export_apply=False,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=False,
 export_force_sampling=True,export_frame_step=1,export_anim_slide_to_zero=True,export_def_bones=False,
 export_skins=True,export_all_influences=False,export_influence_nb=4,export_optimize_animation_size=True,
 export_optimize_animation_keep_anim_armature=True,export_image_format='AUTO',export_materials='EXPORT',
 export_morph=False,export_leaf_bone=False,export_lights=False,export_cameras=False,export_extras=False)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_SHA
co=[v.co for v in body.data.vertices]
record={'stage':STAGE,'blender':bpy.app.version_string,'sourceSha256':SOURCE_SHA,
 'sourceFile':SOURCE.name,'outputSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size,
 'bodyVertices':len(co),'bodyTriangles':sum(len(f.vertices)-2 for f in body.data.polygons),'bones':len(arm.data.bones),
 'clips':CLIPS[:2] if STAGE=='preview' else CLIPS,'restBones':{n:{'headBlender':list(h),'tailBlender':list(t),'parent':par}for n,(h,t,par) in rest.items()},
 'bindBoundsBlender':[[min(p[a]for p in co),max(p[a]for p in co)]for a in range(3)],
 'bindHorizontalRadiusM':max(math.hypot(p.x,p.y)for p in co),
 'approval':'REQ-010 section 5: DES-010 v1 approved for production 2026-11-28',
 'originStatus':'Owner supplied raw; source service/license unknown; no external service used in production',
 'tools':['Blender background process','NumPy bundled in Blender','Codex authoring; no new add-on'],
}
(OUT/(BASENAME+'.production.json')).write_text(json.dumps(record,indent=2),encoding='utf-8')
log({'stage':'exported','file':file.name,'bytes':file.stat().st_size,'clips':len(record['clips'])})
