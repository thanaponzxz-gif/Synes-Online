import fs from 'node:fs'; import zlib from 'node:zlib'; import path from 'node:path';
const root = process.argv[2];
const rows = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else { const b = fs.readFileSync(p); const compressible = !/\.(png|webp|ogg|mp3)$/.test(f);
 rows.push({ file: path.relative(root,p), raw: b.length, gzip: zlib.gzipSync(b,{level:9}).length, br: zlib.brotliCompressSync(b,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}).length }); } } })(root);
console.log(JSON.stringify(rows,null,1));
