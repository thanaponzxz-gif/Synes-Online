// Turns the Vite build (dist/) into a claude.ai Artifact page: the host wraps the page in its own
// <html>/<head>/<body>, so we emit only title/meta/style + body content, inline the CSS, and keep JS/GLB as files.
// Usage: node tools/publish/make-artifact.mjs  → dist/artifact.html + prints the files map
import fs from 'node:fs'; import path from 'node:path';
const dist = path.resolve('dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g)].map((m) => fs.readFileSync(path.join(dist, m[1]), 'utf8')).join('\n');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>/, '')
  .replace(/<link rel="stylesheet"[^>]*>/g, '')
  .replace(/<script type="module"[^>]*><\/script>/g, '')
  .replace(/<link rel="modulepreload"[^>]*>/g, '');
const scripts = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((m) => `<script type="module" src="${m[1]}"></script>`).join('\n');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script type="module"[^>]*><\/script>/g, '');
const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const rest = head.replace(title, '');
// Artifact hosting does not serve .glb, so ship the same model as embedded glTF JSON (standard glTF, base64 buffer).
const glbPath = path.join(dist, 'assets/models/synes_kit.glb');
if (fs.existsSync(glbPath)) {
  const b = fs.readFileSync(glbPath); const jsonLen = b.readUInt32LE(12);
  const gltf = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen; const binLen = b.readUInt32LE(binStart);
  gltf.buffers[0].uri = 'data:application/octet-stream;base64,' + b.subarray(binStart + 8, binStart + 8 + binLen).toString('base64');
  fs.writeFileSync(path.join(dist, 'assets/models/synes_kit.json'), JSON.stringify(gltf));
}
const kitHint = fs.existsSync(glbPath) ? `<script>window.__SYNES_KIT_URL='./assets/models/synes_kit.json'</script>\n` : '';
const out = `${title}\n${rest.trim()}\n<style>:root{color-scheme:dark;padding:0!important}html,body{height:100%}\n${css}</style>\n${body.trim()}\n${kitHint}${scripts}\n`;
fs.writeFileSync(path.join(dist, 'artifact.html'), out);
const files = {};
for (const f of fs.readdirSync(path.join(dist, 'assets'))) if (!f.endsWith('.css') && fs.statSync(path.join(dist, 'assets', f)).isFile()) files[`assets/${f}`] = `dist/assets/${f}`;
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.json')) files[path.relative(dist, p)] = path.relative(process.cwd(), p); } };
if (fs.existsSync(path.join(dist, 'assets/models'))) walk(path.join(dist, 'assets/models'));
fs.writeFileSync(path.join(dist, 'artifact-files.json'), JSON.stringify(files, null, 2));
console.log(`artifact.html ${(out.length / 1024).toFixed(1)} KB`); console.log(JSON.stringify(files, null, 2));
