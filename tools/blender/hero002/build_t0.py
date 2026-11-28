"""DES-011 T0: private VRM conversion, existing humanoid weights and Synes poses.
Run only in an isolated Blender background process. Never overwrite inputs.
"""
import bpy,bmesh,json,math,hashlib,struct,zlib
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets'/'_inbox'
SOURCE=OUT/'char_hero002_vroid_raw_v01.vrm';REF=OUT/'char_hero001_ninja_p1_work_v01.blend'
BASE='char_hero002_vroid_t0_v01';EXPECTED='6ad4acb74c2ea91b46a2c6755243efd9da4e0857635b659acd55d0de5832330a'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==EXPECTED
def log(x):print('HERO002 '+json.dumps(x),flush=True)
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.render.fps=30;scene.frame_start=0;scene.frame_end=48
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
oldarm=next(o for o in scene.objects if o.type=='ARMATURE')
parts=[o for o in scene.objects if o.type=='MESH' and len(o.vertex_groups)>0 and len(o.data.materials)>0]
assert len(parts)==3
raw=SOURCE.read_bytes();j=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
human={x['bone']:j['nodes'][x['node']]['name'] for x in j['extensions']['VRM']['humanoid']['humanBones']}
mapping={'pelvis':'hips','spine_01':'spine','spine_02':'chest','chest':'upperChest','neck':'neck','head':'head'}
for side,word in [('l','left'),('r','right')]:
 for dst,src in [('clavicle','Shoulder'),('upperarm','UpperArm'),('forearm','LowerArm'),('hand','Hand'),('thumb','ThumbProximal'),('grip','MiddleProximal'),('thigh','UpperLeg'),('shin','LowerLeg'),('foot','Foot'),('toe','Toes')]:mapping[dst+'_'+side]=word+src
points=[o.matrix_world@v.co for o in parts for v in o.data.vertices]
zmin=min(p.z for p in points);zmax=max(p.z for p in points);scale=1.5/(zmax-zmin)
rot=Matrix.Rotation(math.pi,4,'Z');transform=Matrix.Scale(scale,4)@rot@Matrix.Translation((0,0,-zmin))
pos={n:transform@oldarm.matrix_world@oldarm.data.bones[human[h]].head_local for n,h in mapping.items()}
bone_map={human[h]:n for n,h in mapping.items()}
def mapped(name):
 if 'Hair' in name or 'FaceEye' in name:return 'head'
 if any(f in name for f in ['Index','Middle','Ring','Little']):return 'grip_l' if '_L_' in name else 'grip_r'
 if 'Thumb' in name:return 'thumb_l' if '_L_' in name else 'thumb_r'
 b=oldarm.data.bones.get(name)
 while b:
  if b.name in bone_map:return bone_map[b.name]
  b=b.parent
 return 'pelvis'
def write_png(path,a):
 h,w,c=a.shape
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 content=b''.join(b'\0'+r.tobytes() for r in a[::-1])
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6 if c==4 else 2,0,0,0))+chunk(b'IDAT',zlib.compress(content,9))+chunk(b'IEND',b''))
atlas=np.zeros((1024,1024,4),np.uint8)
for face,ob in [(True,next(o for o in parts if o.name=='Face')),(False,next(o for o in parts if o.name=='Body'))]:
 mat=ob.data.materials[0];im=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.colorspace_settings.name=='sRGB').copy();im.scale(508,508)
 px=np.empty(508*508*4,np.float32);im.pixels.foreach_get(px);px=px.reshape(508,508,4)
 red=(px[:,:,0]>1.6*px[:,:,1])&(px[:,:,0]>1.4*px[:,:,2])&(px[:,:,1]<.45)&(px[:,:,2]<.55)
 px[red,:3]=np.array([123,41,70])/255
 px[:,:,:3]=np.round(np.clip(px[:,:,:3],0,1)*63)/63
 tile=np.round(np.clip(px,0,1)*255).astype(np.uint8)
 x=0 if face else 512;atlas[512:1024,x:x+512]=np.pad(tile,((2,2),(2,2),(0,0)),mode='edge')
