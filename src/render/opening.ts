// Opening scene (camp -> path A) look prototypes for docs/stage1/ART_TARGET_OPENING.md §5. Render-only, never touches the sim.
//   ?opening=A  keep the bright `dewlight` field; move value onto the guide crystal and the far gate, light the far path, rim on the hair
//   ?opening=B  the same, plus a light share of the arena atmosphere (DES-004 step 1) in the field: cooler sky/grass, stone-grey path
// No parameter = the current look: View only calls into this file when an option is set, and nothing here runs at import time
// (no material/Object3D is created, so ids, draw order and the campfire flicker phase of the default build stay the same).
// Cost (both options): +2 draw calls in the opening frame (guide crystal, one halo mesh), 0 textures, 3 small shader patches.
import {
  AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Mesh, ShaderMaterial, type Material, type Object3D,
} from 'three';
import { ARENA_ATMOS } from './atmosphere.ts';
import { makeProp, PAL } from './models.ts';
import type { Tone } from './tones.ts';

export type OpeningId = 'A' | 'B';
/** One guide crystal: kit `crystal_cluster`, placed by hand (decorative, no collision; Level Design question AQ4). */
interface Guide { x: number; z: number; s: number; rot: number }
interface Glow {
  /** facing range (|N·V|) over which a facet goes from body colour to the near-white core */ core: [number, number];
  /** core = part colour mixed this far toward white (hue kept, S <= 0.2 at 0.7) */ white: number;
  /** body = part colour * this */ body: number;
  /** violet tips: object-space y range and strength */ tipY: [number, number]; tipK: number;
  /** share of the scene fog the glow still takes (0 = none) */ fogK: number;
}
export interface OpeningLook {
  id: OpeningId;
  /** path fill along z (world): [z, colour] stops, near camp first; drawn into the ground canvas instead of the flat tone.path */
  path: [number, number][];
  /** B only: field atmosphere share of ARENA_ATMOS and colour shifts */
  field?: { fogK: number; fogNear: number; fogFar: number; hemiSkyK: number; hemiGroundK: number; hemiI: number; sunI: number; grassK: number; edge: number };
  guides: Guide[];
  crystal: Glow;
  /** far gate (`crystal_gate`): fog multiplier on its stone, stone shade at full fog distance (reads as a shape, not as haze), crystal glow */
  gate: { fogK: number; stoneFar: number; glow: Glow };
  /** additive halo behind each guide crystal: size (m, x scale), intensity */
  halo: { w: number; h: number; i: number };
  /** hero hair rim (DES-004 §2 warm light <= #FFE0A0 family; target doc allows sun rim <= #FFF0D2 or lumen) */
  rim: { color: number; k: number; pow: number };
  /** lanterns + campfire: HSV saturation cap on screen (target doc issue 7: gold S <= 0.75, hue kept) */
  warmSatCap: number;
}

// The first crystal of the opening frame: the medium-tier scatter (seed 7) puts a crystal_cluster at (5.43, -14.31) s 0.95, right of trail A
// (x~535 at tick 0); the low tier has none there (its scatter runs a different random sequence). The guide sits on that spot in every tier.
const GUIDES: Guide[] = [{ x: 5.43, z: -14.31, s: 1.45, rot: 3.3 }];
const CRYSTAL_GLOW: Glow = { core: [0.55, 0.95], white: 0.72, body: 1.0, tipY: [0.8, 1.36], tipK: 0.45, fogK: 0.0 };
const GATE_GLOW: Glow = { core: [0.7, 1.0], white: 0.25, body: 1.0, tipY: [2.2, 3.04], tipK: 0.35, fogK: 0.25 };

