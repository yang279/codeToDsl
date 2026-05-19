const uploadBtn   = document.getElementById('uploadBtn');
const folderInput = document.getElementById('folderInput');
const fileSelect  = document.getElementById('fileSelect');
const fileLabel   = document.getElementById('fileLabel');
const frame       = document.getElementById('frame');
const empty       = document.getElementById('empty');

// DSL 面板元素
const dslBadge   = document.getElementById('dsl-badge');
const dslEmpty   = document.getElementById('dsl-empty');
const dslLoading = document.getElementById('dsl-loading');
const dslError   = document.getElementById('dsl-error');
const dslOutput  = document.getElementById('dsl-output');

const SERVER = 'http://localhost:3000';

// relPath → { file, blobUrl }
const fileMap = new Map();
let currentBlobUrl = null;

// ── 上传 ──────────────────────────────────────────────────────────────────────

uploadBtn.addEventListener('click', () => folderInput.click());

folderInput.addEventListener('change', () => {
  for (const { blobUrl } of fileMap.values()) URL.revokeObjectURL(blobUrl);
  fileMap.clear();

  for (const file of folderInput.files) {
    const parts = file.webkitRelativePath.split('/');
    const relPath = parts.slice(1).join('/');
    fileMap.set(relPath, { file, blobUrl: URL.createObjectURL(file) });
  }

  populateSelect();
  sendToServer();
});

// ── 文件选择下拉 ───────────────────────────────────────────────────────────────

function populateSelect() {
  const previewable = [...fileMap.keys()]
    .filter(p => p.endsWith('.html') || p.endsWith('.vue'))
    .sort();

  fileSelect.innerHTML = '';

  if (previewable.length === 0) {
    fileSelect.removeAttribute('hidden');
    const opt = document.createElement('option');
    opt.textContent = '未找到可预览文件';
    opt.disabled = true;
    fileSelect.appendChild(opt);
    return;
  }

  for (const relPath of previewable) {
    const opt = document.createElement('option');
    opt.value = relPath;
    opt.textContent = relPath;
    fileSelect.appendChild(opt);
  }

  fileSelect.removeAttribute('hidden');

  // 优先选 index.html
  const preferred = previewable.find(
    p => p === 'index.html' || p.endsWith('/index.html')
  );
  fileSelect.value = preferred ?? previewable[0];
  renderFile(fileSelect.value);
}

fileSelect.addEventListener('change', () => renderFile(fileSelect.value));

// ── 渲染分发 ──────────────────────────────────────────────────────────────────

function renderFile(relPath) {
  if (relPath.endsWith('.vue')) renderVue(relPath);
  else renderHtml(relPath);
}

// ── HTML 渲染 ─────────────────────────────────────────────────────────────────

function getDir(relPath) {
  const idx = relPath.lastIndexOf('/');
  return idx >= 0 ? relPath.slice(0, idx + 1) : '';
}

function resolvePath(dir, ref) {
  const [p] = ref.split(/[?#]/);
  const parts = (dir + p).split('/');
  const out = [];
  for (const seg of parts) {
    if (seg === '..') out.pop();
    else if (seg && seg !== '.') out.push(seg);
  }
  return out.join('/');
}

function isAbsolute(ref) {
  return /^(https?:)?\/\//.test(ref) || ref.startsWith('data:') || ref.startsWith('blob:');
}

async function renderHtml(relPath) {
  const entry = fileMap.get(relPath);
  if (!entry) return;

  const text = await entry.file.text();
  const dir = getDir(relPath);

  const rewritten = text.replace(
    /\b(href|src)="([^"#][^"]*)"/g,
    (_, attr, ref) => {
      if (isAbsolute(ref)) return `${attr}="${ref}"`;
      const resolved = resolvePath(dir, ref);
      const mapped = fileMap.get(resolved);
      return mapped ? `${attr}="${mapped.blobUrl}"` : `${attr}="${ref}"`;
    }
  );

  showInFrame(rewritten);
}

// ── Vue SFC 渲染 ──────────────────────────────────────────────────────────────

async function renderVue(relPath) {
  const entry = fileMap.get(relPath);
  if (!entry) return;

  const content = await entry.file.text();

  // 提取 <template> 内容
  const tplMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  const template = tplMatch ? tplMatch[1].trim() : '<div>（无 template 内容）</div>';

  // 提取所有 <style> 内容（去掉 scoped hash 无法生效，直接用原始选择器）
  const styles = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = styleRe.exec(content)) !== null) styles.push(m[1]);

  const normalized = normalizeVueTemplate(template);
  showInFrame(buildStaticHtml(normalized, styles.join('\n')));
}

