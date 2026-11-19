// Synes Online — authoritative game server (vertical-slice scope).
// Serves the static client and judges runs by re-simulating the submitted input log.
// Run: npm run server   (PORT=8080, SYNES_SECRET=<random> in production)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { replayRun } from '../shared/rules/validate.ts';
import { rewardFor } from '../shared/rules/reward.ts';

const PORT = +(process.env.PORT || 8080);
const SECRET = process.env.SYNES_SECRET || crypto.randomBytes(32).toString('hex');
const ROOT = path.resolve(process.env.SYNES_STATIC || 'dist');
const runs = new Map<string, { seed: number; startedAt: number; done: boolean; ip: string }>();
const hits = new Map<string, { n: number; t: number }>();

function rateLimited(ip: string, max = 30) {
  const now = Date.now(), h = hits.get(ip) ?? { n: 0, t: now };
  if (now - h.t > 60_000) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h);
  return h.n > max;
}
function json(res: http.ServerResponse, code: number, body: unknown) {
  res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readBody(req: http.IncomingMessage, limit = 1_000_000): Promise<any> {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => { size += c.length; if (size > limit) { reject(new Error('too-large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('bad-json')); } });
    req.on('error', reject);
  });
}
/** Server-secret roll in [0,1): client can't predict or influence loot. */
function roll(runId: string) { return crypto.createHmac('sha256', SECRET).update('loot:' + runId).digest().readUInt32BE(0) / 2 ** 32; }

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const gzCache = new Map<string, Buffer>();
function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  let p = decodeURIComponent(new URL(req.url!, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  const ext = path.extname(f), compress = /gzip/.test(String(req.headers['accept-encoding'])) && !['.png', '.webp', '.glb'].includes(ext);
  let body: Buffer = fs.readFileSync(f);
  if (compress) { if (!gzCache.has(f)) gzCache.set(f, zlib.gzipSync(body, { level: 9 }) as Buffer); body = gzCache.get(f)!; }
  const immutable = p.includes('/assets/') && /-[A-Za-z0-9_-]{8}\./.test(p);
  res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache', ...(compress ? { 'content-encoding': 'gzip' } : {}) });
  res.end(body);
}

export const server = http.createServer(async (req, res) => {
  const ip = (req.socket.remoteAddress || '?');
  const url = new URL(req.url!, 'http://x');
  try {
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, game: 'synes-online', build: 'slice-1' });
    if (url.pathname === '/api/run/start' && req.method === 'POST') {
      if (rateLimited(ip)) return json(res, 429, { error: 'rate-limited' });
      const runId = crypto.randomUUID(), seed = crypto.randomBytes(4).readUInt32BE(0);
      runs.set(runId, { seed, startedAt: Date.now(), done: false, ip });
      return json(res, 200, { runId, seed });
    }
    if (url.pathname === '/api/run/finish' && req.method === 'POST') {
      if (rateLimited(ip)) return json(res, 429, { error: 'rate-limited' });
      const body = await readBody(req);
      const run = runs.get(String(body.runId));
      if (!run) return json(res, 404, { error: 'unknown-run' });
      if (run.done) return json(res, 409, { error: 'already-finished' });
      const verdict = replayRun(run.seed, body.log, Date.now() - run.startedAt);
      if (!verdict.ok) return json(res, 422, { error: verdict.reason });
      run.done = true;
      const s = verdict.summary!;
      const reward = rewardFor({ victory: s.victory, seconds: s.seconds, damageTaken: s.damageTaken, deaths: s.deaths, perfect: s.perfect }, roll(String(body.runId)));
      // NOTE: no persistence yet (vertical slice). Next step: account/guest id + DB write here.
      return json(res, 200, { verified: true, summary: s, reward });
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'not-found' });
    serveStatic(req, res);
  } catch (e) {
    json(res, 400, { error: (e as Error).message });
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  server.listen(PORT, () => console.log(`Synes server on :${PORT} (static: ${ROOT})`));
}
