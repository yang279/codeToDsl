import { renderHtml } from './render-html.js';
import { renderVue }  from './render-vue.js';

const SERVER = '';

const uploadBtn   = document.getElementById('uploadBtn');
const folderInput = document.getElementById('folderInput');
const fileSelect  = document.getElementById('fileSelect');
const frame       = document.getElementById('frame');
const empty       = document.getElementById('empty');

const fileMap = new Map();

async function sendToServer() {
  const htmlEntries = [...fileMap.entries()].filter(([p]) => p.endsWith('.html'));
  const cssEntries  = [...fileMap.entries()].filter(([p]) => p.endsWith('.css'));
  if (htmlEntries.length === 0) return;

  const selected = fileSelect.value;
  const [, htmlEntry] = (selected?.endsWith('.html') && fileMap.get(selected))
    ? [selected, fileMap.get(selected)]
    : htmlEntries[0];

  const html = await htmlEntry.file.text();
  const cssTexts = await Promise.all(cssEntries.map(([, { file }]) => file.text()));
  const css = cssTexts.join('\n') || undefined;

  try {
    const resp = await fetch(`${SERVER}/v1/code-to-dsl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, css }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    console.log('[DSL]', data.dsl);
  } catch (err) {
    console.error('[DSL error]', err.message);
  }
}
let currentBlobUrl = null;

// ── iframe ────────────────────────────────────────────────────────────────────

function showInFrame(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  currentBlobUrl = url;
  empty.style.display = 'none';
  frame.style.display = 'block';
  frame.src = url;
}

// ── 渲染 ──────────────────────────────────────────────────────────────────────

function renderFile(relPath) {
  if (relPath.endsWith('.vue')) renderVue(relPath, fileMap, showInFrame);
  else renderHtml(relPath, fileMap, showInFrame);
}

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

  const preferred = previewable.find(p => p === 'index.html' || p.endsWith('/index.html'));
  fileSelect.value = preferred ?? previewable[0];
  renderFile(fileSelect.value);
}

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

fileSelect.addEventListener('change', () => renderFile(fileSelect.value));
