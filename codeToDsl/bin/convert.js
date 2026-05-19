#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const [inputDir, outputPath] = process.argv.slice(2);

if (!inputDir) {
  console.error('用法: node bin/convert.js <文件夹> [输出文件.json]');
  console.error('示例: node bin/convert.js ./src output.dsl.json');
  process.exit(1);
}

function findFiles(dir) {
  const html = [], css = [];
  function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html')) html.push(full);
      else if (e.name.endsWith('.css')) css.push(full);
    }
  }
  walk(path.resolve(dir));
  return { html, css };
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const req = transport.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error(`响应解析失败: ${e.message}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const abs = path.resolve(inputDir);
  const { html: htmlFiles, css: cssFiles } = findFiles(abs);

  if (htmlFiles.length === 0) {
    console.error('未找到 .html 文件');
    process.exit(1);
  }

  const cssContent = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const results = [];

  for (const htmlFile of htmlFiles) {
    const rel = path.relative(abs, htmlFile);
    process.stdout.write(`处理: ${rel} ... `);

    const resp = await post(`${SERVER_URL}/v1/code-to-dsl`, {
      html: fs.readFileSync(htmlFile, 'utf8'),
      css: cssContent || undefined,
    });

    if (resp.error) {
      console.log(`失败: ${resp.error}`);
      continue;
    }

    resp.dsl.meta = { sourceFile: rel, parserVersion: '2.0.0' };
    results.push(resp.dsl);
    console.log('完成');
  }

  if (results.length === 0) {
    console.error('所有文件处理失败');
    process.exit(1);
  }

  const out = results.length === 1 ? results[0] : results;
  const outPath = path.resolve(outputPath || 'output.dsl.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`已写入: ${outPath}`);
}

run().catch((err) => {
  console.error('转换失败:', err.message);
  process.exit(1);
});
