#!/usr/bin/env node
'use strict';

const path = require('path');
const { run } = require('../src/pipeline');

const [inputDir, outputPath] = process.argv.slice(2);

if (!inputDir) {
  console.error('用法: node bin/convert.js <前端产物文件夹> [输出文件.json]');
  console.error('示例: node bin/convert.js ./dist output.dsl.json');
  process.exit(1);
}

const resolvedOutput = outputPath || 'output.dsl.json';

run(path.resolve(inputDir), resolvedOutput).catch((err) => {
  console.error('转换失败:', err.message);
  process.exit(1);
});
