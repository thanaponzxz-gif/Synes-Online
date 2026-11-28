"""Codex P1 production. Run with Blender --background --factory-startup --python.

All character data stays in the ignored inbox. Uses an existing owner's GLB, not
the engineering fixture. Never connects to a running Blender or any service.
"""
import bpy
import bmesh
import math
import json
import hashlib
import struct
import zlib
import time
from pathlib import Path
import numpy as np
from mathutils import Vector, Quaternion, Matrix

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'assets' / '_inbox'
SOURCE = OUT / 'char_hero001_ninja_hy3d_raw_v01.glb'
GLB = OUT / 'char_hero001_ninja_preview_v01.glb'
MASTER = OUT / 'char_hero001_ninja_p1_work_v01.blend'
EXPECTED_SOURCE = '8f124ca0b523f98e52c910455c2736cc5400da242e2d84b190dc05b9b77bed17'
CLIPS = [
    {'name': 'idle', 'ticks': 48, 'loop': True},
    {'name': 'run', 'ticks': 10, 'loop': True, 'markers': {'step': [0, 5]}},
    {'name': 'attack_01', 'ticks': 11, 'loop': False, 'markers': {'hit': [5]}, 'poseHolds': [[5, 6]]},
    {'name': 'attack_03', 'ticks': 18, 'loop': False, 'markers': {'hit': [9]}, 'poseHolds': [[9, 10]],
     'yLift': {'fromTick': 3, 'peakTick': 6, 'toTick': 9, 'peakM': .12}},
    {'name': 'skill_shadow_thread', 'ticks': 18, 'loop': False, 'markers': {'dashStart': [3], 'dashEnd': [8]}},
    {'name': 'dodge_f', 'ticks': 9, 'loop': False},
]
start_time = time.perf_counter()
def log(s):
    print('SEYRIN_P1 ' + str(s), flush=True)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED_SOURCE
bpy.ops.wm.read_factory_settings(use_empty=True)
if hasattr(bpy.context.preferences.filepaths, 'save_preview_images'):
    bpy.context.preferences.filepaths.save_preview_images = False
scene = bpy.context.scene
scene.render.fps = 30
scene.render.fps_base = 1
scene.frame_start, scene.frame_end = 0, 48
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
body = next(o for o in scene.objects if o.type == 'MESH')
body.name = 'seyrin_body'
bpy.context.view_layer.objects.active = body
body.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
zs = [v.co.z for v in body.data.vertices]
z_min, z_max = min(zs), max(zs)
scale = 1.5 / (z_max - z_min)
foot_limit = z_min + .09 * (z_max-z_min)
foot_points = [v.co.copy() for v in body.data.vertices if v.co.z < foot_limit]
cx = (min(p.x for p in foot_points) + max(p.x for p in foot_points)) / 2
cy = (min(p.y for p in foot_points) + max(p.y for p in foot_points)) / 2
origin = Vector((cx, cy, z_min))
for v in body.data.vertices:
    v.co = (v.co - origin) * scale
body.data.update()
log({'stage': 'scaled', 'scale': scale, 'vertices': len(body.data.vertices)})

# Preserve the owner's UVs. Collapse is an initial real production reduction,
# not a claim of hand-retopologised edge loops.
bm = bmesh.new()
bm.from_mesh(body.data)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
bm.to_mesh(body.data); bm.free()
dec = body.modifiers.new('P1_budget_reduce', 'DECIMATE')
dec.decimate_type = 'COLLAPSE'
dec.ratio = .184
dec.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=dec.name)
tri = body.modifiers.new('P1_triangles', 'TRIANGULATE')
bpy.ops.object.modifier_apply(modifier=tri.name)
for p in body.data.polygons:
    p.use_smooth = True
if body.data.has_custom_normals:
    body.data.normals_split_custom_set([(0,0,0)] * len(body.data.loops))
z0 = min(v.co.z for v in body.data.vertices)
z1 = max(v.co.z for v in body.data.vertices)
post_scale = 1.5 / (z1-z0)
for v in body.data.vertices:
    v.co = (v.co - Vector((0,0,z0))) * post_scale
body.data.update()
body.data.calc_loop_triangles()
log({'stage': 'reduced', 'vertices': len(body.data.vertices), 'triangles': len(body.data.loop_triangles)})

