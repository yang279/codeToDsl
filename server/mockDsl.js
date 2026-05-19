let counter = 0;

function nextId() {
  return `node-${String(++counter).padStart(3, '0')}`;
}

const TAG_TYPE = {
  div: 'view', section: 'view', header: 'view', footer: 'view',
  main: 'view', nav: 'view', aside: 'view', article: 'view',
  ul: 'view', ol: 'view', li: 'view', form: 'view',
  table: 'view', thead: 'view', tbody: 'view', tr: 'view', td: 'view', th: 'view',
  p: 'text', span: 'text', h1: 'text', h2: 'text', h3: 'text',
  h4: 'text', h5: 'text', h6: 'text', label: 'text', a: 'text',
  strong: 'text', em: 'text', small: 'text', b: 'text', i: 'text',
  img: 'image',
  input: 'input', textarea: 'input', select: 'input',
  button: 'button',
};

const TAG_NAME = {
  div: '容器', header: '顶部', footer: '底部', nav: '导航',
  main: '主区域', section: '区块', aside: '侧栏', article: '内容',
  ul: '列表', ol: '有序列表', li: '列表项', form: '表单',
  table: '表格', tr: '行', td: '单元格',
  p: '段落', span: '文本', h1: '主标题', h2: '二标题', h3: '三标题',
  h4: '四标题', h5: '五标题', h6: '六标题', label: '标签', a: '链接',
  strong: '粗体', em: '斜体', small: '小字', img: '图片',
  input: '输入框', textarea: '文本域', select: '下拉框', button: '按钮',
};

function px(v) {
  if (v === undefined || v === null) return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function parsePad(v) {
  if (!v) return undefined;
  const parts = v.trim().split(/\s+/).map(x => px(x) ?? 0);
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return parts.slice(0, 4);
}

function buildStyle(c) {
  if (!c) return {};
  const s = {};
  const w = px(c['width']); if (w !== undefined) s.width = w;
  const h = px(c['height']); if (h !== undefined) s.height = h;
  if (c['color']) s.color = c['color'];
  const bg = c['background-color'] || c['background'];
  if (bg && !bg.includes('url') && !bg.includes('gradient')) s.backgroundColor = bg;
  const fs = px(c['font-size']); if (fs !== undefined) s.fontSize = fs;
  if (c['font-weight']) s.fontWeight = String(c['font-weight']);
  const br = px(c['border-radius']); if (br !== undefined) s.borderRadius = br;
  const op = px(c['opacity']); if (op !== undefined) s.opacity = op;

  if (c['padding']) {
    const p = parsePad(c['padding']); if (p) s.padding = p;
  } else {
    const pt = px(c['padding-top']) ?? 0;
    const pr = px(c['padding-right']) ?? 0;
    const pb = px(c['padding-bottom']) ?? 0;
    const pl = px(c['padding-left']) ?? 0;
    if (pt || pr || pb || pl) s.padding = [pt, pr, pb, pl];
  }
  return s;
}

function buildLayout(c) {
  if (!c || c['display'] !== 'flex') return undefined;
  const dir = c['flex-direction'];
  const layout = {
    direction: (dir === 'column' || dir === 'column-reverse') ? 'column' : 'row',
    alignItems: c['align-items'] || 'flex-start',
    justifyContent: c['justify-content'] || 'flex-start',
    wrap: c['flex-wrap'] === 'wrap' || c['flex-wrap'] === 'wrap-reverse',
  };
  const g = px(c['gap']);
  if (g !== undefined) layout.gap = g;
  return layout;
}

function nodeName(tag, cls, text) {
  if (text && text.length <= 10) return text;
  if (cls) {
    const first = cls.split(/\s+/)[0].replace(/[-_]/g, ' ').trim();
    if (first.length >= 2 && first.length <= 16) return first;
  }
  return TAG_NAME[tag] || '元素';
}

function convert(node) {
  if (!node) return null;
  const { tag, cls = '', text, css: c, children = [] } = node;

  const type = TAG_TYPE[tag] || 'view';
  const style = buildStyle(c);
  const layout = buildLayout(c);

  const out = { id: nextId(), type, name: nodeName(tag, cls, text) };
  if (Object.keys(style).length) out.style = style;
  if (layout) out.layout = layout;

  const props = {};
  if (text) {
    if (type === 'button' || type === 'text') props.content = text;
    else if (type === 'input') props.placeholder = text;
  }
  if (Object.keys(props).length) out.props = props;

  out.children = children.map(convert).filter(Boolean);
  return out;
}

function toDsl(tree) {
  counter = 0;
  return convert(tree);
}

module.exports = { toDsl };
