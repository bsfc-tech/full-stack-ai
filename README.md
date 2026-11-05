# Full-Stack AI 落地实践指南 (VitePress AI 内容自动生成系统)

基于 **VitePress 规范** 构建的简体中文全栈 AI 技术内容自动生成与知识库归档系统。面向开发者与工程技术团队，聚焦 AI 落地实战（LLM Agents 编排、RAG 知识检索增强、前沿推理框架、生产级避坑指南等），实现“**无人值守、自驱动生长**”的自动化文档中台。

---

## 🌟 核心特性

- ⚡ **纯净沉浸式 VitePress 文档体验**：Web 前端专注于专业、极简的技术阅读体验，提供动态顶栏分类导航、全局全文检索、左侧分类侧边栏、代码高亮复制、自适应前后篇翻页与右侧目录（TOC）平滑滚动。
- ⏰ **全天候后台自动定时调度**：默认开启小时级自动化巡检（每 60 分钟自动执行一次），后台静默完成全网素材检索、深度文章撰写、架构插图绘制与文件持久化落地。
- 🧠 **内容驱动的智能分类（Dynamic Taxonomy）**：打破固定分类硬编码限制，AI 根据搜集素材特征动态推导所属领域分类，自动生成规范的英文目录 Slug（如 `docs/deep-research/`、`docs/code-generation/`）与专业中文分类展示名。
- 📊 **高保真矢量架构图解（Responsive SVG）**：根据文章架构拓扑实时绘制响应式 SVG 流程图，无缝内嵌于正文中，轻量无损，原生契合深浅色主题。
- 📁 **严谨符合 VitePress 构建规范**：文章持久化至 `docs/<category>/<slug>.md` 并携带标准 YAML Frontmatter，系统自动维护 `docs/.vitepress/config.mts` 的 `nav` 与 `sidebar` 映射，可直接使用 `npx vitepress build` 导出静态站点。

---

## 🛠️ 技术架构

```
┌────────────────────────────────────────────────────────────────────────┐
│                        前端 Web (纯净 VitePress 站点)                    │
├────────────────────────────────────────────────────────────────────────┤
│  [Top Header] 品牌 Logo · 动态分类快速直达 · 全局搜索 · 深浅色切换         │
├───────────────────┬────────────────────────────────────┬───────────────┤
│ [动态分类侧边栏]   │      [VitePress 核心内容阅读器]     │ [右侧 TOC]    │
│ - 搜索文档库       │  - 纯净面包屑导航                   │ - H2/H3 锚点  │
│ - 智能分类 A       │  - 标题与无胶囊元数据 (作者·时间)   │ - 平滑滚动    │
│ - 智能分类 B       │  - 响应式 SVG 架构流程图            │               │
│ - 智能分类 C (生长)│  - 代码块语法高亮与一键复制         │               │
│                   │  - VitePress 提示容器 (tip/warning)│               │
│                   │  - 对称响应式前后篇自适应翻页导航    │               │
└───────────────────┴─────────────────┬──────────────────┴───────────────┘
                                      │ HTTP REST API
┌─────────────────────────────────────▼──────────────────────────────────┐
│                           Node.js Express 服务端                       │
├────────────────────────────────────────────────────────────────────────┤
│  [自动化引擎 Scheduler] (默认开启，每 60 分钟自动执行)                  │
│   ├── 服务启动时自动绑定 1 小时循环定时器                               │
│   └── 提供即时生成通道与异步日志记录                                    │
│                                                                        │
│  [AI 动态生成流水线 AIService]                                          │
│   ├── 1. 全网前沿热点素材探查 (Google Search + Gemini 3.8 Flash)        │
│   ├── 2. 内容驱动分类智能推导 (动态输出 categorySlug 与 categoryName)   │
│   ├── 3. 生产级深度长文与可执行代码编写 (痛点/架构/代码/避坑指南)        │
│   └── 4. 主题配色响应式 SVG 矢量架构流程图生成                         │
│                                                                        │
│  [VitePress 磁盘持久化引擎 ArticlesStore]                               │
│   ├── 动态创建对应目录: docs/<dynamic_category_slug>/                 │
│   ├── 写入标准 Markdown 文件 (YAML Frontmatter + SVG + 正文)           │
│   └── 动态维护 docs/.vitepress/config.mts (自动刷新 nav 与多级 sidebar) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 目录结构与 VitePress 规范

```
.
├── docs/                             # VitePress 核心文档根目录
│   ├── .vitepress/
│   │   └── config.mts                # VitePress 站点配置 (AI 自动动态维护 nav 与 sidebar)
│   ├── index.md                      # 文档站点主页 (Hero 与 Features 特性配置)
│   ├── agents/                       # LLM Agents 智能体实践目录
│   ├── rag/                          # RAG 知识检索增强实践目录
│   ├── frameworks/                   # AI 框架与推理优化实践目录
│   ├── practice/                     # 工程落地与避坑指南实践目录
│   ├── deep-research/                # AI 动态推导生成的全新领域子目录
│   └── ...                           # 随内容自动化持续生长扩展的分类目录
├── server/                           # 后端全栈核心服务
│   ├── aiService.ts                  # Gemini 3.8 Flash 内容生成、动态分类推导与 SVG 图绘制
│   ├── articlesStore.ts              # 文件系统扫描、持久化落地与 config.mts 同步更新
│   └── scheduler.ts                  # 小时级自动化定时任务与执行日志引擎 (Default ON)
├── src/                              # 前端 React 19 单页阅读器
│   ├── components/
│   │   ├── Header.tsx                # 纯净 VitePress 顶栏 (分类导航、搜索、主题切换)
│   │   └── DocsReaderView.tsx        # 沉浸式阅读器 (侧边栏、Markdown、前后篇换行翻页、TOC)
│   ├── types/                        # 核心 TypeScript 类型定义
│   ├── utils/                        # Markdown 解析器与 API 客户端
│   ├── App.tsx                       # 应用根组件
│   └── main.tsx                      # 客户端入口
├── server.ts                         # Express 后端服务与 Vite 开发中间件挂载
├── package.json
└── README.md
```

---

## 🚀 快速开始

### 1. 环境准备
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`
- **Gemini API Key**: 获取 Google Gemini API 密钥并配置于环境变量中。

