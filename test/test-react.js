/**
 * 测试 React JSX 解析链路：crawler → react-parser → 中间树 → LLM 输入预览
 */
const fs = require('fs');
const path = require('path');
const { crawl } = require('../codeToDsl/src/crawler');
const { parseReactFile, resolveComponents, extractJsx, preprocessJsx, resolveCssImports } = require('../codeToDsl/src/react-parser');

const FIXTURE = path.join(__dirname, 'fixtures/react-src');

console.log('=== [1] crawler ===');
const files = crawl(FIXTURE);
console.log('React:', files.react);
console.log('CSS:  ', files.css);

// 第一遍：建立组件注册表
const registry = {};
for (const file of files.react) {
  const name = path.basename(file, path.extname(file)).toLowerCase();
  const tree = parseReactFile(file, files.css);
  if (tree) registry[name] = tree;
}
console.log('\n=== [2] 组件注册表 keys ===', Object.keys(registry));

for (const file of files.react) {
  const rel = path.relative(FIXTURE, file);
  const content = fs.readFileSync(file, 'utf8');
  const name = path.basename(file, path.extname(file)).toLowerCase();

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`文件: ${rel}`);

  const jsx = extractJsx(content);
  console.log('\n--- 提取的 JSX ---');
  console.log(jsx.slice(0, 300) + (jsx.length > 300 ? '\n...(截断)' : ''));

  const html = preprocessJsx(jsx);
  console.log('\n--- 预处理后 HTML ---');
  console.log(html.slice(0, 300) + (html.length > 300 ? '\n...(截断)' : ''));

  const linkedCss = resolveCssImports(file, files.css);
  console.log('\n--- 关联 CSS ---');
  console.log(linkedCss.map(f => path.relative(FIXTURE, f)));

  // 第二遍：展开组件引用
  const rawTree = registry[name];
  const tree = resolveComponents(JSON.parse(JSON.stringify(rawTree)), registry);

  console.log('\n--- 中间树（组件已内联）---');
  console.log(JSON.stringify(tree, null, 2));

  const nodeCount = JSON.stringify(tree).match(/"tag"/g)?.length ?? 0;
  const tokens = Math.ceil(JSON.stringify(tree, null, 2).length / 4);
  console.log(`\n节点数: ${nodeCount}，user message 估算: ~${tokens} tokens`);
}