for x,col in [(16,(160,170,184)),(48,(220,225,230)),(80,(38,39,47)),(112,(130,115,80))]:atlas[16:32,x:x+16]=[*col,255]
basefile=OUT/'tex_hero002_basecolor_v01.png';write_png(basefile,atlas)
orm=np.zeros((512,512,3),np.uint8);orm[:]=[255,217,0];ormfile=OUT/'tex_hero002_orm_v01.png';write_png(ormfile,orm)
base=bpy.data.images.load(str(basefile),check_existing=False);base.colorspace_settings.name='sRGB'
packed=bpy.data.images.load(str(ormfile),check_existing=False);packed.colorspace_settings.name='Non-Color'
def material(name,mask):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.use_backface_culling=not mask
 n=m.node_tree.nodes;l=m.node_tree.links;b=next(n for n in n if n.type=='BSDF_PRINCIPLED')
 tex=n.new('ShaderNodeTexImage');tex.image=base;mr=n.new('ShaderNodeTexImage');mr.image=packed;sep=n.new('ShaderNodeSeparateColor')
 l.new(tex.outputs['Color'],b.inputs['Base Color']);l.new(mr.outputs['Color'],sep.inputs['Color']);l.new(sep.outputs['Green'],b.inputs['Roughness']);l.new(sep.outputs['Blue'],b.inputs['Metallic'])
 if mask:
  threshold=n.new('ShaderNodeMath');threshold.operation='GREATER_THAN';threshold.inputs[1].default_value=.5;l.new(tex.outputs['Alpha'],threshold.inputs[0]);l.new(threshold.outputs[0],b.inputs['Alpha'])
  m.surface_render_method='DITHERED'
 return m
