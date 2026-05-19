/**
 * 测试 HTML 解析链路：crawler → html-parser → 中间树 → LLM 输入预览
 */
const fs = require('fs');
const path = require('path');
const { crawl } = require('../codeToDsl/src/crawler');
const { parseCssFiles, parseHtml } = require('../codeToDsl/src/html-parser');

const DSL_SPEC = fs.readFileSync(path.join(__dirname, '../codeToDsl/设计dsl.md'), 'utf8');
const FIXTURE = path.join(__dirname, 'fixtures/html');

console.log('=== [1] crawler ===');
const files = crawl(FIXTURE);
console.log('HTML:', files.html);
console.log('CSS: ', files.css);

console.log('\n=== [2] styleMap ===');
const styleMap = parseCssFiles(files.css);
console.log(JSON.stringify(styleMap, null, 2));

console.log('\n=== [3] 中间树 ===');
const tree = parseHtml(files.html[0], styleMap);
console.log(JSON.stringify(tree, null, 2));

console.log('\n=== [4] LLM 输入预览 ===');
const userMessage = JSON.stringify(tree, null, 2);
const systemPrompt = `你是设计稿解析引擎...\n${DSL_SPEC}`;
console.log(`system prompt: ~${Math.ceil(systemPrompt.length / 4)} tokens`);
console.log(`user message:  ~${Math.ceil(userMessage.length / 4)} tokens`);
console.log(`合计估算:       ~${Math.ceil((systemPrompt.length + userMessage.length) / 4)} tokens`);