/**
 * 将 Vue template 中无法在静态 HTML 中运行的语法剥离，保留结构和类名。
 */
function normalizeVueTemplate(tpl) {
  return tpl
    // {{ 表达式 }} → 移除
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    // :class="expr" → 移除（保留 class="..." 静态类）
    .replace(/\s*:class="[^"]*"/g, '')
    // v-bind 单向绑定属性 :xxx="..." → 移除
    .replace(/\s*:[a-zA-Z-]+=(?:"[^"]*"|'[^']*')/g, '')
    // 事件 @xxx="..." → 移除
    .replace(/\s*@[a-zA-Z-]+(?:\.[a-zA-Z]+)*=(?:"[^"]*"|'[^']*')/g, '')
    // v-if / v-else-if / v-else / v-show / v-for / v-model → 移除属性
    .replace(/\s*v-(?:if|else-if|else|show|for|model)(?:="[^"]*")?/g, '')
    // v-bind="obj" 整体移除
    .replace(/\s*v-bind="[^"]*"/g, '')
    // router-link → a
    .replace(/<router-link(\s[^>]*)?>/g, '<a$1>')
    .replace(/<\/router-link>/g, '</a>')
    // PascalCase 自闭合组件 → 占位 div
    .replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?\s*\/>/g, (_, name) =>
      `<div class="__vue-component__ __component--${name.toLowerCase()}__"></div>`
    )
    // PascalCase 开标签 → div
    .replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (_, name) =>
      `<div class="__vue-component__ __component--${name.toLowerCase()}__">`
    )
    // PascalCase 闭标签 → div
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

// ── 公共：写入 iframe ─────────────────────────────────────────────────────────

function showInFrame(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  currentBlobUrl = url;

  empty.style.display = 'none';
  frame.style.display = 'block';
  frame.src = url;
}

// ── DSL 面板 ──────────────────────────────────────────────────────────────────

function dslSetState(state) {
  dslEmpty.hidden   = state !== 'empty';
  dslLoading.hidden = state !== 'loading';
  dslError.hidden   = state !== 'error';
  dslOutput.hidden  = state !== 'done';
}

function highlightJson(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'jn'; // number
        if (/^"/.test(match)) cls = /:$/.test(match) ? 'jk' : 'js'; // key / string
        else if (/true|false/.test(match)) cls = 'jb';
        else if (/null/.test(match)) cls = 'jnull';
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

async function sendToServer() {
  const ALLOWED = /\.(html|css|vue|jsx|tsx)$/i;
  const entries = [];

  for (const [relPath, { file }] of fileMap.entries()) {
    if (!ALLOWED.test(relPath)) continue;
    const content = await file.text();
    entries.push({ path: relPath, content });
  }

  if (entries.length === 0) return;

  dslSetState('loading');
  dslBadge.textContent = '';
  dslBadge.className = '';

  try {
    const resp = await fetch(`${SERVER}/v1/upload-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: entries }),
    });

    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || `HTTP ${resp.status}`);

    const json = JSON.stringify(data.dsl, null, 2);
    dslOutput.innerHTML = highlightJson(json);
    dslSetState('done');
    dslBadge.textContent = `${data.dsl.meta?.mode ?? ''} · mock`;
    dslBadge.className = 'badge-ok';
    fileLabel.textContent = entries.map(f => f.path).join(', ').slice(0, 60);
  } catch (err) {
    dslError.textContent = `错误：${err.message}`;
    dslSetState('error');
    dslBadge.textContent = 'error';
    dslBadge.className = 'badge-err';
  }
}
