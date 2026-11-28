// CPU-only integration sanity check using the installed Three.js GLTFLoader.
// The image shim supplies PNG dimensions only; this is not a GPU/render test.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {AnimationMixer, LoopOnce, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../assets/_inbox');
const stage=process.argv.includes('--combat')?'combat':'preview';
const version=process.argv.includes('--version')?process.argv[process.argv.indexOf('--version')+1]:'v01';
if(!['v01','v02'].includes(version))throw Error('unsupported version');
const base=stage==='combat'?'mon_boss_crab_'+version:'mon_boss_crab_preview_'+version;
const data=fs.readFileSync(path.join(dir,base+'.glb'));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,base+'.manifest.json'),'utf8'));
globalThis.self=globalThis;
globalThis.ProgressEvent=class {constructor(type,props){this.type=type;Object.assign(this,props);}};
globalThis.createImageBitmap=async blob=>{const b=Buffer.from(await blob.arrayBuffer());if(b.toString('ascii',1,4)!=='PNG')throw Error('PNG required');return{width:b.readUInt32BE(16),height:b.readUInt32BE(20),close(){}};};
const gltf=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
if(meshes.length!==1||meshes[0].skeleton.bones.length!==22)throw Error('skin count');
const mesh=meshes[0],mixer=new AnimationMixer(gltf.scene),clips={};
const failures=[],point=new Vector3();
for(const spec of manifest.clips){
 const clip=gltf.animations.find(c=>c.name===spec.name);if(!clip)throw Error('missing clip '+spec.name);
 mixer.stopAllAction();const action=mixer.clipAction(clip);action.reset().setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play();
 let minY=Infinity,maxRadius=0;
 for(let i=0;i<=spec.ticks*4;i++){
  mixer.setTime(Math.min(clip.duration,i/120));gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
  for(let v=0;v<mesh.geometry.attributes.position.count;v++){
   mesh.getVertexPosition(v,point);point.applyMatrix4(mesh.matrixWorld);
   if(!Number.isFinite(point.x+point.y+point.z))throw Error('non-finite skin');
   minY=Math.min(minY,point.y);maxRadius=Math.max(maxRadius,Math.hypot(point.x,point.z));
  }
 }
 const limit=['idle','charge','charge_windup'].includes(spec.name)?1.80:2.10;
 if(minY<-.01||maxRadius>limit+1e-4)failures.push(spec.name);
 clips[spec.name]={seconds:clip.duration,minY,maxRadius};
}
const report={accepted:failures.length===0,sha256:crypto.createHash('sha256').update(data).digest('hex'),stage,skinCount:meshes.length,bones:mesh.skeleton.bones.length,animationCount:gltf.animations.length,clips,failures,scope:'Installed Three.js CPU mixer/skin; PNG dimension shim; no browser, WebGL, GPU, timing or mobile claim'};
fs.writeFileSync(path.join(dir,base+'.threecheck.json'),JSON.stringify(report,null,2)+'\n');
mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);mesh.geometry.dispose();
for(const material of [mesh.material].flat()){for(const key of ['map','aoMap','roughnessMap','metalnessMap'])material[key]?.dispose();material.dispose();}
console.log(JSON.stringify(report,null,2));if(!report.accepted)process.exitCode=1;
