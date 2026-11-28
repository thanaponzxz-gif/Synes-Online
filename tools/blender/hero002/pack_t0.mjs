// Preserve RGBA/MASK textures; pack only joint data and set the shared ORM AO slot.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../assets/_inbox'),base='char_hero002_vroid_t0_v01',file=path.join(dir,base+'.glb');
const bytes=fs.readFileSync(file),jl=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+jl)),bin=bytes.subarray(28+jl),replace=new Map();
for(const mesh of j.meshes)for(const p of mesh.primitives)for(const key of ['JOINTS_0','WEIGHTS_0']){
 const ai=p.attributes[key];if(ai===undefined)continue;const a=j.accessors[ai],view=j.bufferViews[a.bufferView];if(a.componentType===5121)continue;
 if(view.byteStride||a.byteOffset)throw Error('exclusive tight accessor required');
 const out=Buffer.alloc(a.count*4);for(let i=0;i<a.count;i++){
  if(key==='JOINTS_0')for(let k=0;k<4;k++)out[i*4+k]=bin.readUInt16LE(view.byteOffset+(i*4+k)*2);
  else{const w=Array.from({length:4},(_,k)=>bin.readFloatLE(view.byteOffset+(i*4+k)*4)),sum=w.reduce((a,b)=>a+b,0),v=w.map(x=>x/sum*255),q=v.map(Math.floor),order=v.map((x,k)=>[x-q[k],k]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);for(let k=0,n=255-q.reduce((a,b)=>a+b,0);k<n;k++)q[order[k][1]]++;q.forEach((x,k)=>out[i*4+k]=x);}
 }a.componentType=5121;if(key==='WEIGHTS_0')a.normalized=true;replace.set(a.bufferView,out);
}
for(const m of j.materials){m.occlusionTexture={index:m.pbrMetallicRoughness.metallicRoughnessTexture.index};delete m.extensions;}
delete j.extensionsUsed;delete j.extensionsRequired;
let offset=0;const parts=[];for(let i=0;i<j.bufferViews.length;i++){const v=j.bufferViews[i],data=replace.get(i)??bin.subarray(v.byteOffset,v.byteOffset+v.byteLength),pad=(4-offset%4)%4;if(pad){parts.push(Buffer.alloc(pad));offset+=pad;}v.byteOffset=offset;v.byteLength=data.length;parts.push(data);offset+=data.length;}
j.buffers=[{byteLength:offset}];const text=Buffer.from(JSON.stringify(j)),jsonpad=Buffer.alloc((4-text.length%4)%4,32),b=Buffer.concat(parts),pad=Buffer.alloc((4-b.length%4)%4),head=Buffer.alloc(12);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+text.length+jsonpad.length+b.length+pad.length,8);
const chunk=(n,t)=>{const a=Buffer.alloc(8);a.writeUInt32LE(n);a.writeUInt32LE(t,4);return a;};const result=Buffer.concat([head,chunk(text.length+jsonpad.length,0x4e4f534a),text,jsonpad,chunk(b.length+pad.length,0x004e4942),b,pad]);fs.writeFileSync(file,result);
const info=JSON.parse(fs.readFileSync(path.join(dir,base+'.production.json')));info.bytes=result.length;info.sha256=crypto.createHash('sha256').update(result).digest('hex');info.weights='UINT8 normalized, integer sum255';fs.writeFileSync(path.join(dir,base+'.production.json'),JSON.stringify(info,null,2));console.log(JSON.stringify({bytes:result.length,sha256:info.sha256}));
