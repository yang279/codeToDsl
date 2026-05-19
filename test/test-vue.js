/**
 * 测试 Vue SFC 解析链路：crawler → vue-parser → 中间树 → LLM 输入预览
 */
const fs = require('fs');
const path = require('path');
const { crawl } = require('../codeToDsl/src/crawler');
const { parseVueFile, extractSfcBlocks, parseSfcStyles } = require('../codeToDsl/src/vue-parser');

const DSL_SPEC = fs.readFileSync(path.join(__dirname, '../codeToDsl/设计dsl.md'), 'utf8');
const FIXTURE = path.join(__dirname, 'fixtures/vue-src');

console.log('=== [1] crawler ===');
const files = crawl(FIXTURE);
console.log('Vue:', files.vue);

const vueFile = files.vue[0];
const raw = fs.readFileSync(vueFile, 'utf8');

console.log('\n=== [2] SFC 块提取 ===');
const { template, styles } = extractSfcBlocks(raw);
console.log('--- template ---\n', template);
console.log('--- styles ---\n', styles);

console.log('\n=== [3] styleMap（scoped hash 已去除）===');
const styleMap = parseSfcStyles(styles);
console.log(JSON.stringify(styleMap, null, 2));

console.log('\n=== [4] 中间树 ===');
const tree = parseVueFile(vueFile);
console.log(JSON.stringify(tree, null, 2));

console.log('\n=== [5] LLM 输入预览 ===');
const userMessage = JSON.stringify(tree, null, 2);
const systemPrompt = `你是设计稿解析引擎...\n${DSL_SPEC}`;
console.log(`system prompt: ~${Math.ceil(systemPrompt.length / 4)} tokens`);
console.log(`user message:  ~${Math.ceil(userMessage.length / 4)} tokens`);
console.log(`合计估算:       ~${Math.ceil((systemPrompt.length + userMessage.length) / 4)} tokens`);