# Export RGB PNGs directly so opaque alphas do not waste the file budget.
def png_rgb(path, pixels):
    h, w, _ = pixels.shape
    def chunk(t, data):
        return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t+data) & 0xffffffff)
    # Blender image pixels use a bottom-up row order.
    raw = b''.join(b'\0' + row.tobytes() for row in pixels[::-1])
    hdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', hdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

oldmat = body.data.materials[0]
base_node = next(n for n in oldmat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and n.image.colorspace_settings.name == 'sRGB')
mr_node = next(n for n in oldmat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'roughness' in n.image.name)
base = base_node.image.copy()
base.scale(1024, 1024)
rgba = np.empty(1024*1024*4, dtype=np.float32)
base.pixels.foreach_get(rgba)
rgb = np.clip(rgba.reshape(1024, 1024, 4)[..., :3], 0, 1)

# Build a UV coverage mask only for surfaces below the face. The eyes remain
# the owner's red. The cloth keeps its pattern while its red becomes dark wine.
uv = body.data.uv_layers.active.data
cloth_mask = np.zeros((1024, 1024), dtype=bool)
for poly in body.data.polygons:
    if max(body.data.vertices[i].co.z for i in poly.vertices) > 1.035:
        continue
    a = np.array([uv[k].uv[:] for k in poly.loop_indices]) * 1023
    x0, x1 = max(0, int(a[:, 0].min())), min(1023, int(a[:, 0].max())+1)
    y0, y1 = max(0, int(a[:, 1].min())), min(1023, int(a[:, 1].max())+1)
    if x1 < x0 or y1 < y0:
        continue
    xx, yy = np.meshgrid(np.arange(x0, x1+1), np.arange(y0, y1+1))
    den = (a[1,1]-a[2,1])*(a[0,0]-a[2,0])+(a[2,0]-a[1,0])*(a[0,1]-a[2,1])
    if abs(den) < 1e-8:
        continue
    wa = ((a[1,1]-a[2,1])*(xx-a[2,0])+(a[2,0]-a[1,0])*(yy-a[2,1])) / den
    wb = ((a[2,1]-a[0,1])*(xx-a[2,0])+(a[0,0]-a[2,0])*(yy-a[2,1])) / den
    cloth_mask[y0:y1+1, x0:x1+1] |= (wa >= -.01) & (wb >= -.01) & (wa+wb <= 1.01)
