'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const FIXTURE = path.join(__dirname, 'fixtures/react-src/src');

function findFiles(dir, exts) {
  const result = [];
  function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) walk(full);
      else if (exts.some((x) => e.name.endsWith(x))) result.push(full);
    }
  }
  walk(path.resolve(dir));
  return result;
}

function post(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 3000, path: '/v1/code-to-dsl', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => resolve(JSON.parse(buf)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const jsxFiles = findFiles(FIXTURE, ['.jsx', '.tsx']);
  const cssFiles = findFiles(FIXTURE, ['.css']);

  const css = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

  for (const file of jsxFiles) {
    const rel = path.relative(FIXTURE, file);
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`文件: ${rel}`);

    const html = fs.readFileSync(file, 'utf8');
    const resp = await post({ html, css: css || undefined });

    if (resp.error) {
      console.error('错误:', resp.error);
      continue;
    }
    console.log(JSON.stringify(resp.dsl, null, 2));
  }
}

main().catch((err) => { console.error(err.message); process.exit(1); });
