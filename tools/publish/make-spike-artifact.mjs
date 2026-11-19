// Packs the engine spike (dist-spike/) into one artifact page that loads PlayCanvas or Three.js by #hash,
// so the owner can compare both engines on a real phone. Usage: node tools/publish/make-spike-artifact.mjs
import fs from 'node:fs';
const dir = 'dist-spike/assets', f = fs.readdirSync(dir);
const pick = (p) => f.find((x) => x.startsWith(p) && x.endsWith('.js'));
const css = fs.readFileSync(`${dir}/${f.find((x) => x.endsWith('.css'))}`, 'utf8');
const page = `<title>Synes Engine Spike</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<style>:root{color-scheme:dark;padding:0!important}${css}
#switch{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:calc(8px + env(safe-area-inset-right,0px));display:flex;gap:6px;z-index:5;font:13px system-ui,sans-serif}
#switch a{color:#fff;background:rgba(30,34,80,.7);border:1.5px solid rgba(255,255,255,.6);border-radius:10px;padding:6px 10px;text-decoration:none}
#switch a.on{background:#ffc857;color:#3a2400;border-color:#ffc857}
#stat{font-size:14px!important}
#note{position:fixed;left:calc(8px + env(safe-area-inset-left,0px));top:40px;max-width:46ch;color:#123;background:rgba(255,255,255,.75);font:12px/1.4 system-ui,sans-serif;padding:6px 8px;border-radius:6px}
</style>
<canvas id="c"></canvas><div id="ui"><div id="stat">กำลังโหลด…</div></div>
<div id="note">ฉากเดียวกันทั้งสองเอนจิน: ต้นไม้ 300 ต้น เงา และศัตรู 1 ตัว ให้ดูตัวเลข FPS มุมซ้ายบนหลังเปิดค้างไว้ 10 วินาที แล้วจดผลของแต่ละปุ่ม</div>
<nav id="switch"><a href="#three">Three.js</a><a href="#playcanvas">PlayCanvas</a><a href="#three-noshadow">Three ไม่มีเงา</a><a href="#playcanvas-noshadow">PC ไม่มีเงา</a></nav>
<script>
  const h = location.hash.slice(1) || 'three';
  document.querySelectorAll('#switch a').forEach((a) => { if (a.getAttribute('href') === '#' + h) a.classList.add('on'); });
  const s = document.createElement('script'); s.type = 'module';
  s.src = h.startsWith('playcanvas') ? './assets/${pick('playcanvas')}' : './assets/${pick('three')}';
  document.body.appendChild(s);
  addEventListener('hashchange', () => location.reload());
</script>
`;
fs.writeFileSync('dist-spike/spike-artifact.html', page);
const files = Object.fromEntries(f.filter((x) => x.endsWith('.js')).map((x) => [`assets/${x}`, `dist-spike/assets/${x}`]));
fs.writeFileSync('dist-spike/spike-files.json', JSON.stringify(files, null, 2));
console.log(JSON.stringify(files));
