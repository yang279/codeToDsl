const css = require('css');

const LAYOUT_PROPS = new Set([
  'display', 'flex-direction', 'align-items', 'justify-content', 'gap', 'flex-wrap',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'color', 'background-color', 'background',
  'font-size', 'font-weight',
  'border-radius', 'opacity',
  'position', 'top', 'left', 'right', 'bottom',
]);

const SKIP_TAGS = new Set([
  'script', 'style', 'head', 'meta', 'link', 'noscript', 'template', 'svg',
]);

/**
 * 将 CSS 字符串解析为 styleMap：selector → { prop: value }
 * 只保留 LAYOUT_PROPS 中定义的属性。
 */
function buildStyleMap(cssContent) {
  let ast;
  try {
    ast = css.parse(cssContent, { silent: true });
  } catch {
    return {};
  }

  const styleMap = {};
  for (const rule of ast.stylesheet?.rules || []) {
    if (rule.type !== 'rule') continue;
    const decls = {};
    for (const d of rule.declarations || []) {
      if (d.type === 'declaration' && LAYOUT_PROPS.has(d.property)) {
        decls[d.property] = d.value;
      }
    }
    if (Object.keys(decls).length === 0) continue;
    for (const sel of rule.selectors || []) {
      const key = sel.trim();
      styleMap[key] = { ...(styleMap[key] || {}), ...decls };
    }
  }
  return styleMap;
}

/**
 * 对单个 DOM 节点，按优先级（element < class < inline）合并样式。
 */
function resolveStyles(el, $, styleMap) {
  const merged = {};

  const tag = el.tagName?.toLowerCase();
  if (tag) Object.assign(merged, styleMap[tag] || {});

  const classes = ($(el).attr('class') || '').split(/\s+/).filter(Boolean);
  for (const cls of classes) {
    Object.assign(merged, styleMap[`.${cls}`] || {});
  }

  const inline = $(el).attr('style') || '';
  for (const part of inline.split(';')) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = part.slice(0, colonIdx).trim();
    const val = part.slice(colonIdx + 1).trim();
    if (prop && val && LAYOUT_PROPS.has(prop)) merged[prop] = val;
  }

  return merged;
}

/**
 * 递归构建中间节点树。
 * 输出格式：{ tag, cls, text?, css?, children? }
 *
 * @param {object} tagAliases - 将特定 tag 重命名，如 { 'router-link': 'div' }
 */
function buildTree(el, $, styleMap, depth = 0, tagAliases = {}) {
  if (!el || el.type !== 'tag') return null;
  if (SKIP_TAGS.has(el.tagName?.toLowerCase())) return null;
  if (depth > 20) return null;

  const rawTag = el.tagName.toLowerCase();
  const tag = tagAliases[rawTag] || rawTag;

  const styles = resolveStyles(el, $, styleMap);
  const directText = $(el).clone().children().remove().end().text().replace(/\s+/g, ' ').trim();

  const children = [];
  for (const child of el.children || []) {
    if (child.type === 'tag') {
      const node = buildTree(child, $, styleMap, depth + 1, tagAliases);
      if (node) children.push(node);
    }
  }

  const node = {
    tag,
    cls: ($(el).attr('class') || '').replace(/\s+/g, ' ').trim(),
  };
  if (directText) node.text = directText;
  if (Object.keys(styles).length > 0) node.css = styles;
  if (children.length > 0) node.children = children;

  return node;
}

module.exports = { LAYOUT_PROPS, SKIP_TAGS, buildStyleMap, resolveStyles, buildTree };
