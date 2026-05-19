'use strict';

function normalizeVueTemplate(tpl) {
  return tpl
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/\s*:class="[^"]*"/g, '')
    .replace(/\s*:[a-zA-Z-]+=(?:"[^"]*"|'[^']*')/g, '')
    .replace(/\s*@[a-zA-Z-]+(?:\.[a-zA-Z]+)*=(?:"[^"]*"|'[^']*')/g, '')
    .replace(/\s*v-(?:if|else-if|else|show|for|model)(?:="[^"]*")?/g, '')
    .replace(/\s*v-bind="[^"]*"/g, '')
    .replace(/<router-link(\s[^>]*)?>/g, '<a$1>')
    .replace(/<\/router-link>/g, '</a>')
    .replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?\s*\/>/g, (_, name) =>
      `<div class="__vue-component__ __component--${name.toLowerCase()}__"></div>`
    )
    .replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (_, name) =>
      `<div class="__vue-component__ __component--${name.toLowerCase()}__">`
    )
    .replace(/<\/[A-Z][a-zA-Z0-9]*>/g, '</div>');
}

function buildStaticHtml(body, styles) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .__vue-component__ {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      min-height: 24px;
      background: #f3f4f6;
      border: 1px dashed #d1d5db;
      border-radius: 4px;
      font-size: 11px;
      color: #9ca3af;
    }
    ${styles}
  </style>
</head>
<body>${body}</body>
</html>`;
}

export async function renderVue(relPath, fileMap, showInFrame) {
  const entry = fileMap.get(relPath);
  if (!entry) return;

  const content = await entry.file.text();

  const tplMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  const template = tplMatch ? tplMatch[1].trim() : '<div>（无 template 内容）</div>';

  const styles = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = styleRe.exec(content)) !== null) styles.push(m[1]);

  showInFrame(buildStaticHtml(normalizeVueTemplate(template), styles.join('\n')));
}
