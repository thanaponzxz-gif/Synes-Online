// Reuse strict hero blocking checks; record (never suppress) the three T0 profile exceptions.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {pathToFileURL} from 'node:url';import {PREVIEW_CLIPS,BODY_BONES,SOCKETS} from '../../../src/seyrin/spec.ts';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const latest=path.resolve(repo,'../seyrin-engine-0af27e/src/seyrin/inspect.ts');
const {inspectHeroFiles,parseGlb}=await import(pathToFileURL(fs.existsSync(latest)?latest:path.join(repo,'src/seyrin/inspect.ts')).href);
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../assets/_inbox'),base='char_hero002_vroid_t0_v01',data=fs.readFileSync(path.join(dir,base+'.glb')),g=parseGlb(data),j=g.json;
const production=JSON.parse(fs.readFileSync(path.join(dir,base+'.production.json')));
const manifest={schema:'synes.hero-manifest/1',assetId:'hero002_vroid',version:'v01',stage:'preview',status:'REVIEW',units:'meter',axes:{up:'+Y',forward:'+Z'},rootMotion:0,output:{file:base+'.glb',bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')},clips:structuredClone(PREVIEW_CLIPS),source:{file:'char_hero002_vroid_raw_v01.vrm',sha256:production.sourceSha256,origin:'Owner supplied VRoid sample AvatarSample_C; metadata author VRoid Project',licenseStatus:'Other; embedded VRoid Hub URL not independently verified; private T0 only'},tools:{blender:production.blender,production:'Codex isolated local Blender and existing Node/Three.js; no service or package installed',date:'2026-11-28'},cloth:{status:'none; no cloth solver for Hero002',chains:[]},presentation:{profileId:'hero002_vroid_t0',fps:30,rootMotion:0,heightM:1.5,bodyBones:27,clothBones:0,clipSet:'P1 six only',bakedLift:true,maskAlphaCutoff:.5,standIns:'DES-009 P1 existing mapping; report stand-ins separately'},profileExceptions:['bones: BODY_BONES27 only, no CLOTH_BONES18','anchors: none, solver disabled','material-opaque: avatar MASK/double-sided, weapon OPAQUE/single-sided']};
const report=await inspectHeroFiles(data,JSON.stringify(manifest));manifest.measurements=report.stats;
const joints=j.skins.flatMap(s=>s.joints.map(i=>j.nodes[i].name));const unique=[...new Set(joints)];
const parent=new Map();j.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parent.set(c,i)));const node=n=>j.nodes.findIndex(o=>o.name===n);
const profileChecks=[{id:'body27',ok:unique.length===27&&BODY_BONES.every(n=>unique.includes(n))},{id:'sockets7',ok:Object.entries(SOCKETS).every(([n,p])=>j.nodes[parent.get(node(n))]?.name===p)},{id:'materials',ok:j.materials.length<=2&&j.materials.filter(m=>m.alphaMode==='MASK'&&m.doubleSided&&(m.alphaCutoff??.5)===.5).length===1&&!j.materials.some(m=>m.alphaMode==='BLEND')},{id:'no-morph-vrm',ok:!j.meshes.some(m=>m.primitives.some(p=>p.targets?.length))&&!j.extensions?.VRM},{id:'raw-unchanged',ok:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'char_hero002_vroid_raw_v01.vrm'))).digest('hex')==='6ad4acb74c2ea91b46a2c6755243efd9da4e0857635b659acd55d0de5832330a'}];
const allowed=new Set(['bones','anchors','material-opaque']);
// Derive actual material check id from the strict reader; do not permit arbitrary failures.
const materialFailure=report.items.find(i=>!i.ok&&/OPAQUE|single sided|single-sided/.test(i.detail)&&i.level==='check');
if(materialFailure&&!['material-opaque','opaque','opacity'].includes(materialFailure.id))throw Error('unexpected material check id '+materialFailure.id);
if(materialFailure)allowed.add(materialFailure.id);
const failures=report.items.filter(i=>!i.ok&&!allowed.has(i.id));
const accepted=report.accepted&&!failures.length&&profileChecks.every(x=>x.ok);
fs.writeFileSync(path.join(dir,base+'.manifest.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(dir,base+'.inspect.json'),JSON.stringify({accepted,strictHeroReport:report,expectedExceptions:report.items.filter(i=>!i.ok&&allowed.has(i.id)),profileChecks},null,2));
console.log(JSON.stringify({accepted,stats:report.stats,expectedExceptions:report.items.filter(i=>!i.ok&&allowed.has(i.id)),failures,profileChecks},null,2));if(!accepted)process.exitCode=1;