mat=material('hero002_avatar_mask',True);weaponmat=material('hero002_weapon_opaque',False)
for ob in parts:
 if ob.data.shape_keys:ob.shape_key_clear()
 for mod in list(ob.modifiers):ob.modifiers.remove(mod)
 M=transform@ob.matrix_world
 for v in ob.data.vertices:v.co=M@v.co
 ob.parent=None;ob.matrix_world=Matrix.Identity(4)
 weights=[]
 for v in ob.data.vertices:
  w={}
  for g in v.groups:
   name=mapped(ob.vertex_groups[g.group].name);w[name]=w.get(name,0)+g.weight
  weights.append(w)
 ob.vertex_groups.clear();groups={n:ob.vertex_groups.new(name=n) for n in ['root',*mapping]}
 for v,w in zip(ob.data.vertices,weights):
  w=sorted(w.items(),key=lambda x:-x[1])[:4];s=sum(t for _,t in w)
  if not s:w=[('pelvis',1)];s=1
  for n,t in w:groups[n].add([v.index],t/s,'REPLACE')
 uv=ob.data.uv_layers.active
 for poly in ob.data.polygons:
  face=ob.name=='Face';x=0 if face else 512
  for li in poly.loop_indices:
   u,v=uv.data[li].uv;uv.data[li].uv=((x+2+min(1,max(0,u))*508)/1024,(514+min(1,max(0,v))*508)/1024)
 bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bm.to_mesh(ob.data);bm.free()
 dec=ob.modifiers.new('hero002_budget','DECIMATE');dec.ratio={'Face':.45,'Body':.27,'Hair':.20}[ob.name];dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
 tri=ob.modifiers.new('hero002_triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
 ob.data.materials.clear();ob.data.materials.append(mat)
 for f in ob.data.polygons:f.material_index=0;f.use_smooth=True
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=bpy.context.object;body.name='hero002_body'
body.data.validate(verbose=False,clean_customdata=True);body.data.update()
for v in body.data.vertices:
 w=sorted([(g.group,g.weight)for g in v.groups],key=lambda x:-x[1])[:4];total=sum(t for _,t in w)
 for g in list(v.groups):body.vertex_groups[g.group].remove([v.index])
 for index,value in w:body.vertex_groups[index].add([v.index],value/total,'REPLACE')
bottom=min(v.co.z for v in body.data.vertices);height=max(v.co.z for v in body.data.vertices)-bottom
adjust=Matrix.Scale(1.5/height,4)@Matrix.Translation((0,0,-bottom))
for v in body.data.vertices:v.co=adjust@v.co
pos={n:adjust@p for n,p in pos.items()};transform=adjust@transform;scale*=1.5/height
data=bpy.data.armatures.new('hero002_body27');arm=bpy.data.objects.new('hero002_rig',data);scene.collection.objects.link(arm)
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
rest={};parents={};nextbone={'pelvis':'spine_01','spine_01':'spine_02','spine_02':'chest','chest':'neck','neck':'head'}
for s in ['l','r']:
 for a,b in [('clavicle','upperarm'),('upperarm','forearm'),('forearm','hand'),('hand','grip'),('thigh','shin'),('shin','foot'),('foot','toe')]:nextbone[a+'_'+s]=b+'_'+s
def make(n,h,t,par):
 b=data.edit_bones.new(n);b.head=h;b.tail=t
 if par:b.parent=data.edit_bones[par]
 rest[n]=(Vector(h),Vector(t),par);parents[n]=par
make('root',(0,0,0),(0,0,.1),None)
for n in ['pelvis','spine_01','spine_02','chest','neck','head']:
 h=pos[n];t=pos[nextbone[n]] if n in nextbone else h+Vector((0,0,.15));make(n,h,t,'root' if n=='pelvis' else {'spine_01':'pelvis','spine_02':'spine_01','chest':'spine_02','neck':'chest','head':'neck'}[n])
for s,word in [('l','left'),('r','right')]:
 for stem,par in [('clavicle','chest'),('upperarm','clavicle_'+s),('forearm','upperarm_'+s),('hand','forearm_'+s),('thumb','hand_'+s),('grip','hand_'+s),('thigh','pelvis'),('shin','thigh_'+s),('foot','shin_'+s),('toe','foot_'+s)]:
  n=stem+'_'+s;h=pos[n]
  if n in nextbone:t=pos[nextbone[n]]
  elif stem in ('grip','thumb'):
   hn=word+('MiddleIntermediate' if stem=='grip' else 'ThumbIntermediate');t=transform@oldarm.matrix_world@oldarm.data.bones[human[hn]].head_local
  else:t=h+Vector((0,-.06,0))
  make(n,h,t,par)
bpy.ops.object.mode_set(mode='OBJECT');body.parent=arm;mod=body.modifiers.new('hero002_skin','ARMATURE');mod.object=arm
oldobjects=list(scene.objects)
# Read artist-produced Synes reference poses, without modifying that private file.
with bpy.data.libraries.load(str(REF),link=False) as (src,dst):dst.objects=src.objects;dst.actions=[n for n in src.actions if n in ['idle','run','attack_01','attack_03','skill_shadow_thread','dodge_f']]
refs=[o for o in dst.objects if o is not None]
for o in refs:scene.collection.objects.link(o)
ra=next(o for o in refs if o.type=='ARMATURE');rw=next(o for o in refs if o.name.startswith('weapon_katana'))
refactions={a.name:a for a in dst.actions};ra.animation_data_create()
for tr in ra.animation_data.nla_tracks:tr.mute=True
clips=[('idle',48),('run',10),('attack_01',11),('attack_03',18),('skill_shadow_thread',18),('dodge_f',9)]
samples={}
for name,ticks in clips:
 action=refactions[name];ra.animation_data.action=action;ra.animation_data.action_slot=action.slots[0]
 values=[]
 for k in range(ticks+1):
  scene.frame_set(k);bpy.context.view_layer.update()
  values.append({'q':{n:ra.pose.bones[n].matrix.to_quaternion().copy()for n in rest},'pelvis':ra.pose.bones['pelvis'].head-ra.data.bones['pelvis'].head_local})
 samples[name]=values
ra.animation_data.action=refactions['idle'];ra.animation_data.action_slot=refactions['idle'].slots[0];scene.frame_set(0);bpy.context.view_layer.update()
weapon_offset=(ra.matrix_world@ra.pose.bones['hand_r'].matrix).inverted()@rw.matrix_world
for o in refs:bpy.data.objects.remove(o,do_unlink=True)
for a in refactions.values():bpy.data.actions.remove(a)
for o in list(oldobjects):
 if o not in [body,arm] and o.name in bpy.data.objects:bpy.data.objects.remove(o,do_unlink=True)
# Original rigid test blade; two-sided flattened diamond cross-section.
verts=[]
for y,w in [(0,.018),(.52,.015),(.65,.001)]:verts.extend([(-w,y,0),(0,y,.003),(w,y,0),(0,y,-.003)])
faces=[]
for q in [0,4]:
 for k in range(4):faces.append((q+k,q+(k+1)%4,q+4+(k+1)%4,q+4+k))
faces.extend([(0,3,2,1),(8,9,10,11)])
for y in [-.14,-.01]:verts.extend([(-.012,y,-.012),(.012,y,-.012),(.012,y,.012),(-.012,y,.012)])
faces.extend([(12,13,14,15),(16,19,18,17),(12,16,17,13),(13,17,18,14),(14,18,19,15),(15,19,16,12)])
wm=bpy.data.meshes.new('hero002_test_blade');wm.from_pydata(verts,[],faces);wm.materials.append(weaponmat);weapon=bpy.data.objects.new('weapon_katana',wm);scene.collection.objects.link(weapon)
wu=wm.uv_layers.new(name='UVMap')
for f in wm.polygons:
 for li in f.loop_indices:wu.data[li].uv=((24 if f.index<10 else 88)/1024,24/1024)
empties=[]
def empty(n,parent,world=None,bone=None):
 o=bpy.data.objects.new(n,None);scene.collection.objects.link(o);o.parent=parent
 if bone:o.parent_type='BONE';o.parent_bone=bone
 bpy.context.view_layer.update()
 if world is not None:o.matrix_world=world
 empties.append(o);return o
sock=empty('socket_weapon_r',arm,arm.matrix_world@arm.data.bones['hand_r'].matrix_local,'hand_r');weapon.parent=sock;weapon.matrix_basis=weapon_offset
empty('socket_sheath',arm,Matrix.Translation(pos['chest']+Vector((0,.08,0))),'chest')
empty('socket_throw_l',arm,Matrix.Translation(pos['hand_l']),'hand_l');empty('socket_fx_chest',arm,Matrix.Translation(pos['chest']),'chest');empty('socket_fx_ground',arm,Matrix.Identity(4),'root')
empty('socket_blade_base',weapon);tip=empty('socket_blade_tip',weapon);tip.location=(0,.65,0)
def solve(side,target):
 u,l,f=['%s_%s'%(n,side)for n in ['thigh','shin','foot']];bpy.context.view_layer.update()
 hip=arm.pose.bones['pelvis'].matrix@data.bones['pelvis'].matrix_local.inverted()@rest[u][0]
 a=(rest[u][1]-rest[u][0]).length;b=(rest[l][1]-rest[l][0]).length;d=Vector(target)-hip;length=min(a+b-.0001,max(.1,d.length));d.normalize();ankle=hip+d*length
 pole=Vector((0,-1,0));pole-=d*pole.dot(d);pole.normalize();along=(a*a-b*b+length*length)/(2*length);knee=hip+d*along+pole*math.sqrt(max(0,a*a-along*along))
 for n,h,t in [(u,hip,knee),(l,knee,ankle)]:
  q=(rest[n][1]-rest[n][0]).normalized().rotation_difference((t-h).normalized())@data.bones[n].matrix_local.to_quaternion();arm.pose.bones[n].matrix=Matrix.Translation(h)@q.to_matrix().to_4x4();bpy.context.view_layer.update()
 arm.pose.bones[f].matrix=Matrix.Translation(ankle)@data.bones[f].matrix_local.to_quaternion().to_matrix().to_4x4();bpy.context.view_layer.update();arm.pose.bones['toe_'+side].matrix_basis.identity()
actions=[];arm.animation_data_create()
for name,ticks in clips:
 a=bpy.data.actions.new(name);a.use_fake_user=True;arm.animation_data.action=a;actions.append(a)
 for k in range(ticks+1):
  scene.frame_set(k)
  for pb in arm.pose.bones:pb.rotation_mode='QUATERNION';pb.matrix_basis.identity()
  s=samples[name][k]
  for n,(h,t,par) in rest.items():
   if n=='root':continue
   head=(h+s['pelvis']) if n=='pelvis' else arm.pose.bones[par].matrix@data.bones[par].matrix_local.inverted()@h
   arm.pose.bones[n].matrix=Matrix.Translation(head)@s['q'][n].to_matrix().to_4x4();bpy.context.view_layer.update()
  lift=.12*4*min(1,max(0,(k-3)/6))*(1-min(1,max(0,(k-3)/6))) if name=='attack_03' else 0
  for side,off in [('l',0),('r',math.pi)]:
   target=rest['foot_'+side][0].copy();target.z+=lift+.004
   if name=='run':
    phase=(2*math.pi*k/ticks+off)%(2*math.pi);target.y+=.16*math.cos(phase);target.z+=.10*max(0,math.sin(phase))
   if name=='skill_shadow_thread':target.y+=(-.07 if side=='l' else .07)*min(1,k/3)*min(1,(18-k)/9)
   if name=='dodge_f':target.y+=(-.07 if side=='l' else .05)*math.sin(math.pi*k/9)
   solve(side,target)
  for pb in arm.pose.bones:pb.keyframe_insert(data_path='location',frame=k,group=pb.name);pb.keyframe_insert(data_path='rotation_quaternion',frame=k,group=pb.name)
 for layer in a.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     for key in fc.keyframe_points:key.interpolation='LINEAR'
 log({'clip':name,'ticks':ticks})
arm.animation_data.action=None
for pb in arm.pose.bones:pb.matrix_basis.identity()
scene.frame_set(0);bpy.context.view_layer.update()
for im in [base,packed]:im.pack()
bpy.data.libraries.write(str(OUT/'char_hero002_t0_work_v01.blend'),{scene,*actions},fake_user=True,compress=True)
bpy.ops.object.select_all(action='DESELECT')
for o in [body,arm,weapon,*empties]:o.select_set(True)
bpy.context.view_layer.objects.active=arm
file=OUT/(BASE+'.glb')
bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='ACTIONS',export_frame_range=False,export_force_sampling=True,export_anim_slide_to_zero=True,export_def_bones=False,export_skins=True,export_all_influences=False,export_influence_nb=4,export_optimize_animation_size=True,export_optimize_animation_keep_anim_armature=True,export_image_format='AUTO',export_morph=False,export_leaf_bone=False,export_cameras=False,export_lights=False,export_extras=False)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==EXPECTED
record={'blender':bpy.app.version_string,'sourceSha256':EXPECTED,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'heightM':1.5,'sourceScale':scale,'bones':list(rest),'clips':[{'name':n,'ticks':t}for n,t in clips],'referenceFile':REF.name,'referenceSha256':hashlib.sha256(REF.read_bytes()).hexdigest(),'limits':['27 body bones, no cloth anchors or solver','MASK/double-sided avatar; opaque weapon','No VRM spring/blendshapes/MToon/outline','6 clips, not full20','Private review only; sample origin, license URL not independently verified']}
(OUT/(BASE+'.production.json')).write_text(json.dumps(record,indent=2),encoding='utf-8');log(record)
