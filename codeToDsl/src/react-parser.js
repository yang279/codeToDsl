const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { buildStyleMap, buildTree } = require('./dom-builder');

const REACT_TAG_ALIASES = {
  'fragment': 'div',
};

// ─── JSX 提取 ────────────────────────────────────────────────────────────────

/**
 * 从 return (...) 或 return <...> 中提取 JSX 字符串。
 * 支持：函数组件、箭头函数（带括号 / 不带括号）。
 */
function extractJsx(content) {
  // return ( ... ) —— 提取括号内容
  const parenIdx = content.search(/\breturn\s*\(/);
  if (parenIdx !== -1) {
    const start = content.indexOf('(', parenIdx) + 1;
    let depth = 1;
    let i = start;
    while (i < content.length && depth > 0) {
      if (content[i] === '(') depth++;
      else if (content[i] === ')') depth--;
      i++;
    }
    return content.slice(start, i - 1).trim();
  }

  // 箭头函数隐式 return：= () => ( ... )
  const arrowIdx = content.search(/=>\s*\(/);
  if (arrowIdx !== -1) {
    const start = content.indexOf('(', arrowIdx) + 1;
    let depth = 1;
    let i = start;
    while (i < content.length && depth > 0) {
      if (content[i] === '(') depth++;
      else if (content[i] === ')') depth--;
      i++;
    }
    return content.slice(start, i - 1).trim();
  }

  // return <Tag ...>  —— 没有括号，取 return 后的全部内容
  const tagMatch = content.match(/\breturn\s+(<[\s\S]+)/);
  return tagMatch ? tagMatch[1].trim() : '';
}

// ─── JSX 预处理 ──────────────────────────────────────────────────────────────

/**
 * 将 JSX 规范化为 cheerio 可解析的 HTML-like 字符串：
 * 1. className="..." → class="..."
 * 2. className={styles.xxx} → class="xxx"（CSS Modules，保留原始类名）
 * 3. className={其他表达式} → class=""
 * 4. style={{ ... }} → 去掉（对象语法无法静态解析）
 * 5. JSX 注释 → 移除
 * 6. {表达式} → 移除
 * 7. PascalCase 组件 → <div class="__component--xxx__"></div>
 */
function preprocessJsx(jsx) {
  return jsx
    // JSX 注释
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    // className={styles.xxx} → class="xxx"（CSS Modules 保留语义类名）
    .replace(/\bclassName=\{(?:styles|css)\.([a-zA-Z0-9_]+)\}/g, 'class="$1"')
    // className={`...${styles.a}...${styles.b}...`} 模板字符串 → 提取所有 styles.xxx 拼成 class
    .replace(/\bclassName=\{`([^`]*)`\}/g, (_, tmpl) => {
      const names = [];
      const re = /\$\{(?:styles|css)\.([a-zA-Z0-9_]+)\}/g;
      let m;
      while ((m = re.exec(tmpl)) !== null) names.push(m[1]);
      return names.length ? `class="${names.join(' ')}"` : '';
    })
    // className="literal"
    .replace(/\bclassName=/g, 'class=')
    // style={{ ... }} 对象形式无法静态解析，整体移除
    .replace(/\bstyle=\{\{[\s\S]*?\}\}/g, '')
    // 剩余 {...} 表达式（包含文本插值）→ 移除
    .replace(/\{[^{}]*\}/g, '')
    // PascalCase 自定义组件（自闭合）
    .replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?\s*\/>/g, (_, name) =>
      `<div class="__component__ __component--${name.toLowerCase()}__"></div>`
    )
    // PascalCase 自定义组件（有子节点）→ 替换开/闭标签为 div
    .replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (_, name) =>
      `<div class="__component__ __component--${name.toLowerCase()}__">`
    )
    .replace(/<\/[A-Z][a-zA-Z0-9]*>/g, '</div>');
}

// ─── CSS 解析 ─────────────────────────────────────────────────────────────────

/**
 * 从 import 语句中找出该文件实际引用的 CSS 文件。
 * 支持：
 *   import styles from './Foo.module.css'
 *   import './Foo.css'
 */
function resolveCssImports(filePath, allCssFiles) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return allCssFiles;
  }

  const dir = path.dirname(filePath);
  const linked = [];
  const importRe = /import\s+(?:\S+\s+from\s+)?['"]([^'"]+\.css)['"]/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    const resolved = path.resolve(dir, m[1]);
    if (allCssFiles.includes(resolved) && !linked.includes(resolved)) {
      linked.push(resolved);
    }
  }
  return linked.length > 0 ? linked : allCssFiles;
}

function parseCssFiles(cssFiles) {
  const styleMap = {};
  for (const file of cssFiles) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const map = buildStyleMap(content);
    for (const [sel, decls] of Object.entries(map)) {
      styleMap[sel] = { ...(styleMap[sel] || {}), ...decls };
    }
  }
  return styleMap;
}

// ─── 主入口 ───────────────────────────────────────────────────────────────────

/**
 * 解析单个 React 组件文件（.jsx / .tsx），返回中间树。
 * @param {string} filePath
 * @param {string[]} allCssFiles  crawl() 返回的全量 CSS 文件列表
 */
function parseReactFile(filePath, allCssFiles = []) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const jsx = extractJsx(content);
  if (!jsx) return null;

  const html = preprocessJsx(jsx);
  const linkedCss = resolveCssImports(filePath, allCssFiles);
  const styleMap = parseCssFiles(linkedCss);

  const $ = cheerio.load(html, { xmlMode: true });
  const roots = $.root().children().toArray();
  if (roots.length === 0) return null;

  if (roots.length === 1) {
    return buildTree(roots[0], $, styleMap, 0, REACT_TAG_ALIASES);
  }

  return {
    tag: 'div',
    cls: '__root__',
    children: roots.map(el => buildTree(el, $, styleMap, 0, REACT_TAG_ALIASES)).filter(Boolean),
  };
}

/**
 * 将树中的组件占位符（cls 含 __component--xxx__）替换为注册表中的真实子树。
 * registry: { 'navbar': tree, 'usercard': tree, ... }（key 为小写组件名）
 */
function resolveComponents(node, registry, depth = 0) {
  if (!node || depth > 10) return node; // 防止循环引用

  const clsStr = node.cls || '';
  const match = clsStr.match(/__component--([a-z0-9]+)__/);
  if (match) {
    const resolved = registry[match[1]];
    if (resolved) {
      // 深拷贝避免共享引用，然后递归展开嵌套组件
      const clone = JSON.parse(JSON.stringify(resolved));
      return resolveComponents(clone, registry, depth + 1);
    }
  }

  if (node.children) {
    node.children = node.children
      .map(child => resolveComponents(child, registry, depth))
      .filter(Boolean);
  }

  return node;
}

module.exports = { parseReactFile, resolveComponents, extractJsx, preprocessJsx, resolveCssImports };
