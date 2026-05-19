'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const FIXTURE = path.join(__dirname, 'fixtures/html');

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
  const htmlFile = path.join(FIXTURE, 'index.html');
  const cssFile  = path.join(FIXTURE, 'style.css');

  const html = fs.readFileSync(htmlFile, 'utf8');
  const css  = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : undefined;

  console.log(`HTML: ~${Math.ceil(html.length / 4)} tokens`);
  if (css) console.log(`CSS:  ~${Math.ceil(css.length / 4)} tokens`);

  console.log('\n调用 /v1/code-to-dsl ...');
  const resp = await post({ html, css });

  if (resp.error) {
    console.error('错误:', resp.error);
    process.exit(1);
  }

  console.log('\n=== DSL 输出 ===');
  console.log(JSON.stringify(resp.dsl, null, 2));
}

main().catch((err) => { console.error(err.message); process.exit(1); });
