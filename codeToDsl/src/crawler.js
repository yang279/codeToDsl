const fs = require('fs');
const path = require('path');

/**
 * 递归遍历文件夹，收集 .html / .css / .vue / .jsx / .tsx 文件路径。
 * @param {string} dir 目标文件夹绝对路径
 * @returns {{ html: string[], css: string[], vue: string[], react: string[] }}
 */
function crawl(dir) {
  const result = { html: [], css: [], vue: [], react: [] };

  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.html')) {
        result.html.push(full);
      } else if (entry.name.endsWith('.css')) {
        result.css.push(full);
      } else if (entry.name.endsWith('.vue')) {
        result.vue.push(full);
      } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
        result.react.push(full);
      }
    }
  }

  walk(path.resolve(dir));
  return result;
}

module.exports = { crawl };