const LOOKS: Record<OpeningId, OpeningLook> = {
  A: {
    id: 'A',
    // camp and near trail a touch deeper than tone.path #EAD1A4, the far trail / clearing lighter and a little warmer ("light at the end");
    // past the clearing gate it goes back to tone.path, so the spring / arena approach keeps today's path
    path: [[8, 0xe3c89b], [-4, 0xe5ca9e], [-16, 0xead2a6], [-28, 0xf6e3bd], [-40, 0xfbebc8], [-46, 0xfbebc8], [-56, 0xead1a4]],
    guides: GUIDES, crystal: CRYSTAL_GLOW,
    gate: { fogK: 0.35, stoneFar: 0.72, glow: GATE_GLOW },
    halo: { w: 1.5, h: 2.1, i: 0.55 },
    rim: { color: 0xfff0d2, k: 1.5, pow: 2.2 },
    warmSatCap: 0.72,
  },
  B: {
    id: 'B',
    // stone-grey path (S <= 0.20), the same value from camp to clearing, a little lighter far away
    path: [[8, 0xd2c8c0], [-4, 0xd4cac2], [-16, 0xd7cdc5], [-28, 0xdbd2ca], [-40, 0xded6ce]],
    field: { fogK: 0.5, fogNear: 22, fogFar: 60, hemiSkyK: 0.55, hemiGroundK: 0.3, hemiI: 1.6, sunI: 1.8, grassK: 0.3, edge: 0x9a8f8c },
    guides: GUIDES, crystal: CRYSTAL_GLOW,
    gate: { fogK: 0.35, stoneFar: 0.75, glow: GATE_GLOW },
    halo: { w: 1.5, h: 2.1, i: 0.6 },
    rim: { color: 0xfff0d2, k: 1.8, pow: 2.2 },
    warmSatCap: 0.72,
  },
};

/** Default = A (PM pick, stage1 round 1: keeps `dewlight`, larger warning-ring/path luma gap). `?opening=B` = lavender-haze
 *  option (needs team A AQ1/AQ3), `?opening=0` = pre-stage1 look for before/after comparison. */
export function openingFromQuery(q: URLSearchParams): OpeningLook | null {
  const v = (q.get('opening') || '').toUpperCase();
  if (v === '0' || v === 'BASE' || v === 'CUR') return null;
  return v === 'B' ? LOOKS.B : LOOKS.A;
}

const mixHex = (a: number, b: number, k: number) => new Color(a).lerp(new Color(b), k).getHex();
/** B: the meadow tone with a light share of the arena atmosphere; A: unchanged (it keeps `dewlight`). */
export function openingTone(t: Tone, o: OpeningLook): Tone {
  const f = o.field; if (!f) return t;
  const A = ARENA_ATMOS;
  return {
    ...t, id: t.id + '-opening' + o.id,
    fog: mixHex(t.fog, A.fog, f.fogK), fogNear: f.fogNear, fogFar: f.fogFar,
    hemiSky: mixHex(t.hemiSky, A.hemiSky, f.hemiSkyK), hemiGround: mixHex(t.hemiGround, A.hemiGround, f.hemiGroundK), hemiI: f.hemiI, sunI: f.sunI,
    grassA: mixHex(t.grassA, A.hemiGround, f.grassK), grassB: mixHex(t.grassB, A.hemiGround, f.grassK),
    path: o.path[1][1], pathEdge: f.edge,
  };
}

/** Ground canvas: path fill as a gradient along world z. V maps world z to canvas y. */
export function openingPathFill(g: CanvasRenderingContext2D, o: OpeningLook, V: (z: number) => number): CanvasGradient {
  const z0 = o.path[0][0], z1 = o.path[o.path.length - 1][0];
  const grad = g.createLinearGradient(0, V(z0), 0, V(z1));
  for (const [z, c] of o.path) grad.addColorStop((z - z0) / (z1 - z0), '#' + c.toString(16).padStart(6, '0'));
  return grad;
}

/** true where a scatter crystal would sit on a guide crystal (the guide replaces it) */
export const nearGuide = (o: OpeningLook, x: number, z: number) => o.guides.some((gd) => Math.hypot(gd.x - x, gd.z - z) < 1.5);

// ------------------------------------------------------------------ shader patches (chained onto the material's own patch)
type Patchable = Material & { onBeforeCompile: (sh: any, r: any) => void; customProgramCacheKey: () => string };
function chain(m: Material, key: string, patch: (sh: any) => void) {
  const p = m as Patchable, prev = p.onBeforeCompile.bind(p), prevKey = p.customProgramCacheKey.bind(p);
  p.onBeforeCompile = (sh, r) => { prev(sh, r); patch(sh); };
  p.customProgramCacheKey = () => prevKey() + '|' + key;
  p.needsUpdate = true;
}
const glowUniforms = (g: Glow) => ({
  uGlowCore: { value: g.core }, uGlowWhite: { value: g.white }, uGlowBody: { value: g.body },
  uGlowTipY: { value: g.tipY }, uGlowTipK: { value: g.tipK }, uGlowTip: { value: new Color(PAL.violet) }, uGlowFogK: { value: g.fogK },
});
const GLOW_DECL = 'uniform vec2 uGlowCore; uniform float uGlowWhite; uniform float uGlowBody; uniform vec2 uGlowTipY; uniform float uGlowTipK; uniform vec3 uGlowTip; uniform float uGlowFogK;\nvarying float vObjY;\n';
/** Crystal parts (anything with emissive light) are drawn as glowing crystal: authored part colour (sRGB) on the body, a near-white core
 *  on facets turned to the camera, violet toward the tips; unlit, not tone mapped. Stone parts keep the normal lit result. */
