import { WebGLRenderer, Scene, PerspectiveCamera, Color, AmbientLight, DirectionalLight, Mesh, MeshStandardMaterial, PlaneGeometry, CapsuleGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, InstancedMesh, Object3D, PCFShadowMap } from 'three';
import { createTouchInput } from '../common/input';
import { SpikeLogic, TREES } from '../common/logic';
import { benchFrame } from '../common/bench';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const stat = document.getElementById('stat')!;
const input = createTouchInput(document.getElementById('ui')!);
const logic = new SpikeLogic();

const r = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
r.setPixelRatio(Math.min(window.devicePixelRatio, 2)); r.setSize(innerWidth, innerHeight, false);
const SHADOWS = new URLSearchParams(location.search).get('shadows') !== '0';
r.shadowMap.enabled = SHADOWS; r.shadowMap.type = PCFShadowMap;
const scene = new Scene(); scene.background = new Color(0.62, 0.83, 0.94);
const cam = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 120);
addEventListener('resize', () => { r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
scene.add(new AmbientLight(0x8c99b3, 1.6));
const sun = new DirectionalLight(0xfff2d9, 2.4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 60 }); scene.add(sun, sun.target);

const mat = (c: number) => new MeshStandardMaterial({ color: c, roughness: 0.9 });
const add = (m: Mesh) => { m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
const ground = add(new Mesh(new PlaneGeometry(80, 80), mat(0x73b859))); ground.rotation.x = -Math.PI / 2;
const player = add(new Mesh(new CapsuleGeometry(0.4, 0.8, 4, 12), mat(0xf29a4d)));
const enemy = add(new Mesh(new SphereGeometry(0.8, 24, 16), mat(0x994dcc)));
const tele = add(new Mesh(new CylinderGeometry(2, 2, 0.02, 32), mat(0xff4033))); tele.visible = false;

const dummy = new Object3D();
function instanced(geo: any, c: number, set: (t: typeof TREES[0]) => void) {
  const im = new InstancedMesh(geo, mat(c), TREES.length); im.castShadow = true;
  TREES.forEach((t, i) => { set(t); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); scene.add(im);
}
instanced(new CylinderGeometry(0.5, 0.5, 1, 12), 0x805933, (t) => { dummy.position.set(t.x, 0.75 * t.s, t.z); dummy.scale.set(0.35 * t.s, 1.5 * t.s, 0.35 * t.s); });
instanced(new ConeGeometry(0.5, 1, 16), 0x40994d, (t) => { dummy.position.set(t.x, 2.4 * t.s, t.z); dummy.scale.set(2 * t.s, 2.4 * t.s, 2 * t.s); });

let acc = 0, last = performance.now();
r.setAnimationLoop(() => {
  const now = performance.now(); acc += Math.min((now - last) / 1000, 0.1); last = now;
  while (acc >= 1 / 30) { logic.update(1 / 30, input); acc -= 1 / 30; }
  const p = logic.player, e = logic.enemy;
  player.position.set(p.x, 0.8, p.z); player.rotation.y = p.face;
  enemy.visible = e.state !== 'dead'; enemy.position.set(e.x, e.state === 'slam' ? 0.5 : 0.8, e.z);
  tele.visible = e.state === 'windup'; tele.position.set(e.tx, 0.03, e.tz);
  sun.position.set(p.x + 10, 20, p.z + 8); sun.target.position.set(p.x, 0, p.z);
  cam.position.set(p.x, 11, p.z + 10); cam.lookAt(p.x, 0.5, p.z);
  r.render(scene, cam);
  benchFrame(stat, `Three hp${p.hp} foe${e.hp}`);
});
