// Local asset packing only. No game code, service, native executable or package install.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const inbox = path.join(root, 'assets/_inbox');
const stage = process.argv.includes('--combat') ? 'combat' : 'preview';
const basename = stage === 'preview' ? 'mon_boss_crab_preview_v01' : 'mon_boss_crab_v01';
const file = path.join(inbox, basename + '.glb');
const bytes = fs.readFileSync(file), jl = bytes.readUInt32LE(12), bin = bytes.subarray(28+jl);
const existingRecord=JSON.parse(fs.readFileSync(path.join(inbox,basename+'.production.json'),'utf8'));
if(existingRecord.weightEncoding&&existingRecord.outputSha256===crypto.createHash('sha256').update(bytes).digest('hex')){
 console.log(JSON.stringify({alreadyPacked:true,bytes:bytes.length}));process.exit(0);
}
const j = JSON.parse(bytes.subarray(20,20+jl).toString());
const replacement = new Map();
for (const mesh of j.meshes) for (const p of mesh.primitives) {
  for (const key of ['WEIGHTS_0','JOINTS_0']) {
    const ai=p.attributes[key]; if(ai===undefined) continue;
    const a=j.accessors[ai], view=j.bufferViews[a.bufferView];
    if(a.componentType===5121) continue;
    if(view.byteStride || (a.byteOffset??0)!==0 || j.accessors.filter(x=>x.bufferView===a.bufferView).length!==1) throw Error('expected exclusive tightly packed skin accessor');
    const count=a.count*4, out=Buffer.alloc(count), start=view.byteOffset??0;
    for(let v=0;v<a.count;v++) {
      if(key==='JOINTS_0') for(let k=0;k<4;k++) out[v*4+k]=bin.readUInt16LE(start+(v*4+k)*2);
      else {
        const raw=Array.from({length:4},(_,k)=>Math.max(0,bin.readFloatLE(start+(v*4+k)*4))),sum=raw.reduce((a,b)=>a+b,0);
        const scaled=raw.map(w=>w/sum*255), quant=scaled.map(Math.floor);
        let remaining=255-quant.reduce((a,b)=>a+b,0);
        const order=scaled.map((x,i)=>[x-quant[i],i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
        for(let k=0;k<remaining;k++) quant[order[k][1]]++;
        for(let k=0;k<4;k++)out[v*4+k]=quant[k];
      }
    }
    a.componentType=5121; if(key==='WEIGHTS_0')a.normalized=true;
    replacement.set(a.bufferView,out);
  }
}
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(b){let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(t,d){const b=Buffer.alloc(d.length+12);b.writeUInt32BE(d.length);b.write(t,4);d.copy(b,8);b.writeUInt32BE(crc(b.subarray(4,8+d.length)),8+d.length);return b;}
function paeth(a,b,c){const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;}
function decode(p){let parts=[],w,h,ct;for(let o=8;o<p.length;){const n=p.readUInt32BE(o),t=p.toString('ascii',o+4,o+8),d=p.subarray(o+8,o+8+n);if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);ct=d[9];if(d[8]!==8||d[12]!==0||![2,6].includes(ct))throw Error('expected 8-bit RGB/RGBA PNG');}if(t==='IDAT')parts.push(d);o+=n+12;}const channels=ct===6?4:3,row=w*channels,raw=zlib.inflateSync(Buffer.concat(parts)),out=Buffer.alloc(row*h);let z=0;for(let y=0;y<h;y++){const f=raw[z++];for(let x=0;x<row;x++){const a=x>=channels?out[y*row+x-channels]:0,b=y?out[(y-1)*row+x]:0,c=y&&x>=channels?out[(y-1)*row+x-channels]:0,pred=f===1?a:f===2?b:f===3?(a+b)>>1:f===4?paeth(a,b,c):0;out[y*row+x]=(raw[z++]+pred)&255;}}return{w,h,channels,data:out};}
function encode(im,bits){const row=im.w*3,data=Buffer.alloc(row*im.h),levels=2**bits-1;
 for(let p=0;p<im.w*im.h;p++)for(let k=0;k<3;k++)data[p*3+k]=Math.round(Math.round(im.data[p*im.channels+k]*levels/255)*255/levels);
 const raw=Buffer.alloc((row+1)*im.h);for(let y=0;y<im.h;y++){let best=null,bestScore=Infinity,bestType=0;for(let f=0;f<=4;f++){const r=Buffer.alloc(row);let score=0;for(let x=0;x<row;x++){const cur=data[y*row+x],a=x>=3?data[y*row+x-3]:0,b=y?data[(y-1)*row+x]:0,c=y&&x>=3?data[(y-1)*row+x-3]:0,pred=f===1?a:f===2?b:f===3?(a+b)>>1:f===4?paeth(a,b,c):0,v=(cur-pred)&255;r[x]=v;score+=Math.min(v,256-v);}if(score<bestScore){best=r;bestScore=score;bestType=f;}}raw[y*(row+1)]=bestType;best.copy(raw,y*(row+1)+1);}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(im.w);ih.writeUInt32BE(im.h,4);ih[8]=8;ih[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
const mat=j.materials[0], baseIndex=j.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source;
const baseView=j.images[baseIndex].bufferView,bv=j.bufferViews[baseView],image=decode(bin.subarray(bv.byteOffset,bv.byteOffset+bv.byteLength));
replacement.set(baseView,encode(image,6));
// Keep only two PNG maps, opaque and the same ORM for R=AO/G=roughness/B=metal.
for(const m of j.materials){m.occlusionTexture={index:m.pbrMetallicRoughness.metallicRoughnessTexture.index};delete m.extensions;delete m.normalTexture;delete m.emissiveTexture;delete m.emissiveFactor;m.doubleSided=false;m.alphaMode='OPAQUE';}
delete j.extensionsRequired;delete j.extensionsUsed;
function pack(){const parts=[];let offset=0;for(let i=0;i<j.bufferViews.length;i++){const old=j.bufferViews[i],data=replacement.get(i)??bin.subarray(old._originalOffset??old.byteOffset, (old._originalOffset??old.byteOffset)+(old._originalLength??old.byteLength));if(old._originalOffset===undefined){old._originalOffset=old.byteOffset;old._originalLength=old.byteLength;}const pad=(4-offset%4)%4;if(pad){parts.push(Buffer.alloc(pad));offset+=pad;}old.byteOffset=offset;old.byteLength=data.length;parts.push(data);offset+=data.length;}j.buffers=[{byteLength:offset}];const json=JSON.parse(JSON.stringify(j));for(const v of json.bufferViews){delete v._originalOffset;delete v._originalLength;}const text=Buffer.from(JSON.stringify(json)),jp=Buffer.alloc((4-text.length%4)%4,32),bb=Buffer.concat(parts),bp=Buffer.alloc((4-bb.length%4)%4);const head=Buffer.alloc(12);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+text.length+jp.length+bb.length+bp.length,8);const ch=(len,type)=>{const x=Buffer.alloc(8);x.writeUInt32LE(len);x.writeUInt32LE(type,4);return x;};return Buffer.concat([head,ch(text.length+jp.length,0x4e4f534a),text,jp,ch(bb.length+bp.length,0x004e4942),bb,bp]);}
let packed=pack(),bits=6;if(packed.length>2*1024*1024){bits=5;replacement.set(baseView,encode(image,bits));packed=pack();}
if(packed.length>2*1024*1024)throw Error('budget still exceeded '+packed.length);
fs.writeFileSync(file,packed);
fs.writeFileSync(path.join(inbox,'tex_boss_crab_basecolor_v01.png'),replacement.get(baseView));
const recordFile=path.join(inbox,basename+'.production.json');
const record=JSON.parse(fs.readFileSync(recordFile,'utf8'));
record.unpackedBytes??=record.bytes;
record.unpackedSha256??=record.outputSha256;
record.outputSha256=crypto.createHash('sha256').update(packed).digest('hex');
record.bytes=packed.length;
record.weightEncoding='normalised UINT8, integer sum exactly 255, at most 4 influences';
record.baseColorBitsPerChannel=bits;
record.baseColorPngBytes=replacement.get(baseView).length;
record.rigNotes='22 boss joints; no cloth or spring solver';
fs.writeFileSync(recordFile,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({beforeBytes:bytes.length,afterBytes:packed.length,baseColorBitsPerChannel:bits,baseColorBytes:replacement.get(baseView).length,skin:'normalised UINT8 weights, integer sum 255; UINT8 joints'}));