const GLOW_FRAG = `
  if (max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b)) > 0.004) {
    vec3 gBase = sRGBTransferOETF(vec4(diffuseColor.rgb, 1.0)).rgb;
    float gFacing = abs(dot(normal, normalize(vViewPosition)));
    vec3 gCol = mix(gBase * uGlowBody, mix(gBase, vec3(1.0), uGlowWhite), smoothstep(uGlowCore.x, uGlowCore.y, gFacing));
    gCol = mix(gCol, sRGBTransferOETF(vec4(uGlowTip, 1.0)).rgb, smoothstep(uGlowTipY.x, uGlowTipY.y, vObjY) * uGlowTipK);
    #ifdef USE_FOG
      gCol = mix(gCol, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * uGlowFogK);
    #endif
    gl_FragColor.rgb = gCol;
  }`;
function patchGlow(sh: any, g: Glow) {
  Object.assign(sh.uniforms, glowUniforms(g));
  sh.vertexShader = 'varying float vObjY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvObjY = position.y;');
  sh.fragmentShader = GLOW_DECL + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>' + GLOW_FRAG);
}

/** Far gate: its stone keeps less of the fog and goes toward its own shadow tone with distance (unchanged up close), crystals glow. */
export function patchGate(mats: Material[], o: OpeningLook) {
  for (const m of mats) chain(m, 'openingGate' + o.id, (sh) => {
    patchGlow(sh, o.gate.glow);
    sh.uniforms.uGateFogK = { value: o.gate.fogK }; sh.uniforms.uStoneFar = { value: o.gate.stoneFar };
    sh.fragmentShader = 'uniform float uGateFogK; uniform float uStoneFar;\n' + sh.fragmentShader.replace('#include <fog_fragment>', `
      #ifdef USE_FOG
        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        gl_FragColor.rgb *= mix( 1.0, uStoneFar, fogFactor );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor * uGateFogK );
      #endif`);
  });
}

/** Hair rim: warm-white light on the upper silhouette of the head (facets turned up and away from the camera). */
export function patchHeroRim(head: Object3D | undefined, o: OpeningLook) {
  head?.traverse((n) => {
    const mesh = n as Mesh; if (!mesh.isMesh) return;
    chain(mesh.material as Material, 'openingRim' + o.id, (sh) => {
      sh.uniforms.uRimCol = { value: new Color(o.rim.color) }; sh.uniforms.uRimK = { value: o.rim.k }; sh.uniforms.uRimPow = { value: o.rim.pow };
      sh.fragmentShader = 'uniform vec3 uRimCol; uniform float uRimK; uniform float uRimPow;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
        {
          vec3 rWn = normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
          float rEdge = 1.0 - abs( dot( normal, normalize( vViewPosition ) ) );
          outgoingLight += uRimCol * uRimK * pow( rEdge, uRimPow ) * smoothstep( 0.05, 0.75, rWn.y );
        }
        #include <opaque_fragment>`);
    });
  });
}

/** Lanterns and campfire: cap the on-screen HSV saturation (hue and value kept). One patched clone per source material, shared by every
 *  lantern, so draw calls stay the same. */
