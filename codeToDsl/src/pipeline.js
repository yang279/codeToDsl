const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { crawl } = require('./crawler');
const { parseCssFiles, resolveCssForHtml, isSpaSell, parseHtml } = require('./html-parser');
const { parseVueFile } = require('./vue-parser');
const { parseReactFile, resolveComponents } = require('./react-parser');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

/**
 * 根据 crawl 结果自动判断输入类型。
 * 优先级：vue > react > html
 * @returns {'vue' | 'react' | 'html' | null}
 */
function detectMode(files) {
  if (files.vue.length > 0) return 'vue';
  if (files.react.length > 0) return 'react';
  if (files.html.length > 0) return 'html';
  return null;
}

function callServer(tree) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ tree });
    const url = new URL(`${SERVER_URL}/v1/code-to-dsl`);
    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error));
            resolve(parsed.dsl);
          } catch (e) {
            reject(new Error(`Server 响应解析失败: ${e.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function processFiles(targetFiles, parseFn, inputDir) {
  const results = [];
  for (const file of targetFiles) {
    const rel = path.relative(inputDir, file);
    process.stdout.write(`      处理: ${rel} ... `);

    const tree = parseFn(file);
    if (!tree) {
      console.log('跳过（无有效内容）');
      continue;
    }
    if (isSpaSell(tree)) {
      console.log('跳过（SPA 空壳）— 请提供 .vue 源码目录而非打包产物');
      continue;
    }

    try {
      const dsl = await callServer(tree);
      dsl.meta = { sourceFile: rel, parserVersion: '1.0.0' };
      results.push(dsl);
      console.log('完成');
    } catch (err) {
      console.log(`失败: ${err.message}`);
    }
  }
  return results;
}

/**
 * 主流程：自动识别输入目录类型，选择对应 parser，输出 DSL JSON 文件。
 * @param {string} inputDir   输入文件夹（Vue 源码 或 HTML 产物）
 * @param {string} outputPath 输出 JSON 文件路径
 */
async function run(inputDir, outputPath) {
  console.log(`[1/4] 遍历文件夹: ${inputDir}`);
  const files = crawl(inputDir);
  const mode = detectMode(files);

  if (!mode) {
    throw new Error('未找到 .vue 或 .html 文件，请检查输入目录');
  }

  const modeLabel = {
    vue:   `Vue 源码（.vue × ${files.vue.length}）`,
    react: `React 源码（.jsx/.tsx × ${files.react.length}）`,
    html:  `HTML（.html × ${files.html.length}，.css × ${files.css.length}）`,
  }[mode];
  console.log(`      模式: ${modeLabel}`);

  let parseFn;
  let targetFiles;

  if (mode === 'vue') {
    console.log('[2/4] 跳过独立 CSS 解析（样式内嵌于 .vue 文件）');
    parseFn = (file) => parseVueFile(file);
    targetFiles = files.vue;
  } else if (mode === 'react') {
    console.log('[2/4] React 模式：按 import 语句关联 CSS，并内联展开组件引用');

    // 第一遍：建立组件注册表 { 'navbar': tree, ... }
    const registry = {};
    for (const file of files.react) {
      const name = path.basename(file, path.extname(file)).toLowerCase();
      const tree = parseReactFile(file, files.css);
      if (tree) registry[name] = tree;
    }

    // 第二遍：展开每棵树中的组件占位符
    parseFn = (file) => {
      const name = path.basename(file, path.extname(file)).toLowerCase();
      const tree = registry[name];
      if (!tree) return null;
      return resolveComponents(JSON.parse(JSON.stringify(tree)), registry);
    };
    targetFiles = files.react;
  } else {
    console.log('[2/4] HTML 模式：每个页面按自身 <link> 标签加载对应 CSS');
    parseFn = (file) => {
      const linkedCss = resolveCssForHtml(file, files.css);
      const styleMap = parseCssFiles(linkedCss);
      return parseHtml(file, styleMap);
    };
    targetFiles = files.html;
  }

  console.log('[3/4] 解析文件 → 中间树 → 调用 LLM...');
  const results = await processFiles(targetFiles, parseFn, inputDir);

  if (results.length === 0) {
    throw new Error('所有文件处理失败，未生成任何 DSL');
  }

  console.log('[4/4] 写入输出文件...');
  const output = results.length === 1 ? results[0] : results;
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`      已写入: ${path.resolve(outputPath)}`);

  return output;
}

module.exports = { run, detectMode };
