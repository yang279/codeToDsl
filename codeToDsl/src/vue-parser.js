const fs = require('fs');
const cheerio = require('cheerio');
const { buildStyleMap, buildTree } = require('./dom-builder');

const VUE_TAG_ALIASES = {
  'router-link': 'div',
  'router-view': 'div',
  'transition': 'div',
  'keep-alive': 'div',
};

// 匹配 PascalCase 或 kebab-case 的自定义组件，替换为 div 占位以保留结构
const COMPONENT_RE = /<([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9]*-[a-z][a-z0-9-]*)(\s[^>]*)?\s*\/>/g;

function normalizeTemplate(template) {
  return template.replace(COMPONENT_RE, (_, name, attrs = '') => {
    const cls = `__component__ __component--${name.toLowerCase()}__`;
    return `<div class="${cls}"></div>`;
  });
}

/**
 * 从 .vue 文件内容中提取 template 和 style 块。
 */
function extractSfcBlocks(content) {
  const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  const template = templateMatch ? templateMatch[1].trim() : '';

  const styleBlocks = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = styleRe.exec(content)) !== null) {
    styleBlocks.push(m[1]);
  }

  return { template, styles: styleBlocks.join('\n') };
}

/**
 * 解析 SFC 样式字符串，去掉 scoped hash 后构建 styleMap。
 */
function parseSfcStyles(stylesContent) {
  // .foo[data-v-3f8a92b1] → .foo
  const cleaned = stylesContent.replace(/\[data-v-[a-f0-9]+\]/g, '');
  return buildStyleMap(cleaned);
}

/**
 * 解析单个 .vue 文件，返回中间树。
 */
function parseVueFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const { template, styles } = extractSfcBlocks(content);
  if (!template) return null;

  const styleMap = parseSfcStyles(styles);
  // 将自定义组件替换为 div 占位，再用 xmlMode 确保自闭合标签被正确解析
  const $ = cheerio.load(normalizeTemplate(template), { xmlMode: true });

  // xmlMode 下不自动补 html/body，直接取根节点的子节点
  const roots = $.root().children().toArray();
  if (roots.length === 0) return null;

  if (roots.length === 1) {
    return buildTree(roots[0], $, styleMap, 0, VUE_TAG_ALIASES);
  }

  // Vue 3 多根节点：包一层虚拟容器
  return {
    tag: 'div',
    cls: '__root__',
    children: roots.map(el => buildTree(el, $, styleMap, 0, VUE_TAG_ALIASES)).filter(Boolean),
  };
}

module.exports = { parseVueFile, extractSfcBlocks, parseSfcStyles };
