import * as pc from 'playcanvas';
import { createTouchInput } from '../common/input';
import { SpikeLogic, TREES } from '../common/logic';
import { benchFrame } from '../common/bench';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const stat = document.getElementById('stat')!;
const input = createTouchInput(document.getElementById('ui')!);
const logic = new SpikeLogic();

const device = await pc.createGraphicsDevice(canvas, { deviceTypes: ['webgl2'], antialias: false });
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);
const opts = new pc.AppOptions();
opts.graphicsDevice = device;
opts.componentSystems = [pc.RenderComponentSystem, pc.CameraComponentSystem, pc.LightComponentSystem];
opts.resourceHandlers = [];
const app = new pc.AppBase(canvas);
app.init(opts);
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
window.addEventListener('resize', () => app.resizeCanvas());
app.scene.ambientLight = new pc.Color(0.55, 0.6, 0.7);
const Q = new URLSearchParams(location.search);
const SHADOWS = Q.get('shadows') !== '0' && !location.hash.includes('noshadow');
if (Q.get('clustered') !== '1') app.scene.clusteredLightingEnabled = false; // single directional light: clustered off is the fair/mobile setting

const mat = (r: number, g: number, b: number) => { const m = new pc.StandardMaterial(); m.diffuse = new pc.Color(r, g, b); m.gloss = 0.1; m.useMetalness = true; m.metalness = 0; m.update(); return m; };
const ent = (type: string, m: pc.StandardMaterial, s: [number, number, number], p: [number, number, number]) => {
  const e = new pc.Entity(); e.addComponent('render', { type, material: m, castShadows: true, receiveShadows: true }); e.setLocalScale(...s); e.setPosition(...p); app.root.addChild(e); return e;
};

const cam = new pc.Entity(); cam.addComponent('camera', { clearColor: new pc.Color(0.62, 0.83, 0.94), fov: 50, farClip: 120 }); app.root.addChild(cam);
const sun = new pc.Entity(); sun.addComponent('light', { type: 'directional', color: new pc.Color(1, 0.95, 0.85), intensity: 1.2, castShadows: SHADOWS, shadowType: pc.SHADOW_PCF3_32F, shadowResolution: 1024, shadowDistance: 30, shadowBias: 0.3, normalOffsetBias: 0.05 }); sun.setEulerAngles(50, 30, 0); app.root.addChild(sun);

ent('plane', mat(0.45, 0.72, 0.35), [80, 1, 80], [0, 0, 0]);
const player = ent('capsule', mat(0.95, 0.6, 0.3), [0.8, 1.6, 0.8], [0, 0.8, 0]);
const enemy = ent('sphere', mat(0.6, 0.3, 0.8), [1.6, 1.6, 1.6], [0, 0.8, -8]);
const tele = ent('cylinder', mat(1, 0.25, 0.2), [4, 0.02, 4], [0, 0.02, 0]); tele.enabled = false;

// instanced trees: trunk + crown, one draw call each
function instanced(type: string, m: pc.StandardMaterial, mk: (t: typeof TREES[0]) => pc.Mat4) {
  const e = new pc.Entity(); e.addComponent('render', { type, material: m, castShadows: true }); app.root.addChild(e);
  const data = new Float32Array(TREES.length * 16);
  TREES.forEach((t, i) => data.set(mk(t).data, i * 16));
  const vb = new pc.VertexBuffer(device, pc.VertexFormat.getDefaultInstancingFormat(device), TREES.length, { data });
  const mi = e.render!.meshInstances[0]; mi.setInstancing(vb); mi.instancingCount = TREES.length;
}
const v = new pc.Vec3(), q = new pc.Quat(), sc = new pc.Vec3();
instanced('cylinder', mat(0.5, 0.35, 0.2), (t) => new pc.Mat4().setTRS(v.set(t.x, 0.75 * t.s, t.z), q, sc.set(0.35 * t.s, 1.5 * t.s, 0.35 * t.s)));
instanced('cone', mat(0.25, 0.6, 0.3), (t) => new pc.Mat4().setTRS(v.set(t.x, 2.4 * t.s, t.z), q, sc.set(2 * t.s, 2.4 * t.s, 2 * t.s)));

let acc = 0;
app.on('update', (dt: number) => {
  acc += Math.min(dt, 0.1);
  while (acc >= 1 / 30) { logic.update(1 / 30, input); acc -= 1 / 30; }
  const p = logic.player, e = logic.enemy;
  player.setPosition(p.x, 0.8, p.z); player.setEulerAngles(0, (p.face * 180) / Math.PI, 0);
  enemy.enabled = e.state !== 'dead'; enemy.setPosition(e.x, e.state === 'slam' ? 0.5 : 0.8, e.z);
  tele.enabled = e.state === 'windup'; if (tele.enabled) tele.setPosition(e.tx, 0.03, e.tz);
  cam.setPosition(p.x, 11, p.z + 10); cam.lookAt(p.x, 0.5, p.z);
  benchFrame(stat, `PlayCanvas hp${p.hp} foe${e.hp}`);
});
app.start();
