const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { buildStyleMap, buildTree } = require('./dom-builder');

/**
 * 读取多个 CSS 文件，合并为 styleMap。
 */
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

/**
 * 从 HTML 文件的 <link rel="stylesheet"> 中找到实际引用的 CSS 文件路径。
 * 匹配范围限于 allCssFiles 列表（避免引用外部 CDN）。
 * 如果 HTML 没有任何 link 标签，回退到全量 CSS 列表。
 */
function resolveCssForHtml(htmlFile, allCssFiles) {
  let content;
  try {
    content = fs.readFileSync(htmlFile, 'utf8');
  } catch {
    return allCssFiles;
  }

  const $ = cheerio.load(content);
  const dir = path.dirname(htmlFile);
  const linked = [];

  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || /^https?:\/\//.test(href)) return;

    // href 可能是相对路径或绝对路径（Vite 产物常用 /assets/xxx.css）
    const candidates = [
      path.resolve(dir, href),
      // 去掉开头的 / 再拼到 htmlFile 所在目录
      path.resolve(dir, href.replace(/^\//, '')),
    ];

    for (const candidate of candidates) {
      if (allCssFiles.includes(candidate) && !linked.includes(candidate)) {
        linked.push(candidate);
        break;
      }
    }
  });

  return linked.length > 0 ? linked : allCssFiles;
}

/**
 * 判断解析出的树是否是 SPA 空壳（如 <div id="app"></div>）。
 * 条件：body 子节点 ≤ 1，且无文本、无样式、无孙节点。
 */
function isSpaSell(tree) {
  if (!tree) return false;
  const children = tree.children || [];
  if (children.length > 1) return false;
  if (tree.text) return false;
  if (Object.keys(tree.css || {}).length > 0) return false;
  if (children.length === 0) return true;

  const only = children[0];
  return (
    !only.text &&
    Object.keys(only.css || {}).length === 0 &&
    (only.children || []).length === 0
  );
}

/**
 * 将单个 HTML 文件解析为中间树。
 * @param {string} htmlFile
 * @param {object} styleMap - parseCssFiles() 的输出
 */
function parseHtml(htmlFile, styleMap) {
  let content;
  try {
    content = fs.readFileSync(htmlFile, 'utf8');
  } catch {
    return null;
  }

  const $ = cheerio.load(content);
  const body = $('body')[0];
  if (!body) return null;

  return buildTree(body, $, styleMap);
}

module.exports = { parseCssFiles, resolveCssForHtml, isSpaSell, parseHtml };
