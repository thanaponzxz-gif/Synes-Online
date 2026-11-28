// Read-only check of Team B's existing hero loader; CPU only, no browser/GPU claim.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';import {Vector3} from 'three';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),dir=path.join(root,'assets/_inbox'),base='char_hero002_vroid_t0_v01';
globalThis.self=globalThis;globalThis.ProgressEvent=class{constructor(t,p){this.type=t;Object.assign(this,p);}};
globalThis.createImageBitmap=async blob=>{const b=Buffer.from(await blob.arrayBuffer());return{width:b.readUInt32BE(16),height:b.readUInt32BE(20),close(){}};};
const latest=path.resolve(root,'../seyrin-engine-0af27e/src/seyrin/loader.ts');const {loadHero}=await import(pathToFileURL(fs.existsSync(latest)?latest:path.join(root,'src/seyrin/loader.ts')).href);
const b=fs.readFileSync(path.join(dir,base+'.glb')),text=fs.readFileSync(path.join(dir,base+'.manifest.json'),'utf8');const asset=await loadHero(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),text),hero=asset.createInstance();
const results=[];for(const spec of JSON.parse(text).clips){hero.pose(spec.name,spec.ticks/60);hero.root.updateMatrixWorld(true);const a=hero.root.getObjectByName('socket_blade_base').getWorldPosition(new Vector3()),z=hero.root.getObjectByName('socket_blade_tip').getWorldPosition(new Vector3());if(Math.abs(a.distanceTo(z)-.65)>1e-4)throw Error('blade socket span');results.push({clip:spec.name,bladeSpanM:a.distanceTo(z)});}
const animated={clip:'attack_03',time:.2,weight:1};const missing=hero.animate({upper:[animated],lower:[animated],additive:[],pelvisLift:0});if(missing.length)throw Error('mixer driver missing '+missing.join(','));
hero.root.updateMatrixWorld(true);const pelvis=hero.root.getObjectByName('pelvis').getWorldPosition(new Vector3());if(!Number.isFinite(pelvis.y))throw Error('bad animated pelvis');
hero.dispose();if(asset.liveInstances!==0)throw Error('instance retained');asset.dispose();
const report={accepted:true,sha256:crypto.createHash('sha256').update(b).digest('hex'),results,mixerDriver27Bones:true,instancesAfterDispose:0,scope:'Existing hero loader, PNG dimension shim, CPU skin/mixer only; not browser/texture decode/GPU/mobile/lifecycle QA'};
fs.writeFileSync(path.join(dir,base+'.loadercheck.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
