require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { getClient } = require('./openaiManager');

const DSL_SPEC = fs.readFileSync(
  path.join(__dirname, '../codeToDsl/dsl-spec.md'),
  'utf8'
);

const DSL_SYSTEM_PROMPT = `你是设计稿解析引擎，将原始 HTML/CSS 代码转换为设计 DSL JSON。

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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/v1/chat/completions', async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question 字段必填且为字符串' });
  }
  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [{ role: 'user', content: question.trim() }],
    });
    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/v1/code-to-dsl', async (req, res) => {
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
        { role: 'system', content: DSL_SYSTEM_PROMPT },
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
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Base URL: ${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}`);
});
