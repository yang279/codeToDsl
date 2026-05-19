# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目目标

将 HTML/CSS 代码（及后续其他构建产物）通过 LLM Agent 自动转换为标准化设计 DSL（JSON 格式）。DSL 规范见 [codeToDsl/设计dsl.md](codeToDsl/设计dsl.md)。

## Monorepo 结构

npm workspaces 管理，依赖统一安装在根目录：

- `server/` — Express HTTP 服务，对外暴露 LLM 调用接口
- `codeToDsl/` — DSL 规范文档与转换逻辑（待开发）

新增 workspace 包时，在根 `package.json` 的 `workspaces` 数组中添加目录名，然后在根目录执行 `npm install`。

## 常用命令

```bash
# 所有命令从根目录执行
npm install              # 安装所有 workspace 依赖

npm run server           # 生产启动 server
npm run server:dev       # 开发模式启动（文件变更自动重启）
```

## server 架构

- `server/index.js` — Express 入口，路由定义
- `server/openaiManager.js` — OpenAI client 单例，懒加载（首次请求时初始化）

**关键设计决策：**
- client 在 `openaiManager` 中懒初始化，启动时不校验 key，避免空配置报错
- `resetClient()` 用于运行时切换配置后重置单例
- model 固定读取 `OPENAI_MODEL` 环境变量，接口不对外暴露 model 参数
- 用户只能传 `question` 字符串，messages 构造由服务端控制

## 环境变量

复制 `server/.env.example` 为 `server/.env` 并填写：

| 变量 | 说明 |
| :--- | :--- |
| `OPENAI_API_KEY` | API Key |
| `OPENAI_BASE_URL` | 第三方兼容服务地址，默认 `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 固定使用的模型名，如 `gpt-4o` |
| `PORT` | 服务端口，默认 `3000` |

## API

```
GET  /health                  健康检查
POST /v1/chat/completions     { "question": "..." } → { "answer": "..." }
```
