var xp=Object.defineProperty;var _p=(s,e,t)=>e in s?xp(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var N=(s,e,t)=>_p(s,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const vp="modulepreload",Mp=function(s,e){return new URL(s,e).href},ph={},yp=function(e,t,n){let i=Promise.resolve();if(t&&t.length>0){let a=function(h){return Promise.all(h.map(u=>Promise.resolve(u).then(d=>({status:"fulfilled",value:d}),d=>({status:"rejected",reason:d}))))};const o=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");i=a(t.map(h=>{if(h=Mp(h,n),h in ph)return;ph[h]=!0;const u=h.endsWith(".css"),d=u?'[rel="stylesheet"]':"";if(!!n)for(let x=o.length-1;x>=0;x--){const m=o[x];if(m.href===h&&(!u||m.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${h}"]${d}`))return;const p=document.createElement("link");if(p.rel=u?"stylesheet":vp,u||(p.as="script"),p.crossOrigin="",p.href=h,c&&p.setAttribute("nonce",c),document.head.appendChild(p),u)return new Promise((x,m)=>{p.addEventListener("load",x),p.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${h}`)))})}))}function r(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return i.then(a=>{for(const o of a||[])o.status==="rejected"&&r(o.reason);return e().catch(r)})},$e=1/30,Yi={name:"Wayfarer",radius:.42,maxHp:120,speed:5.2,attackMoveMul:.35,combo:[{dur:.32,hitAt:.4,dmg:12,range:2.3},{dur:.32,hitAt:.4,dmg:12,range:2.3},{dur:.5,hitAt:.45,dmg:22,range:2.6}],arcCos:.34,comboResetS:.6,autoAimRange:4.2,inputBufferS:.25,dodge:{dur:.3,speed:12,iframes:.3,cooldown:.55},perfect:{critMul:1.5,skillCdRefund:2},skill:{name:"Chime Burst",cast:.35,radius:3.6,dmg:34,cooldown:8},potion:{charges:2,heal:45,dur:.6}},wt=[{slot:1,id:"chime",nameTh:"ระฆังสะท้อน",nameEn:"Chime Burst",cdTicks:241,prepTicks:10,hitTick:10,endTick:10,radius:Yi.skill.radius,dmg:Yi.skill.dmg},{slot:2,id:"crescent",nameTh:"ฟันเสี้ยวจันทร์",nameEn:"Crescent Cut",cdTicks:135,prepTicks:6,hitTick:6,endTick:12,radius:3,cosHalf:.642788,dmg:22},{slot:3,id:"crystal",nameTh:"ผลึกพิฆาต",nameEn:"Crystal Break",cdTicks:360,prepTicks:15,hitTick:15,endTick:24,radius:1.5,ahead:2.6,dmg:48}],yd={id:"grand",nameTh:"มหาระฆัง",nameEn:"Grand Resonance",locked:!0},fc=1.2,Kn={puffcap:{nameTh:"พัฟแคป",radius:.55,maxHp:40,speed:2.2,aggro:7,attackRange:3.2,recover:1,attacks:{hop:{id:"hop",nameTh:"สปอร์กระโดด",shape:"circle",windup:1.2,dmg:14,r:1.7,tipTh:"วงส้มคือจุดที่มันจะกระโดดลง ให้เดินออกนอกวงหรือกด ↯ ตอนวงใกล้เต็ม"}}},thornling:{nameTh:"ธอร์นลิง",radius:.5,maxHp:55,speed:3,aggro:9,attackRange:7,recover:1.2,rushSpeed:14,attacks:{rush:{id:"rush",nameTh:"พุ่งหนาม",shape:"line",windup:.9,dmg:16,r:7.5,w:1.4,tipTh:"แถบยาวคือแนวพุ่งชน ให้ก้าวออกด้านข้าง ไม่ใช่ถอยหลัง"}}},prismback:{nameTh:"ปริซึมแบ็ก ผู้พิทักษ์ทุ่ง",radius:1.9,maxHp:1e3,speed:2,speedP2:2.4,phase2At:.5,windupMulP2:.85,stunPillar:2.6,stunMiss:.9,chargeSpeed:15,stunDmgMul:1.5,roar:1.1,p2FollowCharge:!0,followChargeWindup:1.35,shardStagger:.22,p2ShardEvery:3,attacks:{sweep:{id:"sweep",nameTh:"กวาดเขา",shape:"cone",windup:.95,dmg:18,r:5.2,w:.5,tipTh:"รูปพัดด้านหน้าบอส ให้หลบไปด้านข้างหรือด้านหลังบอส"},slam:{id:"slam",nameTh:"กระแทกปริซึม",shape:"circle",windup:1.25,dmg:26,r:4.6,tipTh:"วงทองรอบตัวบอส ให้วิ่งออกนอกวง หรือกด ↯ ตอนวงเต็ม"},charge:{id:"charge",nameTh:"พุ่งคริสตัล",shape:"line",windup:1,dmg:24,r:18,w:4.64,tipTh:"ยืนหน้าเสาคริสตัลแล้วหลบด้านข้าง บอสจะชนเสาและมึนนาน"},shard:{id:"shard",nameTh:"ฝนผลึก",shape:"circle",windup:1,dmg:12,r:1.5,tipTh:"วงเล็กตกตามตำแหน่งคุณ ให้เคลื่อนที่ต่อเนื่อง อย่ายืนนิ่ง"}}}},Mo={bufferTicks:8,resetTicks:18,sets:{A:{dur:[12,12,18],hit:[5,5,8]},B:{dur:[13,13,20],hit:[6,6,9]},C:{dur:[15,15,22],hit:[6,6,10]}}},Pt={start:{x:0,z:1.5},walkable:[{id:"camp",type:"circle",x:0,z:0,r:7},{id:"trailA",type:"capsule",ax:0,az:-4,bx:3,bz:-29,r:3},{id:"clearing",type:"circle",x:3,z:-37,r:8.5},{id:"trailC",type:"capsule",ax:3,az:-44,bx:-2,bz:-58,r:3,gate:"clearingExit"},{id:"arenaEntry",type:"capsule",ax:-2,az:-56,bx:-2,bz:-66,r:3,gate:"arenaEntry"},{id:"arena",type:"circle",x:-2,z:-76,r:11.5}],gates:[{id:"clearingExit",x:2.6,z:-45.2,dirx:1,dirz:.25,width:6,startsOpen:!1},{id:"arenaEntry",x:-2,z:-64.2,dirx:1,dirz:0,width:6,startsOpen:!0}],spawns:[{kind:"puffcap",x:1.4,z:-16,group:"trail"},{kind:"puffcap",x:2.6,z:-24,group:"trail"},{kind:"puffcap",x:0,z:-38,group:"clearing"},{kind:"puffcap",x:6.5,z:-36,group:"clearing"},{kind:"puffcap",x:3.5,z:-41.5,group:"clearing"},{kind:"thornling",x:4,z:-40,group:"clearing"}],clearingTrigger:{x:3,z:-37,r:6.5},spring:{x:-.4,z:-52,r:2.2},boss:{x:-2,z:-80,trigger:{x:-2,z:-76,r:10.2}},pillars:[{x:-8.2,z:-70.5,r:.85},{x:4.2,z:-70.5,r:.85},{x:-8.2,z:-81.5,r:.85},{x:4.2,z:-81.5,r:.85}],autoZones:[{id:"path",nameTh:"ค่ายและทางเดิน",shapes:["camp","trailA"]},{id:"clearing",nameTh:"ลานกลาง",shapes:["clearing"]},{id:"exit",nameTh:"ทางไปลานบอส",shapes:["trailC"]}]};class Sp{constructor(e){N(this,"s");this.s=e>>>0}next(){let e=this.s=this.s+1831565813>>>0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}int(e){return Math.floor(this.next()*e)}range(e,t){return e+(t-e)*this.next()}}const vr=64,pt={ATTACK:1,DODGE:2,SKILL:4,POTION:8,RETRY:16,SKILL2:32,SKILL3:64};function cs(s,e,t){const n=i=>Math.max(-vr,Math.min(vr,Math.round(i*vr)));return{mx:n(s),mz:n(e),b:t&255}}const Wa={VERSION:0,AUTO_SET:1},bp=[0,Wa.VERSION,2,0],Tp=s=>s.length>=4&&s[0]===0&&s[1]===Wa.VERSION&&s[2]===2&&s[3]===0;class Sd{constructor(){N(this,"data",[]);N(this,"ticks",0);N(this,"v2",!1)}push(e){e.auto&&this.pushCmd(Wa.AUTO_SET,e.auto.a,e.auto.b);const t=this.data,n=t.length;n&&t[n-4]>=1&&t[n-3]===e.mx&&t[n-2]===e.mz&&t[n-1]===e.b&&t[n-4]<65535?t[n-4]++:t.push(1,e.mx,e.mz,e.b),this.ticks++}pushCmd(e,t,n){this.v2||(this.data.unshift(...bp),this.v2=!0),this.data.push(0,e,t,n)}static*iterate(e){let t;for(let n=Tp(e)?4:0;n+3<e.length;n+=4){const i=e[n]|0;if(i===0){(e[n+1]|0)===Wa.AUTO_SET&&(t={a:e[n+2]|0,b:e[n+3]|0});continue}const r=e[n+1]|0,a=e[n+2]|0,o=e[n+3]|0;for(let l=0;l<i;l++)l===0&&t?(yield{mx:r,mz:a,b:o,auto:t},t=void 0):yield{mx:r,mz:a,b:o}}}}const Ep=["normal","boss"],gl=Object.freeze({dodgeCdTicks:17,start:"normal"}),bd=s=>(s.dodgeCdTicks-.5)*$e;function wp(s){return s===.55?17:s===.87?26:s===17||s===26?s:null}function Ap(s){const e=s.get("dodgecd"),t=s.get("start");return{dodgeCdTicks:(e===null?null:wp(Number(e)))??gl.dodgeCdTicks,start:Ep.includes(t??"")?t:gl.start}}const Wt=(s,e)=>Math.sqrt(s*s+e*e),hs=(s,e,t,n)=>(s-t)*(s-t)+(e-n)*(e-n),Xt=(s,e,t,n)=>Math.sqrt(hs(s,e,t,n));function bn(s,e){const t=Wt(s,e);return t>1e-9?[s/t,e/t]:[0,1]}function Rp(s,e,t,n,i){return bn(s+(t-s)*i,e+(n-e)*i)}const Cp=[[1,0],[.9238795325,.3826834324],[.7071067812,.7071067812],[.3826834324,.9238795325],[0,1],[-.3826834324,.9238795325],[-.7071067812,.7071067812],[-.9238795325,.3826834324],[-1,0],[-.9238795325,-.3826834324],[-.7071067812,-.7071067812],[-.3826834324,-.9238795325],[0,-1],[.3826834324,-.9238795325],[.7071067812,-.7071067812],[.9238795325,-.3826834324]],Cr=["puffcap","thornling"],ls={min:4,max:20,def:8},Pp=30,Lp=90,Ip=.3,Np=1.6,Dp=2,Up=.2,Fp=.5,Td=()=>({enabled:!1,kinds:0,hall:!1,radius:ls.def,skills:[!1,!1,!1],keep:!1});function Op(s){return{a:(s.enabled?1:0)|(s.hall?2:0)|(s.skills[0]?4:0)|(s.skills[1]?8:0)|(s.skills[2]?16:0)|(s.keep?32:0),b:s.kinds&255|s.radius<<8}}function kp(s){if(!Number.isInteger(s.a)||!Number.isInteger(s.b)||s.a<0||s.a>63||s.b<0)return null;const e=s.b&255,t=s.b>>8;return e>>Cr.length||t<ls.min||t>ls.max?null:{enabled:!!(s.a&1),hall:!!(s.a&2),skills:[!!(s.a&4),!!(s.a&8),!!(s.a&16)],keep:!!(s.a&32),kinds:e,radius:t}}function zp(s,e,t){if(s.type==="circle")return hs(e,t,s.x,s.z)<=s.r*s.r;const n=s.bx-s.ax,i=s.bz-s.az;let r=((e-s.ax)*n+(t-s.az)*i)/(n*n+i*i);return r=r<0?0:r>1?1:r,hs(e,t,s.ax+n*r,s.az+i*r)<=s.r*s.r}const mh=Pt.autoZones.map(s=>s.shapes.map(e=>Pt.walkable.find(t=>t.id===e)));function Na(s,e,t){let n=0;for(let i=0;i<mh.length;i++)for(const r of mh[i])if((!r.gate||s.gates[r.gate])&&zp(r,e,t)){n|=1<<i;break}return n}const Ed=s=>!s.bossStarted&&Na(s,s.player.x,s.player.z)!==0,Bp=s=>{const e=Cr.indexOf(s);return e<0?0:1<<e},Gp=s=>s.swingT<=0&&s.dodgeT<=0&&!s.cast&&s.castT<=0&&s.drinkT<=0&&s.bufAttack<=0&&s.bufDodge<=0;class Hp{constructor(){N(this,"s",Td());N(this,"cx",0);N(this,"cz",0);N(this,"zones",0);N(this,"target",0);N(this,"best",1e9);N(this,"hpSeen",0);N(this,"stuck",0);N(this,"banned",new Map);N(this,"paused",!1);N(this,"lastB",0)}apply(e,t){const n=kp(t);if(!n)return;const i=this.s.enabled;this.s=n,!i&&n.enabled?this.start(e):i&&!n.enabled&&this.reset()}reset(){this.target=0,this.stuck=0,this.paused=!1,this.lastB=0,this.banned.clear()}start(e){this.reset(),this.cx=e.player.x,this.cz=e.player.z,this.zones=Na(e,this.cx,this.cz),this.best=1e9,this.hpSeen=0}off(e,t){this.s.enabled=!1,this.reset(),e.events.push({t:"auto-off",reason:t})}onDown(e){this.reset(),this.s.enabled&&!this.s.keep&&this.off(e,"down")}onRespawn(e){this.s.enabled&&this.start(e)}resolve(e,t){if(!this.s.enabled)return t;if(!Ed(e))return this.off(e,"boss"),t;if(t.mx!==0||t.mz!==0||t.b!==0)return this.paused=!0,this.lastB=0,t;if(this.paused){if(!Gp(e.ps))return t;this.paused=!1,this.lastB=0}return this.think(e)}kindOk(e){const t=Bp(e.kind);return t!==0&&(this.s.kinds===0||(this.s.kinds&t)!==0)}inArea(e,t){return Na(e,t.x,t.z)&this.zones?this.s.hall||Xt(t.x,t.z,this.cx,this.cz)<=this.s.radius:!1}pathOk(e,t,n,i,r){const a=Xt(t,n,i,r),o=Math.max(1,Math.ceil(a/Fp));for(let l=1;l<=o;l++){const c=l/o;if(!(Na(e,t+(i-t)*c,n+(r-n)*c)&this.zones))return!1}return!0}eligible(e,t){return!t.alive||!this.kindOk(t)||(this.banned.get(t.id)??0)>e.tick||!this.inArea(e,t)?!1:this.pathOk(e,e.player.x,e.player.z,t.x,t.z)}pick(e){let t=null,n=1e18;const i=e.player;for(const r of e.actors){if(r.kind==="player"||!this.eligible(e,r))continue;const a=hs(r.x,r.z,i.x,i.z);(a<n||a===n&&t!==null&&r.id<t.id)&&(n=a,t=r)}return t}think(e){const t=e.player,n=e.ps;let i=this.target?e.actors.find(p=>p.id===this.target)??null:null;if(i&&!this.eligible(e,i)&&(i=null,this.target=0),!i)i=this.pick(e),i&&(this.target=i.id,this.best=Xt(i.x,i.z,t.x,t.z),this.hpSeen=i.hp,this.stuck=0);else{const p=Xt(i.x,i.z,t.x,t.z);p<this.best-.02||i.hp<this.hpSeen?this.stuck=0:!n.cast&&n.castT<=0&&this.stuck++,p<this.best&&(this.best=p),this.hpSeen=i.hp,this.stuck>=Pp&&(this.banned.set(i.id,e.tick+Lp),this.target=0,this.stuck=0,i=null)}if(!i){if(this.lastB=0,Xt(t.x,t.z,this.cx,this.cz)>Ip&&this.pathOk(e,t.x,t.z,this.cx,this.cz)){const[p,x]=bn(this.cx-t.x,this.cz-t.z);return cs(p,x,0)}return cs(0,0,0)}const r=Xt(i.x,i.z,t.x,t.z),[a,o]=bn(i.x-t.x,i.z-t.z),l=r>i.r+Np?1:Up,c=cs(a*l,o*l,0),[h,u]=bn(c.mx,c.mz);let d=0;return!n.cast&&n.castT<=0&&n.dodgeT<=0&&n.drinkT<=0&&(this.s.skills[0]||this.s.skills[1]||this.s.skills[2])&&(d=this.skillChoice(e,h,u)),!d&&r<=i.r+Dp&&(d=pt.ATTACK),c.b=d&~this.lastB,this.lastB=c.b,c}skillChoice(e,t,n){const i=e.player,r=e.ps,a=this.s.skills,o=e.actors.filter(l=>l.kind!=="player"&&l.alive&&this.kindOk(l)&&this.inArea(e,l));if(a[0]&&r.skillCd<=0){const l=wt[0];if(o.some(c=>c.state==="windup"&&c.st>Yi.skill.cast+2*$e&&Xt(c.x,c.z,i.x,i.z)<=l.radius+c.r))return pt.SKILL}if(a[2]&&r.cdT[2]<=0){const l=wt[2],c=i.x+t*l.ahead,h=i.z+n*l.ahead;if(o.filter(u=>Xt(u.x,u.z,c,h)<=l.radius+u.r).length>=2)return pt.SKILL3}if(a[1]&&r.cdT[1]<=0){const l=wt[1];if(o.some(c=>{const h=Xt(c.x,c.z,i.x,i.z);return h<=l.radius+c.r&&(h<1e-6||((c.x-i.x)*t+(c.z-i.z)*n)/h>=l.cosHalf)}))return pt.SKILL2}return 0}}const Vp="combat-1",Wp="combat-2";function Xp(s){const e=(s.get("combo")??"").toUpperCase();return e==="1"?"combat-1":e==="A"||e==="B"||e==="C"?`combo-${e}`:Wp}function wd(s){if(s==="combat-1")return null;const e=Mo.sets[s==="combat-2"?"A":s.slice(-1)];return{bufferTicks:Mo.bufferTicks,resetTicks:Mo.resetTicks,dur:e.dur,hit:e.hit}}function xl(s){return Array.isArray(s)?"["+s.map(xl).join(",")+"]":s&&typeof s=="object"?"{"+Object.keys(s).sort().map(e=>JSON.stringify(e)+":"+xl(s[e])).join(",")+"}":JSON.stringify(s)}function gh(s,e){for(let t=0;t<s.length;t++)e^=s.charCodeAt(t),e=Math.imul(e,16777619)>>>0;return e>>>0}function qp(s){const e=xl({r:s,TICK:$e,PLAYER:Yi,ENEMIES:Kn,SKILLS:wt,ULT:yd,CONE_INNER_R:fc,combo:wd(s)});return gh(e,2166136261).toString(16).padStart(8,"0")+gh(e,2654435761).toString(16).padStart(8,"0")}const ht=Yi;class Kp{constructor(e,t=gl,n=Vp){N(this,"tick",0);N(this,"rng");N(this,"actors",[]);N(this,"player");N(this,"tele",[]);N(this,"events",[]);N(this,"gates",{});N(this,"pillars",Pt.pillars.map(e=>({...e,alive:!0})));N(this,"boss");N(this,"bossStarted",!1);N(this,"phase",1);N(this,"bossNext",null);N(this,"p2Moves",0);N(this,"clearingTriggered",!1);N(this,"checkpoint",{id:"camp",x:Pt.start.x,z:Pt.start.z});N(this,"finished",!1);N(this,"victory",!1);N(this,"stats",{damageTaken:0,perfect:0,deaths:0,dodges:0,potionsUsed:0,hitsLanded:0});N(this,"ps",{combo:-1,swingT:0,swingDur:0,hitAt:0,hitDone:!0,comboTimer:0,swingTk:0,swingLen:0,hitTk:0,bufAttack:0,bufDodge:0,dodgeT:0,dodgeCd:0,iframes:0,dashx:0,dashz:1,skillCd:0,castT:0,potions:ht.potion.charges,drinkT:0,empowered:!1,down:!1,downT:0,cause:null,moving:!1,cast:null,cdT:[0,0,0]});N(this,"seenAtk",new Set);N(this,"atkToken",new Map);N(this,"prevB",0);N(this,"nextId",1);N(this,"hints",new Set);N(this,"auto",new Hp);N(this,"seed");N(this,"variant");N(this,"ruleset");N(this,"tc");this.seed=e,this.ruleset=n,this.tc=wd(n),this.variant=t,this.rng=new Sp(e);for(const r of Pt.gates)this.gates[r.id]=r.startsOpen;this.player=this.mkActor("player",Pt.start.x,Pt.start.z,ht.radius,ht.maxHp,"player"),this.player.fz=-1;for(const r of Pt.spawns){const a=Kn[r.kind];this.mkActor(r.kind,r.x,r.z,a.radius,a.maxHp,r.group)}const i=Kn.prismback;this.boss=this.mkActor("prismback",Pt.boss.x,Pt.boss.z,i.radius,i.maxHp,"boss"),this.boss.fz=1,t.start==="boss"&&this.startAtBoss(),this.hint("move")}startAtBoss(){for(const t of this.actors)t.kind!=="player"&&t.kind!=="prismback"&&(t.alive=!1,t.hp=0);this.clearingTriggered=!0,this.gates.clearingExit=!0;const e=Pt.spring;this.checkpoint={id:"spring",x:e.x,z:e.z+1.2},this.player.x=this.checkpoint.x,this.player.z=this.checkpoint.z,this.player.fx=0,this.player.fz=-1}mkActor(e,t,n,i,r,a){const o={id:this.nextId++,kind:e,x:t,z:n,fx:0,fz:1,r:i,hp:r,maxHp:r,alive:!0,active:!1,state:"idle",st:0,group:a,sx:t,sz:n,tx:t,tz:n,ox:t,oz:n,dx:0,dz:1,travel:0,hitDone:!1,atk:"",lastAtk:"",repeat:0,flinch:0,deadT:0};return this.actors.push(o),o}hint(e){this.hints.has(e)||(this.hints.add(e),this.events.push({t:"hint",id:e}))}step(e){if(this.events=this.events.length&&this.tick===0?this.events:[],this.finished)return this.events;e.auto&&this.auto.apply(this,e.auto),this.ps.down||(e=this.auto.resolve(this,e));const t=e.b&~this.prevB;this.prevB=e.b;const n=this.ps;if(n.down)return n.downT+=$e,t&pt.RETRY&&n.downT>.8&&this.respawn(),this.tick++,this.events;this.updatePlayer(e,t);for(const i of this.actors)if(i.kind!=="player"){if(!i.alive){i.deadT+=$e;continue}i.flinch>0&&(i.flinch-=$e),i.kind==="puffcap"?this.puffcap(i):i.kind==="thornling"?this.thornling(i):this.prismback(i)}return this.updateTelegraphs(),this.resolveCollisions(),this.triggers(),this.tick++,this.events}updatePlayer(e,t){const n=this.ps,i=this.player;let r=e.mx/vr,a=e.mz/vr;const o=Wt(r,a);o>1&&(r/=o,a/=o),n.moving=o>.15,n.dodgeCd-=$e,n.skillCd-=$e,n.iframes-=$e,n.bufDodge-=$e;const l=this.tc;if(l?(n.comboTimer--,n.bufAttack--,n.swingT>0&&(n.swingTk++,n.swingT=n.swingTk>=n.swingLen?0:(n.swingLen-n.swingTk)*$e)):(n.comboTimer-=$e,n.bufAttack-=$e),n.cdT[1]>0&&n.cdT[1]--,n.cdT[2]>0&&n.cdT[2]--,n.cast&&(n.cast.tick++,n.cast.slot!==1&&(n.cast.tick===n.cast.hitTick&&this.resolveCast(n.cast),n.cast.tick>=n.cast.endTick&&(n.cast=null))),t&pt.ATTACK&&(n.bufAttack=l?l.bufferTicks:ht.inputBufferS),t&pt.DODGE&&(n.bufDodge=.2),n.bufDodge>0&&n.dodgeCd<=0&&n.castT<=0){const[d,f]=n.moving?bn(r,a):[i.fx,i.fz];n.dashx=d,n.dashz=f,n.dodgeT=ht.dodge.dur,n.iframes=ht.dodge.iframes,n.dodgeCd=bd(this.variant),n.swingT=0,n.drinkT=0,n.bufDodge=0,i.fx=d,i.fz=f,n.cast&&(n.cast.tick<n.cast.hitTick&&this.events.push({t:"skill-cancel",slot:n.cast.slot}),n.cast=null),this.seenAtk.clear();for(const p of this.tele)this.seenAtk.add(p.id);for(const p of this.actors)if(p.alive&&(p.state==="rush"||p.state==="charge")){const x=this.atkToken.get(p.id);x!==void 0&&this.seenAtk.add(x)}this.stats.dodges++,this.events.push({t:"dodge"})}t&pt.SKILL&&n.skillCd<=0&&n.dodgeT<=0&&n.castT<=0&&!n.cast&&(n.castT=ht.skill.cast,n.skillCd=ht.skill.cooldown,n.swingT=0,n.drinkT=0,this.beginCast(1,i.fx,i.fz),this.events.push({t:"skill"}));for(const d of[2,3])if(t&(d===2?pt.SKILL2:pt.SKILL3)&&n.cdT[d-1]<=0&&n.dodgeT<=0&&n.castT<=0&&!n.cast){const[f,p]=n.moving?bn(r,a):[i.fx,i.fz];i.fx=f,i.fz=p,n.swingT=0,n.drinkT=0,n.cdT[d-1]=wt[d-1].cdTicks,this.beginCast(d,f,p)}t&pt.POTION&&n.potions>0&&i.hp<i.maxHp&&n.drinkT<=0&&n.castT<=0&&!n.cast&&(n.drinkT=ht.potion.dur,n.potions--,this.stats.potionsUsed++,this.events.push({t:"potion"}));const c=n.swingT>0?1-n.swingT/n.swingDur:1;if(n.bufAttack>0&&n.dodgeT<=0&&n.castT<=0&&!n.cast&&n.drinkT<=0&&(l?n.swingT<=0:c>=.62)){const d=n.comboTimer>0&&n.combo<2?n.combo+1:0;if(l)n.combo=d,n.swingLen=l.dur[d],n.hitTk=l.hit[d],n.swingTk=0,n.hitDone=!1,n.swingT=n.swingLen*$e,n.swingDur=n.swingLen*$e,n.hitAt=n.hitTk/n.swingLen,n.comboTimer=n.swingLen+l.resetTicks,n.bufAttack=0;else{const p=ht.combo[d];n.combo=d,n.swingT=p.dur,n.swingDur=p.dur,n.hitAt=p.hitAt,n.hitDone=!1,n.comboTimer=p.dur+ht.comboResetS,n.bufAttack=0}const f=this.nearestEnemy(i.x,i.z,ht.autoAimRange);if(f){const[p,x]=bn(f.x-i.x,f.z-i.z);i.fx=p,i.fz=x}else if(n.moving){const[p,x]=bn(r,a);i.fx=p,i.fz=x}this.events.push({t:"swing",step:d})}let h=0,u=0;if(n.dodgeT>0)n.dodgeT-=$e,h=n.dashx*ht.dodge.speed,u=n.dashz*ht.dodge.speed;else if(n.castT<=0&&!n.cast){let d=ht.speed;if(n.swingT>0&&(d*=ht.attackMoveMul),n.drinkT>0&&(d*=.4),h=r*d,u=a*d,n.moving&&n.swingT<=0){const[f,p]=bn(r,a);i.fx=f,i.fz=p}}if(i.x+=h*$e,i.z+=u*$e,n.swingT>0&&(l||(n.swingT-=$e),!n.hitDone&&(l?n.swingTk>=n.hitTk:1-n.swingT/n.swingDur>=n.hitAt))){n.hitDone=!0;const d=ht.combo[n.combo];let f=!1;for(const p of this.actors){if(p.kind==="player"||!p.alive||p.kind==="prismback"&&!this.bossStarted)continue;const x=p.x-i.x,m=p.z-i.z,g=Wt(x,m);g>d.range+p.r||g>p.r+.6&&(x*i.fx+m*i.fz)/g<ht.arcCos||(this.damageEnemy(p,d.dmg,n.empowered),f=!0,p.kind!=="prismback"&&g>1e-6&&this.knock(p,x/g,m/g,.35))}f&&n.empowered&&(n.empowered=!1)}if(n.castT>0&&(n.castT-=$e,n.castT<=0)){let d=0;for(const p of this.actors)p.kind==="player"||!p.alive||p.kind==="prismback"&&!this.bossStarted||Xt(p.x,p.z,i.x,i.z)>ht.skill.radius+p.r||(this.damageEnemy(p,ht.skill.dmg,n.empowered),d++,p.kind!=="prismback"&&p.alive&&p.state==="windup"&&this.interrupt(p));n.empowered=!1;const f=n.cast;this.events.push({t:"skill-hit",slot:1,x:f?f.x:i.x,z:f?f.z:i.z,dx:f?f.dx:i.fx,dz:f?f.dz:i.fz,hits:d}),n.cast=null}if(n.drinkT>0&&(n.drinkT-=$e,n.drinkT<=0)){const d=Math.min(ht.potion.heal,i.maxHp-i.hp);i.hp+=d,this.events.push({t:"heal",amount:d})}}beginCast(e,t,n){const i=wt[e-1],r=this.player;this.ps.cast={slot:e,tick:0,hitTick:i.hitTick,endTick:i.endTick,x:r.x,z:r.z,dx:t,dz:n},this.events.push({t:"skill-start",slot:e,x:r.x,z:r.z,dx:t,dz:n})}resolveCast(e){const t=this.ps,n=wt[e.slot-1];let i=0;const r=e.slot===3?e.x+e.dx*(n.ahead??0):e.x,a=e.slot===3?e.z+e.dz*(n.ahead??0):e.z;for(const o of this.actors){if(o.kind==="player"||!o.alive||o.kind==="prismback"&&!this.bossStarted)continue;const l=o.x-r,c=o.z-a,h=Wt(l,c);h>n.radius+o.r||e.slot===2&&h>1e-6&&(l*e.dx+c*e.dz)/h<(n.cosHalf??0)||(this.damageEnemy(o,n.dmg,t.empowered),i++)}t.empowered=!1,this.events.push({t:"skill-hit",slot:e.slot,x:e.x,z:e.z,dx:e.dx,dz:e.dz,hits:i})}skillCooldown(e){if(e===1)return{remaining:this.ps.skillCd,total:ht.skill.cooldown};const t=wt[e-1].cdTicks;return{remaining:this.ps.cdT[e-1]*$e,total:t*$e}}nearestEnemy(e,t,n){let i=null,r=1e9;for(const a of this.actors){if(a.kind==="player"||!a.alive||!a.active)continue;const o=Xt(a.x,a.z,e,t)-a.r;o<n&&o<r&&(r=o,i=a)}return i}damageEnemy(e,t,n){let i=n?ht.perfect.critMul:1;e.kind==="prismback"&&e.state==="stunned"&&(i*=Kn.prismback.stunDmgMul);const r=Math.round(t*i);e.hp-=r,e.flinch=.15,this.stats.hitsLanded++,!e.active&&e.kind!=="prismback"&&(e.active=!0,e.state==="idle"&&(e.state="approach",e.st=0)),this.events.push({t:"hit",target:e.id,amount:r,x:e.x,z:e.z,crit:i>1,byPlayer:!0}),e.hp<=0&&this.kill(e)}kill(e){e.hp=0,e.alive=!1,e.deadT=0,e.state="dead",this.tele=this.tele.filter(t=>t.owner!==e.id),this.events.push({t:"death",id:e.id}),e.kind==="prismback"&&(this.victory=!0,this.finished=!0,this.events.push({t:"victory"}))}interrupt(e){this.tele=this.tele.filter(t=>t.owner!==e.id),e.state="recover",e.st=.8,this.events.push({t:"interrupt",id:e.id})}knock(e,t,n,i){e.state==="rush"||e.state==="hop"||(e.x+=t*i,e.z+=n*i)}hurtPlayer(e,t,n,i=null){const r=this.ps,a=this.player;if(!r.down){if(r.iframes>0){this.stats.perfect++,r.empowered=!0,r.skillCd-=ht.perfect.skillCdRefund,this.events.push({t:"perfect",x:a.x,z:a.z}),this.hint("perfect");return}a.hp-=e,this.stats.damageTaken+=e,r.cause={enemyTh:t,attackTh:n.nameTh,tipTh:n.tipTh,attackId:n.id},this.events.push({t:"hit",target:a.id,amount:e,x:a.x,z:a.z,crit:!1,byPlayer:!1}),i!==null&&this.seenAtk.has(i)&&this.events.push({t:"dodge-early",x:a.x,z:a.z}),a.hp<=0&&(r.cast&&r.cast.tick<r.cast.hitTick&&this.events.push({t:"skill-cancel",slot:r.cast.slot}),r.cast=null,a.hp=0,r.down=!0,r.downT=0,this.stats.deaths++,this.tele=[],this.auto.onDown(this),this.events.push({t:"player-down",cause:r.cause}))}}respawn(){const e=this.ps,t=this.player;e.down=!1,t.hp=t.maxHp,e.potions=ht.potion.charges,e.swingT=0,e.dodgeT=0,e.castT=0,e.drinkT=0,e.skillCd=0,e.dodgeCd=0,e.empowered=!1,e.cast=null,e.cdT=[0,0,0],this.seenAtk.clear(),t.x=this.checkpoint.x,t.z=this.checkpoint.z,t.fx=0,t.fz=-1,this.tele=[];for(const n of this.actors)n.kind==="player"||!n.alive||(n.x=n.sx,n.z=n.sz,n.hp=n.maxHp,n.state="idle",n.st=0,n.active=!1,n.fx=0,n.fz=1);if(this.bossStarted){this.bossStarted=!1,this.phase=1,this.bossNext=null,this.p2Moves=0,this.gates.arenaEntry=!0;for(const n of this.pillars)n.alive=!0;this.events.push({t:"gate",id:"arenaEntry",open:!0})}this.clearingTriggered&&this.actors.some(n=>n.group==="clearing"&&n.alive)&&(this.clearingTriggered=!1),this.auto.onRespawn(this),this.events.push({t:"respawn",at:this.checkpoint.id})}addTele(e,t,n,i,r,a,o,l,c){const h={id:this.nextId++,owner:e.id,atk:n,enemyTh:t,shape:n.shape,x:i,z:r,dx:a,dz:o,r:n.r,w:n.w??0,cos:n.shape==="cone"?n.w??.5:0,t:l,total:l,area:c};return this.tele.push(h),c||this.atkToken.set(e.id,h.id),this.events.push({t:"telegraph",id:h.id}),this.hint("dodge"),h}chase(e,t,n){const i=this.player,r=i.x-e.x,a=i.z-e.z,o=Wt(r,a);return o>1e-6&&([e.fx,e.fz]=Rp(e.fx,e.fz,r/o,a/o,.25)),o>n&&(e.x+=r/o*t*$e,e.z+=a/o*t*$e),o}aggroCheck(e,t){return e.active?!0:(Xt(e.x,e.z,this.player.x,this.player.z)<t&&(e.group!=="clearing"||this.clearingTriggered)&&(e.active=!0,e.state="approach",e.st=0,this.hint("attack")),e.active)}puffcap(e){const t=Kn.puffcap,n=t.attacks.hop;if(e.state==="idle"){this.aggroCheck(e,t.aggro);return}if(e.st-=$e,e.state==="approach"){if(this.chase(e,t.speed,t.attackRange*.8)<t.attackRange&&e.flinch<=0){const[r,a]=this.clampWalk(this.player.x,this.player.z,e.r);e.tx=r,e.tz=a,e.ox=e.x,e.oz=e.z,e.state="windup",e.st=n.windup-.3,this.addTele(e,t.nameTh,n,r,a,0,1,n.windup,!0)}}else if(e.state==="windup")e.st<=0&&(e.state="hop",e.st=.3,e.ox=e.x,e.oz=e.z);else if(e.state==="hop"){const i=1-Math.max(0,e.st)/.3;e.x=e.ox+(e.tx-e.ox)*i,e.z=e.oz+(e.tz-e.oz)*i,e.st<=0&&(e.state="recover",e.st=t.recover,this.hint("counter"))}else e.state==="recover"&&e.st<=0&&(e.state="approach")}thornling(e){const t=Kn.thornling,n=t.attacks.rush;if(e.state==="idle"){this.aggroCheck(e,t.aggro);return}if(e.st-=$e,e.state==="approach"){if(this.chase(e,t.speed,4)<t.attackRange&&e.flinch<=0){const[r,a]=bn(this.player.x-e.x,this.player.z-e.z);e.dx=r,e.dz=a,e.fx=r,e.fz=a,e.state="windup",e.st=n.windup,this.addTele(e,t.nameTh,n,e.x,e.z,r,a,n.windup,!1),this.hint("line")}}else if(e.state==="windup")e.st<=0&&(e.state="rush",e.st=n.r/t.rushSpeed,e.hitDone=!1);else if(e.state==="rush"){const i=e.x+e.dx*t.rushSpeed*$e,r=e.z+e.dz*t.rushSpeed*$e,[a,o]=this.clampWalk(i,r,e.r);e.x=a,e.z=o,!e.hitDone&&Xt(e.x,e.z,this.player.x,this.player.z)<e.r+ht.radius&&(e.hitDone=!0,this.hurtPlayer(n.dmg,t.nameTh,n,this.atkToken.get(e.id)??null)),(e.st<=0||hs(a,o,i,r)>.01)&&(e.state="recover",e.st=t.recover,this.atkToken.delete(e.id),this.hint("counter"))}else e.state==="recover"&&e.st<=0&&(e.state="approach")}prismback(e){const t=Kn.prismback,n=t.attacks;if(!this.bossStarted)return;const i=this.phase===2?t.windupMulP2:1;e.st-=$e;const r=this.player;switch(e.state){case"intro":e.st<=0&&(e.state="approach",e.st=.6);break;case"roar":e.st<=0&&(e.state="approach",e.st=.4);break;case"approach":{const a=this.chase(e,this.phase===2?t.speedP2:t.speed,3.4);e.st<=0&&this.bossChoose(e,a,i);break}case"windup":e.st<=0&&(e.atk==="charge"?(e.state="charge",e.travel=0,e.hitDone=!1):(e.state="recover",e.st=e.atk==="slam"?1:.7));break;case"cast":e.st<=0&&(e.state="recover",e.st=.6,this.phase===2&&t.p2FollowCharge&&this.pillars.some(a=>a.alive)&&(this.bossNext="charge",this.hint("pillarP2")));break;case"charge":{const a=t.chargeSpeed*$e;e.x+=e.dx*a,e.z+=e.dz*a,e.travel+=a,!e.hitDone&&Xt(e.x,e.z,r.x,r.z)<e.r+ht.radius&&(e.hitDone=!0,this.hurtPlayer(n.charge.dmg,t.nameTh,n.charge,this.atkToken.get(e.id)??null));for(let h=0;h<this.pillars.length;h++){const u=this.pillars[h];if(u.alive&&Xt(e.x,e.z,u.x,u.z)<e.r+u.r){u.alive=!1,this.atkToken.delete(e.id),e.state="stunned",e.st=t.stunPillar,this.events.push({t:"pillar-break",i:h},{t:"stun",id:e.id,long:!0});return}}const[o,l]=this.clampArena(e.x,e.z,e.r),c=hs(o,l,e.x,e.z)>1e-4;e.x=o,e.z=l,(c||e.travel>=n.charge.r)&&(this.atkToken.delete(e.id),e.state="stunned",e.st=t.stunMiss,this.events.push({t:"stun",id:e.id,long:!1}));break}case"stunned":e.st<=0&&(e.state="recover",e.st=.3);break;case"recover":if(e.st<=0)if(this.phase===1&&e.hp<=e.maxHp*t.phase2At){if(this.phase=2,e.state="roar",e.st=t.roar,this.pillars.some(a=>!a.alive)){for(const a of this.pillars)a.alive=!0;this.events.push({t:"pillars-regrow"})}this.events.push({t:"boss-phase"}),this.hint("phase2")}else e.state="approach",e.st=this.rng.range(.5,1.2)*(this.phase===2?.75:1);break}}bossChoose(e,t,n){const i=Kn.prismback,r=i.attacks,a=this.player,o=[];t<5.2?(o.push(["sweep",3],["slam",2]),this.phase===2&&o.push(["shard",1])):(o.push(["charge",t>7?3:1]),this.phase===2&&o.push(["shard",2]),t<7.5&&o.push(["slam",1]));let l=o.filter(([x])=>!(x===e.lastAtk&&e.repeat>=1));l.length||(l=o);let c=0;for(const[,x]of l)c+=x;let h=this.rng.next()*c,u=l[0][0];for(const[x,m]of l){if(h<m){u=x;break}h-=m}const d=this.bossNext!==null;d?(u=this.bossNext,this.bossNext=null):this.phase===2&&++this.p2Moves>=i.p2ShardEvery&&(u="shard"),u==="shard"&&(this.p2Moves=0),e.repeat=u===e.lastAtk?e.repeat+1:0,e.lastAtk=u,e.atk=u;const[f,p]=bn(a.x-e.x,a.z-e.z);if(u==="sweep"){e.fx=f,e.fz=p;const x=r.sweep.windup*n;this.addTele(e,i.nameTh,r.sweep,e.x,e.z,f,p,x,!0),e.state="windup",e.st=x}else if(u==="slam"){const x=r.slam.windup*n;this.addTele(e,i.nameTh,r.slam,e.x,e.z,0,1,x,!0),e.state="windup",e.st=x}else if(u==="charge"){e.fx=f,e.fz=p,e.dx=f,e.dz=p;const x=d?i.followChargeWindup:r.charge.windup*n;this.addTele(e,i.nameTh,r.charge,e.x,e.z,f,p,x,!1),e.state="windup",e.st=x}else{for(let m=0;m<5;m++){let g=a.x,v=a.z;if(m>0){const S=Cp[this.rng.int(16)];g+=S[0]*2.4,v+=S[1]*2.4}const[y,_]=this.clampArena(g,v,.5);this.addTele(e,i.nameTh,r.shard,y,_,0,1,(r.shard.windup+m*i.shardStagger)*n,!0)}e.state="cast",e.st=.9}}updateTelegraphs(){const e=this.player,t=[];for(const n of this.tele){if(n.t-=$e,n.t>0){t.push(n);continue}if(n.area&&this.insideTele(n,e.x,e.z,ht.radius*.5)&&this.hurtPlayer(n.atk.dmg,n.enemyTh,n.atk,n.id),this.ps.down)return}this.tele=t}insideTele(e,t,n,i){const r=t-e.x,a=n-e.z;if(e.shape==="circle")return r*r+a*a<=(e.r+i)*(e.r+i);if(e.shape==="cone"){const c=Wt(r,a);return c>e.r+i?!1:c<fc?!0:(r*e.dx+a*e.dz)/c>=e.cos}const o=r*e.dx+a*e.dz;return o<-i||o>e.r+i?!1:Math.abs(r*-e.dz+a*e.dx)<=e.w/2+i}shapeOpen(e){return!e.gate||this.gates[e.gate]}clampWalk(e,t,n){let i=e,r=t,a=1e18;for(const o of Pt.walkable){if(!this.shapeOpen(o))continue;let l,c;if(o.type==="circle")l=o.x,c=o.z;else{const g=o.bx-o.ax,v=o.bz-o.az;let y=((e-o.ax)*g+(t-o.az)*v)/(g*g+v*v);y=y<0?0:y>1?1:y,l=o.ax+g*y,c=o.az+v*y}const h=o.r-n,u=e-l,d=t-c,f=Wt(u,d);if(f<=h)return[e,t];const p=l+u/f*h,x=c+d/f*h,m=hs(p,x,e,t);m<a&&(a=m,i=p,r=x)}return[i,r]}clampArena(e,t,n){const i=Pt.walkable.find(c=>c.id==="arena");if(i.type!=="circle")return[e,t];const r=e-i.x,a=t-i.z,o=Wt(r,a),l=i.r-n;return o<=l?[e,t]:[i.x+r/o*l,i.z+a/o*l]}resolveCollisions(){const e=this.player;for(const t of this.actors){if(t.kind==="player"||!t.alive||t.state==="hop")continue;const n=e.x-t.x,i=e.z-t.z,r=Wt(n,i),a=e.r+t.r;if(r<a&&r>1e-6){const o=a-r;t.kind==="prismback"?(e.x+=n/r*o,e.z+=i/r*o):(e.x+=n/r*o*.5,e.z+=i/r*o*.5,t.x-=n/r*o*.5,t.z-=i/r*o*.5)}t.kind==="prismback"?(this.pushFromPillars(t),[t.x,t.z]=this.clampArena(t.x,t.z,t.r)):[t.x,t.z]=this.clampWalk(t.x,t.z,t.r)}this.pushFromPillars(e),[e.x,e.z]=this.clampWalk(e.x,e.z,e.r)}pushFromPillars(e){if(!(e.kind==="prismback"&&e.state==="charge"))for(const t of this.pillars){if(!t.alive)continue;const n=e.x-t.x,i=e.z-t.z,r=Wt(n,i),a=e.r+t.r;r<a&&r>1e-6&&(e.x=t.x+n/r*a,e.z=t.z+i/r*a)}}triggers(){const e=this.player,t=Pt;if(!this.clearingTriggered&&Xt(e.x,e.z,t.clearingTrigger.x,t.clearingTrigger.z)<t.clearingTrigger.r){this.clearingTriggered=!0;for(const i of this.actors)i.group==="clearing"&&i.alive&&(i.active=!0,i.state="approach",i.st=0);this.hint("skill")}if(!this.gates.clearingExit&&!this.actors.some(i=>i.group==="clearing"&&i.alive)&&(this.gates.clearingExit=!0,this.events.push({t:"gate",id:"clearingExit",open:!0})),Xt(e.x,e.z,t.spring.x,t.spring.z)<t.spring.r){if(this.checkpoint.id!=="spring"&&(this.checkpoint={id:"spring",x:t.spring.x,z:t.spring.z+1.2},this.events.push({t:"checkpoint",id:"spring"}),this.hint("spring")),e.hp<e.maxHp){const i=Math.min(2,e.maxHp-e.hp);e.hp+=i}this.ps.potions=ht.potion.charges}const n=t.boss.trigger;if(!this.bossStarted&&this.boss.alive&&Xt(e.x,e.z,n.x,n.z)<n.r){this.bossStarted=!0,this.gates.arenaEntry=!1;const i=this.boss;i.active=!0,i.state="intro",i.st=1.6,i.x=i.sx,i.z=i.sz,i.hp=i.maxHp,this.events.push({t:"gate",id:"arenaEntry",open:!1},{t:"boss-start"}),this.hint("pillar")}}summary(){return{victory:this.victory,ticks:this.tick,seconds:this.tick*$e,...this.stats,bossHpLeft:this.boss.hp,phase:this.phase}}}const Da={S:{damage:60,seconds:180},A:{damage:150}};function Ad(s){return s.victory?s.deaths===0&&s.damageTaken<=Da.S.damage&&s.seconds<=Da.S.seconds?"S":s.deaths===0&&s.damageTaken<=Da.A.damage?"A":s.deaths<=1?"B":"C":"C"}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const pc="187",Yp=0,xh=1,$p=2,Mr=1,Jp=2,dr=3,$i=0,Tn=1,pn=2,Us=0,yr=1,Pi=2,_h=3,vh=4,Zp=5,Ns=100,Qp=101,jp=102,em=103,tm=104,nm=200,im=201,sm=202,rm=203,Rd=204,Cd=205,am=206,om=207,lm=208,cm=209,hm=210,um=211,dm=212,fm=213,pm=214,_l=0,vl=1,Ml=2,Pr=3,yl=4,Sl=5,bl=6,Tl=7,mc=0,mm=1,gm=2,Ri=0,Pd=1,Ld=2,Id=3,Nd=4,Dd=5,Ud=6,gc=7,Mh="attached",xm="detached",Fd=300,Bs=301,Lr=302,yo=303,So=304,Ji=1e3,hi=1001,Xa=1002,Kt=1003,Od=1004,fr=1005,ln=1006,Ua=1007,Jn=1008,Pn=1009,kd=1010,zd=1011,Ir=1012,xc=1013,fi=1014,Gn=1015,pi=1016,_c=1017,vc=1018,Gs=1020,Bd=35902,Gd=35899,Hd=1021,Vd=1022,Zn=1023,Zi=1026,Xi=1027,Mc=1028,yc=1029,fs=1030,Sc=1031,bc=1033,Fa=33776,Oa=33777,ka=33778,za=33779,El=35840,wl=35841,Al=35842,Rl=35843,Cl=36196,Pl=37492,Ll=37496,Il=37488,Nl=37489,qa=37490,Dl=37491,Ul=37808,Fl=37809,Ol=37810,kl=37811,zl=37812,Bl=37813,Gl=37814,Hl=37815,Vl=37816,Wl=37817,Xl=37818,ql=37819,Kl=37820,Yl=37821,$l=36492,Jl=36494,Zl=36495,Ql=36283,jl=36284,Ka=36285,ec=36286,Nr=2300,Dr=2301,bo=2302,yh=2303,Sh=2400,bh=2401,Th=2402,_m=2500,vm=0,Wd=1,tc=2,Mm=3200,Ya=0,ym=1,Vi="",Dt="srgb",Ln="srgb-linear",$a="linear",ut="srgb",To=7680,Sm=519,bm=512,Tm=513,Em=514,Xd=515,wm=516,Am=517,qd=518,Kd=519,Yd=35044,Ja=35048,Eh="300 es",Qn=2e3,Ur=2001;function Rm(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Cm(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Fr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Pm(){const s=Fr("canvas");return s.style.display="block",s}const wh={};function Za(...s){const e="THREE."+s.shift();console.log(e,...s)}function $d(s){const e=s[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=s[1];t&&t.isStackTrace?s[0]+=" "+t.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function Ce(...s){s=$d(s);const e="THREE."+s.shift();{const t=s[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...s)}}function Be(...s){s=$d(s);const e="THREE."+s.shift();{const t=s[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...s)}}function Fs(...s){const e=s.join(" ");e in wh||(wh[e]=!0,Ce(...s))}function Lm(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const Im={[_l]:_l,[Ml]:bl,[yl]:yl,[Pr]:Sl,[vl]:vl,[bl]:Ml,[Tl]:Tl,[Sl]:Pr};class xs{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const i=n[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,e);e.target=null}}}const dn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Ah=1234567;const Sr=Math.PI/180,Hs=180/Math.PI;function ti(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(dn[s&255]+dn[s>>8&255]+dn[s>>16&255]+dn[s>>24&255]+"-"+dn[e&255]+dn[e>>8&255]+"-"+dn[e>>16&15|64]+dn[e>>24&255]+"-"+dn[t&63|128]+dn[t>>8&255]+"-"+dn[t>>16&255]+dn[t>>24&255]+dn[n&255]+dn[n>>8&255]+dn[n>>16&255]+dn[n>>24&255]).toLowerCase()}function Je(s,e,t){return Math.max(e,Math.min(t,s))}function Tc(s,e){return(s%e+e)%e}function Nm(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function Dm(s,e,t){return s!==e?(t-s)/(e-s):0}function br(s,e,t){return(1-t)*s+t*e}function Um(s,e,t,n){return br(s,e,1-Math.exp(-t*n))}function Fm(s,e=1){return e-Math.abs(Tc(s,e*2)-e)}function Om(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function km(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function zm(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Bm(s,e){return s+Math.random()*(e-s)}function Gm(s){return s*(.5-Math.random())}function Hm(s){s!==void 0&&(Ah=s);let e=Ah+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Vm(s){return s*Sr}function Wm(s){return s*Hs}function Xm(s){return s>0&&Number.isInteger(s)&&2**Math.round(Math.log2(s))===s}function qm(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Jd(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Km(s,e,t,n,i){const r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),f=r((n-e)/2),p=a((n-e)/2);switch(i){case"XYX":s.set(o*h,l*u,l*d,o*c);break;case"YZY":s.set(l*d,o*h,l*u,o*c);break;case"ZXZ":s.set(l*u,l*d,o*h,o*c);break;case"XZX":s.set(o*h,l*p,l*f,o*c);break;case"YXY":s.set(l*f,o*h,l*p,o*c);break;case"ZYZ":s.set(l*p,l*f,o*h,o*c);break;default:Ce("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function lo(s){switch(s.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Ec(s,e){if(e.constructor===Float32Array)return s;const t=lo(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(s/t,-1)}function wc(s,e){if(e.constructor===Float32Array)return s;const t=lo(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(s*t)}const Ym={DEG2RAD:Sr,RAD2DEG:Hs,generateUUID:ti,clamp:Je,euclideanModulo:Tc,mapLinear:Nm,inverseLerp:Dm,lerp:br,damp:Um,pingpong:Fm,smoothstep:Om,smootherstep:km,randInt:zm,randFloat:Bm,randFloatSpread:Gm,seededRandom:Hm,degToRad:Vm,radToDeg:Wm,isPowerOfTwo:Xm,ceilPowerOfTwo:qm,floorPowerOfTwo:Jd,setQuaternionFromProperEuler:Km,normalize:wc,denormalize:Ec},jc=class jc{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};jc.prototype.isVector2=!0;let Se=jc;class In{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=r[a+0],f=r[a+1],p=r[a+2],x=r[a+3];if(u!==x||l!==d||c!==f||h!==p){let m=l*d+c*f+h*p+u*x;m<0&&(d=-d,f=-f,p=-p,x=-x,m=-m);let g=1-o;if(m<.9995){const v=Math.acos(m),y=Math.sin(v);g=Math.sin(g*v)/y,o=Math.sin(o*v)/y,l=l*g+d*o,c=c*g+f*o,h=h*g+p*o,u=u*g+x*o}else{l=l*g+d*o,c=c*g+f*o,h=h*g+p*o,u=u*g+x*o;const v=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=v,c*=v,h*=v,u*=v}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,a){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[a],d=r[a+1],f=r[a+2],p=r[a+3];return e[t]=o*p+h*u+l*f-c*d,e[t+1]=l*p+h*d+c*u-o*f,e[t+2]=c*p+h*f+o*d-l*u,e[t+3]=h*p-o*u-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(r/2),d=l(n/2),f=l(i/2),p=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"YZX":this._x=d*h*u+c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u-d*f*p;break;case"XZY":this._x=d*h*u-c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u+d*f*p;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-i)*f}else if(n>o&&n>u){const f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(i+a)/f,this._z=(r+c)/f}else if(o>u){const f=2*Math.sqrt(1+o-n-u);this._w=(r-c)/f,this._x=(i+a)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+u-n-o);this._w=(a-i)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Je(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,i=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,i=-i,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const eh=class eh{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Rh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Rh.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),h=2*(o*t-r*i),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=i+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Eo.copy(this).projectOnVector(e),this.sub(Eo)}reflect(e){return this.sub(Eo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};eh.prototype.isVector3=!0;let F=eh;const Eo=new F,Rh=new In,th=class th{constructor(e,t,n,i,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c)}set(e,t,n,i,r,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],p=n[8],x=i[0],m=i[3],g=i[6],v=i[1],y=i[4],_=i[7],S=i[2],T=i[5],M=i[8];return r[0]=a*x+o*v+l*S,r[3]=a*m+o*y+l*T,r[6]=a*g+o*_+l*M,r[1]=c*x+h*v+u*S,r[4]=c*m+h*y+u*T,r[7]=c*g+h*_+u*M,r[2]=d*x+f*v+p*S,r[5]=d*m+f*y+p*T,r[8]=d*g+f*_+p*M,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,f=c*r-a*l,p=t*u+n*d+i*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/p;return e[0]=u*x,e[1]=(i*c-h*n)*x,e[2]=(o*n-i*a)*x,e[3]=d*x,e[4]=(h*t-i*l)*x,e[5]=(i*r-o*t)*x,e[6]=f*x,e[7]=(n*l-c*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Fs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(wo.makeScale(e,t)),this}rotate(e){return Fs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(wo.makeRotation(-e)),this}translate(e,t){return Fs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(wo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};th.prototype.isMatrix3=!0;let He=th;const wo=new He,Ch=new He().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ph=new He().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function $m(){const s={enabled:!0,workingColorSpace:Ln,spaces:{},convert:function(i,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===ut&&(i.r=Ci(i.r),i.g=Ci(i.g),i.b=Ci(i.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ut&&(i.r=Os(i.r),i.g=Os(i.g),i.b=Os(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Vi?$a:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,a){return i.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Ln]:{primaries:e,whitePoint:n,transfer:$a,toXYZ:Ch,fromXYZ:Ph,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Dt},outputColorSpaceConfig:{drawingBufferColorSpace:Dt}},[Dt]:{primaries:e,whitePoint:n,transfer:ut,toXYZ:Ch,fromXYZ:Ph,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Dt}}}),s}const Qe=$m();function Ci(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Os(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let _s;class Jm{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{_s===void 0&&(_s=Fr("canvas")),_s.width=e.width,_s.height=e.height;const i=_s.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=_s}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Fr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=Ci(r[a]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Ci(t[n]/255)*255):t[n]=Ci(t[n]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Zm=0;class Ac{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Zm++}),this.uuid=ti(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Ao(i[a].image)):r.push(Ao(i[a]))}else r=Ao(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function Ao(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Jm.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}let Qm=0;const Ro=new F;class $t extends xs{constructor(e=$t.DEFAULT_IMAGE,t=$t.DEFAULT_MAPPING,n=hi,i=hi,r=ln,a=Jn,o=Zn,l=Pn,c=$t.DEFAULT_ANISOTROPY,h=Vi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Qm++}),this.uuid=ti(),this.name="",this.source=new Ac(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Se(0,0),this.repeat=new Se(1,1),this.center=new Se(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new He,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Ro).x}get height(){return this.source.getSize(Ro).y}get depth(){return this.source.getSize(Ro).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Fd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ji:e.x=e.x-Math.floor(e.x);break;case hi:e.x=e.x<0?0:1;break;case Xa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ji:e.y=e.y-Math.floor(e.y);break;case hi:e.y=e.y<0?0:1;break;case Xa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}$t.DEFAULT_IMAGE=null;$t.DEFAULT_MAPPING=Fd;$t.DEFAULT_ANISOTROPY=1;const nh=class nh{constructor(e=0,t=0,n=0,i=1){this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],p=l[9],x=l[2],m=l[6],g=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(p-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(p+m)<.1&&Math.abs(c+f+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const y=(c+1)/2,_=(f+1)/2,S=(g+1)/2,T=(h+d)/4,M=(u+x)/4,b=(p+m)/4;return y>_&&y>S?y<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(y),i=T/n,r=M/n):_>S?_<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(_),n=T/i,r=b/i):S<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(S),n=M/r,i=b/r),this.set(n,i,r,t),this}let v=Math.sqrt((m-p)*(m-p)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(v)<.001&&(v=1),this.x=(m-p)/v,this.y=(u-x)/v,this.z=(d-h)/v,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this.w=Je(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this.w=Je(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};nh.prototype.isVector4=!0;let mt=nh;class jm extends xs{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ln,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new mt(0,0,e,t),this.scissorTest=!1,this.viewport=new mt(0,0,e,t),this.textures=[];const i=n.count;for(let r=0;r<i;r++)this.textures[r]=new $t({width:e,height:t,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:ln,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const i=Object.assign({},e.textures[t].image);this.textures[t].source=new Ac(i)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class di extends jm{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Zd extends $t{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=hi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class e0 extends $t{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=hi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const oo=class oo{constructor(e,t,n,i,r,a,o,l,c,h,u,d,f,p,x,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c,h,u,d,f,p,x,m)}set(e,t,n,i,r,a,o,l,c,h,u,d,f,p,x,m){const g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=i,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=c,g[6]=h,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=x,g[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new oo().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,i=1/vs.setFromMatrixColumn(e,0).length(),r=1/vs.setFromMatrixColumn(e,1).length(),a=1/vs.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){const d=a*h,f=a*u,p=o*h,x=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+p*c,t[5]=d-x*c,t[9]=-o*l,t[2]=x-d*c,t[6]=p+f*c,t[10]=a*l}else if(e.order==="YXZ"){const d=l*h,f=l*u,p=c*h,x=c*u;t[0]=d+x*o,t[4]=p*o-f,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=f*o-p,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*h,f=l*u,p=c*h,x=c*u;t[0]=d-x*o,t[4]=-a*u,t[8]=p+f*o,t[1]=f+p*o,t[5]=a*h,t[9]=x-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*h,f=a*u,p=o*h,x=o*u;t[0]=l*h,t[4]=p*c-f,t[8]=d*c+x,t[1]=l*u,t[5]=x*c+d,t[9]=f*c-p,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,f=a*c,p=o*l,x=o*c;t[0]=l*h,t[4]=x-d*u,t[8]=p*u+f,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=f*u+p,t[10]=d-x*u}else if(e.order==="XZY"){const d=a*l,f=a*c,p=o*l,x=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+x,t[5]=a*h,t[9]=f*u-p,t[2]=p*u-f,t[6]=o*h,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(t0,e,n0)}lookAt(e,t,n){const i=this.elements;return wn.subVectors(e,t),wn.lengthSq()===0&&(wn.z=1),wn.normalize(),Di.crossVectors(n,wn),Di.lengthSq()===0&&(Math.abs(n.z)===1?wn.x+=1e-4:wn.z+=1e-4,wn.normalize(),Di.crossVectors(n,wn)),Di.normalize(),ia.crossVectors(wn,Di),i[0]=Di.x,i[4]=ia.x,i[8]=wn.x,i[1]=Di.y,i[5]=ia.y,i[9]=wn.y,i[2]=Di.z,i[6]=ia.z,i[10]=wn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],p=n[2],x=n[6],m=n[10],g=n[14],v=n[3],y=n[7],_=n[11],S=n[15],T=i[0],M=i[4],b=i[8],I=i[12],R=i[1],D=i[5],L=i[9],C=i[13],A=i[2],U=i[6],z=i[10],B=i[14],K=i[3],X=i[7],j=i[11],te=i[15];return r[0]=a*T+o*R+l*A+c*K,r[4]=a*M+o*D+l*U+c*X,r[8]=a*b+o*L+l*z+c*j,r[12]=a*I+o*C+l*B+c*te,r[1]=h*T+u*R+d*A+f*K,r[5]=h*M+u*D+d*U+f*X,r[9]=h*b+u*L+d*z+f*j,r[13]=h*I+u*C+d*B+f*te,r[2]=p*T+x*R+m*A+g*K,r[6]=p*M+x*D+m*U+g*X,r[10]=p*b+x*L+m*z+g*j,r[14]=p*I+x*C+m*B+g*te,r[3]=v*T+y*R+_*A+S*K,r[7]=v*M+y*D+_*U+S*X,r[11]=v*b+y*L+_*z+S*j,r[15]=v*I+y*C+_*B+S*te,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],f=e[14],p=e[3],x=e[7],m=e[11],g=e[15],v=l*f-c*d,y=o*f-c*u,_=o*d-l*u,S=a*f-c*h,T=a*d-l*h,M=a*u-o*h;return t*(x*v-m*y+g*_)-n*(p*v-m*S+g*T)+i*(p*y-x*S+g*M)-r*(p*_-x*T+m*M)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+i*(r*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],f=e[11],p=e[12],x=e[13],m=e[14],g=e[15],v=t*o-n*a,y=t*l-i*a,_=t*c-r*a,S=n*l-i*o,T=n*c-r*o,M=i*c-r*l,b=h*x-u*p,I=h*m-d*p,R=h*g-f*p,D=u*m-d*x,L=u*g-f*x,C=d*g-f*m,A=v*C-y*L+_*D+S*R-T*I+M*b;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const U=1/A;return e[0]=(o*C-l*L+c*D)*U,e[1]=(i*L-n*C-r*D)*U,e[2]=(x*M-m*T+g*S)*U,e[3]=(d*T-u*M-f*S)*U,e[4]=(l*R-a*C-c*I)*U,e[5]=(t*C-i*R+r*I)*U,e[6]=(m*_-p*M-g*y)*U,e[7]=(h*M-d*_+f*y)*U,e[8]=(a*L-o*R+c*b)*U,e[9]=(n*R-t*L-r*b)*U,e[10]=(p*T-x*_+g*v)*U,e[11]=(u*_-h*T-f*v)*U,e[12]=(o*I-a*D-l*b)*U,e[13]=(t*D-n*I+i*b)*U,e[14]=(x*y-p*S-m*v)*U,e[15]=(h*S-u*y+d*v)*U,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,f=r*h,p=r*u,x=a*h,m=a*u,g=o*u,v=l*c,y=l*h,_=l*u,S=n.x,T=n.y,M=n.z;return i[0]=(1-(x+g))*S,i[1]=(f+_)*S,i[2]=(p-y)*S,i[3]=0,i[4]=(f-_)*T,i[5]=(1-(d+g))*T,i[6]=(m+v)*T,i[7]=0,i[8]=(p+y)*M,i[9]=(m-v)*M,i[10]=(1-(d+x))*M,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=vs.set(i[0],i[1],i[2]).length();const o=vs.set(i[4],i[5],i[6]).length(),l=vs.set(i[8],i[9],i[10]).length();r<0&&(a=-a),Vn.copy(this);const c=1/a,h=1/o,u=1/l;return Vn.elements[0]*=c,Vn.elements[1]*=c,Vn.elements[2]*=c,Vn.elements[4]*=h,Vn.elements[5]*=h,Vn.elements[6]*=h,Vn.elements[8]*=u,Vn.elements[9]*=u,Vn.elements[10]*=u,t.setFromRotationMatrix(Vn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,i,r,a,o=Qn,l=!1){const c=this.elements,h=2*r/(t-e),u=2*r/(n-i),d=(t+e)/(t-e),f=(n+i)/(n-i);let p,x;if(l)p=r/(a-r),x=a*r/(a-r);else if(o===Qn)p=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===Ur)p=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=Qn,l=!1){const c=this.elements,h=2/(t-e),u=2/(n-i),d=-(t+e)/(t-e),f=-(n+i)/(n-i);let p,x;if(l)p=1/(a-r),x=a/(a-r);else if(o===Qn)p=-2/(a-r),x=-(a+r)/(a-r);else if(o===Ur)p=-1/(a-r),x=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};oo.prototype.isMatrix4=!0;let ke=oo;const vs=new F,Vn=new ke,t0=new F(0,0,0),n0=new F(1,1,1),Di=new F,ia=new F,wn=new F,Lh=new ke,Ih=new In;class Nn{constructor(e=0,t=0,n=0,i=Nn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(Je(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Je(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Je(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Je(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Je(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Je(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Lh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Lh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ih.setFromEuler(this),this.setFromQuaternion(Ih,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Nn.DEFAULT_ORDER="XYZ";class Qd{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let i0=0;const Nh=new F,Ms=new In,_i=new ke,sa=new F,js=new F,s0=new F,r0=new In,Dh=new F(1,0,0),Uh=new F(0,1,0),Fh=new F(0,0,1),Oh={type:"added"},a0={type:"removed"},ys={type:"childadded",child:null},Co={type:"childremoved",child:null};class St extends xs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:i0++}),this.uuid=ti(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=St.DEFAULT_UP.clone();const e=new F,t=new Nn,n=new In,i=new F(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ke},normalMatrix:{value:new He}}),this.matrix=new ke,this.matrixWorld=new ke,this.matrixAutoUpdate=St.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=St.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Qd,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ms.setFromAxisAngle(e,t),this.quaternion.multiply(Ms),this}rotateOnWorldAxis(e,t){return Ms.setFromAxisAngle(e,t),this.quaternion.premultiply(Ms),this}rotateX(e){return this.rotateOnAxis(Dh,e)}rotateY(e){return this.rotateOnAxis(Uh,e)}rotateZ(e){return this.rotateOnAxis(Fh,e)}translateOnAxis(e,t){return Nh.copy(e).applyQuaternion(this.quaternion),this.position.add(Nh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Dh,e)}translateY(e){return this.translateOnAxis(Uh,e)}translateZ(e){return this.translateOnAxis(Fh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(_i.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?sa.copy(e):sa.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),js.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?_i.lookAt(js,sa,this.up):_i.lookAt(sa,js,this.up),this.quaternion.setFromRotationMatrix(_i),i&&(_i.extractRotation(i.matrixWorld),Ms.setFromRotationMatrix(_i),this.quaternion.premultiply(Ms.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Be("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Oh),ys.child=e,this.dispatchEvent(ys),ys.child=null):Be("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(a0),Co.child=e,this.dispatchEvent(Co),Co.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),_i.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),_i.multiply(e.parent.matrixWorld)),e.applyMatrix4(_i),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Oh),ys.child=e,this.dispatchEvent(ys),ys.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(js,e,s0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(js,r0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,i=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*i,r[13]+=n-r[1]*t-r[5]*n-r[9]*i,r[14]+=i-r[2]*t-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(r(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),f=a(e.animations),p=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=i,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}St.DEFAULT_UP=new F(0,1,0);St.DEFAULT_MATRIX_AUTO_UPDATE=!0;St.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Ne extends St{constructor(){super(),this.isGroup=!0,this.type="Group"}}const o0={type:"move"};class Po{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ne,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ne,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new F,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new F),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ne,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new F,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new F,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const x of e.hand.values()){const m=t.getJointPose(x,n),g=this._getHandJoint(c,x);m!==null&&(g.matrix.fromArray(m.transform.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=m.radius),g.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,p=.005;c.inputState.pinching&&d>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(o0)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Ne;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const jd={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ui={h:0,s:0,l:0},ra={h:0,s:0,l:0};function Lo(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}class le{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Dt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,Qe.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=Qe.workingColorSpace){if(e=Tc(e,1),t=Je(t,0,1),n=Je(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Lo(a,r,e+1/3),this.g=Lo(a,r,e),this.b=Lo(a,r,e-1/3)}return Qe.colorSpaceToWorking(this,i),this}setStyle(e,t=Dt){function n(r){r!==void 0&&parseFloat(r)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,t);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Dt){const n=jd[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ci(e.r),this.g=Ci(e.g),this.b=Ci(e.b),this}copyLinearToSRGB(e){return this.r=Os(e.r),this.g=Os(e.g),this.b=Os(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Dt){return Qe.workingToColorSpace(fn.copy(this),e),Math.round(Je(fn.r*255,0,255))*65536+Math.round(Je(fn.g*255,0,255))*256+Math.round(Je(fn.b*255,0,255))}getHexString(e=Dt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.workingToColorSpace(fn.copy(this),t);const n=fn.r,i=fn.g,r=fn.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Qe.workingColorSpace){return Qe.workingToColorSpace(fn.copy(this),t),e.r=fn.r,e.g=fn.g,e.b=fn.b,e}getStyle(e=Dt){Qe.workingToColorSpace(fn.copy(this),e);const t=fn.r,n=fn.g,i=fn.b;return e!==Dt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ui),this.setHSL(Ui.h+e,Ui.s+t,Ui.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ui),e.getHSL(ra);const n=br(Ui.h,ra.h,t),i=br(Ui.s,ra.s,t),r=br(Ui.l,ra.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const fn=new le;le.NAMES=jd;class Rc{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new le(e),this.near=t,this.far=n}clone(){return new Rc(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class l0 extends St{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Nn,this.environmentIntensity=1,this.environmentRotation=new Nn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Wn=new F,vi=new F,Io=new F,Mi=new F,Ss=new F,bs=new F,kh=new F,No=new F,Do=new F,Uo=new F,Fo=new mt,Oo=new mt,ko=new mt;class $n{constructor(e=new F,t=new F,n=new F){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Wn.subVectors(e,t),i.cross(Wn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Wn.subVectors(i,t),vi.subVectors(n,t),Io.subVectors(e,t);const a=Wn.dot(Wn),o=Wn.dot(vi),l=Wn.dot(Io),c=vi.dot(vi),h=vi.dot(Io),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;const d=1/u,f=(c*l-o*h)*d,p=(a*h-o*l)*d;return r.set(1-f-p,p,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Mi)===null?!1:Mi.x>=0&&Mi.y>=0&&Mi.x+Mi.y<=1}static getInterpolation(e,t,n,i,r,a,o,l){return this.getBarycoord(e,t,n,i,Mi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Mi.x),l.addScaledVector(a,Mi.y),l.addScaledVector(o,Mi.z),l)}static getInterpolatedAttribute(e,t,n,i,r,a){return Fo.setScalar(0),Oo.setScalar(0),ko.setScalar(0),Fo.fromBufferAttribute(e,t),Oo.fromBufferAttribute(e,n),ko.fromBufferAttribute(e,i),a.setScalar(0),a.addScaledVector(Fo,r.x),a.addScaledVector(Oo,r.y),a.addScaledVector(ko,r.z),a}static isFrontFacing(e,t,n,i){return Wn.subVectors(n,t),vi.subVectors(e,t),Wn.cross(vi).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Wn.subVectors(this.c,this.b),vi.subVectors(this.a,this.b),Wn.cross(vi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return $n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return $n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return $n.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return $n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return $n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let a,o;Ss.subVectors(i,n),bs.subVectors(r,n),No.subVectors(e,n);const l=Ss.dot(No),c=bs.dot(No);if(l<=0&&c<=0)return t.copy(n);Do.subVectors(e,i);const h=Ss.dot(Do),u=bs.dot(Do);if(h>=0&&u<=h)return t.copy(i);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0&&l-h>0)return a=l/(l-h),t.copy(n).addScaledVector(Ss,a);Uo.subVectors(e,r);const f=Ss.dot(Uo),p=bs.dot(Uo);if(p>=0&&f<=p)return t.copy(r);const x=f*c-l*p;if(x<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(bs,o);const m=h*p-f*u;if(m<=0&&u-h>=0&&f-p>=0)return kh.subVectors(r,i),o=(u-h)/(u-h+(f-p)),t.copy(i).addScaledVector(kh,o);const g=1/(m+x+d);return a=x*g,o=d*g,t.copy(n).addScaledVector(Ss,a).addScaledVector(bs,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Li{constructor(e=new F(1/0,1/0,1/0),t=new F(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Xn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Xn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Xn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Xn):Xn.fromBufferAttribute(r,a),Xn.applyMatrix4(e.matrixWorld),this.expandByPoint(Xn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),aa.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),aa.copy(n.boundingBox)),aa.applyMatrix4(e.matrixWorld),this.union(aa)}const i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Xn),Xn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(er),oa.subVectors(this.max,er),Ts.subVectors(e.a,er),Es.subVectors(e.b,er),ws.subVectors(e.c,er),Fi.subVectors(Es,Ts),Oi.subVectors(ws,Es),ts.subVectors(Ts,ws);let t=[0,-Fi.z,Fi.y,0,-Oi.z,Oi.y,0,-ts.z,ts.y,Fi.z,0,-Fi.x,Oi.z,0,-Oi.x,ts.z,0,-ts.x,-Fi.y,Fi.x,0,-Oi.y,Oi.x,0,-ts.y,ts.x,0];return!zo(t,Ts,Es,ws,oa)||(t=[1,0,0,0,1,0,0,0,1],!zo(t,Ts,Es,ws,oa))?!1:(la.crossVectors(Fi,Oi),t=[la.x,la.y,la.z],zo(t,Ts,Es,ws,oa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Xn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Xn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(yi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),yi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),yi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),yi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),yi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),yi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),yi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),yi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(yi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const yi=[new F,new F,new F,new F,new F,new F,new F,new F],Xn=new F,aa=new Li,Ts=new F,Es=new F,ws=new F,Fi=new F,Oi=new F,ts=new F,er=new F,oa=new F,la=new F,ns=new F;function zo(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){ns.fromArray(s,r);const o=i.x*Math.abs(ns.x)+i.y*Math.abs(ns.y)+i.z*Math.abs(ns.z),l=e.dot(ns),c=t.dot(ns),h=n.dot(ns);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Ot=new F,ca=new Se;let c0=0;class Jt extends xs{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:c0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Yd,this.updateRanges=[],this.gpuType=Gn,this.version=0,this._normalizationScale=e!==void 0?lo(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)ca.fromBufferAttribute(this,t),ca.applyMatrix3(e),this.setXY(t,ca.x,ca.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ot.fromBufferAttribute(this,t),Ot.applyMatrix3(e),this.setXYZ(t,Ot.x,Ot.y,Ot.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ot.fromBufferAttribute(this,t),Ot.applyMatrix4(e),this.setXYZ(t,Ot.x,Ot.y,Ot.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ot.fromBufferAttribute(this,t),Ot.applyNormalMatrix(e),this.setXYZ(t,Ot.x,Ot.y,Ot.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ot.fromBufferAttribute(this,t),Ot.transformDirection(e),this.setXYZ(t,Ot.x,Ot.y,Ot.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){const t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):Ec(e,this.array)}_normalize(e){const t=this._normalizationScale;return t!==void 0?Math.round(e*t):wc(e,this.array)}}class ef extends Jt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class tf extends Jt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Le extends Jt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const h0=new Li,tr=new F,Bo=new F;class mi{constructor(e=new F,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):h0.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;tr.subVectors(e,this.center);const t=tr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(tr,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Bo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(tr.copy(e.center).add(Bo)),this.expandByPoint(tr.copy(e.center).sub(Bo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let u0=0;const zn=new ke,Go=new St,As=new F,An=new Li,nr=new Li,nn=new F;class ft extends xs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:u0++}),this.uuid=ti(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Rm(e)?tf:ef)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new He().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return zn.makeRotationFromQuaternion(e),this.applyMatrix4(zn),this}rotateX(e){return zn.makeRotationX(e),this.applyMatrix4(zn),this}rotateY(e){return zn.makeRotationY(e),this.applyMatrix4(zn),this}rotateZ(e){return zn.makeRotationZ(e),this.applyMatrix4(zn),this}translate(e,t,n){return zn.makeTranslation(e,t,n),this.applyMatrix4(zn),this}scale(e,t,n){return zn.makeScale(e,t,n),this.applyMatrix4(zn),this}lookAt(e){return Go.lookAt(e),Go.updateMatrix(),this.applyMatrix4(Go.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(As).negate(),this.translate(As.x,As.y,As.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let i=0,r=e.length;i<r;i++){const a=e[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Le(n,3))}else{const n=Math.min(e.length,t.count);for(let i=0;i<n;i++){const r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Li);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Be("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new F(-1/0,-1/0,-1/0),new F(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];An.setFromBufferAttribute(r),this.morphTargetsRelative?(nn.addVectors(this.boundingBox.min,An.min),this.boundingBox.expandByPoint(nn),nn.addVectors(this.boundingBox.max,An.max),this.boundingBox.expandByPoint(nn)):(this.boundingBox.expandByPoint(An.min),this.boundingBox.expandByPoint(An.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Be('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new mi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Be("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new F,1/0);return}if(e){const n=this.boundingSphere.center;if(An.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];nr.setFromBufferAttribute(o),this.morphTargetsRelative?(nn.addVectors(An.min,nr.min),An.expandByPoint(nn),nn.addVectors(An.max,nr.max),An.expandByPoint(nn)):(An.expandByPoint(nr.min),An.expandByPoint(nr.max))}An.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)nn.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(nn));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)nn.fromBufferAttribute(o,c),l&&(As.fromBufferAttribute(e,c),nn.add(As)),i=Math.max(i,n.distanceToSquared(nn))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Be('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Be("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,i=t.normal,r=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Jt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[],c=new Uint8Array(n.count);for(let I=0;I<n.count;I++)o[I]=new F,l[I]=new F;const h=new F,u=new F,d=new F,f=new Se,p=new Se,x=new Se,m=new F,g=new F;function v(I,R,D){c[I]=c[R]=c[D]=1,h.fromBufferAttribute(n,I),u.fromBufferAttribute(n,R),d.fromBufferAttribute(n,D),f.fromBufferAttribute(r,I),p.fromBufferAttribute(r,R),x.fromBufferAttribute(r,D),u.sub(h),d.sub(h),p.sub(f),x.sub(f);const L=1/(p.x*x.y-x.x*p.y);isFinite(L)&&(m.copy(u).multiplyScalar(x.y).addScaledVector(d,-p.y).multiplyScalar(L),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-x.x).multiplyScalar(L),o[I].add(m),o[R].add(m),o[D].add(m),l[I].add(g),l[R].add(g),l[D].add(g))}let y=this.groups;y.length===0&&(y=[{start:0,count:e.count}]);for(let I=0,R=y.length;I<R;++I){const D=y[I],L=D.start,C=D.count;for(let A=L,U=L+C;A<U;A+=3)v(e.getX(A+0),e.getX(A+1),e.getX(A+2))}const _=new F,S=new F,T=new F,M=new F;function b(I){T.fromBufferAttribute(i,I),M.copy(T);const R=o[I];_.copy(R),_.sub(T.multiplyScalar(T.dot(R))).normalize(),S.crossVectors(M,R);const L=S.dot(l[I])<0?-1:1;a.setXYZW(I,_.x,_.y,_.z,L)}for(let I=0,R=n.count;I<R;++I)c[I]&&b(I);this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Jt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const i=new F,r=new F,a=new F,o=new F,l=new F,c=new F,h=new F,u=new F;if(e)for(let d=0,f=e.count;d<f;d+=3){const p=e.getX(d+0),x=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,p),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)nn.fromBufferAttribute(e,t),nn.normalize(),e.setXYZ(t,nn.x,nn.y,nn.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h);let f=0,p=0;for(let x=0,m=l.length;x<m;x++){o.isInterleavedBufferAttribute?f=l[x]*o.data.stride+o.offset:f=l[x]*h;for(let g=0;g<h;g++)d[p++]=c[f++]}return new Jt(d,h,u)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new ft,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=e(l,n);t.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){const d=c[h],f=e(d,n);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const i={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(i[l]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const i=e.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(t))}const r=e.morphAttributes;for(const c in r){const h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class d0{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Yd,this.updateRanges=[],this.version=0,this.uuid=ti()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});const t=zh(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);const n=new this.array.constructor(e.arrayBuffers[t]),i=new this.constructor(n,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});const t=zh(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));const n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}}function zh(s){return s.buffer._uuid===void 0&&(s.buffer._uuid=ti()),s.byteOffset===0&&s.byteLength===s.buffer.byteLength?s.buffer._uuid:s.buffer._uuid+":"+s.byteOffset+":"+s.byteLength}const gn=new F;class Cc{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i,this._normalizationScale=e!==void 0?lo(e.array):void 0}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)gn.fromBufferAttribute(this,t),gn.applyMatrix4(e),this.setXYZ(t,gn.x,gn.y,gn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)gn.fromBufferAttribute(this,t),gn.applyNormalMatrix(e),this.setXYZ(t,gn.x,gn.y,gn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)gn.fromBufferAttribute(this,t),gn.transformDirection(e),this.setXYZ(t,gn.x,gn.y,gn.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){Za("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new Jt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Cc(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Za("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){const t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):Ec(e,this.data.array)}_normalize(e){const t=this._normalizationScale;return t!==void 0?Math.round(e*t):wc(e,this.data.array)}}const Ho=new F,f0=new F,p0=new He;class Gi{constructor(e=new F(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=Ho.subVectors(n,t).cross(f0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const i=e.delta(Ho),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(i,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||p0.getNormalMatrix(e),i=this.coplanarPoint(Ho).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let m0=0;class ei extends xs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:m0++}),this.uuid=ti(),this.name="",this.type="Material",this.blending=yr,this.side=$i,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Rd,this.blendDst=Cd,this.blendEquation=Ns,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new le(0,0,0),this.blendAlpha=0,this.depthFunc=Pr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sm,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=To,this.stencilZFail=To,this.stencilZPass=To,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(t){const r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new le().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Gi().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Se().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Se().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Si=new F,Vo=new F,ha=new F,ua=new F;class co{constructor(e=new F,t=new F(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Si)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Si.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Si.copy(this.origin).addScaledVector(this.direction,t),Si.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Vo.copy(e).add(t).multiplyScalar(.5),ha.copy(t).sub(e).normalize(),ua.copy(this.origin).sub(Vo);const r=e.distanceTo(t)*.5,a=-this.direction.dot(ha),o=ua.dot(this.direction),l=-ua.dot(ha),c=ua.lengthSq(),h=Math.abs(1-a*a);let u,d,f,p;if(h>0)if(u=a*l-o,d=a*o-l,p=r*h,u>=0)if(d>=-p)if(d<=p){const x=1/h;u*=x,d*=x,f=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-p?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=p?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Vo).addScaledVector(ha,d),f}intersectSphere(e,t){if(e.radius<0)return null;Si.subVectors(e.center,this.origin);const n=Si.dot(this.direction),i=Si.dot(Si)-n*n,r=e.radius*e.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,Si)!==null}intersectTriangle(e,t,n,i,r){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,x=t.y-a.y,m=t.z-a.z,g=n.x-a.x,v=n.y-a.y,y=n.z-a.z,_=Math.abs(l),S=Math.abs(c),T=Math.abs(h);let M,b,I,R,D,L,C,A,U,z,B,K;if(_>=S&&_>=T?(I=l,L=u,U=p,K=g,l>=0?(M=c,b=h,R=d,D=f,C=x,A=m,z=v,B=y):(M=h,b=c,R=f,D=d,C=m,A=x,z=y,B=v)):S>=T?(I=c,L=d,U=x,K=v,c>=0?(M=h,b=l,R=f,D=u,C=m,A=p,z=y,B=g):(M=l,b=h,R=u,D=f,C=p,A=m,z=g,B=y)):(I=h,L=f,U=m,K=y,h>=0?(M=l,b=c,R=u,D=d,C=p,A=x,z=g,B=v):(M=c,b=l,R=d,D=u,C=x,A=p,z=v,B=g)),I===0)return null;const X=M/I,j=b/I,te=1/I,Te=R-X*L,Ve=D-j*L,Z=C-X*U,ve=A-j*U,Ee=z-X*K,De=B-j*K,Me=Ee*ve-De*Z,Xe=Te*De-Ve*Ee,Ut=Z*Ve-ve*Te;if(i){if(Me<0||Xe<0||Ut<0)return null}else if((Me<0||Xe<0||Ut<0)&&(Me>0||Xe>0||Ut>0))return null;const Oe=Me+Xe+Ut;if(Oe===0)return null;const lt=te*(Me*L+Xe*U+Ut*K);return(Oe>0?lt<0:lt>0)?null:this.at(lt/Oe,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Yt extends ei{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=mc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Bh=new ke,is=new co,da=new mi,Gh=new F,fa=new F,pa=new F,ma=new F,Wo=new F,ga=new F,Hh=new F,xa=new F;class at extends St{constructor(e=new ft,t=new Yt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const o=this.morphTargetInfluences;if(r&&o){ga.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],u=r[l];h!==0&&(Wo.fromBufferAttribute(u,e),a?ga.addScaledVector(Wo,h):ga.addScaledVector(Wo.sub(t),h))}t.add(ga)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),da.copy(n.boundingSphere),da.applyMatrix4(r),is.copy(e.ray).recast(e.near),!(da.containsPoint(is.origin)===!1&&(is.intersectSphere(da,Gh)===null||is.origin.distanceToSquared(Gh)>(e.far-e.near)**2))&&(Bh.copy(r).invert(),is.copy(e.ray).applyMatrix4(Bh),!(n.boundingBox!==null&&is.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,is)))}_computeIntersections(e,t,n){let i;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,x=d.length;p<x;p++){const m=d[p],g=a[m.materialIndex],v=Math.max(m.start,f.start),y=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let _=v,S=y;_<S;_+=3){const T=o.getX(_),M=o.getX(_+1),b=o.getX(_+2);i=_a(this,g,e,n,c,h,u,T,M,b),i&&(i.faceIndex=Math.floor(_/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{const p=Math.max(0,f.start),x=Math.min(o.count,f.start+f.count);for(let m=p,g=x;m<g;m+=3){const v=o.getX(m),y=o.getX(m+1),_=o.getX(m+2);i=_a(this,a,e,n,c,h,u,v,y,_),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,x=d.length;p<x;p++){const m=d[p],g=a[m.materialIndex],v=Math.max(m.start,f.start),y=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let _=v,S=y;_<S;_+=3){const T=_,M=_+1,b=_+2;i=_a(this,g,e,n,c,h,u,T,M,b),i&&(i.faceIndex=Math.floor(_/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{const p=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let m=p,g=x;m<g;m+=3){const v=m,y=m+1,_=m+2;i=_a(this,a,e,n,c,h,u,v,y,_),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}}}function g0(s,e,t,n,i,r,a,o){let l;if(e.side===Tn?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,e.side===$i,o),l===null)return null;xa.copy(o),xa.applyMatrix4(s.matrixWorld);const c=t.ray.origin.distanceTo(xa);return c<t.near||c>t.far?null:{distance:c,point:xa.clone(),object:s}}function _a(s,e,t,n,i,r,a,o,l,c){s.getVertexPosition(o,fa),s.getVertexPosition(l,pa),s.getVertexPosition(c,ma);const h=g0(s,e,t,n,fa,pa,ma,Hh);if(h){const u=new F;$n.getBarycoord(Hh,fa,pa,ma,u),i&&(h.uv=$n.getInterpolatedAttribute(i,o,l,c,u,new Se)),r&&(h.uv1=$n.getInterpolatedAttribute(r,o,l,c,u,new Se)),a&&(h.normal=$n.getInterpolatedAttribute(a,o,l,c,u,new F),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new F,materialIndex:0};$n.getNormal(fa,pa,ma,d.normal),h.face=d,h.barycoord=u}return h}const ir=new mt,Vh=new mt,Wh=new mt,x0=new mt,Xh=new ke,va=new F,Xo=new mi,qh=new ke,qo=new co;class _0 extends at{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Mh,this.bindMatrix=new ke,this.bindMatrixInverse=new ke,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Li),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,va),this.boundingBox.expandByPoint(va)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new mi),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,va),this.boundingSphere.expandByPoint(va)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}raycast(e,t){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xo.copy(this.boundingSphere),Xo.applyMatrix4(i),e.ray.intersectsSphere(Xo)!==!1&&(qh.copy(i).invert(),qo.copy(e.ray).applyMatrix4(qh),!(this.boundingBox!==null&&qo.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,qo)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new mt,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);const r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Mh?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===xm?this.bindMatrixInverse.copy(this.bindMatrix).invert():Ce("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const n=this.skeleton,i=this.geometry;Vh.fromBufferAttribute(i.attributes.skinIndex,e),Wh.fromBufferAttribute(i.attributes.skinWeight,e),t.isVector4?(ir.copy(t),t.set(0,0,0,0)):(ir.set(t.x,t.y,t.z,1),t.set(0,0,0)),ir.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){const a=Wh.getComponent(r);if(a!==0){const o=Vh.getComponent(r);Xh.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(x0.copy(ir).applyMatrix4(Xh),a)}}return t.isVector4&&(t.w=ir.w),t.applyMatrix4(this.bindMatrixInverse)}}class nf extends St{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Pc extends $t{constructor(e=null,t=1,n=1,i,r,a,o,l,c=Kt,h=Kt,u,d){super(null,a,o,l,c,h,i,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Kh=new ke,v0=new ke;class Lc{constructor(e=[],t=[]){this.uuid=ti(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.previousBoneMatrices=null,this.boneTexture=null,this.previousBoneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){Ce("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new ke)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new ke;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,a=e.length;r<a;r++){const o=e[r]?e[r].matrixWorld:v0;Kh.multiplyMatrices(o,t[r]),Kh.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new Lc(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new Pc(t,e,e,Zn,Gn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null),this.previousBoneTexture!==null&&(this.previousBoneTexture.dispose(),this.previousBoneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){const r=e.bones[n];let a=t[r];a===void 0&&(Ce("Skeleton: No bone found with UUID:",r),a=new nf),this.bones.push(a),this.boneInverses.push(new ke().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){const a=t[i];e.bones.push(a.uuid);const o=n[i];e.boneInverses.push(o.toArray())}return e}}class Or extends Jt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Rs=new ke,Yh=new ke,Ma=[],$h=new Li,M0=new ke,sr=new at,rr=new mi;class ps extends at{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Or(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,M0)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Li),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Rs),$h.copy(e.boundingBox).applyMatrix4(Rs),this.boundingBox.union($h)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new mi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Rs),rr.copy(e.boundingSphere).applyMatrix4(Rs),this.boundingSphere.union(rr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture!==null?e.morphTexture.clone():null,this.instanceColor=e.instanceColor!==null?e.instanceColor.clone():null,this.count=e.count,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(e,t){const n=this.matrixWorld,i=this.count;if(sr.geometry=this.geometry,sr.material=this.material,sr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),rr.copy(this.boundingSphere),rr.applyMatrix4(n),e.ray.intersectsSphere(rr)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Rs),Yh.multiplyMatrices(n,Rs),sr.matrixWorld=Yh,sr.raycast(e,Ma);for(let a=0,o=Ma.length;a<o;a++){const l=Ma[a];l.instanceId=r,l.object=this,t.push(l)}Ma.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Or(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Pc(new Float32Array(i*this.count),i,this.count,Mc,Gn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=i*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const ss=new mi,y0=new Se(.5,.5),ya=new F;class kr{constructor(e=new Gi,t=new Gi,n=new Gi,i=new Gi,r=new Gi,a=new Gi){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Qn,n=!1){const i=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],u=r[5],d=r[6],f=r[7],p=r[8],x=r[9],m=r[10],g=r[11],v=r[12],y=r[13],_=r[14],S=r[15];if(i[0].setComponents(c-a,f-h,g-p,S-v).normalize(),i[1].setComponents(c+a,f+h,g+p,S+v).normalize(),i[2].setComponents(c+o,f+u,g+x,S+y).normalize(),i[3].setComponents(c-o,f-u,g-x,S-y).normalize(),n)i[4].setComponents(l,d,m,_).normalize(),i[5].setComponents(c-l,f-d,g-m,S-_).normalize();else if(i[4].setComponents(c-l,f-d,g-m,S-_).normalize(),t===Qn)i[5].setComponents(c+l,f+d,g+m,S+_).normalize();else if(t===Ur)i[5].setComponents(l,d,m,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ss.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ss.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ss)}intersectsSprite(e){ss.center.set(0,0,0);const t=y0.distanceTo(e.center);return ss.radius=.7071067811865476+t,ss.applyMatrix4(e.matrixWorld),this.intersectsSphere(ss)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(ya.x=i.normal.x>0?e.max.x:e.min.x,ya.y=i.normal.y>0?e.max.y:e.min.y,ya.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(ya)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const Jh=new ke;class Ic{constructor(){this.coordinateSystem=Qn,this._frustums=[],this._count=0}setFromArrayCamera(e){const t=e.cameras,n=this._frustums;for(let i=0;i<t.length;i++){const r=t[i];Jh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[i]===void 0&&(n[i]=new kr),n[i].setFromProjectionMatrix(Jh,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;const t=this._frustums,n=e._frustums;for(let i=0;i<e._count;i++)t[i]===void 0&&(t[i]=new kr),t[i].copy(n[i]);return this._count=e._count,this}clone(){return new Ic().copy(this)}}class sf extends ei{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new le(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Qa=new F,ja=new F,Zh=new ke,ar=new co,Sa=new mi,Ko=new F,Qh=new F;class Nc extends St{constructor(e=new ft,t=new sf){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)Qa.fromBufferAttribute(t,i-1),ja.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=Qa.distanceTo(ja);e.setAttribute("lineDistance",new Le(n,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Sa.copy(n.boundingSphere),Sa.applyMatrix4(i),Sa.radius+=r,e.ray.intersectsSphere(Sa)===!1)return;Zh.copy(i).invert(),ar.copy(e.ray).applyMatrix4(Zh);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){const f=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let x=f,m=p-1;x<m;x+=c){const g=h.getX(x),v=h.getX(x+1),y=ba(this,e,ar,l,g,v,x);y&&t.push(y)}if(this.isLineLoop){const x=h.getX(p-1),m=h.getX(f),g=ba(this,e,ar,l,x,m,p-1);g&&t.push(g)}}else{const f=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let x=f,m=p-1;x<m;x+=c){const g=ba(this,e,ar,l,x,x+1,x);g&&t.push(g)}if(this.isLineLoop){const x=ba(this,e,ar,l,p-1,f,p-1);x&&t.push(x)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ba(s,e,t,n,i,r,a){const o=s.geometry.attributes.position;if(Qa.fromBufferAttribute(o,i),ja.fromBufferAttribute(o,r),t.distanceSqToSegment(Qa,ja,Ko,Qh)>n)return;Ko.applyMatrix4(s.matrixWorld);const c=e.ray.origin.distanceTo(Ko);if(!(c<e.near||c>e.far))return{distance:c,point:Qh.clone().applyMatrix4(s.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:s}}const jh=new F,eu=new F;class S0 extends Nc{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)jh.fromBufferAttribute(t,i),eu.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+jh.distanceTo(eu);e.setAttribute("lineDistance",new Le(n,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class b0 extends Nc{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class rf extends ei{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new le(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const tu=new ke,nc=new co,Ta=new mi,Ea=new F;class af extends St{constructor(e=new ft,t=new rf){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ta.copy(n.boundingSphere),Ta.applyMatrix4(i),Ta.radius+=r,e.ray.intersectsSphere(Ta)===!1)return;tu.copy(i).invert(),nc.copy(e.ray).applyMatrix4(tu);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){const d=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let p=d,x=f;p<x;p++){const m=c.getX(p);Ea.fromBufferAttribute(u,m),nu(Ea,m,l,i,e,t,this)}}else{const d=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let p=d,x=f;p<x;p++)Ea.fromBufferAttribute(u,p),nu(Ea,p,l,i,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function nu(s,e,t,n,i,r,a){const o=nc.distanceSqToPoint(s);if(o<t){const l=new F;nc.closestPointToPoint(s,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class of extends $t{constructor(e=[],t=Bs,n,i,r,a,o,l,c,h){super(e,t,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class $r extends $t{constructor(e,t,n,i,r,a,o,l,c){super(e,t,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Vs extends $t{constructor(e,t,n=fi,i,r,a,o=Kt,l=Kt,c,h=Zi,u=1){if(h!==Zi&&h!==Xi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:u};super(d,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ac(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class lf extends Vs{constructor(e,t=fi,n=Bs,i,r,a=Kt,o=Kt,l,c=Zi){const h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,n,i,r,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class cf extends $t{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class it extends ft{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],u=[];let d=0,f=0;p("z","y","x",-1,-1,n,t,e,a,r,0),p("z","y","x",1,-1,n,t,-e,a,r,1),p("x","z","y",1,1,e,n,t,i,a,2),p("x","z","y",1,-1,e,n,-t,i,a,3),p("x","y","z",1,-1,e,t,n,i,r,4),p("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new Le(c,3)),this.setAttribute("normal",new Le(h,3)),this.setAttribute("uv",new Le(u,2));function p(x,m,g,v,y,_,S,T,M,b,I){const R=_/M,D=S/b,L=_/2,C=S/2,A=T/2,U=M+1,z=b+1;let B=0,K=0;const X=new F;for(let j=0;j<z;j++){const te=j*D-C;for(let Te=0;Te<U;Te++){const Ve=Te*R-L;X[x]=Ve*v,X[m]=te*y,X[g]=A,c.push(X.x,X.y,X.z),X[x]=0,X[m]=0,X[g]=T>0?1:-1,h.push(X.x,X.y,X.z),u.push(Te/M),u.push(1-j/b),B+=1}}for(let j=0;j<b;j++)for(let te=0;te<M;te++){const Te=d+te+U*j,Ve=d+te+U*(j+1),Z=d+(te+1)+U*(j+1),ve=d+(te+1)+U*j;l.push(Te,Ve,ve),l.push(Ve,Z,ve),K+=6}o.addGroup(f,K,I),f+=K,d+=B}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new it(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Dc extends ft{constructor(e=1,t=1,n=4,i=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:i,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),i=Math.max(3,Math.floor(i)),r=Math.max(1,Math.floor(r));const a=[],o=[],l=[],c=[],h=t/2,u=Math.PI/2*e,d=t,f=2*u+d,p=n*2+r,x=i+1,m=new F,g=new F;for(let v=0;v<=p;v++){let y=0,_=0,S=0,T=0;if(v<=n){const I=v/n,R=I*Math.PI/2;_=-h-e*Math.cos(R),S=e*Math.sin(R),T=-e*Math.cos(R),y=I*u}else if(v<=n+r){const I=(v-n)/r;_=-h+I*t,S=e,T=0,y=u+I*d}else{const I=(v-n-r)/n,R=I*Math.PI/2;_=h+e*Math.sin(R),S=e*Math.cos(R),T=e*Math.sin(R),y=u+d+I*u}const M=Math.max(0,Math.min(1,y/f));let b=0;v===0?b=.5/i:v===p&&(b=-.5/i);for(let I=0;I<=i;I++){const R=I/i,D=R*Math.PI*2,L=Math.sin(D),C=Math.cos(D);g.x=-S*C,g.y=_,g.z=S*L,o.push(g.x,g.y,g.z),m.set(-S*C,T,S*L),m.normalize(),l.push(m.x,m.y,m.z),c.push(R+b,M)}if(v>0){const I=(v-1)*x;for(let R=0;R<i;R++){const D=I+R,L=I+R+1,C=v*x+R,A=v*x+R+1;a.push(D,L,C),a.push(L,A,C)}}}this.setIndex(a),this.setAttribute("position",new Le(o,3)),this.setAttribute("normal",new Le(l,3)),this.setAttribute("uv",new Le(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Dc(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}}class Uc extends ft{constructor(e=1,t=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);const r=[],a=[],o=[],l=[],c=new F,h=new Se;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){const f=n+u/t*i;c.x=e*Math.cos(f),c.y=e*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Le(a,3)),this.setAttribute("normal",new Le(o,3)),this.setAttribute("uv",new Le(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Uc(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class vt extends ft{constructor(e=1,t=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),r=Math.floor(r);const h=[],u=[],d=[],f=[];let p=0;const x=[],m=n/2;let g=0;v(),a===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new Le(u,3)),this.setAttribute("normal",new Le(d,3)),this.setAttribute("uv",new Le(f,2));function v(){const _=new F,S=new F;let T=0;const M=(t-e)/n;for(let b=0;b<=r;b++){const I=[],R=b/r,D=R*(t-e)+e;for(let L=0;L<=i;L++){const C=L/i,A=C*l+o,U=Math.sin(A),z=Math.cos(A);S.x=D*U,S.y=-R*n+m,S.z=D*z,u.push(S.x,S.y,S.z),_.set(U,M,z).normalize(),d.push(_.x,_.y,_.z),f.push(C,1-R),I.push(p++)}x.push(I)}for(let b=0;b<i;b++)for(let I=0;I<r;I++){const R=x[I][b],D=x[I+1][b],L=x[I+1][b+1],C=x[I][b+1];(e>0||I!==0)&&(h.push(R,D,C),T+=3),(t>0||I!==r-1)&&(h.push(D,L,C),T+=3)}c.addGroup(g,T,0),g+=T}function y(_){const S=p,T=new Se,M=new F;let b=0;const I=_===!0?e:t,R=_===!0?1:-1;for(let L=1;L<=i;L++)u.push(0,m*R,0),d.push(0,R,0),f.push(.5,.5),p++;const D=p;for(let L=0;L<=i;L++){const A=L/i*l+o,U=Math.cos(A),z=Math.sin(A);M.x=I*z,M.y=m*R,M.z=I*U,u.push(M.x,M.y,M.z),d.push(0,R,0),T.x=U*.5+.5,T.y=z*.5*R+.5,f.push(T.x,T.y),p++}for(let L=0;L<i;L++){const C=S+L,A=D+L;_===!0?h.push(A,A+1,C):h.push(A+1,A,C),b+=3}c.addGroup(g,b,_===!0?1:2),g+=b}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new vt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Cn extends vt{constructor(e=1,t=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new Cn(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Jr extends ft{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};const r=[],a=[];o(i),c(n),h(),this.setAttribute("position",new Le(r,3)),this.setAttribute("normal",new Le(r.slice(),3)),this.setAttribute("uv",new Le(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(v){const y=new F,_=new F,S=new F;for(let T=0;T<t.length;T+=3)f(t[T+0],y),f(t[T+1],_),f(t[T+2],S),l(y,_,S,v)}function l(v,y,_,S){const T=S+1,M=[];for(let b=0;b<=T;b++){M[b]=[];const I=v.clone().lerp(_,b/T),R=y.clone().lerp(_,b/T),D=T-b;for(let L=0;L<=D;L++)L===0&&b===T?M[b][L]=I:M[b][L]=I.clone().lerp(R,L/D)}for(let b=0;b<T;b++)for(let I=0;I<2*(T-b)-1;I++){const R=Math.floor(I/2);I%2===0?(d(M[b][R+1]),d(M[b+1][R]),d(M[b][R])):(d(M[b][R+1]),d(M[b+1][R+1]),d(M[b+1][R]))}}function c(v){const y=new F;for(let _=0;_<r.length;_+=3)y.x=r[_+0],y.y=r[_+1],y.z=r[_+2],y.normalize().multiplyScalar(v),r[_+0]=y.x,r[_+1]=y.y,r[_+2]=y.z}function h(){const v=new F;for(let y=0;y<r.length;y+=3){v.x=r[y+0],v.y=r[y+1],v.z=r[y+2];const _=m(v)/2/Math.PI+.5,S=g(v)/Math.PI+.5;a.push(_,1-S)}p(),u()}function u(){for(let v=0;v<a.length;v+=6){const y=a[v+0],_=a[v+2],S=a[v+4],T=Math.max(y,_,S),M=Math.min(y,_,S);T>.9&&M<.1&&(y<.2&&(a[v+0]+=1),_<.2&&(a[v+2]+=1),S<.2&&(a[v+4]+=1))}}function d(v){r.push(v.x,v.y,v.z)}function f(v,y){const _=v*3;y.x=e[_+0],y.y=e[_+1],y.z=e[_+2]}function p(){const v=new F,y=new F,_=new F,S=new F,T=new Se,M=new Se,b=new Se;for(let I=0,R=0;I<r.length;I+=9,R+=6){v.set(r[I+0],r[I+1],r[I+2]),y.set(r[I+3],r[I+4],r[I+5]),_.set(r[I+6],r[I+7],r[I+8]),T.set(a[R+0],a[R+1]),M.set(a[R+2],a[R+3]),b.set(a[R+4],a[R+5]),S.copy(v).add(y).add(_).divideScalar(3);const D=m(S);x(T,R+0,v,D),x(M,R+2,y,D),x(b,R+4,_,D)}}function x(v,y,_,S){S<0&&v.x===1&&(a[y]=v.x-1),_.x===0&&_.z===0&&(a[y]=S/2/Math.PI+.5)}function m(v){return Math.atan2(v.z,-v.x)}function g(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Jr(e.vertices,e.indices,e.radius,e.detail)}}class Ws extends Jr{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Ws(e.radius,e.detail)}}class gi{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ce("Curve: .getPoint() not implemented.")}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,i=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){const n=this.getLengths();let i=0;const r=n.length;let a;t?a=t:a=e*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(r-1);const h=n[i],d=n[i+1]-h,f=(a-h)/d;return(i+f)/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);const a=this.getPoint(i),o=this.getPoint(r),l=t||(a.isVector2?new Se:new F);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){const n=new F,i=[],r=[],a=[],o=new F,l=new ke;for(let f=0;f<=e;f++){const p=f/e;i[f]=this.getTangentAt(p,new F)}r[0]=new F,a[0]=new F;let c=Number.MAX_VALUE;const h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(i[f-1],i[f]),o.length()>Number.EPSILON){o.normalize();const p=Math.acos(Je(i[f-1].dot(i[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,p))}a[f].crossVectors(i[f],r[f])}if(t===!0){let f=Math.acos(Je(r[0].dot(r[e]),-1,1));f/=e,i[0].dot(o.crossVectors(r[0],r[e]))>0&&(f=-f);for(let p=1;p<=e;p++)r[p].applyMatrix4(l.makeRotationAxis(i[p],f*p)),a[p].crossVectors(i[p],r[p])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){const e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}}class Fc extends gi{constructor(e=0,t=0,n=1,i=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new Se){const n=t,i=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(a?r=0:r=i),this.aClockwise===!0&&!a&&(r===i?r=-i:r=r-i);const o=this.aStartAngle+e*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}}class T0 extends Fc{constructor(e,t,n,i,r,a){super(e,t,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Oc(){let s=0,e=0,t=0,n=0;function i(r,a,o,l){s=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,f*=h,i(a,o,d,f)},calc:function(r){const a=r*r,o=a*r;return s+e*r+t*a+n*o}}}const iu=new F,su=new F,Yo=new Oc,$o=new Oc,Jo=new Oc;class E0 extends gi{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new F){const n=t,i=this.points,r=i.length,a=(r-(this.closed?0:1))*e;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=i[(o-1)%r]:(su.subVectors(i[0],i[1]).add(i[0]),c=su);const u=i[o%r],d=i[(o+1)%r];if(this.closed||o+2<r?h=i[(o+2)%r]:(iu.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=iu),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let p=Math.pow(c.distanceToSquared(u),f),x=Math.pow(u.distanceToSquared(d),f),m=Math.pow(d.distanceToSquared(h),f);x<1e-4&&(x=1),p<1e-4&&(p=x),m<1e-4&&(m=x),Yo.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,p,x,m),$o.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,p,x,m),Jo.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,p,x,m)}else this.curveType==="catmullrom"&&(Yo.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),$o.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),Jo.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(Yo.calc(l),$o.calc(l),Jo.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const i=e.points[t];this.points.push(new F().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}function ru(s,e,t,n,i){const r=(n-e)*.5,a=(i-t)*.5,o=s*s,l=s*o;return(2*t-2*n+r+a)*l+(-3*t+3*n-2*r-a)*o+r*s+t}function w0(s,e){const t=1-s;return t*t*e}function A0(s,e){return 2*(1-s)*s*e}function R0(s,e){return s*s*e}function Tr(s,e,t,n){return w0(s,e)+A0(s,t)+R0(s,n)}function C0(s,e){const t=1-s;return t*t*t*e}function P0(s,e){const t=1-s;return 3*t*t*s*e}function L0(s,e){return 3*(1-s)*s*s*e}function I0(s,e){return s*s*s*e}function Er(s,e,t,n,i){return C0(s,e)+P0(s,t)+L0(s,n)+I0(s,i)}class hf extends gi{constructor(e=new Se,t=new Se,n=new Se,i=new Se){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new Se){const n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Er(e,i.x,r.x,a.x,o.x),Er(e,i.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class N0 extends gi{constructor(e=new F,t=new F,n=new F,i=new F){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new F){const n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Er(e,i.x,r.x,a.x,o.x),Er(e,i.y,r.y,a.y,o.y),Er(e,i.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class uf extends gi{constructor(e=new Se,t=new Se){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new Se){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new Se){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class D0 extends gi{constructor(e=new F,t=new F){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new F){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new F){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class df extends gi{constructor(e=new Se,t=new Se,n=new Se){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new Se){const n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(Tr(e,i.x,r.x,a.x),Tr(e,i.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class U0 extends gi{constructor(e=new F,t=new F,n=new F){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new F){const n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(Tr(e,i.x,r.x,a.x),Tr(e,i.y,r.y,a.y),Tr(e,i.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class ff extends gi{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new Se){const n=t,i=this.points,r=(i.length-1)*e,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(ru(o,l.x,c.x,h.x,u.x),ru(o,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const i=e.points[t];this.points.push(i.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const i=e.points[t];this.points.push(new Se().fromArray(i))}return this}}var au=Object.freeze({__proto__:null,ArcCurve:T0,CatmullRomCurve3:E0,CubicBezierCurve:hf,CubicBezierCurve3:N0,EllipseCurve:Fc,LineCurve:uf,LineCurve3:D0,QuadraticBezierCurve:df,QuadraticBezierCurve3:U0,SplineCurve:ff});class F0 extends gi{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new au[n](t,e))}return this}getPoint(e,t){const n=e*this.getLength(),i=this.getCurveLengths();let r=0;for(;r<i.length;){if(i[r]>=n){const a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let n;for(let i=0,r=this.curves;i<r.length;i++){const a=r[i],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this.cacheLengths=null,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){const i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const i=e.curves[t];this.curves.push(new au[i.type]().fromJSON(i))}return this.cacheLengths=null,this}}class ou extends F0{constructor(e){super(),this.type="Path",this.currentPoint=new Se,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const n=new uf(this.currentPoint.clone(),new Se(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){const r=new df(this.currentPoint.clone(),new Se(e,t),new Se(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,a){const o=new hf(this.currentPoint.clone(),new Se(e,t),new Se(n,i),new Se(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),n=new ff(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,i,r,a),this}absarc(e,t,n,i,r,a){return this.absellipse(e,t,n,n,i,r,a),this}ellipse(e,t,n,i,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,i,r,a,o,l),this}absellipse(e,t,n,i,r,a,o,l){const c=new Fc(e,t,n,i,r,a,o,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}}class pf extends ou{constructor(e){super(e),this.uuid=ti(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){const i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const i=e.holes[t];this.holes.push(new ou().fromJSON(i))}return this}}function O0(s,e,t=2){const n=e&&e.length,i=n?e[0]*t:s.length;let r=mf(s,0,i,t,!0);const a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(n&&(r=H0(s,e,r,t)),s.length>80*t){o=s[0],l=s[1];let h=o,u=l;for(let d=t;d<i;d+=t){const f=s[d],p=s[d+1];f<o&&(o=f),p<l&&(l=p),f>h&&(h=f),p>u&&(u=p)}c=Math.max(h-o,u-l),c=c!==0?32767/c:0}return zr(r,a,t,o,l,c,0),a}function mf(s,e,t,n,i){let r;if(i===j0(s,e,t,n)>0)for(let a=e;a<t;a+=n)r=lu(a/n|0,s[a],s[a+1],r);else for(let a=t-n;a>=e;a-=n)r=lu(a/n|0,s[a],s[a+1],r);return r&&Xs(r,r.next)&&(Gr(r),r=r.next),r}function ms(s,e){if(!s)return s;e||(e=s);let t=s,n;do if(n=!1,!t.steiner&&(Xs(t,t.next)||Lt(t.prev,t,t.next)===0)){if(Gr(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function zr(s,e,t,n,i,r,a){if(!s)return;!a&&r&&K0(s,n,i,r);let o=s;for(;s.prev!==s.next;){const l=s.prev,c=s.next;if(r?z0(s,n,i,r):k0(s)){e.push(l.i,s.i,c.i),Gr(s),s=c.next,o=c.next;continue}if(s=c,s===o){a?a===1?(s=B0(ms(s),e),zr(s,e,t,n,i,r,2)):a===2&&G0(s,e,t,n,i,r):zr(ms(s),e,t,n,i,r,1);break}}}function k0(s){const e=s.prev,t=s,n=s.next;if(Lt(e,t,n)>=0)return!1;const i=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=Math.min(i,r,a),u=Math.min(o,l,c),d=Math.max(i,r,a),f=Math.max(o,l,c);let p=n.next;for(;p!==e;){if(p.x>=h&&p.x<=d&&p.y>=u&&p.y<=f&&pr(i,o,r,l,a,c,p.x,p.y)&&Lt(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function z0(s,e,t,n){const i=s.prev,r=s,a=s.next;if(Lt(i,r,a)>=0)return!1;const o=i.x,l=r.x,c=a.x,h=i.y,u=r.y,d=a.y,f=Math.min(o,l,c),p=Math.min(h,u,d),x=Math.max(o,l,c),m=Math.max(h,u,d),g=ic(f,p,e,t,n),v=ic(x,m,e,t,n);let y=s.prevZ,_=s.nextZ;for(;y&&y.z>=g&&_&&_.z<=v;){if(y.x>=f&&y.x<=x&&y.y>=p&&y.y<=m&&y!==i&&y!==a&&pr(o,h,l,u,c,d,y.x,y.y)&&Lt(y.prev,y,y.next)>=0||(y=y.prevZ,_.x>=f&&_.x<=x&&_.y>=p&&_.y<=m&&_!==i&&_!==a&&pr(o,h,l,u,c,d,_.x,_.y)&&Lt(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;y&&y.z>=g;){if(y.x>=f&&y.x<=x&&y.y>=p&&y.y<=m&&y!==i&&y!==a&&pr(o,h,l,u,c,d,y.x,y.y)&&Lt(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;_&&_.z<=v;){if(_.x>=f&&_.x<=x&&_.y>=p&&_.y<=m&&_!==i&&_!==a&&pr(o,h,l,u,c,d,_.x,_.y)&&Lt(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function B0(s,e){let t=s;do{const n=t.prev,i=t.next.next;!Xs(n,i)&&xf(n,t,t.next,i)&&Br(n,i)&&Br(i,n)&&(e.push(n.i,t.i,i.i),Gr(t),Gr(t.next),t=s=i),t=t.next}while(t!==s);return ms(t)}function G0(s,e,t,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&J0(a,o)){let l=_f(a,o);a=ms(a,a.next),l=ms(l,l.next),zr(a,e,t,n,i,r,0),zr(l,e,t,n,i,r,0);return}o=o.next}a=a.next}while(a!==s)}function H0(s,e,t,n){const i=[];for(let r=0,a=e.length;r<a;r++){const o=e[r]*n,l=r<a-1?e[r+1]*n:s.length,c=mf(s,o,l,n,!1);c===c.next&&(c.steiner=!0),i.push($0(c))}i.sort(V0);for(let r=0;r<i.length;r++)t=W0(i[r],t);return t}function V0(s,e){let t=s.x-e.x;if(t===0&&(t=s.y-e.y,t===0)){const n=(s.next.y-s.y)/(s.next.x-s.x),i=(e.next.y-e.y)/(e.next.x-e.x);t=n-i}return t}function W0(s,e){const t=X0(s,e);if(!t)return e;const n=_f(t,s);return ms(n,n.next),ms(t,t.next)}function X0(s,e){let t=e;const n=s.x,i=s.y;let r=-1/0,a;if(Xs(s,t))return t;do{if(Xs(s,t.next))return t.next;if(i<=t.y&&i>=t.next.y&&t.next.y!==t.y){const u=t.x+(i-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=n&&u>r&&(r=u,a=t.x<t.next.x?t:t.next,u===n))return a}t=t.next}while(t!==e);if(!a)return null;const o=a,l=a.x,c=a.y;let h=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&gf(i<c?n:r,i,l,c,i<c?r:n,i,t.x,t.y)){const u=Math.abs(i-t.y)/(n-t.x);Br(t,s)&&(u<h||u===h&&(t.x>a.x||t.x===a.x&&q0(a,t)))&&(a=t,h=u)}t=t.next}while(t!==o);return a}function q0(s,e){return Lt(s.prev,s,e.prev)<0&&Lt(e.next,s,s.next)<0}function K0(s,e,t,n){let i=s;do i.z===0&&(i.z=ic(i.x,i.y,e,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,Y0(i)}function Y0(s){let e,t=1;do{let n=s,i;s=null;let r=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(i=n,n=n.nextZ,o--):(i=a,a=a.nextZ,l--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=a}r.nextZ=null,t*=2}while(e>1);return s}function ic(s,e,t,n,i){return s=(s-t)*i|0,e=(e-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,s|e<<1}function $0(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function gf(s,e,t,n,i,r,a,o){return(i-a)*(e-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(i-a)*(n-o)}function pr(s,e,t,n,i,r,a,o){return!(s===a&&e===o)&&gf(s,e,t,n,i,r,a,o)}function J0(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!Z0(s,e)&&(Br(s,e)&&Br(e,s)&&Q0(s,e)&&(Lt(s.prev,s,e.prev)||Lt(s,e.prev,e))||Xs(s,e)&&Lt(s.prev,s,s.next)>0&&Lt(e.prev,e,e.next)>0)}function Lt(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function Xs(s,e){return s.x===e.x&&s.y===e.y}function xf(s,e,t,n){const i=Aa(Lt(s,e,t)),r=Aa(Lt(s,e,n)),a=Aa(Lt(t,n,s)),o=Aa(Lt(t,n,e));return!!(i!==r&&a!==o||i===0&&wa(s,t,e)||r===0&&wa(s,n,e)||a===0&&wa(t,s,n)||o===0&&wa(t,e,n))}function wa(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function Aa(s){return s>0?1:s<0?-1:0}function Z0(s,e){let t=s;do{if(t.i!==s.i&&t.next.i!==s.i&&t.i!==e.i&&t.next.i!==e.i&&xf(t,t.next,s,e))return!0;t=t.next}while(t!==s);return!1}function Br(s,e){return Lt(s.prev,s,s.next)<0?Lt(s,e,s.next)>=0&&Lt(s,s.prev,e)>=0:Lt(s,e,s.prev)<0||Lt(s,s.next,e)<0}function Q0(s,e){let t=s,n=!1;const i=(s.x+e.x)/2,r=(s.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&i<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==s);return n}function _f(s,e){const t=sc(s.i,s.x,s.y),n=sc(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function lu(s,e,t,n){const i=sc(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Gr(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function sc(s,e,t){return{i:s,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function j0(s,e,t,n){let i=0;for(let r=e,a=t-n;r<t;r+=n)i+=(s[a]-s[r])*(s[r+1]+s[a+1]),a=r;return i}class eg{static triangulate(e,t,n=2){return O0(e,t,n)}}class wr{static area(e){const t=e.length;let n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return n*.5}static isClockWise(e){return wr.area(e)<0}static triangulateShape(e,t){const n=[],i=[],r=[];cu(e),hu(n,e);let a=e.length;t.forEach(cu);for(let l=0;l<t.length;l++)i.push(a),a+=t[l].length,hu(n,t[l]);const o=eg.triangulate(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}}function cu(s){const e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function hu(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}class Sn extends Jr{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Sn(e.radius,e.detail)}}class Rn extends Jr{constructor(e=1,t=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Rn(e.radius,e.detail)}}class ui extends ft{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=e/o,d=t/l,f=[],p=[],x=[],m=[];for(let g=0;g<h;g++){const v=g*d-a;for(let y=0;y<c;y++){const _=y*u-r;p.push(_,-v,0),x.push(0,0,1),m.push(y/o),m.push(1-g/l)}}for(let g=0;g<l;g++)for(let v=0;v<o;v++){const y=v+c*g,_=v+c*(g+1),S=v+1+c*(g+1),T=v+1+c*g;f.push(y,_,T),f.push(_,S,T)}this.setIndex(f),this.setAttribute("position",new Le(p,3)),this.setAttribute("normal",new Le(x,3)),this.setAttribute("uv",new Le(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ui(e.width,e.height,e.widthSegments,e.heightSegments)}}class Hr extends ft{constructor(e=.5,t=1,n=32,i=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n),i=Math.max(1,i);const o=[],l=[],c=[],h=[];let u=e;const d=(t-e)/i,f=new F,p=new Se;for(let x=0;x<=i;x++){for(let m=0;m<=n;m++){const g=r+m/n*a;f.x=u*Math.cos(g),f.y=u*Math.sin(g),l.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,h.push(p.x,p.y)}u+=d}for(let x=0;x<i;x++){const m=x*(n+1);for(let g=0;g<n;g++){const v=g+m,y=v,_=v+n+1,S=v+n+2,T=v+1;o.push(y,_,T),o.push(_,S,T)}}this.setIndex(o),this.setAttribute("position",new Le(l,3)),this.setAttribute("normal",new Le(c,3)),this.setAttribute("uv",new Le(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Hr(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}class kc extends ft{constructor(e=new pf([new Se(0,.5),new Se(-.5,-.5),new Se(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};const n=[],i=[],r=[],a=[];let o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new Le(i,3)),this.setAttribute("normal",new Le(r,3)),this.setAttribute("uv",new Le(a,2));function c(h){const u=i.length/3,d=h.extractPoints(t);let f=d.shape;const p=d.holes;wr.isClockWise(f)===!1&&(f=f.reverse());for(let m=0,g=p.length;m<g;m++){const v=p[m];wr.isClockWise(v)===!0&&(p[m]=v.reverse())}const x=wr.triangulateShape(f,p);for(let m=0,g=p.length;m<g;m++){const v=p[m];f=f.concat(v)}for(let m=0,g=f.length;m<g;m++){const v=f[m];i.push(v.x,v.y,0),r.push(0,0,1),a.push(v.x,v.y)}for(let m=0,g=x.length;m<g;m++){const v=x[m],y=v[0]+u,_=v[1]+u,S=v[2]+u;n.push(y,_,S),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON(),t=this.parameters.shapes;return tg(t,e)}static fromJSON(e,t){const n=[];for(let i=0,r=e.shapes.length;i<r;i++){const a=t[e.shapes[i]];n.push(a)}return new kc(n,e.curveSegments)}}function tg(s,e){if(e.shapes=[],Array.isArray(s))for(let t=0,n=s.length;t<n;t++){const i=s[t];e.shapes.push(i.uuid)}else e.shapes.push(s.uuid);return e}class cn extends ft{constructor(e=1,t=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],u=new F,d=new F,f=[],p=[],x=[],m=[];for(let g=0;g<=n;g++){const v=[],y=g/n,_=a+y*o,S=e*Math.cos(_),T=Math.sqrt(e*e-S*S);let M=0;g===0&&a===0?M=.5/t:g===n&&l===Math.PI&&(M=-.5/t);for(let b=0;b<=t;b++){const I=b/t,R=i+I*r;u.x=-T*Math.cos(R),u.y=S,u.z=T*Math.sin(R),p.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),m.push(I+M,1-y),v.push(c++)}h.push(v)}for(let g=0;g<n;g++)for(let v=0;v<t;v++){const y=h[g][v+1],_=h[g][v],S=h[g+1][v],T=h[g+1][v+1];(g!==0||a>0)&&f.push(y,_,T),(g!==n-1||l<Math.PI)&&f.push(_,S,T)}this.setIndex(f),this.setAttribute("position",new Le(p,3)),this.setAttribute("normal",new Le(x,3)),this.setAttribute("uv",new Le(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new cn(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class ho extends ft{constructor(e=1,t=.4,n=12,i=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),i=Math.floor(i);const l=[],c=[],h=[],u=[],d=new F,f=new F,p=new F;for(let x=0;x<=n;x++){const m=a+x/n*o;for(let g=0;g<=i;g++){const v=g/i*r;f.x=(e+t*Math.cos(m))*Math.cos(v),f.y=(e+t*Math.cos(m))*Math.sin(v),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(v),d.y=e*Math.sin(v),p.subVectors(f,d).normalize(),h.push(p.x,p.y,p.z),u.push(g/i),u.push(x/n)}}for(let x=1;x<=n;x++)for(let m=1;m<=i;m++){const g=(i+1)*x+m-1,v=(i+1)*(x-1)+m-1,y=(i+1)*(x-1)+m,_=(i+1)*x+m;l.push(g,v,_),l.push(v,y,_)}this.setIndex(l),this.setAttribute("position",new Le(c,3)),this.setAttribute("normal",new Le(h,3)),this.setAttribute("uv",new Le(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ho(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}function qs(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];if(uu(i))i.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone();else if(Array.isArray(i))if(uu(i[0])){const r=[];for(let a=0,o=i.length;a<o;a++)r[a]=i[a].clone();e[t][n]=r}else e[t][n]=i.slice();else e[t][n]=i}}return e}function _n(s){const e={};for(let t=0;t<s.length;t++){const n=qs(s[t]);for(const i in n)e[i]=n[i]}return e}function uu(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function ng(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function vf(s){const e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Qe.workingColorSpace}const ig={clone:qs,merge:_n};var sg=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,rg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class En extends ei{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=sg,this.fragmentShader=rg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=qs(e.uniforms),this.uniformsGroups=ng(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const i=e.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=t[i.value]||null;break;case"c":this.uniforms[n].value=new le().setHex(i.value);break;case"v2":this.uniforms[n].value=new Se().fromArray(i.value);break;case"v3":this.uniforms[n].value=new F().fromArray(i.value);break;case"v4":this.uniforms[n].value=new mt().fromArray(i.value);break;case"m3":this.uniforms[n].value=new He().fromArray(i.value);break;case"m4":this.uniforms[n].value=new ke().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class ag extends En{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class zc extends ei{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new le(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ya,this.normalScale=new Se(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class ni extends zc{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Se(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Je(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new le(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new le(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new le(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(e){this._diffuseRoughness>0!=e>0&&this.version++,this._diffuseRoughness=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}get iridescenceThicknessRange(){return Fs('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(e){Fs('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),this.iridescenceThicknessMinimum=e[0],this.iridescenceThicknessMaximum=e[1]}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.diffuseRoughness=e.diffuseRoughness,this.diffuseRoughnessMap=e.diffuseRoughnessMap,this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum,this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class jn extends ei{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ya,this.normalScale=new Se(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=mc,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class og extends ei{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Mm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class lg extends ei{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Hi(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function mr(s){return s!==void 0&&s.inTangents!==void 0&&s.outTangents!==void 0}function cg(s){function e(i,r){return s[i]-s[r]}const t=s.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function du(s,e,t){const n=s.length,i=new s.constructor(n);for(let r=0,a=0;a!==n;++r){const o=t[r]*e;for(let l=0;l!==e;++l)i[a++]=s[o+l]}return i}function hg(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(e.push(r.time),t.push(...a)),r=s[i++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(e.push(r.time),a.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do a=r[n],a!==void 0&&(e.push(r.time),t.push(a)),r=s[i++];while(r!==void 0)}class Ks{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,i=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break e}a=t.length;break t}if(!(e>=r)){const o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){const o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class ug extends Ks{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Sh,endingEnd:Sh}}intervalChanged_(e,t,n){const i=this.parameterPositions;let r=e-2,a=e+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case bh:r=e,o=2*t-n;break;case Th:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case bh:a=e,l=2*n-t;break;case Th:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}const c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(i-t),x=p*p,m=x*p,g=-d*m+2*d*x-d*p,v=(1+d)*m+(-1.5-2*d)*x+(-.5+d)*p+1,y=(-1-f)*m+(1.5+f)*x+.5*p,_=f*m-f*x;for(let S=0;S!==o;++S)r[S]=g*a[h+S]+v*a[c+S]+y*a[l+S]+_*a[u+S];return r}}class dg extends Ks{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}}class fg extends Ks{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class pg extends Ks{interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,u=this.outTangents;if(!h||!u){const p=(n-t)/(i-t),x=1-p;for(let m=0;m!==o;++m)r[m]=a[c+m]*x+a[l+m]*p;return r}const d=o*2,f=e-1;for(let p=0;p!==o;++p){const x=a[c+p],m=a[l+p],g=f*d+p*2,v=u[g],y=u[g+1],_=e*d+p*2,S=h[_],T=h[_+1],M=gg(n,t,v,S,i);r[p]=Mf(M,x,y,T,m)}return r}}function Mf(s,e,t,n,i){const r=1-s;return r*r*r*e+3*r*r*s*t+3*r*s*s*n+s*s*s*i}function mg(s,e,t,n,i){const r=1-s;return 3*r*r*(t-e)+6*r*s*(n-t)+3*s*s*(i-n)}function gg(s,e,t,n,i){let r=(s-e)/(i-e);for(let a=0;a<8;a++){const o=Mf(r,e,t,n,i)-s;if(Math.abs(o)<1e-10)break;const l=mg(r,e,t,n,i);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}class ii{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Hi(t,this.TimeBufferType),this.values=Hi(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Hi(e.times,Array),values:Hi(e.values,Array)};const i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i),mr(e.settings)&&(n.settings={inTangents:Hi(e.settings.inTangents,Array),outTangents:Hi(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new fg(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new dg(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ug(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){const t=new pg(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Nr:t=this.InterpolantFactoryMethodDiscrete;break;case Dr:t=this.InterpolantFactoryMethodLinear;break;case bo:t=this.InterpolantFactoryMethodSmooth;break;case yh:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ce("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Nr;case this.InterpolantFactoryMethodLinear:return Dr;case this.InterpolantFactoryMethodSmooth:return bo;case this.InterpolantFactoryMethodBezier:return yh}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e;mr(this.settings)&&(fu(this.settings.inTangents,e),fu(this.settings.outTangents,e))}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e;mr(this.settings)&&(pu(this.settings.inTangents,e),pu(this.settings.outTangents,e))}return this}trim(e,t){const n=this.times,i=n.length;let r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);const o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(Be("KeyframeTrack: Invalid value size in track.",this),e=!1);const n=this.times,i=this.values,r=n.length;r===0&&(Be("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){const l=n[o];if(typeof l=="number"&&isNaN(l)){Be("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Be("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&Cm(i))for(let o=0,l=i.length;o!==l;++o){const c=i[o];if(isNaN(c)){Be("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===bo,r=e.length-1;let a=1;for(let o=1;o<r;++o){let l=!1;const c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(i)l=!0;else{const u=o*n,d=u-n,f=u+n;for(let p=0;p!==n;++p){const x=t[u+p];if(x!==t[d+p]||x!==t[f+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];const u=o*n,d=a*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,mr(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}}function fu(s,e){for(let t=0,n=s.length;t!==n;t+=2)s[t]+=e}function pu(s,e){for(let t=0,n=s.length;t!==n;t+=2)s[t]*=e}ii.prototype.ValueTypeName="";ii.prototype.TimeBufferType=Float32Array;ii.prototype.ValueBufferType=Float32Array;ii.prototype.DefaultInterpolation=Dr;class Ys extends ii{constructor(e,t,n){super(e,t,n)}}Ys.prototype.ValueTypeName="bool";Ys.prototype.ValueBufferType=Array;Ys.prototype.DefaultInterpolation=Nr;Ys.prototype.InterpolantFactoryMethodLinear=void 0;Ys.prototype.InterpolantFactoryMethodSmooth=void 0;class yf extends ii{constructor(e,t,n,i){super(e,t,n,i)}}yf.prototype.ValueTypeName="color";class Vr extends ii{constructor(e,t,n,i){super(e,t,n,i)}}Vr.prototype.ValueTypeName="number";class xg extends Ks{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t);let c=e*o;for(let h=c+o;c!==h;c+=4)In.slerpFlat(r,0,a,c-o,a,c,l);return r}}class Wr extends ii{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new xg(this.times,this.values,this.getValueSize(),e)}}Wr.prototype.ValueTypeName="quaternion";Wr.prototype.InterpolantFactoryMethodSmooth=void 0;class $s extends ii{constructor(e,t,n){super(e,t,n)}}$s.prototype.ValueTypeName="string";$s.prototype.ValueBufferType=Array;$s.prototype.DefaultInterpolation=Nr;$s.prototype.InterpolantFactoryMethodLinear=void 0;$s.prototype.InterpolantFactoryMethodSmooth=void 0;class eo extends ii{constructor(e,t,n,i){super(e,t,n,i)}}eo.prototype.ValueTypeName="vector";class _g{constructor(e="",t=-1,n=[],i=_m){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=ti(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,i=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push(Mg(n[a]).scale(i));const r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){const t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,a=n.length;r!==a;++r)t.push(ii.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){const r=t.length,a=[];for(let o=0;o<r;o++){let l=[],c=[];l.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);const h=cg(l);l=du(l,1,h),c=du(c,1,h),!i&&l[0]===0&&(l.push(r),c.push(c[0])),a.push(new Vr(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){const c=e[o],h=c.name.match(r);if(h&&h.length>1){const u=h[1];let d=i[u];d||(i[u]=d=[]),d.push(c)}}const a=[];for(const o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return a}resetDuration(){const e=this.tracks;let t=0;for(let n=0,i=e.length;n!==i;++n){const r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());const t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function vg(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Vr;case"vector":case"vector2":case"vector3":case"vector4":return eo;case"color":return yf;case"quaternion":return Wr;case"bool":case"boolean":return Ys;case"string":return $s}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function Mg(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=vg(s.type);if(s.times===void 0){const n=[],i=[];hg(s.keys,n,i,"value"),s.times=n,s.values=i}let t;return e.parse!==void 0?t=e.parse(s):t=new e(s.name,s.times,s.values,s.interpolation),mr(s.settings)&&(t.settings={inTangents:Hi(s.settings.inTangents,Float32Array),outTangents:Hi(s.settings.outTangents,Float32Array)}),t}const wi={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(mu(s)||(this.files[s]=e))},get:function(s){if(this.enabled!==!1&&!mu(s))return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};function mu(s){try{const e=s.slice(s.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class yg{constructor(e,t,n){const i=this;let r=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&i.onStart!==void 0&&i.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,i.onProgress!==void 0&&i.onProgress(h,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){const u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){const f=c[u],p=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Sg=new yg;class Js{constructor(e){this.manager=e!==void 0?e:Sg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}}Js.DEFAULT_MATERIAL_NAME="__DEFAULT";const bi={};class bg extends Error{constructor(e,t){super(e),this.response=t}}class Sf extends Js{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=wi.get(`file:${e}`);if(r!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0);return}if(bi[e]!==void 0){bi[e].push({onLoad:t,onProgress:n,onError:i});return}bi[e]=[],bi[e].push({onLoad:t,onProgress:n,onError:i});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",priority:this.priority,cache:this.cache,signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ce("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=bi[e],u=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=d?parseInt(d):0,p=f!==0;let x=0;const m=new ReadableStream({start(g){v();function v(){u.read().then(({done:y,value:_})=>{if(y)g.close();else{x+=_.byteLength;const S=new ProgressEvent("progress",{lengthComputable:p,loaded:x,total:f});for(let T=0,M=h.length;T<M;T++){const b=h[T];b.onProgress&&b.onProgress(S)}g.enqueue(_),v()}},y=>{g.error(y)})}}});return new Response(m)}else throw new bg(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{const u=/charset="?([^;"\s]*)"?/i.exec(o),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return c.arrayBuffer().then(p=>f.decode(p))}}}).then(c=>{wi.add(`file:${e}`,c);const h=bi[e];delete bi[e];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onLoad&&f.onLoad(c)}}).catch(c=>{const h=bi[e];if(h===void 0)throw this.manager.itemError(e),c;delete bi[e];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onError&&f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Cs=new WeakMap;class Tg extends Js{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=wi.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let u=Cs.get(a);u===void 0&&(u=[],Cs.set(a,u)),u.push({onLoad:t,onError:i})}return a}const o=Fr("img");function l(){h(),t&&t(this);const u=Cs.get(this)||[];for(let d=0;d<u.length;d++){const f=u[d];f.onLoad&&f.onLoad(this)}Cs.delete(this),r.manager.itemEnd(e)}function c(u){h(),i&&i(u),wi.remove(`image:${e}`);const d=Cs.get(this)||[];for(let f=0;f<d.length;f++){const p=d[f];p.onError&&p.onError(u)}Cs.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),wi.add(`image:${e}`,o),r.manager.itemStart(e),o.fetchPriority=this.priority,o.src=e,o}}class Eg extends Js{constructor(e){super(e)}load(e,t,n,i){const r=new $t,a=new Tg(this.manager);return a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}}class uo extends St{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new le(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}class wg extends uo{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.groundColor=new le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){const t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}}const Zo=new ke,gu=new F,xu=new F;class Bc{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Se(512,512),this.mapType=Pn,this.map=null,this.mapPass=null,this.matrix=new ke,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new kr,this._frameExtents=new Se(1,1),this._viewportCount=1,this._viewports=[new mt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera;gu.setFromMatrixPosition(e.matrixWorld),t.position.copy(gu),xu.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(xu),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,i){Zo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Zo,e.coordinateSystem,e.reversedDepth);const r=this._frameExtents,a=i?i.z/r.x:1,o=i?i.w/r.y:1,l=i?i.x/r.x:0,c=i?i.y/r.y:0;e.coordinateSystem===Ur||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Zo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Ra=new F,Ca=new In,ri=new F;class bf extends St{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ke,this.projectionMatrix=new ke,this.projectionMatrixInverse=new ke,this.coordinateSystem=Qn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ra,Ca,ri),ri.x===1&&ri.y===1&&ri.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,ri.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ra,Ca,ri),ri.x===1&&ri.y===1&&ri.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,ri.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const ki=new F,_u=new Se,vu=new Se;class vn extends bf{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Hs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Sr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Hs*2*Math.atan(Math.tan(Sr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){ki.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ki.x,ki.y).multiplyScalar(-e/ki.z),ki.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ki.x,ki.y).multiplyScalar(-e/ki.z)}getViewSize(e,t){return this.getViewBounds(e,_u,vu),t.subVectors(vu,_u)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Sr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Ag extends Bc{constructor(){super(new vn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,n=Hs*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){const e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}}class Rg extends uo{constructor(e,t,n=0,i=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.target=new St,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Ag}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}}class Cg extends Bc{constructor(){super(new vn(90,1,.5,500)),this.isPointLightShadow=!0}}class Pg extends uo{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Cg}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class Gc extends bf{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Lg extends Bc{constructor(){super(new Gc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Tf extends uo{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.target=new St,this.shadow=new Lg}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class Ar{static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}const Qo=new WeakMap;class Ig extends Js{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Ce("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Ce("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=wi.get(`image-bitmap:${e}`);if(a!==void 0){if(r.manager.itemStart(e),a.then){a.then(c=>{Qo.has(a)===!0?(i&&i(Qo.get(a)),r.manager.itemError(e),r.manager.itemEnd(e)):(t&&t(c),r.manager.itemEnd(e))});return}setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);return}const o={};o.credentials=this.withCredentials||this.crossOrigin!=="anonymous"?"include":"same-origin",o.headers=this.requestHeader,o.priority=this.priority,o.cache=this.cache,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},r.options,{colorSpaceConversion:"none"}))}).then(function(c){return wi.add(`image-bitmap:${e}`,c),t&&t(c),r.manager.itemEnd(e),c}).catch(function(c){i&&i(c),Qo.set(l,c),wi.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});wi.add(`image-bitmap:${e}`,l),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Ps=-90,Ls=1;class rc extends St{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new vn(Ps,Ls,e,t);i.layers=this.layers,this.add(i);const r=new vn(Ps,Ls,e,t);r.layers=this.layers,this.add(r);const a=new vn(Ps,Ls,e,t);a.layers=this.layers,this.add(a);const o=new vn(Ps,Ls,e,t);o.layers=this.layers,this.add(o);const l=new vn(Ps,Ls,e,t);l.layers=this.layers,this.add(l);const c=new vn(Ps,Ls,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,l]=t;for(const c of t)this.remove(c);if(e===Qn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ur)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;const x=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=x,e.setRenderTarget(n,5,i),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}}class Ng extends vn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}}const Hc="\\[\\]\\.:\\/",Dg=new RegExp("["+Hc+"]","g"),Vc="[^"+Hc+"]",Ug="[^"+Hc.replace("\\.","")+"]",Fg=/((?:WC+[\/:])*)/.source.replace("WC",Vc),Og=/(WCOD+)?/.source.replace("WCOD",Ug),kg=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Vc),zg=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Vc),Bg=new RegExp("^"+Fg+Og+kg+zg+"$"),Gg=["material","materials","bones","map"];class Hg{constructor(e,t,n){const i=n||dt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class dt{constructor(e,t,n){this.path=t,this.parsedPath=n||dt.parseTrackName(t),this.node=dt.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new dt.Composite(e,t,n):new dt(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Dg,"")}static parseTrackName(e){const t=Bg.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const r=n.nodeName.substring(i+1);Gg.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(r){for(let a=0;a<r.length;a++){const o=r[a];if(o.name===t||o.uuid===t)return o;const l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,i=t.propertyName;let r=t.propertyIndex;if(e||(e=dt.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ce("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Be("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Be("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Be("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Be("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Be("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Be("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Be("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}const a=e[i];if(a===void 0){const c=t.nodeName;Be("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){Be("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Be("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}dt.Composite=Hg;dt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};dt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};dt.prototype.GetterByBindingType=[dt.prototype._getValue_direct,dt.prototype._getValue_array,dt.prototype._getValue_arrayElement,dt.prototype._getValue_toArray];dt.prototype.SetterByBindingTypeAndVersioning=[[dt.prototype._setValue_direct,dt.prototype._setValue_direct_setNeedsUpdate,dt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_array,dt.prototype._setValue_array_setNeedsUpdate,dt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_arrayElement,dt.prototype._setValue_arrayElement_setNeedsUpdate,dt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_fromArray,dt.prototype._setValue_fromArray_setNeedsUpdate,dt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];function Mu(s,e,t,n){const i=Vg(n);switch(t){case Hd:return s*e;case Mc:return s*e/i.components*i.byteLength;case yc:return s*e/i.components*i.byteLength;case fs:return s*e*2/i.components*i.byteLength;case Sc:return s*e*2/i.components*i.byteLength;case Vd:return s*e*3/i.components*i.byteLength;case Zn:return s*e*4/i.components*i.byteLength;case bc:return s*e*4/i.components*i.byteLength;case Fa:case Oa:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case ka:case za:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case wl:case Rl:return Math.max(s,16)*Math.max(e,8)/4;case El:case Al:return Math.max(s,8)*Math.max(e,8)/2;case Cl:case Pl:case Il:case Nl:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Ll:case qa:case Dl:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Ul:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Fl:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case Ol:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case kl:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case zl:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case Bl:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case Gl:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case Hl:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case Vl:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case Wl:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case Xl:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case ql:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case Kl:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case Yl:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case $l:case Jl:case Zl:return Math.ceil(s/4)*Math.ceil(e/4)*16;case Ql:case jl:return Math.ceil(s/4)*Math.ceil(e/4)*8;case Ka:case ec:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Vg(s){switch(s){case Pn:case kd:return{byteLength:1,components:1};case Ir:case zd:case pi:return{byteLength:2,components:1};case _c:case vc:return{byteLength:2,components:4};case fi:case xc:case Gn:return{byteLength:4,components:1};case Bd:case Gd:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:pc}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=pc);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ef(){let s=null,e=!1,t=null,n=null;function i(r,a){n=s.requestAnimationFrame(i),t(r,a)}return{start:function(){e!==!0&&t!==null&&s!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Wg(s){const e=new WeakMap;function t(o,l){const c=o.array,h=o.usage,u=c.byteLength,d=s.createBuffer();s.bindBuffer(l,d),s.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=s.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=s.SHORT;else if(c instanceof Uint32Array)f=s.UNSIGNED_INT;else if(c instanceof Int32Array)f=s.INT;else if(c instanceof Int8Array)f=s.BYTE;else if(c instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){const h=l.array,u=l.updateRanges;if(s.bindBuffer(c,o),u.length===0)s.bufferSubData(c,0,h);else{u.sort((f,p)=>f.start-p.start);let d=0;for(let f=1;f<u.length;f++){const p=u[d],x=u[f];x.start<=p.start+p.count+1?p.count=Math.max(p.count,x.start+x.count-p.start):(++d,u[d]=x)}u.length=d+1;for(let f=0,p=u.length;f<p;f++){const x=u[f];s.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(s.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:r,update:a}}var Xg=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qg=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Kg=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Yg=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$g=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Jg=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Zg=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qg=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jg=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,ex=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,tx=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,nx=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ix=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,sx=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,rx=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,ax=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ox=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,lx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,cx=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,hx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ux=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,dx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,fx=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,px=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,mx=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,gx=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xx=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_x=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vx=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Mx="gl_FragColor = linearToOutputTexel( gl_FragColor );",yx=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Sx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,bx=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,Tx=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ex=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,wx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ax=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Rx=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Cx=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Px=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lx=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ix=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Nx=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Dx=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ux=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Fx=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Ox=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,kx=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,zx=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Bx=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Gx=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Hx=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Vx=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Wx=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Xx=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,qx=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Kx=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Yx=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$x=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Jx=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Zx=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jx=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,e_=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,t_=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,n_=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,i_=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,s_=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,r_=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,a_=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,o_=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,l_=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,c_=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,h_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,u_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,d_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,f_=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,p_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,m_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,g_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,x_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,__=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,v_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,M_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,y_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,S_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,b_=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,T_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,E_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,w_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,A_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,R_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,C_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,P_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,L_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,I_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,N_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,D_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,U_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,F_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,O_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,k_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,z_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,B_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,G_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,H_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,V_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const W_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,X_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,q_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,K_=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Y_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,J_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Z_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Q_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,j_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,ev=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,tv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,iv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,rv=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,av=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ov=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lv=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,cv=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hv=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,uv=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,dv=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pv=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,mv=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gv=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xv=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_v=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,vv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,bv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ye={alphahash_fragment:Xg,alphahash_pars_fragment:qg,alphamap_fragment:Kg,alphamap_pars_fragment:Yg,alphatest_fragment:$g,alphatest_pars_fragment:Jg,aomap_fragment:Zg,aomap_pars_fragment:Qg,batching_pars_vertex:jg,batching_vertex:ex,begin_vertex:tx,beginnormal_vertex:nx,bsdfs:ix,iridescence_fragment:sx,bumpmap_pars_fragment:rx,clipping_planes_fragment:ax,clipping_planes_pars_fragment:ox,clipping_planes_pars_vertex:lx,clipping_planes_vertex:cx,color_fragment:hx,color_pars_fragment:ux,color_pars_vertex:dx,color_vertex:fx,common:px,defaultnormal_vertex:mx,displacementmap_pars_vertex:gx,displacementmap_vertex:xx,emissivemap_fragment:_x,emissivemap_pars_fragment:vx,colorspace_fragment:Mx,colorspace_pars_fragment:yx,envmap_fragment:Sx,envmap_common_pars_fragment:bx,envmap_pars_fragment:Tx,envmap_pars_vertex:Ex,envmap_physical_pars_fragment:Fx,envmap_vertex:wx,fog_vertex:Ax,fog_pars_vertex:Rx,fog_fragment:Cx,fog_pars_fragment:Px,gradientmap_pars_fragment:Lx,lightmap_pars_fragment:Ix,lights_lambert_fragment:Nx,lights_lambert_pars_fragment:Dx,lights_pars_begin:Ux,lights_toon_fragment:Ox,lights_toon_pars_fragment:kx,lights_phong_fragment:zx,lights_phong_pars_fragment:Bx,lights_physical_fragment:Gx,lights_physical_pars_fragment:Hx,lights_fragment_begin:Vx,lights_fragment_maps:Wx,lights_fragment_end:Xx,lightprobes_pars_fragment:qx,logdepthbuf_fragment:Kx,logdepthbuf_pars_fragment:Yx,logdepthbuf_pars_vertex:$x,logdepthbuf_vertex:Jx,map_fragment:Zx,map_pars_fragment:Qx,map_particle_fragment:jx,map_particle_pars_fragment:e_,metalnessmap_fragment:t_,metalnessmap_pars_fragment:n_,morphinstance_vertex:i_,morphcolor_vertex:s_,morphnormal_vertex:r_,morphtarget_pars_vertex:a_,morphtarget_vertex:o_,normal_fragment_begin:l_,normal_fragment_maps:c_,normal_pars_fragment:h_,normal_pars_vertex:u_,normal_vertex:d_,normalmap_pars_fragment:f_,clearcoat_normal_fragment_begin:p_,clearcoat_normal_fragment_maps:m_,clearcoat_pars_fragment:g_,iridescence_pars_fragment:x_,opaque_fragment:__,packing:v_,premultiplied_alpha_fragment:M_,project_vertex:y_,dithering_fragment:S_,dithering_pars_fragment:b_,roughnessmap_fragment:T_,roughnessmap_pars_fragment:E_,shadowmap_pars_fragment:w_,shadowmap_pars_vertex:A_,shadowmap_vertex:R_,shadowmask_pars_fragment:C_,skinbase_vertex:P_,skinning_pars_vertex:L_,skinning_vertex:I_,skinnormal_vertex:N_,specularmap_fragment:D_,specularmap_pars_fragment:U_,tonemapping_fragment:F_,tonemapping_pars_fragment:O_,transmission_fragment:k_,transmission_pars_fragment:z_,uv_pars_fragment:B_,uv_pars_vertex:G_,uv_vertex:H_,worldpos_vertex:V_,background_vert:W_,background_frag:X_,backgroundCube_vert:q_,backgroundCube_frag:K_,cube_vert:Y_,cube_frag:$_,depth_vert:J_,depth_frag:Z_,distance_vert:Q_,distance_frag:j_,equirect_vert:ev,equirect_frag:tv,linedashed_vert:nv,linedashed_frag:iv,meshbasic_vert:sv,meshbasic_frag:rv,meshlambert_vert:av,meshlambert_frag:ov,meshmatcap_vert:lv,meshmatcap_frag:cv,meshnormal_vert:hv,meshnormal_frag:uv,meshphong_vert:dv,meshphong_frag:fv,meshphysical_vert:pv,meshphysical_frag:mv,meshtoon_vert:gv,meshtoon_frag:xv,points_vert:_v,points_frag:vv,shadow_vert:Mv,shadow_frag:yv,sprite_vert:Sv,sprite_frag:bv},_e={common:{diffuse:{value:new le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new Se(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new le(16777215)},opacity:{value:1},center:{value:new Se(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},ci={basic:{uniforms:_n([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.fog]),vertexShader:Ye.meshbasic_vert,fragmentShader:Ye.meshbasic_frag},lambert:{uniforms:_n([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new le(0)},envMapIntensity:{value:1}}]),vertexShader:Ye.meshlambert_vert,fragmentShader:Ye.meshlambert_frag},phong:{uniforms:_n([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new le(0)},specular:{value:new le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphong_vert,fragmentShader:Ye.meshphong_frag},standard:{uniforms:_n([_e.common,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.roughnessmap,_e.metalnessmap,_e.fog,_e.lights,{emissive:{value:new le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag},toon:{uniforms:_n([_e.common,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.gradientmap,_e.fog,_e.lights,{emissive:{value:new le(0)}}]),vertexShader:Ye.meshtoon_vert,fragmentShader:Ye.meshtoon_frag},matcap:{uniforms:_n([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,{matcap:{value:null}}]),vertexShader:Ye.meshmatcap_vert,fragmentShader:Ye.meshmatcap_frag},points:{uniforms:_n([_e.points,_e.fog]),vertexShader:Ye.points_vert,fragmentShader:Ye.points_frag},dashed:{uniforms:_n([_e.common,_e.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ye.linedashed_vert,fragmentShader:Ye.linedashed_frag},depth:{uniforms:_n([_e.common,_e.displacementmap]),vertexShader:Ye.depth_vert,fragmentShader:Ye.depth_frag},normal:{uniforms:_n([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,{opacity:{value:1}}]),vertexShader:Ye.meshnormal_vert,fragmentShader:Ye.meshnormal_frag},sprite:{uniforms:_n([_e.sprite,_e.fog]),vertexShader:Ye.sprite_vert,fragmentShader:Ye.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ye.background_vert,fragmentShader:Ye.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:Ye.backgroundCube_vert,fragmentShader:Ye.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ye.cube_vert,fragmentShader:Ye.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ye.equirect_vert,fragmentShader:Ye.equirect_frag},distance:{uniforms:_n([_e.common,_e.displacementmap,{referencePosition:{value:new F},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ye.distance_vert,fragmentShader:Ye.distance_frag},shadow:{uniforms:_n([_e.lights,_e.fog,{color:{value:new le(0)},opacity:{value:1}}]),vertexShader:Ye.shadow_vert,fragmentShader:Ye.shadow_frag}};ci.physical={uniforms:_n([ci.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new Se(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new He},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new Se},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new le(0)},specularColor:{value:new le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new Se},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Ye.meshphysical_vert,fragmentShader:Ye.meshphysical_frag};const Pa={r:0,b:0,g:0},Tv=new ke,wf=new He;wf.set(-1,0,0,0,1,0,0,0,1);function Ev(s,e,t,n,i,r){const a=new le(0);let o=i===!0?0:1,l,c,h=null,u=0,d=null;function f(v){let y=v.isScene===!0?v.background:null;if(y&&y.isTexture){const _=v.backgroundBlurriness>0;y=e.get(y,_)}return y}function p(v){let y=!1;const _=f(v);_===null?m(a,o):_&&_.isColor&&(m(_,1),y=!0);const S=s.xr.getEnvironmentBlendMode();S==="additive"?t.buffers.color.setClear(0,0,0,1,r):S==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(s.autoClear||y)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function x(v,y){const _=f(y);_&&_.isCubeTexture?(c===void 0&&(c=new at(new it(1,1,1),new En({name:"BackgroundCubeMaterial",uniforms:qs(ci.backgroundCube.uniforms),vertexShader:ci.backgroundCube.vertexShader,fragmentShader:ci.backgroundCube.fragmentShader,side:Tn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(S,T,M){this.matrixWorld.copyPosition(M.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=_,c.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Tv.makeRotationFromEuler(y.backgroundRotation)).transpose(),_.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(wf),c.material.toneMapped=Qe.getTransfer(_.colorSpace)!==ut,(h!==_||u!==_.version||d!==s.toneMapping)&&(c.material.needsUpdate=!0,h=_,u=_.version,d=s.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new at(new ui(2,2),new En({name:"BackgroundMaterial",uniforms:qs(ci.background.uniforms),vertexShader:ci.background.vertexShader,fragmentShader:ci.background.fragmentShader,side:$i,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.toneMapped=Qe.getTransfer(_.colorSpace)!==ut,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),(h!==_||u!==_.version||d!==s.toneMapping)&&(l.material.needsUpdate=!0,h=_,u=_.version,d=s.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function m(v,y){v.getRGB(Pa,vf(s)),t.buffers.color.setClear(Pa.r,Pa.g,Pa.b,y,r)}function g(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,y=1){a.set(v),o=y,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,m(a,o)},render:p,addToRenderList:x,dispose:g}}function wv(s,e){const t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=d(null);let r=i,a=!1;function o(D,L,C,A,U){let z=!1;const B=u(D,A,C,L);r!==B&&(r=B,c(r.object)),z=f(D,A,C,U),z&&p(D,A,C,U),U!==null&&e.update(U,s.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,_(D,L,C,A),U!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(U).buffer))}function l(){return s.createVertexArray()}function c(D){return s.bindVertexArray(D)}function h(D){return s.deleteVertexArray(D)}function u(D,L,C,A){const U=A.wireframe===!0;let z=n[L.id];z===void 0&&(z={},n[L.id]=z);const B=D.isInstancedMesh===!0?D.id:0;let K=z[B];K===void 0&&(K={},z[B]=K);let X=K[C.id];X===void 0&&(X={},K[C.id]=X);let j=X[U];return j===void 0&&(j=d(l()),X[U]=j),j}function d(D){const L=[],C=[],A=[];for(let U=0;U<t;U++)L[U]=0,C[U]=0,A[U]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:C,attributeDivisors:A,object:D,attributes:{},index:null}}function f(D,L,C,A){const U=r.attributes,z=L.attributes;let B=0;const K=C.getAttributes();for(const X in K)if(K[X].location>=0){const te=U[X];let Te=z[X];if(Te===void 0&&(X==="instanceMatrix"&&D.instanceMatrix&&(Te=D.instanceMatrix),X==="instanceColor"&&D.instanceColor&&(Te=D.instanceColor)),te===void 0||te.attribute!==Te||Te&&te.data!==Te.data)return!0;B++}return r.attributesNum!==B||r.index!==A}function p(D,L,C,A){const U={},z=L.attributes;let B=0;const K=C.getAttributes();for(const X in K)if(K[X].location>=0){let te=z[X];te===void 0&&(X==="instanceMatrix"&&D.instanceMatrix&&(te=D.instanceMatrix),X==="instanceColor"&&D.instanceColor&&(te=D.instanceColor));const Te={};Te.attribute=te,te&&te.data&&(Te.data=te.data),U[X]=Te,B++}r.attributes=U,r.attributesNum=B,r.index=A}function x(){const D=r.newAttributes;for(let L=0,C=D.length;L<C;L++)D[L]=0}function m(D){g(D,0)}function g(D,L){const C=r.newAttributes,A=r.enabledAttributes,U=r.attributeDivisors;C[D]=1,A[D]===0&&(s.enableVertexAttribArray(D),A[D]=1),U[D]!==L&&(s.vertexAttribDivisor(D,L),U[D]=L)}function v(){const D=r.newAttributes,L=r.enabledAttributes;for(let C=0,A=L.length;C<A;C++)L[C]!==D[C]&&(s.disableVertexAttribArray(C),L[C]=0)}function y(D,L,C,A,U,z,B){B===!0?s.vertexAttribIPointer(D,L,C,U,z):s.vertexAttribPointer(D,L,C,A,U,z)}function _(D,L,C,A){x();const U=A.attributes,z=C.getAttributes(),B=L.defaultAttributeValues;for(const K in z){const X=z[K];if(X.location>=0){let j=U[K];if(j===void 0&&(K==="instanceMatrix"&&D.instanceMatrix&&(j=D.instanceMatrix),K==="instanceColor"&&D.instanceColor&&(j=D.instanceColor)),j!==void 0){const te=j.normalized,Te=j.itemSize,Ve=e.get(j);if(Ve===void 0)continue;const Z=Ve.buffer,ve=Ve.type,Ee=Ve.bytesPerElement,De=ve===s.INT||ve===s.UNSIGNED_INT||j.gpuType===xc;if(j.isInterleavedBufferAttribute){const Me=j.data,Xe=Me.isInterleavedBuffer===!0?Me.stride:Me.itemSize,Ut=j.offset;if(Me.isInstancedInterleavedBuffer||Me.isInstancedBufferAttribute){for(let Oe=0;Oe<X.locationSize;Oe++)g(X.location+Oe,Me.meshPerAttribute);D.isInstancedMesh!==!0&&A._maxInstanceCount===void 0&&(A._maxInstanceCount=Me.meshPerAttribute*Me.count)}else for(let Oe=0;Oe<X.locationSize;Oe++)m(X.location+Oe);s.bindBuffer(s.ARRAY_BUFFER,Z);for(let Oe=0;Oe<X.locationSize;Oe++)y(X.location+Oe,Te/X.locationSize,ve,te,Xe*Ee,(Ut+Te/X.locationSize*Oe)*Ee,De)}else{if(j.isInstancedBufferAttribute){for(let Me=0;Me<X.locationSize;Me++)g(X.location+Me,j.meshPerAttribute);D.isInstancedMesh!==!0&&A._maxInstanceCount===void 0&&(A._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let Me=0;Me<X.locationSize;Me++)m(X.location+Me);s.bindBuffer(s.ARRAY_BUFFER,Z);for(let Me=0;Me<X.locationSize;Me++)y(X.location+Me,Te/X.locationSize,ve,te,Te*Ee,Te/X.locationSize*Me*Ee,De)}}else if(B!==void 0){const te=B[K];if(te!==void 0)switch(te.length){case 2:s.vertexAttrib2fv(X.location,te);break;case 3:s.vertexAttrib3fv(X.location,te);break;case 4:s.vertexAttrib4fv(X.location,te);break;default:s.vertexAttrib1fv(X.location,te)}}}}v()}function S(){I();for(const D in n){const L=n[D];for(const C in L){const A=L[C];for(const U in A){const z=A[U];for(const B in z)h(z[B].object),delete z[B];delete A[U]}}delete n[D]}}function T(D){if(n[D.id]===void 0)return;const L=n[D.id];for(const C in L){const A=L[C];for(const U in A){const z=A[U];for(const B in z)h(z[B].object),delete z[B];delete A[U]}}delete n[D.id]}function M(D){for(const L in n){const C=n[L];for(const A in C){const U=C[A];if(U[D.id]===void 0)continue;const z=U[D.id];for(const B in z)h(z[B].object),delete z[B];delete U[D.id]}}}function b(D){for(const L in n){const C=n[L],A=D.isInstancedMesh===!0?D.id:0,U=C[A];if(U!==void 0){for(const z in U){const B=U[z];for(const K in B)h(B[K].object),delete B[K];delete U[z]}delete C[A],Object.keys(C).length===0&&delete n[L]}}}function I(){R(),a=!0,r!==i&&(r=i,c(r.object))}function R(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:I,resetDefaultState:R,dispose:S,releaseStatesOfGeometry:T,releaseStatesOfObject:b,releaseStatesOfProgram:M,initAttributes:x,enableAttribute:m,disableUnusedAttributes:v}}function Av(s,e,t){let n;function i(l){n=l}function r(l,c){s.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(s.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let f=0;f<h;f++)d+=c[f];t.update(d,n,1)}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Rv(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const M=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(M.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(M){return!(M!==Zn&&n.convert(M)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(M){const b=M===pi&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(M!==Pn&&M!==Gn&&!b&&n.convert(M)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE))}function l(M){if(M==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";M="mediump"}return M==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const h=l(c);h!==c&&(Ce("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),d=t.logarithmicDepthBuffer===!0&&u===!1;t.reversedDepthBuffer===!0&&u===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&u===!0&&Ce("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");const f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),p=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),v=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),y=s.getParameter(s.MAX_VARYING_VECTORS),_=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),S=s.getParameter(s.MAX_SAMPLES),T=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:p,maxTextureSize:x,maxCubemapSize:m,maxAttributes:g,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:_,maxSamples:S,samples:T}}function Cv(s){const e=this;let t=null,n=0,i=!1,r=!1;const a=new Gi,o=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){const p=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,g=s.get(u);if(!i||p===null||p.length===0||r&&!m)r?h(null):c();else{const v=r?0:n,y=v*4;let _=g.clippingState||null;l.value=_,_=h(p,d,y,f);for(let S=0;S!==y;++S)_[S]=t[S];g.clippingState=_,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,p){const x=u!==null?u.length:0;let m=null;if(x!==0){if(m=l.value,p!==!0||m===null){const g=f+x*4,v=d.matrixWorldInverse;o.getNormalMatrix(v),(m===null||m.length<g)&&(m=new Float32Array(g));for(let y=0,_=f;y!==x;++y,_+=4)a.copy(u[y]).applyMatrix4(v,o),a.normal.toArray(m,_),m[_+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}class Wc extends di{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new of(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new it(5,5,5),r=new En({name:"CubemapFromEquirect",uniforms:qs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Tn,blending:Us});r.uniforms.tEquirect.value=t;const a=new at(i,r),o=t.minFilter;return t.minFilter===Jn&&(t.minFilter=ln),new rc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}}const yu=256,Pv=3,Lv=20,Af=256,Rf=16,Iv=3,Nv=new F,Dv=new le;class to{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new rc(1,10,null),this._boxMesh=new at(new it(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,i=100,r={}){const{size:a=256,position:o=Nv}=r,l=this._renderer;this._setSize(a);const c=this._allocateTarget(),h=this._getSourceTarget(!0);t>0&&(h.texture.mipmapsAutoUpdate=!1);const u=l.autoClear,d=l.autoClearColor,f=l.autoClearDepth,p=l.autoClearStencil,x=e.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,x===null&&(e.background=l.getClearColor(Dv));const m=new rc(n,i,h);return m.position.copy(o),m.update(l,e),l.autoClear=u,l.autoClearColor=d,l.autoClearDepth=f,l.autoClearStencil=p,e.background=x,t>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Tu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=bu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(yu,Jd(e))}_fromTexture(e,t){e.mapping===Bs||e.mapping===Lr?this._setSize(e.image.length===0?yu:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);const n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){const e=this._cubeSize,t=Su(e,!1,!1),n=Math.log2(e)-Pv;for(let i=0;i<=n;i++)t.texture.mipmaps.push({width:e>>i,height:e>>i});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){const t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Su(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){const i=this._boxMesh,r=this._cubeCamera;i.material=n,r.renderTarget=e,r.activeMipmapLevel=t;const a=e.width>>t;e.viewport.set(0,0,a,a),r.update(this._renderer,i),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===Bs||e.mapping===Lr?(this._cubemapMaterial===null&&(this._cubemapMaterial=Tu()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=bu()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=Uv(),this._integrationMaterial=Fv());const t=this._cubeSize,n=e.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;const r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(t/Rf);for(let a=0;a<=n;a++){const o=to.lodToRoughness(a,n);if(a>n-Iv)r.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{const l=o>0?Math.log2(t)+.5*Math.log2(6/(Af*Math.pow(o,4)))+.5:0;i.roughness.value=o,i.lodBias.value=l,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Ov());const n=this._blurMaterial,i=n.uniforms,r=this._sourceTarget;i.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,i.envMap.value=r.texture,this._renderCube(e,0,n),i.envMap.value=e.texture,this._renderCube(r,0,n)}}function Su(s,e,t){return new Wc(s,{minFilter:Jn,generateMipmaps:e,type:pi,colorSpace:Ln,depthBuffer:t})}function Zr(s,e,t){return new En({name:s,uniforms:e,vertexShader:Ye.cube_vert,fragmentShader:t,side:Tn,blending:Us,depthTest:!1,depthWrite:!1})}function Uv(){return Zr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Af}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Fv(){return Zr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Rf}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Ov(){return Zr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Lv}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function bu(){return Zr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Tu(){return Zr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function kv(s){let e=new WeakMap,t=new WeakMap,n=null;function i(d,f=!1){return d==null?null:f?a(d):r(d)}function r(d){if(d&&d.isTexture){const f=d.mapping;if(f===yo||f===So)if(e.has(d)){const p=e.get(d).texture;return o(p,d.mapping)}else{const p=d.image;if(p&&p.height>0){const x=new Wc(p.height);return x.fromEquirectangularTexture(s,d),e.set(d,x),d.addEventListener("dispose",c),o(x.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture&&d.isPMREMTexture!==!0){const f=d.mapping,p=f===yo||f===So,x=f===Bs||f===Lr;if(p||x){let m=t.get(d);const g=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==g)return n===null&&(n=new to(s)),m=p?n.fromEquirectangular(d,m):n.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),m.texture;if(m!==void 0)return m.texture;{const v=d.image;return p&&v&&v.height>0||x&&v&&l(v)?(n===null&&(n=new to(s)),m=p?n.fromEquirectangular(d):n.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),d.addEventListener("dispose",h),m.texture):null}}}return d}function o(d,f){return f===yo?d.mapping=Bs:f===So&&(d.mapping=Lr),d}function l(d){let f=0;const p=6;for(let x=0;x<p;x++)d[x]!==void 0&&f++;return f===p}function c(d){const f=d.target;f.removeEventListener("dispose",c);const p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function h(d){const f=d.target;f.removeEventListener("dispose",h);const p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function u(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:u}}function zv(s){const e={};function t(n){if(e[n]!==void 0)return e[n];const i=s.getExtension(n);return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const i=t(n);return i===null&&Fs("WebGLRenderer: "+n+" extension not supported."),i}}}function Bv(s,e,t,n){const i={},r=new WeakMap,a=new FinalizationRegistry(p=>delete i[p]);function o(p){l(p.target)}function l(p){p.index!==null&&e.remove(p.index);for(const m in p.attributes)e.remove(p.attributes[m]);p.removeEventListener("dispose",o),delete i[p.id],a.unregister(p);const x=r.get(p);x&&(e.remove(x),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function c(p,x){return i[x.id]!==void 0||(x.addEventListener("dispose",o),i[x.id]=new WeakRef(x),a.register(x,x.id,x),t.memory.geometries++),x}function h(p){const x=p.attributes;for(const m in x)e.update(x[m],s.ARRAY_BUFFER)}function u(p){const x=p.index,m=p.attributes.position;let g=0;if(m===void 0)return;const v=x!==null?x.array.length:m.array.length/3-1,y=m.count>=65535?tf:ef,_=new y(Math.ceil(v/3)*6,1),S=_.array;if(x!==null){const M=x.array;g=x.version;for(let b=0,I=0;b<v;b+=3){const R=M[b+0],D=M[b+1],L=M[b+2];S[I++]=R,S[I++]=D,S[I++]=D,S[I++]=L,S[I++]=L,S[I++]=R}}else{g=m.version;for(let M=0,b=0;M<v;M+=3){const I=M+0,R=M+1,D=M+2;S[b++]=I,S[b++]=R,S[b++]=R,S[b++]=D,S[b++]=D,S[b++]=I}}_.version=g;const T=r.get(p);T&&e.remove(T),r.set(p,_)}function d(p){const x=r.get(p);if(x){const m=p.index;m!==null&&x.version<m.version&&u(p)}else u(p);return r.get(p)}function f(){for(const p in i){const x=i[p].deref();x!==void 0&&l(x)}}return{get:c,update:h,getWireframeAttribute:d,dispose:f}}function Gv(s,e,t){let n;function i(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,d){s.drawElements(n,d,r,u*a),t.update(d,n,1)}function c(u,d,f){f!==0&&(s.drawElementsInstanced(n,d,r,u*a,f),t.update(d,n,f))}function h(u,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,u,0,f);let x=0;for(let m=0;m<f;m++)x+=d[m];t.update(x,n,1)}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function Hv(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case s.TRIANGLES:t.triangles+=o*(r/3);break;case s.LINES:t.lines+=o*(r/2);break;case s.LINE_STRIP:t.lines+=o*(r-1);break;case s.LINE_LOOP:t.lines+=o*r;break;case s.POINTS:t.points+=o*r;break;default:Be("WebGLInfo: Unknown draw mode:",a);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Vv(s,e,t){const n=new WeakMap,i=new mt;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(o);if(d===void 0||d.count!==u){let I=function(){M.dispose(),n.delete(o),o.removeEventListener("dispose",I)};d!==void 0&&d.texture.dispose();const f=o.morphAttributes.position!==void 0,p=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],g=o.morphAttributes.normal||[],v=o.morphAttributes.color||[];let y=0;f===!0&&(y=1),p===!0&&(y=2),x===!0&&(y=3);let _=o.attributes.position.count*y,S=1;_>e.maxTextureSize&&(S=Math.ceil(_/e.maxTextureSize),_=e.maxTextureSize);const T=new Float32Array(_*S*4*u),M=new Zd(T,_,S,u);M.type=Gn,M.needsUpdate=!0;const b=y*4;for(let R=0;R<u;R++){const D=m[R],L=g[R],C=v[R],A=_*S*4*R;for(let U=0;U<D.count;U++){const z=U*b;f===!0&&(i.fromBufferAttribute(D,U),T[A+z+0]=i.x,T[A+z+1]=i.y,T[A+z+2]=i.z,T[A+z+3]=0),p===!0&&(i.fromBufferAttribute(L,U),T[A+z+4]=i.x,T[A+z+5]=i.y,T[A+z+6]=i.z,T[A+z+7]=0),x===!0&&(i.fromBufferAttribute(C,U),T[A+z+8]=i.x,T[A+z+9]=i.y,T[A+z+10]=i.z,T[A+z+11]=C.itemSize===4?i.w:1)}}d={count:u,texture:M,size:new Se(_,S)},n.set(o,d),o.addEventListener("dispose",I)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,t);else{let f=0;for(let x=0;x<c.length;x++)f+=c[x];const p=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(s,"morphTargetBaseInfluence",p),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(s,"morphTargetsTextureSize",d.size)}return{update:r}}function Wv(s,e,t,n,i){let r=new WeakMap;function a(c){const h=i.render.frame,u=c.geometry,d=e.get(c,u);if(r.get(d)!==h&&(e.update(d),r.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){const f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return d}function o(){r=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}const Xv={[Pd]:"LINEAR_TONE_MAPPING",[Ld]:"REINHARD_TONE_MAPPING",[Id]:"CINEON_TONE_MAPPING",[Nd]:"ACES_FILMIC_TONE_MAPPING",[Ud]:"AGX_TONE_MAPPING",[gc]:"NEUTRAL_TONE_MAPPING",[Dd]:"CUSTOM_TONE_MAPPING"};function qv(s,e,t,n,i,r){const a=new di(e,t,{type:s,depthBuffer:i,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null,c=null;const h=new ft;h.setAttribute("position",new Le([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new Le([0,2,0,0,2,0],2));const u=new ag({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new at(h,u),f=new Gc(-1,1,1,-1,0,1);let p=null,x=null,m=!1,g,v=null,y=[],_=!1;this.setSize=function(S,T){a.setSize(S,T),o!==null&&o.setSize(S,T),l!==null&&l.setSize(S,T);for(let M=0;M<y.length;M++){const b=y[M];b.setSize&&b.setSize(S,T)}},this.setEffects=function(S){y=S,_=y.length>0&&y[0].isRenderPass===!0;const T=a.width,M=a.height;y.length>0&&o===null&&(o=new di(T,M,{type:pi,depthBuffer:!1,stencilBuffer:!1}),l=new di(T,M,{type:pi,depthBuffer:!1,stencilBuffer:!1}));const b=i===!0&&y.some(I=>I.needsDepthTexture===!0);b!==(a.depthTexture!==null)&&(b===!0&&c===null&&(c=new Vs(T,M),r===!0&&(c.format=Xi,c.type=Gs)),a.dispose(),a.depthTexture=b?c:null,a.resolveDepthBuffer=b,a.storeMultisampledDepthBuffer=b);for(let I=0;I<y.length;I++){const R=y[I];R.setSize&&R.setSize(T,M),b&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(c)}},this.begin=function(S,T){if(m||S.toneMapping===Ri&&y.length===0)return!1;if(v=T,T!==null){const M=T.width,b=T.height;(a.width!==M||a.height!==b)&&this.setSize(M,b)}return _===!1&&S.setRenderTarget(a),g=S.toneMapping,S.toneMapping=Ri,!0},this.hasRenderPass=function(){return _},this.end=function(S,T){S.toneMapping=g,m=!0;let M=a,b=o;for(let I=0;I<y.length;I++){const R=y[I];R.enabled!==!1&&(R.render(S,b,M,T),R.needsSwap!==!1&&(M=b,b=b===o?l:o))}if(p!==S.outputColorSpace||x!==S.toneMapping){p=S.outputColorSpace,x=S.toneMapping,u.defines={},Qe.getTransfer(p)===ut&&(u.defines.SRGB_TRANSFER="");const I=Xv[x];I&&(u.defines[I]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=M.texture,S.setRenderTarget(v),S.render(d,f),v=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),h.dispose(),u.dispose()}}const Cf=new $t,Pf=new Vs(1,1),Lf=new lf(1),If=new Zd,Nf=new e0,Df=new of,Eu=[],wu=[],Au=new Float32Array(16),Ru=new Float32Array(9),Cu=new Float32Array(4);function Zs(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=Eu[i];if(r===void 0&&(r=new Float32Array(i),Eu[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function Zt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Qt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function fo(s,e){let t=wu[e];t===void 0&&(t=new Int32Array(e),wu[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function Kv(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function Yv(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Zt(t,e))return;s.uniform2fv(this.addr,e),Qt(t,e)}}function $v(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Zt(t,e))return;s.uniform3fv(this.addr,e),Qt(t,e)}}function Jv(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Zt(t,e))return;s.uniform4fv(this.addr,e),Qt(t,e)}}function Zv(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(Zt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Qt(t,e)}else{if(Zt(t,n))return;Cu.set(n),s.uniformMatrix2fv(this.addr,!1,Cu),Qt(t,n)}}function Qv(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(Zt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Qt(t,e)}else{if(Zt(t,n))return;Ru.set(n),s.uniformMatrix3fv(this.addr,!1,Ru),Qt(t,n)}}function jv(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(Zt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Qt(t,e)}else{if(Zt(t,n))return;Au.set(n),s.uniformMatrix4fv(this.addr,!1,Au),Qt(t,n)}}function eM(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function tM(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Zt(t,e))return;s.uniform2iv(this.addr,e),Qt(t,e)}}function nM(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Zt(t,e))return;s.uniform3iv(this.addr,e),Qt(t,e)}}function iM(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Zt(t,e))return;s.uniform4iv(this.addr,e),Qt(t,e)}}function sM(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function rM(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Zt(t,e))return;s.uniform2uiv(this.addr,e),Qt(t,e)}}function aM(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Zt(t,e))return;s.uniform3uiv(this.addr,e),Qt(t,e)}}function oM(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Zt(t,e))return;s.uniform4uiv(this.addr,e),Qt(t,e)}}function po(s){return s.version===0&&(s.compareFunction=Kd,s.needsUpdate=!0),s}function lM(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?r=po(Pf):r=Cf,t.setTexture2D(e||r,i)}function cM(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Nf,i)}function hM(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_CUBE_SHADOW?r=po(Lf):r=Df,t.setTextureCube(e||r,i)}function uM(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||If,i)}function dM(s){switch(s){case 5126:return Kv;case 35664:return Yv;case 35665:return $v;case 35666:return Jv;case 35674:return Zv;case 35675:return Qv;case 35676:return jv;case 5124:case 35670:return eM;case 35667:case 35671:return tM;case 35668:case 35672:return nM;case 35669:case 35673:return iM;case 5125:return sM;case 36294:return rM;case 36295:return aM;case 36296:return oM;case 35678:case 36198:case 36298:case 36306:case 35682:return lM;case 35679:case 36299:case 36307:return cM;case 35680:case 36300:case 36308:case 36293:return hM;case 36289:case 36303:case 36311:case 36292:return uM}}function fM(s,e){s.uniform1fv(this.addr,e)}function pM(s,e){const t=Zs(e,this.size,2);s.uniform2fv(this.addr,t)}function mM(s,e){const t=Zs(e,this.size,3);s.uniform3fv(this.addr,t)}function gM(s,e){const t=Zs(e,this.size,4);s.uniform4fv(this.addr,t)}function xM(s,e){const t=Zs(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function _M(s,e){const t=Zs(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function vM(s,e){const t=Zs(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function MM(s,e){s.uniform1iv(this.addr,e)}function yM(s,e){s.uniform2iv(this.addr,e)}function SM(s,e){s.uniform3iv(this.addr,e)}function bM(s,e){s.uniform4iv(this.addr,e)}function TM(s,e){s.uniform1uiv(this.addr,e)}function EM(s,e){s.uniform2uiv(this.addr,e)}function wM(s,e){s.uniform3uiv(this.addr,e)}function AM(s,e){s.uniform4uiv(this.addr,e)}function RM(s,e,t){const n=this.cache,i=e.length,r=fo(t,i);Zt(n,r)||(s.uniform1iv(this.addr,r),Qt(n,r));let a;this.type===s.SAMPLER_2D_SHADOW?a=po(Pf):a=Cf;for(let o=0;o!==i;++o)t.setTexture2D(e[o]||a,r[o])}function CM(s,e,t){const n=this.cache,i=e.length,r=fo(t,i);Zt(n,r)||(s.uniform1iv(this.addr,r),Qt(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||Nf,r[a])}function PM(s,e,t){const n=this.cache,i=e.length,r=fo(t,i);Zt(n,r)||(s.uniform1iv(this.addr,r),Qt(n,r));let a;this.type===s.SAMPLER_CUBE_SHADOW?a=po(Lf):a=Df;for(let o=0;o!==i;++o)t.setTextureCube(e[o]||a,r[o])}function LM(s,e,t){const n=this.cache,i=e.length,r=fo(t,i);Zt(n,r)||(s.uniform1iv(this.addr,r),Qt(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||If,r[a])}function IM(s){switch(s){case 5126:return fM;case 35664:return pM;case 35665:return mM;case 35666:return gM;case 35674:return xM;case 35675:return _M;case 35676:return vM;case 5124:case 35670:return MM;case 35667:case 35671:return yM;case 35668:case 35672:return SM;case 35669:case 35673:return bM;case 5125:return TM;case 36294:return EM;case 36295:return wM;case 36296:return AM;case 35678:case 36198:case 36298:case 36306:case 35682:return RM;case 35679:case 36299:case 36307:return CM;case 35680:case 36300:case 36308:case 36293:return PM;case 36289:case 36303:case 36311:case 36292:return LM}}class NM{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=dM(t.type)}}class DM{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=IM(t.type)}}class UM{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(e,t[o.id],n)}}}const jo=/(\w+)(\])?(\[|\.)?/g;function Pu(s,e){s.seq.push(e),s.map[e.id]=e}function FM(s,e,t){const n=s.name,i=n.length;for(jo.lastIndex=0;;){const r=jo.exec(n),a=jo.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){Pu(t,c===void 0?new NM(o,s,e):new DM(o,s,e));break}else{let u=t.map[o];u===void 0&&(u=new UM(o),Pu(t,u)),t=u}}}class Ba{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);FM(o,l,this)}const i=[],r=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?i.push(a):r.push(a);i.length>0&&(this.seq=i.concat(r))}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){const o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const a=e[i];a.id in t&&n.push(a)}return n}}function Lu(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}const OM=37297;let kM=0;function zM(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=i;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Iu=new He;function BM(s){Qe._getMatrix(Iu,Qe.workingColorSpace,s);const e=`mat3( ${Iu.elements.map(t=>t.toFixed(4))} )`;switch(Qe.getTransfer(s)){case $a:return[e,"LinearTransferOETF"];case ut:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function Nu(s,e,t){const n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+zM(s.getShaderSource(e),o)}else return r}function GM(s,e){const t=BM(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}const HM={[Pd]:"Linear",[Ld]:"Reinhard",[Id]:"Cineon",[Nd]:"ACESFilmic",[Ud]:"AgX",[gc]:"Neutral",[Dd]:"Custom"};function VM(s,e){const t=HM[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const La=new F;function WM(){Qe.getLuminanceCoefficients(La);const s=La.x.toFixed(4),e=La.y.toFixed(4),t=La.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function XM(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(gr).join(`
`)}function qM(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function KM(s,e){const t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:s.getAttribLocation(e,a),locationSize:o}}return t}function gr(s){return s!==""}function Du(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function Uu(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const YM=/^[ \t]*#include +<([\w\d./]+)>/gm;function ac(s){return s.replace(YM,$M)}function $M(s,e){const t=Ye[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return ac(t)}const JM=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Fu(s){return s.replace(JM,ZM)}function ZM(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ou(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const QM={[Mr]:"SHADOWMAP_TYPE_PCF",[dr]:"SHADOWMAP_TYPE_VSM"};function jM(s){return QM[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const ey={[Lr]:"ENVMAP_MODE_REFRACTION"};function ty(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":ey[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}const ny={[mc]:"ENVMAP_BLENDING_MULTIPLY",[mm]:"ENVMAP_BLENDING_MIX",[gm]:"ENVMAP_BLENDING_ADD"};function iy(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":ny[s.combine]||"ENVMAP_BLENDING_NONE"}function sy(s,e,t,n){const i=s.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=jM(t),c=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=ty(t),u=iy(t),d=XM(t),f=qM(r),p=i.createProgram();let x,m,g=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(x=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(gr).join(`
`),x.length>0&&(x+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f].filter(gr).join(`
`),m.length>0&&(m+=`
`)):(x=[Ou(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(gr).join(`
`),m=[Ou(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,f,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ri?"#define TONE_MAPPING":"",t.toneMapping!==Ri?Ye.tonemapping_pars_fragment:"",t.toneMapping!==Ri?VM("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ye.colorspace_pars_fragment,GM("linearToOutputTexel",t.outputColorSpace),WM(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(gr).join(`
`)),a=ac(a),a=Du(a,t),a=Uu(a,t),o=ac(o),o=Du(o,t),o=Uu(o,t),a=Fu(a),o=Fu(o),t.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,x=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,m=["#define varying in",t.glslVersion===Eh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Eh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const v=g+x+a,y=g+m+o,_=Lu(i,i.VERTEX_SHADER,v),S=Lu(i,i.FRAGMENT_SHADER,y);i.attachShader(p,_),i.attachShader(p,S),t.index0AttributeName!==void 0?i.bindAttribLocation(p,0,t.index0AttributeName):t.hasPositionAttribute===!0&&i.bindAttribLocation(p,0,"position"),i.linkProgram(p);function T(R){if(s.debug.checkShaderErrors){const D=i.getProgramInfoLog(p)||"",L=i.getShaderInfoLog(_)||"",C=i.getShaderInfoLog(S)||"",A=D.trim(),U=L.trim(),z=C.trim();let B=!0,K=!0;if(i.getProgramParameter(p,i.LINK_STATUS)===!1)if(B=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,p,_,S);else{const X=Nu(i,_,"vertex"),j=Nu(i,S,"fragment");Be("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(p,i.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+A+`
`+X+`
`+j)}else A!==""?Ce("WebGLProgram: Program Info Log:",A):(U===""||z==="")&&(K=!1);K&&(R.diagnostics={runnable:B,programLog:A,vertexShader:{log:U,prefix:x},fragmentShader:{log:z,prefix:m}})}i.deleteShader(_),i.deleteShader(S),M=new Ba(i,p),b=KM(i,p)}let M;this.getUniforms=function(){return M===void 0&&T(this),M};let b;this.getAttributes=function(){return b===void 0&&T(this),b};let I=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=i.getProgramParameter(p,OM)),I},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=kM++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=_,this.fragmentShader=S,this}let ry=0;class ay{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const i=this._getShaderCacheForMaterial(e);return i.has(t)===!1&&(i.add(t),t.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new oy(e),t.set(e,n)),n}}class oy{constructor(e){this.id=ry++,this.code=e,this.usedTimes=0}}function ly(s){return s===fs||s===qa||s===Ka}function cy(s,e,t,n,i,r){const a=new Qd,o=new ay,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function f(M){return l.add(M),M===0?"uv":`uv${M}`}function p(M,b,I,R,D,L){const C=R.fog,A=D.geometry,U=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?R.environment:null,z=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,B=e.get(M.envMap||U,z),K=d[M.type];let X=n.precision;M.precision!==null&&(X=n.getMaxPrecision(M.precision),X!==M.precision&&Ce("WebGLProgram.getParameters:",M.precision,"not supported, using",X,"instead."));const j=A.morphAttributes.position||A.morphAttributes.normal||A.morphAttributes.color,te=j!==void 0?j.length:0;let Te=0;A.morphAttributes.position!==void 0&&(Te=1),A.morphAttributes.normal!==void 0&&(Te=2),A.morphAttributes.color!==void 0&&(Te=3);let Ve,Z,ve,Ee;if(K){const xe=ci[K];Ve=xe.vertexShader,Z=xe.fragmentShader}else{Ve=M.vertexShader,Z=M.fragmentShader;const xe=o.getVertexShaderStage(M),ct=o.getFragmentShaderStage(M);o.update(M,xe,ct),ve=xe.id,Ee=ct.id}const De=s.getRenderTarget(),Me=s.state.buffers.depth.getReversed(),Xe=D.isInstancedMesh===!0,Ut=D.isBatchedMesh===!0,Oe=!!M.map,lt=!!M.matcap,gt=!!B,je=gt&&B.isPMREMTexture===!0,rn=!!M.aoMap,Gt=!!M.lightMap,yn=!!M.bumpMap&&M.wireframe===!1,At=!!M.normalMap,si=!!M.displacementMap,jt=!!M.emissiveMap,Un=!!M.metalnessMap,Fn=!!M.roughnessMap,On=M.anisotropy>0,G=M.clearcoat>0,kn=M.diffuseRoughness>0,bt=M.dispersion>0,Tt=M.retroreflectivity>0,ge=M.iridescence>0,Ht=M.sheen>0,Ue=M.transmission>0,Ge=On&&!!M.anisotropyMap,P=G&&!!M.clearcoatMap,E=G&&!!M.clearcoatNormalMap,V=G&&!!M.clearcoatRoughnessMap,re=kn&&!!M.diffuseRoughnessMap,ee=ge&&!!M.iridescenceMap,ce=ge&&!!M.iridescenceThicknessMap,pe=Ht&&!!M.sheenColorMap,$=Ht&&!!M.sheenRoughnessMap,J=!!M.specularMap,ue=!!M.specularColorMap,O=!!M.specularIntensityMap,Q=Ue&&!!M.transmissionMap,Y=Ue&&!!M.thicknessMap,de=!!M.gradientMap,oe=!!M.alphaMap,he=M.alphaTest>0,Pe=!!M.alphaHash,Ke=!!M.extensions;let ae=Ri;M.toneMapped&&(De===null||De.isXRRenderTarget===!0)&&(ae=s.toneMapping);const Ie=je?B.isCompressedCubeTexture?B.image[0].mipmaps:B.mipmaps:null,qe={shaderID:K,shaderType:M.type,shaderName:M.name,vertexShader:Ve,fragmentShader:Z,defines:M.defines,customVertexShaderID:ve,customFragmentShaderID:Ee,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:X,batching:Ut,batchingColor:Ut&&D._colorsTexture!==null,instancing:Xe,instancingColor:Xe&&D.instanceColor!==null,instancingMorph:Xe&&D.morphTexture!==null,outputColorSpace:De===null?s.outputColorSpace:De.isXRRenderTarget===!0?De.texture.colorSpace:Qe.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:Oe,matcap:lt,envMap:gt,envMapMode:gt&&B.mapping,envMapPMREM:je,envMapMaxLod:je?Ie.length-1:null,envMapSize:je?Ie[0].width:null,aoMap:rn,lightMap:Gt,bumpMap:yn,normalMap:At,displacementMap:si,emissiveMap:jt,normalMapObjectSpace:At&&M.normalMapType===ym,normalMapTangentSpace:At&&M.normalMapType===Ya,packedNormalMap:At&&M.normalMapType===Ya&&ly(M.normalMap.format),metalnessMap:Un,roughnessMap:Fn,anisotropy:On,anisotropyMap:Ge,clearcoat:G,clearcoatMap:P,clearcoatNormalMap:E,clearcoatRoughnessMap:V,diffuseRoughness:kn,diffuseRoughnessMap:re,dispersion:bt,retroreflection:Tt,iridescence:ge,iridescenceMap:ee,iridescenceThicknessMap:ce,sheen:Ht,sheenColorMap:pe,sheenRoughnessMap:$,specularMap:J,specularColorMap:ue,specularIntensityMap:O,transmission:Ue,transmissionMap:Q,thicknessMap:Y,gradientMap:de,opaque:M.transparent===!1&&M.blending===yr&&M.alphaToCoverage===!1,alphaMap:oe,alphaTest:he,alphaHash:Pe,combine:M.combine,mapUv:Oe&&f(M.map.channel),aoMapUv:rn&&f(M.aoMap.channel),lightMapUv:Gt&&f(M.lightMap.channel),bumpMapUv:yn&&f(M.bumpMap.channel),normalMapUv:At&&f(M.normalMap.channel),displacementMapUv:si&&f(M.displacementMap.channel),emissiveMapUv:jt&&f(M.emissiveMap.channel),metalnessMapUv:Un&&f(M.metalnessMap.channel),roughnessMapUv:Fn&&f(M.roughnessMap.channel),anisotropyMapUv:Ge&&f(M.anisotropyMap.channel),clearcoatMapUv:P&&f(M.clearcoatMap.channel),clearcoatNormalMapUv:E&&f(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:V&&f(M.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:re&&f(M.diffuseRoughnessMap.channel),iridescenceMapUv:ee&&f(M.iridescenceMap.channel),iridescenceThicknessMapUv:ce&&f(M.iridescenceThicknessMap.channel),sheenColorMapUv:pe&&f(M.sheenColorMap.channel),sheenRoughnessMapUv:$&&f(M.sheenRoughnessMap.channel),specularMapUv:J&&f(M.specularMap.channel),specularColorMapUv:ue&&f(M.specularColorMap.channel),specularIntensityMapUv:O&&f(M.specularIntensityMap.channel),transmissionMapUv:Q&&f(M.transmissionMap.channel),thicknessMapUv:Y&&f(M.thicknessMap.channel),alphaMapUv:oe&&f(M.alphaMap.channel),vertexTangents:!!A.attributes.tangent&&(At||On),vertexNormals:!!A.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!A.attributes.color&&A.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!A.attributes.uv&&(Oe||oe),fog:!!C,useFog:M.fog===!0,fogExp2:!!C&&C.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||A.attributes.normal===void 0&&At===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Me,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:A.attributes.position!==void 0,morphTargets:A.morphAttributes.position!==void 0,morphNormals:A.morphAttributes.normal!==void 0,morphColors:A.morphAttributes.color!==void 0,morphTargetsCount:te,morphTextureStride:Te,numSunLights:b.sun.length,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numSunLightShadows:b.sunShadowMap.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numLightProbeGrids:L.filter(xe=>xe.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:M.dithering,shadowMapEnabled:s.shadowMap.enabled&&I.length>0,shadowMapType:s.shadowMap.type,toneMapping:ae,decodeVideoTexture:Oe&&M.map.isVideoTexture===!0&&Qe.getTransfer(M.map.colorSpace)===ut,decodeVideoTextureEmissive:jt&&M.emissiveMap.isVideoTexture===!0&&Qe.getTransfer(M.emissiveMap.colorSpace)===ut,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===pn,flipSided:M.side===Tn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Ke&&M.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ke&&M.extensions.multiDraw===!0||Ut)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return qe.vertexUv1s=l.has(1),qe.vertexUv2s=l.has(2),qe.vertexUv3s=l.has(3),l.clear(),qe}function x(M){const b=[];if(M.shaderID?b.push(M.shaderID):(b.push(M.customVertexShaderID),b.push(M.customFragmentShaderID)),M.defines!==void 0)for(const I in M.defines)b.push(I),b.push(M.defines[I]);return M.isRawShaderMaterial===!1&&(m(b,M),g(b,M),b.push(s.outputColorSpace)),b.push(M.customProgramCacheKey),b.join()}function m(M,b){M.push(b.precision),M.push(b.outputColorSpace),M.push(b.envMapMode),M.push(b.envMapPMREM),M.push(b.envMapMaxLod),M.push(b.envMapSize),M.push(b.mapUv),M.push(b.alphaMapUv),M.push(b.lightMapUv),M.push(b.aoMapUv),M.push(b.bumpMapUv),M.push(b.normalMapUv),M.push(b.displacementMapUv),M.push(b.emissiveMapUv),M.push(b.metalnessMapUv),M.push(b.roughnessMapUv),M.push(b.anisotropyMapUv),M.push(b.clearcoatMapUv),M.push(b.clearcoatNormalMapUv),M.push(b.clearcoatRoughnessMapUv),M.push(b.diffuseRoughnessMapUv),M.push(b.iridescenceMapUv),M.push(b.iridescenceThicknessMapUv),M.push(b.sheenColorMapUv),M.push(b.sheenRoughnessMapUv),M.push(b.specularMapUv),M.push(b.specularColorMapUv),M.push(b.specularIntensityMapUv),M.push(b.transmissionMapUv),M.push(b.thicknessMapUv),M.push(b.combine),M.push(b.fogExp2),M.push(b.sizeAttenuation),M.push(b.morphTargetsCount),M.push(b.numSunLights),M.push(b.numDirLights),M.push(b.numPointLights),M.push(b.numSpotLights),M.push(b.numSpotLightMaps),M.push(b.numHemiLights),M.push(b.numRectAreaLights),M.push(b.numSunLightShadows),M.push(b.numDirLightShadows),M.push(b.numPointLightShadows),M.push(b.numSpotLightShadows),M.push(b.numSpotLightShadowsWithMaps),M.push(b.numLightProbes),M.push(b.numLightProbeGrids),M.push(b.shadowMapType),M.push(b.toneMapping),M.push(b.numClippingPlanes),M.push(b.numClipIntersection),M.push(b.depthPacking)}function g(M,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.retroreflection&&a.enable(24),b.diffuseRoughness&&a.enable(25),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),b.packedNormalMap&&a.enable(22),b.vertexNormals&&a.enable(23),M.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),b.numLightProbeGrids>0&&a.enable(22),b.hasPositionAttribute&&a.enable(23),M.push(a.mask)}function v(M){const b=d[M.type];let I;if(b){const R=ci[b];I=ig.clone(R.uniforms)}else I=M.uniforms;return I}function y(M,b){let I=h.get(b);return I!==void 0?++I.usedTimes:(I=new sy(s,b,M,i),c.push(I),h.set(b,I)),I}function _(M){if(--M.usedTimes===0){const b=c.indexOf(M);c[b]=c[c.length-1],c.pop(),h.delete(M.cacheKey),M.destroy()}}function S(M){o.remove(M)}function T(){o.dispose()}return{getParameters:p,getProgramCacheKey:x,getUniforms:v,acquireProgram:y,releaseProgram:_,releaseShaderCache:S,programs:c,dispose:T}}function hy(){let s=new WeakMap;function e(a){return s.has(a)}function t(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function uy(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.materialVariant!==e.materialVariant?s.materialVariant-e.materialVariant:s.z!==e.z?s.z-e.z:s.id-e.id}function ku(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function zu(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function a(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function o(d,f,p,x,m,g){let v=s[e];return v===void 0?(v={id:d.id,object:d,geometry:f,material:p,materialVariant:a(d),groupOrder:x,renderOrder:d.renderOrder,z:m,group:g},s[e]=v):(v.id=d.id,v.object=d,v.geometry=f,v.material=p,v.materialVariant=a(d),v.groupOrder=x,v.renderOrder=d.renderOrder,v.z=m,v.group=g),e++,v}function l(d,f,p,x,m,g,v){v.reversedDepth===!0&&(m=-m);const y=o(d,f,p,x,m,g);p.transmission>0?n.push(y):p.transparent===!0?i.push(y):t.push(y)}function c(d,f,p,x,m,g){const v=o(d,f,p,x,m,g);p.transmission>0?n.unshift(v):p.transparent===!0?i.unshift(v):t.unshift(v)}function h(d,f){t.length>1&&t.sort(d||uy),n.length>1&&n.sort(f||ku),i.length>1&&i.sort(f||ku)}function u(){for(let d=e,f=s.length;d<f;d++){const p=s[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:l,unshift:c,finish:u,sort:h}}function dy(){let s=new WeakMap;function e(n,i){const r=s.get(n);let a;return r===void 0?(a=new zu,s.set(n,[a])):i>=r.length?(a=new zu,r.push(a)):a=r[i],a}function t(){s=new WeakMap}return{get:e,dispose:t}}function fy(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new F,color:new le};break;case"SpotLight":t={position:new F,direction:new F,color:new le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new F,color:new le,distance:0,decay:0};break;case"HemisphereLight":t={direction:new F,skyColor:new le,groundColor:new le};break;case"RectAreaLight":t={color:new le,position:new F,halfWidth:new F,halfHeight:new F};break}return s[e.id]=t,t}}}function py(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Se};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Se};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Se,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let my=0;function gy(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function xy(s){const e=new fy,t=py(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new F);const i=new F,r=new ke,a=new ke;function o(c){let h=0,u=0,d=0;for(let L=0;L<9;L++)n.probe[L].set(0,0,0);let f=0,p=0,x=0,m=0,g=0,v=0,y=0,_=0,S=0,T=0,M=0,b=0,I=0,R=0;c.sort(gy);for(let L=0,C=c.length;L<C;L++){const A=c[L],U=A.color,z=A.intensity,B=A.distance;let K=null;if(A.shadow&&A.shadow.map&&(A.shadow.map.texture.format===fs?K=A.shadow.map.texture:K=A.shadow.map.depthTexture||A.shadow.map.texture),A.isAmbientLight)h+=U.r*z,u+=U.g*z,d+=U.b*z;else if(A.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(A.sh.coefficients[X],z);R++}else if(A.isSunLight){const X=e.get(A);if(X.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){const j=A.shadow,te=t.get(A);te.shadowIntensity=j.intensity,te.shadowBias=j.bias,te.shadowNormalBias=j.normalBias,te.shadowRadius=j.radius,te.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),n.sunShadow[p]=te,n.sunShadowMap[p]=K;const Te=j.getViewportCount();for(let Ve=0;Ve<Te;Ve++)n.sunShadowMatrix[x+Ve]=j.getMatrix(Ve),n.sunShadowCascade[x+Ve]=j._cascadeData[Ve];x+=Te,p++}n.sun[f]=X,f++}else if(A.isDirectionalLight){const X=e.get(A);if(X.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){const j=A.shadow,te=t.get(A);te.shadowIntensity=j.intensity,te.shadowBias=j.bias,te.shadowNormalBias=j.normalBias,te.shadowRadius=j.radius,te.shadowMapSize=j.mapSize,n.directionalShadow[m]=te,n.directionalShadowMap[m]=K,n.directionalShadowMatrix[m]=A.shadow.matrix,S++}n.directional[m]=X,m++}else if(A.isSpotLight){const X=e.get(A);X.position.setFromMatrixPosition(A.matrixWorld),X.color.copy(U).multiplyScalar(z),X.distance=B,X.coneCos=Math.cos(A.angle),X.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),X.decay=A.decay,n.spot[v]=X;const j=A.shadow;if(A.map&&(n.spotLightMap[b]=A.map,b++,j.updateMatrices(A),A.castShadow&&I++),n.spotLightMatrix[v]=j.matrix,A.castShadow){const te=t.get(A);te.shadowIntensity=j.intensity,te.shadowBias=j.bias,te.shadowNormalBias=j.normalBias,te.shadowRadius=j.radius,te.shadowMapSize=j.mapSize,n.spotShadow[v]=te,n.spotShadowMap[v]=K,M++}v++}else if(A.isRectAreaLight){const X=e.get(A);X.color.copy(U).multiplyScalar(z),X.halfWidth.set(A.width*.5,0,0),X.halfHeight.set(0,A.height*.5,0),n.rectArea[y]=X,y++}else if(A.isPointLight){const X=e.get(A);if(X.color.copy(A.color).multiplyScalar(A.intensity),X.distance=A.distance,X.decay=A.decay,A.castShadow){const j=A.shadow,te=t.get(A);te.shadowIntensity=j.intensity,te.shadowBias=j.bias,te.shadowNormalBias=j.normalBias,te.shadowRadius=j.radius,te.shadowMapSize=j.mapSize,te.shadowCameraNear=j.camera.near,te.shadowCameraFar=j.camera.far,n.pointShadow[g]=te,n.pointShadowMap[g]=K,n.pointShadowMatrix[g]=A.shadow.matrix,T++}n.point[g]=X,g++}else if(A.isHemisphereLight){const X=e.get(A);X.skyColor.copy(A.color).multiplyScalar(z),X.groundColor.copy(A.groundColor).multiplyScalar(z),n.hemi[_]=X,_++}}y>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=_e.LTC_FLOAT_1,n.rectAreaLTC2=_e.LTC_FLOAT_2):(n.rectAreaLTC1=_e.LTC_HALF_1,n.rectAreaLTC2=_e.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const D=n.hash;(D.sunLength!==f||D.directionalLength!==m||D.pointLength!==g||D.spotLength!==v||D.rectAreaLength!==y||D.hemiLength!==_||D.numSunShadows!==p||D.numDirectionalShadows!==S||D.numPointShadows!==T||D.numSpotShadows!==M||D.numSpotMaps!==b||D.numLightProbes!==R)&&(n.sun.length=f,n.directional.length=m,n.spot.length=v,n.rectArea.length=y,n.point.length=g,n.hemi.length=_,n.sunShadow.length=p,n.sunShadowMap.length=p,n.sunShadowMatrix.length=x,n.sunShadowCascade.length=x,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.directionalShadowMatrix.length=S,n.pointShadow.length=T,n.pointShadowMap.length=T,n.pointShadowMatrix.length=T,n.spotShadow.length=M,n.spotShadowMap.length=M,n.spotLightMatrix.length=M+b-I,n.spotLightMap.length=b,n.numSpotLightShadowsWithMaps=I,n.numLightProbes=R,D.sunLength=f,D.directionalLength=m,D.pointLength=g,D.spotLength=v,D.rectAreaLength=y,D.hemiLength=_,D.numSunShadows=p,D.numDirectionalShadows=S,D.numPointShadows=T,D.numSpotShadows=M,D.numSpotMaps=b,D.numLightProbes=R,n.version=my++)}function l(c,h){let u=0,d=0,f=0,p=0,x=0,m=0;const g=h.matrixWorldInverse;for(let v=0,y=c.length;v<y;v++){const _=c[v];if(_.isSunLight){const S=n.sun[u];S.direction.setFromMatrixPosition(_.matrixWorld),S.direction.transformDirection(g),u++}else if(_.isDirectionalLight){const S=n.directional[d];S.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),S.direction.sub(i),S.direction.transformDirection(g),d++}else if(_.isSpotLight){const S=n.spot[p];S.position.setFromMatrixPosition(_.matrixWorld),S.position.applyMatrix4(g),S.direction.setFromMatrixPosition(_.matrixWorld),i.setFromMatrixPosition(_.target.matrixWorld),S.direction.sub(i),S.direction.transformDirection(g),p++}else if(_.isRectAreaLight){const S=n.rectArea[x];S.position.setFromMatrixPosition(_.matrixWorld),S.position.applyMatrix4(g),a.identity(),r.copy(_.matrixWorld),r.premultiply(g),a.extractRotation(r),S.halfWidth.set(_.width*.5,0,0),S.halfHeight.set(0,_.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),x++}else if(_.isPointLight){const S=n.point[f];S.position.setFromMatrixPosition(_.matrixWorld),S.position.applyMatrix4(g),f++}else if(_.isHemisphereLight){const S=n.hemi[m];S.direction.setFromMatrixPosition(_.matrixWorld),S.direction.transformDirection(g),m++}}}return{setup:o,setupView:l,state:n}}function Bu(s){const e=new xy(s),t=[],n=[],i=[];function r(u){h.camera=u,t.length=0,n.length=0,i.length=0}function a(u){u.isLightProbeGrid?i.push(u):t.push(u)}function o(u){n.push(u)}function l(){e.setup(t),i.sort((u,d)=>u.priority-d.priority||u.id-d.id)}function c(u){e.setupView(t,u)}const h={lightsArray:t,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function _y(s){let e=new WeakMap;function t(i,r=0){const a=e.get(i);let o;return a===void 0?(o=new Bu(s),e.set(i,[o])):r>=a.length?(o=new Bu(s),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const vy=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,My=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,yy=[new F(1,0,0),new F(-1,0,0),new F(0,1,0),new F(0,-1,0),new F(0,0,1),new F(0,0,-1)],Sy=[new F(0,-1,0),new F(0,-1,0),new F(0,0,1),new F(0,0,-1),new F(0,-1,0),new F(0,-1,0)],Gu=new ke,or=new F,el=new F;function by(s,e,t){let n=new kr;const i=new Se,r=new Se,a=new mt,o=new og,l=new lg,c={},h=t.maxTextureSize,u={[$i]:Tn,[Tn]:$i,[pn]:pn},d=new En({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Se},radius:{value:4}},vertexShader:vy,fragmentShader:My}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const p=new ft;p.setAttribute("position",new Jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new at(p,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Mr;let g=this.type;this.render=function(T,M,b){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;this.type===Jp&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Mr);const I=s.getRenderTarget(),R=s.getActiveCubeFace(),D=s.getActiveMipmapLevel(),L=s.state;L.setBlending(Us),L.buffers.depth.getReversed()===!0?L.buffers.color.setClear(0,0,0,0):L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);const C=g!==this.type;C&&M.traverse(function(A){A.material&&(Array.isArray(A.material)?A.material.forEach(U=>U.needsUpdate=!0):A.material.needsUpdate=!0)});for(let A=0,U=T.length;A<U;A++){const z=T[A],B=z.shadow;if(B===void 0){Ce("WebGLShadowMap:",z,"has no shadow.");continue}if(B.autoUpdate===!1&&B.needsUpdate===!1)continue;i.copy(B.mapSize);const K=B.getFrameExtents();i.multiply(K),r.copy(B.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/K.x),i.x=r.x*K.x,B.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/K.y),i.y=r.y*K.y,B.mapSize.y=r.y));const X=s.state.buffers.depth.getReversed();if(B.camera._reversedDepth=X,B.map===null||C===!0){if(B.map!==null&&(B.map.depthTexture!==null&&(B.map.depthTexture.dispose(),B.map.depthTexture=null),B.map.dispose()),this.type===dr){if(z.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}B.map=new di(i.x,i.y,{format:fs,type:pi,minFilter:ln,magFilter:ln,generateMipmaps:!1}),B.map.texture.name=z.name+".shadowMap",B.map.depthTexture=new Vs(i.x,i.y,Gn),B.map.depthTexture.name=z.name+".shadowMapDepth",B.map.depthTexture.format=Zi,B.map.depthTexture.compareFunction=null,B.map.depthTexture.minFilter=Kt,B.map.depthTexture.magFilter=Kt}else z.isPointLight?(B.map=new Wc(i.x),B.map.depthTexture=new lf(i.x,fi)):(B.map=new di(i.x,i.y),B.map.depthTexture=new Vs(i.x,i.y,fi)),B.map.depthTexture.name=z.name+".shadowMap",B.map.depthTexture.format=Zi,this.type===Mr?(B.map.depthTexture.compareFunction=X?qd:Xd,B.map.depthTexture.minFilter=ln,B.map.depthTexture.magFilter=ln):(B.map.depthTexture.compareFunction=null,B.map.depthTexture.minFilter=Kt,B.map.depthTexture.magFilter=Kt);B.camera.updateProjectionMatrix()}B.map.isWebGLCubeRenderTarget!==!0&&(B.map.width!==i.x||B.map.height!==i.y)&&B.map.setSize(i.x,i.y);const j=B.map.isWebGLCubeRenderTarget?6:B.getViewportCount();z.isPointLight!==!0&&B.updateMatrices(z,b);const te=(B.camera.layers.mask&4294967294)!==0?B.camera.layers:b.layers;for(let Te=0;Te<j;Te++){const Ve=B.getCamera(Te);if(z.isPointLight){const Z=B.camera,ve=B.matrix,Ee=z.distance||Z.far;Ee!==Z.far&&(Z.far=Ee,Z.updateProjectionMatrix()),or.setFromMatrixPosition(z.matrixWorld),Z.position.copy(or),el.copy(Z.position),el.add(yy[Te]),Z.up.copy(Sy[Te]),Z.lookAt(el),Z.updateMatrixWorld(),ve.makeTranslation(-or.x,-or.y,-or.z),Gu.multiplyMatrices(Z.projectionMatrix,Z.matrixWorldInverse),B._frustum.setFromProjectionMatrix(Gu,Z.coordinateSystem,Z.reversedDepth)}if(B.map.isWebGLCubeRenderTarget)s.setRenderTarget(B.map,Te),s.clear();else{Te===0&&(s.setRenderTarget(B.map),s.clear());const Z=B.getViewport(Te);a.set(r.x*Z.x,r.y*Z.y,r.x*Z.z,r.y*Z.w),L.viewport(a)}n=B.getFrustum(Te),_(M,b,Ve,z,te,this.type)}B.isPointLightShadow!==!0&&this.type===dr&&v(B,b),B.needsUpdate=!1}g=this.type,m.needsUpdate=!1,s.setRenderTarget(I,R,D)};function v(T,M){const b=e.update(x);d.defines.VSM_SAMPLES!==T.blurSamples&&(d.defines.VSM_SAMPLES=T.blurSamples,f.defines.VSM_SAMPLES=T.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),T.mapPass===null?T.mapPass=new di(i.x,i.y,{format:fs,type:pi}):(T.mapPass.width!==T.map.width||T.mapPass.height!==T.map.height)&&T.mapPass.setSize(T.map.width,T.map.height),d.uniforms.shadow_pass.value=T.map.depthTexture,d.uniforms.resolution.value.set(T.map.width,T.map.height),d.uniforms.radius.value=T.radius,s.setRenderTarget(T.mapPass),s.clear(),s.renderBufferDirect(M,null,b,d,x,null),f.uniforms.shadow_pass.value=T.mapPass.texture,f.uniforms.resolution.value.set(T.map.width,T.map.height),f.uniforms.radius.value=T.radius,s.setRenderTarget(T.map),s.clear(),s.renderBufferDirect(M,null,b,f,x,null)}function y(T,M,b,I){let R=null;const D=b.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(D!==void 0)R=D;else if(R=b.isPointLight===!0?l:o,s.localClippingEnabled&&M.clipShadows===!0&&Array.isArray(M.clippingPlanes)&&M.clippingPlanes.length!==0||M.displacementMap&&M.displacementScale!==0||M.alphaMap&&M.alphaTest>0||M.map&&M.alphaTest>0||M.alphaToCoverage===!0){const L=R.uuid,C=M.uuid;let A=c[L];A===void 0&&(A={},c[L]=A);let U=A[C];U===void 0&&(U=R.clone(),A[C]=U,M.addEventListener("dispose",S)),R=U}if(R.visible=M.visible,R.wireframe=M.wireframe,I===dr?R.side=M.shadowSide!==null?M.shadowSide:M.side:R.side=M.shadowSide!==null?M.shadowSide:u[M.side],R.alphaMap=M.alphaMap,R.alphaTest=M.alphaToCoverage===!0?.5:M.alphaTest,R.map=M.map,R.clipShadows=M.clipShadows,R.clippingPlanes=M.clippingPlanes,R.clipIntersection=M.clipIntersection,R.displacementMap=M.displacementMap,R.displacementScale=M.displacementScale,R.displacementBias=M.displacementBias,R.wireframeLinewidth=M.wireframeLinewidth,R.linewidth=M.linewidth,b.isPointLight===!0&&R.isMeshDistanceMaterial===!0){const L=s.properties.get(R);L.light=b}return R}function _(T,M,b,I,R,D){if(T.visible===!1)return;if(T.layers.test(R)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&D===dr)&&(!T.frustumCulled||T.intersectsFrustum(n))){T.modelViewMatrix.multiplyMatrices(b.matrixWorldInverse,T.matrixWorld);const A=e.update(T),U=T.material;if(Array.isArray(U)){const z=A.groups;for(let B=0,K=z.length;B<K;B++){const X=z[B],j=U[X.materialIndex];if(j&&j.visible){const te=y(T,j,I,D);T.onBeforeShadow(s,T,M,b,A,te,X),s.renderBufferDirect(b,null,A,te,T,X),T.onAfterShadow(s,T,M,b,A,te,X)}}}else if(U.visible){const z=y(T,U,I,D);T.onBeforeShadow(s,T,M,b,A,z,null),s.renderBufferDirect(b,null,A,z,T,null),T.onAfterShadow(s,T,M,b,A,z,null)}}const C=T.children;for(let A=0,U=C.length;A<U;A++)_(C[A],M,b,I,R,D)}function S(T){T.target.removeEventListener("dispose",S);for(const b in c){const I=c[b],R=T.target.uuid;R in I&&(I[R].dispose(),delete I[R])}}}function Ty(s,e){function t(){let O=!1;const Q=new mt;let Y=null;const de=new mt(0,0,0,0);return{setMask:function(oe){Y!==oe&&!O&&(s.colorMask(oe,oe,oe,oe),Y=oe)},setLocked:function(oe){O=oe},setClear:function(oe,he,Pe,Ke,ae){ae===!0&&(oe*=Ke,he*=Ke,Pe*=Ke),Q.set(oe,he,Pe,Ke),de.equals(Q)===!1&&(s.clearColor(oe,he,Pe,Ke),de.copy(Q))},reset:function(){O=!1,Y=null,de.set(-1,0,0,0)}}}function n(){let O=!1,Q=!1,Y=null,de=null,oe=null;return{setReversed:function(he){if(Q!==he){const Pe=e.get("EXT_clip_control");he?Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.ZERO_TO_ONE_EXT):Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.NEGATIVE_ONE_TO_ONE_EXT),Q=he;const Ke=oe;oe=null,this.setClear(Ke)}},getReversed:function(){return Q},setTest:function(he){he?Me(s.DEPTH_TEST):Xe(s.DEPTH_TEST)},setMask:function(he){Y!==he&&!O&&(s.depthMask(he),Y=he)},setFunc:function(he){if(Q&&(he=Im[he]),de!==he){switch(he){case _l:s.depthFunc(s.NEVER);break;case vl:s.depthFunc(s.ALWAYS);break;case Ml:s.depthFunc(s.LESS);break;case Pr:s.depthFunc(s.LEQUAL);break;case yl:s.depthFunc(s.EQUAL);break;case Sl:s.depthFunc(s.GEQUAL);break;case bl:s.depthFunc(s.GREATER);break;case Tl:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}de=he}},setLocked:function(he){O=he},setClear:function(he){oe!==he&&(oe=he,Q&&(he=1-he),s.clearDepth(he))},reset:function(){O=!1,Y=null,de=null,oe=null,Q=!1}}}function i(){let O=!1,Q=null,Y=null,de=null,oe=null,he=null,Pe=null,Ke=null,ae=null;return{setTest:function(Ie){O||(Ie?Me(s.STENCIL_TEST):Xe(s.STENCIL_TEST))},setMask:function(Ie){Q!==Ie&&!O&&(s.stencilMask(Ie),Q=Ie)},setFunc:function(Ie,qe,xe){(Y!==Ie||de!==qe||oe!==xe)&&(s.stencilFunc(Ie,qe,xe),Y=Ie,de=qe,oe=xe)},setOp:function(Ie,qe,xe){(he!==Ie||Pe!==qe||Ke!==xe)&&(s.stencilOp(Ie,qe,xe),he=Ie,Pe=qe,Ke=xe)},setLocked:function(Ie){O=Ie},setClear:function(Ie){ae!==Ie&&(s.clearStencil(Ie),ae=Ie)},reset:function(){O=!1,Q=null,Y=null,de=null,oe=null,he=null,Pe=null,Ke=null,ae=null}}}const r=new t,a=new n,o=new i;let l={};const c=new WeakMap;let h={},u={},d={},f=new WeakMap,p=[],x=null,m=!1,g=null,v=null,y=null,_=null,S=null,T=null,M=null,b=new le(0,0,0),I=0,R=!1,D=null,L=null,C=null,A=null,U=null;const z=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let B=!1,K=0;const X=s.getParameter(s.VERSION);X.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(X)[1]),B=K>=1):X.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),B=K>=2);let j=null,te={};const Te=s.getParameter(s.SCISSOR_BOX),Ve=s.getParameter(s.VIEWPORT),Z=new mt().fromArray(Te),ve=new mt().fromArray(Ve);function Ee(O,Q,Y,de){const oe=new Uint8Array(4),he=s.createTexture();s.bindTexture(O,he),s.texParameteri(O,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(O,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Pe=0;Pe<Y;Pe++)O===s.TEXTURE_3D||O===s.TEXTURE_2D_ARRAY?s.texImage3D(Q,0,s.RGBA,1,1,de,0,s.RGBA,s.UNSIGNED_BYTE,oe):s.texImage2D(Q+Pe,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,oe);return he}const De={};De[s.TEXTURE_2D]=Ee(s.TEXTURE_2D,s.TEXTURE_2D,1),De[s.TEXTURE_CUBE_MAP]=Ee(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),De[s.TEXTURE_2D_ARRAY]=Ee(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),De[s.TEXTURE_3D]=Ee(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Me(s.DEPTH_TEST),a.setFunc(Pr),yn(!1),At(xh),Me(s.CULL_FACE),rn(Us);function Me(O){h[O]!==!0&&(s.enable(O),h[O]=!0)}function Xe(O){h[O]!==!1&&(s.disable(O),h[O]=!1)}function Ut(O,Q){return d[O]!==Q?(s.bindFramebuffer(O,Q),d[O]=Q,O===s.DRAW_FRAMEBUFFER&&(d[s.FRAMEBUFFER]=Q),O===s.FRAMEBUFFER&&(d[s.DRAW_FRAMEBUFFER]=Q),!0):!1}function Oe(O,Q){let Y=p,de=!1;if(O){Y=f.get(Q),Y===void 0&&(Y=[],f.set(Q,Y));const oe=O.textures;if(Y.length!==oe.length||Y[0]!==s.COLOR_ATTACHMENT0){for(let he=0,Pe=oe.length;he<Pe;he++)Y[he]=s.COLOR_ATTACHMENT0+he;Y.length=oe.length,de=!0}}else Y[0]!==s.BACK&&(Y[0]=s.BACK,de=!0);de&&s.drawBuffers(Y)}function lt(O){return x!==O?(s.useProgram(O),x=O,!0):!1}const gt={[Ns]:s.FUNC_ADD,[Qp]:s.FUNC_SUBTRACT,[jp]:s.FUNC_REVERSE_SUBTRACT};gt[em]=s.MIN,gt[tm]=s.MAX;const je={[nm]:s.ZERO,[im]:s.ONE,[sm]:s.SRC_COLOR,[Rd]:s.SRC_ALPHA,[hm]:s.SRC_ALPHA_SATURATE,[lm]:s.DST_COLOR,[am]:s.DST_ALPHA,[rm]:s.ONE_MINUS_SRC_COLOR,[Cd]:s.ONE_MINUS_SRC_ALPHA,[cm]:s.ONE_MINUS_DST_COLOR,[om]:s.ONE_MINUS_DST_ALPHA,[um]:s.CONSTANT_COLOR,[dm]:s.ONE_MINUS_CONSTANT_COLOR,[fm]:s.CONSTANT_ALPHA,[pm]:s.ONE_MINUS_CONSTANT_ALPHA};function rn(O,Q,Y,de,oe,he,Pe,Ke,ae,Ie){if(O===Us){m===!0&&(Xe(s.BLEND),m=!1);return}if(m===!1&&(Me(s.BLEND),m=!0),O!==Zp){if(O!==g||Ie!==R){if((v!==Ns||S!==Ns)&&(s.blendEquation(s.FUNC_ADD),v=Ns,S=Ns),Ie)switch(O){case yr:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Pi:s.blendFunc(s.ONE,s.ONE);break;case _h:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case vh:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Be("WebGLState: Invalid blending: ",O);break}else switch(O){case yr:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Pi:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case _h:Be("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case vh:Be("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Be("WebGLState: Invalid blending: ",O);break}y=null,_=null,T=null,M=null,b.set(0,0,0),I=0,g=O,R=Ie}return}oe=oe||Q,he=he||Y,Pe=Pe||de,(Q!==v||oe!==S)&&(s.blendEquationSeparate(gt[Q],gt[oe]),v=Q,S=oe),(Y!==y||de!==_||he!==T||Pe!==M)&&(s.blendFuncSeparate(je[Y],je[de],je[he],je[Pe]),y=Y,_=de,T=he,M=Pe),(Ke.equals(b)===!1||ae!==I)&&(s.blendColor(Ke.r,Ke.g,Ke.b,ae),b.copy(Ke),I=ae),g=O,R=!1}function Gt(O,Q){O.side===pn?Xe(s.CULL_FACE):Me(s.CULL_FACE);let Y=O.side===Tn;Q&&(Y=!Y),yn(Y),O.blending===yr&&O.transparent===!1?rn(Us):rn(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),a.setFunc(O.depthFunc),a.setTest(O.depthTest),a.setMask(O.depthWrite),r.setMask(O.colorWrite);const de=O.stencilWrite;o.setTest(de),de&&(o.setMask(O.stencilWriteMask),o.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),o.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),jt(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?Me(s.SAMPLE_ALPHA_TO_COVERAGE):Xe(s.SAMPLE_ALPHA_TO_COVERAGE)}function yn(O){D!==O&&(O?s.frontFace(s.CW):s.frontFace(s.CCW),D=O)}function At(O){O!==Yp?(Me(s.CULL_FACE),O!==L&&(O===xh?s.cullFace(s.BACK):O===$p?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):Xe(s.CULL_FACE),L=O}function si(O){O!==C&&(B&&s.lineWidth(O),C=O)}function jt(O,Q,Y){O?(Me(s.POLYGON_OFFSET_FILL),(A!==Q||U!==Y)&&(A=Q,U=Y,a.getReversed()&&(Q=-Q,Y=-Y),s.polygonOffset(Q,Y))):Xe(s.POLYGON_OFFSET_FILL)}function Un(O){O?Me(s.SCISSOR_TEST):Xe(s.SCISSOR_TEST)}function Fn(O){O===void 0&&(O=s.TEXTURE0+z-1),j!==O&&(s.activeTexture(O),j=O)}function On(O,Q,Y){Y===void 0&&(j===null?Y=s.TEXTURE0+z-1:Y=j);let de=te[Y];de===void 0&&(de={type:void 0,texture:void 0},te[Y]=de),(de.type!==O||de.texture!==Q)&&(j!==Y&&(s.activeTexture(Y),j=Y),s.bindTexture(O,Q||De[O]),de.type=O,de.texture=Q)}function G(){const O=te[j];O!==void 0&&O.type!==void 0&&(s.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function kn(){try{s.compressedTexImage2D(...arguments)}catch(O){Be("WebGLState:",O)}}function bt(){try{s.compressedTexImage3D(...arguments)}catch(O){Be("WebGLState:",O)}}function Tt(){try{s.texSubImage2D(...arguments)}catch(O){Be("WebGLState:",O)}}function ge(){try{s.texSubImage3D(...arguments)}catch(O){Be("WebGLState:",O)}}function Ht(){try{s.compressedTexSubImage2D(...arguments)}catch(O){Be("WebGLState:",O)}}function Ue(){try{s.compressedTexSubImage3D(...arguments)}catch(O){Be("WebGLState:",O)}}function Ge(){try{s.texStorage2D(...arguments)}catch(O){Be("WebGLState:",O)}}function P(){try{s.texStorage3D(...arguments)}catch(O){Be("WebGLState:",O)}}function E(){try{s.texImage2D(...arguments)}catch(O){Be("WebGLState:",O)}}function V(){try{s.texImage3D(...arguments)}catch(O){Be("WebGLState:",O)}}function re(O){return u[O]!==void 0?u[O]:s.getParameter(O)}function ee(O,Q){u[O]!==Q&&(s.pixelStorei(O,Q),u[O]=Q)}function ce(O){Z.equals(O)===!1&&(s.scissor(O.x,O.y,O.z,O.w),Z.copy(O))}function pe(O){ve.equals(O)===!1&&(s.viewport(O.x,O.y,O.z,O.w),ve.copy(O))}function $(O,Q){let Y=c.get(Q);Y===void 0&&(Y=new WeakMap,c.set(Q,Y));let de=Y.get(O);de===void 0&&(de=s.getUniformBlockIndex(Q,O.name),s.uniformBlockBinding(Q,de,de),Y.set(O,de))}function J(O,Q,Y){const oe=c.get(Q).get(O);l[oe]!==Y&&(s.bindBufferBase(s.UNIFORM_BUFFER,oe,Y),l[oe]=Y)}function ue(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),h={},u={},j=null,te={},d={},l={},f=new WeakMap,p=[],x=null,m=!1,g=null,v=null,y=null,_=null,S=null,T=null,M=null,b=new le(0,0,0),I=0,R=!1,D=null,L=null,C=null,A=null,U=null,Z.set(0,0,s.canvas.width,s.canvas.height),ve.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:Me,disable:Xe,bindFramebuffer:Ut,drawBuffers:Oe,useProgram:lt,setBlending:rn,setMaterial:Gt,setFlipSided:yn,setCullFace:At,setLineWidth:si,setPolygonOffset:jt,setScissorTest:Un,activeTexture:Fn,bindTexture:On,unbindTexture:G,compressedTexImage2D:kn,compressedTexImage3D:bt,texImage2D:E,texImage3D:V,pixelStorei:ee,getParameter:re,updateUBOMapping:$,uniformBlockBinding:J,texStorage2D:Ge,texStorage3D:P,texSubImage2D:Tt,texSubImage3D:ge,compressedTexSubImage2D:Ht,compressedTexSubImage3D:Ue,scissor:ce,viewport:pe,reset:ue}}function Ey(s,e,t,n,i,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Se,h=new WeakMap,u=new Set;let d;const f=new WeakMap,p=new Set,x=new FinalizationRegistry(P=>p.delete(P));let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(P,E){return m?new OffscreenCanvas(P,E):Fr("canvas")}function v(P,E,V){let re=1;const ee=Ge(P);if((ee.width>V||ee.height>V)&&(re=V/Math.max(ee.width,ee.height)),re<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const ce=Math.floor(re*ee.width),pe=Math.floor(re*ee.height);d===void 0&&(d=g(ce,pe));const $=E?g(ce,pe):d;return $.width=ce,$.height=pe,$.getContext("2d").drawImage(P,0,0,ce,pe),Ce("WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+ce+"x"+pe+")."),$}else return"data"in P&&Ce("WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),P;return P}function y(P){return P.generateMipmaps}function _(P){s.generateMipmap(P)}function S(P){return P.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?s.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function T(P,E,V,re,ee,ce=!1){if(P!==null){if(s[P]!==void 0)return s[P];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let pe;re&&(pe=e.get("EXT_texture_norm16"),pe||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=E;if(E===s.RED&&(V===s.FLOAT&&($=s.R32F),V===s.HALF_FLOAT&&($=s.R16F),V===s.UNSIGNED_BYTE&&($=s.R8),V===s.UNSIGNED_SHORT&&pe&&($=pe.R16_EXT),V===s.SHORT&&pe&&($=pe.R16_SNORM_EXT)),E===s.RED_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.R8UI),V===s.UNSIGNED_SHORT&&($=s.R16UI),V===s.UNSIGNED_INT&&($=s.R32UI),V===s.BYTE&&($=s.R8I),V===s.SHORT&&($=s.R16I),V===s.INT&&($=s.R32I)),E===s.RG&&(V===s.FLOAT&&($=s.RG32F),V===s.HALF_FLOAT&&($=s.RG16F),V===s.UNSIGNED_BYTE&&($=s.RG8),V===s.UNSIGNED_SHORT&&pe&&($=pe.RG16_EXT),V===s.SHORT&&pe&&($=pe.RG16_SNORM_EXT)),E===s.RG_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.RG8UI),V===s.UNSIGNED_SHORT&&($=s.RG16UI),V===s.UNSIGNED_INT&&($=s.RG32UI),V===s.BYTE&&($=s.RG8I),V===s.SHORT&&($=s.RG16I),V===s.INT&&($=s.RG32I)),E===s.RGB_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.RGB8UI),V===s.UNSIGNED_SHORT&&($=s.RGB16UI),V===s.UNSIGNED_INT&&($=s.RGB32UI),V===s.BYTE&&($=s.RGB8I),V===s.SHORT&&($=s.RGB16I),V===s.INT&&($=s.RGB32I)),E===s.RGBA_INTEGER&&(V===s.UNSIGNED_BYTE&&($=s.RGBA8UI),V===s.UNSIGNED_SHORT&&($=s.RGBA16UI),V===s.UNSIGNED_INT&&($=s.RGBA32UI),V===s.BYTE&&($=s.RGBA8I),V===s.SHORT&&($=s.RGBA16I),V===s.INT&&($=s.RGBA32I)),E===s.RGB&&(V===s.UNSIGNED_SHORT&&pe&&($=pe.RGB16_EXT),V===s.SHORT&&pe&&($=pe.RGB16_SNORM_EXT),V===s.UNSIGNED_INT_5_9_9_9_REV&&($=s.RGB9_E5),V===s.UNSIGNED_INT_10F_11F_11F_REV&&($=s.R11F_G11F_B10F)),E===s.RGBA){const J=ce?$a:Qe.getTransfer(ee);V===s.FLOAT&&($=s.RGBA32F),V===s.HALF_FLOAT&&($=s.RGBA16F),V===s.UNSIGNED_BYTE&&($=J===ut?s.SRGB8_ALPHA8:s.RGBA8),V===s.UNSIGNED_SHORT&&pe&&($=pe.RGBA16_EXT),V===s.SHORT&&pe&&($=pe.RGBA16_SNORM_EXT),V===s.UNSIGNED_SHORT_4_4_4_4&&($=s.RGBA4),V===s.UNSIGNED_SHORT_5_5_5_1&&($=s.RGB5_A1)}return($===s.R16F||$===s.R32F||$===s.RG16F||$===s.RG32F||$===s.RGBA16F||$===s.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function M(P,E){let V;return P?E===null||E===fi||E===Gs?V=s.DEPTH24_STENCIL8:E===Gn?V=s.DEPTH32F_STENCIL8:E===Ir&&(V=s.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===fi||E===Gs?V=s.DEPTH_COMPONENT24:E===Gn?V=s.DEPTH_COMPONENT32F:E===Ir&&(V=s.DEPTH_COMPONENT16),V}function b(P,E){return y(P)===!0||P.isFramebufferTexture&&P.minFilter!==Kt&&P.minFilter!==ln?Math.log2(Math.max(E.width,E.height))+1:P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?E.mipmaps.length:1}function I(P){const E=new WeakRef(P);n.get(P).__ref=E,p.add(E),x.register(P,E,E)}function R(P){const E=n.get(P).__ref;E!==void 0&&(p.delete(E),x.unregister(E))}function D(P){C(P.target)}function L(P){A(P.target)}function C(P){P.removeEventListener("dispose",D),R(P),z(P),P.isVideoTexture&&h.delete(P),P.isHTMLTexture&&u.delete(P)}function A(P){P.removeEventListener("dispose",L),R(P),K(P)}function U(){for(const P of p){const E=P.deref();E!==void 0&&(E.isRenderTarget===!0?A(E):C(E))}p.clear(),u.clear()}function z(P){const E=n.get(P);if(E.__webglInit===void 0)return;const V=P.source,re=f.get(V);if(re){const ee=re[E.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&B(P),Object.keys(re).length===0&&f.delete(V)}n.remove(P)}function B(P){const E=n.get(P);s.deleteTexture(E.__webglTexture);const V=P.source,re=f.get(V);delete re[E.__cacheKey],a.memory.textures--}function K(P){const E=n.get(P);E.__depthDisposeCallback&&E.__depthDisposeCallback();const V=P.depthTexture;if(V&&V.renderTarget===P&&C(V),P.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(E.__webglFramebuffer[ee]))for(let ce=0;ce<E.__webglFramebuffer[ee].length;ce++)s.deleteFramebuffer(E.__webglFramebuffer[ee][ce]);else s.deleteFramebuffer(E.__webglFramebuffer[ee]);E.__webglDepthbuffer&&s.deleteRenderbuffer(E.__webglDepthbuffer[ee])}else{if(Array.isArray(E.__webglFramebuffer))for(let ee=0;ee<E.__webglFramebuffer.length;ee++)s.deleteFramebuffer(E.__webglFramebuffer[ee]);else s.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&s.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&s.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let ee=0;ee<E.__webglColorRenderbuffer.length;ee++)E.__webglColorRenderbuffer[ee]&&s.deleteRenderbuffer(E.__webglColorRenderbuffer[ee]);E.__webglDepthRenderbuffer&&s.deleteRenderbuffer(E.__webglDepthRenderbuffer)}const re=P.textures;for(let ee=0,ce=re.length;ee<ce;ee++){const pe=n.get(re[ee]);pe.__webglTexture&&(s.deleteTexture(pe.__webglTexture),a.memory.textures--),n.remove(re[ee])}n.remove(P)}let X=0;function j(){X=0}function te(){return X}function Te(P){X=P}function Ve(){const P=X;return P>=i.maxTextures&&Ce("WebGLTextures: Trying to use "+(P+1)+" texture units while this GPU supports only "+i.maxTextures),X+=1,P}function Z(P){const E=[];return E.push(P.wrapS),E.push(P.wrapT),E.push(P.wrapR||0),E.push(P.magFilter),E.push(P.minFilter),E.push(P.anisotropy),E.push(P.internalFormat),E.push(P.format),E.push(P.type),E.push(P.generateMipmaps),E.push(P.mipmapsAutoUpdate),E.push(P.premultiplyAlpha),E.push(P.flipY),E.push(P.unpackAlignment),E.push(P.colorSpace),E.join()}function ve(P,E){const V=n.get(P);if(P.isVideoTexture&&Ht(P),P.isRenderTargetTexture===!1&&P.isExternalTexture!==!0&&P.version>0&&V.__version!==P.version){const re=P.image;if(re===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(re.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Gt(V,P,E);return}}else P.isExternalTexture&&(V.__webglTexture=P.sourceTexture?P.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,V.__webglTexture,s.TEXTURE0+E)}function Ee(P,E){const V=n.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&V.__version!==P.version){Gt(V,P,E);return}else P.isExternalTexture&&(V.__webglTexture=P.sourceTexture?P.sourceTexture:null);t.bindTexture(s.TEXTURE_2D_ARRAY,V.__webglTexture,s.TEXTURE0+E)}function De(P,E){const V=n.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&V.__version!==P.version){Gt(V,P,E);return}t.bindTexture(s.TEXTURE_3D,V.__webglTexture,s.TEXTURE0+E)}function Me(P,E){const V=n.get(P);if(P.version>0&&V.__version!==P.version){yn(V,P,E);return}t.bindTexture(s.TEXTURE_CUBE_MAP,V.__webglTexture,s.TEXTURE0+E)}const Xe={[Ji]:s.REPEAT,[hi]:s.CLAMP_TO_EDGE,[Xa]:s.MIRRORED_REPEAT},Ut={[Kt]:s.NEAREST,[Od]:s.NEAREST_MIPMAP_NEAREST,[fr]:s.NEAREST_MIPMAP_LINEAR,[ln]:s.LINEAR,[Ua]:s.LINEAR_MIPMAP_NEAREST,[Jn]:s.LINEAR_MIPMAP_LINEAR},Oe={[bm]:s.NEVER,[Kd]:s.ALWAYS,[Tm]:s.LESS,[Xd]:s.LEQUAL,[Em]:s.EQUAL,[qd]:s.GEQUAL,[wm]:s.GREATER,[Am]:s.NOTEQUAL};function lt(P,E){if(E.type===Gn&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===ln||E.magFilter===Ua||E.magFilter===fr||E.magFilter===Jn||E.minFilter===ln||E.minFilter===Ua||E.minFilter===fr||E.minFilter===Jn)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(P,s.TEXTURE_WRAP_S,Xe[E.wrapS]),s.texParameteri(P,s.TEXTURE_WRAP_T,Xe[E.wrapT]),(P===s.TEXTURE_3D||P===s.TEXTURE_2D_ARRAY)&&s.texParameteri(P,s.TEXTURE_WRAP_R,Xe[E.wrapR]),s.texParameteri(P,s.TEXTURE_MAG_FILTER,Ut[E.magFilter]),s.texParameteri(P,s.TEXTURE_MIN_FILTER,Ut[E.minFilter]),E.compareFunction&&(s.texParameteri(P,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(P,s.TEXTURE_COMPARE_FUNC,Oe[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===Kt||E.minFilter!==fr&&E.minFilter!==Jn||E.type===Gn&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||n.get(E).__currentAnisotropy){const V=e.get("EXT_texture_filter_anisotropic");s.texParameterf(P,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,i.getMaxAnisotropy())),n.get(E).__currentAnisotropy=E.anisotropy}}}function gt(P,E){let V=!1;P.__webglInit===void 0&&(P.__webglInit=!0,E.addEventListener("dispose",D),I(E));const re=E.source;let ee=f.get(re);ee===void 0&&(ee={},f.set(re,ee));const ce=Z(E);if(ce!==P.__cacheKey){ee[ce]===void 0&&(ee[ce]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,V=!0),ee[ce].usedTimes++;const pe=ee[P.__cacheKey];pe!==void 0&&(ee[P.__cacheKey].usedTimes--,pe.usedTimes===0&&B(E)),P.__cacheKey=ce,P.__webglTexture=ee[ce].texture}return V}function je(P,E,V){return Math.floor(Math.floor(P/V)/E)}function rn(P,E,V,re){const ce=P.updateRanges;if(ce.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,E.width,E.height,V,re,E.data);else{ce.sort((O,Q)=>O.start-Q.start);let pe=0;for(let O=1;O<ce.length;O++){const Q=ce[pe],Y=ce[O],de=Q.start+Q.count,oe=je(Y.start,E.width,4),he=je(Q.start,E.width,4);Y.start<=de+1&&oe===he&&je(Y.start+Y.count-1,E.width,4)===oe?Q.count=Math.max(Q.count,Y.start+Y.count-Q.start):(++pe,ce[pe]=Y)}ce.length=pe+1;const $=t.getParameter(s.UNPACK_ROW_LENGTH),J=t.getParameter(s.UNPACK_SKIP_PIXELS),ue=t.getParameter(s.UNPACK_SKIP_ROWS);t.pixelStorei(s.UNPACK_ROW_LENGTH,E.width);for(let O=0,Q=ce.length;O<Q;O++){const Y=ce[O],de=Math.floor(Y.start/4),oe=Math.ceil(Y.count/4),he=de%E.width,Pe=Math.floor(de/E.width),Ke=oe,ae=1;t.pixelStorei(s.UNPACK_SKIP_PIXELS,he),t.pixelStorei(s.UNPACK_SKIP_ROWS,Pe),t.texSubImage2D(s.TEXTURE_2D,0,he,Pe,Ke,ae,V,re,E.data)}P.clearUpdateRanges(),t.pixelStorei(s.UNPACK_ROW_LENGTH,$),t.pixelStorei(s.UNPACK_SKIP_PIXELS,J),t.pixelStorei(s.UNPACK_SKIP_ROWS,ue)}}function Gt(P,E,V){let re=s.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(re=s.TEXTURE_2D_ARRAY),E.isData3DTexture&&(re=s.TEXTURE_3D);const ee=gt(P,E),ce=E.source;t.bindTexture(re,P.__webglTexture,s.TEXTURE0+V);const pe=n.get(ce);if(ce.version!==pe.__version||ee===!0){if(t.activeTexture(s.TEXTURE0+V),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){const ae=Qe.getPrimaries(Qe.workingColorSpace),Ie=E.colorSpace===Vi?null:Qe.getPrimaries(E.colorSpace),qe=E.colorSpace===Vi||ae===Ie?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,E.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,qe)}t.pixelStorei(s.UNPACK_ALIGNMENT,E.unpackAlignment);let J=v(E.image,!1,i.maxTextureSize);J=Ue(E,J);const ue=r.convert(E.format,E.colorSpace),O=r.convert(E.type);let Q=T(E.internalFormat,ue,O,E.normalized,E.colorSpace,E.isVideoTexture);lt(re,E);let Y;const de=E.mipmaps,oe=E.isVideoTexture!==!0,he=pe.__version===void 0||ee===!0,Pe=ce.dataReady,Ke=b(E,J);if(E.isDepthTexture)Q=M(E.format===Xi,E.type),he&&(oe?t.texStorage2D(s.TEXTURE_2D,1,Q,J.width,J.height):t.texImage2D(s.TEXTURE_2D,0,Q,J.width,J.height,0,ue,O,null));else if(E.isDataTexture)if(de.length>0){oe&&he&&t.texStorage2D(s.TEXTURE_2D,Ke,Q,de[0].width,de[0].height);for(let ae=0,Ie=de.length;ae<Ie;ae++)Y=de[ae],oe?Pe&&t.texSubImage2D(s.TEXTURE_2D,ae,0,0,Y.width,Y.height,ue,O,Y.data):t.texImage2D(s.TEXTURE_2D,ae,Q,Y.width,Y.height,0,ue,O,Y.data);E.generateMipmaps=!1}else oe?(he&&t.texStorage2D(s.TEXTURE_2D,Ke,Q,J.width,J.height),Pe&&rn(E,J,ue,O)):t.texImage2D(s.TEXTURE_2D,0,Q,J.width,J.height,0,ue,O,J.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){oe&&he&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Ke,Q,de[0].width,de[0].height,J.depth);for(let ae=0,Ie=de.length;ae<Ie;ae++)if(Y=de[ae],E.format!==Zn)if(ue!==null)if(oe){if(Pe)if(E.layerUpdates.size>0){const qe=Mu(Y.width,Y.height,E.format,E.type);for(const xe of E.layerUpdates){const ct=Y.data.subarray(xe*qe/Y.data.BYTES_PER_ELEMENT,(xe+1)*qe/Y.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ae,0,0,xe,Y.width,Y.height,1,ue,ct)}}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ae,0,0,0,Y.width,Y.height,J.depth,ue,Y.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,ae,Q,Y.width,Y.height,J.depth,0,Y.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else oe?Pe&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,ae,0,0,0,Y.width,Y.height,J.depth,ue,O,Y.data):t.texImage3D(s.TEXTURE_2D_ARRAY,ae,Q,Y.width,Y.height,J.depth,0,ue,O,Y.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{oe&&he&&t.texStorage2D(s.TEXTURE_2D,Ke,Q,de[0].width,de[0].height);for(let ae=0,Ie=de.length;ae<Ie;ae++)Y=de[ae],E.format!==Zn?ue!==null?oe?Pe&&t.compressedTexSubImage2D(s.TEXTURE_2D,ae,0,0,Y.width,Y.height,ue,Y.data):t.compressedTexImage2D(s.TEXTURE_2D,ae,Q,Y.width,Y.height,0,Y.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):oe?Pe&&t.texSubImage2D(s.TEXTURE_2D,ae,0,0,Y.width,Y.height,ue,O,Y.data):t.texImage2D(s.TEXTURE_2D,ae,Q,Y.width,Y.height,0,ue,O,Y.data)}else if(E.isDataArrayTexture)if(oe){if(he&&t.texStorage3D(s.TEXTURE_2D_ARRAY,Ke,Q,J.width,J.height,J.depth),Pe)if(E.layerUpdates.size>0){const ae=Mu(J.width,J.height,E.format,E.type);for(const Ie of E.layerUpdates){const qe=J.data.subarray(Ie*ae/J.data.BYTES_PER_ELEMENT,(Ie+1)*ae/J.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Ie,J.width,J.height,1,ue,O,qe)}E.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,ue,O,J.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,Q,J.width,J.height,J.depth,0,ue,O,J.data);else if(E.isData3DTexture)oe?(he&&t.texStorage3D(s.TEXTURE_3D,Ke,Q,J.width,J.height,J.depth),Pe&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,ue,O,J.data)):t.texImage3D(s.TEXTURE_3D,0,Q,J.width,J.height,J.depth,0,ue,O,J.data);else if(E.isFramebufferTexture){if(he)if(oe)t.texStorage2D(s.TEXTURE_2D,Ke,Q,J.width,J.height);else{let ae=J.width,Ie=J.height;for(let qe=0;qe<Ke;qe++)t.texImage2D(s.TEXTURE_2D,qe,Q,ae,Ie,0,ue,O,null),ae>>=1,Ie>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in s){const ae=s.canvas;if(ae.hasAttribute("layoutsubtree")||ae.setAttribute("layoutsubtree","true"),J.parentNode!==ae){ae.appendChild(J),u.add(E),ae.onpaint=Ie=>{const qe=Ie.changedElements;for(const xe of u)qe.includes(xe.image)&&(xe.needsUpdate=!0)},ae.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,J);else{const qe=s.RGBA,xe=s.RGBA,ct=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,qe,xe,ct,J)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(de.length>0){if(oe&&he){const ae=Ge(de[0]);t.texStorage2D(s.TEXTURE_2D,Ke,Q,ae.width,ae.height)}for(let ae=0,Ie=de.length;ae<Ie;ae++)Y=de[ae],oe?Pe&&t.texSubImage2D(s.TEXTURE_2D,ae,0,0,ue,O,Y):t.texImage2D(s.TEXTURE_2D,ae,Q,ue,O,Y);E.generateMipmaps=!1}else if(oe){if(he){const ae=Ge(J);t.texStorage2D(s.TEXTURE_2D,Ke,Q,ae.width,ae.height)}Pe&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,ue,O,J)}else t.texImage2D(s.TEXTURE_2D,0,Q,ue,O,J);y(E)&&E.mipmapsAutoUpdate===!0&&_(re),pe.__version=ce.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function yn(P,E,V){if(E.image.length!==6)return;const re=gt(P,E),ee=E.source;t.bindTexture(s.TEXTURE_CUBE_MAP,P.__webglTexture,s.TEXTURE0+V);const ce=n.get(ee);if(ee.version!==ce.__version||re===!0){t.activeTexture(s.TEXTURE0+V);const pe=Qe.getPrimaries(Qe.workingColorSpace),$=E.colorSpace===Vi?null:Qe.getPrimaries(E.colorSpace),J=E.colorSpace===Vi||pe===$?s.NONE:s.BROWSER_DEFAULT_WEBGL;t.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,E.flipY),t.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),t.pixelStorei(s.UNPACK_ALIGNMENT,E.unpackAlignment),t.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);const ue=E.isCompressedTexture||E.image[0].isCompressedTexture,O=E.image[0]&&E.image[0].isDataTexture,Q=[];for(let xe=0;xe<6;xe++)!ue&&!O?Q[xe]=v(E.image[xe],!0,i.maxCubemapSize):Q[xe]=O?E.image[xe].image:E.image[xe],Q[xe]=Ue(E,Q[xe]);const Y=Q[0],de=r.convert(E.format,E.colorSpace),oe=r.convert(E.type);let he=T(E.internalFormat,de,oe,E.normalized,E.colorSpace);const Pe=E.isVideoTexture!==!0,Ke=ce.__version===void 0||re===!0,ae=ee.dataReady;let Ie=b(E,Y);lt(s.TEXTURE_CUBE_MAP,E);let qe;if(E.isDepthTexture){if(he=M(E.format===Xi,E.type),Ke)if(Pe)t.texStorage2D(s.TEXTURE_CUBE_MAP,1,he,Y.width,Y.height);else for(let xe=0;xe<6;xe++)t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,he,Y.width,Y.height,0,de,oe,null)}else if(ue){Pe&&Ke&&t.texStorage2D(s.TEXTURE_CUBE_MAP,Ie,he,Y.width,Y.height);for(let xe=0;xe<6;xe++){qe=Q[xe].mipmaps;for(let ct=0;ct<qe.length;ct++){const en=qe[ct];E.format!==Zn?de!==null?Pe?ae&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct,0,0,en.width,en.height,de,en.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct,he,en.width,en.height,0,en.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Pe?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct,0,0,en.width,en.height,de,oe,en.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct,he,en.width,en.height,0,de,oe,en.data)}}}else{if(qe=E.mipmaps,Pe&&Ke){qe.length>0&&Ie++;const xe=Ge(Q[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,Ie,he,xe.width,xe.height)}for(let xe=0;xe<6;xe++)if(O){Pe?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,0,0,Q[xe].width,Q[xe].height,de,oe,Q[xe].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,he,Q[xe].width,Q[xe].height,0,de,oe,Q[xe].data);for(let ct=0;ct<qe.length;ct++){const Ii=qe[ct].image[xe].image;Pe?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct+1,0,0,Ii.width,Ii.height,de,oe,Ii.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct+1,he,Ii.width,Ii.height,0,de,oe,Ii.data)}}else{Pe?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,0,0,de,oe,Q[xe]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,he,de,oe,Q[xe]);for(let ct=0;ct<qe.length;ct++){const en=qe[ct];Pe?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct+1,0,0,de,oe,en.image[xe]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+xe,ct+1,he,de,oe,en.image[xe])}}}y(E)&&E.mipmapsAutoUpdate===!0&&_(s.TEXTURE_CUBE_MAP),ce.__version=ee.version,E.onUpdate&&E.onUpdate(E)}P.__version=E.version}function At(P,E,V,re,ee,ce){const pe=r.convert(V.format,V.colorSpace),$=r.convert(V.type),J=T(V.internalFormat,pe,$,V.normalized,V.colorSpace),ue=n.get(E),O=n.get(V);if(O.__renderTarget=E,!ue.__hasExternalTextures){const Q=Math.max(1,E.width>>ce),Y=Math.max(1,E.height>>ce);ee===s.TEXTURE_3D||ee===s.TEXTURE_2D_ARRAY?t.texImage3D(ee,ce,J,Q,Y,E.depth,0,pe,$,null):t.texImage2D(ee,ce,J,Q,Y,0,pe,$,null)}t.bindFramebuffer(s.FRAMEBUFFER,P),ge(E)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,re,ee,O.__webglTexture,0,Tt(E)):(ee===s.TEXTURE_2D||ee>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,re,ee,O.__webglTexture,ce),t.bindFramebuffer(s.FRAMEBUFFER,null)}function si(P,E,V){if(s.bindRenderbuffer(s.RENDERBUFFER,P),E.depthBuffer){const re=E.depthTexture,ee=re&&re.isDepthTexture?re.type:null,ce=M(E.stencilBuffer,ee),pe=E.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;ge(E)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Tt(E),ce,E.width,E.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,Tt(E),ce,E.width,E.height):s.renderbufferStorage(s.RENDERBUFFER,ce,E.width,E.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,pe,s.RENDERBUFFER,P)}else{const re=E.textures;for(let ee=0;ee<re.length;ee++){const ce=re[ee],pe=r.convert(ce.format,ce.colorSpace),$=r.convert(ce.type),J=T(ce.internalFormat,pe,$,ce.normalized,ce.colorSpace);ge(E)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Tt(E),J,E.width,E.height):V?s.renderbufferStorageMultisample(s.RENDERBUFFER,Tt(E),J,E.width,E.height):s.renderbufferStorage(s.RENDERBUFFER,J,E.width,E.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function jt(P,E,V){const re=E.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(s.FRAMEBUFFER,P),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ee=n.get(E.depthTexture);ee.__renderTarget=E;const ce=re?E.depthTexture.image[0]:E.depthTexture.image;(!ee.__webglTexture||ce.width!==E.width||ce.height!==E.height)&&(ce.width=E.width,ce.height=E.height,E.depthTexture.needsUpdate=!0),re?Me(E.depthTexture,0):ve(E.depthTexture,0);const pe=ee.__webglTexture,$=Tt(E),J=re?s.TEXTURE_CUBE_MAP_POSITIVE_X+V:s.TEXTURE_2D,ue=E.depthTexture.format===Xi?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(E.depthTexture.format===Zi)ge(E)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ue,J,pe,0,$):s.framebufferTexture2D(s.FRAMEBUFFER,ue,J,pe,0);else if(E.depthTexture.format===Xi)ge(E)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,ue,J,pe,0,$):s.framebufferTexture2D(s.FRAMEBUFFER,ue,J,pe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Un(P){const E=n.get(P),V=P.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==P.depthTexture){const re=P.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),re){const ee=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,re.removeEventListener("dispose",ee)};re.addEventListener("dispose",ee),E.__depthDisposeCallback=ee}E.__boundDepthTexture=re}if(P.depthTexture&&!E.__autoAllocateDepthBuffer)if(V)for(let re=0;re<6;re++)jt(E.__webglFramebuffer[re],P,re);else P.texture.mipmaps.length>0?jt(E.__webglFramebuffer[0],P,0):jt(E.__webglFramebuffer,P,0);else if(V){E.__webglDepthbuffer=[];for(let re=0;re<6;re++)if(t.bindFramebuffer(s.FRAMEBUFFER,E.__webglFramebuffer[re]),E.__webglDepthbuffer[re]===void 0)E.__webglDepthbuffer[re]=s.createRenderbuffer(),si(E.__webglDepthbuffer[re],P,!1);else{const ee=P.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ce=E.__webglDepthbuffer[re];s.bindRenderbuffer(s.RENDERBUFFER,ce),s.framebufferRenderbuffer(s.FRAMEBUFFER,ee,s.RENDERBUFFER,ce)}}else if(P.texture.mipmaps.length>0?t.bindFramebuffer(s.FRAMEBUFFER,E.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=s.createRenderbuffer(),si(E.__webglDepthbuffer,P,!1);else{const ee=P.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ce=E.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,ce),s.framebufferRenderbuffer(s.FRAMEBUFFER,ee,s.RENDERBUFFER,ce)}t.bindFramebuffer(s.FRAMEBUFFER,null)}function Fn(P,E,V){const re=n.get(P);E!==void 0&&At(re.__webglFramebuffer,P,P.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),V!==void 0&&Un(P)}function On(P){const E=P.texture,V=n.get(P),re=n.get(E);P.addEventListener("dispose",L),I(P);const ee=P.textures,ce=P.isWebGLCubeRenderTarget===!0,pe=ee.length>1;if(pe||(re.__webglTexture===void 0&&(re.__webglTexture=s.createTexture()),re.__version=E.version,a.memory.textures++),ce){V.__webglFramebuffer=[];for(let $=0;$<6;$++)if(E.mipmaps.length>0){V.__webglFramebuffer[$]=[];for(let J=0;J<E.mipmaps.length;J++)V.__webglFramebuffer[$][J]=s.createFramebuffer()}else V.__webglFramebuffer[$]=s.createFramebuffer()}else{if(E.mipmaps.length>0){V.__webglFramebuffer=[];for(let $=0;$<E.mipmaps.length;$++)V.__webglFramebuffer[$]=s.createFramebuffer()}else V.__webglFramebuffer=s.createFramebuffer();if(pe)for(let $=0,J=ee.length;$<J;$++){const ue=n.get(ee[$]);ue.__webglTexture===void 0&&(ue.__webglTexture=s.createTexture(),a.memory.textures++)}if(P.samples>0&&ge(P)===!1){V.__webglMultisampledFramebuffer=s.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let $=0;$<ee.length;$++){const J=ee[$];V.__webglColorRenderbuffer[$]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,V.__webglColorRenderbuffer[$]);const ue=r.convert(J.format,J.colorSpace),O=r.convert(J.type),Q=T(J.internalFormat,ue,O,J.normalized,J.colorSpace,P.isXRRenderTarget===!0),Y=Tt(P);s.renderbufferStorageMultisample(s.RENDERBUFFER,Y,Q,P.width,P.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+$,s.RENDERBUFFER,V.__webglColorRenderbuffer[$])}s.bindRenderbuffer(s.RENDERBUFFER,null),P.depthBuffer&&(V.__webglDepthRenderbuffer=s.createRenderbuffer(),si(V.__webglDepthRenderbuffer,P,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(ce){t.bindTexture(s.TEXTURE_CUBE_MAP,re.__webglTexture),lt(s.TEXTURE_CUBE_MAP,E);for(let $=0;$<6;$++)if(E.mipmaps.length>0)for(let J=0;J<E.mipmaps.length;J++)At(V.__webglFramebuffer[$][J],P,E,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+$,J);else At(V.__webglFramebuffer[$],P,E,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);y(E)?_(s.TEXTURE_CUBE_MAP):E.mipmaps.length>0&&s.texParameteri(s.TEXTURE_CUBE_MAP,s.TEXTURE_MAX_LEVEL,E.mipmaps.length-1),t.unbindTexture()}else if(pe){for(let $=0,J=ee.length;$<J;$++){const ue=ee[$],O=n.get(ue);let Q=s.TEXTURE_2D;(P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(Q=P.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(Q,O.__webglTexture),lt(Q,ue),At(V.__webglFramebuffer,P,ue,s.COLOR_ATTACHMENT0+$,Q,0),y(ue)&&_(Q)}t.unbindTexture()}else{let $=s.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&($=P.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture($,re.__webglTexture),lt($,E),E.mipmaps.length>0)for(let J=0;J<E.mipmaps.length;J++)At(V.__webglFramebuffer[J],P,E,s.COLOR_ATTACHMENT0,$,J);else At(V.__webglFramebuffer,P,E,s.COLOR_ATTACHMENT0,$,0);y(E)?_($):E.mipmaps.length>0&&s.texParameteri($,s.TEXTURE_MAX_LEVEL,E.mipmaps.length-1),t.unbindTexture()}P.depthBuffer&&Un(P)}function G(P){const E=P.textures;for(let V=0,re=E.length;V<re;V++){const ee=E[V];if(y(ee)&&ee.mipmapsAutoUpdate===!0){const ce=S(P),pe=n.get(ee).__webglTexture;t.bindTexture(ce,pe),_(ce),t.unbindTexture()}}}const kn=[];function bt(P){if(P.samples>0){if(ge(P)===!1){const E=P.textures,V=P.width,re=P.height;let ee=s.COLOR_BUFFER_BIT;const ce=P.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,pe=n.get(P),$=E.length>1;if($)for(let ue=0;ue<E.length;ue++)t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,pe.__webglMultisampledFramebuffer),P.texture.mipmaps.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,pe.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let ue=0;ue<E.length;ue++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(ee|=s.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(ee|=s.STENCIL_BUFFER_BIT)),$){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,pe.__webglColorRenderbuffer[ue]);const O=n.get(E[ue]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,O,0)}s.blitFramebuffer(0,0,V,re,0,0,V,re,ee,s.NEAREST),l===!0&&(kn.length=0,kn.push(s.COLOR_ATTACHMENT0+ue),P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&kn.push(ce),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,kn))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),$)for(let ue=0;ue<E.length;ue++){t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.RENDERBUFFER,pe.__webglColorRenderbuffer[ue]);const O=n.get(E[ue]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,pe.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ue,s.TEXTURE_2D,O,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,pe.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&l){const E=P.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[E])}}}function Tt(P){return Math.min(i.maxSamples,P.samples)}function ge(P){const E=n.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function Ht(P){const E=a.render.frame;h.get(P)!==E&&(h.set(P,E),P.update())}function Ue(P,E){const V=P.colorSpace,re=P.format,ee=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||V!==Ln&&V!==Vi&&(Qe.getTransfer(V)===ut?(re!==Zn||ee!==Pn)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Be("WebGLTextures: Unsupported texture color space:",V)),E}function Ge(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(c.width=P.naturalWidth||P.width,c.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(c.width=P.displayWidth,c.height=P.displayHeight):(c.width=P.width,c.height=P.height),c}this.allocateTextureUnit=Ve,this.resetTextureUnits=j,this.getTextureUnits=te,this.setTextureUnits=Te,this.setTexture2D=ve,this.setTexture2DArray=Ee,this.setTexture3D=De,this.setTextureCube=Me,this.rebindTextures=Fn,this.setupRenderTarget=On,this.updateRenderTargetMipmap=G,this.updateMultisampleRenderTarget=bt,this.setupDepthRenderbuffer=Un,this.setupFrameBufferTexture=At,this.useMultisampledRTT=ge,this.dispose=U}function wy(s,e){function t(n,i=Vi){let r;const a=Qe.getTransfer(i);if(n===Pn)return s.UNSIGNED_BYTE;if(n===_c)return s.UNSIGNED_SHORT_4_4_4_4;if(n===vc)return s.UNSIGNED_SHORT_5_5_5_1;if(n===Bd)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===Gd)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===kd)return s.BYTE;if(n===zd)return s.SHORT;if(n===Ir)return s.UNSIGNED_SHORT;if(n===xc)return s.INT;if(n===fi)return s.UNSIGNED_INT;if(n===Gn)return s.FLOAT;if(n===pi)return s.HALF_FLOAT;if(n===Hd)return s.ALPHA;if(n===Vd)return s.RGB;if(n===Zn)return s.RGBA;if(n===Zi)return s.DEPTH_COMPONENT;if(n===Xi)return s.DEPTH_STENCIL;if(n===Mc)return s.RED;if(n===yc)return s.RED_INTEGER;if(n===fs)return s.RG;if(n===Sc)return s.RG_INTEGER;if(n===bc)return s.RGBA_INTEGER;if(n===Fa||n===Oa||n===ka||n===za)if(a===ut)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Fa)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Oa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ka)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===za)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Fa)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Oa)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ka)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===za)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===El||n===wl||n===Al||n===Rl)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===El)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===wl)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Al)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Rl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Cl||n===Pl||n===Ll||n===Il||n===Nl||n===qa||n===Dl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Cl||n===Pl)return a===ut?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ll)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Il)return r.COMPRESSED_R11_EAC;if(n===Nl)return r.COMPRESSED_SIGNED_R11_EAC;if(n===qa)return r.COMPRESSED_RG11_EAC;if(n===Dl)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ul||n===Fl||n===Ol||n===kl||n===zl||n===Bl||n===Gl||n===Hl||n===Vl||n===Wl||n===Xl||n===ql||n===Kl||n===Yl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ul)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Fl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ol)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===kl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===zl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Bl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Gl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Hl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Vl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Wl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Xl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ql)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Kl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Yl)return a===ut?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===$l||n===Jl||n===Zl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===$l)return a===ut?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Jl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Zl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ql||n===jl||n===Ka||n===ec)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Ql)return r.COMPRESSED_RED_RGTC1_EXT;if(n===jl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ka)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ec)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Gs?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}const Ay=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Ry=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Cy{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new cf(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new En({vertexShader:Ay,fragmentShader:Ry,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new at(new ui(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Py extends xs{constructor(e,t){super();const n=this;let i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,p=null;const x=typeof XRWebGLBinding<"u",m=new Cy,g={},v=t.getContextAttributes();let y=null,_=null;const S=[],T=[],M=new Se;let b=null,I=null;const R=new vn;R.viewport=new mt;const D=new vn;D.viewport=new mt;const L=[R,D],C=new Ng;let A=null,U=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ve=S[Z];return ve===void 0&&(ve=new Po,S[Z]=ve),ve.getTargetRaySpace()},this.getControllerGrip=function(Z){let ve=S[Z];return ve===void 0&&(ve=new Po,S[Z]=ve),ve.getGripSpace()},this.getHand=function(Z){let ve=S[Z];return ve===void 0&&(ve=new Po,S[Z]=ve),ve.getHandSpace()};function z(Z){const ve=T.indexOf(Z.inputSource);if(ve===-1)return;const Ee=S[ve];Ee!==void 0&&(Ee.update(Z.inputSource,Z.frame,c||a),Ee.dispatchEvent({type:Z.type,data:Z.inputSource}))}function B(){i.removeEventListener("select",z),i.removeEventListener("selectstart",z),i.removeEventListener("selectend",z),i.removeEventListener("squeeze",z),i.removeEventListener("squeezestart",z),i.removeEventListener("squeezeend",z),i.removeEventListener("end",B),i.removeEventListener("inputsourceschange",K);for(let Z=0;Z<S.length;Z++){const ve=T[Z];ve!==null&&(T[Z]=null,S[Z].disconnect(ve))}A=null,U=null,m.reset();for(const Z in g)delete g[Z];if(e.setRenderTarget(y),f=null,d=null,u=null,i=null,_=null,Ve.stop(),n.isPresenting=!1,e.setPixelRatio(b),e.setSize(M.width,M.height,!1),I!==null){const Z=I.camera;Z.fov=I.fov,Z.zoom=I.zoom,Z.updateProjectionMatrix(),I=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,n.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&x&&(u=new XRWebGLBinding(i,t)),u},this.getFrame=function(){return p},this.getSession=function(){return i},this.setSession=async function(Z){if(i=Z,i!==null){if(y=e.getRenderTarget(),i.addEventListener("select",z),i.addEventListener("selectstart",z),i.addEventListener("selectend",z),i.addEventListener("squeeze",z),i.addEventListener("squeezestart",z),i.addEventListener("squeezeend",z),i.addEventListener("end",B),i.addEventListener("inputsourceschange",K),v.xrCompatible!==!0&&await t.makeXRCompatible(),b=e.getPixelRatio(),e.getSize(M),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ee=null,De=null,Me=null;v.depth&&(Me=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Ee=v.stencil?Xi:Zi,De=v.stencil?Gs:fi);const Xe={colorFormat:t.RGBA8,depthFormat:Me,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(Xe),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),_=new di(d.textureWidth,d.textureHeight,{format:Zn,type:Pn,depthTexture:new Vs(d.textureWidth,d.textureHeight,De,void 0,void 0,void 0,void 0,void 0,void 0,Ee),stencilBuffer:v.stencil,colorSpace:e.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{const Ee={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,Ee),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),_=new di(f.framebufferWidth,f.framebufferHeight,{format:Zn,type:Pn,colorSpace:e.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),Ve.setContext(i),Ve.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function K(Z){for(let ve=0;ve<Z.removed.length;ve++){const Ee=Z.removed[ve],De=T.indexOf(Ee);De>=0&&(T[De]=null,S[De].disconnect(Ee))}for(let ve=0;ve<Z.added.length;ve++){const Ee=Z.added[ve];let De=T.indexOf(Ee);if(De===-1){for(let Xe=0;Xe<S.length;Xe++)if(Xe>=T.length){T.push(Ee),De=Xe;break}else if(T[Xe]===null){T[Xe]=Ee,De=Xe;break}if(De===-1)break}const Me=S[De];Me&&Me.connect(Ee)}}function X(Z,ve){ve===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(ve.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(i===null)return;let ve=Z.near,Ee=Z.far;m.texture!==null&&(m.depthNear>0&&(ve=m.depthNear),m.depthFar>0&&(Ee=m.depthFar)),C.near=D.near=R.near=ve,C.far=D.far=R.far=Ee,(A!==C.near||U!==C.far)&&(i.updateRenderState({depthNear:C.near,depthFar:C.far}),A=C.near,U=C.far),C.layers.mask=Z.layers.mask|6,R.layers.mask=C.layers.mask&-5,D.layers.mask=C.layers.mask&-3;const De=Z.parent,Me=C.cameras;X(C,De);for(let Xe=0;Xe<Me.length;Xe++)X(Me[Xe],De);C.projectionMatrix.copy(R.projectionMatrix),C.projectionMatrixInverse.copy(R.projectionMatrixInverse),I===null&&Z.isPerspectiveCamera&&(I={camera:Z,fov:Z.fov,zoom:Z.zoom}),j(Z,C,De)};function j(Z,ve,Ee){Ee===null?Z.matrix.copy(ve.matrixWorld):(Z.matrix.copy(Ee.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ve.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ve.projectionMatrix),Z.projectionMatrixInverse.copy(ve.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Hs*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return C},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Z){l=Z,d!==null&&(d.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(C)},this.getCameraTexture=function(Z){return g[Z]};let te=null;function Te(Z,ve){if(h=ve.getViewerPose(c||a),p=ve,h!==null){const Ee=h.views;f!==null&&(e.setRenderTargetFramebuffer(_,f.framebuffer),e.setRenderTarget(_));let De=!1;Ee.length!==C.cameras.length&&(C.cameras.length=0,De=!0);for(let Oe=0;Oe<Ee.length;Oe++){const lt=Ee[Oe];let gt=null;if(f!==null)gt=f.getViewport(lt);else{const rn=u.getViewSubImage(d,lt);gt=rn.viewport,Oe===0&&(e.setRenderTargetTextures(_,rn.colorTexture,rn.depthStencilTexture),e.setRenderTarget(_))}let je=L[Oe];je===void 0&&(je=new vn,je.layers.enable(Oe),je.viewport=new mt,L[Oe]=je),je.matrix.fromArray(lt.transform.matrix),je.matrix.decompose(je.position,je.quaternion,je.scale),je.projectionMatrix.fromArray(lt.projectionMatrix),je.projectionMatrixInverse.copy(je.projectionMatrix).invert(),je.viewport.set(gt.x,gt.y,gt.width,gt.height),Oe===0&&(C.matrix.copy(je.matrix),C.matrix.decompose(C.position,C.quaternion,C.scale)),De===!0&&C.cameras.push(je)}const Me=i.enabledFeatures;if(Me&&Me.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&x){u=n.getBinding();const Oe=u.getDepthInformation(Ee[0]);Oe&&Oe.isValid&&Oe.texture&&m.init(Oe,i.renderState)}if(Me&&Me.includes("camera-access")&&x){e.state.unbindTexture(),u=n.getBinding();for(let Oe=0;Oe<Ee.length;Oe++){const lt=Ee[Oe].camera;if(lt){let gt=g[lt];gt||(gt=new cf,g[lt]=gt);const je=u.getCameraImage(lt);gt.sourceTexture=je}}}}for(let Ee=0;Ee<S.length;Ee++){const De=T[Ee],Me=S[Ee];De!==null&&Me!==void 0&&Me.update(De,ve,c||a)}te&&te(Z,ve),ve.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ve}),p=null}const Ve=new Ef;Ve.setAnimationLoop(Te),this.setAnimationLoop=function(Z){te=Z},this.dispose=function(){}}}const Ly=new ke,Uf=new He;Uf.set(-1,0,0,0,1,0,0,0,1);function Iy(s,e){function t(m,g){m.matrixAutoUpdate===!0&&m.updateMatrix(),g.value.copy(m.matrix)}function n(m,g){g.color.getRGB(m.fogColor.value,vf(s)),g.isFog?(m.fogNear.value=g.near,m.fogFar.value=g.far):g.isFogExp2&&(m.fogDensity.value=g.density)}function i(m,g,v,y,_){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?r(m,g):g.isMeshLambertMaterial?(r(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(r(m,g),u(m,g)):g.isMeshPhongMaterial?(r(m,g),h(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(r(m,g),d(m,g),g.isMeshPhysicalMaterial&&f(m,g,_)):g.isMeshMatcapMaterial?(r(m,g),p(m,g)):g.isMeshDepthMaterial?r(m,g):g.isMeshDistanceMaterial?(r(m,g),x(m,g)):g.isMeshNormalMaterial?r(m,g):g.isLineBasicMaterial?(a(m,g),g.isLineDashedMaterial&&o(m,g)):g.isPointsMaterial?l(m,g,v,y):g.isSpriteMaterial?c(m,g):g.isShadowMaterial?(m.color.value.copy(g.color),m.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(m,g){m.opacity.value=g.opacity,g.color&&m.diffuse.value.copy(g.color),g.emissive&&m.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(m.map.value=g.map,t(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.bumpMap&&(m.bumpMap.value=g.bumpMap,t(g.bumpMap,m.bumpMapTransform),m.bumpScale.value=g.bumpScale,g.side===Tn&&(m.bumpScale.value*=-1)),g.normalMap&&(m.normalMap.value=g.normalMap,t(g.normalMap,m.normalMapTransform),m.normalScale.value.copy(g.normalScale),g.side===Tn&&m.normalScale.value.negate()),g.displacementMap&&(m.displacementMap.value=g.displacementMap,t(g.displacementMap,m.displacementMapTransform),m.displacementScale.value=g.displacementScale,m.displacementBias.value=g.displacementBias),g.emissiveMap&&(m.emissiveMap.value=g.emissiveMap,t(g.emissiveMap,m.emissiveMapTransform)),g.specularMap&&(m.specularMap.value=g.specularMap,t(g.specularMap,m.specularMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest);const v=e.get(g),y=v.envMap,_=v.envMapRotation;y&&(m.envMap.value=y,m.envMapRotation.value.setFromMatrix4(Ly.makeRotationFromEuler(_)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Uf),m.reflectivity.value=g.reflectivity,m.ior.value=g.ior,m.refractionRatio.value=g.refractionRatio),g.lightMap&&(m.lightMap.value=g.lightMap,m.lightMapIntensity.value=g.lightMapIntensity,t(g.lightMap,m.lightMapTransform)),g.aoMap&&(m.aoMap.value=g.aoMap,m.aoMapIntensity.value=g.aoMapIntensity,t(g.aoMap,m.aoMapTransform))}function a(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,g.map&&(m.map.value=g.map,t(g.map,m.mapTransform))}function o(m,g){m.dashSize.value=g.dashSize,m.totalSize.value=g.dashSize+g.gapSize,m.scale.value=g.scale}function l(m,g,v,y){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.size.value=g.size*v,m.scale.value=y*.5,g.map&&(m.map.value=g.map,t(g.map,m.uvTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function c(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.rotation.value=g.rotation,g.map&&(m.map.value=g.map,t(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,t(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function h(m,g){m.specular.value.copy(g.specular),m.shininess.value=Math.max(g.shininess,1e-4)}function u(m,g){g.gradientMap&&(m.gradientMap.value=g.gradientMap)}function d(m,g){m.metalness.value=g.metalness,g.metalnessMap&&(m.metalnessMap.value=g.metalnessMap,t(g.metalnessMap,m.metalnessMapTransform)),m.roughness.value=g.roughness,g.roughnessMap&&(m.roughnessMap.value=g.roughnessMap,t(g.roughnessMap,m.roughnessMapTransform)),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)}function f(m,g,v){m.ior.value=g.ior,g.diffuseRoughness>0&&(m.diffuseRoughness.value=g.diffuseRoughness,g.diffuseRoughnessMap&&(m.diffuseRoughnessMap.value=g.diffuseRoughnessMap,t(g.diffuseRoughnessMap,m.diffuseRoughnessMapTransform))),g.sheen>0&&(m.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),m.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(m.sheenColorMap.value=g.sheenColorMap,t(g.sheenColorMap,m.sheenColorMapTransform)),g.sheenRoughnessMap&&(m.sheenRoughnessMap.value=g.sheenRoughnessMap,t(g.sheenRoughnessMap,m.sheenRoughnessMapTransform))),g.clearcoat>0&&(m.clearcoat.value=g.clearcoat,m.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(m.clearcoatMap.value=g.clearcoatMap,t(g.clearcoatMap,m.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,t(g.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(m.clearcoatNormalMap.value=g.clearcoatNormalMap,t(g.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===Tn&&m.clearcoatNormalScale.value.negate())),g.dispersion>0&&(m.dispersion.value=g.dispersion),g.retroreflectivity>0&&(m.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(m.iridescence.value=g.iridescence,m.iridescenceIOR.value=g.iridescenceIOR,m.iridescenceThicknessMinimum.value=g.iridescenceThicknessMinimum,m.iridescenceThicknessMaximum.value=g.iridescenceThicknessMaximum,g.iridescenceMap&&(m.iridescenceMap.value=g.iridescenceMap,t(g.iridescenceMap,m.iridescenceMapTransform)),g.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=g.iridescenceThicknessMap,t(g.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),g.transmission>0&&(m.transmission.value=g.transmission,m.transmissionSamplerMap.value=v.texture,m.transmissionSamplerSize.value.set(v.width,v.height),g.transmissionMap&&(m.transmissionMap.value=g.transmissionMap,t(g.transmissionMap,m.transmissionMapTransform)),m.thickness.value=g.thickness,g.thicknessMap&&(m.thicknessMap.value=g.thicknessMap,t(g.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=g.attenuationDistance,m.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(m.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(m.anisotropyMap.value=g.anisotropyMap,t(g.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=g.specularIntensity,m.specularColor.value.copy(g.specularColor),g.specularColorMap&&(m.specularColorMap.value=g.specularColorMap,t(g.specularColorMap,m.specularColorMapTransform)),g.specularIntensityMap&&(m.specularIntensityMap.value=g.specularIntensityMap,t(g.specularIntensityMap,m.specularIntensityMapTransform))}function p(m,g){g.matcap&&(m.matcap.value=g.matcap)}function x(m,g){const v=e.get(g).light;m.referencePosition.value.setFromMatrixPosition(v.matrixWorld),m.nearDistance.value=v.shadow.camera.near,m.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Ny(s,e,t,n){let i={},r={};function a(v,y){const _=y.program;n.uniformBlockBinding(v,_,i[v.id])}function o(v,y){let _=i[v.id];_===void 0&&(p(v),_=l(v),i[v.id]=_,v.addEventListener("dispose",m));const S=y.program;n.updateUBOMapping(v,S);const T=e.render.frame;r[v.id]!==T&&(c(v),r[v.id]=T)}function l(v){const y=s.createBuffer(),_=v.__size,S=v.usage;return s.bindBuffer(s.UNIFORM_BUFFER,y),s.bufferData(s.UNIFORM_BUFFER,_,S),s.bindBuffer(s.UNIFORM_BUFFER,null),y}function c(v){const y=i[v.id],_=v.uniforms,S=v.__cache;s.bindBuffer(s.UNIFORM_BUFFER,y);for(let T=0,M=_.length;T<M;T++){const b=_[T];if(Array.isArray(b))for(let I=0,R=b.length;I<R;I++)h(b[I],T,I,S);else h(b,T,0,S)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function h(v,y,_,S){if(d(v,y,_,S)===!0){const T=v.__offset,M=v.value;if(Array.isArray(M)){let b=0;for(let I=0;I<M.length;I++){const R=M[I],D=x(R,!0);u(R,v.__data,b),b+=D.storage/Float32Array.BYTES_PER_ELEMENT}}else u(M,v.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,T,v.__data)}}function u(v,y,_){typeof v=="number"||typeof v=="boolean"?y[_]=v:v.isMatrix3?(y[_]=v.elements[0],y[_+1]=v.elements[1],y[_+2]=v.elements[2],y[_+3]=0,y[_+4]=v.elements[3],y[_+5]=v.elements[4],y[_+6]=v.elements[5],y[_+7]=0,y[_+8]=v.elements[6],y[_+9]=v.elements[7],y[_+10]=v.elements[8],y[_+11]=0):ArrayBuffer.isView(v)?y.set(v.subarray(0,y.length-_),_):v.toArray(y,_)}function d(v,y,_,S){const T=v.value,M=y+"_"+_;if(Array.isArray(T)){S[M]===void 0&&(S[M]=[]);const b=S[M];let I=!1;for(let R=0;R<T.length;R++)f(T[R],b,R)===!0&&(I=!0);return I}return f(T,S,M)}function f(v,y,_){if(y[_]===void 0)return typeof v=="number"||typeof v=="boolean"?y[_]=v:ArrayBuffer.isView(v)?y[_]=v.slice():y[_]=v.clone(),!0;{const S=y[_];if(typeof v=="number"||typeof v=="boolean"){if(S!==v)return y[_]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(S.equals(v)===!1)return S.copy(v),!0}}return!1}function p(v){const y=v.uniforms;let _=0;const S=16;for(let M=0,b=y.length;M<b;M++){const I=Array.isArray(y[M])?y[M]:[y[M]];for(let R=0,D=I.length;R<D;R++){const L=I[R],C=Array.isArray(L.value)?L.value:[L.value],A=Array.isArray(y[M])||Array.isArray(L.value);let U=_;for(let B=0,K=C.length;B<K;B++){const X=C[B],j=x(X,A),te=_%S,Te=te%j.boundary,Ve=te+Te;_+=Te,Ve!==0&&S-Ve<j.storage&&(_+=S-Ve),B===0&&(U=_),_+=j.storage}const z=L.type==="int"?Int32Array:L.type==="uint"?Uint32Array:Float32Array;L.__data=new z((_-U)/Float32Array.BYTES_PER_ELEMENT),L.__offset=U}}const T=_%S;return T>0&&(_+=S-T),v.__size=_,v.__cache={},this}function x(v,y){const _={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(_.boundary=4,_.storage=4):v.isVector2?(_.boundary=8,_.storage=8):v.isVector3||v.isColor?(_.boundary=16,_.storage=12):v.isVector4?(_.boundary=16,_.storage=16):v.isMatrix3?(_.boundary=16,_.storage=48):v.isMatrix4?(_.boundary=16,_.storage=64):v.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(_.boundary=16,_.storage=v.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",v),y===!0&&(_.boundary=16,_.storage=Math.ceil(_.storage/16)*16),_}function m(v){const y=v.target;y.removeEventListener("dispose",m),s.deleteBuffer(i[y.id]),delete i[y.id],delete r[y.id]}function g(){for(const v in i)s.deleteBuffer(i[v]);i={},r={}}return{bind:a,update:o,dispose:g}}const Dy=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let ai=null;function Uy(){return ai===null&&(ai=new Pc(Dy,16,16,fs,pi),ai.name="DFG_LUT",ai.minFilter=ln,ai.magFilter=ln,ai.wrapS=hi,ai.wrapT=hi,ai.generateMipmaps=!1,ai.needsUpdate=!0),ai}class Fy{constructor(e={}){const{canvas:t=Pm(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Pn}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;const x=f,m=new Set([bc,Sc,yc]),g=new Set([Pn,fi,Ir,Gs,_c,vc]),v=new Uint32Array(4),y=new Int32Array(4),_={textures:[],min:[],max:[],resolution:[]};let S=null,T=null;const M=[],b=[];let I=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ri,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const R=this;let D=!1,L=null,C=null,A=null,U=null;this._outputColorSpace=Dt;let z=0,B=0,K=null,X=-1,j=null;const te=new mt,Te=new mt;let Ve=null;const Z=new le(0);let ve=0,Ee=t.width,De=t.height,Me=1,Xe=null,Ut=null;const Oe=new mt(0,0,Ee,De),lt=new mt(0,0,Ee,De);let gt=!1;const je=new kr,rn=new Ic;let Gt=!1,yn=!1;const At=new ke,si=new F,jt=new mt,Un={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Fn=!1;function On(){return K===null?Me:1}let G=n;function kn(w,k){return t.getContext(w,k)}let bt,Tt,ge,Ht,Ue,Ge,P,E,V,re,ee,ce,pe,$,J,ue,O,Q,Y,de,oe,he,Pe;try{const w={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${pc}`),t.addEventListener("webglcontextlost",Ie,!1),t.addEventListener("webglcontextrestored",qe,!1),t.addEventListener("webglcontextcreationerror",xe,!1),G===null){const k="webgl2";if(G=kn(k,w),G===null)throw kn(k)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ke()}catch(w){throw t.removeEventListener("webglcontextlost",Ie,!1),t.removeEventListener("webglcontextrestored",qe,!1),t.removeEventListener("webglcontextcreationerror",xe,!1),Be("WebGLRenderer: "+w.message),w}function Ke(){bt=new zv(G),bt.init(),oe=new wy(G,bt),Tt=new Rv(G,bt,e,oe),ge=new Ty(G,bt),Tt.reversedDepthBuffer&&d&&ge.buffers.depth.setReversed(!0),C=G.createFramebuffer(),A=G.createFramebuffer(),U=G.createFramebuffer(),Ht=new Hv(G),Ue=new hy,Ge=new Ey(G,bt,ge,Ue,Tt,oe,Ht),P=new kv(R),E=new Wg(G),he=new wv(G,E),V=new Bv(G,E,Ht,he),re=new Wv(G,V,E,he,Ht),Q=new Vv(G,Tt,Ge),J=new Cv(Ue),ee=new cy(R,P,bt,Tt,he,J),ce=new Iy(R,Ue),pe=new dy,$=new _y(bt),O=new Ev(R,P,ge,re,p,l),ue=new by(R,re,Tt),Pe=new Ny(G,Ht,Tt,ge),Y=new Av(G,bt,Ht),de=new Gv(G,bt,Ht),Ht.programs=ee.programs,R.capabilities=Tt,R.extensions=bt,R.properties=Ue,R.renderLists=pe,R.shadowMap=ue,R.state=ge,R.info=Ht}x!==Pn&&(I=new qv(x,t.width,t.height,o,i,r));const ae=new Py(R,G);this.xr=ae,this.getContext=function(){return G},this.getContextAttributes=function(){return G.getContextAttributes()},this.forceContextLoss=function(){const w=bt.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=bt.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return Me},this.setPixelRatio=function(w){w!==void 0&&(Me=w,this.setSize(Ee,De,!1))},this.getSize=function(w){return w.set(Ee,De)},this.setSize=function(w,k,q=!0){if(ae.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}Ee=w,De=k,t.width=Math.floor(w*Me),t.height=Math.floor(k*Me),q===!0&&(t.style.width=w+"px",t.style.height=k+"px"),I!==null&&I.setSize(t.width,t.height),this.setViewport(0,0,w,k)},this.getDrawingBufferSize=function(w){return w.set(Ee*Me,De*Me).floor()},this.setDrawingBufferSize=function(w,k,q){Ee=w,De=k,Me=q,t.width=Math.floor(w*q),t.height=Math.floor(k*q),this.setViewport(0,0,w,k)},this.setEffects=function(w){if(x===Pn){Be("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(w){for(let k=0;k<w.length;k++)if(w[k].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}I.setEffects(w||[])},this.getCurrentViewport=function(w){return w.copy(te)},this.getViewport=function(w){return w.copy(Oe)},this.setViewport=function(w,k,q,H){w.isVector4?Oe.set(w.x,w.y,w.z,w.w):Oe.set(w,k,q,H),ge.viewport(te.copy(Oe).multiplyScalar(On()).round())},this.getScissor=function(w){return w.copy(lt)},this.setScissor=function(w,k,q,H){w.isVector4?lt.set(w.x,w.y,w.z,w.w):lt.set(w,k,q,H),ge.scissor(Te.copy(lt).multiplyScalar(On()).round())},this.getScissorTest=function(){return gt},this.setScissorTest=function(w){ge.setScissorTest(gt=w)},this.setOpaqueSort=function(w){Xe=w},this.setTransparentSort=function(w){Ut=w},this.getClearColor=function(w){return w.copy(O.getClearColor())},this.setClearColor=function(){O.setClearColor(...arguments)},this.getClearAlpha=function(){return O.getClearAlpha()},this.setClearAlpha=function(){O.setClearAlpha(...arguments)},this.clear=function(w=!0,k=!0,q=!0){let H=0;if(w){let W=!1;if(K!==null){const me=K.texture.format;W=m.has(me)}if(W){const me=K.texture.type,be=g.has(me),fe=O.getClearColor(),ye=O.getClearAlpha(),Re=fe.r,We=fe.g,et=fe.b;be?(v[0]=Re,v[1]=We,v[2]=et,v[3]=ye,G.clearBufferuiv(G.COLOR,0,v)):(y[0]=Re,y[1]=We,y[2]=et,y[3]=ye,G.clearBufferiv(G.COLOR,0,y))}else H|=G.COLOR_BUFFER_BIT}k&&(H|=G.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),q&&(H|=G.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H!==0&&G.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(w){w.setRenderer(this),L=w},this.dispose=function(){t.removeEventListener("webglcontextlost",Ie,!1),t.removeEventListener("webglcontextrestored",qe,!1),t.removeEventListener("webglcontextcreationerror",xe,!1),O.dispose(),pe.dispose(),$.dispose(),Ge.dispose(),Ue.dispose(),P.dispose(),re.dispose(),V.dispose(),he.dispose(),Pe.dispose(),ee.dispose(),ae.dispose(),ae.removeEventListener("sessionstart",sh),ae.removeEventListener("sessionend",rh),Qi.stop()};function Ie(w){w.preventDefault(),Za("WebGLRenderer: Context Lost."),D=!0}function qe(){Za("WebGLRenderer: Context Restored."),D=!1;const w=Ht.autoReset,k=ue.enabled,q=ue.autoUpdate,H=ue.needsUpdate,W=ue.type;Ke(),Ht.autoReset=w,ue.enabled=k,ue.autoUpdate=q,ue.needsUpdate=H,ue.type=W}function xe(w){Be("WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function ct(w){const k=w.target;k.removeEventListener("dispose",ct),en(k)}function en(w){Ii(w),Ue.remove(w)}function Ii(w){const k=Ue.get(w).programs;k!==void 0&&(k.forEach(function(q){ee.releaseProgram(q)}),w.isShaderMaterial&&ee.releaseShaderCache(w))}this.renderBufferDirect=function(w,k,q,H,W,me){k===null&&(k=Un);const be=W.isMesh&&W.matrixWorld.determinantAffine()<0,fe=pp(w,k,q,H,W);ge.setMaterial(H,be);let ye=q.index,Re=1;if(H.wireframe===!0){if(ye=V.getWireframeAttribute(q),ye===void 0)return;Re=2}const We=q.drawRange,et=q.attributes.position;let we=We.start*Re,tt=(We.start+We.count)*Re;me!==null&&(we=Math.max(we,me.start*Re),tt=Math.min(tt,(me.start+me.count)*Re)),ye!==null?(we=Math.max(we,0),tt=Math.min(tt,ye.count)):et!=null&&(we=Math.max(we,0),tt=Math.min(tt,et.count));const Ft=tt-we;if(Ft<0||Ft===1/0)return;he.setup(W,H,fe,q,ye);let Mt,xt=Y;if(ye!==null&&(Mt=E.get(ye),xt=de,xt.setIndex(Mt)),W.isMesh)H.wireframe===!0?(ge.setLineWidth(H.wireframeLinewidth*On()),xt.setMode(G.LINES)):xt.setMode(G.TRIANGLES);else if(W.isLine){let hn=H.linewidth;hn===void 0&&(hn=1),ge.setLineWidth(hn*On()),W.isLineSegments?xt.setMode(G.LINES):W.isLineLoop?xt.setMode(G.LINE_LOOP):xt.setMode(G.LINE_STRIP)}else W.isPoints?xt.setMode(G.POINTS):W.isSprite&&xt.setMode(G.TRIANGLES);if(W.isBatchedMesh)if(bt.get("WEBGL_multi_draw"))xt.renderMultiDraw(W._multiDrawStarts,W._multiDrawCounts,W._multiDrawCount);else{const hn=W._multiDrawStarts,Ae=W._multiDrawCounts,mn=W._multiDrawCount,rt=ye?E.get(ye).bytesPerElement:1,ji=Ue.get(H).currentProgram.getUniforms();for(let un=0;un<mn;un++)ji.setValue(G,"_gl_DrawID",un),xt.render(hn[un]/rt,Ae[un])}else if(W.isInstancedMesh)xt.renderInstances(we,Ft,W.count);else if(q.isInstancedBufferGeometry){const hn=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Ae=Math.min(q.instanceCount,hn);xt.renderInstances(we,Ft,Ae)}else xt.render(we,Ft)};function ih(w,k,q,H){L!==null&&w.isNodeMaterial&&L.setObject(H,w),Gt===!0&&J.setState(w,q,!1),w.transparent===!0&&w.side===pn&&w.forceSinglePass===!1?(w.side=Tn,w.needsUpdate=!0,Qs(w,k,H),w.side=$i,w.needsUpdate=!0,Qs(w,k,H),w.side=pn):Qs(w,k,H)}this.compile=function(w,k,q=null){q===null&&(q=w),L!==null&&L.renderStart(w,k,q),T=$.get(q),T.init(k),b.push(T),q.traverseVisible(function(W){W.isLight&&W.layers.test(k.layers)&&(T.pushLight(W),W.castShadow&&T.pushShadow(W))}),w!==q&&w.traverseVisible(function(W){W.isLight&&W.layers.test(k.layers)&&(T.pushLight(W),W.castShadow&&T.pushShadow(W))}),T.setupLights(),L!==null&&L.updateLights(T.state.lightsArray),yn=this.localClippingEnabled,Gt=J.init(this.clippingPlanes,yn),Gt===!0&&J.setGlobalState(this.clippingPlanes,k),L!==null&&ue.render(T.state.shadowsArray,q,k);const H=new Set;return w.traverse(function(W){if(!(W.isMesh||W.isPoints||W.isLine||W.isSprite))return;const me=W.material;if(me)if(Array.isArray(me))for(let be=0;be<me.length;be++){const fe=me[be];ih(fe,q,k,W),H.add(fe)}else ih(me,q,k,W),H.add(me)}),T=b.pop(),L!==null&&L.renderEnd(),H},this.compileAsync=function(w,k,q=null){const H=this.compile(w,k,q);return new Promise(W=>{function me(){if(H.forEach(function(be){const ye=Ue.get(be).currentProgram;(ye===void 0||ye.isReady())&&H.delete(be)}),H.size===0){W(w);return}setTimeout(me,10)}bt.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let _o=null;function dp(w){_o&&_o(w)}function sh(){Qi.stop()}function rh(){Qi.start()}const Qi=new Ef;Qi.setAnimationLoop(dp),typeof self<"u"&&Qi.setContext(self),this.setAnimationLoop=function(w){_o=w,ae.setAnimationLoop(w),w===null?Qi.stop():Qi.start()},ae.addEventListener("sessionstart",sh),ae.addEventListener("sessionend",rh),this.render=function(w,k){if(k!==void 0&&k.isCamera!==!0){Be("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;L!==null&&L.renderStart(w,k);const q=ae.enabled===!0&&ae.isPresenting===!0,H=I!==null&&(K===null||q)&&I.begin(R,K);if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),ae.enabled===!0&&ae.isPresenting===!0&&(I===null||I.isCompositing()===!1)&&(ae.cameraAutoUpdate===!0&&ae.updateCamera(k),k=ae.getCamera()),w.isScene===!0&&w.onBeforeRender(R,w,k,K),T=$.get(w,b.length),T.init(k),T.state.textureUnits=Ge.getTextureUnits(),b.push(T),At.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),k.isArrayCamera?rn.setFromArrayCamera(k):je.setFromProjectionMatrix(At,Qn,k.reversedDepth),yn=this.localClippingEnabled,Gt=J.init(this.clippingPlanes,yn),S=pe.get(w,M.length),S.init(),M.push(S),this.info.render.frame++,ae.enabled===!0&&ae.isPresenting===!0){const be=R.xr.getDepthSensingMesh();be!==null&&vo(be,k,-1/0,R.sortObjects)}vo(w,k,0,R.sortObjects),S.finish(),L!==null&&L.updateLights(T.state.lightsArray),R.sortObjects===!0&&S.sort(Xe,Ut),Fn=ae.enabled===!1||ae.isPresenting===!1||ae.hasDepthSensing()===!1,Fn&&O.addToRenderList(S,w),this.info.autoReset===!0&&this.info.reset(),Gt===!0&&J.beginShadows();const W=T.state.shadowsArray;if(ue.render(W,w,k),Gt===!0&&J.endShadows(),(H&&I.hasRenderPass())===!1){const be=S.opaque,fe=S.transmissive;if(T.setupLights(),k.isArrayCamera){const ye=k.cameras;if(fe.length>0)for(let Re=0,We=ye.length;Re<We;Re++){const et=ye[Re];oh(be,fe,w,et)}Fn&&O.render(w);for(let Re=0,We=ye.length;Re<We;Re++){const et=ye[Re];ah(S,w,et,et.viewport)}}else fe.length>0&&oh(be,fe,w,k),Fn&&O.render(w),ah(S,w,k)}K!==null&&B===0&&(Ge.updateMultisampleRenderTarget(K),Ge.updateRenderTargetMipmap(K)),H&&I.end(R),w.isScene===!0&&w.onAfterRender(R,w,k),he.resetDefaultState(),X=-1,j=null,b.pop(),b.length>0?(T=b[b.length-1],Ge.setTextureUnits(T.state.textureUnits),Gt===!0&&J.setGlobalState(R.clippingPlanes,T.state.camera)):T=null,M.pop(),M.length>0?S=M[M.length-1]:S=null,L!==null&&L.renderEnd()};function vo(w,k,q,H){if(w.visible===!1)return;if(w.layers.test(k.layers)){if(w.isGroup)q=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(k);else if(w.isLight)T.pushLight(w),w.castShadow&&T.pushShadow(w);else if(w.isSprite){const be=k.isArrayCamera?rn:je;if(!w.frustumCulled||w.intersectsFrustum(be)){H&&jt.setFromMatrixPosition(w.matrixWorld).applyMatrix4(At);const fe=re.update(w),ye=w.material;ye.visible&&S.push(w,fe,ye,q,jt.z,null,k)}}else if(w.isMesh||w.isLine||w.isPoints){const be=k.isArrayCamera?rn:je;if(!w.frustumCulled||w.intersectsFrustum(be)){const fe=re.update(w),ye=w.material;if(H&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),jt.copy(w.boundingSphere.center)):(fe.boundingSphere===null&&fe.computeBoundingSphere(),jt.copy(fe.boundingSphere.center)),jt.applyMatrix4(w.matrixWorld).applyMatrix4(At)),Array.isArray(ye)){const Re=fe.groups;for(let We=0,et=Re.length;We<et;We++){const we=Re[We],tt=ye[we.materialIndex];tt&&tt.visible&&S.push(w,fe,tt,q,jt.z,we,k)}}else ye.visible&&S.push(w,fe,ye,q,jt.z,null,k)}}}const me=w.children;for(let be=0,fe=me.length;be<fe;be++)vo(me[be],k,q,H)}function ah(w,k,q,H){const{opaque:W,transmissive:me,transparent:be}=w;T.setupLightsView(q),Gt===!0&&J.setGlobalState(R.clippingPlanes,q),H&&ge.viewport(te.copy(H)),W.length>0&&ta(W,k,q),me.length>0&&ta(me,k,q),be.length>0&&ta(be,k,q),ge.buffers.depth.setTest(!0),ge.buffers.depth.setMask(!0),ge.buffers.color.setMask(!0),ge.setPolygonOffset(!1)}function oh(w,k,q,H){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;if(T.state.transmissionRenderTarget[H.id]===void 0){const we=bt.has("EXT_color_buffer_half_float")||bt.has("EXT_color_buffer_float");T.state.transmissionRenderTarget[H.id]=new di(1,1,{generateMipmaps:!0,type:we?pi:Pn,minFilter:Jn,samples:Math.max(4,Tt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Qe.workingColorSpace})}const me=T.state.transmissionRenderTarget[H.id],be=H.viewport||te;me.setSize(be.z*R.transmissionResolutionScale,be.w*R.transmissionResolutionScale);const fe=R.getRenderTarget(),ye=R.getActiveCubeFace(),Re=R.getActiveMipmapLevel();R.setRenderTarget(me),R.getClearColor(Z),ve=R.getClearAlpha(),ve<1&&R.setClearColor(16777215,.5),R.clear(),Fn&&O.render(q);const We=R.toneMapping;R.toneMapping=Ri;const et=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),T.setupLightsView(H),Gt===!0&&J.setGlobalState(R.clippingPlanes,H),ta(w,q,H),Ge.updateMultisampleRenderTarget(me),Ge.updateRenderTargetMipmap(me),bt.has("WEBGL_multisampled_render_to_texture")===!1){let we=!1;for(let tt=0,Ft=k.length;tt<Ft;tt++){const Mt=k[tt],{object:xt,geometry:hn,material:Ae,group:mn}=Mt;if(Ae.side===pn&&xt.layers.test(H.layers)){const rt=Ae.side;Ae.side=Tn,Ae.needsUpdate=!0,lh(xt,q,H,hn,Ae,mn),Ae.side=rt,Ae.needsUpdate=!0,we=!0}}we===!0&&(Ge.updateMultisampleRenderTarget(me),Ge.updateRenderTargetMipmap(me))}R.setRenderTarget(fe,ye,Re),R.setClearColor(Z,ve),et!==void 0&&(H.viewport=et),R.toneMapping=We}function ta(w,k,q){const H=k.isScene===!0?k.overrideMaterial:null;for(let W=0,me=w.length;W<me;W++){const be=w[W],{object:fe,geometry:ye,group:Re}=be;let We=be.material;We.allowOverride===!0&&H!==null&&(We=H),fe.layers.test(q.layers)&&lh(fe,k,q,ye,We,Re)}}function lh(w,k,q,H,W,me){L!==null&&W.isNodeMaterial&&L.setObject(w,W),w.onBeforeRender(R,k,q,H,W,me),w.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),W.onBeforeRender(R,k,q,H,w,me),W.transparent===!0&&W.side===pn&&W.forceSinglePass===!1?(W.side=Tn,W.needsUpdate=!0,R.renderBufferDirect(q,k,H,W,w,me),W.side=$i,W.needsUpdate=!0,R.renderBufferDirect(q,k,H,W,w,me),W.side=pn):R.renderBufferDirect(q,k,H,W,w,me),w.onAfterRender(R,k,q,H,W,me)}function ch(w){let k=0;for(const q of w)q.texture!==null&&k++;return k}function Qs(w,k,q){k.isScene!==!0&&(k=Un);const H=Ue.get(w),W=T.state.lights,me=T.state.shadowsArray,be=W.state.version,fe=ee.getParameters(w,W.state,me,k,q,T.state.lightProbeGridArray),ye=ee.getProgramCacheKey(fe);let Re=H.programs;H.environment=w.isMeshStandardMaterial||w.isMeshLambertMaterial||w.isMeshPhongMaterial?k.environment:null,H.fog=k.fog;const We=w.isMeshStandardMaterial||w.isMeshLambertMaterial&&!w.envMap||w.isMeshPhongMaterial&&!w.envMap;H.envMap=P.get(w.envMap||H.environment,We),H.envMapRotation=H.environment!==null&&w.envMap===null?k.environmentRotation:w.envMapRotation,Re===void 0&&(w.addEventListener("dispose",ct),Re=new Map,H.programs=Re,H.programVariants=new Map);let et=Re.get(ye);if(et!==void 0){if(H.currentProgram===et&&H.lightsStateVersion===be)return uh(w,fe),et}else fe.uniforms=ee.getUniforms(w),L!==null&&w.isNodeMaterial&&L.build(w,q,fe),w.onBeforeCompile(fe,R),et=ee.acquireProgram(fe,ye),Re.set(ye,et),H.uniforms=fe.uniforms;const we=H.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(we.clippingPlanes=J.uniform),uh(w,fe),H.needsLights=gp(w),H.lightsStateVersion=be,H.needsLights&&(we.ambientLightColor.value=W.state.ambient,we.lightProbe.value=W.state.probe,we.sunLights.value=W.state.sun,we.sunLightShadows.value=W.state.sunShadow,we.directionalLights.value=W.state.directional,we.directionalLightShadows.value=W.state.directionalShadow,we.spotLights.value=W.state.spot,we.spotLightShadows.value=W.state.spotShadow,we.rectAreaLights.value=W.state.rectArea,we.ltc_1.value=W.state.rectAreaLTC1,we.ltc_2.value=W.state.rectAreaLTC2,we.pointLights.value=W.state.point,we.pointLightShadows.value=W.state.pointShadow,we.hemisphereLights.value=W.state.hemi,we.sunShadowMatrix.value=W.state.sunShadowMatrix,we.sunShadowCascade.value=W.state.sunShadowCascade,we.directionalShadowMatrix.value=W.state.directionalShadowMatrix,we.spotLightMatrix.value=W.state.spotLightMatrix,we.spotLightMap.value=W.state.spotLightMap,we.pointShadowMatrix.value=W.state.pointShadowMatrix),H.numLightProbeGrids=ch(T.state.lightProbeGridArray),H.currentProgram=et,H.uniformsList=null,et}function fp(w,k,q,H,W){const me=Ue.get(w),be=me.currentProgram.id+","+H+","+W;let fe=me.programVariants.get(be);return fe===void 0?(fe=Qs(w,k,q),me.programVariants.set(be,fe)):(me.currentProgram=fe,me.uniformsList=null,me.outputColorSpace=H,me.toneMapping=W),fe}function hh(w){if(w.uniformsList===null){const k=w.currentProgram.getUniforms();w.uniformsList=Ba.seqWithValue(k.seq,w.uniforms)}return w.uniformsList}function uh(w,k){const q=Ue.get(w);q.outputColorSpace=k.outputColorSpace,q.batching=k.batching,q.batchingColor=k.batchingColor,q.instancing=k.instancing,q.instancingColor=k.instancingColor,q.instancingMorph=k.instancingMorph,q.skinning=k.skinning,q.morphTargets=k.morphTargets,q.morphNormals=k.morphNormals,q.morphColors=k.morphColors,q.morphTargetsCount=k.morphTargetsCount,q.numClippingPlanes=k.numClippingPlanes,q.numIntersection=k.numClipIntersection,q.vertexAlphas=k.vertexAlphas,q.vertexTangents=k.vertexTangents,q.toneMapping=k.toneMapping}function pp(w,k,q,H,W){k.isScene!==!0&&(k=Un),Ge.resetTextureUnits();const me=k.fog,be=H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial?k.environment:null,fe=K===null?R.outputColorSpace:K.isXRRenderTarget===!0?K.texture.colorSpace:Qe.workingColorSpace,ye=H.isMeshStandardMaterial||H.isMeshLambertMaterial&&!H.envMap||H.isMeshPhongMaterial&&!H.envMap,Re=P.get(H.envMap||be,ye),We=H.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,et=!!q.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),we=!!q.morphAttributes.position,tt=!!q.morphAttributes.normal,Ft=!!q.morphAttributes.color;let Mt=Ri;H.toneMapped&&(K===null||K.isXRRenderTarget===!0)&&(Mt=R.toneMapping);const xt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,hn=xt!==void 0?xt.length:0,Ae=Ue.get(H),mn=T.state.lights;if(Gt===!0&&(yn===!0||w!==j)){const Rt=w===j&&H.id===X;J.setState(H,w,Rt)}let rt=!1,ji=!1;H.version===Ae.__version?Ae.needsLights&&Ae.lightsStateVersion!==mn.state.version||W.isBatchedMesh&&Ae.batching===!1||!W.isBatchedMesh&&Ae.batching===!0||W.isBatchedMesh&&Ae.batchingColor===!0&&W._colorsTexture===null||W.isBatchedMesh&&Ae.batchingColor===!1&&W._colorsTexture!==null||W.isInstancedMesh&&Ae.instancing===!1||!W.isInstancedMesh&&Ae.instancing===!0||W.isSkinnedMesh&&Ae.skinning===!1||!W.isSkinnedMesh&&Ae.skinning===!0||W.isInstancedMesh&&Ae.instancingColor===!0&&W.instanceColor===null||W.isInstancedMesh&&Ae.instancingColor===!1&&W.instanceColor!==null||W.isInstancedMesh&&Ae.instancingMorph===!0&&W.morphTexture===null||W.isInstancedMesh&&Ae.instancingMorph===!1&&W.morphTexture!==null||Ae.envMap!==Re||H.fog===!0&&Ae.fog!==me||Ae.numClippingPlanes!==void 0&&(Ae.numClippingPlanes!==J.numPlanes||Ae.numIntersection!==J.numIntersection)||Ae.vertexAlphas!==We||Ae.vertexTangents!==et||Ae.morphTargets!==we||Ae.morphNormals!==tt||Ae.morphColors!==Ft||Ae.morphTargetsCount!==hn||Ae.numLightProbeGrids!==ch(T.state.lightProbeGridArray)?rt=!0:(Ae.outputColorSpace!==fe||Ae.toneMapping!==Mt)&&(ji=!0):(rt=!0,Ae.__version=H.version);let un=Ae.currentProgram;(rt===!0||ji===!0)&&(un=ji===!0?fp(H,k,W,fe,Mt):Qs(H,k,W),L&&H.isNodeMaterial&&L.onUpdateProgram(H,un,Ae));let na=!1,Ni=!1,es=!1;const nt=un.getUniforms(),an=Ae.uniforms;if(ge.useProgram(un.program)&&(na=!0,Ni=!0,es=!0),H.id!==X&&(X=H.id,Ni=!0),na||j!==w){ge.buffers.depth.getReversed()&&w.reversedDepth!==!0&&(w._reversedDepth=!0,w.updateProjectionMatrix()),nt.setValue(G,"projectionMatrix",w.projectionMatrix),nt.setValue(G,"viewMatrix",w.matrixWorldInverse);const tn=nt.map.cameraPosition;tn!==void 0&&tn.setValue(G,si.setFromMatrixPosition(w.matrixWorld)),Tt.logarithmicDepthBuffer&&nt.setValue(G,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&nt.setValue(G,"isOrthographic",w.isOrthographicCamera===!0),j!==w&&(j=w,Ni=!0,es=!0)}if(Ae.needsLights&&(mn.state.sunShadowMap.length>0&&nt.setValue(G,"sunShadowMap",mn.state.sunShadowMap,Ge),mn.state.directionalShadowMap.length>0&&nt.setValue(G,"directionalShadowMap",mn.state.directionalShadowMap,Ge),mn.state.spotShadowMap.length>0&&nt.setValue(G,"spotShadowMap",mn.state.spotShadowMap,Ge),mn.state.pointShadowMap.length>0&&nt.setValue(G,"pointShadowMap",mn.state.pointShadowMap,Ge)),W.isSkinnedMesh){nt.setOptional(G,W,"bindMatrix"),nt.setOptional(G,W,"bindMatrixInverse");const Rt=W.skeleton;Rt&&(Rt.boneTexture===null&&Rt.computeBoneTexture(),nt.setValue(G,"boneTexture",Rt.boneTexture,Ge))}W.isBatchedMesh&&(nt.setOptional(G,W,"batchingTexture"),nt.setValue(G,"batchingTexture",W._matricesTexture,Ge),nt.setOptional(G,W,"batchingIdTexture"),nt.setValue(G,"batchingIdTexture",W._indirectTexture,Ge),nt.setOptional(G,W,"batchingColorTexture"),W._colorsTexture!==null&&nt.setValue(G,"batchingColorTexture",W._colorsTexture,Ge));const Hn=q.morphAttributes;if((Hn.position!==void 0||Hn.normal!==void 0||Hn.color!==void 0)&&Q.update(W,q,un),(Ni||Ae.receiveShadow!==W.receiveShadow)&&(Ae.receiveShadow=W.receiveShadow,nt.setValue(G,"receiveShadow",W.receiveShadow)),(H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial)&&H.envMap===null&&k.environment!==null&&(an.envMapIntensity.value=k.environmentIntensity),an.dfgLUT!==void 0&&(an.dfgLUT.value=Uy()),Ni){if(nt.setValue(G,"toneMappingExposure",R.toneMappingExposure),Ae.needsLights&&mp(an,es),me&&H.fog===!0&&ce.refreshFogUniforms(an,me),ce.refreshMaterialUniforms(an,H,Me,De,T.state.transmissionRenderTarget[w.id]),Ae.needsLights&&Ae.numLightProbeGrids>0){const Rt=_;let tn=0;for(const xi of T.state.lightProbeGridArray)xi.texture!==null&&(Rt.textures[tn]=xi.texture,Rt.min[tn]=xi.boundingBox.min,Rt.max[tn]=xi.boundingBox.max,Rt.resolution[tn]=xi.resolution,tn++);for(const xi in Rt)Rt[xi].length=tn;an.probesSH.value=Rt.textures,an.probesMin.value=Rt.min,an.probesMax.value=Rt.max,an.probesResolution.value=Rt.resolution}Ba.upload(G,hh(Ae),an,Ge)}if(H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(Ba.upload(G,hh(Ae),an,Ge),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&nt.setValue(G,"center",W.center),nt.setValue(G,"modelViewMatrix",W.modelViewMatrix),nt.setValue(G,"normalMatrix",W.normalMatrix),nt.setValue(G,"modelMatrix",W.matrixWorld),H.uniformsGroups!==void 0){const Rt=H.uniformsGroups;for(let tn=0,xi=Rt.length;tn<xi;tn++){const fh=Rt[tn];Pe.update(fh,un),Pe.bind(fh,un)}}return un}function mp(w,k){w.ambientLightColor.needsUpdate=k,w.lightProbe.needsUpdate=k,w.sunLights.needsUpdate=k,w.sunLightShadows.needsUpdate=k,w.directionalLights.needsUpdate=k,w.directionalLightShadows.needsUpdate=k,w.pointLights.needsUpdate=k,w.pointLightShadows.needsUpdate=k,w.spotLights.needsUpdate=k,w.spotLightShadows.needsUpdate=k,w.rectAreaLights.needsUpdate=k,w.hemisphereLights.needsUpdate=k}function gp(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return z},this.getActiveMipmapLevel=function(){return B},this.getRenderTarget=function(){return K},this.setRenderTargetTextures=function(w,k,q){const H=Ue.get(w);H.__autoAllocateDepthBuffer=w.resolveDepthBuffer===!1,H.__autoAllocateDepthBuffer===!1&&(H.__useRenderToTexture=!1),Ue.get(w.texture).__webglTexture=k,Ue.get(w.depthTexture).__webglTexture=H.__autoAllocateDepthBuffer?void 0:q,H.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(w,k){const q=Ue.get(w);q.__webglFramebuffer=k,q.__useDefaultFramebuffer=k===void 0},this.setRenderTarget=function(w,k=0,q=0){K=w,z=k,B=q;let H=null,W=!1,me=!1;if(w){const fe=Ue.get(w);if(fe.__useDefaultFramebuffer!==void 0){ge.bindFramebuffer(G.FRAMEBUFFER,fe.__webglFramebuffer),te.copy(w.viewport),Te.copy(w.scissor),Ve=w.scissorTest,ge.viewport(te),ge.scissor(Te),ge.setScissorTest(Ve),X=-1;return}else if(fe.__webglFramebuffer===void 0)Ge.setupRenderTarget(w);else if(fe.__hasExternalTextures)Ge.rebindTextures(w,Ue.get(w.texture).__webglTexture,Ue.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){const We=w.depthTexture;if(fe.__boundDepthTexture!==We){if(We!==null&&Ue.has(We)&&(w.width!==We.image.width||w.height!==We.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Ge.setupDepthRenderbuffer(w)}}const ye=w.texture;(ye.isData3DTexture||ye.isDataArrayTexture||ye.isCompressedArrayTexture)&&(me=!0);const Re=Ue.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Re[k])?H=Re[k][q]:H=Re[k],W=!0):w.samples>0&&Ge.useMultisampledRTT(w)===!1?H=Ue.get(w).__webglMultisampledFramebuffer:Array.isArray(Re)?H=Re[q]:H=Re,te.copy(w.viewport),Te.copy(w.scissor),Ve=w.scissorTest}else te.copy(Oe).multiplyScalar(Me).floor(),Te.copy(lt).multiplyScalar(Me).floor(),Ve=gt;if(q!==0&&(H=C),ge.bindFramebuffer(G.FRAMEBUFFER,H)&&ge.drawBuffers(w,H),ge.viewport(te),ge.scissor(Te),ge.setScissorTest(Ve),W){const fe=Ue.get(w.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_CUBE_MAP_POSITIVE_X+k,fe.__webglTexture,q)}else if(me){const fe=k;for(let ye=0;ye<w.textures.length;ye++){const Re=Ue.get(w.textures[ye]);G.framebufferTextureLayer(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0+ye,Re.__webglTexture,q,fe)}}else if(w!==null&&q!==0){const fe=Ue.get(w.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,fe.__webglTexture,q)}X=-1};function dh(w){const k=Ue.get(w);return(k.__readFormat!==w.format||k.__readType!==w.type)&&(k.__readFormat=w.format,k.__readType=w.type,k.__formatReadable=Tt.textureFormatReadable(w.format),k.__typeReadable=Tt.textureTypeReadable(w.type)),k}this.readRenderTargetPixels=function(w,k,q,H,W,me,be,fe=0){if(!(w&&w.isWebGLRenderTarget)){Be("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=Ue.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&be!==void 0&&(ye=ye[be],Array.isArray(ye)&&(ye=ye[0])),ye){ge.bindFramebuffer(G.FRAMEBUFFER,ye);try{const Re=w.textures[fe],We=Re.format,et=Re.type;w.textures.length>1&&G.readBuffer(G.COLOR_ATTACHMENT0+fe);const we=dh(Re);if(we.__formatReadable===!1){Be("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(we.__typeReadable===!1){Be("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=w.width-H&&q>=0&&q<=w.height-W&&G.readPixels(k,q,H,W,oe.convert(We),oe.convert(et),me)}finally{const Re=K!==null?Ue.get(K).__webglFramebuffer:null;ge.bindFramebuffer(G.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(w,k,q,H,W,me,be,fe=0){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ye=Ue.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&be!==void 0&&(ye=ye[be],Array.isArray(ye)&&(ye=ye[0])),ye)if(k>=0&&k<=w.width-H&&q>=0&&q<=w.height-W){ge.bindFramebuffer(G.FRAMEBUFFER,ye);const Re=w.textures[fe],We=Re.format,et=Re.type;w.textures.length>1&&G.readBuffer(G.COLOR_ATTACHMENT0+fe);const we=dh(Re);if(we.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(we.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const tt=G.createBuffer();G.bindBuffer(G.PIXEL_PACK_BUFFER,tt),G.bufferData(G.PIXEL_PACK_BUFFER,me.byteLength,G.STREAM_READ),G.readPixels(k,q,H,W,oe.convert(We),oe.convert(et),0),G.bindBuffer(G.PIXEL_PACK_BUFFER,null);const Ft=K!==null?Ue.get(K).__webglFramebuffer:null;ge.bindFramebuffer(G.FRAMEBUFFER,Ft);const Mt=G.fenceSync(G.SYNC_GPU_COMMANDS_COMPLETE,0);return G.flush(),await Lm(G,Mt,4),G.bindBuffer(G.PIXEL_PACK_BUFFER,tt),G.getBufferSubData(G.PIXEL_PACK_BUFFER,0,me),G.bindBuffer(G.PIXEL_PACK_BUFFER,null),G.deleteBuffer(tt),G.deleteSync(Mt),me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(w,k=null,q=0){const H=Math.pow(2,-q),W=Math.floor(w.image.width*H),me=Math.floor(w.image.height*H),be=k!==null?k.x:0,fe=k!==null?k.y:0;Ge.setTexture2D(w,0),G.copyTexSubImage2D(G.TEXTURE_2D,q,0,0,be,fe,W,me),ge.unbindTexture()},this.copyTextureToTexture=function(w,k,q=null,H=null,W=0,me=0){let be,fe,ye,Re,We,et,we,tt,Ft;const Mt=w.isCompressedTexture?w.mipmaps[me]:w.image;if(q!==null)be=q.max.x-q.min.x,fe=q.max.y-q.min.y,ye=q.isBox3?q.max.z-q.min.z:1,Re=q.min.x,We=q.min.y,et=q.isBox3?q.min.z:0;else{const nt=Math.pow(2,-W);be=Math.floor(Mt.width*nt),fe=Math.floor(Mt.height*nt),w.isDataArrayTexture?ye=Mt.depth:w.isData3DTexture?ye=Math.floor(Mt.depth*nt):ye=1,Re=0,We=0,et=0}H!==null?(we=H.x,tt=H.y,Ft=H.z):(we=0,tt=0,Ft=0);const xt=oe.convert(k.format),hn=oe.convert(k.type);let Ae;k.isData3DTexture?(Ge.setTexture3D(k,0),Ae=G.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(Ge.setTexture2DArray(k,0),Ae=G.TEXTURE_2D_ARRAY):(Ge.setTexture2D(k,0),Ae=G.TEXTURE_2D),ge.activeTexture(G.TEXTURE0),ge.pixelStorei(G.UNPACK_FLIP_Y_WEBGL,k.flipY),ge.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),ge.pixelStorei(G.UNPACK_ALIGNMENT,k.unpackAlignment);const mn=ge.getParameter(G.UNPACK_ROW_LENGTH),rt=ge.getParameter(G.UNPACK_IMAGE_HEIGHT),ji=ge.getParameter(G.UNPACK_SKIP_PIXELS),un=ge.getParameter(G.UNPACK_SKIP_ROWS),na=ge.getParameter(G.UNPACK_SKIP_IMAGES);ge.pixelStorei(G.UNPACK_ROW_LENGTH,Mt.width),ge.pixelStorei(G.UNPACK_IMAGE_HEIGHT,Mt.height),ge.pixelStorei(G.UNPACK_SKIP_PIXELS,Re),ge.pixelStorei(G.UNPACK_SKIP_ROWS,We),ge.pixelStorei(G.UNPACK_SKIP_IMAGES,et);const Ni=w.isDataArrayTexture||w.isData3DTexture,es=k.isDataArrayTexture||k.isData3DTexture;if(w.isDepthTexture){const nt=Ue.get(w),an=Ue.get(k),Hn=Ue.get(nt.__renderTarget),Rt=Ue.get(an.__renderTarget);ge.bindFramebuffer(G.READ_FRAMEBUFFER,Hn.__webglFramebuffer),ge.bindFramebuffer(G.DRAW_FRAMEBUFFER,Rt.__webglFramebuffer);for(let tn=0;tn<ye;tn++)Ni&&(G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Ue.get(w).__webglTexture,W,et+tn),G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Ue.get(k).__webglTexture,me,Ft+tn)),G.blitFramebuffer(Re,We,Re+be,We+fe,we,tt,we+be,tt+fe,G.DEPTH_BUFFER_BIT,G.NEAREST);ge.bindFramebuffer(G.READ_FRAMEBUFFER,null),ge.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else if(W!==0||w.isRenderTargetTexture||Ue.has(w)){const nt=Ue.get(w),an=Ue.get(k);ge.bindFramebuffer(G.READ_FRAMEBUFFER,A),ge.bindFramebuffer(G.DRAW_FRAMEBUFFER,U);for(let Hn=0;Hn<ye;Hn++)Ni?G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,nt.__webglTexture,W,et+Hn):G.framebufferTexture2D(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,nt.__webglTexture,W),es?G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,an.__webglTexture,me,Ft+Hn):G.framebufferTexture2D(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,an.__webglTexture,me),W!==0?G.blitFramebuffer(Re,We,Re+be,We+fe,we,tt,we+be,tt+fe,G.COLOR_BUFFER_BIT,G.NEAREST):es?G.copyTexSubImage3D(Ae,me,we,tt,Ft+Hn,Re,We,be,fe):G.copyTexSubImage2D(Ae,me,we,tt,Re,We,be,fe);ge.bindFramebuffer(G.READ_FRAMEBUFFER,null),ge.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else es?w.isDataTexture||w.isData3DTexture?G.texSubImage3D(Ae,me,we,tt,Ft,be,fe,ye,xt,hn,Mt.data):k.isCompressedArrayTexture?G.compressedTexSubImage3D(Ae,me,we,tt,Ft,be,fe,ye,xt,Mt.data):G.texSubImage3D(Ae,me,we,tt,Ft,be,fe,ye,xt,hn,Mt):w.isDataTexture?G.texSubImage2D(G.TEXTURE_2D,me,we,tt,be,fe,xt,hn,Mt.data):w.isCompressedTexture?G.compressedTexSubImage2D(G.TEXTURE_2D,me,we,tt,Mt.width,Mt.height,xt,Mt.data):G.texSubImage2D(G.TEXTURE_2D,me,we,tt,be,fe,xt,hn,Mt);ge.pixelStorei(G.UNPACK_ROW_LENGTH,mn),ge.pixelStorei(G.UNPACK_IMAGE_HEIGHT,rt),ge.pixelStorei(G.UNPACK_SKIP_PIXELS,ji),ge.pixelStorei(G.UNPACK_SKIP_ROWS,un),ge.pixelStorei(G.UNPACK_SKIP_IMAGES,na),me===0&&k.generateMipmaps===!0&&k.mipmapsAutoUpdate===!0&&G.generateMipmap(Ae),ge.unbindTexture()},this.initRenderTarget=function(w){Ue.get(w).__webglFramebuffer===void 0&&Ge.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?Ge.setTextureCube(w,0):w.isData3DTexture?Ge.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?Ge.setTexture2DArray(w,0):Ge.setTexture2D(w,0),ge.unbindTexture()},this.resetState=function(){z=0,B=0,K=null,ge.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Qn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Qe._getUnpackColorSpace()}}function Ff(s,e=!1){const t=s[0].index!==null,n=new Set(Object.keys(s[0].attributes)),i=new Set(Object.keys(s[0].morphAttributes)),r={},a={},o=s[0].morphTargetsRelative,l=new ft;l.morphTargetsRelative=o;let c=0;for(let h=0;h<s.length;++h){const u=s[h];let d=0,f=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const p in u.attributes){if(!n.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+p+'" attribute exists among all geometries, or in none of them.'),null;r[p]===void 0&&(r[p]=[]),r[p].push(u.attributes[p]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const p in u.morphAttributes){if(!i.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;if(u.morphAttributes[p].length!==s[0].morphAttributes[p].length)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have the same number of morph targets for the "'+p+'" morph attribute.'),null;a[p]===void 0&&(a[p]=[]),a[p].push(u.morphAttributes[p]),f++}if(f!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of morph attributes."),null;if(e){let p;if(t)p=u.index.count;else if(u.attributes.position!==void 0)p=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,p,h),c+=p}}if(t){let h=0;const u=[];for(let d=0;d<s.length;++d){const f=s[d].index;for(let p=0;p<f.count;++p)u.push(f.getX(p)+h);h+=s[d].attributes.position.count}l.setIndex(u)}for(const h in r){const u=Hu(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(const h in a){const u=a[h][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){const f=[];for(let x=0;x<a[h].length;++x)f.push(a[h][x][d]);const p=Hu(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(p)}}}return l}function Hu(s){let e,t,n,i=-1,r=0;for(let c=0;c<s.length;++c){const h=s[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}const a=new e(r),o=new Jt(a,t,n);let l=0;for(let c=0;c<s.length;++c){const h=s[c];if(h.isInterleavedBufferAttribute){const u=l/t;for(let d=0,f=h.count;d<f;d++)for(let p=0;p<t;p++){const x=h.getComponent(d,p);o.setComponent(d+u,p,x)}}else a.set(h.array,l);l+=h.count*t}return i!==void 0&&(o.gpuType=i),o}function Vu(s,e){if(e===vm)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),s;if(e===tc||e===Wd){let t=s.getIndex();if(t===null){const r=[],a=s.getAttribute("position");if(a!==void 0){for(let o=0;o<a.count;o++)r.push(o);s.setIndex(r),t=s.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),s}const n=t.count-2,i=[];if(e===tc)for(let r=1;r<=n;r++)i.push(t.getX(0)),i.push(t.getX(r)),i.push(t.getX(r+1));else for(let r=0;r<n;r++)r%2===0?(i.push(t.getX(r)),i.push(t.getX(r+1)),i.push(t.getX(r+2))):(i.push(t.getX(r+2)),i.push(t.getX(r+1)),i.push(t.getX(r)));return i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),s.setIndex(i),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),s}function Oy(s){const e=new Map,t=new Map,n=s.clone();return Of(s,n,function(i,r){e.set(r,i),t.set(i,r)}),n.traverse(function(i){if(!i.isSkinnedMesh)return;const r=i,a=e.get(i),o=a.skeleton.bones;r.skeleton=a.skeleton.clone(),r.bindMatrix.copy(a.bindMatrix),r.skeleton.bones=o.map(function(l){return t.get(l)}),r.bind(r.skeleton,r.bindMatrix)}),n}function Of(s,e,t){t(s,e);for(let n=0;n<s.children.length;n++)Of(s.children[n],e.children[n],t)}class kf extends Js{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Hy(t)}),this.register(function(t){return new Vy(t)}),this.register(function(t){return new Wy(t)}),this.register(function(t){return new jy(t)}),this.register(function(t){return new eS(t)}),this.register(function(t){return new tS(t)}),this.register(function(t){return new qy(t)}),this.register(function(t){return new Ky(t)}),this.register(function(t){return new Yy(t)}),this.register(function(t){return new $y(t)}),this.register(function(t){return new Gy(t)}),this.register(function(t){return new Jy(t)}),this.register(function(t){return new Xy(t)}),this.register(function(t){return new Qy(t)}),this.register(function(t){return new Zy(t)}),this.register(function(t){return new zy(t)}),this.register(function(t){return new Wu(t,Ze.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new Wu(t,Ze.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new nS(t)})}load(e,t,n,i){const r=this;let a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){const c=Ar.extractUrlBase(e);a=Ar.resolveURL(c,this.path)}else a=Ar.extractUrlBase(e);this.manager.itemStart(e);const o=function(c){i?i(c):console.error(c),r.manager.itemError(e),r.manager.itemEnd(e)},l=new Sf(this.manager);l.setPriority(this.priority),l.setCache(this.cache),l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{r.parse(c,a,function(h){t(h),r.manager.itemEnd(e)},o)}catch(h){o(h)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r;const a={},o={},l=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===zf){try{a[Ze.KHR_BINARY_GLTF]=new iS(e)}catch(u){i&&i(u);return}r=JSON.parse(a[Ze.KHR_BINARY_GLTF].content)}else r=JSON.parse(l.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new gS(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,priority:this.priority,cache:this.cache,withCredentials:this.withCredentials,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const u=this.pluginCallbacks[h](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){const u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case Ze.KHR_MATERIALS_UNLIT:a[u]=new By;break;case Ze.KHR_DRACO_MESH_COMPRESSION:a[u]=new sS(r,this.dracoLoader);break;case Ze.KHR_TEXTURE_TRANSFORM:a[u]=new rS;break;case Ze.KHR_MESH_QUANTIZATION:a[u]=new aS;break;default:d.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){const n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function ky(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}function It(s,e,t){const n=s.json.materials[e];return n.extensions&&n.extensions[t]?n.extensions[t]:null}const Ze={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DIFFUSE_ROUGHNESS:"KHR_materials_diffuse_roughness",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class zy{constructor(e){this.parser=e,this.name=Ze.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){const r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let i=t.cache.get(n);if(i)return i;const r=t.json,l=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e];let c;const h=new le(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],Ln);const u=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new Tf(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Pg(h),c.distance=u;break;case"spot":c=new Rg(h),c.distance=u,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),li(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(l){return n._getNodeRef(t.cache,o,l)})}}class By{constructor(){this.name=Ze.KHR_MATERIALS_UNLIT}getMaterialType(){return Yt}extendParams(e,t,n){const i=[];e.color=new le(1,1,1),e.opacity=1;const r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){const a=r.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],Ln),e.opacity=a[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,Dt))}return Promise.all(i)}}class Gy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);return n===null||n.emissiveStrength!==void 0&&(t.emissiveIntensity=n.emissiveStrength),Promise.resolve()}}class Hy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];if(n.clearcoatFactor!==void 0&&(t.clearcoat=n.clearcoatFactor),n.clearcoatTexture!==void 0&&i.push(this.parser.assignTexture(t,"clearcoatMap",n.clearcoatTexture)),n.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=n.clearcoatRoughnessFactor),n.clearcoatRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",n.clearcoatRoughnessTexture)),n.clearcoatNormalTexture!==void 0&&(i.push(this.parser.assignTexture(t,"clearcoatNormalMap",n.clearcoatNormalTexture)),n.clearcoatNormalTexture.scale!==void 0)){const r=n.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Se(r,r)}return Promise.all(i)}}class Vy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_DIFFUSE_ROUGHNESS}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return t.diffuseRoughness=n.diffuseRoughnessFactor!==void 0?n.diffuseRoughnessFactor:0,n.diffuseRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(t,"diffuseRoughnessMap",n.diffuseRoughnessTexture)),Promise.all(i)}}class Wy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_DISPERSION}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);return n===null||(t.dispersion=n.dispersion!==void 0?n.dispersion:0),Promise.resolve()}}class Xy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return n.iridescenceFactor!==void 0&&(t.iridescence=n.iridescenceFactor),n.iridescenceTexture!==void 0&&i.push(this.parser.assignTexture(t,"iridescenceMap",n.iridescenceTexture)),n.iridescenceIor!==void 0&&(t.iridescenceIOR=n.iridescenceIor),n.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessMinimum=n.iridescenceThicknessMinimum),n.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessMaximum=n.iridescenceThicknessMaximum),n.iridescenceThicknessTexture!==void 0&&i.push(this.parser.assignTexture(t,"iridescenceThicknessMap",n.iridescenceThicknessTexture)),Promise.all(i)}}class qy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_SHEEN}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];if(t.sheenColor=new le(0,0,0),t.sheenRoughness=0,t.sheen=1,n.sheenColorFactor!==void 0){const r=n.sheenColorFactor;t.sheenColor.setRGB(r[0],r[1],r[2],Ln)}return n.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=n.sheenRoughnessFactor),n.sheenColorTexture!==void 0&&i.push(this.parser.assignTexture(t,"sheenColorMap",n.sheenColorTexture,Dt)),n.sheenRoughnessTexture!==void 0&&i.push(this.parser.assignTexture(t,"sheenRoughnessMap",n.sheenRoughnessTexture)),Promise.all(i)}}class Ky{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return n.transmissionFactor!==void 0&&(t.transmission=n.transmissionFactor),n.transmissionTexture!==void 0&&i.push(this.parser.assignTexture(t,"transmissionMap",n.transmissionTexture)),Promise.all(i)}}class Yy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_VOLUME}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];t.thickness=n.thicknessFactor!==void 0?n.thicknessFactor:0,n.thicknessTexture!==void 0&&i.push(this.parser.assignTexture(t,"thicknessMap",n.thicknessTexture)),t.attenuationDistance=n.attenuationDistance||1/0;const r=n.attenuationColor||[1,1,1];return t.attenuationColor=new le().setRGB(r[0],r[1],r[2],Ln),Promise.all(i)}}class $y{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_IOR}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);return n===null||(t.ior=n.ior!==void 0?n.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}}class Jy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_SPECULAR}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];t.specularIntensity=n.specularFactor!==void 0?n.specularFactor:1,n.specularTexture!==void 0&&i.push(this.parser.assignTexture(t,"specularIntensityMap",n.specularTexture));const r=n.specularColorFactor||[1,1,1];return t.specularColor=new le().setRGB(r[0],r[1],r[2],Ln),n.specularColorTexture!==void 0&&i.push(this.parser.assignTexture(t,"specularColorMap",n.specularColorTexture,Dt)),Promise.all(i)}}class Zy{constructor(e){this.parser=e,this.name=Ze.EXT_MATERIALS_BUMP}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return t.bumpScale=n.bumpFactor!==void 0?n.bumpFactor:1,n.bumpTexture!==void 0&&i.push(this.parser.assignTexture(t,"bumpMap",n.bumpTexture)),Promise.all(i)}}class Qy{constructor(e){this.parser=e,this.name=Ze.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return It(this.parser,e,this.name)!==null?ni:null}extendMaterialParams(e,t){const n=It(this.parser,e,this.name);if(n===null)return Promise.resolve();const i=[];return n.anisotropyStrength!==void 0&&(t.anisotropy=n.anisotropyStrength),n.anisotropyRotation!==void 0&&(t.anisotropyRotation=n.anisotropyRotation),n.anisotropyTexture!==void 0&&i.push(this.parser.assignTexture(t,"anisotropyMap",n.anisotropyTexture)),Promise.all(i)}}class jy{constructor(e){this.parser=e,this.name=Ze.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;const r=i.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,a)}}class eS{constructor(e){this.parser=e,this.name=Ze.EXT_TEXTURE_WEBP}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return n.loadTextureImage(e,a.source,l)}}class tS{constructor(e){this.parser=e,this.name=Ze.EXT_TEXTURE_AVIF}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return n.loadTextureImage(e,a.source,l)}}class Wu{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(o){const l=i.byteOffset||0,c=i.byteLength||0,h=i.count,u=i.byteStride,d=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(h,u,d,i.mode,i.filter).then(function(f){return f.buffer}):a.ready.then(function(){const f=new ArrayBuffer(h*u);return a.decodeGltfBuffer(new Uint8Array(f),h,u,d,i.mode,i.filter),f})})}else return null}}class nS{constructor(e){this.name=Ze.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=t.meshes[n.mesh];for(const c of i.primitives)if(c.mode!==Bn.TRIANGLES&&c.mode!==Bn.TRIANGLE_STRIP&&c.mode!==Bn.TRIANGLE_FAN&&c.mode!==void 0)return null;const a=n.extensions[this.name].attributes,o=[],l={};for(const c in a)o.push(this.parser.getDependency("accessor",a[c]).then(h=>(l[c]=h,l[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{const h=c.pop(),u=h.isGroup?h.children:[h],d=c[0].count,f=[];for(const p of u){const x=new ke,m=new F,g=new In,v=new F(1,1,1),y=new ps(p.geometry,p.material,d);for(let S=0;S<d;S++)l.TRANSLATION&&m.fromBufferAttribute(l.TRANSLATION,S),l.ROTATION&&g.fromBufferAttribute(l.ROTATION,S),l.SCALE&&v.fromBufferAttribute(l.SCALE,S),y.setMatrixAt(S,x.compose(m,g,v));let _=null;for(const S in l)if(S==="_COLOR_0"){const T=l[S];y.instanceColor=new Or(T.array,T.itemSize,T.normalized)}else if(S!=="TRANSLATION"&&S!=="ROTATION"&&S!=="SCALE"){if(_===null){const M=y.geometry;_=new ft,_.name=M.name;for(const b in M.attributes)_.setAttribute(b,M.attributes[b]);for(const b in M.morphAttributes)_.morphAttributes[b]=M.morphAttributes[b];M.index!==null&&_.setIndex(M.index),_.morphTargetsRelative=M.morphTargetsRelative;for(const b of M.groups)_.addGroup(b.start,b.count,b.materialIndex);M.boundingBox!==null&&(_.boundingBox=M.boundingBox.clone()),M.boundingSphere!==null&&(_.boundingSphere=M.boundingSphere.clone()),_.drawRange.start=M.drawRange.start,_.drawRange.count=M.drawRange.count,_.userData=Object.assign({},M.userData),y.geometry=_}const T=l[S];_.setAttribute(S,new Or(T.array,T.itemSize,T.normalized))}St.prototype.copy.call(y,p),this.parser.assignFinalMaterial(y),f.push(y)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const zf="glTF",lr=12,Xu={JSON:1313821514,BIN:5130562};class iS{constructor(e){this.name=Ze.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,lr),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==zf)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-lr,r=new DataView(e,lr);let a=0;for(;a<i;){const o=r.getUint32(a,!0);a+=4;const l=r.getUint32(a,!0);if(a+=4,l===Xu.JSON){const c=new Uint8Array(e,lr+a,o);this.content=n.decode(c)}else if(l===Xu.BIN){const c=lr+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class sS{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ze.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(const h in a){const u=oc[h]||h.toLowerCase();o[u]=a[h]}for(const h in e.attributes){const u=oc[h]||h.toLowerCase();if(a[h]!==void 0){const d=n.accessors[e.attributes[h]],f=ks[d.componentType];c[u]=f.name,l[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){i.decodeDracoFile(h,function(f){for(const p in f.attributes){const x=f.attributes[p],m=l[p];m!==void 0&&(x.normalized=m)}u(f)},o,c,Ln,d)})})}}class rS{constructor(){this.name=Ze.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){const n=Math.cos(e.rotation),i=Math.sin(e.rotation);e.matrix.set(e.repeat.x*n,e.repeat.y*i,e.offset.x,-e.repeat.x*i,e.repeat.y*n,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}}class aS{constructor(){this.name=Ze.KHR_MESH_QUANTIZATION}}class Bf extends Ks{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let a=0;a!==i;a++)t[a]=n[r+a];return t}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,h=i-t,u=(n-t)/h,d=u*u,f=d*u,p=e*c,x=p-c,m=-2*f+3*d,g=f-d,v=1-m,y=g-d+u;for(let _=0;_!==o;_++){const S=a[x+_+o],T=a[x+_+l]*h,M=a[p+_+o],b=a[p+_]*h;r[_]=v*S+y*T+m*M+g*b}return r}}const oS=new In;class lS extends Bf{interpolate_(e,t,n,i){const r=super.interpolate_(e,t,n,i);return oS.fromArray(r).normalize().toArray(r),r}}const Bn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},ks={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},qu={9728:Kt,9729:ln,9984:Od,9985:Ua,9986:fr,9987:Jn},Ku={33071:hi,33648:Xa,10497:Ji},tl={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},oc={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},zi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},cS={CUBICSPLINE:void 0,LINEAR:Dr,STEP:Nr},nl={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function hS(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new zc({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:$i})),s.DefaultMaterial}function rs(s,e,t){for(const n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function li(s,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(s.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function uS(s,e,t){let n=!1,i=!1,r=!1;for(let c=0,h=e.length;c<h;c++){const u=e[c];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(i=!0),u.COLOR_0!==void 0&&(r=!0),n&&i&&r)break}if(!n&&!i&&!r)return Promise.resolve(s);const a=[],o=[],l=[];for(let c=0,h=e.length;c<h;c++){const u=e[c];if(n){const d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):s.attributes.position;a.push(d)}if(i){const d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):s.attributes.normal;o.push(d)}if(r){const d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):s.attributes.color;l.push(d)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){const h=c[0],u=c[1],d=c[2];return n&&(s.morphAttributes.position=h),i&&(s.morphAttributes.normal=u),r&&(s.morphAttributes.color=d),s.morphTargetsRelative=!0,s})}function dS(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function fS(s){let e;const t=s.extensions&&s.extensions[Ze.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+il(t.attributes):e=s.indices+":"+il(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+il(s.targets[n]);return e}function il(s){let e="";const t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function lc(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function pS(s){return s.search(/\.jpe?g($|\?)/i)>0||s.search(/^data\:image\/jpeg/)===0?"image/jpeg":s.search(/\.webp($|\?)/i)>0||s.search(/^data\:image\/webp/)===0?"image/webp":s.search(/\.ktx2($|\?)/i)>0||s.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const mS=new ke;class gS{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new ky,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,a=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){const o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;const l=o.match(/Version\/(\d+)/);i=n&&l?parseInt(l[1],10):-1,r=o.indexOf("Firefox")>-1,a=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||r&&a<98?(this.textureLoader=new Eg(this.options.manager),this.textureLoader.setPriority(this.options.priority),this.textureLoader.setCache(this.options.cache)):(this.textureLoader=new Ig(this.options.manager),this.textureLoader.setPriority(this.options.priority),this.textureLoader.setCache(this.options.cache)),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setWithCredentials(this.options.withCredentials),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Sf(this.options.manager),this.fileLoader.setPriority(this.options.priority),this.fileLoader.setCache(this.options.cache),this.fileLoader.setResponseType("arraybuffer"),(this.options.withCredentials||this.options.crossOrigin==="use-credentials")&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){const o={scene:a[0][i.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:i.asset,parser:n,userData:{}};return rs(r,o,i),li(o,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(const l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){const a=t[i].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){const a=e[i];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const i=n.clone(),r=(a,o)=>{const l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(const[c,h]of a.children.entries())r(h,o.children[c])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const i=e(t[n]);if(i)return i}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let i=0;i<t.length;i++){const r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){const n=e+":"+t;let i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ze.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(r,a){n.load(Ar.resolveURL(t.uri,i.path),r,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){const t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){const a=tl[i.type],o=ks[i.componentType],l=i.normalized===!0,c=new o(i.count*a);return Promise.resolve(new Jt(c,a,l))}const r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(a){const o=a[0],l=tl[i.type],c=ks[i.componentType],h=c.BYTES_PER_ELEMENT,u=h*l,d=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,p=i.normalized===!0;let x,m;if(f&&f!==u){const g=Math.floor(d/f),v="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+g+":"+i.count;let y=t.cache.get(v);y||(x=new c(o,g*f,i.count*f/h),y=new d0(x,f/h),t.cache.add(v,y)),m=new Cc(y,l,d%f/h,p)}else o===null?x=new c(i.count*l):x=new c(o,d,i.count*l),m=new Jt(x,l,p);if(i.sparse!==void 0){const g=tl.SCALAR,v=ks[i.sparse.indices.componentType],y=i.sparse.indices.byteOffset||0,_=i.sparse.values.byteOffset||0,S=new v(a[1],y,i.sparse.count*g),T=new c(a[2],_,i.sparse.count*l);o!==null&&(m=new Jt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let M=0,b=S.length;M<b;M++){const I=S[M];if(m.setX(I,T[M*l]),l>=2&&m.setY(I,T[M*l+1]),l>=3&&m.setZ(I,T[M*l+2]),l>=4&&m.setW(I,T[M*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=p}return m})}loadTexture(e){const t=this.json,n=this.options,r=t.textures[e].source,a=t.images[r];let o=this.textureLoader;if(a.uri){const l=n.manager.getHandler(a.uri);l!==null&&(o=l)}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){const i=this,r=this.json,a=r.textures[e],o=r.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=a.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const d=(r.samplers||{})[a.sampler]||{};return h.magFilter=qu[d.magFilter]||ln,h.minFilter=qu[d.minFilter]||Jn,h.wrapS=Ku[d.wrapS]||Ji,h.wrapT=Ku[d.wrapT]||Ji,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==Kt&&h.minFilter!==ln,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(d=>d.clone());const a=i.images[e],o=self.URL||self.webkitURL;let l=a.uri||"",c=!1,h;if(t.isKTX2Loader===!0&&a.bufferView!==void 0)h=n.getDependency("bufferView",a.bufferView).then(function(d){return new Promise(function(f,p){t.parse(d,f,p)})});else{if(a.bufferView!==void 0)l=n.getDependency("bufferView",a.bufferView).then(function(d){c=!0;const f=new Blob([d],{type:a.mimeType});return l=o.createObjectURL(f),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");h=Promise.resolve(l).then(function(d){return new Promise(function(f,p){let x=f;t.isImageBitmapLoader===!0&&(x=function(m){const g=new $t(m);g.needsUpdate=!0,f(g)}),t.load(Ar.resolveURL(d,r.path),x,void 0,p)})})}const u=h.then(function(d){return c===!0&&o.revokeObjectURL(l),li(d,a),d.userData.mimeType=a.mimeType||pS(a.uri),d}).catch(function(d){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),d});return this.sourceCache[e]=u,u}assignTexture(e,t,n,i){const r=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),r.extensions[Ze.KHR_TEXTURE_TRANSFORM]){const o=n.extensions!==void 0?n.extensions[Ze.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const l=r.associations.get(a);a=r.extensions[Ze.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),r.associations.set(a,l)}}return i!==void 0&&(a.colorSpace=i),e[t]=a,a})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new rf,ei.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(o,l)),n=l}else if(e.isLine){const o="LineBasicMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new sf,ei.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(o,l)),n=l}if(i||r||a){let o="ClonedMaterial:"+n.uuid+":";i&&(o+="derivative-tangents:"),r&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=n.clone(),r&&(l.vertexColors=!0),a&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return zc}loadMaterial(e){const t=this,n=this.json,i=this.extensions,r=n.materials[e];let a;const o={},l=r.extensions||{},c=[];if(l[Ze.KHR_MATERIALS_UNLIT]){const u=i[Ze.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),c.push(u.extendParams(o,r,t))}else{const u=r.pbrMetallicRoughness||{};if(o.color=new le(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){const d=u.baseColorFactor;o.color.setRGB(d[0],d[1],d[2],Ln),o.opacity=d[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,Dt)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,o)})))}r.doubleSided===!0&&(o.side=pn);const h=r.alphaMode||nl.OPAQUE;if(h===nl.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===nl.MASK&&(o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&a!==Yt&&(c.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new Se(1,1),r.normalTexture.scale!==void 0)){const u=r.normalTexture.scale;o.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&a!==Yt&&(c.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&a!==Yt){const u=r.emissiveFactor;o.emissive=new le().setRGB(u[0],u[1],u[2],Ln)}return r.emissiveTexture!==void 0&&a!==Yt&&c.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,Dt)),Promise.all(c).then(function(){const u=new a(o);return r.name&&(u.name=r.name),li(u,r),t.associations.set(u,{materials:e}),r.extensions&&rs(i,u,r),u})}createUniqueName(e){const t=dt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[Ze.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return Yu(l,o,t)})}const a=[];for(let o=0,l=e.length;o<l;o++){const c=e[o],h=fS(c),u=i[h];if(u)a.push(u.promise);else{let d;c.extensions&&c.extensions[Ze.KHR_DRACO_MESH_COMPRESSION]?d=r(c):d=Yu(new ft,c,t),c.mode===Bn.TRIANGLE_STRIP?d=d.then(f=>Vu(f,Wd)):c.mode===Bn.TRIANGLE_FAN&&(d=d.then(f=>Vu(f,tc))),i[h]={primitive:c,promise:d},a.push(d)}}return Promise.all(a)}loadMesh(e){const t=this,n=this.json,i=this.extensions,r=n.meshes[e],a=r.primitives,o=[];for(let l=0,c=a.length;l<c;l++){const h=a[l].material===void 0?hS(this.cache):this.getDependency("material",a[l].material);o.push(h)}return o.push(t.loadGeometries(a)),Promise.all(o).then(async function(l){const c=l.slice(0,l.length-1),h=l[l.length-1],u=[];for(let f=0,p=h.length;f<p;f++){const x=h[f],m=a[f];let g;const v=c[f];if(m.mode===Bn.TRIANGLES||m.mode===Bn.TRIANGLE_STRIP||m.mode===Bn.TRIANGLE_FAN||m.mode===void 0){const y=r.isSkinnedMesh===!0,_=x.hasAttribute("skinIndex")&&x.hasAttribute("skinWeight");y&&_===!1&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),g=y&&_?new _0(x,v):new at(x,v),g.isSkinnedMesh===!0&&g.normalizeSkinWeights()}else if(m.mode===Bn.LINES)g=new S0(x,v);else if(m.mode===Bn.LINE_STRIP)g=new Nc(x,v);else if(m.mode===Bn.LINE_LOOP)g=new b0(x,v);else if(m.mode===Bn.POINTS)g=new af(x,v);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(g.geometry.morphAttributes).length>0&&dS(g,r),g.name=t.createUniqueName(r.name||"mesh_"+e),li(g,r),m.extensions&&rs(i,g,m),t.assignFinalMaterial(g),u.push(g)}for(let f=0,p=u.length;f<p;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return r.extensions&&rs(i,u[0],r),u[0];const d=new Ne;r.extensions&&rs(i,d,r),t.associations.set(d,{meshes:e});for(let f=0,p=u.length;f<p;f++)d.add(u[f]);return d})}loadCamera(e){let t;const n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new vn(Ym.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new Gc(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),li(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const r=i.pop(),a=i,o=[],l=[];for(let c=0,h=a.length;c<h;c++){const u=a[c];if(u){o.push(u);const d=new ke;r!==null&&d.fromArray(r.array,c*16),l.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Lc(o,l)})}loadAnimation(e){const t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,a=[],o=[],l=[],c=[],h=[];for(let u=0,d=i.channels.length;u<d;u++){const f=i.channels[u],p=i.samplers[f.sampler],x=f.target,m=x.node,g=i.parameters!==void 0?i.parameters[p.input]:p.input,v=i.parameters!==void 0?i.parameters[p.output]:p.output;x.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",g)),l.push(this.getDependency("accessor",v)),c.push(p),h.push(x))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(u){const d=u[0],f=u[1],p=u[2],x=u[3],m=u[4],g=[];for(let y=0,_=d.length;y<_;y++){const S=d[y],T=f[y],M=p[y],b=x[y],I=m[y];if(S===void 0)continue;S.updateMatrix&&S.updateMatrix();const R=n._createAnimationTracks(S,T,M,b,I);if(R)for(let D=0;D<R.length;D++)g.push(R[D])}const v=new _g(r,void 0,g);return li(v,i),v})}createNodeMesh(e){const t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){const a=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=i.weights.length;l<c;l++)o.morphTargetInfluences[l]=i.weights[l]}),a})}loadNode(e){const t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),a=[],o=i.children||[];for(let c=0,h=o.length;c<h;c++)a.push(n.getDependency("node",o[c]));const l=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(a),l]).then(function(c){const h=c[0],u=c[1],d=c[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,mS)});for(let f=0,p=u.length;f<p;f++)h.add(u[f]);if(h.userData.pivot!==void 0&&u.length>0){const f=h.userData.pivot,p=u[0];h.pivot=new F().fromArray(f),h.position.x-=f[0],h.position.y-=f[1],h.position.z-=f[2],p.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){const t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const r=t.nodes[e],a=r.name?i.createUniqueName(r.name):"",o=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),r.camera!==void 0&&o.push(i.getDependency("camera",r.camera).then(function(c){return i._getNodeRef(i.cameraCache,r.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(r.isBone===!0?h=new nf:c.length>1?h=new Ne:c.length===1?h=c[0]:h=new St,h!==c[0])for(let u=0,d=c.length;u<d;u++)h.add(c[u]);if(r.name&&(h.userData.name=r.name,h.name=a),li(h,r),r.extensions&&rs(n,h,r),r.matrix!==void 0){const u=new ke;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!i.associations.has(h))i.associations.set(h,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){const u=i.associations.get(h);i.associations.set(h,{...u})}return i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],i=this,r=new Ne;n.name&&(r.name=i.createUniqueName(n.name)),li(r,n),n.extensions&&rs(t,r,n);const a=n.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(i.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let h=0,u=l.length;h<u;h++){const d=l[h];d.parent!==null?r.add(Oy(d)):r.add(d)}const c=h=>{const u=new Map;for(const[d,f]of i.associations)(d instanceof ei||d instanceof $t)&&u.set(d,f);return h.traverse(d=>{const f=i.associations.get(d);f!=null&&u.set(d,f)}),u};return i.associations=c(r),r})}_createAnimationTracks(e,t,n,i,r){const a=[],o=e.name?e.name:e.uuid,l=[];function c(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}zi[r.path]===zi.weights?(c(e),e.isGroup&&e.children.forEach(c)):l.push(o);let h;switch(zi[r.path]){case zi.weights:h=Vr;break;case zi.rotation:h=Wr;break;case zi.translation:case zi.scale:h=eo;break;default:switch(n.itemSize){case 1:h=Vr;break;case 2:case 3:default:h=eo;break}break}const u=i.interpolation!==void 0?cS[i.interpolation]:Dr,d=this._getArrayFromAccessor(n);for(let f=0,p=l.length;f<p;f++){const x=new h(l[f]+"."+zi[r.path],t.array,d,u);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(x),a.push(x)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=lc(t.constructor),i=new Float32Array(t.length);for(let r=0,a=t.length;r<a;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){const i=this instanceof Wr?lS:Bf;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function xS(s,e,t){const n=e.attributes,i=new Li;if(n.POSITION!==void 0){const o=t.json.accessors[n.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(i.set(new F(l[0],l[1],l[2]),new F(c[0],c[1],c[2])),o.normalized){const h=lc(ks[o.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const r=e.targets;if(r!==void 0){const o=new F,l=new F;for(let c=0,h=r.length;c<h;c++){const u=r[c];if(u.POSITION!==void 0){const d=t.json.accessors[u.POSITION],f=d.min,p=d.max;if(f!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),d.normalized){const x=lc(ks[d.componentType]);l.multiplyScalar(x)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(o)}s.boundingBox=i;const a=new mi;i.getCenter(a.center),a.radius=i.min.distanceTo(i.max)/2,s.boundingSphere=a}function Yu(s,e,t){const n=e.attributes,i=[];function r(a,o){return t.getDependency("accessor",a).then(function(l){s.setAttribute(o,l)})}for(const a in n){const o=oc[a]||a.toLowerCase();o in s.attributes||i.push(r(n[a],o))}if(e.indices!==void 0&&!s.index){const a=t.getDependency("accessor",e.indices).then(function(o){s.setIndex(o)});i.push(a)}return Qe.workingColorSpace!==Ln&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Qe.workingColorSpace}" not supported.`),li(s,e),xS(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?uS(s,e.targets,t):s})}const ne={lumen:6091494,violet:10980346,blossom:16752327,gold:16762967,leaf:8178526,leafDark:4165450,bark:9067067,stone:12170439,teal:2864035,cream:16773596,navy:3882874,skin:16767423,hair:10506797,moss:7316314,shellStone:9276067},$u=new Map;function se(s,e=0,t=.6){const n=`${s}-${e}-${t}`;let i=$u.get(n);return i||(i=new jn({color:s,emissive:e,emissiveIntensity:e?t:0,flatShading:!0}),$u.set(n,i)),i}function ie(s,e,t="",n=0,i=0,r=0){const a=new at(s,e);return a.name=t,a.position.set(n,i,r),a.castShadow=!0,a}let qi=null;async function _S(s,e){try{return qi=(await new kf().loadAsync(s,n=>{n.total&&e?.(n.loaded/n.total)})).scene,Gf(qi),Wf(qi),!0}catch(t){return console.warn("[synes] kit GLB unavailable, using procedural models",t),qi=null,!1}}const vS=()=>!!qi;let Xc=null;async function MS(s){try{const e=(await new kf().loadAsync(s)).scene;return Gf(e),Wf(e),Xc=e,!0}catch(e){return console.warn("[synes] side-car GLB unavailable",s,e),!1}}function Gf(s){const e=new Map;s.traverse(t=>{const n=t;if(!n.isMesh)return;n.castShadow=!0,n.receiveShadow=!1;const i=n.material;if(!e.has(i)){const r=i.emissive&&i.emissive.r+i.emissive.g+i.emissive.b>.01;e.set(i,new jn({color:i.color??new le(1,1,1),emissive:r?i.emissive:new le(0,0,0),emissiveIntensity:r?Math.min(1,i.emissiveIntensity??1)*.8:0,flatShading:!0}))}n.material=e.get(i)})}class Hf extends jn{constructor(){super({color:16777215,flatShading:!0,emissive:16777215})}onBeforeCompile(e){e.vertexShader=`attribute vec3 aCol;
attribute vec3 aEm;
flat varying vec3 vCol;
flat varying vec3 vEm;
`+e.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
	vCol = aCol; vEm = aEm;`),e.fragmentShader=`flat varying vec3 vCol;
flat varying vec3 vEm;
`+e.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );","vec4 diffuseColor = vec4( diffuse * vCol, opacity );").replace("vec3 totalEmissiveRadiance = emissive;","vec3 totalEmissiveRadiance = emissive * vEm;")}customProgramCacheKey(){return"bakedLambert"}}const yS=/_geo(_\d+)?$/;let Ju=null;const Vf=new WeakMap;function SS(s){const e=s;if(!e.isMesh||e.isInstancedMesh||e.isSkinnedMesh||s.children.length||!yS.test(s.name))return!1;const t=e.material;return Array.isArray(t)||!t.isMeshLambertMaterial||t.map||t instanceof Hf||t.transparent||t.opacity!==1||t.side!==0?!1:s.position.lengthSq()===0&&s.quaternion.w===1&&s.scale.x===1&&s.scale.y===1&&s.scale.z===1}const bS=new Set(["prismback"]),TS=new Set(["crystal_pillar","crystal_gate"]);function Wf(s){let e=0;s.traverse(t=>{t.isMesh&&(t.userData.seq=e++)}),Ju??(Ju=new Hf),s.traverse(t=>{let n=!1;for(let l=t;l;l=l.parent){if(bS.has(l.name))return;TS.has(l.name)&&(n=!0)}const i=t.children.filter(SS);if(i.length<2)return;i.sort((l,c)=>(n?0:l.material.id-c.material.id)||l.userData.seq-c.userData.seq);const r=i.map(l=>{const c=l.geometry.index?l.geometry.toNonIndexed():l.geometry.clone();for(const g of Object.keys(c.attributes))g!=="position"&&g!=="normal"&&c.deleteAttribute(g);const h=l.material,u=h.color,d=h.emissive,f=h.emissiveIntensity,p=c.getAttribute("position").count,x=new Float32Array(p*3),m=new Float32Array(p*3);for(let g=0;g<p;g++)x[g*3]=u.r,x[g*3+1]=u.g,x[g*3+2]=u.b,m[g*3]=d.r*f,m[g*3+1]=d.g*f,m[g*3+2]=d.b*f;return c.setAttribute("aCol",new Jt(x,3)),c.setAttribute("aEm",new Jt(m,3)),c}),a=Ff(r,!1);if(!a)return;const o=new at(a,Ju);if(o.name=i[0].name,o.castShadow=!0,o.receiveShadow=!1,Vf.set(a,i.map((l,c)=>({geometry:r[c],mat:l.material,order:l.userData.seq}))),n)o.name+="_baked",o.userData.twin=!0,o.visible=!1;else for(const l of i)t.remove(l);t.add(o)})}function Xf(s){if(!qi)return null;const e=Xc?.getObjectByName(s)??qi.getObjectByName(s);if(!e)return null;const t=e.clone(!0);return t.position.set(0,0,0),t.rotation.set(0,0,0),t}function mo(s,e){const t=Xf(s);if(!t)return null;for(const i of e)if(!t.getObjectByName(i))return null;const n=new Ne;return n.add(t),n.name=s,n}function ES(){const s=mo("hero",["hero_body","hero_head","hero_sword"]);if(s)return s;const e=new Ne;e.name="hero";const t=new Ne;t.name="hero_body",e.add(t),t.add(ie(new Dc(.26,.28,3,8),se(ne.cream),"",0,.48,0)),t.add(ie(new vt(.3,.34,.18,8),se(ne.navy),"",0,.36,0)),t.add(ie(new ho(.22,.08,6,10),se(ne.teal),"",0,.74,0)).rotation.x=Math.PI/2;const n=ie(new it(.16,.05,.42),se(ne.teal),"",.08,.7,-.32);n.rotation.x=.5,t.add(n),t.add(ie(new vt(.09,.1,.3,6),se(7031347),"",-.13,.15,0)),t.add(ie(new vt(.09,.1,.3,6),se(7031347),"",.13,.15,0));const i=new Ne;i.name="hero_head",i.position.y=.8,e.add(i),i.add(ie(new cn(.34,12,10),se(ne.skin),"",0,.3,0));const r=ie(new cn(.37,10,8,0,Math.PI*2,0,Math.PI*.62),se(ne.hair),"",0,.34,-.03);i.add(r);const a=ie(new Cn(.09,.28,5),se(ne.hair),"",.02,.72,.02);a.rotation.z=-.4,i.add(a),i.add(ie(new cn(.05,6,5),se(2759956),"",-.12,.28,.3)),i.add(ie(new cn(.05,6,5),se(2759956),"",.12,.28,.3));const o=new Ne;return o.name="hero_sword",o.position.set(.36,.5,.12),e.add(o),o.add(ie(new it(.06,.16,.06),se(7031347),"",0,0,0)),o.add(ie(new it(.22,.04,.06),se(ne.gold),"",0,.09,0)),o.add(ie(new it(.08,.7,.03),se(ne.lumen,ne.lumen,.5),"",0,.45,0)),e}function wS(){const s=mo("puffcap",["puffcap_cap","puffcap_stem"]);if(s)return s;const e=new Ne;e.name="puffcap";const t=new Ne;t.name="puffcap_stem",e.add(t),t.add(ie(new vt(.3,.38,.5,9),se(ne.cream),"",0,.25,0)),t.add(ie(new cn(.05,6,5),se(2759956),"",-.11,.33,.32)),t.add(ie(new cn(.05,6,5),se(2759956),"",.11,.33,.32));const n=new Ne;n.name="puffcap_cap",n.position.y=.48,e.add(n),n.add(ie(new cn(.55,12,8,0,Math.PI*2,0,Math.PI/2),se(ne.blossom),"",0,0,0));for(const[i,r]of[[.25,.2],[-.28,.1],[.05,-.3],[-.1,.35],[.32,-.15]])n.add(ie(new cn(.08,6,4),se(ne.cream),"",i,.38-(i*i+r*r)*.5,r));return e}function AS(){const s=mo("thornling",["thornling_body"]);if(s)return s;const e=new Ne;e.name="thornling";const t=new Ne;t.name="thornling_body",e.add(t),t.add(ie(new Sn(.42,0),se(ne.leafDark),"",0,.45,0));const n=new Sn(.42,0).getAttribute("position"),i=new Set;for(let r=0;r<n.count;r++){const a=n.getX(r),o=n.getY(r),l=n.getZ(r),c=`${a.toFixed(2)},${o.toFixed(2)},${l.toFixed(2)}`;if(i.has(c)||o<-.2||l>.3)continue;i.add(c);const h=ie(new Cn(.09,.32,4),se(ne.violet),"",a*1.15,.45+o*1.15,l*1.15);h.lookAt(a*3,.45+o*3,l*3),h.rotateX(Math.PI/2),t.add(h)}return t.add(ie(new cn(.06,6,5),se(16774816,16774816,.8),"",-.14,.52,.36)),t.add(ie(new cn(.06,6,5),se(16774816,16774816,.8),"",.14,.52,.36)),e}function RS(){const s=mo("prismback",["prismback_body","prismback_shell","prismback_horn","prismback_legs"]);if(s)return s;const e=new Ne;e.name="prismback";const t=new Ne;t.name="prismback_legs",e.add(t);for(const[u,d]of[[-1.1,1.1],[1.1,1.1],[-1.25,-.2],[1.25,-.2],[-1.05,-1.4],[1.05,-1.4]])t.add(ie(new vt(.28,.36,.9,6),se(7170176),"",u,.45,d));const n=new Ne;n.name="prismback_body",e.add(n);const i=ie(new cn(1.6,12,9),se(ne.shellStone),"",0,1.25,0);i.scale.set(1,.62,1.35),n.add(i);const r=ie(new cn(1.62,12,6,0,Math.PI*2,0,Math.PI*.38),se(ne.moss),"",0,1.3,0);r.scale.set(1,.62,1.35),n.add(r);const a=ie(new Ws(.62,0),se(7828364),"",0,1.05,2);n.add(a),n.add(ie(new cn(.11,6,5),se(ne.gold,ne.gold,1),"",-.3,1.2,2.48)),n.add(ie(new cn(.11,6,5),se(ne.gold,ne.gold,1),"",.3,1.2,2.48));const o=new Ne;o.name="prismback_shell",o.position.y=1.9,e.add(o);const l=[[0,0,0,1.3,ne.lumen],[.55,0,.4,.95,ne.violet],[-.6,0,.2,1,ne.lumen],[.2,0,-.7,1.05,ne.violet],[-.35,0,-.5,.8,ne.blossom],[.75,0,-.35,.7,ne.lumen],[-.8,0,.75,.65,ne.violet]];for(const[u,d,f,p,x]of l){const m=ie(new Rn(.32,0),se(x,x,.55),"",u,d+p*.4,f);m.scale.set(.8,p*1.5,.8),m.rotation.set(u*.4,u+f,f*.4),o.add(m)}const c=new Ne;c.name="prismback_horn",c.position.set(0,1.25,2.45),e.add(c);const h=ie(new Cn(.22,1.1,5),se(ne.lumen,ne.lumen,.6),"",0,.2,.35);return h.rotation.x=1,c.add(h),e}const CS={tree_round:()=>{const s=new Ne;return s.add(ie(new vt(.22,.3,1.4,6),se(ne.bark),"",0,.7,0)),s.add(ie(new Sn(1.25,0),se(ne.leaf),"",0,2.1,0)),s.add(ie(new Sn(.8,0),se(9820527),"",.45,2.7,.2)),s},tree_round_b:()=>{const s=new Ne;return s.add(ie(new vt(.2,.28,1.2,6),se(ne.bark),"",0,.6,0)),s.add(ie(new Sn(1.1,0),se(16165064),"",0,1.9,0)),s.add(ie(new Sn(.7,0),se(16761818),"",-.4,2.4,.1)),s},tree_pine:()=>{const s=new Ne;return s.add(ie(new vt(.18,.24,1,6),se(ne.bark),"",0,.5,0)),s.add(ie(new Cn(1.1,1.8,7),se(ne.leafDark),"",0,1.6,0)),s.add(ie(new Cn(.8,1.4,7),se(5219162),"",0,2.5,0)),s},bush:()=>ie(new Sn(.6,0),se(6797655),"",0,.4,0),rock_a:()=>{const s=ie(new Ws(.7,0),se(ne.stone),"",0,.35,0);return s.scale.set(1,.7,.9),s},rock_b:()=>{const s=ie(new Sn(.5,0),se(10985912),"",0,.25,0);return s.scale.set(1.3,.6,1),s},crystal_cluster:()=>{const s=new Ne;return[[0,0,1,ne.lumen],[.3,.1,.7,ne.violet],[-.25,-.1,.6,ne.lumen],[.05,-.3,.5,ne.blossom]].forEach(([e,t,n,i])=>{const r=ie(new Rn(.22,0),se(i,i,.7),"",e,n*.45,t);r.scale.set(1,n*2.2,1),r.rotation.z=e*.8,s.add(r)}),s},flower_patch:()=>{const s=new Ne;return[[0,0,ne.blossom],[.3,.2,ne.gold],[-.25,.15,16777215],[.1,-.3,ne.violet]].forEach(([e,t,n])=>s.add(ie(new Sn(.1,0),se(n),"",e,.18,t))),s},mushroom_glow:()=>{const s=new Ne;return s.add(ie(new vt(.06,.08,.3,6),se(ne.cream),"",0,.15,0)),s.add(ie(new cn(.2,8,5,0,Math.PI*2,0,Math.PI/2),se(ne.lumen,ne.lumen,.8),"",0,.28,0)),s},tent:()=>{const s=new Ne,e=ie(new Cn(1.6,2,4),se(15983299),"",0,1,0);return e.rotation.y=Math.PI/4,s.add(e),s.add(ie(new it(.7,1.1,.05),se(ne.teal),"",0,.55,1.12)),s},campfire:()=>{const s=new Ne;for(let e=0;e<6;e++){const t=ie(new Ws(.16,0),se(ne.stone),"",Math.cos(e)*.45,.08,Math.sin(e)*.45);s.add(t)}return s.add(ie(new Cn(.25,.6,5),new Yt({color:16757575}),"flame",0,.35,0)),s.add(ie(new Cn(.14,.4,5),new Yt({color:16773280}),"flame2",0,.3,0)),s},signpost:()=>{const s=new Ne;s.add(ie(new vt(.07,.08,1.6,5),se(ne.bark),"",0,.8,0));const e=ie(new it(.9,.24,.06),se(13146730),"",.25,1.3,0);return e.rotation.y=-.3,s.add(e),s},lantern_post:()=>{const s=new Ne;return s.add(ie(new vt(.05,.06,1.8,5),se(5916214),"",0,.9,0)),s.add(ie(new Rn(.16,0),se(ne.gold,ne.gold,1),"",0,1.9,0)),s},crystal_pillar:()=>{const s=new Ne;s.add(ie(new vt(.9,1,.4,7),se(ne.stone),"",0,.2,0));const e=ie(new vt(.45,.7,3.4,6),se(ne.violet,ne.violet,.45),"",0,2,0);return s.add(e),s.add(ie(new Cn(.45,.8,6),se(ne.lumen,ne.lumen,.7),"",0,4.1,0)),s},crystal_gate:()=>{const s=new Ne;for(let e=-2;e<=2;e++){const t=2.2+(e%2===0?.8:0),n=ie(new Rn(.45,0),se(e%2?ne.violet:ne.lumen,e%2?ne.violet:ne.lumen,.7),"",e*1.2,t/2,0);n.scale.set(1,t/.9,.7),s.add(n)}return s},lumen_spring:()=>{const s=new Ne;return s.add(ie(new vt(1.5,1.7,.3,10),se(ne.stone),"",0,.15,0)),s.add(ie(new vt(1.25,1.25,.05,16),new Yt({color:9435135}),"water",0,.32,0)),s.add(ie(new Rn(.3,0),se(ne.lumen,ne.lumen,1),"gem",0,1.3,0)),s},fence:()=>{const s=new Ne;for(const e of[-.9,.9])s.add(ie(new it(.12,.8,.12),se(ne.bark),"",e,.4,0));return s.add(ie(new it(2,.1,.08),se(10842957),"",0,.55,0)),s},house_a:()=>{const s=new Ne;s.add(ie(new it(3,2.2,2.8),se(ne.cream),"",0,1.1,0));const e=ie(new Cn(2.5,1.6,4),se(14708879),"",0,3,0);e.rotation.y=Math.PI/4,s.add(e),s.add(ie(new it(.7,1.2,.1),se(ne.bark),"",0,.6,1.42));for(const t of[-.9,.9])s.add(ie(new it(.5,.5,.08),se(ne.gold,ne.gold,.6),"",t,1.4,1.42));return s},house_b:()=>{const s=new Ne;s.add(ie(new it(2.4,3,2.4),se(16049871),"",0,1.5,0));const e=ie(new Cn(2,1.8,4),se(ne.teal),"",0,3.9,0);return e.rotation.y=Math.PI/4,s.add(e),s.add(ie(new it(.4,1,.4),se(ne.stone),"",.6,4.2,.3)),s.add(ie(new it(.6,1.1,.1),se(ne.bark),"",-.4,.55,1.22)),s.add(ie(new it(.5,.6,.08),se(ne.gold,ne.gold,.6),"",.5,2,1.22)),s},market_stall:()=>{const s=new Ne;for(const[t,n]of[[-1,-.6],[1,-.6],[-1,.6],[1,.6]])s.add(ie(new vt(.06,.06,2,5),se(ne.bark),"",t,1,n));s.add(ie(new it(2.1,.8,1.1),se(13146730),"",0,.4,0));const e=ie(new it(2.4,.08,1.6),se(ne.blossom),"",0,2.05,.1);return e.rotation.x=.2,s.add(e),s.add(ie(new Rn(.18,0),se(ne.lumen,ne.lumen,.8),"",-.5,.95,0)),s.add(ie(new Sn(.16,0),se(16747100),"",.3,.92,.1)),s.add(ie(new Sn(.16,0),se(ne.gold),"",.6,.92,-.1)),s},fountain:()=>{const s=new Ne;s.add(ie(new vt(2.2,2.4,.6,12),se(ne.stone),"",0,.3,0)),s.add(ie(new vt(1.9,1.9,.08,16),new Yt({color:9435135}),"",0,.62,0)),s.add(ie(new vt(.35,.5,1.6,8),se(ne.stone),"",0,1.2,0));const e=ie(new Rn(.55,0),se(ne.lumen,ne.lumen,.9),"",0,2.6,0);return e.scale.y=1.8,s.add(e),s},ruin_arch:()=>{const s=new Ne;for(const t of[-1.6,1.6])s.add(ie(new it(.8,3.6,.8),se(10393773),"",t,1.8,0));const e=ie(new it(4.2,.7,.9),se(11117496),"",0,3.9,0);return e.rotation.z=.06,s.add(e),s.add(ie(new Rn(.3,0),se(ne.lumen,ne.lumen,1),"",0,3.1,0)),s},ruin_column:()=>{const s=new Ne;s.add(ie(new vt(.45,.55,2.2,7),se(10393773),"",0,1.1,0));const e=ie(new vt(.45,.45,.6,7),se(10393773),"",.6,.3,.5);return e.rotation.z=1.4,s.add(e),s},shop_counter:()=>{const s=new Ne;return s.add(ie(new it(4,1,1),se(10842957),"",0,.5,0)),s.add(ie(new it(4.1,.08,1.1),se(9318223),"",0,1.04,0)),s.add(ie(new Rn(.22,0),se(ne.gold,ne.gold,.9),"",1.2,1.3,0)),s.add(ie(new it(.5,.06,.35),se(15983299),"",-.8,1.11,0)),s},weapon_rack:()=>{const s=new Ne;s.add(ie(new it(2.2,.15,.3),se(ne.bark),"",0,.2,0)),s.add(ie(new it(2.2,.12,.2),se(ne.bark),"",0,1.6,0));for(const e of[-.7,0,.7])s.add(ie(new it(.1,1.6,.05),se(14673650),"",e,1,.05));return s.add(ie(new vt(.45,.45,.1,10),se(ne.navy),"",1.3,.9,.2)).rotation.x=Math.PI/2,s},banner:()=>{const s=new Ne;return s.add(ie(new vt(.05,.05,3.2,5),se(5916214),"",0,1.6,0)),s.add(ie(new it(.9,1.4,.04),se(ne.violet),"",.48,2.4,0)),s.add(ie(new Rn(.16,0),se(ne.gold,ne.gold,.8),"",.48,2.5,.04)),s}},Zu=s=>!!(Xc?.getObjectByName(s)??qi?.getObjectByName(s));function qc(s){const e=Xf(s);if(e)return e.traverse(n=>{n.castShadow=!0}),e;const t=CS[s];return t?t():new Ne}function PS(s){const e=qc(s);e.updateMatrixWorld(!0);const t=[];let n=0;return e.traverse(i=>{const r=i;if(!r.isMesh)return;const a=Vf.get(r.geometry);if(a)for(const o of a)t.push({geometry:o.geometry,material:r.material,matrix:r.matrixWorld.clone(),orig:{mat:o.mat,order:o.order}});else t.push({geometry:r.geometry,material:r.material,matrix:r.matrixWorld.clone(),orig:{mat:r.material,order:r.userData.seq??n}});n++}),t}function cc(s,e=new Map){const t=PS(s);for(const r of[...t].sort((a,o)=>a.orig.order-o.orig.order))e.has(r.orig.mat)||e.set(r.orig.mat,e.size);t.sort((r,a)=>e.get(r.orig.mat)-e.get(a.orig.mat));const n=new Map;for(const r of t){let a=r.geometry.clone();a.applyMatrix4(r.matrix),a.index&&(a=a.toNonIndexed());for(const l of Object.keys(a.attributes))l!=="position"&&l!=="normal"&&l!=="aCol"&&l!=="aEm"&&a.deleteAttribute(l);a.morphAttributes={};let o=n.get(r.material);o||n.set(r.material,o={gs:[],rank:e.get(r.orig.mat)}),o.gs.push(a)}const i=[];for(const[r,{gs:a,rank:o}]of n){const l=a.length===1?a[0]:Ff(a,!1);if(l)i.push({geometry:l,material:r,matrix:new ke,rank:o});else for(const c of a)i.push({geometry:c,material:r,matrix:new ke,rank:o})}return i}class LS{constructor(e,t=220){N(this,"mesh");N(this,"ps",[]);N(this,"dummy",new St);N(this,"n");this.n=t,this.mesh=new ps(new Rn(.09,0),new Yt({color:16777215,transparent:!0,opacity:.95,depthWrite:!1}),t),this.mesh.frustumCulled=!1,this.mesh.count=0,this.mesh.setColorAt(0,new le(1,1,1)),e.add(this.mesh)}burst(e,t,n,i,r,a=3,o=2.5,l=.6,c=1,h=7){const u=new le(i);for(let d=0;d<r;d++){this.ps.length>=this.n&&this.ps.shift();const f=Math.random()*Math.PI*2,p=a*(.4+Math.random()*.6);this.ps.push({x:e,y:t,z:n,vx:Math.cos(f)*p,vy:o*(.5+Math.random()),vz:Math.sin(f)*p,life:l*(.6+Math.random()*.4),max:l,s:c*(.6+Math.random()*.8),g:h}),this.mesh.setColorAt(this.ps.length-1,u),this.ps[this.ps.length-1].c=u}}update(e){this.ps=this.ps.filter(t=>(t.life-=e)>0);for(let t=0;t<this.ps.length;t++){const n=this.ps[t];n.vy-=n.g*e,n.x+=n.vx*e,n.y=Math.max(.05,n.y+n.vy*e),n.z+=n.vz*e;const i=n.life/n.max;this.dummy.position.set(n.x,n.y,n.z),this.dummy.scale.setScalar(n.s*(.3+.7*i)),this.dummy.rotation.set(n.life*6,n.life*4,0),this.dummy.updateMatrix(),this.mesh.setMatrixAt(t,this.dummy.matrix),this.mesh.setColorAt(t,n.c)}this.mesh.count=this.ps.length,this.mesh.instanceMatrix.needsUpdate=!0,this.mesh.instanceColor&&(this.mesh.instanceColor.needsUpdate=!0)}}class IS{constructor(e){N(this,"items",[]);N(this,"scene");this.scene=e}ring(e,t,n,i,r,a=.35,o=.85,l=.08,c=!1){const h=new at(new Hr(.85,1,40),new Yt({color:r,transparent:!0,opacity:o,side:pn,depthWrite:!1,blending:Pi,forceSinglePass:c}));h.rotation.x=-Math.PI/2,h.position.set(e,l,t),h.scale.setScalar(n),h.renderOrder=5,this.scene.add(h),this.items.push({m:h,t:0,dur:a,from:n,to:i,op:o})}arc(e,t,n,i,r,a){const o=a===2?Math.PI*1.1:Math.PI*.8,l=new Hr(i*.45,i,20,1,Math.PI/2-o/2,o),c=new at(l,new Yt({color:r,transparent:!0,opacity:.4,side:pn,depthWrite:!1,blending:Pi}));c.rotation.set(-Math.PI/2,0,0);const h=new Ne;h.position.set(e,.55,t),h.rotation.y=n,h.add(c),this.scene.add(h),this.items.push({m:h,t:0,dur:.16,from:1,to:1.08,op:.4})}update(e){this.items=this.items.filter(t=>{t.t+=e;const n=Math.min(1,t.t/t.dur);return t.m.scale.setScalar(t.from+(t.to-t.from)*n),t.m.traverse(i=>{const r=i.material;r&&(r.opacity=t.op*(1-n))}),n>=1?(this.scene.remove(t.m),t.m.traverse(i=>{const r=i;r.isMesh&&(r.geometry.dispose(),r.material.dispose())}),!1):!0})}}function NS(s,e,t=.5,n=.12){return new En({transparent:!0,depthWrite:!1,depthTest:!1,side:pn,fog:!1,toneMapped:!1,uniforms:{uColor:{value:new le(s)},uProg:{value:0},uShape:{value:e},uCos:{value:t},uInner:{value:n},uTime:{value:0},uAlpha:{value:1},uBoss:{value:new F(0,0,0)}},vertexShader:"varying vec2 vUv; varying vec2 vWp; void main(){ vUv = uv; vWp = (modelMatrix * vec4(position,1.0)).xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
      uniform vec3 uColor; uniform float uProg; uniform float uShape; uniform float uCos; uniform float uInner; uniform float uTime; uniform float uAlpha; uniform vec3 uBoss;
      varying vec2 vUv; varying vec2 vWp;
      void main(){
        float pulse = 0.75 + 0.25 * sin(uTime * (8.0 + 22.0 * uProg));
        float a = 0.0; float edge = 0.0; float fill = 0.0; float front = 0.0;
        if (uShape < 0.5) {
          vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard;
          edge = smoothstep(0.93, 0.97, d); fill = step(d, uProg);
          front = (1.0 - smoothstep(0.0, 0.03, abs(d - uProg))) * step(0.02, uProg);
        } else if (uShape < 1.5) {
          vec2 p = vUv * 2.0 - 1.0; float d = length(p); if (d > 1.0) discard;
          float c = d > 0.001 ? p.y / d : 1.0; if (c < uCos && d > uInner) discard;
          float ang = clamp((c - uCos) / max(0.0001, 1.0 - uCos), 0.0, 1.0);
          // the inner disc (CONE_INNER_R) outside the cone angle is interior, not edge: ang clamps to 0 there, which used to
          // paint the whole disc as solid edge over the boss face
          float side = c >= uCos ? (1.0 - smoothstep(0.0, 0.035, ang)) * step(uInner, d) : 0.0;
          edge = max(smoothstep(0.93, 0.97, d), side); fill = step(d, uProg);
          front = (1.0 - smoothstep(0.0, 0.03, abs(d - uProg))) * step(0.02, uProg);
        } else {
          float sx = abs(vUv.x - 0.5) * 2.0;
          edge = max(smoothstep(0.90, 0.96, sx), max(1.0 - smoothstep(0.0, 0.015, vUv.y), smoothstep(0.985, 1.0, vUv.y)));
          fill = step(vUv.y, uProg);
          front = (1.0 - smoothstep(0.0, 0.015, abs(vUv.y - uProg))) * step(0.01, uProg);
          float chev = step(0.5, fract(vUv.y * 10.0 - uTime * 2.0 + sx * 0.5)) * 0.35; fill = max(fill, chev);
        }
        // the edge (only) fades out on the floor under the boss body (uBoss.z = r; r = 0: no-op); fill and front keep showing
        // the countdown there
        edge *= smoothstep(uBoss.z - 0.4, uBoss.z, distance(vWp, uBoss.xy));
        // interior: ~0.08 before fill, ~0.25 after; thin edge (pulse rate unchanged, alpha 0.9..1 so the floor below never
        // washes the hue out) + progress front (0.6) keep the countdown readable
        a = max(max(edge * (0.8 + 0.2 * pulse), front * 0.6), mix(0.08, 0.25, fill));
        gl_FragColor = vec4(uColor, a * uAlpha);
        #include <colorspace_fragment>
      }`})}let sl=null;function DS(s){if(!sl){const t=document.createElement("canvas");t.width=t.height=64;const n=t.getContext("2d"),i=n.createRadialGradient(32,32,4,32,32,32);i.addColorStop(0,"rgba(20,30,40,0.55)"),i.addColorStop(1,"rgba(20,30,40,0)"),n.fillStyle=i,n.fillRect(0,0,64,64),sl=new $r(t)}const e=new at(new Uc(s*1.3,16),new Yt({map:sl,transparent:!0,depthWrite:!1}));return e.rotation.x=-Math.PI/2,e.position.y=.03,e.renderOrder=1,e}const Xr={low:{tier:"low",maxPixelRatio:1,shadows:!1,decoDensity:.45,groundRes:512,particles:90,glow:!0,rays:!1},medium:{tier:"medium",maxPixelRatio:1.5,shadows:!1,decoDensity:.8,groundRes:1024,particles:160,glow:!0,rays:!0},high:{tier:"high",maxPixelRatio:2,shadows:!0,decoDensity:1,groundRes:1024,particles:220,glow:!0,rays:!0}},qf="synes.quality";function US(){try{const s=localStorage.getItem(qf);if(s&&["auto","low","medium","high"].includes(s))return s}catch{}return"auto"}function FS(s){try{localStorage.setItem(qf,s)}catch{}}function Kf(){const e=navigator.deviceMemory,t=navigator.hardwareConcurrency||4,n=matchMedia("(pointer: coarse)").matches,i=new URLSearchParams(location.search).get("q");return i==="low"||i==="medium"||i==="high"?i:n?e!==void 0&&e<=3||t<=4?"low":"medium":t>=8?"high":"medium"}class Yf{constructor(e,t=.6){N(this,"frames",0);N(this,"acc",0);N(this,"goodWindows",0);N(this,"ratio");N(this,"fps",60);N(this,"max");N(this,"min");this.max=e,this.min=t,this.ratio=Math.min(e,window.devicePixelRatio||1)}sample(e){if(this.frames++,this.acc+=e,this.acc<1.5)return null;if(this.fps=this.frames/this.acc,this.frames=0,this.acc=0,this.fps<45&&this.ratio>this.min)return this.ratio=Math.max(this.min,+(this.ratio-.15).toFixed(2)),this.goodWindows=0,this.ratio;if(this.fps>58){if(++this.goodWindows>=3&&this.ratio<Math.min(this.max,window.devicePixelRatio||1))return this.ratio=Math.min(this.max,window.devicePixelRatio||1,+(this.ratio+.1).toFixed(2)),this.goodWindows=0,this.ratio}else this.goodWindows=0;return null}}const ot={lumen:new le(6091494),violet:new le(10980346),blossom:new le(16752327),gold:new le(16762967),teal:new le(2864035)},zt=(s,e=1)=>[s.r,s.g,s.b,e],xr=(s,e,t,n=1)=>[s.r+(e.r-s.r)*t,s.g+(e.g-s.g)*t,s.b+(e.b-s.b)*t,n],Et=s=>s<0?0:s>1?1:s,Ei=s=>1-(1-s)*(1-s),no=s=>s*s,oi=(s,e=0)=>{const t=Math.sin(s*127.1+e*311.7)*43758.5453;return t-Math.floor(t)};class rl{constructor(e,t,n){N(this,"mesh");N(this,"pos");N(this,"cols");N(this,"geo",new ft);N(this,"n",0);N(this,"cap");this.cap=t,this.pos=new Float32Array(t*9),this.cols=new Float32Array(t*12);const i=new Jt(this.pos,3).setUsage(Ja),r=new Jt(this.cols,4).setUsage(Ja);this.geo.setAttribute("position",i),this.geo.setAttribute("color",r),this.geo.setDrawRange(0,0),this.mesh=new at(this.geo,new Yt({vertexColors:!0,transparent:!0,depthWrite:!1,side:pn,fog:!1,forceSinglePass:!0})),this.mesh.frustumCulled=!1,this.mesh.renderOrder=n,this.mesh.visible=!1,e.add(this.mesh)}begin(){this.n=0}tri(e,t,n,i,r,a){if(this.n>=this.cap)return;const o=this.n*9,l=this.n*12;this.n++,this.pos.set(e,o),this.pos.set(t,o+3),this.pos.set(n,o+6),this.cols.set(i,l),this.cols.set(r,l+4),this.cols.set(a,l+8)}quad(e,t,n,i,r,a,o,l){this.tri(e,t,n,r,a,o),this.tri(e,n,i,r,o,l)}end(){this.geo.setDrawRange(0,this.n*3),this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.color.needsUpdate=!0,this.mesh.visible=this.n>0}dispose(){this.geo.dispose(),this.mesh.material.dispose(),this.mesh.removeFromParent()}}class OS{constructor(e,t,n){N(this,"chime");N(this,"cres");N(this,"crys");N(this,"hits",[null,null,null]);N(this,"enabled");N(this,"rich");this.enabled=n,this.rich=t!=="low",this.chime=new rl(e,150,5),this.cres=new rl(e,200,5),this.crys=new rl(e,330,5)}reset(){this.hits=[null,null,null]}dispose(){this.chime.dispose(),this.cres.dispose(),this.crys.dispose()}onSkillHit(e,t,n,i,r,a){this.hits[e-1]={t0:t,x:n,z:i,dx:r,dz:a}}hitAge(e,t,n){const i=this.hits[e-1];return i?this.age(i.t0,t,n):null}age(e,t,n){return Math.max(0,t-e-1+n)}update(e,t,n){if(this.chime.begin(),this.cres.begin(),this.crys.begin(),this.enabled){const i=this.hits[0],r=this.hits[1],a=this.hits[2];if(i){const o=this.age(i.t0,e,t);o<=12?this.drawChime(i,o):this.hits[0]=null}if(r){const o=this.age(r.t0,e,t);o<=8?this.drawCrescent(r,o):this.hits[1]=null}if(a){const o=this.age(a.t0,e,t);o<=14?this.drawCrystal(a,o,1,!0):this.hits[2]=null}else n&&n.slot===3&&n.tick<wt[2].hitTick&&this.drawCrystal(n,0,Math.max(.03,Et((n.tick-1+t)/wt[2].hitTick)),!1)}else this.hits[0]&&this.age(this.hits[0].t0,e,t)>12&&(this.hits[0]=null);this.chime.end(),this.cres.end(),this.crys.end()}drawChime(e,t){const n=wt[0].radius,i=Et(t/9),r=.5+(n-.5)*Ei(i),a=.7*(1-i*.65)+.1,o=Et(1-i*i),l=.1,c=36,h=this.chime;for(let d=0;d<c;d++){const f=d/c*Math.PI*2,p=(d+1)/c*Math.PI*2,x=Math.cos(f),m=Math.sin(f),g=Math.cos(p),v=Math.sin(p),y=r,_=Math.max(.05,r-a);h.quad([e.x+x*_,l,e.z+m*_],[e.x+x*y,l,e.z+m*y],[e.x+g*y,l,e.z+v*y],[e.x+g*_,l,e.z+v*_],zt(ot.lumen,o*.45),xr(ot.lumen,ot.gold,.3,o),xr(ot.lumen,ot.gold,.3,o),zt(ot.lumen,o*.45))}if(!this.rich)return;const u=Et(t/12);for(let d=0;d<8;d++){const f=d/8*Math.PI*2+oi(d,1)*.5,p=1.4+oi(d,2)*1.8,x=.6+p*Ei(u)*1.4;al(h,e.x+Math.cos(f)*x,.15+.9*u*(.5+oi(d,3)),e.z+Math.sin(f)*x,.11*(1-u*.6),d%2?zt(ot.lumen,1-u):zt(ot.gold,1-u),t*3+d)}}drawCrescent(e,t){const n=wt[1],i=n.radius,r=Math.acos(n.cosHalf??.642788),a=Et(1-t/8*(t/8)),o=Et((t+.4)/2.5),l=i,c=1.35,h=.2,u=.4,d=16,f=this.cres,p=-e.dz,x=e.dx,m=(_,S)=>[e.x+(Math.cos(_)*e.dx+Math.sin(_)*p)*S,u,e.z+(Math.cos(_)*e.dz+Math.sin(_)*x)*S],g=_=>l-c*Math.cos(_*Math.PI/2),v=Math.max(1,Math.ceil(d*o));for(let _=0;_<v;_++){const S=1-_/d*2,T=1-(_+1)/d*2,M=S*r,b=T*r,I=_===v-1?.35+.65*Et(o*d-_):1,R=m(M,l),D=m(b,l),L=m(M,l-h),C=m(b,l-h),A=m(M,g(S)),U=m(b,g(T)),z=a*Et(I);f.quad(L,R,D,C,zt(ot.blossom,z),zt(ot.blossom,z),zt(ot.blossom,z),zt(ot.blossom,z)),f.quad(A,L,C,U,zt(ot.violet,z*.25),zt(ot.violet,z*.9),zt(ot.violet,z*.9),zt(ot.violet,z*.25))}if(!this.rich)return;const y=Et(t/8);for(let _=0;_<10;_++){const S=(.5-(_+.5)/10)*2*r,T=l+.2+Ei(y)*(.6+oi(_,4)*.9),M=m(S,T);al(f,M[0],.35+.5*y*oi(_,5),M[2],.1*(1-y*.5),_%3?zt(ot.blossom,1-y):zt(ot.violet,1-y),t*3+_)}}drawCrystal(e,t,n,i){const r=wt[2],a=r.radius,o=e.x+e.dx*(r.ahead??2.6),l=e.z+e.dz*(r.ahead??2.6),c=this.crys,h=i?Et(1-no(Et((t-4)/10))):1,u=i?h:.35+.65*n,d=i?1:Ei(n);for(let m=0;m<8;m++){const g=m/8*Math.PI*2+oi(m,6)*.5,v=a*(.65+.35*oi(m,7))*d,y=(oi(m,8)-.5)*.7;let _=o,S=l;const T=.11;for(let M=1;M<=3;M++){const b=M/3,I=g+(M===2?y:M===3?-y*.6:0),R=_+Math.cos(I)*(v/3),D=S+Math.sin(I)*(v/3),L=-Math.sin(I)*T*(1.15-b*.6),C=Math.cos(I)*T*(1.15-b*.6);c.quad([_-L,.09,S-C],[_+L,.09,S+C],[R+L*.7,.09,D+C*.7],[R-L*.7,.09,D-C*.7],xr(ot.teal,ot.gold,i?.3:0,u),xr(ot.teal,ot.gold,i?.3:0,u),zt(ot.teal,u*.8),zt(ot.teal,u*.8)),_=R,S=D}}if(!i)return;const f=Ei(Et(t/3)),p=1-no(Et((t-8)/6)),x=f*p;if(this.rich){const m=[[0,0,1.7,.3],[.95,.2,1.15,.24],[0,.95,1,.22],[-.95,.1,1.25,.25],[.1,-.9,.9,.22]];for(let v=0;v<m.length;v++)Qu(c,o+m[v][0],l+m[v][1],m[v][3]*1.5,m[v][2]*1.35*x,3,v*.9,m[v][0]*.12,m[v][1]*.12);const g=Et(t/14);for(let v=0;v<7;v++){const y=v/7*Math.PI*2+oi(v,9),_=.4+(.6+oi(v,10)*.9)*Ei(g),S=.3+4.2*g*(1-g);al(c,o+Math.cos(y)*_,.1+S,l+Math.sin(y)*_,.12*(1-g*.7),v%2?zt(ot.gold,1-g):zt(ot.teal,1-g),t*2+v)}}else Qu(c,o,l,.7,.85*x,6,.3,0,0)}}function al(s,e,t,n,i,r,a){const o=Math.cos(a),l=Math.sin(a),c=[e,t+i*1.7,n],h=[e,t-i*1.7,n],u=[[e+o*i,t,n+l*i],[e-l*i,t,n+o*i],[e-o*i,t,n-l*i],[e+l*i,t,n-o*i]],d=[r[0],r[1],r[2],r[3]*.8];for(let f=0;f<4;f++){const p=(f+1)%4;s.tri(c,u[f],u[p],r,d,d),s.tri(h,u[p],u[f],d,d,d)}}function Qu(s,e,t,n,i,r,a,o,l){if(i<=.01)return;const c=[e+o*i,i,t+l*i],h=[];for(let p=0;p<r;p++){const x=a+p/r*Math.PI*2;h.push([e+Math.cos(x)*n,.02,t+Math.sin(x)*n])}const u=zt(ot.teal,.95),d=zt(ot.gold,1),f=xr(ot.teal,ot.lumen,.4,.95);for(let p=0;p<r;p++)s.tri(h[p],h[(p+1)%r],c,p%2?u:f,p%2?f:u,d)}const xn=(s,e,t)=>s+(e-s)*Et(t);function ju(s,e){if(s===1){const o=Ei(Et(e/8)),l=no(Et((e-8)/2)),c=Et((e-11)/5),h=e<8?xn(-.35,-.15,o):e<10?xn(-.15,1.35,l):xn(1.35,-.35,c);return{dy:e<8?.6*o:e<10?xn(.6,.05,l):.05*(1-c),rx:h,ry:0,lean:e<8?-.08*o:xn(-.08,.2,l)*(1-c),hop:.12*o*(1-c)}}if(s===2){const o=Ei(Et(e/4)),l=Et((e-4)/4),c=Et((e-8)/4),h=e<4?xn(1.4,2.3,o):e<8?xn(2.3,-1.6,l):xn(-1.6,0,c);return{dy:.12*(1-c),rx:xn(-1.2,-.35,c),ry:h,lean:e<4?-.1*o:xn(-.1,.18,l)*(1-c),hop:0}}const n=Ei(Et(e/11)),i=no(Et((e-11)/4)),r=Et((e-18)/6),a=e<11?xn(-.35,-.2,n):xn(-.2,3,i);return{dy:e<11?.65*n:xn(.65,0,i),rx:e<18?a:xn(3,-.35,r),ry:0,lean:e<11?-.12*n:xn(-.12,.4,i)*(1-r),hop:.1*n*(1-i)}}function kS(s=typeof location>"u"?"":location.search){const e=new URLSearchParams(s).get("vfx");return e==="B"||e==="b"?"B":e==="cur"?"cur":"A"}const Bt={lumen:6091494,violet:10980346,teal:2864035,lumenHi:13040374,orchid:13866466,white:16777215},ol={A:{id:"A",chimePrep:{sheathW:.1,sheathA:.55,tipR:.34,tipA:.95,motes:0},chime:{band:.7,echo:0,shards:8,shardsLow:0,shardSize:.11},crescent:{y0:.35,y1:.7,thick:1.35,edge:.22,life:9,curtain:0,shards:10,shardsLow:0},crystal:{scale:1,lowCrystals:1,shards:7,shardsLow:0,crackA:1,crackGlints:!1},hit:{y:1.05,r:.36,rays:4,life:4,parts:10,partSize:1.15,partUp:3.2,shards:8,shardSize:.18},perfect:{echo:!1,parts:16},ring:{r:.62,core:.035,glow:0,alpha:.92,glowA:0,hi:0},sparkles:{share:.5,field:{low:0,medium:.45,high:.45},size:1,bright:1}},B:{id:"B",chimePrep:{sheathW:.16,sheathA:.7,tipR:.46,tipA:1,motes:6},chime:{band:.85,echo:1,shards:12,shardsLow:4,shardSize:.14},crescent:{y0:.3,y1:.85,thick:1.6,edge:.26,life:11,curtain:.9,shards:14,shardsLow:5},crystal:{scale:1.25,lowCrystals:3,shards:11,shardsLow:4,crackA:1.25,crackGlints:!0},hit:{y:1.05,r:.56,rays:6,life:5,parts:14,partSize:1.4,partUp:4.2,shards:14,shardSize:.25},perfect:{echo:!0,parts:24},ring:{r:.62,core:.03,glow:.08,alpha:.95,glowA:.3,hi:.4},sparkles:{share:1,field:{low:.6,medium:.8,high:.8},size:1.35,bright:1.35}}},Fe={lumen:new le(Bt.lumen),violet:new le(Bt.violet),teal:new le(Bt.teal),hi:new le(Bt.lumenHi),orchid:new le(Bt.orchid),white:new le(Bt.white)},_t=(s,e=1)=>[s.r,s.g,s.b,e],Vt=(s,e,t,n=1)=>[s.r+(e.r-s.r)*t,s.g+(e.g-s.g)*t,s.b+(e.b-s.b)*t,n],Ct=s=>s<0?0:s>1?1:s,Bi=s=>1-(1-s)*(1-s),ed=s=>s*s,qn=(s,e=0)=>{const t=Math.sin(s*127.1+e*311.7)*43758.5453;return t-Math.floor(t)};class Ga{constructor(e,t,n,i=!0){N(this,"mesh");N(this,"pos");N(this,"cols");N(this,"geo",new ft);N(this,"n",0);N(this,"cap");this.cap=t,this.pos=new Float32Array(t*9),this.cols=new Float32Array(t*12);const r=new Jt(this.pos,3).setUsage(Ja),a=new Jt(this.cols,4).setUsage(Ja);this.geo.setAttribute("position",r),this.geo.setAttribute("color",a),this.geo.setDrawRange(0,0),this.mesh=new at(this.geo,new Yt({vertexColors:!0,transparent:!0,depthWrite:!1,depthTest:i,side:pn,fog:!1,forceSinglePass:!0})),this.mesh.frustumCulled=!1,this.mesh.renderOrder=n,this.mesh.visible=!1,e.add(this.mesh)}begin(){this.n=0}tri(e,t,n,i,r,a){if(this.n>=this.cap)return;const o=this.n*9,l=this.n*12;this.n++,this.pos.set(e,o),this.pos.set(t,o+3),this.pos.set(n,o+6),this.cols.set(i,l),this.cols.set(r,l+4),this.cols.set(a,l+8)}quad(e,t,n,i,r,a,o,l){this.tri(e,t,n,r,a,o),this.tri(e,n,i,r,o,l)}end(){this.geo.setDrawRange(0,this.n*3);const e=this.geo.attributes.position,t=this.geo.attributes.color;e.clearUpdateRanges(),t.clearUpdateRanges(),this.n>0&&(e.addUpdateRange(0,this.n*9),t.addUpdateRange(0,this.n*12),e.needsUpdate=!0,t.needsUpdate=!0),this.mesh.visible=this.n>0}dispose(){this.geo.dispose(),this.mesh.material.dispose(),this.mesh.removeFromParent()}}class $f{constructor(){N(this,"r",new F(1,0,0));N(this,"u",new F(0,1,0));N(this,"f",new F(0,0,-1));N(this,"pos",new F)}from(e){if(!e)return this;const t=e.matrixWorld.elements;return this.r.set(t[0],t[1],t[2]).normalize(),this.u.set(t[4],t[5],t[6]).normalize(),this.f.set(-t[8],-t[9],-t[10]).normalize(),this.pos.set(t[12],t[13],t[14]),this}}function Jf(s,e,t,n,i,r,a,o,l=.22,c=.11){if(n<=.005)return;const h=n*c,u=[o[0],o[1],o[2],0];for(let p=0;p<i;p++){const x=r+p/i*Math.PI*2,m=n*(p%2?.62:1),g=Math.cos(x),v=Math.sin(x),y=-v,_=g,S=(I,R)=>[t[0]+e.r.x*I+e.u.x*R,t[1]+e.r.y*I+e.u.y*R,t[2]+e.r.z*I+e.u.z*R],T=S(g*m,v*m),M=S(y*h,_*h),b=S(-y*h,-_*h);s.tri(M,T,b,o,u,o),s.tri(M,b,t,o,o,a)}const d=n*l,f=[a[0],a[1],a[2],0];for(let p=0;p<6;p++){const x=p/6*Math.PI*2,m=(p+1)/6*Math.PI*2,g=[t[0]+(e.r.x*Math.cos(x)+e.u.x*Math.sin(x))*d,t[1]+(e.r.y*Math.cos(x)+e.u.y*Math.sin(x))*d,t[2]+(e.r.z*Math.cos(x)+e.u.z*Math.sin(x))*d],v=[t[0]+(e.r.x*Math.cos(m)+e.u.x*Math.sin(m))*d,t[1]+(e.r.y*Math.cos(m)+e.u.y*Math.sin(m))*d,t[2]+(e.r.z*Math.cos(m)+e.u.z*Math.sin(m))*d];s.tri(t,g,v,a,f,f)}}function zS(s,e,t,n,i,r){if(n<=.005||r<=.01)return;const a=[i.r,i.g,i.b,r],o=[i.r,i.g,i.b,0];for(let l=0;l<8;l++){const c=l/8*Math.PI*2,h=(l+1)/8*Math.PI*2,u=[t[0]+(e.r.x*Math.cos(c)+e.u.x*Math.sin(c))*n,t[1]+(e.r.y*Math.cos(c)+e.u.y*Math.sin(c))*n,t[2]+(e.r.z*Math.cos(c)+e.u.z*Math.sin(c))*n],d=[t[0]+(e.r.x*Math.cos(h)+e.u.x*Math.sin(h))*n,t[1]+(e.r.y*Math.cos(h)+e.u.y*Math.sin(h))*n,t[2]+(e.r.z*Math.cos(h)+e.u.z*Math.sin(h))*n];s.tri(t,u,d,a,o,o)}}function hc(s,e,t,n,i,r,a,o){if(n<=.004||o<=.01)return;const l=Math.cos(i),c=Math.sin(i),h=n*1.6,u=(g,v)=>{const y=g*l-v*c,_=g*c+v*l;return[t[0]+e.r.x*y+e.u.x*_,t[1]+e.r.y*y+e.u.y*_,t[2]+e.r.z*y+e.u.z*_]},d=u(0,h),f=u(0,-h),p=u(-n,0),x=u(n,0),m=u(n*.15,h*.1);s.tri(d,p,m,_t(r,o),_t(r,o),Vt(r,a,.3,o)),s.tri(d,m,x,Vt(r,a,.45,o),Vt(r,a,.3,o),Vt(r,a,.6,o)),s.tri(p,f,m,Vt(r,a,.35,o),Vt(r,a,.7,o),Vt(r,a,.3,o)),s.tri(m,f,x,Vt(r,a,.6,o),_t(a,o),_t(a,o))}class BS{constructor(e,t,n,i){N(this,"chime");N(this,"cres");N(this,"crys");N(this,"hits",[null,null,null]);N(this,"enabled");N(this,"rich");N(this,"st");N(this,"cam",null);N(this,"blade",null);N(this,"tipL",new F(-.31,.77,.22));N(this,"baseL",new F(-.05,.16,.05));N(this,"F",new $f);N(this,"tipW",new F);N(this,"baseW",new F);this.enabled=n,this.rich=t!=="low",this.st=i,this.chime=new Ga(e,320,5),this.cres=new Ga(e,420,5),this.crys=new Ga(e,520,5)}attach(e,t){if(this.cam=e,this.blade=t,!t)return;t.updateWorldMatrix(!0,!0);const n=t.matrixWorld.clone().invert(),i=new F;let r=0;t.traverse(a=>{const o=a;if(!o.isMesh)return;const l=o.geometry.attributes.position;for(let c=0;c<l.count;c++){i.fromBufferAttribute(l,c).applyMatrix4(o.matrixWorld).applyMatrix4(n);const h=i.length();h>r&&(r=h,this.tipL.copy(i))}}),r>.2&&this.baseL.copy(this.tipL).multiplyScalar(.2)}reset(){this.hits=[null,null,null]}dispose(){this.chime.dispose(),this.cres.dispose(),this.crys.dispose()}onSkillHit(e,t,n,i,r,a){this.hits[e-1]={t0:t,x:n,z:i,dx:r,dz:a}}hitAge(e,t,n){const i=this.hits[e-1];return i?this.age(i.t0,t,n):null}age(e,t,n){return Math.max(0,t-e-1+n)}update(e,t,n){this.chime.begin(),this.cres.begin(),this.crys.begin(),this.F.from(this.cam);const i=this.st;if(this.enabled){const r=this.hits[0],a=this.hits[1],o=this.hits[2];if(n&&n.slot===1&&n.tick<wt[0].hitTick&&this.drawChimePrep((n.tick-1+t)/wt[0].hitTick,e+t),r){const l=this.age(r.t0,e,t);l<=12?this.drawChime(r,l):this.hits[0]=null}if(a){const l=this.age(a.t0,e,t);l<=i.crescent.life?this.drawCrescent(a,l):this.hits[1]=null}if(o){const l=this.age(o.t0,e,t);l<=14?this.drawCrystal(o,l,1,!0):this.hits[2]=null}else n&&n.slot===3&&n.tick<wt[2].hitTick&&this.drawCrystal(n,0,Math.max(.03,Ct((n.tick-1+t)/wt[2].hitTick)),!1)}else this.hits[0]&&this.age(this.hits[0].t0,e,t)>12&&(this.hits[0]=null);this.chime.end(),this.cres.end(),this.crys.end()}drawChimePrep(e,t){if(!this.blade)return;const n=this.st.chimePrep,i=this.F,r=this.chime;e=Ct(e),this.blade.updateWorldMatrix(!0,!1);const a=this.tipW.copy(this.tipL).applyMatrix4(this.blade.matrixWorld),o=this.baseW.copy(this.baseL).applyMatrix4(this.blade.matrixWorld),l=Bi(Ct(e/.8)),c=1+.5*Ct((e-.8)/.2),h=a.x-o.x,u=a.y-o.y,d=a.z-o.z,f=a.x-i.pos.x,p=a.y-i.pos.y,x=a.z-i.pos.z;let m=u*x-d*p,g=d*f-h*x,v=h*p-u*f;const y=Math.hypot(m,g,v)||1,_=n.sheathW*l*c;m=m/y*_,g=g/y*_,v=v/y*_;const S=n.sheathA*l,T=Vt(Fe.lumen,Fe.hi,.3,S),M=_t(Fe.lumen,0),b=_t(Fe.lumen,S*.35),I=[o.x,o.y,o.z],R=[a.x,a.y,a.z];for(const L of[1,-1]){const C=[o.x+m*L*.6,o.y+g*L*.6,o.z+v*L*.6],A=[a.x+m*L,a.y+g*L,a.z+v*L];r.quad(I,C,A,R,b,M,M,T)}const D=n.tipR*(.25+.75*l)*c;zS(r,i,R,D*.75,Fe.violet,.42*n.tipA*l),Jf(r,i,R,D,4,Math.PI/4+e*.8,_t(Fe.white,n.tipA*l),_t(Fe.lumen,n.tipA*l),.34,.17);for(let L=0;L<n.motes;L++){const C=qn(L,21),A=.95*(1-Bi(Ct(e*1.15-C*.15))),U=L/n.motes*Math.PI*2+t*.12+C;if(A<.04)continue;const z=[a.x+(i.r.x*Math.cos(U)+i.u.x*Math.sin(U))*A,a.y+(i.r.y*Math.cos(U)+i.u.y*Math.sin(U))*A,a.z+(i.r.z*Math.cos(U)+i.u.z*Math.sin(U))*A];hc(r,i,z,.035+.02*l,U,Fe.hi,L%2?Fe.violet:Fe.lumen,Ct(l*1.2))}}drawChime(e,t){const n=this.st.chime,i=wt[0].radius,r=Ct(t/9),a=.5+(i-.5)*Bi(r),o=n.band*(1-r*.65)+.1,l=Ct(1-r*r),c=.1,h=36,u=this.chime,d=(x,m,g,v)=>{for(let y=0;y<h;y++){const _=y/h*Math.PI*2,S=(y+1)/h*Math.PI*2,T=Math.cos(_),M=Math.sin(_),b=Math.cos(S),I=Math.sin(S),R=x,D=Math.max(.05,x-m);u.quad([e.x+T*D,c,e.z+M*D],[e.x+T*R,c,e.z+M*R],[e.x+b*R,c,e.z+I*R],[e.x+b*D,c,e.z+I*D],g,v,v,g)}};if(d(a,o,_t(Fe.lumen,l*.45),Vt(Fe.lumen,Fe.hi,.55,l)),n.echo){const x=Math.max(.3,a*.72);d(x,.12+.1*(1-r),_t(Fe.white,0),_t(Fe.white,l*.85*n.echo))}const f=this.rich?n.shards:n.shardsLow,p=Ct(t/12);for(let x=0;x<f;x++){const m=x/f*Math.PI*2+qn(x,1)*.5,g=1.4+qn(x,2)*1.8,v=.6+g*Bi(p)*1.4;ll(u,e.x+Math.cos(m)*v,.15+.9*p*(.5+qn(x,3)),e.z+Math.sin(m)*v,n.shardSize*(1-p*.6),x%2?_t(Fe.lumen,1-p):_t(Fe.violet,1-p),t*3+x)}}drawCrescent(e,t){const n=this.st.crescent,i=wt[1],r=i.radius,a=Math.acos(i.cosHalf??.642788),o=n.life,l=Ct(1-t/o*(t/o)),c=Ct((t+.4)/2.5),h=r,u=16,d=this.cres,f=-e.dz,p=e.dx,x=T=>n.y0+(n.y1-n.y0)*Ct((T-(h-n.thick))/n.thick),m=(T,M,b=x(M))=>[e.x+(Math.cos(T)*e.dx+Math.sin(T)*f)*M,b,e.z+(Math.cos(T)*e.dz+Math.sin(T)*p)*M],g=T=>h-n.thick*Math.cos(T*Math.PI/2),v=Math.max(1,Math.ceil(u*c)),y=n.curtain*(.55+.45*(1-Ct(t/o)));for(let T=0;T<v;T++){const M=1-T/u*2,b=1-(T+1)/u*2,I=M*a,R=b*a,D=T===v-1?.35+.65*Ct(c*u-T):1,L=m(I,h),C=m(R,h),A=m(I,h-n.edge),U=m(R,h-n.edge),z=m(I,g(M)),B=m(R,g(b)),K=l*Ct(D);if(d.quad(A,L,C,U,_t(Fe.orchid,K),Vt(Fe.orchid,Fe.white,.5,K),Vt(Fe.orchid,Fe.white,.5,K),_t(Fe.orchid,K)),d.quad(z,A,U,B,_t(Fe.violet,K*.3),_t(Fe.violet,K*.95),_t(Fe.violet,K*.95),_t(Fe.violet,K*.3)),y>.01){const X=y*Math.cos(M*Math.PI/2),j=y*Math.cos(b*Math.PI/2);d.quad(L,C,[C[0],C[1]+j,C[2]],[L[0],L[1]+X,L[2]],Vt(Fe.orchid,Fe.white,.35,K*.75),Vt(Fe.orchid,Fe.white,.35,K*.75),_t(Fe.violet,0),_t(Fe.violet,0))}}const _=this.rich?n.shards:n.shardsLow,S=Ct(t/o);for(let T=0;T<_;T++){const M=(.5-(T+.5)/_)*2*a,b=h+.2+Bi(S)*(.6+qn(T,4)*.9),I=m(M,b,0);ll(d,I[0],n.y1+.5*S*qn(T,5),I[2],.1*(1-S*.5)*(n.curtain?1.25:1),T%3?_t(Fe.orchid,1-S):_t(Fe.violet,1-S),t*3+T)}}drawCrystal(e,t,n,i){const r=this.st.crystal,a=wt[2],o=a.radius,l=e.x+e.dx*(a.ahead??2.6),c=e.z+e.dz*(a.ahead??2.6),h=this.crys,u=i?Ct(1-ed(Ct((t-4)/10))):1,d=Ct((i?u:.35+.65*n)*r.crackA*.8),f=i?1:Bi(n);for(let _=0;_<8;_++){const S=_/8*Math.PI*2+qn(_,6)*.5,T=o*(.65+.35*qn(_,7))*f,M=(qn(_,8)-.5)*.7;let b=l,I=c;const R=.1;for(let D=1;D<=3;D++){const L=D/3,C=S+(D===2?M:D===3?-M*.6:0),A=b+Math.cos(C)*(T/3),U=I+Math.sin(C)*(T/3),z=-Math.sin(C)*R*(1.15-L*.6),B=Math.cos(C)*R*(1.15-L*.6);h.quad([b-z,.09,I-B],[b+z,.09,I+B],[A+z*.7,.09,U+B*.7],[A-z*.7,.09,U-B*.7],Vt(Fe.lumen,Fe.hi,i?.5:.2,d),Vt(Fe.lumen,Fe.hi,i?.5:.2,d),Vt(Fe.lumen,Fe.violet,.35,d*.8),Vt(Fe.lumen,Fe.violet,.35,d*.8)),b=A,I=U}if(r.crackGlints&&!i&&n>.25){const D=Ct((n-.25)/.5)*(.6+.4*Math.sin(n*18+_*2.1));hc(h,this.F,[b,.16,I],.05,_,Fe.hi,Fe.lumen,D)}}if(!i)return;const p=Bi(Ct(t/3)),x=1-ed(Ct((t-8)/6)),m=p*x*r.scale,g=[[0,0,1.7,.3],[.95,.2,1.15,.24],[0,.95,1,.22],[-.95,.1,1.25,.25],[.1,-.9,.9,.22]];if(this.rich)for(let _=0;_<g.length;_++)cl(h,l+g[_][0],c+g[_][1],g[_][3]*1.5,g[_][2]*1.35*m,3,_*.9,g[_][0]*.12,g[_][1]*.12);else if(r.lowCrystals<=1)cl(h,l,c,.7,.85*m,6,.3,0,0);else for(let _=0;_<Math.min(r.lowCrystals,g.length);_++)cl(h,l+g[_][0]*.8,c+g[_][1]*.8,g[_][3]*1.6,g[_][2]*1.2*m,3,_*.9,g[_][0]*.1,g[_][1]*.1);const v=this.rich?r.shards:r.shardsLow,y=Ct(t/14);for(let _=0;_<v;_++){const S=_/v*Math.PI*2+qn(_,9),T=.4+(.6+qn(_,10)*.9)*Bi(y)*r.scale,M=.3+4.2*y*(1-y)*r.scale;ll(h,l+Math.cos(S)*T,.1+M,c+Math.sin(S)*T,.12*(1-y*.7)*r.scale,_%2?_t(Fe.violet,1-y):_t(Fe.lumen,1-y),t*2+_)}}}function ll(s,e,t,n,i,r,a){const o=Math.cos(a),l=Math.sin(a),c=[e,t+i*1.7,n],h=[e,t-i*1.7,n],u=[[e+o*i,t,n+l*i],[e-l*i,t,n+o*i],[e-o*i,t,n-l*i],[e+l*i,t,n-o*i]],d=[r[0],r[1],r[2],r[3]*.8];for(let f=0;f<4;f++){const p=(f+1)%4;s.tri(c,u[f],u[p],r,d,d),s.tri(h,u[p],u[f],d,d,d)}}function cl(s,e,t,n,i,r,a,o,l){if(i<=.01)return;const c=[e+o*i,i,t+l*i],h=[];for(let p=0;p<r;p++){const x=a+p/r*Math.PI*2;h.push([e+Math.cos(x)*n,.02,t+Math.sin(x)*n])}const u=Vt(Fe.violet,Fe.lumen,.12,.95),d=_t(Fe.hi,1),f=_t(Fe.lumen,.95);for(let p=0;p<r;p++)s.tri(h[p],h[(p+1)%r],c,p%2?u:f,p%2?f:u,d)}function Qr(){try{const s=new URLSearchParams(location.search).get("arena")?.toUpperCase();return s==="B"?"B":s==="0"||s==="BASE"?"base":"A"}catch{return"A"}}const io={x:5.2,z:-15.2,yaw:-.3};function uc(s,e,t=io){const n=Math.cos(t.yaw),i=Math.sin(t.yaw);return{x:t.x+s*n+e*i,z:t.z-s*i+e*n}}const GS=[9211048,8618912,9803184,8289947],HS=[9078684,8354963,9670565,8749722],qr={A:{floor:{centre:[102,100,114],edge:[79,82,95],groove:"#3e5444",grooveW:.055,jitter:.07},crystalSelf:.42,shrineStone:[11117755,10328240,11709891,10723254],pillarGlow:1},B:{floor:{centre:[169,166,188],edge:[124,124,144],groove:"#5a7556",grooveW:.055,jitter:.06},crystalSelf:.62,shrineStone:[13223384,12433870,13815520,12828627],pillarGlow:1.8}};function VS(s,e=Qr()){if(!(e==="base"||qr[e].pillarGlow===1))for(const t of s)t.traverse(n=>{const i=n.material;n.isMesh&&i&&"emissiveIntensity"in i&&(i.emissiveIntensity*=qr[e].pillarGlow)})}const WS=[93,120,92];function XS(s,e){const t=qr[e.look].floor,n=jr(e.seed*7919+101),i=e.size/e.px/2,r=2.1/e.px,a=Math.max(t.grooveW,r);s.fillStyle=t.groove,s.fillRect(0,0,e.size,e.size);const o=1.38,l=Math.ceil(2*i/o)+2,c=[];for(let f=0;f<l;f++)for(let p=0;p<l;p++){const x=n()<.11,m=-i-o+(p+.5+(n()-.5)*.85)*o,g=-i-o+(f+.5+(n()-.5)*.85)*o;x||c.push([m,g])}const h=f=>e.mid+f*e.px,u=f=>e.mid+f*e.px,d=[];for(let f=0;f<c.length;f++){const[p,x]=c[f];let m=[[p-3,x-3],[p+3,x-3],[p+3,x+3],[p-3,x+3]];for(let A=0;A<c.length&&m.length>2;A++){if(A===f)continue;const U=c[A][0]-p,z=c[A][1]-x,B=Math.hypot(U,z);if(B>4.2)continue;const K=U/B,X=z/B,j=B/2-a/2;m=qS(m,p,x,K,X,j),A>f&&B<2.4&&n()<.5&&d.push([p+U/2,x+z/2,n(),n(),n()])}if(m.length<3)continue;let g=0,v=0;for(const A of m)g+=A[0],v+=A[1];g/=m.length,v/=m.length;const y=Math.min(1.3,Math.hypot(g,v)/e.arenaR),_=nd(.08,1,y),S=1+(n()-.5)*2*t.jitter,T=(n()-.5)*10,M=y>.7&&n()<.28*(y-.55)/.45,b=[0,1,2].map(A=>(t.centre[A]+(t.edge[A]-t.centre[A])*_)*S+(A===2?T:A===0?-T*.4:0));if(M)for(let A=0;A<3;A++)b[A]=b[A]*.55+WS[A]*.45;const I=()=>KS(s,m,h,u,.16);I(),s.fillStyle=e1(b),s.fill(),s.save(),I(),s.clip();const R=Math.max(.6,Math.sqrt(td(m)))*e.px*.75,D=s.createRadialGradient(h(g-.12),u(v-.15),R*.15,h(g),u(v),R);D.addColorStop(0,"rgba(232,230,248,0.10)"),D.addColorStop(.7,"rgba(232,230,248,0)"),D.addColorStop(1,"rgba(26,28,40,0.16)"),s.fillStyle=D,s.fillRect(h(g)-R*1.5,u(v)-R*1.5,R*3,R*3);const L=td(m),C=Math.round(L*7);for(let A=0;A<C;A++)s.fillStyle=n()<.5?"rgba(214,216,232,0.09)":"rgba(30,32,44,0.10)",s.fillRect(h(g+(n()-.5)*2),u(v+(n()-.5)*2),(.05+n()*.16)*e.px,(.03+n()*.1)*e.px);if(M||y>.55&&n()<.2){s.fillStyle="rgba(93,120,92,0.38)";const A=m[Math.floor(n()*m.length)];s.beginPath(),s.ellipse(h(A[0]),u(A[1]),(.25+n()*.3)*e.px,(.18+n()*.2)*e.px,n()*3,0,Math.PI*2),s.fill()}if(n()<.22){const A=n()*Math.PI,U=.35+n()*.5;s.beginPath(),s.moveTo(h(g-Math.cos(A)*U),u(v-Math.sin(A)*U)),s.lineTo(h(g+(n()-.5)*.2),u(v+(n()-.5)*.2)),s.lineTo(h(g+Math.cos(A+.5)*U*.8),u(v+Math.sin(A+.5)*U*.8)),s.strokeStyle="rgba(40,42,58,0.45)",s.lineWidth=Math.max(1,.02*e.px),s.stroke()}s.restore()}for(const[f,p,x,m,g]of d){const v=Math.hypot(f,p)/e.arenaR;if(x>.12+.75*nd(.25,1,v))continue;const y=3+Math.floor(m*4);for(let _=0;_<y;_++){const S=_/y*Math.PI*2+g*6,T=(.07+(m*7+_*.37)%1*.08)*e.px;s.strokeStyle=_%2?"#7fa86a":"#5e8a55",s.lineWidth=Math.max(1,.025*e.px),s.beginPath(),s.moveTo(h(f),u(p)),s.lineTo(h(f)+Math.cos(S)*T,u(p)+Math.sin(S)*T),s.stroke()}if(g<.3+.4*v){s.fillStyle=g<.15?"#d9ccff":"#a78bfa";const _=Math.max(1.2,.045*e.px);for(let S=0;S<2+Math.floor(g*6);S++)s.beginPath(),s.arc(h(f+(x-.06)*.5+S*.05),u(p+(m-.5)*.12-S*.03),_,0,Math.PI*2),s.fill()}}}function qS(s,e,t,n,i,r){const a=[],o=l=>(l[0]-e)*n+(l[1]-t)*i-r;for(let l=0;l<s.length;l++){const c=s[l],h=s[(l+1)%s.length],u=o(c),d=o(h);if(u<=0&&a.push(c),u<=0!=d<=0){const f=u/(u-d);a.push([c[0]+(h[0]-c[0])*f,c[1]+(h[1]-c[1])*f])}}return a}function td(s){let e=0;for(let t=0;t<s.length;t++){const n=s[t],i=s[(t+1)%s.length];e+=n[0]*i[1]-i[0]*n[1]}return Math.abs(e)/2}function KS(s,e,t,n,i){s.beginPath();const r=e.length;for(let a=0;a<r;a++){const o=e[(a+r-1)%r],l=e[a],c=e[(a+1)%r],h=Math.hypot(o[0]-l[0],o[1]-l[1]),u=Math.hypot(c[0]-l[0],c[1]-l[1]),d=Math.min(.45,i/Math.max(1e-6,h)),f=Math.min(.45,i/Math.max(1e-6,u)),p=l[0]+(o[0]-l[0])*d,x=l[1]+(o[1]-l[1])*d,m=l[0]+(c[0]-l[0])*f,g=l[1]+(c[1]-l[1])*f;a===0?s.moveTo(t(p),n(x)):s.lineTo(t(p),n(x)),s.quadraticCurveTo(t(l[0]),n(l[1]),t(m),n(g))}s.closePath()}const Zf=[[-5.35,-16.75,7.5,1.25,1.9,0],[io.x+.5,-17,8.2,1.5,2.3,.37]];function YS(s,e,t,n=Qr()){if(n==="base")return null;const i=new Ne;i.name="arena_deco";const r=JS(s,e.decoDensity,t),a=QS(s),o=jS(s);return i.add(r.mesh,a.mesh,o.mesh),{group:i,update(l){r.uTime.value=l,a.map.offset.y=l*.85%1,o.uTime.value=l},dispose(){for(const l of[r.mesh,a.mesh,o.mesh])l.geometry.dispose(),l.material.dispose();r.mesh.dispose(),r.map.dispose(),a.map.dispose()}}}function $S(){const s=document.createElement("canvas");s.width=128,s.height=64;const e=s.getContext("2d"),t=jr(77);for(let i=0;i<13;i++){const r=32+(t()-.5)*18,a=6+t()*22,o=(t()-.5)*34,l=2.2+t()*2.2,c=e.createLinearGradient(0,64,0,a);c.addColorStop(0,"#3e6a43"),c.addColorStop(.55,"#5f9156"),c.addColorStop(1,i%3?"#9cc77f":"#b5d88e"),e.fillStyle=c,e.beginPath(),e.moveTo(r-l,64),e.quadraticCurveTo(r+o*.3,40,r+o,a),e.quadraticCurveTo(r+o*.3+1,40,r+l,64),e.closePath(),e.fill()}for(let i=0;i<6;i++){const r=76+i*8+(t()-.5)*4,a=14+t()*26;e.strokeStyle="#4f7d4c",e.lineWidth=2,e.beginPath(),e.moveTo(r,64),e.quadraticCurveTo(r+(t()-.5)*8,(64+a)/2,r+(t()-.5)*6,a),e.stroke(),e.fillStyle="#5f9156",e.beginPath(),e.ellipse(r+3,54-t()*6,5,2,-.6,0,Math.PI*2),e.fill()}for(let i=0;i<6;i++){const r=76+i*8+(t()-.5)*6,a=12+t()*26,o=3.2+t()*1.6,l=i%3===2?"#c8b6ff":"#a78bfa";e.fillStyle=l;for(let c=0;c<5;c++){const h=c*1.2566+t()*.2;e.beginPath(),e.arc(r+Math.cos(h)*o,a+Math.sin(h)*o,o*.72,0,Math.PI*2),e.fill()}e.fillStyle="#f4f0ff",e.beginPath(),e.arc(r,a,o*.45,0,Math.PI*2),e.fill()}const n=new $r(s);return n.colorSpace=Dt,n.anisotropy=2,n}function JS(s,e,t){const n=[],i=[],r=[],a=[];for(const _ of[0,Math.PI/2]){const S=Math.cos(_)*.5,T=-Math.sin(_)*.5;for(const M of[!1,!0]){const b=n.length/3,I=[[-S,0,-T,0,0],[S,0,T,1,0],[S,1,T,1,1],[-S,1,-T,0,1]];for(const[R,D,L,C,A]of I)n.push(R,D,L),i.push(C,A),r.push(0,1,0);M?a.push(b,b+2,b+1,b,b+3,b+2):a.push(b,b+1,b+2,b,b+2,b+3)}}const o=new ft;o.setAttribute("position",new Le(n,3)),o.setAttribute("uv",new Le(i,2)),o.setAttribute("normal",new Le(r,3)),o.setIndex(a);const l=jr(t*131+7),c=[],h=Math.round(64*e);for(let _=0;_<h*4&&c.length<h*5;_++){const S=l()*Math.PI*2,T=s.r+.55+l()**1.4*2.05,M=Math.cos(S)*T,b=Math.sin(S)*T;if(b>7||Math.abs(M)<4&&b>0)continue;const I=l()<.3,R=3+Math.floor(l()*3);for(let D=0;D<R;D++){const L=M+(l()-.5)*.9,C=b+(l()-.5)*.9;if(Math.hypot(L,C)<s.r+.45)continue;const A=I&&l()<.7?1:0,U=A?.32+l()*.16:.34+l()*.3;c.push({x:L,z:C,s:U,w:U*(A?1.2:1.5),yaw:l()*Math.PI,tile:A,tint:.82+l()*.3})}}const u=$S(),d=new jn({map:u,alphaTest:.5}),f={value:0};d.onBeforeCompile=_=>{_.uniforms.uTime=f,_.vertexShader=`uniform float uTime;
attribute float aTile;
`+_.vertexShader.replace("#include <uv_vertex>",`#include <uv_vertex>
  vMapUv.x = (vMapUv.x + aTile) * 0.5;`).replace("#include <begin_vertex>",`#include <begin_vertex>
  { float ph = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7;
    transformed.x += sin(uTime * 1.6 + ph) * 0.07 * position.y * position.y;
    transformed.z += cos(uTime * 1.3 + ph) * 0.05 * position.y * position.y; }`)},d.customProgramCacheKey=()=>"arena-rim-cards";const p=new ps(o,d,c.length),x=new Float32Array(c.length),m=new ke,g=new In,v=new Nn,y=new le;return c.forEach((_,S)=>{m.compose(new F(s.x+_.x,0,s.z+_.z),g.setFromEuler(v.set(0,_.yaw,0)),new F(_.w,_.s,_.w)),p.setMatrixAt(S,m),x[S]=_.tile,p.setColorAt(S,y.setScalar(_.tint))}),o.setAttribute("aTile",new Or(x,1)),p.computeBoundingSphere(),p.name="arena_rim_cards",{mesh:p,map:u,uTime:f}}function ZS(){const s=document.createElement("canvas");s.width=64,s.height=256;const e=s.getContext("2d"),t=jr(9),n=e.createLinearGradient(0,0,64,0);n.addColorStop(0,"rgba(150,214,240,0)"),n.addColorStop(.18,"rgba(150,214,240,0.55)"),n.addColorStop(.5,"rgba(170,226,246,0.72)"),n.addColorStop(.82,"rgba(150,214,240,0.55)"),n.addColorStop(1,"rgba(150,214,240,0)"),e.fillStyle=n,e.fillRect(0,0,64,256);for(let r=0;r<70;r++){const a=6+t()*52,o=t()*256,l=18+t()*60,c=1+t()*2.5,h=Math.min(a-4,60-a)/26,u=(.25+t()*.55)*Math.min(1,Math.max(0,h)+.2);e.fillStyle=t()<.6?`rgba(240,252,255,${u})`:`rgba(188,236,250,${u})`;for(const d of[0,-256,256])e.fillRect(a,o+d,c,l)}const i=new $r(s);return i.colorSpace=Dt,i.wrapS=Ji,i.wrapT=Ji,i}function QS(s){const e=[],t=[],n=[];Zf.forEach(([o,l,c,h,u,d],f)=>{const p=s.x+o,x=s.z+l,m=f*6,g=[[0,u,0],[c*.82,h*1.04,-.08],[c,h,-.35]];for(const[v,y,_]of g)for(const S of[-.5,.5])e.push(p+S*y,v,x+_),t.push(S+.5+d,v/2.4);n.push(m,m+1,m+3,m,m+3,m+2,m+2,m+3,m+5,m+2,m+5,m+4)});const i=new ft;i.setAttribute("position",new Le(e,3)),i.setAttribute("uv",new Le(t,2)),i.setIndex(n),i.computeVertexNormals(),i.computeBoundingSphere();const r=ZS(),a=new at(i,new Yt({map:r,color:15137023,transparent:!0,depthWrite:!1}));return a.name="arena_waterfalls",{mesh:a,map:r}}function jS(s){const e=[],t=[],n=[],i=[],r=[],a=jr(31);let o=0;for(const[d,f,,,p]of Zf)for(let x=0;x<5;x++){const m=s.x+d+(x-2)*p*.32+(a()-.5)*.3,g=.35+a()*.55,v=s.z+f+.25+a()*.3,y=1+a()*.8,_=.7+a()*.5;for(const[T,M]of[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]])e.push(T,M,0),t.push(T+.5,M+.5),n.push(m,g,v),i.push(y,_);const S=o*4;r.push(S,S+1,S+2,S,S+2,S+3),o++}const l=new ft;l.setAttribute("position",new Le(e,3)),l.setAttribute("uv",new Le(t,2)),l.setAttribute("aCenter",new Le(n,3)),l.setAttribute("aSize",new Le(i,2)),l.setIndex(r);const c={value:0},h=new En({transparent:!0,depthWrite:!1,blending:Pi,fog:!1,uniforms:{uTime:c,uColor:{value:new le(14219007)}},vertexShader:`
      attribute vec3 aCenter; attribute vec2 aSize; uniform float uTime; varying vec2 vUv; varying float vA;
      void main(){
        vUv = uv; float ph = aCenter.x * 3.1 + aCenter.y * 7.3;
        float puff = 0.85 + 0.25 * sin(uTime * 2.3 + ph);
        vec4 mv = modelViewMatrix * vec4(aCenter + vec3(0.0, 0.12 * sin(uTime * 1.7 + ph), 0.0), 1.0);
        mv.xy += position.xy * aSize * puff;
        vA = 0.8 + 0.2 * sin(uTime * 3.1 + ph * 1.7);
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:`
      uniform vec3 uColor; varying vec2 vUv; varying float vA;
      void main(){
        float d = length(vUv * 2.0 - 1.0); if (d > 1.0) discard;
        float f = 1.0 - d; f = f * f;
        gl_FragColor = vec4(uColor * f * 0.32 * vA, 1.0);
      }`}),u=new at(l,h);return u.frustumCulled=!1,u.renderOrder=2,u.name="arena_spray",{mesh:u,uTime:c}}function nd(s,e,t){const n=Math.max(0,Math.min(1,(t-s)/(e-s)));return n*n*(3-2*n)}function e1(s){return`rgb(${s.map(e=>Math.max(0,Math.min(255,Math.round(e)))).join(",")})`}function jr(s){let e=s|0;return()=>((e=Math.imul(e,1664525)+1013904223|0)>>>0)/4294967296}function Qf(){try{const s=(new URLSearchParams(location.search).get("spire")||"").toUpperCase();return s==="0"||s==="BASE"||s==="CUR"?null:s==="B"?"B":"A"}catch{return"A"}}const id={0:6.4,1:8.2},t1={0:2.2,1:2.9},jf=[{x:8.8,z:-12.4,h:5.8,vr:0,vl:2},{x:12.9,z:-6.2,h:7.6,vr:2,vl:0},{x:13.4,z:2.2,h:4.1,vr:3,vl:0},{x:10.4,z:7.7,h:2.2,vr:2,vl:3}],zs=-14.1,_r=3.65;function n1(s){const e=[];for(const n of[-1,1])for(const i of jf)i.h<4||e.push({x:s.x+n*i.x,y:i.h*.5,z:s.z+i.z,h:i.h,tint:(n>0?i.vr:i.vl)>=2?1:0});const t=Qr()==="base"?{x:0,z:zs+.11}:uc(0,.11);return e.push({x:s.x+t.x,y:_r,z:s.z+t.z,h:3.2,tint:0}),e}function i1(s,e,t){const n=ep(t),i=document.createElement("canvas");i.width=i.height=e;const r=i.getContext("2d"),a=e/28,o=e/2,l=(s.r+.65)*a;r.save(),r.beginPath(),r.arc(o,o,l,0,Math.PI*2),r.rect(o-3*a,o,6*a,e-o),r.clip();const c=Qr();c!=="base"?XS(r,{size:e,px:a,mid:o,arenaR:s.r,seed:t,look:c}):s1(r,e,a,o,l,n);const h=(s.r-1.2)*a;r.lineWidth=a*.16;for(let f=0;f<12;f++){const p=f*Math.PI/6+.06;for(const m of[0,.28])r.beginPath(),r.arc(o,o,h-m*a,p,p+.38),r.strokeStyle=m?"#65c6c195":"#75e6d9bf",r.stroke();const x=p+.44;r.save(),r.translate(o+Math.cos(x)*h,o+Math.sin(x)*h),r.rotate(x+Math.PI/4),r.fillStyle="#8bedda",r.fillRect(-a*.1,-a*.1,a*.2,a*.2),r.restore()}r.restore();const u=new $r(i);u.colorSpace=Dt,u.anisotropy=4;const d=new at(new ui(28,28),new jn({map:u,alphaTest:.5}));return d.name="arena_floor",d.rotation.x=-Math.PI/2,d.position.set(s.x,.008,s.z),d.receiveShadow=!0,d}function s1(s,e,t,n,i,r){s.fillStyle="#39414a",s.fillRect(0,0,e,e);const a=["#707681","#7b7e8e","#656f80","#817d86","#727b89","#777888","#67747c","#797f85"],o=["#576f57","#4a6458","#647866"],l=1.12*t;for(let c=-1;c<Math.ceil(e/l);c++){const h=c*l;let u=-(c%2===0?1.6:.8)*t;for(;u<e;){const d=(1.38+r()*1.14)*t,f=(r()-.5)*t*.24,x=Math.hypot(u+d*.5-n,h+l/2-n)>i*.77&&r()<.3||r()<.065?o:a;s.beginPath(),s.moveTo(u+t*.12,h+t*.06),s.lineTo(u+d-t*.14,h+t*.08-f),s.lineTo(u+d-t*.035,h+t*.23),s.lineTo(u+d-t*.06,h+l-t*.19),s.lineTo(u+d-t*.18,h+l-t*.045),s.lineTo(u+t*.14,h+l-t*.065-f),s.lineTo(u+t*.035,h+l-t*.24),s.lineTo(u+t*.03,h+t*.2),s.closePath(),s.fillStyle=x[Math.floor(r()*x.length)],s.fill(),s.strokeStyle="#272e3b",s.lineWidth=t*.047,s.stroke(),s.save(),s.clip(),s.fillStyle="#b7c8d028",s.fillRect(u,h+t*.03,d,t*.11);for(let m=0;m<8;m++)s.fillStyle=r()<.5?"#c7d2d018":"#2529341c",s.fillRect(u+r()*d,h+r()*l,(.07+r()*.27)*t,(.03+r()*.12)*t);r()<.3&&(s.beginPath(),s.moveTo(u+d*.48,h+l),s.lineTo(u+d*.44,h+l*.62),s.lineTo(u+d*.56,h+l*.41),s.strokeStyle="#32374588",s.lineWidth=t*.027,s.stroke()),s.restore(),u+=d}}}function r1(s,e){const t=ep(e),n=new Ne;n.name="prismatic_ruins";const i=Qr(),r=i!=="base",a=Zu("crystal_spire")&&Zu("ruin_arch_shrine")?Qf():null,o=[],l=new jn,c=new jn({emissive:1273755,emissiveIntensity:.68});i!=="base"&&a1(c,qr[i].crystalSelf);const h=new jn({color:11772538}),u=new jn({emissive:2187151,emissiveIntensity:.48}),d=Is(new it,l),f=Is(new vt(.45,.5,1,8),l),p=Is(new Ws(1),l),x=Is(new Sn(1),c),m=Is(new ho(2.6,.15,5,28),h),g=Is(new it,u),v=[5988726,7304328,8224395,6645369],y=[3332335,6481636,6465018,9995005,11771387],_=()=>v[Math.floor(t()*v.length)],S=L=>()=>{const C=Math.floor(t()*v.length);return r?L[C%L.length]:v[C]},T=S(GS),M=S(HS);let b="cliff",I=!1;const R=(L,C,A,U,z,B,K,X,j=0,te=0)=>{I||(L.parts.push(b),L.matrices.push(new ke().compose(new F(s.x+C,A,s.z+U),new In().setFromEuler(new Nn(0,j,te)),new F(z,B,K))),L.colors.push(new le(X)))},D=(L,C,A,U,z=-1,B=1)=>{const K=b;b="crystal_rock",R(p,L,.2,C,A*.4,.48,A*.27,_()),b=K;for(let X=0;X<3;X++){const j=(X-1)*A*.16,te=A*(X===1?1:.48+t()*.17),Te=!!a&&X===1&&z in id;Te&&o.push({x:L+j,z:C+X%2*.3,k:z,side:B}),I=Te,R(x,L+j,te*.45,C+X%2*.3,te*.165,te*.54,te*.19,y[(U+X)%y.length],t()*Math.PI,j*-.4),I=!1}};for(let L=0;L<15;L++){const C=(L-7)*3.35,A=3.3+t()*4;R(p,C,A*.55,-20-t()*2.8,2.9+t()*2,A,3.1,T(),t()*Math.PI,(t()-.5)*.3)}b="fall",I=r;for(let L=0;L<9;L++){const C=5+t()*.45;R(g,-6.5+L*.21,C*.5,-17.4+t()*.14,.26,C,.08,L%3===0?8439549:5149641)}I=!1;for(const L of[-1,1]){for(let C=0;C<4;C++){b="column",I=r&&L>0&&C<2;const A=L*(4.1+C*2.5),U=-13.65+C*.75,z=C===2?3.4:5.8-C*.3;R(d,A,.24,U,1.6,.48,1.55,M()),R(d,A,.64,U,1.28,.32,1.28,M());const B=Math.round(z/.62);for(let K=0;K<B;K++)R(f,A,1.06+K*.61,U,1.16,.59,1.16,M(),K%3*.07);C!==2&&(R(d,A,.98+B*.61,U,1.5,.32,1.5,M()),C<2&&R(d,A+L*.73,1.32+B*.61,U,2.8,.34,1.18,M(),0,L*-.09))}I=!1,jf.forEach((C,A)=>{b=`crystal_${L<0?"L":"R"}${A}`,D(L*C.x,C.z,C.h,L>0?C.vr:C.vl,A,L)})}if(b="shrine",I=!!a,r){const L=io.yaw,C=(z,B)=>uc(z,B),A=qr[i].shrineStone,U=z=>(_(),A[z%A.length]);for(let z=0;z<5;z++){const B=C(0,1.8-z*.38);R(d,B.x,.12+z*.17,B.z,5.8-z*.36,.24,.86,U(z),L)}{const z=C(0,-.5);R(d,z.x,.73,z.z,4.6,.36,1.56,U(5),L)}for(const z of[-1,1]){const B=C(z*1.95,0);R(d,B.x,1.31,B.z,1.05,1,1.35,U(z+7),L)}{const z=C(0,0);R(m,z.x,_r,z.z,.93,1,1,16777215,L)}{const z=C(0,.11);R(x,z.x,_r,z.z,.68,1.18,.65,7795711,.42+L)}}else{const L=zs;for(let C=0;C<5;C++)R(d,0,.12+C*.17,L+1.8-C*.38,5.8-C*.36,.24,.86,_());R(d,0,.73,L-.5,4.6,.36,1.56,_());for(const C of[-1,1])R(d,C*1.95,1.31,L,1.05,1,1.35,_());R(m,0,_r,L,.93,1,1,16777215),R(x,0,_r,L+.11,.68,1.18,.65,7795711,.42)}if(I=!1,a){const[L]=cc("crystal_spire");L.geometry.computeBoundingBox();const C=L.geometry.boundingBox.max.y,A=new ps(L.geometry,L.material,o.length);A.name="crystal_spire",o.forEach((B,K)=>{const X=id[B.k]/C;A.setMatrixAt(K,new ke().compose(new F(s.x+B.x,0,s.z+B.z),new In().setFromEuler(new Nn(0,B.side*t1[B.k],0)),new F(X,X,X)))}),A.computeBoundingSphere();const[U]=cc("ruin_arch_shrine"),z=new at(U.geometry,U.material);if(z.name="ruin_arch_shrine",r){const B=uc(0,0);z.position.set(s.x+B.x,0,s.z+B.z),z.rotation.y=io.yaw}else z.position.set(s.x,0,s.z+zs);n.add(A,z)}for(const L of[d,f,p,x,m,g]){if(!L.matrices.length)continue;const C=new ps(L.geometry,L.material,L.matrices.length);C.userData.parts=L.parts,L.matrices.forEach((A,U)=>{C.setMatrixAt(U,A),C.setColorAt(U,L.colors[U])}),C.computeBoundingSphere(),n.add(C)}return n}function Is(s,e){return{geometry:s,material:e,matrices:[],colors:[],parts:[]}}function a1(s,e){s.onBeforeCompile=t=>{t.vertexShader=`varying float vCrystalY;
`+t.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
  vCrystalY = position.y;`),t.fragmentShader=`varying float vCrystalY;
`+t.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
  totalEmissiveRadiance += vColor.rgb * CRYSTAL_SELF * (0.55 + 0.75 * smoothstep(-0.8, 0.95, vCrystalY));`),t.fragmentShader=`#define CRYSTAL_SELF ${e.toFixed(3)}
`+t.fragmentShader},s.customProgramCacheKey=()=>`arena-crystal-selflit-${e}`}function ep(s){let e=s|0;return()=>((e=Math.imul(e,1664525)+1013904223|0)>>>0)/4294967296}const tp={fog:9342920,fogNear:14,fogFar:52,hemiSky:12763378,hemiGround:6190434,hemiI:1.8,sun:16773590,sunI:2,sunOffset:new F(-9,16,-12)},sd=new F(8,18,6),o1=16769184,l1=6091494,c1=10980346;function np(s){const e=Math.max(0,Math.min(1,(-52-s)/10));return e*e*(3-2*e)}function h1(s){const e=n1(s),t=[],n=[],i=[],r=[],a=[],o=[],l=new le;e.forEach((d,f)=>{l.set(d.tint?c1:l1);const p=d.h*.62,x=d.h*1.15;for(const[g,v]of[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]])t.push(g,v,0),n.push(g+.5,v+.5),i.push(d.x,d.y,d.z),r.push(p,x),a.push(l.r,l.g,l.b);const m=f*4;o.push(m,m+1,m+2,m,m+2,m+3)});const c=new ft;c.setAttribute("position",new Le(t,3)),c.setAttribute("uv",new Le(n,2)),c.setAttribute("aCenter",new Le(i,3)),c.setAttribute("aSize",new Le(r,2)),c.setAttribute("aColor",new Le(a,3)),c.setIndex(o);const h=new En({transparent:!0,depthWrite:!1,blending:Pi,fog:!1,uniforms:{uI:{value:0},uTime:{value:0}},vertexShader:`
      attribute vec3 aCenter; attribute vec2 aSize; attribute vec3 aColor; varying vec2 vUv; varying vec3 vColor; varying float vSeed;
      void main(){
        vUv = uv; vColor = aColor; vSeed = aCenter.x * 0.37 + aCenter.z * 0.21;
        vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
        mv.xy += position.xy * aSize;
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:`
      uniform float uI; uniform float uTime; varying vec2 vUv; varying vec3 vColor; varying float vSeed;
      void main(){
        float d = length(vUv * 2.0 - 1.0); if (d > 1.0) discard;
        float f = (1.0 - d); f = f * f * (0.55 + 0.45 * f);
        float breathe = 0.88 + 0.12 * sin(uTime * 1.3 + vSeed);
        gl_FragColor = vec4(vColor * f * uI * breathe, 1.0);
      }`}),u=new at(c,h);return u.frustumCulled=!1,u.renderOrder=2,u.name="arena_glow",{mesh:u,mat:h}}function u1(s){const e=[[-3.5,zs+4.5,2.6,17,.42],[.6,zs+6.5,1.6,15,.38],[3.8,zs+3.2,2.1,16,.45]],t=[],n=[],i=[];e.forEach(([l,c,h,u,d],f)=>{const p=s.x+l,x=s.z+c,m=-Math.sin(d)*u,g=Math.cos(d)*u,v=h/2,y=Math.cos(d)*v,_=Math.sin(d)*v,S=[[p-y,-_,x,0,0],[p+y,_,x,1,0],[p+y+m,_+g,x,1,1],[p-y+m,-_+g,x,0,1]];for(const[M,b,I,R,D]of S)t.push(M,b,I),n.push(R,D);const T=f*4;i.push(T,T+1,T+2,T,T+2,T+3)});const r=new ft;r.setAttribute("position",new Le(t,3)),r.setAttribute("uv",new Le(n,2)),r.setIndex(i),r.computeBoundingSphere();const a=new En({transparent:!0,depthWrite:!1,blending:Pi,fog:!1,side:pn,uniforms:{uI:{value:0},uColor:{value:new le(o1)}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
      uniform float uI; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float across = 1.0 - abs(vUv.x * 2.0 - 1.0); across = across * across;
        float along = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.6, 1.0, vUv.y));
        gl_FragColor = vec4(uColor * across * along * uI, 1.0);
      }`}),o=new at(r,a);return o.renderOrder=2,o.name="arena_shafts",{mesh:o,mat:a}}const hl=s=>s<0?0:s>1?1:s,d1=s=>1-(1-s)*(1-s),Yn=(s,e=0)=>{const t=Math.sin(s*127.1+e*311.7)*43758.5453;return t-Math.floor(t)};function f1(s){const e=s.ring.r+s.ring.core+s.ring.glow+.06,t=new ui(e*2,e*2),n=new En({transparent:!0,depthTest:!1,depthWrite:!1,fog:!1,uniforms:{uR:{value:s.ring.r},uCore:{value:s.ring.core},uGlow:{value:s.ring.glow},uA:{value:s.ring.alpha},uGA:{value:s.ring.glowA},uHiK:{value:s.ring.hi},uExt:{value:e},uCol:{value:new le(Bt.lumen)},uHi:{value:new le(Bt.lumenHi)}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
      uniform float uR; uniform float uCore; uniform float uGlow; uniform float uA; uniform float uGA; uniform float uHiK; uniform float uExt; uniform vec3 uCol; uniform vec3 uHi;
      varying vec2 vUv;
      void main(){
        float d = abs(length(vUv * 2.0 - 1.0) * uExt - uR);
        float aa = max(fwidth(d), 1e-4);
        float core = 1.0 - smoothstep(uCore - aa, uCore + aa, d);
        float glow = uGlow > 0.0 ? uGA * pow(1.0 - clamp(d / uGlow, 0.0, 1.0), 2.0) : 0.0;
        float a = max(core * uA, glow);
        if (a < 0.003) discard;
        gl_FragColor = vec4(mix(uCol, uHi, core * uHiK), a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}),i=new at(t,n);return i.rotation.x=-Math.PI/2,i.renderOrder=12,i.name="hero_ring",i}class p1{constructor(e,t,n){N(this,"points");N(this,"mat");N(this,"count");this.count=t;const i=[],r=[];for(let o=0;o<t;o++)i.push(Yn(o,1),Yn(o,2),Yn(o,3)),r.push(Yn(o,4),Yn(o,5),.5+Yn(o,6),.7+.6*Yn(o,7));const a=new ft;a.setAttribute("position",new Le(i,3)),a.setAttribute("aSeed",new Le(r,4)),this.mat=new En({transparent:!0,depthWrite:!1,blending:Pi,fog:!1,uniforms:{uCenter:{value:new F},uBox:{value:new F(30,4.2,30)},uTime:{value:0},uI:{value:0},uScale:{value:400},uSize:{value:.16*n.sparkles.size},uFar:{value:40},uC0:{value:new le(Bt.lumen)},uC1:{value:new le(Bt.violet)},uC2:{value:new le(Bt.lumenHi)}},vertexShader:`
        uniform vec3 uCenter; uniform vec3 uBox; uniform float uTime; uniform float uI; uniform float uScale; uniform float uSize; uniform float uFar;
        uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2;
        attribute vec4 aSeed; varying vec3 vCol; varying float vA;
        void main(){
          float t = uTime * aSeed.z;
          vec3 p = position * uBox + vec3(sin(t * 0.7 + aSeed.x * 6.283) * 0.5, t * 0.22, cos(t * 0.6 + aSeed.y * 6.283) * 0.5);
          vec3 lo = vec3(uCenter.x - uBox.x * 0.5, 0.25, uCenter.z - uBox.z * 0.5);
          vec3 w = lo + mod(p - lo, uBox);
          vec3 q = (w - lo) / uBox; // 0..1 inside the box: fade the wrap edges
          float edge = smoothstep(0.0, 0.08, q.x) * smoothstep(1.0, 0.92, q.x) * smoothstep(0.0, 0.08, q.z) * smoothstep(1.0, 0.92, q.z) * smoothstep(0.0, 0.15, q.y) * smoothstep(1.0, 0.75, q.y);
          vec4 mv = modelViewMatrix * vec4(w, 1.0);
          float dist = -mv.z;
          float tw = 0.5 + 0.5 * sin(uTime * (1.3 + aSeed.z * 1.7) + aSeed.x * 31.0); tw *= tw;
          vA = uI * edge * smoothstep(2.5, 5.0, dist) * (1.0 - smoothstep(uFar * 0.55, uFar, dist)) * (0.25 + 0.75 * tw);
          vCol = aSeed.y < 0.45 ? uC0 : aSeed.y < 0.75 ? uC1 : uC2;
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uSize * aSeed.w * uScale / max(dist, 0.5) * (0.7 + 0.5 * tw), 1.0, 28.0);
          if (vA < 0.004) gl_PointSize = 0.0;
        }`,fragmentShader:`
        uniform float uI; varying vec3 vCol; varying float vA;
        void main(){
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float core = exp(-dot(p, p) * 9.0);
          float rays = max(0.0, 1.0 - abs(p.x) * 7.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 7.0) * max(0.0, 1.0 - abs(p.x));
          float f = core + 0.55 * rays;
          if (f * vA < 0.003) discard;
          gl_FragColor = vec4(vCol * f * vA, 1.0);
          #include <colorspace_fragment>
        }`}),this.points=new af(a,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=3,this.points.name="vfx_sparkles",e.add(this.points)}dispose(){this.points.geometry.dispose(),this.mat.dispose(),this.points.removeFromParent()}}const m1=1.95,g1=.45,rd=new le(Bt.lumen),ad=new le(Bt.violet),x1=new le(Bt.lumenHi),ul=new le(Bt.white);class _1{constructor(e,t){N(this,"buf");N(this,"items",[]);N(this,"F",new $f);N(this,"n",0);N(this,"s");this.s=t,this.buf=new Ga(e,640,9,!1),this.buf.mesh.name="vfx_impact"}add(e,t,n,i,r,a,o){this.items.length>=8&&this.items.shift(),this.items.push({t0:e,x:t,y:n,z:i,kind:r,seed:this.n++,dx:a,dz:o})}update(e,t,n){const i=this.buf,r=this.s.hit,a=this.F.from(n);i.begin(),this.items=this.items.filter(o=>{const l=Math.max(0,e-o.t0-1+t),c=r.life+(o.kind?1:0),h=12;if(l>Math.max(c,o.kind===2?h:0))return!1;if(l<=c){const u=hl(l/c),d=d1(hl((l+.6)/1.6)),f=1-u*u,p=r.r*(o.kind===1?1.35:o.kind===2?1.3:1)*(.55+.45*d),x=o.kind===1?r.rays+2:r.rays,m=o.kind===1?ad:rd;Jf(i,a,[o.x,o.y,o.z],p,x,o.seed*.7+u*.4,[ul.r,ul.g,ul.b,f],[m.r,m.g,m.b,f*.95],.28)}if(o.kind===2){const u=l/30,d=hl(l/h),f=r.shards;for(let p=0;p<f;p++){const x=Math.atan2(-o.dz,-o.dx)+(Yn(o.seed*13+p,11)-.5)*2.8,m=1.4+2.4*Yn(o.seed*13+p,12),g=2.4+3*Yn(o.seed*13+p,13),v=o.x+Math.cos(x)*m*u,y=o.z+Math.sin(x)*m*u,_=Math.max(.1,o.y+g*u-4.9*u*u);hc(i,a,[v,_,y],r.shardSize*(.6+.5*Yn(p,14))*(1-d*.5),l*.5+p,p%2?x1:rd,ad,1-d*d)}}return!0}),i.end()}dispose(){this.buf.dispose()}}class v1{constructor(e,t,n){N(this,"sparkles");N(this,"impact");N(this,"fieldI");N(this,"bright");N(this,"size",new Se);N(this,"style");this.style=n,this.sparkles=new p1(e,Math.max(8,Math.round(t.particles*n.sparkles.share)),n),this.impact=new _1(e,n),this.fieldI=n.sparkles.field[t.tier],this.bright=n.sparkles.bright}onHit(e,t,n,i,r,a,o){let l=t-i.x,c=n-i.z;const h=Math.hypot(l,c)||1;l/=h,c/=h;const u=this.style.hit;if(r===2){const f=Math.hypot(i.fx,i.fz)||1,p=-i.fz/f,x=i.fx/f,m=t-l*a*.85+p*.55,g=n-c*a*.85+x*.55,v=this.lift(m,g,1.25,u.r*1.15,i,o);return this.impact.add(e,m,v,g,2,l,c),v}const d=this.lift(t,n,u.y,u.r*(r===1?1.35:1),i,o);return this.impact.add(e,t,d,n,r,l,c),d}lift(e,t,n,i,r,a){const o=r.x-a.x,l=r.z-a.z,c=Math.hypot(o,l)||1,h=o/c,u=l/c,d=e-a.x,f=t-a.z,p=d*h+f*u,x=Math.abs(-d*u+f*h);if(p<=c||x>g1*p/c+i)return n;const m=a.y-(a.y-m1)/c*p;return Math.max(n,m+i*.7)}update(e,t,n,i,r,a,o){this.impact.update(e,t,i);const l=this.sparkles.mat.uniforms,c=np(a),h=(this.fieldI+(1-this.fieldI)*c)*this.bright;this.sparkles.points.visible=h>.01,l.uI.value=h,l.uTime.value=n,l.uCenter.value.copy(r),o.getDrawingBufferSize(this.size),l.uScale.value=this.size.y/(2*Math.tan(i.fov*Math.PI/360)),l.uFar.value=(i.far||60)*.85}dispose(){this.sparkles.dispose(),this.impact.dispose()}}const Kc={id:"dewlight",nameTh:"น้ำค้างยามเช้า",nameEn:"Dewlight Morning",noteTh:"สดใส เขียวสด คริสตัลฟ้า แดดอุ่น เป็นโทนหลักของด่านแรก",fog:12576498,fogNear:22,fogFar:60,hemiSky:14676991,hemiGround:8829036,hemiI:1.7,sun:16773330,sunI:2.1,grassA:8833375,grassB:7321690,path:15389092,pathEdge:13215610,rune:6091494,treeMix:["tree_round","tree_round","tree_pine","tree_round_b"]},M1=[Kc,{id:"blossom",nameTh:"กลีบบุปผาล่องลม",nameEn:"Blossom Drift",noteTh:"ต้นไม้ชมพู ทางเดินลาเวนเดอร์ แสงนุ่ม เหมาะกับเมืองริมน้ำ",fog:15981036,fogNear:20,fogFar:55,hemiSky:16770804,hemiGround:10467454,hemiI:1.75,sun:16770030,sunI:1.9,grassA:10276724,grassB:9225325,path:15127530,pathEdge:12361924,rune:16752327,treeMix:["tree_round_b","tree_round_b","tree_round"]},{id:"amber",nameTh:"ตลาดอำพัน",nameEn:"Amber Market",noteTh:"แสงตะเกียงทองอุ่น ไม้และหินสีอิฐ ให้ความรู้สึกปลอดภัยของเมืองและร้านค้า",fog:15914664,fogNear:18,fogFar:50,hemiSky:16769712,hemiGround:10124373,hemiI:1.5,sun:16761963,sunI:2.4,exposure:1,grassA:11059042,grassB:9941850,path:14267530,pathEdge:11108956,rune:16762967,treeMix:["tree_round","tree_round_b"]},{id:"prism",nameTh:"เที่ยงปริซึม",nameEn:"Prism Noon",noteTh:"อิ่มสีสูงสุด แสงจ้า คริสตัลเด่น สดใสที่สุดแต่ต้องระวังไม่ให้แย่งสายตาจากวงเตือน",fog:13955583,fogNear:26,fogFar:70,hemiSky:15924223,hemiGround:8376186,hemiI:1.9,sun:16777215,sunI:2.4,exposure:1.1,grassA:8377194,grassB:6866019,path:15917762,pathEdge:13481100,rune:10980346,treeMix:["tree_round","tree_pine","tree_round_b"]},{id:"dusk",nameTh:"สนธยาลมกระซิบ",nameEn:"Hushwind Dusk",noteTh:"ฟ้าส้มอมม่วง แสงเฉียงต่ำ เงายาว ให้อารมณ์การเดินทางกลับบ้าน",fog:15316899,fogNear:18,fogFar:52,hemiSky:16762792,hemiGround:7039626,hemiI:1.35,sun:16751196,sunI:2.3,exposure:1,grassA:8036956,grassB:7049814,path:14726543,pathEdge:11107942,rune:16762967,treeMix:["tree_round","tree_pine"]},{id:"moonpetal",nameTh:"ราตรีกลีบจันทร์",nameEn:"Moonpetal Night",noteTh:"กลางคืนสีน้ำเงิน เห็ดและคริสตัลเรืองแสงนำทาง ใช้กับพื้นที่ลึกลับ",fog:2636390,fogNear:14,fogFar:42,hemiSky:9414399,hemiGround:2832975,hemiI:1.25,sun:12044543,sunI:.9,exposure:1.15,grassA:3103314,grassB:2641226,path:8226472,pathEdge:5595263,rune:6091494,treeMix:["tree_pine","tree_round"]},{id:"mistvale",nameTh:"ซากหุบหมอก",nameEn:"Mistvale Ruins",noteTh:"หมอกเขียวอมฟ้า หินโบราณ อักขระเรือง สีลดลงเพื่อให้ของสำคัญเด่น",fog:10470592,fogNear:10,fogFar:36,hemiSky:13823208,hemiGround:6257262,hemiI:1.45,sun:15004394,sunI:1.2,grassA:7248506,grassB:6458738,path:12367526,pathEdge:9209464,rune:6091494,treeMix:["tree_pine","tree_pine","tree_round"]},{id:"stormglass",nameTh:"ลานแก้วพายุ",nameEn:"Stormglass Arena",noteTh:"พื้นหินเทาม่วงเข้ม แสงฟ้าเย็น ทำให้วงเตือนสีส้มแดงเด่นที่สุด เหมาะกับลานบอส",fog:4934254,fogNear:16,fogFar:46,hemiSky:11778303,hemiGround:4012882,hemiI:1.4,sun:14146815,sunI:1.6,grassA:5204830,grassB:4611926,path:9407142,pathEdge:6709630,rune:10980346,treeMix:["tree_pine"]},{id:"frostchime",nameTh:"ทุ่งระฆังน้ำแข็ง",nameEn:"Frostchime Glade",noteTh:"หิมะขาวอมฟ้า คริสตัลซีด แสงสะอาด ต้องเพิ่มเส้นขอบตัวละครเพราะพื้นสว่างมาก",fog:14938363,fogNear:20,fogFar:56,hemiSky:16055295,hemiGround:11452370,hemiI:1.6,sun:16777215,sunI:1.8,exposure:.95,grassA:14674418,grassB:13622761,path:12043992,pathEdge:9676477,rune:6091494,treeMix:["tree_pine","tree_pine","tree_round"]},{id:"verdant",nameTh:"ป่าลึกมรกต",nameEn:"Verdant Deep",noteTh:"ป่าทึบเขียวเข้ม แสงลอดใบ หิ่งห้อย ให้ความรู้สึกผจญภัยระหว่างเส้นทาง",fog:8367750,fogNear:14,fogFar:40,hemiSky:14153673,hemiGround:3955772,hemiI:1.5,sun:16773808,sunI:1.9,grassA:5215312,grassB:4622153,path:13217919,pathEdge:9666652,rune:16762967,treeMix:["tree_round","tree_pine","tree_pine"]}];function ip(s){return M1.find(e=>e.id===s)??Kc}const od=[{x:5.43,z:-14.31,s:1.45,rot:3.3}],ld={core:[.55,.95],white:.72,body:1,tipY:[.8,1.36],tipK:.45,fogK:0},cd={core:[.7,1],white:.25,body:1,tipY:[2.2,3.04],tipK:.35,fogK:.25},hd={A:{id:"A",path:[[8,14928027],[-4,15059614],[-16,15389350],[-28,16180157],[-40,16509896],[-46,16509896],[-56,15389092]],guides:od,crystal:ld,gate:{fogK:.35,stoneFar:.72,glow:cd},halo:{w:1.5,h:2.1,i:.55},rim:{color:16773330,k:1.5,pow:2.2},warmSatCap:.72},B:{id:"B",path:[[8,13813952],[-4,13945538],[-16,14142917],[-28,14406346],[-40,14603982]],field:{fogK:.5,fogNear:22,fogFar:60,hemiSkyK:.55,hemiGroundK:.3,hemiI:1.6,sunI:1.8,grassK:.3,edge:10129292},guides:od,crystal:ld,gate:{fogK:.35,stoneFar:.75,glow:cd},halo:{w:1.5,h:2.1,i:.6},rim:{color:16773330,k:1.8,pow:2.2},warmSatCap:.72}};function y1(s){const e=(s.get("opening")||"").toUpperCase();return e==="0"||e==="BASE"||e==="CUR"?null:e==="B"?hd.B:hd.A}const cr=(s,e,t)=>new le(s).lerp(new le(e),t).getHex();function S1(s,e){const t=e.field;if(!t)return s;const n=tp;return{...s,id:s.id+"-opening"+e.id,fog:cr(s.fog,n.fog,t.fogK),fogNear:t.fogNear,fogFar:t.fogFar,hemiSky:cr(s.hemiSky,n.hemiSky,t.hemiSkyK),hemiGround:cr(s.hemiGround,n.hemiGround,t.hemiGroundK),hemiI:t.hemiI,sunI:t.sunI,grassA:cr(s.grassA,n.hemiGround,t.grassK),grassB:cr(s.grassB,n.hemiGround,t.grassK),path:e.path[1][1],pathEdge:t.edge}}function b1(s,e,t){const n=e.path[0][0],i=e.path[e.path.length-1][0],r=s.createLinearGradient(0,t(n),0,t(i));for(const[a,o]of e.path)r.addColorStop((a-n)/(i-n),"#"+o.toString(16).padStart(6,"0"));return r}const T1=(s,e,t)=>s.guides.some(n=>Math.hypot(n.x-e,n.z-t)<1.5);function go(s,e,t){const n=s,i=n.onBeforeCompile.bind(n),r=n.customProgramCacheKey.bind(n);n.onBeforeCompile=(a,o)=>{i(a,o),t(a)},n.customProgramCacheKey=()=>r()+"|"+e,n.needsUpdate=!0}const E1=s=>({uGlowCore:{value:s.core},uGlowWhite:{value:s.white},uGlowBody:{value:s.body},uGlowTipY:{value:s.tipY},uGlowTipK:{value:s.tipK},uGlowTip:{value:new le(ne.violet)},uGlowFogK:{value:s.fogK}}),w1=`uniform vec2 uGlowCore; uniform float uGlowWhite; uniform float uGlowBody; uniform vec2 uGlowTipY; uniform float uGlowTipK; uniform vec3 uGlowTip; uniform float uGlowFogK;
varying float vObjY;
`,A1=`
  if (max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b)) > 0.004) {
    vec3 gBase = sRGBTransferOETF(vec4(diffuseColor.rgb, 1.0)).rgb;
    float gFacing = abs(dot(normal, normalize(vViewPosition)));
    vec3 gCol = mix(gBase * uGlowBody, mix(gBase, vec3(1.0), uGlowWhite), smoothstep(uGlowCore.x, uGlowCore.y, gFacing));
    gCol = mix(gCol, sRGBTransferOETF(vec4(uGlowTip, 1.0)).rgb, smoothstep(uGlowTipY.x, uGlowTipY.y, vObjY) * uGlowTipK);
    #ifdef USE_FOG
      gCol = mix(gCol, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * uGlowFogK);
    #endif
    gl_FragColor.rgb = gCol;
  }`;function sp(s,e){Object.assign(s.uniforms,E1(e)),s.vertexShader=`varying float vObjY;
`+s.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
	vObjY = position.y;`),s.fragmentShader=w1+s.fragmentShader.replace("#include <dithering_fragment>","#include <dithering_fragment>"+A1)}function R1(s,e){for(const t of s)go(t,"openingGate"+e.id,n=>{sp(n,e.gate.glow),n.uniforms.uGateFogK={value:e.gate.fogK},n.uniforms.uStoneFar={value:e.gate.stoneFar},n.fragmentShader=`uniform float uGateFogK; uniform float uStoneFar;
`+n.fragmentShader.replace("#include <fog_fragment>",`
      #ifdef USE_FOG
        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        gl_FragColor.rgb *= mix( 1.0, uStoneFar, fogFactor );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor * uGateFogK );
      #endif`)})}function C1(s,e){s?.traverse(t=>{const n=t;n.isMesh&&go(n.material,"openingRim"+e.id,i=>{i.uniforms.uRimCol={value:new le(e.rim.color)},i.uniforms.uRimK={value:e.rim.k},i.uniforms.uRimPow={value:e.rim.pow},i.fragmentShader=`uniform vec3 uRimCol; uniform float uRimK; uniform float uRimPow;
`+i.fragmentShader.replace("#include <opaque_fragment>",`
        {
          vec3 rWn = normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
          float rEdge = 1.0 - abs( dot( normal, normalize( vViewPosition ) ) );
          outgoingLight += uRimCol * uRimK * pow( rEdge, uRimPow ) * smoothstep( 0.05, 0.75, rWn.y );
        }
        #include <opaque_fragment>`)})})}function P1(s,e,t){const n=new Map;for(const i of s.children)i.name!=="lantern_post"&&i.name!=="campfire"||i.traverse(r=>{const a=r;if(!a.isMesh)return;const o=a.material;let l=n.get(o);l||(l=o.clone(),n.set(o,l),t.push(l),go(l,"openingSatCap"+e.id,c=>{c.uniforms.uSatCap={value:e.warmSatCap},c.fragmentShader=`uniform float uSatCap;
`+c.fragmentShader.replace("#include <colorspace_fragment>",`#include <colorspace_fragment>
            { float cMax = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), cMin = min(gl_FragColor.r, min(gl_FragColor.g, gl_FragColor.b));
              float sat = cMax > 0.0 ? (cMax - cMin) / cMax : 0.0;
              if (sat > uSatCap) gl_FragColor.rgb = vec3(cMax) - (vec3(cMax) - gl_FragColor.rgb) * (uSatCap / sat); }`)})),a.material=l})}function L1(s,e,t,n){const i=[];P1(s,e,i);for(const m of e.guides){const g=qc("crystal_cluster");g.position.set(m.x,0,m.z),g.rotation.y=m.rot,g.scale.setScalar(m.s),g.name="opening_guide",g.traverse(v=>{const y=v;if(!y.isMesh)return;const _=t(y.material);go(_,"openingGuide"+e.id,S=>sp(S,e.crystal)),y.material=_,i.push(_)}),s.add(g)}const r=[],a=[],o=[],l=[],c=[];e.guides.forEach((m,g)=>{for(const[y,_]of[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]])r.push(y,_,0),a.push(y+.5,_+.5),o.push(m.x,.62*m.s,m.z),l.push(e.halo.w*m.s,e.halo.h*m.s);const v=g*4;c.push(v,v+1,v+2,v,v+2,v+3)});const h=new ft;h.setAttribute("position",new Le(r,3)),h.setAttribute("uv",new Le(a,2)),h.setAttribute("aCenter",new Le(o,3)),h.setAttribute("aSize",new Le(l,2)),h.setIndex(c);const u=new En({transparent:!0,depthWrite:!1,blending:Pi,fog:!1,uniforms:{uI:{value:e.halo.i},uTime:{value:0},uColor:{value:new le(ne.lumen)},uNearFade:n},vertexShader:`attribute vec3 aCenter; attribute vec2 aSize; varying vec2 vUv; varying float vDist;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(aCenter, 1.0); vDist = length(mv.xyz); mv.xy += position.xy * aSize; gl_Position = projectionMatrix * mv; }`,fragmentShader:`uniform float uI; uniform float uTime; uniform vec3 uColor; uniform float uNearFade; varying vec2 vUv; varying float vDist;
      void main(){ float d = length(vUv * 2.0 - 1.0); if (d > 1.0) discard; float f = 1.0 - d; f = f * f;
        f *= smoothstep(uNearFade, uNearFade + 3.0, vDist); // fades with its crystal near the camera
        gl_FragColor = vec4(uColor * f * uI * (0.9 + 0.1 * sin(uTime * 1.6)), 1.0); }`});h.computeBoundingSphere();const d=h.boundingSphere;let f=0,p=0;e.guides.forEach(m=>{f+=m.x/e.guides.length,p+=m.z/e.guides.length}),d.center.set(f,1,p),d.radius=Math.max(...e.guides.map(m=>Math.hypot(m.x-f,m.z-p)+Math.max(e.halo.w,e.halo.h)*m.s));const x=new at(h,u);return x.renderOrder=2,x.name="opening_halo",s.add(x),i.push(h,u),{update(m){u.uniforms.uTime.value=m},dispose(){for(const m of i)m.dispose()}}}const ud=16742938,dl=16724821,dd=new Set(["slam","charge"]),kt={x0:-34,x1:34,z0:-100,z1:16};function I1(s,e){let t=1e9;for(const n of Pt.walkable)t=Math.min(t,N1(n,s,e));return t}function N1(s,e,t){if(s.type==="circle")return Math.hypot(e-s.x,t-s.z)-s.r;const n=s.bx-s.ax,i=s.bz-s.az,r=Math.max(0,Math.min(1,((e-s.ax)*n+(t-s.az)*i)/(n*n+i*i)));return Math.hypot(e-(s.ax+n*r),t-(s.az+i*r))-s.r}let fl=null;function D1(){if(fl)return fl;const s=new pf;for(let e=0;e<10;e++){const t=e/10*Math.PI*2+Math.PI/2,n=e%2?.07:.17;e?s.lineTo(Math.cos(t)*n,Math.sin(t)*n):s.moveTo(Math.cos(t)*n,Math.sin(t)*n)}return fl=new kc(s)}class U1{constructor(e){N(this,"renderer");N(this,"scene",new l0);N(this,"camera");N(this,"hemi");N(this,"sun");N(this,"q",Xr.medium);N(this,"tone",Kc);N(this,"particles");N(this,"rings");N(this,"skillFx",null);N(this,"vfx",new URLSearchParams(location.search).get("vfx")!=="0");N(this,"vfxVar",kS());N(this,"stageVfx",null);N(this,"actors",new Map);N(this,"teles",new Map);N(this,"gates",new Map);N(this,"pillars",[]);N(this,"occluders",[]);N(this,"playerMark",null);N(this,"springGem",null);N(this,"flames",[]);N(this,"arenaFloor",null);N(this,"arenaRuins",null);N(this,"arenaDeco",null);N(this,"flags",new URLSearchParams(location.search));N(this,"atmosOn",this.flags.get("atmos")!=="0");N(this,"opening",y1(this.flags));N(this,"openingFx",null);N(this,"glow",null);N(this,"shafts",null);N(this,"atmosW",0);N(this,"sunOffset",new F().copy(sd));N(this,"env",new Ne);N(this,"camTarget",new F);N(this,"camPos",new F);N(this,"shake",0);N(this,"camBase",new F);N(this,"camPull",0);N(this,"camPullHold",0);N(this,"noPull",/[?&]nopull\b/.test(location.search));N(this,"pullCam",new vn(48,16/9,.5,90));N(this,"pullPts",[]);N(this,"time",0);N(this,"pixelRatio",1);N(this,"nearFadeU",{value:9});this.renderer=new Fy({canvas:e,antialias:!1,powerPreference:"high-performance",stencil:!1}),this.renderer.outputColorSpace=Dt,this.renderer.toneMapping=gc,this.renderer.toneMappingExposure=1,this.renderer.shadowMap.type=Mr,this.camera=new vn(48,16/9,.5,90),this.hemi=new wg(13626111,8367722,1.6),this.sun=new Tf(16773590,2.2),this.sun.shadow.mapSize.set(1024,1024),Object.assign(this.sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:50}),this.sun.shadow.bias=-.0015,this.scene.add(this.hemi,this.sun,this.sun.target,this.env),this.resize()}setQuality(e,t){this.q=e,this.pixelRatio=Math.min(t??e.maxPixelRatio,e.maxPixelRatio,window.devicePixelRatio||1),this.renderer.setPixelRatio(this.pixelRatio),this.renderer.shadowMap.enabled=e.shadows,this.sun.castShadow=e.shadows,this.resize()}setPixelRatio(e){this.pixelRatio=Math.min(e,this.q.maxPixelRatio),this.renderer.setPixelRatio(this.pixelRatio),this.resize()}resize(){const e=window.innerWidth,t=window.innerHeight;this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.fov=e/t<1?62:48,this.camera.updateProjectionMatrix()}applyTone(e){this.opening&&(e=S1(e,this.opening)),this.tone=e,this.scene.background=new le(e.fog),this.scene.fog=new Rc(e.fog,e.fogNear,e.fogFar),this.hemi.color.set(e.hemiSky),this.hemi.groundColor.set(e.hemiGround),this.hemi.intensity=e.hemiI,this.sun.color.set(e.sun),this.sun.intensity=e.sunI,this.renderer.toneMappingExposure=(e.exposure??1.05)*.95,this.atmosW=-1}applyAtmosphere(e){if(this.atmosOn||(e=0),Math.abs(e-this.atmosW)<.002)return;this.atmosW=e;const t=this.tone,n=tp,i=this.scene.fog;i.color.set(t.fog).lerp(Ia.set(n.fog),e),this.scene.background.copy(i.color),i.near=t.fogNear+(n.fogNear-t.fogNear)*e,i.far=t.fogFar+(n.fogFar-t.fogFar)*e,this.camera.far!==i.far+2&&(this.camera.far=i.far+2,this.camera.updateProjectionMatrix()),this.hemi.color.set(t.hemiSky).lerp(Ia.set(n.hemiSky),e),this.hemi.groundColor.set(t.hemiGround).lerp(Ia.set(n.hemiGround),e),this.hemi.intensity=t.hemiI+(n.hemiI-t.hemiI)*e,this.sun.color.set(t.sun).lerp(Ia.set(n.sun),e),this.sun.intensity=t.sunI+(n.sunI-t.sunI)*e,this.sunOffset.copy(sd).lerp(n.sunOffset,e)}buildLevel(e,t=1){this.arenaFloor?.material.map?.dispose(),this.arenaFloor?.material.dispose(),this.arenaFloor?.geometry.dispose(),this.arenaRuins?.traverse(C=>{C instanceof ps&&(C.dispose(),C.geometry.dispose(),C.material.dispose())});for(const C of[this.glow,this.shafts])C?.mesh.geometry.dispose(),C?.mat.dispose();this.glow=this.shafts=null,this.arenaDeco?.dispose(),this.arenaDeco=null,this.openingFx?.dispose(),this.openingFx=null,this.env.clear(),this.flames=[],this.pillars=[],this.gates.clear(),this.occluders=[];const n=this.q.groundRes/2,i=this.q.groundRes,r=document.createElement("canvas");r.width=n,r.height=i;const a=r.getContext("2d"),o=n/(kt.x1-kt.x0),l=i/(kt.z1-kt.z0),c=C=>(C-kt.x0)*o,h=C=>(C-kt.z0)*l,u=this.tone,d=a.createLinearGradient(0,0,0,i);d.addColorStop(0,hr(u.grassB)),d.addColorStop(1,hr(u.grassA)),a.fillStyle=d,a.fillRect(0,0,n,i);const f=Pt.walkable.find(C=>C.id==="arena"&&C.type==="circle");if(f?.type==="circle"){const C=c(f.x),A=h(f.z),U=a.createRadialGradient(C,A,6*o,C,A,31*o);U.addColorStop(0,"#526f65"),U.addColorStop(.44,"#526f65e6"),U.addColorStop(1,"#526f6500"),a.fillStyle=U,a.fillRect(0,0,n,i)}let p=t*9301+49297;const x=()=>(p=(p*9301+49297)%233280)/233280;for(let C=0;C<n*i/60;C++)a.fillStyle=x()<.5?"rgba(255,255,255,0.06)":"rgba(0,40,0,0.06)",a.fillRect(x()*n,x()*i,2+x()*3,2+x()*3);const m=(C,A)=>{a.fillStyle=A;for(const U of Pt.walkable)a.beginPath(),U.type==="circle"?(a.arc(c(U.x),h(U.z),(U.r+C)*o,0,Math.PI*2),a.fill()):(a.lineCap="round",a.strokeStyle=A,a.lineWidth=(U.r+C)*2*o,a.moveTo(c(U.ax),h(U.az)),a.lineTo(c(U.bx),h(U.bz)),a.stroke())};m(.9,hr(u.pathEdge,.55)),m(.15,hr(u.pathEdge)),m(-.25,this.opening?b1(a,this.opening,h):hr(u.path));for(let C=0;C<n*i/90;C++){const A=x()*n,U=x()*i;a.fillStyle="rgba(120,90,60,0.07)",a.fillRect(A,U,3,2)}const g=new $r(r);g.colorSpace=Dt,g.anisotropy=4,g.minFilter=Jn;const v=new at(new ui(kt.x1-kt.x0,kt.z1-kt.z0),new jn({map:g}));v.rotation.x=-Math.PI/2,v.position.set((kt.x0+kt.x1)/2,0,(kt.z0+kt.z1)/2),v.receiveShadow=!0,this.env.add(v),f?.type==="circle"&&(this.arenaFloor=i1(f,this.q.groundRes,t),this.arenaRuins=r1(f,t),this.env.add(this.arenaFloor,this.arenaRuins),this.arenaDeco=YS(f,this.q,t),this.arenaDeco&&this.env.add(this.arenaDeco.group),this.atmosOn&&this.q.glow&&this.flags.get("glow")!=="0"&&(this.glow=h1(f),this.env.add(this.glow.mesh)),this.atmosOn&&this.q.rays&&this.flags.get("rays")!=="0"&&(this.shafts=u1(f),this.env.add(this.shafts.mesh)));const y=new at(new ui(400,400),new jn({color:u.grassA}));y.rotation.x=-Math.PI/2,y.position.y=-.02,this.env.add(y);const _={},S=(C,A,U,z,B)=>{this.opening&&C==="crystal_cluster"&&T1(this.opening,A,U)||(_[C]??(_[C]=[])).push(new ke().compose(new F(A,0,U),new In().setFromEuler(new Nn(0,B,0)),new F(z,z,z)))},T=this.q.decoDensity,M=Math.round(2600*T);for(let C=0;C<M;C++){const A=kt.x0+x()*(kt.x1-kt.x0),U=kt.z0+x()*(kt.z1-kt.z0),z=I1(A,U),B=x(),K=x()*6.28;z>2.2&&z<16?B<.06+.25/(1+z*.3)&&S(u.treeMix[Math.floor(x()*u.treeMix.length)],A,U,.8+x()*.6,K):z>.4&&z<=2.2?B<.05?S("rock_a",A,U,.6+x()*.7,K):B<.09?S("bush",A,U,.7+x()*.6,K):B<.2?S("flower_patch",A,U,.8+x()*.6,K):B<.225?S("crystal_cluster",A,U,.6+x()*.8,K):B<.245&&S("mushroom_glow",A,U,.8+x()*.6,K):z>=16&&B<.05&&S("tree_pine",A,U,1+x()*.5,K)}if(f?.type==="circle")for(let C=0;C<26;C++){const A=C*Math.PI/13,U=f.r+.7+x()*.7,z=f.x+Math.cos(A)*U,B=f.z+Math.sin(A)*U;Math.abs(z-f.x)<3.6&&B>f.z||S(C%3===0?"rock_a":"flower_patch",z,B,.85+x()*.4,x()*Math.PI*2)}const b=new Map,I=[];for(const[C,A]of Object.entries(_))for(const U of cc(C,b))I.push({name:C,mats:A,part:U});I.sort((C,A)=>C.part.rank-A.part.rank);for(const{name:C,mats:A,part:U}of I){const z=md(U.material,this.nearFadeU),B=new ps(U.geometry,z,A.length);A.forEach((K,X)=>B.setMatrixAt(X,new ke().multiplyMatrices(K,U.matrix))),B.castShadow=C.startsWith("tree"),B.computeBoundingSphere(),this.env.add(B)}const R=(C,A,U,z=0,B=1)=>{const K=qc(C);return K.position.set(A,0,U),K.rotation.y=z,K.scale.setScalar(B),this.env.add(K),K};R("tent",-3.6,-1.2,.4);const D=R("campfire",1.6,1.2);this.flames=["flame","flame2","campfire_flame"].map(C=>D.getObjectByName(C)).filter(Boolean),R("signpost",2.6,-4.2,-.5),R("lantern_post",-2.4,-6),R("lantern_post",2.8,-10),R("fence",-4.5,3.5,.3),R("fence",4.8,3.2,-.4),R("lantern_post",6.5,-44),R("lantern_post",-.4,-46);const L=R("lumen_spring",Pt.spring.x,Pt.spring.z);this.springGem=L.getObjectByName("gem")??null;for(const C of Pt.pillars){const A=R("crystal_pillar",C.x,C.z,C.x*.3);this.pillars.push(A),this.addOccluder(A,C.r+.2,4.5)}VS(this.pillars);for(const C of Pt.gates){const A=R("crystal_gate",C.x,C.z,Math.atan2(-C.dirz,C.dirx)),U=e.gates[C.id];A.position.y=U?-4:0,A.visible=!U,this.gates.set(C.id,{g:A,open:U,y:A.position.y}),this.addOccluder(A,3.2,3),this.opening&&R1(this.occluders[this.occluders.length-1].mats,this.opening)}R("lantern_post",-6,-63.5),R("lantern_post",2,-63.5),this.opening&&(this.openingFx=L1(this.env,this.opening,C=>md(C,this.nearFadeU),this.nearFadeU));for(const C of this.actors.values())this.scene.remove(C.root);this.actors.clear();for(const C of e.actors)this.addActor(C);if(this.playerMark||(this.vfxVar!=="cur"?this.playerMark=f1(ol[this.vfxVar]):this.playerMark=new at(new Hr(.55,.7,32),new Yt({color:ne.lumen,transparent:!0,opacity:.85,depthTest:!1,depthWrite:!1})),this.playerMark.rotation.x=-Math.PI/2,this.playerMark.renderOrder=12,this.scene.add(this.playerMark)),this.particles||(this.particles=new LS(this.scene,this.q.particles),this.rings=new IS(this.scene)),this.skillFx?.dispose(),this.stageVfx?.dispose(),this.stageVfx=null,this.vfxVar==="cur")this.skillFx=new OS(this.scene,this.q.tier,this.vfx);else{const C=new BS(this.scene,this.q.tier,this.vfx,ol[this.vfxVar]);C.attach(this.camera,this.actors.get(e.player.id)?.parts.hero_sword??null),this.skillFx=C,this.stageVfx=new v1(this.scene,this.q,ol[this.vfxVar])}}addActor(e){const t=e.kind==="player"?ES():e.kind==="puffcap"?wS():e.kind==="thornling"?AS():RS(),n=new Ne;n.add(t),n.scale.setScalar(e.kind==="prismback"?1.05:1.22);const i={};t.traverse(o=>{o.name&&(i[o.name]=o)}),e.kind==="prismback"&&i.prismback_shell?.traverse(o=>{const l=o;l.isMesh&&(l.material=l.material.clone())}),e.kind==="prismback"&&this.addOccluder(n,e.r,3.6,e),e.kind==="player"&&(t.traverse(o=>{const l=o;if(!l.isMesh)return;const c=l.material.clone();c.transparent=!0,c.depthWrite=!0,l.material=c,l.renderOrder=13}),this.opening&&C1(i.hero_head,this.opening));const r=DS(e.r);n.add(r);const a=new Ne;for(let o=0;o<3;o++){const l=new at(D1(),new Yt({color:ne.gold,transparent:!0,depthWrite:!1,depthTest:!1}));l.renderOrder=11,a.add(l)}a.visible=!1,n.add(a),this.scene.add(n),this.actors.set(e.id,{a:e,root:n,model:t,parts:i,px:e.x,pz:e.z,cx:e.x,cz:e.z,shadow:r,stars:a,flash:0,deathT:0,hopH:e.kind==="prismback"?4.2:(e.kind==="puffcap",1.2)})}beforeTick(){for(const e of this.actors.values())e.px=e.a.x,e.pz=e.a.z}onEvents(e,t){for(const n of e)switch(n.t){case"hit":{const i=[...this.actors.values()].find(r=>r.a.id===n.target);if(i&&(i.flash=.18),this.stageVfx&&n.byPlayer){const r=this.stageVfx.style.hit,a=i?.a.kind==="prismback",o=this.stageVfx.onHit(t.tick,n.x,n.z,t.player,a?2:n.crit?1:0,i?.a.r??1,this.camera.position);a||this.particles.burst(n.x,o-.15,n.z,n.crit?Bt.violet:Bt.lumenHi,n.crit?r.parts+4:r.parts,3.4,r.partUp,.5,r.partSize*(n.crit?1.25:1))}else this.particles.burst(n.x,.9,n.z,n.byPlayer?n.crit?ne.gold:16777215:16734826,n.crit?14:8,3.2,2.5,.45,n.crit?1.4:1);n.byPlayer?n.crit&&(this.shake=Math.max(this.shake,.15)):this.shake=Math.max(this.shake,.35);break}case"swing":{const i=t.player;this.rings.arc(i.x,i.z,Math.atan2(-i.fx,-i.fz),Yi.combo[n.step].range+.3,n.step===2?this.stageVfx?Bt.violet:ne.gold:ne.lumen,n.step);break}case"skill":break;case"skill-hit":this.skillFx?.onSkillHit(n.slot,t.tick,n.x,n.z,n.dx,n.dz);break;case"perfect":{this.rings.ring(n.x,n.z,.4,2.6,16777215,.35,1);const i=this.stageVfx?.style.perfect;i?.echo&&(this.rings.ring(n.x,n.z,.3,1.9,Bt.violet,.5,.9,.08,!0),this.particles.burst(n.x,1.1,n.z,Bt.violet,i.parts-16,4.5,3.4,.7,1.2)),this.particles.burst(n.x,1,n.z,ne.lumen,16,4,3,.6);break}case"dodge":{const i=t.player;this.particles.burst(i.x,.15,i.z,15326404,6,1.5,.6,.4,1.2,2);break}case"death":{const i=this.actors.get(n.id);i&&this.particles.burst(i.a.x,.8,i.a.z,i.a.kind==="prismback"?ne.lumen:ne.blossom,i.a.kind==="prismback"?60:18,4,4,.9);break}case"pillar-break":{const i=Pt.pillars[n.i];this.pillars[n.i].visible=!1,this.particles.burst(i.x,2,i.z,ne.violet,36,5,5,1,1.6),this.shake=.6;break}case"stun":this.shake=Math.max(this.shake,n.long?.5:.25);break;case"gate":{const i=this.gates.get(n.id);i&&(i.open=n.open,i.g.visible=!0);break}case"heal":{const i=t.player;this.particles.burst(i.x,1,i.z,9306032,12,1.2,2,.8,1,-1);break}case"boss-phase":case"boss-roar":{const i=t.boss;this.rings.ring(i.x,i.z,1,9,dl,.6,.6),this.shake=.5;break}case"respawn":case"pillars-regrow":for(let i=0;i<this.pillars.length;i++)this.pillars[i].visible=t.pillars[i].alive;break}}render(e,t,n){this.time+=n;const i=new Set,r=e.tele.length?this.actors.get(this.findBossId()):void 0;for(const l of e.tele){i.add(l.id);let c=this.teles.get(l.id);c||(c=this.makeTele(l)),c.mat.uniforms.uProg.value=1-Math.max(0,l.t)/l.total,c.mat.uniforms.uTime.value=this.time,r?.a.alive?c.mat.uniforms.uBoss.value.set(r.root.position.x,r.root.position.z,r.a.r):c.mat.uniforms.uBoss.value.set(0,0,0)}for(const[l,c]of this.teles)if(!i.has(l)){if(c.t.area&&!e.ps.down){const h=dd.has(c.t.atk.id)?dl:ud;c.t.shape==="circle"&&this.rings.ring(c.t.x,c.t.z,c.t.r*.5,c.t.r*1.05,h,.25,.9),this.particles.burst(c.t.x,.3,c.t.z,h,c.t.r>3?18:8,c.t.r*1.5,2,.4)}this.scene.remove(c.m),c.m.geometry.dispose(),c.mat.dispose(),this.teles.delete(l)}for(const l of this.actors.values())this.animateActor(l,e,t,n);for(const l of this.gates.values()){const c=l.open?-4:0;l.y+=(c-l.y)*Math.min(1,n*3),l.g.position.y=l.y,l.open&&l.y<-3.9&&(l.g.visible=!1)}for(const l of this.flames)l.scale.y=.85+Math.sin(this.time*17+l.id)*.15,l.rotation.y+=n*2;this.openingFx?.update(this.time),this.springGem&&(this.springGem.position.y=1.3+Math.sin(this.time*2)*.12,this.springGem.rotation.y+=n),this.particles.update(n),this.rings.update(n),this.skillFx?.update(e.tick,t,e.ps.cast),this.stageVfx&&this.stageVfx.update(e.tick,t,this.time,this.camera,this.camTarget,this.actors.get(e.player.id)?.root.position.z??0,this.renderer);const a=this.actors.get(e.player.id);this.applyAtmosphere(a?np(a.root.position.z):0);const o=this.atmosW;this.glow&&(this.glow.mesh.visible=o>.01,this.glow.mat.uniforms.uI.value=.55*o,this.glow.mat.uniforms.uTime.value=this.time),this.shafts&&(this.shafts.mesh.visible=o>.01,this.shafts.mat.uniforms.uI.value=.16*o),this.arenaDeco?.update(this.time),this.updateCamera(e,n),this.updateOccluders(e,n),this.renderer.render(this.scene,this.camera)}makeTele(e){const t=dd.has(e.atk.id)?dl:ud;let n,i=0;e.shape==="line"?(n=new ui(e.w,e.r),n.rotateX(-Math.PI/2),n.translate(0,0,-e.r/2),i=2):(n=new ui(e.r*2,e.r*2),n.rotateX(-Math.PI/2),i=e.shape==="cone"?1:0);const r=NS(t,i,e.cos,fc/e.r),a=new at(n,r);a.position.set(e.x,.06+this.teles.size*.004,e.z),e.shape!=="circle"&&(a.rotation.y=Math.atan2(-e.dx,-e.dz)),a.renderOrder=10,e.shape==="line"&&(e.owner,this.findBossId()),this.scene.add(a);const o={t:e,m:a,mat:r};return this.teles.set(e.id,o),o}findBossId(){for(const e of this.actors.values())if(e.a.kind==="prismback")return e.a.id;return-1}animateActor(e,t,n,i){const r=e.a,a=this.time,o=e.px+(r.x-e.px)*n,l=e.pz+(r.z-e.pz)*n;e.root.position.set(o,0,l);let h=Math.atan2(r.fx,r.fz)-e.model.rotation.y;h=Math.atan2(Math.sin(h),Math.cos(h)),e.model.rotation.y+=h*Math.min(1,i*(r.kind==="prismback"?6:16)),e.flash=Math.max(0,e.flash-i);const u=e.flash>0?1+e.flash*.9:1;if(e.model.position.set(0,0,0),e.model.rotation.x=0,e.model.rotation.z=0,e.model.scale.set(u,u,u),e.stars.visible=!1,!r.alive){e.deathT+=i;const f=Math.max(0,1-e.deathT/.45);e.model.scale.setScalar(f*1.1),e.shadow.visible=f>0,e.root.visible=f>0;return}e.root.visible=r.kind!=="prismback"||t.bossStarted||z1(t.player,r)<900;const d=e.parts;if(r.kind==="player"){const f=t.ps,p=d.hero_sword,x=d.hero_head;if(f.down){e.model.rotation.z=Math.PI/2*.9,e.model.position.y=.2;return}const m=f.moving&&f.dodgeT<=0;if(m&&(e.model.position.y=Math.abs(Math.sin(a*13))*.07,e.model.rotation.x=.12),x&&(x.rotation.z=m?Math.sin(a*13)*.06:Math.sin(a*2)*.03),p){const g=f.cast,v=this.skillFx?this.skillFx.hitAge(1,t.tick,n):null;let y=null;if(g?y=ju(g.slot,Math.max(0,g.tick-1+n)):v!==null&&v<6&&f.dodgeT<=0&&(y=ju(1,10+v)),y)p.position.set(.36,.5+y.dy,.12),p.rotation.set(y.rx,y.ry,0),e.model.rotation.x=y.lean,e.model.position.y=y.hop;else if(f.swingT>0){const _=1-f.swingT/f.swingDur,S=1-(1-_)*(1-_),T=f.combo===1?-1:1;p.rotation.set(-1.2+(f.combo===2?S*2.6:0),T*(1.4-S*2.8),0)}else f.castT>0?(p.rotation.set(-2.6,0,0),e.model.position.y=.15):p.rotation.set(-.35,0,.2);y||p.position.set(.36,.5,.12)}f.dodgeT>0&&(e.model.scale.set(.9,.82,1.25),e.model.rotation.x=.4),f.drinkT>0&&x&&(x.rotation.x=-.5),f.empowered&&(e.stars.visible=!0,this.spinStars(e,1.9,.5))}else if(r.kind==="puffcap"){const f=d.puffcap_cap;if(r.state==="windup")e.model.position.x=Math.sin(a*50)*.05,e.model.scale.y=.82+Math.sin(a*10)*.05;else if(r.state==="hop"){const p=1-Math.max(0,r.st)/.3;e.model.position.y=4*e.hopH*p*(1-p),e.model.scale.y=1.15}else r.state==="recover"?(e.model.rotation.z=Math.sin(a*6)*.25,e.stars.visible=!0,this.spinStars(e,1.25,.45)):e.model.position.y=Math.abs(Math.sin(a*7+r.id))*.08;f&&(f.rotation.y+=i*(r.state==="windup"?8:.5))}else if(r.kind==="thornling"){const f=d.thornling_body;f&&(r.state==="windup"?(f.rotation.y+=i*25,e.model.rotation.x=-.25):r.state==="rush"?f.rotation.x+=i*30:r.state==="recover"?(e.model.rotation.z=Math.sin(a*6)*.3,e.stars.visible=!0,this.spinStars(e,1.15,.4)):(f.rotation.x+=i*4,e.model.position.y=Math.abs(Math.sin(a*9))*.06))}else{const f=d.prismback_body,p=d.prismback_shell,x=d.prismback_horn,m=d.prismback_legs,g=t.tele.find(_=>_.owner===r.id),v=g?1-Math.max(0,g.t)/g.total:0;m&&(m.position.y=r.state==="approach"?Math.abs(Math.sin(a*8))*.08:0),r.state==="windup"&&r.atk==="slam"&&(e.model.position.y=v*.9,e.model.rotation.x=-v*.15),r.state==="windup"&&r.atk==="charge"&&(e.model.position.z=-v*.4,e.model.rotation.x=.12),r.state==="windup"&&r.atk==="sweep"&&x?x.rotation.y=-v*.8:x&&(x.rotation.y*=.8),r.state==="charge"&&(e.model.rotation.x=.18,Math.random()<.5&&this.particles.burst(r.x,.2,r.z,14272421,2,1.5,1,.4,1.4,3)),r.state==="recover"&&r.atk==="slam"&&(e.model.position.y=Math.max(0,.15-r.st*.1));const y=r.state==="stunned";if(y&&(e.model.rotation.z=Math.sin(a*4)*.08,e.stars.visible=!0,this.spinStars(e,4.2,1.2)),r.state==="roar"||r.state==="intro"){const _=1+Math.sin(a*30)*.02;e.model.scale.set(_,_,_),f&&(f.rotation.x=-.1)}p&&p.traverse(_=>{const S=_;S.isMesh&&(S.material.emissiveIntensity=y?1.4+Math.sin(a*10)*.4:t.phase===2?.9:.55)})}}spinStars(e,t,n){e.stars.children.forEach((i,r)=>{const a=this.time*4+r*Math.PI*2/3;i.position.set(Math.cos(a)*n,t+Math.sin(this.time*6+r)*.05,Math.sin(a)*n),i.quaternion.copy(this.camera.quaternion)})}updateCamera(e,t){const n=this.actors.get(e.player.id),i=n.root.position.x,r=n.root.position.z,a=e.bossStarted&&e.boss.alive,o=a?e.boss.x-i:0,l=a?e.boss.z-r:0,c=Math.hypot(o,l),h=this.camera.aspect<1,u=h?0:1,d=(a?1.18+Math.min(.22,Math.max(0,c-5)*.03):.86)*(h?1.35:1),f=a?Math.min(2,Math.max(0,-l-10)*.2):0,p=a&&!h?Math.min(7,Math.max(0,l+2.5)+Math.max(0,Math.abs(o)-4)*.5):0,x=i+o*(.18+.16*u),m=.6-.45*u,g=h?r-(a?2.6+2.4*u:2.4)+Math.max(0,l)*.6:r-5+p*.55,v=10.5*d*(1-u)+(4.5+f+p*.42)*u,y=(g+9*d)*(1-u)+(r+5.5+f+p)*u,_=1-Math.exp(-t*6);this.camBase.lengthSq()===0&&(this.camTarget.set(x,m,g),this.camBase.set(x,v,y)),this.camTarget.lerp(pl.set(x,m,g),_),this.camBase.lerp(pl.set(x,v,y),_);const S=h||this.noPull?0:this.pullNeeded(e,i,r);S>this.camPull?(this.camPull+=(S-this.camPull)*(1-Math.exp(-t*10)),this.camPullHold=.7):S>.01?this.camPullHold=Math.max(this.camPullHold,.35):(this.camPullHold-=t)<=0&&(this.camPull=Math.max(0,this.camPull-t*.9)),this.camPull<.002&&(this.camPull=0),this.camPos.copy(this.camBase).sub(this.camTarget).multiplyScalar(1+this.camPull).add(this.camTarget),this.shake=Math.max(0,this.shake-t*2.2);const T=this.shake*this.shake*.6;this.camera.position.set(this.camPos.x+(Math.random()-.5)*T,this.camPos.y+(Math.random()-.5)*T,this.camPos.z),this.camera.lookAt(this.camTarget),this.nearFadeU.value=Math.hypot(this.camPos.y,this.camPos.z-this.camTarget.z)*.72;const M=this.sunOffset;this.q.shadows?(this.sun.position.set(this.camTarget.x+M.x,M.y,this.camTarget.z+M.z),this.sun.target.position.set(this.camTarget.x,0,this.camTarget.z)):(this.sun.position.copy(M),this.sun.target.position.set(0,0,0))}pullNeeded(e,t,n){const i=this.pullPts;i.length=0;const r=(c,h,u)=>{i.push(c,h,u)};r(t,0,n),r(t,1.6,n);for(const c of e.tele)if(c.shape==="circle")for(let h=0;h<16;h++){const u=h*(Math.PI/8);r(c.x+Math.cos(u)*c.r,0,c.z+Math.sin(u)*c.r)}else if(c.shape==="cone"){const h=Math.atan2(c.dz,c.dx),u=Math.acos(Math.min(1,Math.max(-1,c.cos)));r(c.x,0,c.z);for(let d=0;d<=6;d++){const f=h-u+2*u*d/6;r(c.x+Math.cos(f)*c.r,0,c.z+Math.sin(f)*c.r)}}else{const h=(t-c.x)*c.dx+(n-c.z)*c.dz,u=Math.min(c.r,Math.max(6,h+4)),d=c.w/2,f=-c.dz,p=c.dx;for(const x of[0,u])for(const m of[-d,d])r(c.x+c.dx*x+f*m,0,c.z+c.dz*x+p*m)}for(const c of e.actors){if(c.kind==="player"||!c.alive)continue;const h=c.kind==="prismback";if(h){if(!e.bossStarted)continue}else{const f=Math.hypot(c.x-t,c.z-n);if(c.state==="idle"||c.state==="dead"||f>10)continue}const u=h?3.2:1.3,d=c.r;for(const[f,p]of[[-d,0],[d,0],[0,-d],[0,d]])r(c.x+f,0,c.z+p),r(c.x+f,u,c.z+p)}const a=this.pullCam,o=this.camera.projectionMatrix.elements,l=F1.copy(this.camBase).sub(this.camTarget);a.near=this.camera.near;for(let c=0;c<=fd+1e-6;c+=.1){a.position.copy(this.camTarget).addScaledVector(l,1+c),a.lookAt(this.camTarget),a.updateMatrixWorld(!0);const h=a.matrixWorldInverse.elements;let u=!0;for(let d=0;d<i.length&&u;d+=3){const f=i[d],p=i[d+1],x=i[d+2],m=h[2]*f+h[6]*p+h[10]*x+h[14];if(m>-a.near){u=!1;break}const g=o[0]*(h[0]*f+h[4]*p+h[8]*x+h[12])/-m,v=o[5]*(h[1]*f+h[5]*p+h[9]*x+h[13])/-m;(g<-pd||g>pd||v<k1||v>O1)&&(u=!1)}if(u)return c}return fd}addOccluder(e,t,n,i){const r=[],a=[],o=[];if(e.traverse(l=>{const c=l;if(!c.isMesh||l===this.playerMark)return;const h=c.material.clone();c.material=h,r.push(h),c.userData.twin?a.push(c):o.push(c)}),a.length){for(const l of a)l.visible=!0;for(const l of o)l.visible=!1}else o.length=0;this.occluders.push({obj:e,r:t,h:n,mats:r,f:1,actor:i,twins:a,parts:o})}updateOccluders(e,t){const n=this.actors.get(e.player.id);if(!n)return;const i=n.root.position.x,r=n.root.position.z,a=Math.max(.86,Math.min(1.8,(this.camPos.z-r)/Math.max(1,this.camPos.y-1)));this.playerMark&&(this.playerMark.position.set(i,.05,r),this.playerMark.visible=!e.ps.down);for(const o of this.occluders){const l=o.obj.position.x,c=o.obj.position.z,h=c-r,u=o.h*a+o.r+.6,f=o.obj.visible&&h>-.6&&h<u&&Math.abs(l-i)<o.r+.8?.28:1;o.f+=(f-o.f)*Math.min(1,t*10),Math.abs(o.f-f)<.01&&(o.f=f);const p=o.f<.99;if(o.twins.length&&o.twins[0].visible===p){for(const x of o.twins)x.visible=!p;for(const x of o.parts)x.visible=p}for(const x of o.mats)x.transparent!==p&&(x.transparent=p,x.depthWrite=!p,x.needsUpdate=!0),x.opacity=o.f}}project(e,t,n,i){const r=pl.set(e,t,n).project(this.camera);return i.x=(r.x*.5+.5)*window.innerWidth,i.y=(-r.y*.5+.5)*window.innerHeight,i.vis=r.z>=-1&&r.z<1,i}actorScreenPos(e,t,n){const i=this.actors.get(e);return i?this.project(i.root.position.x,t+i.model.position.y,i.root.position.z,n):(n.vis=!1,n)}}const pl=new F,Ia=new le,F1=new F,fd=1.2,pd=.94,O1=.94,k1=-.86;function z1(s,e){return(s.x-e.x)**2+(s.z-e.z)**2}function md(s,e){const t=s.clone(),n=t.onBeforeCompile.bind(t),i=t.customProgramCacheKey.bind(t);return t.onBeforeCompile=(r,a)=>{n(r,a),r.uniforms.uNearFade=e,r.fragmentShader=`uniform float uNearFade;
`+r.fragmentShader.replace("void main() {",`void main() {
      float nfT = smoothstep(uNearFade, uNearFade + 3.0, length(vViewPosition));
      float nfB = mod(floor(gl_FragCoord.x), 2.0) * 0.5 + mod(floor(gl_FragCoord.y), 2.0) * 0.25 + 0.125;
      if (nfT < nfB) discard;`)},t.customProgramCacheKey=()=>i()+"nearfade",t}function hr(s,e=1){const t=s>>16&255,n=s>>8&255,i=s&255;return e===1?`rgb(${t},${n},${i})`:`rgba(${t},${n},${i},${e})`}const gd={attack:pt.ATTACK,dodge:pt.DODGE,skill:pt.SKILL,skill2:pt.SKILL2,skill3:pt.SKILL3,potion:pt.POTION,retry:pt.RETRY};class B1{constructor(e,t,n){N(this,"pending",{attack:0,dodge:0,skill:0,skill2:0,skill3:0,potion:0,retry:0});N(this,"held",{attack:!1,dodge:!1,skill:!1,skill2:!1,skill3:!1,potion:!1,retry:!1});N(this,"lastBits",0);N(this,"stickId",null);N(this,"ox",0);N(this,"oy",0);N(this,"sx",0);N(this,"sy",0);N(this,"keys",new Set);N(this,"bot",null);N(this,"autoPending",null);N(this,"enabled",!0);N(this,"usedStick",!1);N(this,"usedAttack",!1);N(this,"usedDodge",!1);N(this,"zone");N(this,"base");N(this,"knob");this.zone=e,this.base=t,this.knob=n;let i=58;e.addEventListener("pointerdown",a=>{this.stickId===null&&(this.stickId=a.pointerId,e.setPointerCapture(a.pointerId),i=t.clientWidth*(58/124),this.ox=a.clientX,this.oy=a.clientY,t.style.left=`${a.clientX}px`,t.style.top=`${a.clientY}px`,t.classList.add("on"),n.style.transform="translate(-50%,-50%)")}),e.addEventListener("pointermove",a=>{if(a.pointerId!==this.stickId)return;let o=a.clientX-this.ox,l=a.clientY-this.oy;const c=Math.hypot(o,l);c>i&&(this.ox+=o/c*(c-i),this.oy+=l/c*(c-i),o=o/c*i,l=l/c*i,t.style.left=`${this.ox}px`,t.style.top=`${this.oy}px`);const h=8,u=Math.max(0,Math.hypot(o,l)-h)/(i-h),d=Math.hypot(o,l)||1;this.sx=o/d*u,this.sy=l/d*u,u>.3&&(this.usedStick=!0),n.style.transform=`translate(calc(-50% + ${o}px), calc(-50% + ${l}px))`});const r=a=>{a.pointerId===this.stickId&&(this.stickId=null,this.sx=this.sy=0,this.resetStick())};e.addEventListener("pointerup",r),e.addEventListener("pointercancel",r),e.addEventListener("lostpointercapture",r),addEventListener("keydown",a=>{if(a.repeat)return;this.keys.add(a.code);const l={KeyJ:"attack",KeyZ:"attack",KeyK:"dodge",KeyX:"dodge",Space:"dodge",KeyL:"skill",KeyC:"skill",Digit1:"skill",Digit2:"skill2",Digit3:"skill3",KeyQ:"potion",KeyH:"potion",KeyR:"retry",Enter:"retry"}[a.code];l&&(this.press(l),a.preventDefault())}),addEventListener("keyup",a=>this.keys.delete(a.code)),addEventListener("blur",()=>{this.keys.clear(),this.releaseAll()})}bindButton(e,t,n=!1){e.addEventListener("pointerdown",r=>{r.preventDefault(),r.stopPropagation(),this.press(t),n&&(this.held[t]=!0),e.classList.add("down")});const i=()=>{this.held[t]=!1,e.classList.remove("down")};e.addEventListener("pointerup",i),e.addEventListener("pointercancel",i),e.addEventListener("pointerleave",i)}queueAuto(e){this.autoPending=e}press(e){this.pending[e]=Math.min(2,this.pending[e]+1),e==="attack"&&(this.usedAttack=!0),e==="dodge"&&(this.usedDodge=!0)}releaseAll(){for(const e of Object.keys(this.held))this.held[e]=!1;this.stickId=null,this.sx=this.sy=0,this.resetStick()}resetStick(){this.base.classList.remove("on"),this.base.style.removeProperty("left"),this.base.style.removeProperty("top"),this.knob.style.removeProperty("transform")}sample(){const e=this.sampleManual();return this.autoPending&&(e.auto=this.autoPending,this.autoPending=null),e}sampleManual(){if(this.bot)return{...this.bot()};if(!this.enabled)return this.lastBits=0,cs(0,0,0);let e=0;for(const a of Object.keys(gd)){const o=gd[a];this.lastBits&o||(this.pending[a]>0?(e|=o,this.pending[a]--):this.held[a]&&(e|=o))}this.lastBits=e;let t=this.sx,n=this.sy;const i=(this.keys.has("KeyD")||this.keys.has("ArrowRight")?1:0)-(this.keys.has("KeyA")||this.keys.has("ArrowLeft")?1:0),r=(this.keys.has("KeyS")||this.keys.has("ArrowDown")?1:0)-(this.keys.has("KeyW")||this.keys.has("ArrowUp")?1:0);if(i||r){const a=Math.hypot(i,r);t=i/a,n=r/a,this.usedStick=!0}return cs(t,n,e)}}const Ti={move:{icon:"🕹",text:"ลากนิ้วที่ครึ่งจอซ้ายเพื่อเดิน เดินตามทางไปยังคริสตัลข้างหน้า"},attack:{icon:"⚔",text:"แตะ ⚔ เพื่อฟัน แตะต่อเนื่องเพื่อคอมโบ 3 จังหวะ",when:s=>s.actors.some(e=>e.kind!=="player"&&e.alive&&e.active)},dodge:{icon:"↯",text:"วงสีส้มคือจุดที่จะโดนโจมตี เดินออกนอกวง หรือกด ↯ พุ่งหลบ",when:s=>s.tele.some(e=>e.area&&e.t>.35),urgent:!0},perfectTeach:{icon:"✨",text:"เคล็ดลับ: กด ↯ ตอนวงใกล้เต็ม ถ้าพุ่งผ่านการโจมตีพอดีจะได้ PERFECT ตีแรงขึ้น ×1.5"},counter:{icon:"✦",text:"ศัตรูที่มีดาว ✦ หมุนบนหัวกำลังเสียหลัก ตีสวนตอนนี้!",when:s=>s.actors.some(e=>e.kind!=="player"&&e.alive&&(e.state==="recover"||e.state==="stunned"))},skill:{icon:"✧",text:"ศัตรูหลายตัว! ✧ ระฆังสะท้อนตีรอบตัวและขัดจังหวะท่าที่กำลังชาร์จ",when:s=>s.actors.filter(e=>e.kind!=="player"&&e.alive&&e.active).length>=2},line:{icon:"➤",text:"แถบยาวคือแนวพุ่งชน ก้าวออกด้านข้าง อย่าถอยหลังตามแถบ",when:s=>s.tele.some(e=>e.shape==="line"&&e.t>.3),urgent:!0},perfect:{icon:"✨",text:"หลบเพอร์เฟกต์! ตีครั้งถัดไปแรงขึ้น ×1.5 และคูลดาวน์สกิลลดลง"},spring:{icon:"💧",text:"บ่อแสงฟื้นพลังและเติมยา ถ้าแพ้ที่บอส จะกลับมาเริ่มที่นี่"},pillar:{icon:"💎",text:"ยืนหน้าเสาคริสตัลเพื่อล่อบอสพุ่งชน แล้วก้าวหลบด้านข้าง บอสจะมึนนาน",when:s=>s.boss.state!=="intro"},phase2:{icon:"⚠",text:"บอสโกรธแล้ว! เสางอกใหม่ ท่าเร็วขึ้น และมีฝนผลึก ให้เดินตลอด",urgent:!0},pillarP2:{icon:"💎",text:"หลังฝนผลึก บอสจะพุ่งชนทุกครั้ง รีบไปยืนหน้าเสาแล้วหลบด้านข้าง!",urgent:!0},fadedButtons:{icon:"👆",text:"ปุ่มจางลงเพื่อให้เห็นวงเตือนข้างใต้ แต่ยังกดได้ตามปกติ",when:()=>!!document.querySelector(".act.seethru"),low:!0}},G1=4.5,H1=.5,V1=30,W1=s=>`<svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true"><rect x="4" y="0.5" width="4" height="3" rx="0.6" fill="#e9dcc4"/><path d="M4 3.5h4v2l2.6 3.2a4.6 4.6 0 1 1-9.2 0L4 5.5z" fill="${s?"#6ee07a":"rgba(255,255,255,0.12)"}" stroke="#fff" stroke-width="0.9"/></svg>`,Nt=s=>document.querySelector(s),so=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;class X1{constructor(){N(this,"hp",Nt("#hp-fill"));N(this,"hpText",Nt("#hp-text"));N(this,"potions",Nt("#potions"));N(this,"boss",Nt("#boss"));N(this,"bossFill",Nt("#boss-fill"));N(this,"bossName",Nt("#boss-name"));N(this,"timer",Nt("#timer"));N(this,"hint",Nt("#hint"));N(this,"hintTimer",0);N(this,"hintGap",0);N(this,"hintQueue",[]);N(this,"hintCur","");N(this,"hintShown",0);N(this,"lastPotions",-1);N(this,"taughtPerfect",!1);N(this,"taughtFade",!1);N(this,"w",null);N(this,"earlyAt",{w:null,tick:0});N(this,"actBtns",[...document.querySelectorAll(".act")]);N(this,"skillBtns",[Nt("#btn-skill"),Nt("#btn-skill2"),Nt("#btn-skill3")]);N(this,"skillNums",this.skillBtns.map(e=>e.querySelector(".cdnum")));N(this,"skillShown",[-1,-1,-1]);N(this,"_aria",(()=>{this.skillBtns.forEach((e,t)=>e.setAttribute("aria-label",`สกิล ${t+1} ${wt[t].nameTh}`)),Nt("#btn-ult").setAttribute("aria-label",`อัลติ ${yd.nameTh} (ล็อก)`)})());N(this,"dodgeBtn",Nt("#btn-dodge"));N(this,"potionBtn",Nt("#btn-potion"));N(this,"layer",Nt("#floaters"));N(this,"vignette",Nt("#vignette"));N(this,"banner",Nt("#banner"));N(this,"bars",new Map);N(this,"tmp",{x:0,y:0,vis:!1});N(this,"netChip",Nt("#net-chip"));this.bossName.textContent=Kn.prismback.nameTh,this.skillBtns.forEach((e,t)=>e.addEventListener("pointerdown",()=>this.denyIfNotReady(t+1))),addEventListener("keydown",e=>{if(e.repeat)return;const t={Digit1:1,KeyL:1,KeyC:1,Digit2:2,Digit3:3}[e.code];t&&this.denyIfNotReady(t)})}get skillBtn(){return this.skillBtns[0]}notReady(e){const t=this.w;if(!t||!t.player.alive||t.finished)return!1;const n=t.ps;return t.skillCooldown(e).remaining>$e+1e-6?!0:n.dodgeT>0||n.castT>0||!!n.cast&&(n.cast.slot===1||n.cast.tick+1<n.cast.endTick)}denyIfNotReady(e){if(!this.notReady(e))return;const t=this.skillBtns[e-1];t.classList.remove("denied"),t.offsetWidth,t.classList.add("denied"),clearTimeout(t._deny),t._deny=setTimeout(()=>t.classList.remove("denied"),400)}update(e,t,n){const i=e.player,r=e.ps;this.w=e,!this.taughtFade&&this.actBtns.some(o=>o.classList.contains("seethru"))&&(this.taughtFade=!0,this.queueHint("fadedButtons")),this.hp.style.width=`${i.hp/i.maxHp*100}%`,this.hp.classList.toggle("low",i.hp/i.maxHp<.3),this.hpText.textContent=`${Math.ceil(i.hp)} / ${i.maxHp}`,r.potions!==this.lastPotions&&(this.lastPotions=r.potions,this.potions.innerHTML=Array.from({length:Yi.potion.charges},(o,l)=>W1(l<r.potions)).join(""),this.potions.title=`ยาฟื้นพลัง ${r.potions} ขวด`),this.potionBtn.classList.toggle("empty",r.potions<=0),this.potionBtn.querySelector(".count").textContent=String(r.potions);for(let o=0;o<3;o++)this.skillCd(e,o+1);xd(this.dodgeBtn,Math.max(0,r.dodgeCd)/bd(e.variant)),this.skillBtn.classList.toggle("empowered",r.empowered),Nt("#btn-attack").classList.toggle("empowered",r.empowered),this.timer.textContent=so(e.tick/30);const a=e.bossStarted&&e.boss.alive;this.boss.classList.toggle("show",a),a&&(this.bossFill.style.width=`${e.boss.hp/e.boss.maxHp*100}%`,this.boss.classList.toggle("stunned",e.boss.state==="stunned"),this.boss.classList.toggle("p2",e.phase===2));for(const o of e.actors){if(o.kind==="player"||o.kind==="prismback")continue;let l=this.bars.get(o.id);if(!(o.alive&&o.active&&o.hp<o.maxHp)){l&&(l.style.display="none");continue}l||(l=document.createElement("div"),l.className="ebar",l.innerHTML="<i></i>",this.layer.appendChild(l),this.bars.set(o.id,l)),n(o.id,o.kind==="puffcap"?1.35:1.25,this.tmp),l.style.display=this.tmp.vis?"block":"none",l.style.transform=`translate(${this.tmp.x-22}px, ${this.tmp.y}px)`,l.firstChild.style.width=`${o.hp/o.maxHp*100}%`}this.tickHints(e,t)}onEvents(e,t,n){for(const i of e)if(i.t==="hit"&&!i.byPlayer&&!this.taughtPerfect&&t.stats.perfect===0&&t.ps.cause&&!["rush","charge"].includes(t.ps.cause.attackId)&&(this.taughtPerfect=!0,this.queueHint("perfectTeach")),i.t==="hint")this.queueHint(i.id);else if(i.t==="hit"){if(n(i.target,i.byPlayer?1.6:2,this.tmp),this.tmp.vis&&this.floater(this.tmp.x,this.tmp.y,String(i.amount),i.byPlayer?i.crit?"crit":"dmg":"hurt"),!i.byPlayer){this.vignette.classList.remove("flash"),this.vignette.offsetWidth,this.vignette.classList.add("flash");try{navigator.vibrate?.(35)}catch{}}}else if(i.t==="perfect")n(t.player.id,2.3,this.tmp),this.floater(this.tmp.x,this.tmp.y,"PERFECT!","perfect");else if(i.t==="dodge-early"){if(this.earlyAt.w===t&&t.tick-this.earlyAt.tick<V1)continue;this.earlyAt.w=t,this.earlyAt.tick=t.tick,n(t.player.id,2.5,this.tmp),this.floater(this.tmp.x,this.tmp.y,"หลบเร็วไป","early",1300)}else i.t==="heal"?(n(t.player.id,2,this.tmp),this.floater(this.tmp.x,this.tmp.y,`+${i.amount}`,"heal")):i.t==="interrupt"?(n(i.id,1.6,this.tmp),this.floater(this.tmp.x,this.tmp.y,"ขัดจังหวะ!","crit")):i.t==="stun"&&i.long?this.showBanner("💥 บอสชนเสา! มึนงง — โจมตีเลย!",2.2):i.t==="stun"?(n(i.id,3.5,this.tmp),this.floater(this.tmp.x,this.tmp.y,"เสียหลัก","perfect")):i.t==="gate"&&i.open&&i.id==="clearingExit"?this.showBanner("ประตูคริสตัลเปิดแล้ว เดินต่อตามทางข้างหน้า",2.5):i.t==="auto-off"?this.showBanner(i.reason==="boss"?"เข้าลานบอส · ปิดตีอัตโนมัติแล้ว":"ปิดตีอัตโนมัติแล้ว",2.2):i.t==="checkpoint"?this.showBanner("💧 บันทึกจุดเกิดใหม่แล้ว",1.8):i.t==="boss-start"?this.showBanner(`⚔ ${Kn.prismback.nameTh}`,2.4,!0):i.t==="boss-phase"&&this.showBanner("⚠ ปริซึมแบ็กเกรี้ยวกราด!",2,!0)}floater(e,t,n,i,r=900){const a=document.createElement("div");a.className=`floater ${i}`,a.textContent=n,a.style.left=`${e+(Math.random()-.5)*36}px`,a.style.top=`${t+(Math.random()-.5)*14}px`,this.layer.appendChild(a),setTimeout(()=>a.remove(),r)}skillCd(e,t){const n=e.skillCooldown,i=n?n.call(e,t):t===1?{remaining:e.ps.skillCd,total:Yi.skill.cooldown}:{remaining:0,total:1},r=Math.max(0,i.remaining),a=Math.ceil(r-1e-6),o=this.skillBtns[t-1];xd(o,i.total>0?r/i.total:0),this.skillShown[t-1]!==a&&(this.skillShown[t-1]=a,this.skillNums[t-1].textContent=a>0?String(a):"")}showBanner(e,t,n=!1){this.banner.textContent=e,this.banner.className=n?"show big":"show",clearTimeout(this.banner._t),this.banner._t=setTimeout(()=>this.banner.className="",t*1e3)}queueHint(e){!Ti[e]||this.hintQueue.includes(e)||this.hintCur===e||this.hintQueue.push(e)}tickHints(e,t){this.hintTimer>0?(this.hintTimer-=t,this.hintShown+=t,this.hintTimer<=0&&(this.hint.classList.remove("show"),this.hintCur="",this.hintGap=H1)):this.hintGap>0&&(this.hintGap-=t);const n=r=>!Ti[r].when||Ti[r].when(e);if(this.hintCur&&this.hintShown>1.5){const r=Ti[this.hintCur],a=this.hintQueue.find(o=>(Ti[o].urgent||r.low&&!Ti[o].low)&&n(o));if(a&&!Ti[this.hintCur].urgent){this.show(a);return}}if(this.hintTimer>0||this.hintGap>0)return;const i=this.hintQueue.find(r=>!Ti[r].low&&n(r))??this.hintQueue.find(n);i&&this.show(i)}show(e){this.hintQueue=this.hintQueue.filter(n=>n!==e);const t=Ti[e];this.hint.innerHTML=`<b>${t.icon}</b><span>${t.text}</span>`,this.hint.classList.add("show"),this.hintCur=e,this.hintShown=0,this.hintTimer=e==="move"?7:G1}dismissHintIf(e){this.hintCur===e&&(this.hintTimer=Math.min(this.hintTimer,.6))}showDefeat(e,t,n){const i=Nt("#defeat");i.querySelector(".cause").innerHTML=`แพ้ให้ <b>${e.enemyTh}</b> ด้วยท่า <b>“${e.attackTh}”</b>`,i.querySelector(".tip").textContent=`เคล็ดลับ: ${e.tipTh}`,i.querySelector(".where").textContent=t?"จะกลับไปเริ่มที่บ่อแสงหน้าลานบอส บอสจะฟื้นเต็ม":"จะกลับไปเริ่มที่จุดพักล่าสุด",i.classList.add("show");const r=i.querySelector("button");r.onclick=()=>{i.classList.remove("show"),n()}}showVictory(e,t){const n=e.summary(),i=Ad({victory:!0,seconds:n.seconds,damageTaken:n.damageTaken,deaths:n.deaths,perfect:n.perfect}),r=Nt("#victory");r.querySelector(".rank").textContent=i,r.querySelector(".rank").className=`rank r${i}`,r.querySelector(".stats").innerHTML=[["เวลา",so(n.seconds)],["ดาเมจที่ได้รับ",String(n.damageTaken)],["หลบเพอร์เฟกต์",String(n.perfect)],["พ่ายแพ้",`${n.deaths} ครั้ง`]].map(([a,o])=>`<div><span>${a}</span><b>${o}</b></div>`).join(""),r.querySelector(".rankinfo").innerHTML=q1(i,n),r.querySelector(".reward").innerHTML='<span class="pending">กำลังบันทึกผล…</span>',r.classList.add("show"),r.querySelector(".replay").onclick=()=>{r.classList.remove("show"),t()}}setReward(e){Nt("#victory .reward").innerHTML=e}}function q1(s,e){const t=Da,n=`S: ไม่แพ้ · โดน ≤ ${t.S.damage} · ไม่เกิน ${so(t.S.seconds)} &nbsp;|&nbsp; A: ไม่แพ้ · โดน ≤ ${t.A.damage}`;let i="";return s==="A"?i=`อีกนิดได้ S: โดนดาเมจให้ไม่เกิน ${t.S.damage}${e.seconds>t.S.seconds?` และจบใน ${so(t.S.seconds)}`:""} (หลบเพอร์เฟกต์ช่วยได้มาก)`:s!=="S"&&(i=e.deaths>0?"ได้ A ถ้าชนะโดยไม่แพ้เลย":`ได้ A ถ้าโดนดาเมจไม่เกิน ${t.A.damage}`),`<div>${n}</div>${i?`<div class="nextrank">${i}</div>`:""}`}function xd(s,e){s.style.setProperty("--cd",String(e)),s.classList.toggle("cooling",e>.001)}const Ha=["#btn-attack","#btn-dodge","#btn-skill","#btn-skill2","#btn-skill3","#btn-ult","#btn-potion","#stick-base"],_d=Ha.length-1,ur=10,K1=4,as=.3,Rr=[0,0];for(let s=0;s<8;s++)Rr.push(.9*Math.cos(s*Math.PI/4),.9*Math.sin(s*Math.PI/4));for(let s=0;s<4;s++)Rr.push(.5*Math.cos(Math.PI/4+s*Math.PI/2),.5*Math.sin(Math.PI/4+s*Math.PI/2));class Yc{constructor(e){N(this,"els",Ha.map(e=>document.querySelector(e)));N(this,"rects",Ha.map(()=>({l:0,t:0,r:0,b:0,ok:!1})));N(this,"hit",Ha.map(()=>!1));N(this,"out",{x:0,y:0,vis:!1});N(this,"frame",0);N(this,"project");N(this,"G",new Float64Array(9));N(this,"gOk",!1);N(this,"gSign",1);N(this,"A",new Float64Array(72));N(this,"src",new Float64Array(8));N(this,"dst",new Float64Array(8));this.project=e}test(e,t,n){this.project(e,t,n,this.out);const i=this.out;if(i.vis)for(let r=0;r<this.rects.length;r++){const a=this.rects[r];a.ok&&i.x>=a.l&&i.x<=a.r&&i.y>=a.t&&i.y<=a.b&&(this.hit[r]=!0)}}tele(e){const t=-e.dz,n=e.dx;if(e.shape==="circle"){this.test(e.x,.1,e.z);for(let i=0;i<4;i++){const r=i&1?1:-1,a=i&2?1:-1;this.test(e.x+r*e.r*.7,.1,e.z+a*e.r*.7),this.test(e.x+r*e.r*.35,.1,e.z+a*e.r*.35)}}else if(e.shape==="line"){const i=e.w/2;for(let r=0;r<=6;r++){const a=e.r*r/6,o=e.x+e.dx*a,l=e.z+e.dz*a;this.test(o,.1,l),this.test(o+t*i,.1,l+n*i),this.test(o-t*i,.1,l-n*i)}}else{const i=Math.acos(Math.max(-1,Math.min(1,e.cos))),r=Math.sin(i),a=e.cos;this.test(e.x,.1,e.z);for(let o=1;o<=4;o++){const l=e.r*o/4;this.test(e.x+e.dx*l,.1,e.z+e.dz*l);for(const c of[-1,1])this.test(e.x+(e.dx*a+t*r*c)*l,.1,e.z+(e.dz*a+n*r*c)*l)}}}static inside(e,t,n){const i=t-e.x,r=n-e.z;if(e.shape==="circle")return i*i+r*r<=(e.r+as)**2;if(e.shape==="line"){const c=i*e.dx+r*e.dz,h=Math.abs(i*-e.dz+r*e.dx);return c>=-as&&c<=e.r+as&&h<=e.w/2+as}const a=Math.hypot(i,r);if(a>e.r+as)return!1;if(a<as+.01)return!0;const o=Math.acos(Math.max(-1,Math.min(1,e.cos)));return(i*e.dx+r*e.dz)/a>=Math.cos(Math.min(Math.PI,o+as/a))}fitGround(e,t){const n=[e-2,e+2,e+2,e-2],i=[t,t,t-4,t-4];for(let a=0;a<4;a++){if(this.project(n[a],0,i[a],this.out),!this.out.vis){this.gOk=!1;return}this.src[2*a]=this.out.x,this.src[2*a+1]=this.out.y,this.dst[2*a]=n[a],this.dst[2*a+1]=i[a]}const r=this.A;r.fill(0);for(let a=0;a<4;a++){const o=this.src[2*a],l=this.src[2*a+1],c=this.dst[2*a],h=this.dst[2*a+1],u=2*a*9,d=u+9;r[u]=o,r[u+1]=l,r[u+2]=1,r[u+6]=-o*c,r[u+7]=-l*c,r[u+8]=c,r[d+3]=o,r[d+4]=l,r[d+5]=1,r[d+6]=-o*h,r[d+7]=-l*h,r[d+8]=h}for(let a=0;a<8;a++){let o=a;for(let c=a+1;c<8;c++)Math.abs(r[c*9+a])>Math.abs(r[o*9+a])&&(o=c);if(Math.abs(r[o*9+a])<1e-12){this.gOk=!1;return}if(o!==a)for(let c=0;c<9;c++){const h=r[a*9+c];r[a*9+c]=r[o*9+c],r[o*9+c]=h}const l=r[a*9+a];for(let c=a;c<9;c++)r[a*9+c]/=l;for(let c=0;c<8;c++){if(c===a)continue;const h=r[c*9+a];if(h)for(let u=a;u<9;u++)r[c*9+u]-=h*r[a*9+u]}}for(let a=0;a<8;a++)this.G[a]=r[a*9+8];this.G[8]=1,this.gOk=!0,this.gSign=Math.sign(this.G[6]*this.src[0]+this.G[7]*this.src[1]+1)||1}update(e,t){if(t&&(this.project=t),++this.frame%K1===0){for(let n=0;n<this.els.length;n++){const i=this.els[n],r=this.rects[n],o=n<_d||i.classList.contains("on")?i.getBoundingClientRect():null;r.ok=!!o&&o.width>0,o&&(r.l=o.left-ur,r.r=o.right+ur,r.t=o.top-ur,r.b=o.bottom+ur),this.hit[n]=!1}for(const n of e.tele)this.tele(n);if(e.tele.length){this.fitGround(e.player.x,e.player.z);const n=this.G;if(this.gOk)for(let i=0;i<_d;i++){const r=this.rects[i];if(!r.ok||this.hit[i])continue;const a=(r.l+r.r)/2,o=(r.t+r.b)/2,l=(r.r-r.l)/2-ur;for(let c=0;c<Rr.length&&!this.hit[i];c+=2){const h=a+Rr[c]*l,u=o+Rr[c+1]*l,d=n[6]*h+n[7]*u+1;if(d*this.gSign<=1e-12)continue;const f=(n[0]*h+n[1]*u+n[2])/d,p=(n[3]*h+n[4]*u+n[5])/d;for(const x of e.tele)if(Yc.inside(x,f,p)){this.hit[i]=!0;break}}}}if(e.bossStarted&&e.boss.alive){const n=e.boss;this.test(n.x,.5,n.z),this.test(n.x,1.6,n.z),this.test(n.x-1.2,.8,n.z),this.test(n.x+1.2,.8,n.z),this.test(n.x,3,n.z)}for(const n of e.pillars)n.alive&&(this.test(n.x,.2,n.z),this.test(n.x,1.5,n.z),this.test(n.x,3,n.z),this.test(n.x-n.r,1,n.z),this.test(n.x+n.r,1,n.z));for(let n=0;n<this.els.length;n++)this.els[n].classList.contains("seethru")!==this.hit[n]&&this.els[n].classList.toggle("seethru",this.hit[n])}}}class Y1{constructor(){N(this,"ctx",null);N(this,"master",null);N(this,"muted",!1)}unlock(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}try{const e=window.AudioContext||window.webkitAudioContext;this.ctx=new e,this.master=this.ctx.createGain(),this.master.gain.value=this.muted?0:.5,this.master.connect(this.ctx.destination)}catch{this.ctx=null}}setMuted(e){this.muted=e,this.master&&(this.master.gain.value=e?0:.5)}suspend(){this.ctx?.suspend().catch(()=>{})}resume(){this.ctx?.state==="suspended"&&this.ctx.resume().catch(()=>{})}tone(e,t,n="sine",i=.3,r=0,a=0){const o=this.ctx,l=this.master;if(!o||!l||this.muted)return;const c=o.currentTime+a,h=o.createOscillator(),u=o.createGain();h.type=n,h.frequency.setValueAtTime(e,c),r&&h.frequency.exponentialRampToValueAtTime(Math.max(30,e*r),c+t),u.gain.setValueAtTime(1e-4,c),u.gain.exponentialRampToValueAtTime(i,c+.01),u.gain.exponentialRampToValueAtTime(1e-4,c+t),h.connect(u),u.connect(l),h.start(c),h.stop(c+t+.02)}noise(e,t=.2,n=1200,i=1,r=0){const a=this.ctx,o=this.master;if(!a||!o||this.muted)return;const l=a.currentTime+r,c=Math.floor(a.sampleRate*e),h=a.createBuffer(1,c,a.sampleRate),u=h.getChannelData(0);for(let x=0;x<c;x++)u[x]=(Math.random()*2-1)*(1-x/c);const d=a.createBufferSource();d.buffer=h;const f=a.createBiquadFilter();f.type="bandpass",f.frequency.value=n,f.Q.value=i;const p=a.createGain();p.gain.value=t,d.connect(f),f.connect(p),p.connect(o),d.start(l)}swing(e){this.noise(.12,.25,2200+e*500,.8),this.tone(660+e*110,.08,"triangle",.08)}hit(e){this.tone(e?880:520,.12,"square",.12,.5),e&&this.tone(1320,.25,"sine",.12,1,.03)}hurt(){this.tone(180,.25,"sawtooth",.18,.5),this.noise(.15,.2,400,1)}dodge(){this.noise(.18,.18,900,.6)}perfect(){this.tone(1046,.5,"sine",.2),this.tone(1568,.6,"sine",.14,1,.05),this.tone(2093,.7,"sine",.08,1,.1)}warn(e){this.tone(e?220:440,.35,e?"sawtooth":"triangle",.09,e?1.6:1.5)}skill(){[523,659,784,1046].forEach((e,t)=>this.tone(e,.5,"sine",.12,1,t*.04))}heal(){[784,988,1175].forEach((e,t)=>this.tone(e,.35,"sine",.1,1,t*.08))}roar(){this.tone(90,.9,"sawtooth",.25,.6),this.noise(.8,.25,300,.7)}stun(){this.tone(1400,.15,"square",.1,.4),this.noise(.4,.3,600,.5)}gate(){this.tone(392,.6,"sine",.15,1.5)}victory(){[523,659,784,1046,784,1046,1318].forEach((e,t)=>this.tone(e,.4,"triangle",.16,1,t*.11))}defeat(){[392,349,294,262].forEach((e,t)=>this.tone(e,.5,"triangle",.14,1,t*.18))}tap(){this.tone(880,.05,"sine",.06)}}class $1{constructor(){N(this,"mode","offline")}async detect(){if(new URLSearchParams(location.search).has("offline"))return this.mode="offline";try{const e=new AbortController,t=setTimeout(()=>e.abort(),1500),n=await fetch("./api/health",{signal:e.signal,cache:"no-store"});clearTimeout(t);const i=n.ok?await n.json():null;this.mode=i?.game==="synes-online"?"online":"offline"}catch{this.mode="offline"}return this.mode}async start(e,t){if(this.mode!=="online")return null;try{const n=await fetch("./api/run/start",{method:"POST",body:JSON.stringify({variant:e,...t?{rulesetVersion:t,tuningHash:qp(t)}:{}}),headers:{"content-type":"application/json"}});return n.ok?await n.json():null}catch{return null}}async finish(e,t,n=6){for(let i=0;i<n;i++)try{if(!navigator.onLine)throw new Error("offline");const r=await fetch("./api/run/finish",{method:"POST",body:JSON.stringify({runId:e,log:t}),headers:{"content-type":"application/json"}}),a=await r.json();return r.ok?a:{error:a.error||r.status}}catch{await new Promise(r=>setTimeout(r,1500*(i+1)))}return{error:"network"}}}const os=[[0,-4],[1.5,-15],[3,-28],[3,-37],[3,-44],[-.4,-52],[-2,-60],[-2,-70]];class J1{constructor(e=1,t={}){N(this,"wp",-1);N(this,"t",0);N(this,"skill");N(this,"useSkills");this.skill=e,this.useSkills=!!t.useSkills}think(e){this.t++;const t=e.player,n=e.ps;if(n.down)return this.wp=-1,cs(0,0,this.t%2?pt.RETRY:0);if(this.wp<0){let d=0,f=1e9;os.forEach(([p,x],m)=>{const g=Wt(p-t.x,x-t.z);g<f&&(f=g,d=m)}),this.wp=d}let i=0,r=0,a=0,o=!1;const l=.25/this.skill;for(const d of e.tele){if(d.total-d.t<l)continue;const f=e.insideTele(d,t.x,t.z,.7),p=!d.area;if(!f)continue;o=!0;let x,m;d.shape==="line"?[x,m]=(t.x-d.x)*-d.dz+(t.z-d.z)*d.dx>=0?[-d.dz,d.dx]:[d.dz,-d.dx]:[x,m]=bn(t.x-d.x,t.z-d.z),i+=x,r+=m;const g=.45/this.skill;d.t<g&&d.t>.05&&n.dodgeCd<=0&&(a|=pt.DODGE),p&&d.t<.3&&(a|=pt.DODGE)}if(e.boss.state==="charge"&&Wt(e.boss.x-t.x,e.boss.z-t.z)<4&&n.dodgeCd<=0&&(a|=pt.DODGE,[i,r]=[-e.boss.dz,e.boss.dx]),!o){let d=null,f=1e9;for(const p of e.actors){if(p.kind==="player"||!p.alive||p.kind==="prismback"&&!e.bossStarted||!p.active&&p.kind!=="prismback")continue;const x=Wt(p.x-t.x,p.z-t.z);x<f&&(f=x,d=p)}if(d&&f<12){const p=d.r+1.6;if(f>p&&([i,r]=bn(d.x-t.x,d.z-t.z)),f<p+.6&&this.t%3===0&&(a|=pt.ATTACK),(e.actors.filter(m=>m.alive&&m.kind!=="player"&&m.active&&Wt(m.x-t.x,m.z-t.z)<3.8).length>=2||d.kind==="prismback")&&f<3.8&&n.skillCd<=0&&(a|=pt.SKILL),this.useSkills&&!n.cast&&n.castT<=0&&!(a&pt.SKILL)){const m=wt[1],g=wt[2],v=t.x+t.fx*g.ahead,y=t.z+t.fz*g.ahead,_=e.actors.filter(S=>S.kind!=="player"&&S.alive&&(S.active||S.kind==="prismback")&&(S.kind!=="prismback"||e.bossStarted));n.cdT[2]<=0&&_.some(S=>Wt(S.x-v,S.z-y)<=g.radius+S.r)?a|=pt.SKILL3:n.cdT[1]<=0&&_.some(S=>{const T=Wt(S.x-t.x,S.z-t.z);return T<=m.radius+S.r&&(T<1e-6||((S.x-t.x)*t.fx+(S.z-t.z)*t.fz)/T>=m.cosHalf)})&&(a|=pt.SKILL2)}}else{const[p,x]=os[Math.min(this.wp,os.length-1)];Wt(p-t.x,x-t.z)<1.5&&this.wp<os.length-1&&this.wp++,[i,r]=bn(p-t.x,x-t.z)}}t.hp<45&&n.potions>0&&!o&&(a|=pt.POTION);const[c,h]=os[Math.min(this.wp,os.length-1)];Wt(c-t.x,h-t.z)<2&&this.wp<os.length-1&&this.wp++;const u=Wt(i,r);return u>1&&(i/=u,r/=u),this.t%2===0&&(a&=-111),cs(i,r,a)}}class Z1{constructor(e,t){N(this,"last","");N(this,"bar");N(this,"toggle");this.bar=e,this.toggle=t}update(e,t){const n=`${e}|${t}`;n!==this.last&&(this.last=n,this.bar.classList.toggle("hidden",!t),this.toggle.classList.toggle("on",e),this.toggle.setAttribute("aria-pressed",String(e)),this.toggle.setAttribute("aria-label",`ตีอัตโนมัติ (${e?"เปิดอยู่":"ปิดอยู่"})`),this.toggle.querySelector(".au-state").textContent=e?"เปิด":"ปิด")}}class Q1{constructor(e,t,n,i){N(this,"kindsEl");N(this,"areaEl");N(this,"skillsEl");N(this,"radius");N(this,"radiusVal");N(this,"keep");N(this,"radiusRow");N(this,"get");N(this,"set");N(this,"nearKinds");this.get=t,this.set=n,this.nearKinds=i;const r=o=>e.querySelector(o);this.kindsEl=r("#ap-kinds"),this.areaEl=r("#ap-area"),this.skillsEl=r("#ap-skills"),this.radius=r("#ap-radius"),this.radiusVal=r("#ap-radius-val"),this.keep=r("#ap-keep"),this.radiusRow=r(".ap-radius"),this.radius.min=String(ls.min),this.radius.max=String(ls.max),this.areaEl.querySelectorAll("button").forEach(o=>o.addEventListener("click",()=>this.set({...this.get(),hall:o.dataset.hall==="1"}))),this.radius.addEventListener("input",()=>this.set({...this.get(),radius:Math.max(ls.min,Math.min(ls.max,Math.round(+this.radius.value)))})),this.keep.addEventListener("change",()=>this.set({...this.get(),keep:this.keep.checked})),this.skillsEl.querySelectorAll("button").forEach(o=>{const l=+o.dataset.slot;o.innerHTML=`<b>${l+1}</b><span>${wt[l].nameTh}</span>`,o.addEventListener("click",()=>{const c=[...this.get().skills];c[l]=!c[l],this.set({...this.get(),skills:c})})}),this.kindsEl.addEventListener("click",o=>{const l=o.target.closest("button");if(!l)return;const c=this.get(),h=l.dataset.kind;if(h==="all")this.set({...c,kinds:0});else{const u=1<<+h;this.set({...c,kinds:c.kinds^u})}});const a=()=>this.render();e.addEventListener("click",a),e.addEventListener("input",a),e.addEventListener("change",a)}render(){const e=this.get(),t=this.nearKinds()|e.kinds;let n=`<button type="button" data-kind="all" aria-pressed="${e.kinds===0}">ทุกชนิด</button>`;Cr.forEach((i,r)=>{t&1<<r&&(n+=`<button type="button" data-kind="${r}" aria-pressed="${!!(e.kinds&1<<r)}">${Kn[i].nameTh}</button>`)}),t&(1<<Cr.length)-1||(n+='<small class="ap-none">ไม่มีศัตรูใกล้ตัว</small>'),this.kindsEl.innerHTML=n,this.areaEl.querySelectorAll("button").forEach(i=>i.setAttribute("aria-pressed",String(i.dataset.hall===(e.hall?"1":"0")))),this.radius.value=String(e.radius),this.radiusVal.textContent=`${e.radius} ม.`,this.radius.disabled=e.hall,this.radiusRow.classList.toggle("dim",e.hall),this.skillsEl.querySelectorAll("button").forEach(i=>i.setAttribute("aria-pressed",String(e.skills[+i.dataset.slot]))),this.keep.checked=e.keep}}const qt=new URLSearchParams(location.search),vd=Xp(qt),Md=Ap(qt);for(const s of["debug","offline"])location.hash==="#"+s&&qt.set(s,"1");const ze=s=>document.querySelector(s),$c=ze("#game"),us={bootMs:performance.now(),readyMs:0,firstPlayFrameMs:0,kit:!1},yt=new Y1,Jc=new $1,sn=new U1($c),Mn=new X1,j1=new Yc((s,e,t,n)=>sn.project(s,e,t,n)),Dn=new B1(ze("#stick-zone"),ze("#stick-base"),ze("#stick-knob"));Dn.bindButton(ze("#btn-attack"),"attack",!0);Dn.bindButton(ze("#btn-dodge"),"dodge");Dn.bindButton(ze("#btn-skill"),"skill");Dn.bindButton(ze("#btn-skill2"),"skill2");Dn.bindButton(ze("#btn-skill3"),"skill3");ze("#btn-ult").addEventListener("pointerdown",s=>{s.preventDefault(),s.stopPropagation(),Mn.showBanner("อัลติจะปลดล็อกในอัปเดตถัดไป",1.8)});Dn.bindButton(ze("#btn-potion"),"potion");let gs=Td();const rp=s=>{gs=s,Dn.queueAuto(Op(s))},eb=new Z1(ze("#auto-bar"),ze("#btn-auto")),tb=()=>{let s=0;if(st)for(const e of st.actors){const t=Cr.indexOf(e.kind);t>=0&&e.alive&&Xt(e.x,e.z,st.player.x,st.player.z)<30&&(s|=1<<t)}return s},nb=new Q1(ze("#auto-panel"),()=>gs,rp,tb);ze("#btn-auto").addEventListener("click",()=>{on!=="playing"||!st||(yt.tap(),rp({...gs,enabled:!gs.enabled}))});ze("#btn-auto-set").addEventListener("click",()=>{on!=="playing"||!st||(yt.tap(),nb.render(),ea("auto"))});ze("#btn-auto-close").addEventListener("click",()=>{yt.tap(),xo()});let Ai=US(),ds=Ai==="auto"?Kf():Ai,ro=new Yf(Xr[ds].maxPixelRatio);sn.setQuality(Xr[ds]);sn.applyTone(ip(qt.get("tone")));let st=null,ao=new Sd,Ki=null,on="menu",Wi=0,Kr=performance.now(),Va=null,ap=!1,ml=0,Ds=qt.has("qafreeze");const Yr=[];window.__synesQA={freeze(){Ds=!0},unfreeze(){Ds=!1,Kr=performance.now(),Wi=0},log:Yr,stepTicks(s=1,e=!0){if(!st||on!=="playing")return 0;let t=0;for(;t<s;t++)if(lp(),st.finished){t++;break}return ml+=t,e&&(cp(1,Math.max($e,ml*$e)),ml=0),t}};(async()=>{const s=ze("#load-bar");ze("#chip-q").textContent=`กราฟิก: ${sb(ds)}${Ai==="auto"?" (อัตโนมัติ)":""}`;const[e]=await Promise.all([Jc.detect(),qt.has("nokit")?Promise.resolve(!1):_S(window.__SYNES_KIT_URL||"./assets/models/synes_kit.glb",n=>s.style.width=`${10+n*85}%`).then(async n=>(n&&Qf()==="B"&&await MS("./assets/models/spire_shrine_B.glb"),us.kit=n))]);s.style.width="100%",ze("#chip-net").textContent=e==="online"?"ออนไลน์: บันทึกผลได้":"ออฟไลน์: ผลไม่ถูกบันทึก";const t=ze("#btn-start");if(t.disabled=!1,t.textContent="แตะเพื่อเริ่มผจญภัย",us.readyMs=performance.now(),qt.has("study")){ze("#start").classList.add("hidden"),ze("#hud").classList.remove("hidden");const{runStudy:n}=await yp(async()=>{const{runStudy:i}=await import("./study-DvLxCYLw.js");return{runStudy:i}},[],import.meta.url);await n(sn,Mn,qt.get("study"),ip(qt.get("tone")));return}(qt.has("bot")||qt.has("autostart"))&&op()})();ze("#btn-start").addEventListener("click",()=>op());async function op(){yt.unlock(),yt.tap();const s=document.documentElement;if(matchMedia("(pointer: coarse)").matches&&!qt.has("bot")){try{await(s.requestFullscreen?.({navigationUI:"hide"})??Promise.resolve())}catch{}try{await screen.orientation?.lock?.("landscape")}catch{}}ze("#start").classList.add("hidden"),ze("#hud").classList.remove("hidden"),qt.has("debug")&&(ze("#debug").style.display="block"),await Zc()}async function Zc(){Ki=await Jc.start(Md,vd);const s=Ki?.seed??(qt.has("seed")?+qt.get("seed"):Math.random()*2**32>>>0);st=new Kp(s,Md,vd),ao=new Sd,Dn.autoPending=null,gs.enabled=!1,sn.buildLevel(st,7),Mn.netChip.textContent=Ki?"ออนไลน์":"ออฟไลน์",Mn.netChip.title=Ki?"ผลและรางวัลจะถูกบันทึก":"โหมดออฟไลน์: ผลไม่ถูกบันทึก";for(const e of["#defeat","#victory"])ze(e).classList.remove("show");Va=qt.has("bot")?new J1(+(qt.get("bot")||1)||1,{useSkills:qt.has("botskills")}):null,Dn.bot=Va?()=>Va.think(st):null,up(st.events.splice(0)),on="playing",Wi=0,Kr=performance.now(),window.__synes={world:st,view:sn,perf:us,log:ao,get state(){return on},adaptive:ro},Qc()}function lp(){sn.beforeTick();const s=Dn.sample();ao.push(s),up(st.step(s))}function cp(s,e){const t=st;try{sn.render(t,s,e)}catch(n){Yr.length<400&&Yr.push({t:+(t.tick/30).toFixed(1),e:"render-error "+String(n?.message||n)}),console.error(n)}}function hp(s){requestAnimationFrame(hp);const e=Math.min(.25,(s-Kr)/1e3);if(Kr=s,!!st){if(on==="playing"&&!Ds){Wi+=e;let t=0;for(;Wi>=$e&&t<8&&(lp(),Wi-=$e,t++,!st.finished););t===8&&(Wi=0)}if(cp(on==="playing"&&!Ds?Math.min(1,Wi/$e):1,on==="paused"||Ds?0:e),Dn.autoPending||(gs.enabled=st.auto.s.enabled),eb.update(gs.enabled,Ed(st)),Mn.update(st,e,(t,n,i)=>sn.actorScreenPos(t,n,i)),on==="playing"&&j1.update(st),!us.firstPlayFrameMs&&on==="playing"&&(us.firstPlayFrameMs=performance.now()),Ai==="auto"&&on==="playing"&&!Ds){const t=ro.sample(e);t&&sn.setPixelRatio(t)}if(qt.has("debug")){const t=sn.renderer.info,n=performance.memory;ze("#debug").textContent=`fps ${ro.fps.toFixed(0)}  tier ${ds}  px ${sn.pixelRatio.toFixed(2)}
calls ${t.render.calls}  tris ${t.render.triangles}
kit ${us.kit?"glb":"procedural"}  heap ${n?(n.usedJSHeapSize/1048576).toFixed(0)+"MB":"n/a"}`}}}requestAnimationFrame(hp);function up(s){if(!(!st||!s.length)){sn.onEvents(s,st),Mn.onEvents(s,st,(e,t,n)=>sn.actorScreenPos(e,t,n));for(const e of s){const t=+(st.tick/30).toFixed(1);if(e.t==="hit"&&!e.byPlayer){const n=st.ps.cause;Yr.push({t,e:`hurt ${e.amount} by ${n?.enemyTh}/${n?.attackTh}`})}else["player-down","perfect","boss-start","boss-phase","victory","checkpoint","respawn","gate","stun","hint","interrupt","potion","skill","skill-hit","skill-cancel","dodge-early"].includes(e.t)&&Yr.push({t,e:e.t+("id"in e?" "+e.id:"")+("cause"in e?" "+e.cause.attackTh:"")+("long"in e?e.long?" long":" short":"")});switch(e.t){case"swing":yt.swing(e.step),Mn.dismissHintIf("attack");break;case"hit":e.byPlayer?yt.hit(e.crit):yt.hurt();break;case"dodge":yt.dodge(),Mn.dismissHintIf("dodge");break;case"perfect":yt.perfect();break;case"skill":yt.skill();break;case"skill-hit":e.slot===2?yt.swing(2):e.slot===3&&yt.skill();break;case"heal":yt.heal();break;case"telegraph":{const n=st.tele.find(i=>i.id===e.id);n&&yt.warn(n.atk.id==="slam"||n.atk.id==="charge");break}case"boss-start":case"boss-phase":yt.roar();break;case"stun":yt.stun();break;case"gate":yt.gate();break;case"player-down":yt.defeat(),setTimeout(()=>Mn.showDefeat(e.cause,st.checkpoint.id==="spring",()=>{Dn.press("retry"),yt.tap()}),700),Va&&setTimeout(()=>ze("#defeat").classList.remove("show"),1200);break;case"victory":ib();break}}}}async function ib(){on="done",yt.victory();const s=st;if(setTimeout(()=>Mn.showVictory(s,()=>Zc()),1400),!Ki){const n=s.summary(),i=Ad({victory:!0,seconds:n.seconds,damageTaken:n.damageTaken,deaths:n.deaths,perfect:n.perfect});setTimeout(()=>Mn.setReward(`<b>โหมดออฟไลน์:</b> รอบนี้ไม่ถูกบันทึกและไม่ได้รับรางวัล<br><small>อันดับ ${i} แสดงให้ดูเท่านั้น</small>`),1500);return}const e=await Jc.finish(Ki.runId,ao.data);setTimeout(()=>{if(e.verified){const n=e.reward;Mn.setReward(`✅ บันทึกผลแล้ว: อันดับ <b>${n.rank}</b><br>💰 ${n.gold} ทอง · ✨ ${n.exp} EXP${n.drop?`<br>ได้รับ <span class="${n.drop.rarity}">${n.drop.nameTh}</span>`:""}`)}else Mn.setReward(`⚠ บันทึกผลไม่สำเร็จ จึงยังไม่ได้รับรางวัล <small>(${e.error})</small>`)},1500)}function ea(s){on==="playing"&&(on="paused",Dn.releaseAll(),yt.suspend(),ze(s==="menu"?"#paused":s==="auto"?"#auto-panel":"#resume-tap").classList.add("show"))}function xo(){for(const s of["#paused","#resume-tap","#howto","#credits","#auto-panel"])ze(s).classList.remove("show");on==="paused"&&(on="playing",Kr=performance.now(),Wi=0,yt.resume())}ze("#btn-pause").addEventListener("click",()=>{yt.tap(),ea("menu")});ze("#btn-resume").addEventListener("click",xo);ze("#btn-resume2").addEventListener("click",()=>{yt.unlock(),xo()});ze("#btn-restart").addEventListener("click",()=>{xo(),Zc()});ze("#btn-howto").addEventListener("click",()=>ze("#howto").classList.add("show"));ze("#btn-credits").addEventListener("click",()=>ze("#credits").classList.add("show"));document.querySelectorAll(".overlay .close").forEach(s=>s.addEventListener("click",()=>s.closest(".overlay").classList.remove("show")));const dc=ze("#sel-quality");dc.value=Ai;dc.addEventListener("change",()=>{Ai=dc.value,FS(Ai),ds=Ai==="auto"?Kf():Ai,ro=new Yf(Xr[ds].maxPixelRatio),sn.setQuality(Xr[ds]),st&&sn.buildLevel(st,7)});ze("#chk-sound").addEventListener("change",s=>yt.setMuted(!s.target.checked));document.addEventListener("visibilitychange",()=>{document.hidden&&ea("hidden")});addEventListener("pagehide",()=>ea("hidden"));addEventListener("blur",()=>{matchMedia("(pointer: coarse)").matches});addEventListener("offline",()=>{Mn.netChip.textContent=Ki?"ออนไลน์ (สัญญาณหลุด รอส่งผล)":"ออฟไลน์"});addEventListener("online",()=>{Mn.netChip.textContent=Ki?"ออนไลน์":"ออฟไลน์"});$c.addEventListener("webglcontextlost",s=>{s.preventDefault(),ea("hidden"),ze("#resume-tap").classList.remove("show"),ze("#ctx-lost").classList.add("show")});$c.addEventListener("webglcontextrestored",()=>{ze("#ctx-lost").classList.remove("show"),st&&sn.buildLevel(st,7),ze("#resume-tap").classList.add("show")});function Qc(){const s=innerHeight>innerWidth&&matchMedia("(pointer: coarse)").matches;ze("#rotate").classList.toggle("show",s&&!ap&&on!=="menu")}ze("#btn-portrait").addEventListener("click",()=>{ap=!0,Qc()});addEventListener("resize",()=>{sn.resize(),Qc()});document.querySelectorAll(".build-id").forEach(s=>s.textContent="slice-1 · b46ca7f · 2026-11-21");function sb(s){return s==="low"?"ต่ำ":s==="medium"?"กลาง":"สูง"}window.__synesPerf=us;window.__synesKit=vS;export{$r as C,at as M,ui as P,Dt as S,Kp as W,jn as a,ES as b,AS as c,qc as d,wS as m,cs as q};
