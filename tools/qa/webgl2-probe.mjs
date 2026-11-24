// Minimal WebGL2 readiness test: run BEFORE any full game QA (lifecycle, stage1-shots, bench, leak tools) on a new machine or browser.
// It does not load the game. It launches the same headless browser + flags the QA tools use, then in a blank page:
//   1) creates a WebGL2 context (no fallback to WebGL1), 2) compiles a GLSL ES 3.00 shader pair, 3) draws one triangle into an
//   offscreen framebuffer and reads the centre pixel back, 4) checks the extensions/limits three.js needs for this game.
// Usage: node tools/qa/webgl2-probe.mjs [--exe <browser executable>] [--channel msedge|chrome] [--out file.json] [--timeout 60]
//   default = the pre-installed Playwright Chromium with LAUNCH_ARGS from profiles.mjs (ANGLE + SwiftShader), the runtime
//   the cloud QA used for stage1-shots / lifecycle / pixeldiff. Exit 0 = READY, 2 = NOT READY (reason printed), 1 = the browser did not launch,
//   3 = TIMEOUT (whole probe exceeded --timeout seconds, default 60). Progress goes to stderr per stage ("probe: <stage> +<ms>") and on a
//   timeout the partial JSON is still printed/written, so a hang says WHERE it stopped (launch / newPage / evaluate / close).
// It never changes resource limits: it runs inside whatever limits the caller already applies (e.g. Gaming Mode on the owner's PC).
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { LAUNCH_ARGS } from './profiles.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const launch = { args: LAUNCH_ARGS };
if (opt('exe')) launch.executablePath = opt('exe');
if (opt('channel')) launch.channel = opt('channel');

const t0 = Date.now();
const step = (s) => { out.stage = s; process.stderr.write(`probe: ${s} +${Date.now() - t0}ms\n`); };
const out = { stage: 'start' };
const limit = Math.max(5, Number(opt('timeout') ?? 60)) * 1000;
const finish = (code) => { out.ms = Date.now() - t0; const txt = JSON.stringify(out, null, 1); if (opt('out')) fs.writeFileSync(opt('out'), txt); console.log(txt); return code; };
setTimeout(() => { out.ready = false; out.timeout = { seconds: limit / 1000, stoppedAt: out.stage }; console.log(`WEBGL2 TIMEOUT after ${limit / 1000}s at stage "${out.stage}"`); process.exit(finish(3)); }, limit).unref();
let browser;
step('launch');
try { browser = await chromium.launch(launch); }
catch (e) { out.ready = false; out.error = String(e).split('\n')[0]; process.exit(finish(1)); }
out.launch = { exe: launch.executablePath ?? 'playwright-chromium', channel: launch.channel ?? null, args: LAUNCH_ARGS, version: browser.version() };
try {
  step('newPage');
  const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  step('setContent');
  await page.setContent('<canvas id=c width=64 height=64></canvas>');
  step('evaluate');
  out.result = await page.evaluate(() => {
    const r = { stage: 'context' };
    const c = document.getElementById('c');
    let lost = false; c.addEventListener('webglcontextlost', () => { lost = true; });
    const gl = c.getContext('webgl2', { antialias: false, failIfMajorPerformanceCaveat: false });
    if (!gl) return { ...r, ok: false, why: 'getContext("webgl2") returned null (also check chrome://gpu on this machine)' };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    r.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    r.vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    r.version = gl.getParameter(gl.VERSION); r.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    r.limits = { maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE), maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS), maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), maxSamples: gl.getParameter(gl.MAX_SAMPLES) };
    r.ext = Object.fromEntries(['EXT_color_buffer_float', 'EXT_color_buffer_half_float', 'OES_texture_float_linear', 'WEBGL_lose_context'].map((n) => [n, !!gl.getExtension(n)]));
    r.stage = 'shader';
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : (r.shaderLog = gl.getShaderInfoLog(s), null); };
    const vs = sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
    const fs = sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;out vec4 o;void main(){o=vec4(0.,1.,0.,1.);}');
    if (!vs || !fs) return { ...r, ok: false, why: 'GLSL ES 3.00 shader did not compile' };
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return { ...r, ok: false, why: 'program link failed: ' + gl.getProgramInfoLog(pr) };
    r.stage = 'draw';
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 64, 64);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return { ...r, ok: false, why: 'RGBA8 framebuffer incomplete' };
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, 64, 64); gl.clearColor(1, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(pr); gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Uint8Array(4); gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); r.pixel = Array.from(px);
    r.glError = gl.getError(); r.contextLost = lost || gl.isContextLost();
    const good = px[0] === 0 && px[1] === 255 && px[2] === 0 && px[3] === 255 && r.glError === 0 && !r.contextLost;
    return { ...r, stage: 'done', ok: good, why: good ? '' : 'triangle pixel/glError/context check failed' };
  });
  out.pageErrors = errors;
} finally { step('close'); await browser.close(); }
step('done');
out.ready = !!out.result?.ok;
const code = finish(out.ready ? 0 : 2);
console.log(out.ready ? 'WEBGL2 READY' : `WEBGL2 NOT READY at stage "${out.result?.stage}": ${out.result?.why}`);
process.exit(code);