red = cloth_mask & (rgb[..., 0] > rgb[..., 1]*1.55) & (rgb[..., 0] > rgb[..., 2]*1.25) & (rgb[..., 0] > .12)
rgb[..., 1][red] = np.maximum(rgb[..., 1][red], rgb[..., 0][red]*.23)
rgb[..., 2][red] = np.maximum(rgb[..., 2][red], rgb[..., 0][red]*.43)
rgb[..., 0][red] *= .80
# Six-bit colour precision: retains owner texture while reducing noisy AI texels.
rgb = np.round(rgb*63) / 63
base_rgb = np.clip(np.round(rgb*255), 0, 255).astype(np.uint8)
base_path = OUT / 'tex_hero001_ninja_basecolor_v01.png'
png_rgb(base_path, base_rgb)
mr = mr_node.image.copy()
mr.scale(512, 512)
mr_pixels = np.empty(512*512*4, np.float32)
mr.pixels.foreach_get(mr_pixels)
mr_pixels = mr_pixels.reshape(512,512,4)
orm = np.ones((512,512,3), np.float32)
orm[...,1] = np.clip(mr_pixels[...,1], .48, .95)
orm[...,2] = np.clip(mr_pixels[...,2], 0, .8)
orm_path = OUT / 'tex_hero001_ninja_orm_v01.png'
png_rgb(orm_path, np.round(orm*255).astype(np.uint8))
base_img = bpy.data.images.load(str(base_path), check_existing=False)
base_img.name = 'seyrin_basecolor_1024'
base_img.colorspace_settings.name = 'sRGB'
orm_img = bpy.data.images.load(str(orm_path), check_existing=False)
orm_img.name = 'seyrin_orm_512'
orm_img.colorspace_settings.name = 'Non-Color'
mat = bpy.data.materials.new('seyrin_p1_atlas')
mat.use_nodes = True
mat.use_backface_culling = True
nodes, links = mat.node_tree.nodes, mat.node_tree.links
bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
bc = nodes.new('ShaderNodeTexImage'); bc.image = base_img
packed = nodes.new('ShaderNodeTexImage'); packed.image = orm_img
sep = nodes.new('ShaderNodeSeparateColor'); sep.mode = 'RGB'
links.new(bc.outputs['Color'], bsdf.inputs['Base Color'])
links.new(packed.outputs['Color'], sep.inputs['Color'])
links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
group = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
group.interface.new_socket(name='Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
group.nodes.new('NodeGroupInput')
ao = nodes.new('ShaderNodeGroup'); ao.node_tree = group
links.new(sep.outputs['Red'], ao.inputs['Occlusion'])
body.data.materials.clear(); body.data.materials.append(mat)
log({'stage': 'textures', 'baseBytes': base_path.stat().st_size, 'ormBytes': orm_path.stat().st_size, 'wineTexels': int(red.sum())})

# Anatomical custom rig, fitted to this specific source (Blender +Z up / -Y front).
# Empty anchors/sockets are not deform bones and are exported as nodes.
arm_data = bpy.data.armatures.new('seyrin_45_rig')
arm = bpy.data.objects.new('seyrin_armature', arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
body.select_set(False); arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
rest = {}
def bone(name, head, tail, parent=None):
    eb = arm_data.edit_bones.new(name)
    eb.head, eb.tail = head, tail
    if parent:
        eb.parent = arm_data.edit_bones[parent]
    eb.use_deform = name != 'root'
    rest[name] = (Vector(head), Vector(tail), parent)
bone('root', (0,0,0), (0,0,.10))
bone('pelvis', (0,.04,.68), (0,.04,.76), 'root')
bone('spine_01', (0,.04,.76), (0,.04,.83), 'pelvis')
bone('spine_02', (0,.04,.83), (0,.04,.89), 'spine_01')
bone('chest', (0,.04,.89), (0,.04,.985), 'spine_02')
bone('neck', (0,.04,.985), (0,.04,1.035), 'chest')
bone('head', (0,.04,1.035), (0,.04,1.49), 'neck')
for side, sign in [('l',1), ('r',-1)]:
    bone('clavicle_'+side, (.025*sign,.04,.905), (.185*sign,.02,.90), 'chest')
    bone('upperarm_'+side, (.185*sign,.02,.90), (.29*sign,-.015,.74), 'clavicle_'+side)
    bone('forearm_'+side, (.29*sign,-.015,.74), (.382*sign,-.04,.60), 'upperarm_'+side)
    bone('hand_'+side, (.382*sign,-.04,.60), (.430*sign,-.06,.525), 'forearm_'+side)
    bone('thumb_'+side, (.390*sign,-.067,.59), (.407*sign,-.095,.55), 'hand_'+side)
    bone('grip_'+side, (.416*sign,-.05,.555), (.433*sign,-.062,.52), 'hand_'+side)
    bone('thigh_'+side, (.12*sign,.04,.64), (.135*sign,.035,.30), 'pelvis')
    bone('shin_'+side, (.135*sign,.035,.30), (.135*sign,.005,.075), 'thigh_'+side)
    bone('foot_'+side, (.135*sign,.005,.075), (.135*sign,-.11,.047), 'shin_'+side)
    bone('toe_'+side, (.135*sign,-.11,.047), (.135*sign,-.17,.043), 'foot_'+side)

chain_specs = []
for side, sign in [('l',1), ('r',-1)]:
    # P1 retains the owner's flared rest silhouette; chains are reserved for P2
    # cleanup/solver. They are not falsely advertised as Q4-passed cloth.
    scarf = [(sign*.16,.17,.94), (sign*.27,.25,.82), (sign*.39,.34,.66), (sign*.48,.39,.48), (sign*.53,.34,.35)]
    sash = [(sign*.075,-.10,.72), (sign*.09,-.13,.63), (sign*.10,-.15,.54), (sign*.105,-.15,.46)]
    tassel = [(sign*.11,-.15,.70), (sign*.12,-.17,.61), (sign*.125,-.17,.535)]
    for stem, pts, parent in [('scarf',scarf,'chest'), ('sash',sash,'pelvis'), ('tassel',tassel,'pelvis')]:
        chain_name = stem+'_'+side
        chain_specs.append({'name':chain_name, 'anchor':'anchor_'+chain_name, 'pointsBlender':[list(p) for p in pts], 'p1Static':True})
        for i in range(len(pts)-1):
            bone(chain_name+'_0'+str(i+1), pts[i], pts[i+1], parent if i == 0 else chain_name+'_0'+str(i))
bpy.ops.object.mode_set(mode='OBJECT')
assert len(arm_data.bones) == 45
body.parent = arm
mod = body.modifiers.new('seyrin_skin', 'ARMATURE'); mod.object = arm

# Region-aware envelope weights, then top-four normalisation. Back-mounted
# weapons are attached to chest, never an arm or hair. No automatic heat solve.
groups = {n: body.vertex_groups.new(name=n) for n in rest if n != 'root'}
vertex_uv = {}
for poly in body.data.polygons:
    for li in poly.loop_indices:
        vertex_uv.setdefault(body.data.loops[li].vertex_index, tuple(uv[li].uv))
def texture_color(index):
    u, v = vertex_uv.get(index, (.5,.5))
    return rgb[min(1023,max(0,int(v*1023))), min(1023,max(0,int(u*1023)))]
def distance_segment(p, a, b):
    d = b-a
    u = min(1,max(0,(p-a).dot(d)/max(d.length_squared,1e-9)))
    return (p-(a+d*u)).length
def envelope(p, names, power=4):
    values = [(n, 1 / (distance_segment(p, rest[n][0], rest[n][1])+.018)**power) for n in names]
    return dict(sorted(values,key=lambda x:x[1],reverse=True)[:4])
def normalise(w):
    top=sorted(w.items(),key=lambda x:x[1],reverse=True)[:4]
    total=sum(t for _,t in top)
    return {n:t/total for n,t in top if t>1e-6}
counts = {}
for v in body.data.vertices:
    p = v.co; x,y,z = p; a = abs(x); side = 'l' if x>=0 else 'r'
    color = texture_color(v.index)
    hair = color[2] >= color[0]*.95 and color[1] >= color[0]*.75 and color[0] > .3
    arm_names=['clavicle_'+side,'upperarm_'+side,'forearm_'+side,'hand_'+side]
    arm_distance=min(distance_segment(p,rest[n][0],rest[n][1]) for n in arm_names)-.045
    torso_distance=min(distance_segment(p,rest[n][0],rest[n][1]) for n in ['pelvis','spine_01','spine_02','chest'])-.12
    leg_distance=min(distance_segment(p,rest[n][0],rest[n][1]) for n in ['thigh_'+side,'shin_'+side,'foot_'+side])-.065
    arm_share=min(1,max(0,.5+(min(torso_distance,leg_distance)-arm_distance)/.06))
    if a<.19 and z<.77: arm_share=0
    if z > 1.025:
        decorative_weapon = y>.13 and .16<a<.29 and z<1.14 and not hair
        w = {'chest' if decorative_weapon else 'head': 1}
    elif z > .975:
        if y>.12 and a>.15:
            w={'chest':1}
        else:
            t=min(1,max(0,(z-.975)/.05)); w={'head':t,'neck':1-t}
    elif y>.10 and a>(.16+.30*max(0,.9-z)) and z>.27:
        # Static P1 scarf, including the white pattern and both sides. Keep the
        # whole back cloth on chest so it cannot be torn by nearby arm/leg weights.
        w={'chest':1}
    elif .48<z<.94 and a>.14 and y<.15 and arm_share>.01:
        names=arm_names
        if z<.60:
            names += ['thumb_'+side,'grip_'+side]
        aw=normalise(envelope(p,names,5))
        bw=normalise(envelope(p,['pelvis','spine_01','spine_02','chest'],5))
        w={n:aw.get(n,0)*arm_share+bw.get(n,0)*(1-arm_share) for n in set(aw)|set(bw)}
        w=normalise(w)
    elif z<.58:
        if (y<-.085 and a<.115 and z>.40) or (y<-.11 and a<.20 and z>.46):
            w={'pelvis':1}
        else:
            w=envelope(p,['thigh_'+side,'shin_'+side,'foot_'+side,'toe_'+side],5)
    elif z<.76:
        # The belt/knot stays rigid on pelvis; short side armour shares thighs.
        if z>.67 or a<.12:
            w={'pelvis':1}
        else:
            w={'pelvis':.65, 'thigh_'+side:.35}
    else:
        w=envelope(p,['pelvis','spine_01','spine_02','chest'],5)
    w={n:t for n,t in w.items() if t>1e-6}
    total=sum(w.values())
    for n,t in w.items():
        groups[n].add([v.index], t/total, 'REPLACE')
        counts[n]=counts.get(n,0)+1
log({'stage':'weighted', 'weightedGroups':counts})

# Smooth only the skin weights along the welded source surface. This avoids
# discontinuous spatial masks pulling adjacent trouser/sleeve triangles apart.
names=list(groups)
wi={n:i for i,n in enumerate(names)}
weights=np.zeros((len(body.data.vertices),len(names)),np.float64)
for v in body.data.vertices:
    for g in v.groups:
        weights[v.index,wi[body.vertex_groups[g.group].name]]=g.weight
edge=np.array([tuple(e.vertices) for e in body.data.edges],dtype=np.int32)
co=np.array([tuple(v.co) for v in body.data.vertices])
u=np.concatenate((edge[:,0],edge[:,1])); v=np.concatenate((edge[:,1],edge[:,0]))
ew=1/(np.linalg.norm(co[u]-co[v],axis=1)+.01)
degree=np.bincount(u,weights=ew,minlength=len(co))
locked=(co[:,2]>1.035)
original_weights=weights.copy()
for iteration in range(5):
    mean=np.zeros_like(weights)
    np.add.at(mean,u,weights[v]*ew[:,None])
    mean/=np.maximum(degree[:,None],1e-9)
    weights=.45*weights+.55*mean
    weights[locked]=original_weights[locked]
for vg in groups.values():
    vg.remove(list(range(len(body.data.vertices))))
for idx,row in enumerate(weights):
    top=np.argsort(row)[-4:]
    total=float(row[top].sum())
    for k in top:
        if row[k]>1e-7: groups[names[k]].add([idx],float(row[k]/total),'REPLACE')
log({'stage':'weight-surface-cleanup','iterations':5})

points=[]
def empty(name, parent, world_position, bone_parent=None):
    ob=bpy.data.objects.new(name,None); scene.collection.objects.link(ob)
    ob.empty_display_size=.025
    ob.parent=parent
    if bone_parent:
        ob.parent_type='BONE'; ob.parent_bone=bone_parent
    bpy.context.view_layer.update()
    ob.matrix_world=Matrix.Translation(Vector(world_position))
    points.append(ob)
    return ob
for chain in chain_specs:
    empty(chain['anchor'],arm,chain['pointsBlender'][0], 'chest' if chain['name'].startswith('scarf') else 'pelvis')
socket_r=empty('socket_weapon_r',arm,(-.409,-.055,.565),'hand_r')
empty('socket_sheath',arm,(0,.18,.90),'chest')
empty('socket_throw_l',arm,(.418,-.07,.55),'hand_l')
empty('socket_fx_chest',arm,(0,-.10,.92),'chest')
empty('socket_fx_ground',arm,(0,0,0),'root')

# One original low-poly rigid katana. Owner's two back weapons remain decorative.
# Constant UVs sample neutral/gold/dark pixels of the same atlas, so no new map/material.
def pick_uv(target):
    d=np.sum((rgb-np.array(target))**2,axis=2)
    yy,xx=np.unravel_index(np.argmin(d),d.shape)
    return ((xx+.5)/1024,(yy+.5)/1024)
palette={'steel':pick_uv((.62,.64,.69)), 'edge':pick_uv((.85,.85,.89)), 'gold':pick_uv((.65,.46,.22)), 'grip':pick_uv((.075,.06,.075))}
wv=[]; wf=[]; wc=[]
def face(ids, kind):
    wf.append(tuple(ids)); wc.append(kind)
sections=[]
for u,width in [(0,.019),(.15,.020),(.35,.019),(.52,.016),(.65,.001)]:
    ids=[]
    curve=.035*(u/.65)**2
    for xx,zz in [(-width,0),(0,.004),(width,0),(0,-.004)]:
        ids.append(len(wv)); wv.append((xx+curve,u,zz))
    sections.append(ids)
for aa,bb in zip(sections,sections[1:]):
    for k in range(4): face((aa[k],bb[k],bb[(k+1)%4],aa[(k+1)%4]),'edge' if k in (0,3) else 'steel')
face(tuple(reversed(sections[0])),'steel'); face(sections[-1],'steel')
def cylinder(y0,y1,rx,rz,kind):
    rings=[]
    for yy in (y0,y1):
        ids=[]
        for k in range(8):
            angle=2*math.pi*k/8; ids.append(len(wv)); wv.append((math.cos(angle)*rx,yy,math.sin(angle)*rz))
        rings.append(ids)
    face(tuple(reversed(rings[0])),kind); face(rings[1],kind)
    for k in range(8): face((rings[0][k],rings[1][k],rings[1][(k+1)%8],rings[0][(k+1)%8]),kind)
cylinder(-.012,.012,.052,.034,'gold')
cylinder(-.145,-.014,.016,.014,'grip')
cylinder(-.157,-.142,.020,.018,'gold')
wm=bpy.data.meshes.new('seyrin_katana_mesh'); wm.from_pydata(wv,[],wf); wm.update()
weapon=bpy.data.objects.new('weapon_katana',wm); scene.collection.objects.link(weapon)
wm.materials.append(mat)
wu=wm.uv_layers.new(name='UVMap')
for poly,kind in zip(wm.polygons,wc):
    for li in poly.loop_indices: wu.data[li].uv=palette[kind]
weapon.parent=socket_r; weapon.location=(0,0,0)
weapon.rotation_mode='QUATERNION'
weapon.rotation_quaternion=Vector((0,1,0)).rotation_difference(Vector((-.25,-.70,-.67)).normalized())
for name,yvalue in [('socket_blade_base',0),('socket_blade_tip',.65)]:
    ob=bpy.data.objects.new(name,None); scene.collection.objects.link(ob); ob.parent=weapon; ob.location=(0,yvalue,0); points.append(ob)
log({'stage':'rig', 'bones':len(arm_data.bones), 'nodes':len(points), 'weaponFaces':len(wm.polygons)})

# Artist-authored FK upper body and analytically solved two-bone legs, baked
# every sim tick. Controls live only in this script; no controller bones exported.
body_bones=[n for n in rest if not n.startswith(('scarf_','sash_','tassel_'))]
rest_q={n:arm_data.bones[n].matrix_local.to_quaternion() for n in rest}
def world_delta(name, rx=0, ry=0, rz=0):
    q=Quaternion((0,0,1),math.radians(rz)) @ Quaternion((0,1,0),math.radians(ry)) @ Quaternion((1,0,0),math.radians(rx))
    arm.pose.bones[name].rotation_quaternion=rest_q[name].inverted() @ q @ rest_q[name]
def move_bone_world(name, delta):
    arm.pose.bones[name].location=arm_data.bones[name].matrix_local.to_3x3().inverted() @ Vector(delta)
def solve_leg(side, ankle, foot_pitch=0):
    thigh,shin,foot,toe=['%s_%s'%(stem,side) for stem in ('thigh','shin','foot','toe')]
    bpy.context.view_layer.update()
    pb=arm.pose.bones[thigh]
    parent_transform=pb.parent.matrix @ pb.parent.bone.matrix_local.inverted()
    hip=parent_transform @ rest[thigh][0]
    l1=(rest[thigh][1]-rest[thigh][0]).length
    l2=(rest[shin][1]-rest[shin][0]).length
    d=Vector(ankle)-hip; length=min(l1+l2-.0001,max(.12,d.length)); d.normalize()
    target=hip+d*length
    pole=Vector((0,-1,0)); pole-=d*pole.dot(d); pole.normalize()
    along=(l1*l1-l2*l2+length*length)/(2*length)
    knee=hip+d*along+pole*math.sqrt(max(0,l1*l1-along*along))
    for name,head,tail in [(thigh,hip,knee),(shin,knee,target)]:
        direction=(tail-head).normalized()
        original=(rest[name][1]-rest[name][0]).normalized()
        quat=original.rotation_difference(direction) @ rest_q[name]
        arm.pose.bones[name].matrix=Matrix.Translation(head) @ quat.to_matrix().to_4x4()
        bpy.context.view_layer.update()
    quat=Quaternion((1,0,0),math.radians(foot_pitch)) @ rest_q[foot]
    arm.pose.bones[foot].matrix=Matrix.Translation(target) @ quat.to_matrix().to_4x4()
    bpy.context.view_layer.update()
    world_delta(toe)

def interpolate_keys(t, keys):
    if t<=keys[0][0]: return keys[0][1]
    for (ta,a),(tb,b) in zip(keys,keys[1:]):
        if t<=tb:
            f=(t-ta)/(tb-ta)
            return {k:a.get(k,0)+(b.get(k,0)-a.get(k,0))*f for k in set(a)|set(b)}
    return keys[-1][1]
READY={'lean':2,'twist':0,'armx':-12,'army':-24,'armz':0,'elbow':-22,'leftx':-8,'drop':0}
A1=[(0,READY),(3,{'lean':4,'twist':-32,'armx':-105,'army':-18,'armz':-20,'elbow':-60,'leftx':-35,'drop':-.018}),
    (5,{'lean':12,'twist':36,'armx':-65,'army':-36,'armz':68,'elbow':-8,'leftx':-20,'drop':-.015}),
    (6,{'lean':12,'twist':36,'armx':-65,'army':-36,'armz':68,'elbow':-8,'leftx':-20,'drop':-.015}),(11,READY)]
A3=[(0,READY),(3,{'lean':8,'twist':-28,'armx':-135,'army':-12,'armz':-15,'elbow':-45,'leftx':-45}),
    (6,{'lean':2,'twist':-14,'armx':-155,'army':-4,'armz':-10,'elbow':-22,'leftx':-65}),
    (9,{'lean':18,'twist':42,'armx':-58,'army':-38,'armz':65,'elbow':-5,'leftx':-30}),
    (10,{'lean':18,'twist':42,'armx':-58,'army':-38,'armz':65,'elbow':-5,'leftx':-30}),(18,READY)]
SHADOW=[(0,READY),(2,{'lean':20,'twist':-15,'armx':28,'army':-24,'armz':-18,'elbow':-35,'leftx':-38,'drop':-.055}),
        (3,{'lean':30,'twist':-5,'armx':20,'army':-22,'armz':-15,'elbow':-22,'leftx':-50,'drop':-.055}),
        (8,{'lean':28,'twist':24,'armx':-35,'army':-35,'armz':35,'elbow':-8,'leftx':-35,'drop':-.055}),(18,READY)]
DODGE=[(0,READY),(2,{'lean':26,'twist':-8,'armx':-32,'army':-20,'armz':-10,'elbow':-50,'leftx':-42,'drop':-.07}),
       (6,{'lean':18,'twist':8,'armx':-20,'army':-24,'armz':8,'elbow':-30,'leftx':-25,'drop':-.035}),(9,READY)]
actions={}
for clip in CLIPS:
    name,ticks=clip['name'],clip['ticks']
    action=bpy.data.actions.new(name); action.use_fake_user=True
    arm.animation_data_create(); arm.animation_data.action=action
    for k in range(ticks+1):
        scene.frame_set(k)
        for pb in arm.pose.bones:
            pb.rotation_mode='QUATERNION'; pb.rotation_quaternion=(1,0,0,0); pb.location=(0,0,0); pb.scale=(1,1,1)
        phase=2*math.pi*k/ticks
        feet={'l':(.135,.005,.075),'r':(-.135,.005,.075)}
        if name=='idle':
            v=dict(READY); v['lean']=2+1.1*math.sin(phase)
            v['armx']=-12+1.5*math.sin(phase)
            v['drop']=.003*math.sin(phase)
        elif name=='run':
            v=dict(READY); v.update(lean=12,twist=4*math.sin(phase),drop=-.03+.012*(1-math.cos(2*phase)))
            for side,sgn,ph in [('l',1,phase),('r',-1,(phase+math.pi)%(2*math.pi))]:
                ph=ph%(2*math.pi)
                if ph<math.pi:
                    f=ph/math.pi; yy=-.19+.38*f; zz=.08
                else:
                    f=(ph-math.pi)/math.pi; yy=.19-.38*f; zz=.08+.115*math.sin(math.pi*f)
                feet[side]=(.135*sgn,yy,zz)
            v['armx']=-25-22*math.cos(phase); v['leftx']=-25+22*math.cos(phase); v['elbow']=-48
        else:
            v=interpolate_keys(k,{'attack_01':A1,'attack_03':A3,'skill_shadow_thread':SHADOW,'dodge_f':DODGE}[name])
        lift=0
        if name=='attack_03':
            q=min(1,max(0,(k-3)/6)); lift=.12*4*q*(1-q)
            for side in feet:
                a=feet[side]; feet[side]=(a[0],a[1],a[2]+lift)
        if name=='skill_shadow_thread':
            f=min(1,k/3)*min(1,(18-k)/9)
            feet['l']=(.145,-.09*f,.075); feet['r']=(-.145,.09*f,.075)
        if name=='dodge_f':
            f=math.sin(math.pi*k/9)
            feet['l']=(.14,-.10*f,.075+.035*f); feet['r']=(-.14,.07*f,.075)
        move_bone_world('pelvis',(0,0,lift+v.get('drop',0)))
        world_delta('pelvis',rz=v.get('twist',0)*.12)
        world_delta('spine_01',rx=v.get('lean',0)*.35,rz=v.get('twist',0)*.22)
        world_delta('spine_02',rx=v.get('lean',0)*.30,rz=v.get('twist',0)*.26)
        world_delta('chest',rx=v.get('lean',0)*.35,rz=v.get('twist',0)*.40)
        world_delta('neck',rx=-v.get('lean',0)*.25,rz=-v.get('twist',0)*.22)
        world_delta('head',rx=-v.get('lean',0)*.35,rz=-v.get('twist',0)*.25)
        world_delta('upperarm_r',rx=v.get('armx',-12),ry=v.get('army',-24),rz=v.get('armz',0))
        world_delta('forearm_r',rx=v.get('elbow',-22))
        world_delta('hand_r',rx=-8,rz=-8)
        world_delta('upperarm_l',rx=v.get('leftx',-8),ry=22,rz=-v.get('armz',0)*.18)
        world_delta('forearm_l',rx=-25)
        world_delta('hand_l',rx=-5)
        world_delta('grip_r',rx=-42); world_delta('thumb_r',rx=-18)
        world_delta('grip_l',rx=-15); world_delta('thumb_l',rx=-10)
        for side in ('l','r'): solve_leg(side,feet[side])
        for bn in body_bones:
            pb=arm.pose.bones[bn]
            pb.keyframe_insert(data_path='location',frame=k,group=bn)
            pb.keyframe_insert(data_path='rotation_quaternion',frame=k,group=bn)
    # All samples are explicit LINEAR keys; marker holds are duplicate poses.
    for layer in action.layers:
        for strip in layer.strips:
            if hasattr(strip,'channelbags'):
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        for kp in fc.keyframe_points: kp.interpolation='LINEAR'
    actions[name]=action
    log({'stage':'clip', 'name':name, 'frameRange':list(action.frame_range)})
arm.animation_data.action=None
for pb in arm.pose.bones:
    pb.location=(0,0,0); pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1)
scene.frame_set(0); bpy.context.view_layer.update()

# Save only this new process's private master, never the owner's open file.
bpy.data.libraries.write(str(MASTER), {scene, *actions.values()}, fake_user=True, compress=True)
bpy.ops.object.select_all(action='DESELECT')
for ob in [body,arm,weapon,*points]: ob.select_set(True)
bpy.context.view_layer.objects.active=arm
props=bpy.ops.export_scene.gltf.get_rna_type().properties
log({'animationModes':[i.identifier for i in props['export_animation_mode'].enum_items]})
bpy.ops.export_scene.gltf(
    filepath=str(GLB), export_format='GLB', use_selection=True,
    export_yup=True, export_apply=False, export_animations=True,
    export_animation_mode='ACTIONS', export_frame_range=False,
    export_force_sampling=True, export_frame_step=1, export_anim_slide_to_zero=True,
    export_def_bones=False, export_skins=True, export_all_influences=False,
    export_influence_nb=4, export_optimize_animation_size=True,
    export_optimize_animation_keep_anim_armature=True,
    export_image_format='AUTO', export_cameras=False, export_lights=False,
    export_extras=False, export_materials='EXPORT', export_normals=True,
    export_morph=False, export_leaf_bone=False,
)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED_SOURCE
info={'blender':bpy.app.version_string,'sourceSha256':EXPECTED_SOURCE,'outputSha256':hashlib.sha256(GLB.read_bytes()).hexdigest(),
      'bytes':GLB.stat().st_size,'bodyVertices':len(body.data.vertices),'bodyTriangles':len(body.data.loop_triangles),
      'bones':len(arm_data.bones),'clips':CLIPS,'cloth':chain_specs,
      'uniformSourceScale':scale,'sourceOriginShiftBlender':list(origin),'elapsedSeconds':time.perf_counter()-start_time,
      'ownerDecision':'REQ-009 §5, 2026-11-28: use this v01 source; rights waiting waived; retain back weapons as chest decoration',
      'limits':['P1 static flared cloth; Q4 not passed','Initial collapse reduction and region-envelope weights, requires pose QA','Six clips only; not full gameplay asset']}
(OUT/'char_hero001_ninja_preview_v01.production.json').write_text(json.dumps(info,indent=2,ensure_ascii=False),encoding='utf-8')
log({'stage':'exported','bytes':GLB.stat().st_size,'elapsedSeconds':info['elapsedSeconds']})
