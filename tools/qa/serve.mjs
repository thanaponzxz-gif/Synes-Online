// Minimal static server with gzip (approximates real CDN hosting). Usage: node tools/qa/serve.mjs <dir> <port>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const root = path.resolve(process.argv[2] || 'dist'); const port = +(process.argv[3] || 4180);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const cache = new Map();
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  const ext = path.extname(f); const type = types[ext] || 'application/octet-stream';
  const gz = /gzip/.test(req.headers['accept-encoding'] || '') && !/\.(png|webp|glb|ogg|mp3)$/.test(ext);
  let body = fs.readFileSync(f);
  if (gz) { if (!cache.has(f)) cache.set(f, zlib.gzipSync(body, { level: 9 })); body = cache.get(f); }
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache', ...(gz ? { 'content-encoding': 'gzip' } : {}) });
  res.end(body);
}).listen(port, () => console.log(`serving ${root} on :${port}`));