### 2. 环境变量配置
在项目根目录下创建 `.env` 文件（或参考 `.env.example`）：
```env
# Gemini API Key (用于驱动全网素材分析、深度文章撰写与智能分类)
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. 安装依赖
```bash
npm install
```

### 4. 启动开发环境
```bash
npm run dev
```
启动后服务将在 `http://localhost:3000` 运行：
- **Web 前端**：直接访问 `http://localhost:3000` 进入纯净的 VitePress 在线文档阅读站点。
- **后台自动化引擎**：服务启动即刻激活 1 小时周期定时器，在后台静默进行热点抓取与新文章生成。

### 5. 构建与部署
- **全栈应用构建**：
  ```bash
  npm run build
  npm start
  ```
- **纯静态 VitePress 站点独立构建**（支持发布到 GitHub Pages / Vercel / Cloudflare Pages）：
  ```bash
  npx vitepress build docs
  ```
  生成的静态 HTML 文件将输出到 `docs/.vitepress/dist` 目录下。

---

## 📡 服务端 API 接口速查

| 接口地址 | 请求方式 | 说明 |
| :--- | :--- | :--- |
| `/api/categories` | `GET` | 获取当前所有分类列表（包含动态自动生成的分类及文章统计） |
| `/api/articles` | `GET` | 获取当前所有已归档文章列表及元数据 |
| `/api/articles/:id` | `GET` | 获取指定文章的详情与完整 Markdown 原文 |
| `/api/articles/:id` | `DELETE` | 从磁盘删除指定文章并自动重新同步 VitePress 侧边栏 |
| `/api/scheduler/status` | `GET` | 获取后台自动化定时器的运行状态、下次执行时间与执行日志 |
| `/api/scheduler/toggle` | `POST` | 手动开启/暂停自动化定时任务 (`{ "enabled": boolean }`) |
| `/api/scheduler/trigger` | `POST` | 立即手动触发一次 AI 内容检索与落地生成流水线 |
| `/api/docs/tree` | `GET` | 获取 `docs/` 下的物理磁盘文件目录树结构 |
| `/api/docs/file?path=...` | `GET` | 读取指定 Markdown 或配置文件的原始内容 |

---

## 📝 Markdown 落地文章标准规范

系统自动生成的每篇技术文章均严格符合如下结构契约：

```yaml
---
title: "Deep Research 深度自主科研智能体的多步推理与回溯搜索架构"
description: "剖析类似 OpenAI Deep Research 的多阶段规划、文献证据树剪枝与长文本综合报告生成架构。"
date: 2026-11-05
category: "deep-research"
categoryName: "Deep Research 深度研究"
tags: ["Deep Research", "自主推理", "Tree-of-Thoughts", "网页证据链"]
author: "AI Engineering Lab"
readingTimeMinutes: 8
---

# Deep Research 深度自主科研智能体的多步推理与回溯搜索架构

[引言背景与痛点说明...]

## 一、业务痛点与技术选型背景
...

## 二、核心系统架构与交互拓扑
<!-- 自动内联嵌入由 AI 绘制的响应式 SVG 矢量架构流程图 -->
<svg viewBox="0 0 800 220" ...>
  ...
</svg>

## 三、生产级核心实现与代码示例
```typescript
// 具备完整错误边界与类型推导的生产级代码
export class ResearchAgent {
  ...
}
```

## 四、生产落地考量与避坑指南
::: tip 生产建议
大模型长周期推理务必在网关层配置熔断器与状态检查点。
:::

## 五、总结与演进方向
...
```

---

## 📄 License

本项目采用 [Apache-2.0](LICENSE) 开源协议。
VitePress 遵循 MIT 协议。
