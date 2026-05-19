require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { getClient } = require('./openaiManager');
const { toDsl } = require('./mockDsl');
const { crawl } = require('../codeToDsl/src/crawler');
const { parseCssFiles, resolveCssForHtml, isSpaSell, parseHtml } = require('../codeToDsl/src/html-parser');
const { parseVueFile } = require('../codeToDsl/src/vue-parser');
const { parseReactFile, resolveComponents } = require('../codeToDsl/src/react-parser');
const { detectMode } = require('../codeToDsl/src/pipeline');

const DSL_SPEC = fs.readFileSync(
  path.join(__dirname, '../codeToDsl/设计dsl.md'),
  'utf8'
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DSL 转换接口：接收中间树，返回设计 DSL JSON
const DSL_SYSTEM_PROMPT = `你是设计稿解析引擎，将 HTML/CSS 中间结构转换为设计 DSL JSON。

下面是完整的 DSL 规范，你必须严格按照这份规范输出：

${DSL_SPEC}

## 转换规则
- type 根据 HTML tag 推断：div/section/header/footer/main/nav → view；p/span/h1-h6/label/a → text；img → image；input/textarea → input；button → button
- style 字段只保留规范中定义的属性，值均转为数字（px 单位去掉单位），padding 转为 [上,右,下,左] 数组
- 若节点有 display:flex，输出 layout 字段，从 flex 相关 CSS 属性推断各子字段
- 每个节点生成唯一 id，格式 node-001、node-002…，按 DOM 顺序递增
- name 用中文语义命名
- children 递归处理，叶子节点的 text/src 等放入 props
- 严格返回单个 JSON 对象，不加任何解释文字`;

app.post('/v1/code-to-dsl', async (req, res) => {
  const { tree } = req.body;
  if (!tree) {
    return res.status(400).json({ error: 'tree 字段必填' });
  }

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: DSL_SYSTEM_PROMPT },
        { role: 'user', content: typeof tree === 'string' ? tree : JSON.stringify(tree) },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    // 兼容 LLM 可能包裹 ```json ... ``` 的情况
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    const dsl = JSON.parse(jsonStr);
    res.json({ dsl });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'LLM 返回格式非法 JSON', detail: err.message });
    }
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 原始 HTML/CSS 直接送 LLM → 返回 DSL（测试用，跳过 parser）
const RAW_DSL_SYSTEM_PROMPT = `你是设计稿解析引擎，将原始 HTML/CSS 代码转换为设计 DSL JSON。

下面是完整的 DSL 规范，你必须严格按照这份规范输出：

${DSL_SPEC}

## 转换规则
- type 根据 HTML tag 推断：div/section/header/footer/main/nav → view；p/span/h1-h6/label/a → text；img → image；input/textarea → input；button → button
- style 字段只保留规范中定义的属性，值均转为数字（px 单位去掉单位），padding 转为 [上,右,下,左] 数组
- 若节点有 display:flex 或 CSS 中对应选择器含 display:flex，输出 layout 字段
- 每个节点生成唯一 id，格式 node-001、node-002…，按 DOM 顺序递增
- name 用中文语义命名
- children 递归处理，叶子节点的 text/src 等放入 props
- 严格返回单个 JSON 对象，不加任何解释文字`;

app.post('/v1/raw-to-dsl', async (req, res) => {
  const { html, css } = req.body;
  if (!html || typeof html !== 'string' || !html.trim()) {
    return res.status(400).json({ error: 'html 字段必填且为字符串' });
  }

  const userContent = css
    ? `以下是 HTML 源码：\n\`\`\`html\n${html}\n\`\`\`\n\n以下是 CSS 源码：\n\`\`\`css\n${css}\n\`\`\``
    : `以下是 HTML 源码：\n\`\`\`html\n${html}\n\`\`\``;

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: RAW_DSL_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    const raw = completion.choices[0].message.content.trim();
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    const dsl = JSON.parse(jsonStr);
    res.json({ dsl });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'LLM 返回格式非法 JSON', detail: err.message });
    }
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// 文件夹上传 → 解析 → 返回 DSL（无需真实 LLM）
app.post('/v1/upload-folder', async (req, res) => {
  const { files } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'files 字段必填，格式：[{ path, content }]' });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-dsl-'));
  try {
    for (const { path: relPath, content } of files) {
      if (!relPath || typeof content !== 'string') continue;
      const abs = path.join(tmpDir, relPath);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, 'utf8');
    }

    const crawled = crawl(tmpDir);
    const mode = detectMode(crawled);
    if (!mode) {
      return res.status(400).json({ error: '未找到 .html / .vue / .jsx / .tsx 文件' });
    }

    let tree = null;

    if (mode === 'vue') {
      tree = parseVueFile(crawled.vue[0]);
    } else if (mode === 'react') {
      const registry = {};
      for (const file of crawled.react) {
        const name = path.basename(file, path.extname(file)).toLowerCase();
        const t = parseReactFile(file, crawled.css);
        if (t) registry[name] = t;
      }
      const first = crawled.react[0];
      const firstName = path.basename(first, path.extname(first)).toLowerCase();
      const raw = registry[firstName];
      tree = raw ? resolveComponents(JSON.parse(JSON.stringify(raw)), registry) : null;
    } else {
      const htmlFile = crawled.html[0];
      const linkedCss = resolveCssForHtml(htmlFile, crawled.css);
      const styleMap = parseCssFiles(linkedCss);
      tree = parseHtml(htmlFile, styleMap);
    }

    if (!tree) {
      return res.status(422).json({ error: '文件解析失败，未提取到有效内容' });
    }
    if (isSpaSell(tree)) {
      return res.status(422).json({ error: '检测到 SPA 空壳，请上传源码目录而非打包产物' });
    }

    const dsl = toDsl(tree);
    dsl.meta = {
      sourceFiles: files.map(f => f.path),
      mode,
      parserVersion: '1.0.0',
      note: '模拟 LLM 输出（mock）',
    };

    res.json({ dsl });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Base URL: ${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}`);
});
