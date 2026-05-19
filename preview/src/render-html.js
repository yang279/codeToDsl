'use strict';

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

export async function renderHtml(relPath, fileMap, showInFrame) {
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
