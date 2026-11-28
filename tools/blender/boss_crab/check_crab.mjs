// DES-010 asset audit: no game changes, no browser, no fixture character art.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {parseGlb} from '../../../src/seyrin/inspect.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),dir=path.join(root,'assets/_inbox');
const version=process.argv.includes('--version')?process.argv[process.argv.indexOf('--version')+1]:'v01';
if(!['v01','v02'].includes(version))throw Error('unsupported version');
const stage=process.argv.includes('--combat')?'combat':'preview',base=stage==='preview'?'mon_boss_crab_preview_'+version:'mon_boss_crab_'+version;
const bytes=fs.readFileSync(path.join(dir,base+'.glb')),sha=crypto.createHash('sha256').update(bytes).digest('hex');
const {json:j,bin}=parseGlb(bytes),prod=JSON.parse(fs.readFileSync(path.join(dir,base+'.production.json'),'utf8'));
const items=[];const check=(id,ok,detail)=>items.push({id,ok,detail});
const names=['root','body','shell','head','arm_l','claw_l','pincer_l','arm_r','claw_r','pincer_r',...['fl','fr','bl','br'].flatMap(s=>['upper','lower','foot'].map(p=>'leg_'+s+'_'+p))];
const specs=[
 {name:'idle',ticks:48,loop:true,markers:{},phases:{loop:[0,48]}},
 {name:'walk',ticks:24,loop:true,markers:{step:[0,12]},phases:{loop:[0,24]}},
 {name:'sweep',ticks:51,loop:false,markers:{impact:[30]},poseHolds:[[30,31]],phases:{windup:[0,30],recover:[30,51]}},
 {name:'slam',ticks:60,loop:false,markers:{impact:[30]},poseHolds:[[30,31]],phases:{windup:[0,30],recover:[30,60]}},
 {name:'charge_windup',ticks:30,loop:false,markers:{release:[30]},phases:{windup:[0,30]}},
 {name:'charge',ticks:12,loop:true,markers:{},phases:{loop:[0,12]}},
 {name:'shard_cast',ticks:45,loop:false,markers:{castAccent:[9]},phases:{cast:[0,27],recover:[27,45]}},
 {name:'stunned',ticks:30,loop:true,markers:{},phases:{loop:[0,30]}},
 {name:'roar',ticks:33,loop:false,markers:{},phases:{once:[0,33]}},
 {name:'down',ticks:12,loop:false,markers:{},holdLast:true,phases:{once:[0,12]}},
];
const want=stage==='preview'?specs.slice(0,2):specs;
const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function read(i,raw=false){const a=j.accessors[i],v=j.bufferViews[a.bufferView],sz={5121:1,5123:2,5125:4,5126:4}[a.componentType],w=width[a.type],d=new DataView(bin.buffer,bin.byteOffset,bin.byteLength),out=[];if(!sz||!w||a.sparse)throw Error('unsupported accessor');for(let k=0;k<a.count;k++)for(let c=0;c<w;c++){const off=(v.byteOffset??0)+(a.byteOffset??0)+k*(v.byteStride??sz*w)+c*sz;let n=a.componentType===5126?d.getFloat32(off,true):a.componentType===5125?d.getUint32(off,true):a.componentType===5123?d.getUint16(off,true):d.getUint8(off);if(!raw&&a.normalized)n/=a.componentType===5121?255:65535;out.push(n);}return out;}
function sample(anim,ch,t){const s=anim.samplers[ch.sampler],times=read(s.input),values=read(s.output),w=width[j.accessors[s.output].type];let k=0;while(k<times.length-2&&times[k+1]<t)k++;if(t<=times[0])return values.slice(0,w);if(t>=times.at(-1))return values.slice(-w);const f=(t-times[k])/(times[k+1]-times[k]);return Array.from({length:w},(_,c)=>values[k*w+c]*(1-f)+values[(k+1)*w+c]*f);}
function difference(a,b,path){if(path==='rotation'){const la=Math.hypot(...a),lb=Math.hypot(...b),dot=Math.abs(a.reduce((s,v,i)=>s+v*b[i],0)/(la*lb));return 2*Math.acos(Math.min(1,dot));}return Math.max(...a.map((v,i)=>Math.abs(v-b[i])));}
const nodes=j.nodes??[],parent=nodes.map(()=>-1);nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parent[c]=i));
const byName=new Map(nodes.map((n,i)=>[n.name,i]));
check('self-contained',!(j.buffers??[]).some(x=>x.uri)&&!(j.images??[]).some(x=>x.uri),'all data embedded');
check('extensions',!(j.extensionsRequired?.length||j.extensionsUsed?.length),'no runtime extensions');
check('bytes',bytes.length<=2097152,bytes.length);
const skin=j.skins?.[0],joints=skin?.joints?.map(i=>nodes[i].name)??[];
check('22-bones',joints.length===22&&names.every(n=>joints.includes(n))&&new Set(joints).size===22,joints);
const drawn=nodes.filter(n=>n.mesh!==undefined),prims=drawn.flatMap(n=>j.meshes[n.mesh].primitives.map(p=>({...p,skin:n.skin})));
const tris=prims.reduce((sum,p)=>sum+j.accessors[p.indices].count/3,0);
check('mesh-budget',drawn.length===1&&prims.length===1&&tris<=10000,{meshNodes:drawn.length,primitives:prims.length,tris});
check('one-material',j.materials.length===1,j.materials.length);
const material=j.materials[0],mr=material.pbrMetallicRoughness;
check('opaque',!material.doubleSided&&(material.alphaMode??'OPAQUE')==='OPAQUE'&&!material.normalTexture&&!material.emissiveTexture,'single-sided opaque, no extra maps');
const textureStats=[];
for(const [usage,index,size]of[['baseColor',mr.baseColorTexture?.index,1024],['orm',mr.metallicRoughnessTexture?.index,512]]){const im=j.images[j.textures[index].source],v=j.bufferViews[im.bufferView],b=Buffer.from(bin.subarray(v.byteOffset,v.byteOffset+v.byteLength)),w=b.readUInt32BE(16),h=b.readUInt32BE(20);textureStats.push({usage,width:w,height:h,bytes:b.length});check('texture-'+usage,b[0]===137&&w===size&&h===size,textureStats.at(-1));}
check('orm',material.occlusionTexture?.index===mr.metallicRoughnessTexture?.index,'same AO/metallic/roughness texture');
// Decode the delivered base PNG bytes, rather than inferring color from a preview.
const image=j.images[j.textures[mr.baseColorTexture.index].source],view=j.bufferViews[image.bufferView],png=Buffer.from(bin.subarray(view.byteOffset,view.byteOffset+view.byteLength));
const compressed=[];for(let o=8;o<png.length;){const n=png.readUInt32BE(o);if(png.toString('ascii',o+4,o+8)==='IDAT')compressed.push(png.subarray(o+8,o+8+n));o+=n+12;}
const rgbChannels=png[25]===6?4:3,row=png.readUInt32BE(16)*rgbChannels,h=png.readUInt32BE(20),scan=zlib.inflateSync(Buffer.concat(compressed)),decoded=Buffer.alloc(row*h);
function paeth(a,b,c){const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;}
let cursor=0,reservedTexels=0;
for(let y=0;y<h;y++){const filter=scan[cursor++];for(let x=0;x<row;x++){const a=x>=rgbChannels?decoded[y*row+x-rgbChannels]:0,b=y?decoded[(y-1)*row+x]:0,c=y&&x>=rgbChannels?decoded[(y-1)*row+x-rgbChannels]:0,p=filter===1?a:filter===2?b:filter===3?(a+b)>>1:filter===4?paeth(a,b,c):0;decoded[y*row+x]=(scan[cursor++]+p)&255;}}
for(let i=0;i<decoded.length;i+=rgbChannels)if(decoded[i]===255&&((decoded[i+1]===51&&decoded[i+2]===85)||(decoded[i+1]===122&&decoded[i+2]===26)))reservedTexels++;
check('reserved-colors',reservedTexels===0,{reservedTexels});
let badWeights=0,maxInfluences=0,badJoints=0;
for(const p of prims){const weights=read(p.attributes.WEIGHTS_0,true),indices=read(p.attributes.JOINTS_0,true),a=j.accessors[p.attributes.WEIGHTS_0],limit=a.componentType===5121?255:a.componentType===5123?65535:1;for(let i=0;i<weights.length;i+=4){const w=weights.slice(i,i+4),s=w.reduce((a,b)=>a+b,0);if(w.some(x=>!Number.isFinite(x)||x<0||x>limit)||Math.abs(s-limit)>(limit===1?1e-4:0))badWeights++;maxInfluences=Math.max(maxInfluences,w.filter(x=>x>0).length);}badJoints+=indices.filter(x=>x<0||x>=22||!Number.isInteger(x)).length;}
check('weights',!badWeights&&!badJoints&&maxInfluences<=4,{badWeights,badJoints,maxInfluences});
const expected=want.map(c=>c.name).sort(),actual=j.animations.map(a=>a.name).sort();
check('clip-allowlist',JSON.stringify(expected)===JSON.stringify(actual),actual);
const clipStats=[];let rootBad=0,loopBad=0,holdBad=0,nonFinite=0;
for(const anim of j.animations){const spec=want.find(c=>c.name===anim.name);let lo=Infinity,hi=-Infinity,loopDiff=0,holdDiff=0;
 for(const ch of anim.channels){const s=anim.samplers[ch.sampler],times=read(s.input);lo=Math.min(lo,times[0]);hi=Math.max(hi,times.at(-1));const data=read(s.output);nonFinite+=data.filter(x=>!Number.isFinite(x)).length;
  if(nodes[ch.target.node].name==='root'){const rest=ch.target.path==='rotation'?(nodes[ch.target.node].rotation??[0,0,0,1]):ch.target.path==='scale'?[1,1,1]:[0,0,0],w=rest.length;for(let k=0;k<data.length;k+=w)if(difference(data.slice(k,k+w),rest,ch.target.path)>1e-4)rootBad++;}
  if(spec?.loop)loopDiff=Math.max(loopDiff,difference(sample(anim,ch,0),sample(anim,ch,spec.ticks/30),ch.target.path));
  for(const [a,b]of spec?.poseHolds??[])holdDiff=Math.max(holdDiff,difference(sample(anim,ch,a/30),sample(anim,ch,b/30),ch.target.path));
 }
 if(loopDiff>1e-4)loopBad++;if(holdDiff>1e-4)holdBad++;
 const row={name:anim.name,seconds:hi,ticks:hi*30,loopDifference:loopDiff,holdDifference:holdDiff};clipStats.push(row);
 check('duration-'+anim.name,!!spec&&Math.abs(lo)<1e-5&&Math.abs(hi-spec.ticks/30)<1e-5,row);
}
check('root-motion',rootBad===0,rootBad);check('loop-seams',loopBad===0,loopBad);check('pose-holds',holdBad===0,holdBad);check('finite-animation',nonFinite===0,nonFinite);
const socketParents={socket_fx_ground:'root',socket_fx_shell:'shell',socket_fx_claw_l:'claw_l',socket_fx_claw_r:'claw_r',socket_fx_head:'head'};
const sockets=Object.entries(socketParents).map(([name,p])=>{const i=byName.get(name);return{name,parent:i!==undefined?nodes[parent[i]]?.name:null,expectedParent:p,positionM:i!==undefined?(nodes[i].translation??[0,0,0]):null,rotation:i!==undefined?(nodes[i].rotation??[0,0,0,1]):null};});
function rotated(q,v){const [x,y,z,w]=q,[a,b,c]=v,tx=2*(y*c-z*b),ty=2*(z*a-x*c),tz=2*(x*b-y*a);return[a+w*tx+y*tz-z*ty,b+w*ty+z*tx-x*tz,c+w*tz+x*ty-y*tx];}
for(const s of sockets)if(s.rotation){s.coordinateSpace='parent-local';s.axes={up:rotated(s.rotation,[0,1,0]),forward:rotated(s.rotation,[0,0,1])};}
check('sockets',sockets.every(s=>s.parent===s.expectedParent),sockets);
check('no-negative-scale',nodes.every(n=>(n.scale??[1,1,1]).every(v=>v>0)),'all node scales positive');
const p=prims[0],position=read(p.attributes.POSITION);const bounds=Array.from({length:3},()=>[Infinity,-Infinity]);let radius=0;
for(let i=0;i<position.length;i+=3){for(let k=0;k<3;k++){bounds[k][0]=Math.min(bounds[k][0],position[i+k]);bounds[k][1]=Math.max(bounds[k][1],position[i+k]);}radius=Math.max(radius,Math.hypot(position[i],position[i+2]));}
check('bind-envelope',radius<=1.80001&&Math.abs(bounds[1][0])<=.01&&Math.abs(bounds[1][1]-bounds[1][0]-2.84)<=.10,{bounds,radius});
const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'mon_boss_crab_raw_v01.glb'))).digest('hex');
check('raw-unchanged',sourceHash==='05b6130b99ec0fc9a5e807696551671c3635af53b1767f1c09c8f220de72ce2d',sourceHash);
const measurements={bytes:bytes.length,tris,vertices:j.accessors[p.attributes.POSITION].count,primitives:prims.length,materials:j.materials.length,joints:joints.length,bindBoundsM:bounds,horizontalRadiusM:radius,textureSizes:textureStats,clips:clipStats};
const manifest={schema:'synes.boss-manifest/1',assetId:'boss_crab',version:'v01',profileId:'prismback_crab_v01',simKind:'prismback',rulesets:['ninja-roam-1'],stage,units:'meter',axes:{up:'+Y',forward:'+Z'},rootMotion:0,status:'REVIEW',output:{file:base+'.glb',bytes:bytes.length,sha256:sha},clips:want,bones:names.map(name=>{const i=byName.get(name);return{name,parent:names.includes(nodes[parent[i]]?.name)?nodes[parent[i]].name:null};}),sockets,measurements,source:{file:'mon_boss_crab_raw_v01.glb',sha256:sourceHash,originStatus:prod.originStatus},tools:{blender:prod.blender,production:'Codex, local headless Blender; no external service'},motionProfile:{fps:30,referenceSpeeds:{walk:2,charge:15},clock:'telegraph-and-state',rootMotion:0}};
manifest.tools.date='2026-11-28';
manifest.version=version;
const report={accepted:items.every(i=>i.ok),outputSha256:sha,stage,measurements,items};
fs.writeFileSync(path.join(dir,base+'.manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(dir,base+'.inspect.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.accepted,outputSha256:sha,measurements,failures:items.filter(i=>!i.ok)},null,2));if(!report.accepted)process.exitCode=1;