function capWarmProps(env: Object3D, o: OpeningLook, disposables: { dispose(): void }[]) {
  const swap = new Map<Material, Material>();
  for (const prop of env.children) {
    if (prop.name !== 'lantern_post' && prop.name !== 'campfire') continue;
    prop.traverse((n) => {
      const mesh = n as Mesh; if (!mesh.isMesh) return;
      const src = mesh.material as Material; let own = swap.get(src);
      if (!own) {
        own = src.clone(); swap.set(src, own); disposables.push(own);
        chain(own, 'openingSatCap' + o.id, (sh) => {
          sh.uniforms.uSatCap = { value: o.warmSatCap };
          sh.fragmentShader = 'uniform float uSatCap;\n' + sh.fragmentShader.replace('#include <colorspace_fragment>', `#include <colorspace_fragment>
            { float cMax = max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), cMin = min(gl_FragColor.r, min(gl_FragColor.g, gl_FragColor.b));
              float sat = cMax > 0.0 ? (cMax - cMin) / cMax : 0.0;
              if (sat > uSatCap) gl_FragColor.rgb = vec3(cMax) - (vec3(cMax) - gl_FragColor.rgb) * (uSatCap / sat); }`);
        });
      }
      mesh.material = own;
    });
  }
}

/** Guide crystal(s) + one additive halo mesh for all of them + the lantern/campfire saturation cap. Returns per-frame update + dispose.
 *  nearFade = View's near-camera dither (as on the scatter the guide replaces); nearU = its shared distance uniform, also used by the halo. */
export function addOpeningProps(env: Object3D, o: OpeningLook, nearFade: (m: Material) => Material, nearU: { value: number }) {
  const disposables: { dispose(): void }[] = [];
  capWarmProps(env, o, disposables);
  for (const gd of o.guides) {
    const c = makeProp('crystal_cluster'); c.position.set(gd.x, 0, gd.z); c.rotation.y = gd.rot; c.scale.setScalar(gd.s); c.name = 'opening_guide';
    c.traverse((n) => { const mesh = n as Mesh; if (!mesh.isMesh) return; const own = nearFade(mesh.material as Material); chain(own, 'openingGuide' + o.id, (sh) => patchGlow(sh, o.crystal)); mesh.material = own; disposables.push(own); });
    env.add(c);
  }
  // halos: camera-facing ellipses (as atmosphere.ts makeGlowHalos), lumen, additive, depth-tested so the hero / props in front hide them
  const pos: number[] = [], uv: number[] = [], center: number[] = [], size: number[] = [], index: number[] = [];
  o.guides.forEach((gd, i) => {
    for (const [qx, qy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) { pos.push(qx, qy, 0); uv.push(qx + 0.5, qy + 0.5); center.push(gd.x, 0.62 * gd.s, gd.z); size.push(o.halo.w * gd.s, o.halo.h * gd.s); }
    const k = i * 4; index.push(k, k + 1, k + 2, k, k + 2, k + 3);
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setAttribute('aCenter', new Float32BufferAttribute(center, 3)); geo.setAttribute('aSize', new Float32BufferAttribute(size, 2)); geo.setIndex(index);
  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false,
    uniforms: { uI: { value: o.halo.i }, uTime: { value: 0 }, uColor: { value: new Color(PAL.lumen) }, uNearFade: nearU },
    vertexShader: `attribute vec3 aCenter; attribute vec2 aSize; varying vec2 vUv; varying float vDist;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(aCenter, 1.0); vDist = length(mv.xyz); mv.xy += position.xy * aSize; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uI; uniform float uTime; uniform vec3 uColor; uniform float uNearFade; varying vec2 vUv; varying float vDist;
      void main(){ float d = length(vUv * 2.0 - 1.0); if (d > 1.0) discard; float f = 1.0 - d; f = f * f;
        f *= smoothstep(uNearFade, uNearFade + 3.0, vDist); // fades with its crystal near the camera
        gl_FragColor = vec4(uColor * f * uI * (0.9 + 0.1 * sin(uTime * 1.6)), 1.0); }`,
  });
  // vertices move in the shader: give the CPU a sphere that holds every halo so it is still culled outside the field view (boss arena)
  geo.computeBoundingSphere(); const bs = geo.boundingSphere!; let cx = 0, cz = 0; o.guides.forEach((gd) => { cx += gd.x / o.guides.length; cz += gd.z / o.guides.length; });
  bs.center.set(cx, 1, cz); bs.radius = Math.max(...o.guides.map((gd) => Math.hypot(gd.x - cx, gd.z - cz) + Math.max(o.halo.w, o.halo.h) * gd.s));
  const halo = new Mesh(geo, mat); halo.renderOrder = 2; halo.name = 'opening_halo';
  env.add(halo); disposables.push(geo, mat);
  return {
    update(time: number) { mat.uniforms.uTime.value = time; },
    dispose() { for (const d of disposables) d.dispose(); },
  };
}
