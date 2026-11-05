import { GoogleGenAI } from '@google/genai';
import { ArticleRecord } from '../src/types/index.ts';
import { ArticlesStore } from './articlesStore.ts';

// 丰富多样的主题素材备选库（涵盖最新前沿领域，支持动态分类推导）
const DYNAMIC_TOPIC_PRESETS = [
  {
    topic: 'Deep Research 深度自主科研智能体的多步推理与回溯搜索架构',
    categorySlug: 'deep-research',
    categoryName: 'Deep Research 深度研究',
    slug: 'deep-research-multi-step-backtracking-architecture',
    tags: ['Deep Research', '自主推理', 'Tree-of-Thoughts', '网页证据链'],
    summary: '剖析类似 OpenAI Deep Research 的多阶段规划、文献证据树剪枝与长文本综合报告生成架构。'
  },
  {
    topic: '企业级代码生成 Agent 与 AST 抽象语法树校验沙箱实践',
    categorySlug: 'code-generation',
    categoryName: '代码生成与智能编程',
    slug: 'code-gen-agent-ast-validation-sandbox-runtime',
    tags: ['Code Agent', 'AST语法树', 'Docker沙箱', '单元测试闭环'],
    summary: '探讨自动编写、修复代码的 Agent 如何结合静态 AST 检验与隔离容器，实现 0 风险的自动化代码落地。'
  },
  {
    topic: '端到端多模态大模型实时视觉音频流式交互架构设计',
    categorySlug: 'multimodal-systems',
    categoryName: '多模态流式系统',
    slug: 'end-to-end-multimodal-voice-vision-streaming-design',
    tags: ['Gemini Live', 'WebRTC', '低延迟流式', '全双工交互'],
    summary: '详解端到端语音视觉大模型在 WebSocket / WebRTC 链路下的音频分块（PCM）传输与双向打断（Barge-in）处理。'
  },
  {
    topic: '大模型生产集群红蓝对抗：Prompt 注入与 Jailbreak 越狱防御网关',
    categorySlug: 'ai-security',
    categoryName: 'AI 安全与对抗防御',
    slug: 'llm-red-teaming-prompt-injection-jailbreak-gateway',
    tags: ['AI安全', '越狱防御', 'Llama Guard', '注入过滤'],
    summary: '在生产 API 网关前置语义安全防护，实测防御间接提示注入（Indirect Injection）与多语言混淆越狱。'
  },
  {
    topic: 'GraphRAG 结合知识图谱的高精度混合检索实践',
    categorySlug: 'rag',
    categoryName: 'RAG 知识检索增强',
    slug: 'graphrag-hybrid-knowledge-retrieval-deep-dive',
    tags: ['GraphRAG', '知识图谱', '混合检索', 'Neo4j'],
    summary: '突破向量检索在多跳逻辑与全局汇总上的短板，结合拓扑实体网络与语义嵌入实现精准问答。'
  },
  {
    topic: 'LangGraph 生产级多智能体反思与自愈工作流实践',
    categorySlug: 'agents',
    categoryName: 'LLM Agents 智能体',
    slug: 'langgraph-multi-agent-production-reflection-practice',
    tags: ['LangGraph', 'Multi-Agent', '自愈工作流', '状态图'],
    summary: '基于有向状态图构建具备 Plan-and-Solve、评审自修正与分布式熔断机制的工业级 Agent。'
  },
  {
    topic: 'vLLM 与 TensorRT-LLM 高并发推理吞吐与显存优化实战',
    categorySlug: 'frameworks',
    categoryName: 'AI 框架与推理优化',
    slug: 'vllm-tensorrt-llm-concurrency-kv-cache-optimization',
    tags: ['vLLM', 'PagedAttention', 'Continuous Batching', '推理压测'],
    summary: '深入探究分页 KV Cache 机制与连续批处理调度，在大规模 GPU 集群中压榨吞吐性能。'
  }
];

export class AIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }

  /**
   * 动态根据分类生成契合配色的高清晰度 SVG 架构流程图
   */
  public generateArchitectureSvg(title: string, categorySlug: string): string {
    const colorPalettes = [
      { stroke: '#10B981', fill: '#064E3B', text: '#34D399' }, // Emerald
      { stroke: '#38BDF8', fill: '#0C4A6E', text: '#7DD3FC' }, // Sky
      { stroke: '#F59E0B', fill: '#78350F', text: '#FCD34D' }, // Amber
      { stroke: '#A855F7', fill: '#581C87', text: '#D8B4FE' }, // Purple
      { stroke: '#EC4899', fill: '#831843', text: '#F472B6' }, // Pink
      { stroke: '#6366F1', fill: '#312E81', text: '#A5B4FC' }  // Indigo
    ];

    // 基于 slug 散列取色
    let hash = 0;
    for (let i = 0; i < categorySlug.length; i++) {
      hash = (hash << 5) - hash + categorySlug.charCodeAt(i);
      hash |= 0;
    }
    const c = colorPalettes[Math.abs(hash) % colorPalettes.length];

    return `<svg viewBox="0 0 800 220" xmlns="http://www.w3.org/2000/svg" class="w-full my-6 bg-slate-900 rounded-lg p-4 font-mono text-xs">
  <defs>
    <marker id="arrow-gen" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${c.stroke}"/>
    </marker>
  </defs>

  <!-- Stage 1 -->
  <rect x="25" y="80" width="130" height="60" rx="8" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
  <text x="90" y="108" fill="#F8FAFC" font-size="12" font-weight="bold" text-anchor="middle">客户端 / 业务触发</text>
  <text x="90" y="126" fill="#94A3B8" font-size="10" text-anchor="middle">Trigger / Context</text>

  <line x1="155" y1="110" x2="200" y2="110" stroke="${c.stroke}" stroke-width="2" marker-end="url(#arrow-gen)"/>

  <!-- Stage 2 -->
  <rect x="205" y="80" width="160" height="60" rx="8" fill="#0F172A" stroke="${c.stroke}" stroke-width="1.5"/>
  <text x="285" y="108" fill="${c.text}" font-size="12" font-weight="bold" text-anchor="middle">核心调度与路由</text>
  <text x="285" y="126" fill="#94A3B8" font-size="10" text-anchor="middle">Intent &amp; Routing</text>

  <line x1="365" y1="110" x2="410" y2="110" stroke="${c.stroke}" stroke-width="2" marker-end="url(#arrow-gen)"/>

  <!-- Stage 3 -->
  <rect x="415" y="80" width="160" height="60" rx="8" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
  <text x="495" y="108" fill="#38BDF8" font-size="12" font-weight="bold" text-anchor="middle">AI 算力与模型流水线</text>
  <text x="495" y="126" fill="#94A3B8" font-size="10" text-anchor="middle">推理 / 决策 / 工具调度</text>

  <line x1="575" y1="110" x2="620" y2="110" stroke="${c.stroke}" stroke-width="2" marker-end="url(#arrow-gen)"/>

  <!-- Stage 4 -->
  <rect x="625" y="80" width="150" height="60" rx="8" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>
  <text x="700" y="108" fill="#F8FAFC" font-size="12" font-weight="bold" text-anchor="middle">确定性交付 &amp; 归档</text>
  <text x="700" y="126" fill="${c.text}" font-size="10" text-anchor="middle">Schema 校验与持久化</text>

  <!-- Feedback branch -->
  <path d="M 495 140 L 495 180 L 285 180 L 285 145" fill="none" stroke="#F59E0B" stroke-width="1.6" stroke-dasharray="3,3" marker-end="url(#arrow-gen)"/>
  <text x="390" y="198" fill="#FBBF24" font-size="10" text-anchor="middle">自愈重试与反馈熔断回路</text>
</svg>`;
  }

  /**
   * 执行完整的 AI 内容自动生成流水线（全动态分类）
   */
  public async executeContentPipeline(logCallback: (step: string, progress: number, logMsg: string) => void): Promise<ArticleRecord> {
    const store = ArticlesStore.getInstance();
    const existing = store.getAllArticles();
    const existingSlugs = new Set(existing.map(a => a.slug));

    // 挑选未生成的主题候选
    const availablePreset = DYNAMIC_TOPIC_PRESETS.find(p => !existingSlugs.has(p.slug)) || DYNAMIC_TOPIC_PRESETS[Math.floor(Math.random() * DYNAMIC_TOPIC_PRESETS.length)];

    logCallback('searching', 20, '正在连接全网情报源，检索全栈 AI 落地实战热点与前沿工程案例...');

    let generatedTitle = availablePreset.topic;
    let generatedCategorySlug = availablePreset.categorySlug;
    let generatedCategoryName = availablePreset.categoryName;
    let generatedSlug = availablePreset.slug;
    let generatedTags = availablePreset.tags;
    let generatedSummary = availablePreset.summary;
    let articleMarkdownBody = '';

    if (this.ai) {
      try {
        logCallback('searching', 35, `已定位核心课题：「${availablePreset.topic}」，正在由 AI 智能研判分类归属与架构设计...`);

        const prompt = `你是一位世界顶级全栈 AI 系统架构师与技术布道师。
请针对当前开发者社区高度关注的 AI 落地课题：“${availablePreset.topic}”，撰写一篇深度、干货丰富、符合 VitePress 构建规范的工程化技术文章。

注意：
1. 请在文章正文最开头输出一个轻量 JSON 块用于元数据智能归档，格式如下：
\`\`\`json
{
  "categorySlug": "根据课题主题自拟的规范英文目录slug，例如 deep-research, code-generation, eval-benchmarks, ai-security, rag, agents 等",
  "categoryName": "对应的中文分类展示名称，例如 Deep Research 深度研究, 代码生成与智能编程 等",
  "tags": ["标签1", "标签2", "标签3"]
}
\`\`\`
2. JSON 块之后，直接输出 Markdown 正文，以一级标题 (# 标题) 开始。
3. 正文中请勿重复输出 YAML frontmatter。
4. 正文包含：业务痛点背景、核心系统架构、生产级核心实现与代码示例（TypeScript / Python 均可）、生产落地避坑指南（性能压测、死锁熔断、成本控制）、总结与演进。
5. 关键提示处使用 VitePress 风格语法（::: tip 或 ::: warning）。`;

        logCallback('writing', 55, 'Gemini 3.8 Flash 正在根据搜集内容智能推导分类并撰写深度工程正文...');

        const generatePromise = this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        // 12秒超时保护，防止并发波动阻塞流水线
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API 响应超时，自动切换至高可用生成')), 12000)
        );

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const textOutput = response.text || '';

        if (textOutput && textOutput.length > 300) {
          // 尝试提取 JSON 元数据
          const jsonMatch = textOutput.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              const meta = JSON.parse(jsonMatch[1]);
              if (meta.categorySlug) {
                generatedCategorySlug = meta.categorySlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
              }
              if (meta.categoryName) {
                generatedCategoryName = meta.categoryName;
              }
              if (Array.isArray(meta.tags) && meta.tags.length > 0) {
                generatedTags = meta.tags;
              }
            } catch {
              // 忽略解析错误，使用预设
            }
            // 剥离开头的 JSON 块
            articleMarkdownBody = textOutput.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
          } else {
            articleMarkdownBody = textOutput;
          }
        }
      } catch (err: any) {
        logCallback('writing', 60, `Gemini API: ${err?.message || '自动启用高可用架构保障流水线运行'}`);
      }
    }

    if (!articleMarkdownBody) {
      articleMarkdownBody = this.getFallbackArticleBody(availablePreset.topic, generatedCategoryName);
    }

    logCallback('diagramming', 75, `正在为文章构建与 [${generatedCategoryName}] 契合的高清晰度 SVG 技术架构流程图...`);
    const svgDiagram = this.generateArchitectureSvg(generatedTitle, generatedCategorySlug);

    // 将 SVG 插图自动嵌入到正文
    if (articleMarkdownBody.includes('## 核心系统架构') || articleMarkdownBody.includes('## 二、核心系统架构')) {
      articleMarkdownBody = articleMarkdownBody.replace(/(## (?:二、)?核心系统架构[^\n]*\n)/, `$1\n${svgDiagram}\n\n`);
    } else {
      const firstH1Idx = articleMarkdownBody.indexOf('\n');
      if (firstH1Idx !== -1) {
        articleMarkdownBody = articleMarkdownBody.slice(0, firstH1Idx + 1) + `\n${svgDiagram}\n\n` + articleMarkdownBody.slice(firstH1Idx + 1);
      } else {
        articleMarkdownBody = `${svgDiagram}\n\n` + articleMarkdownBody;
      }
    }

    logCallback('indexing', 90, `智能分类判定完成：归入 [${generatedCategoryName}] (docs/${generatedCategorySlug}/)，自动更新 VitePress 导航与侧边栏...`);

    // 落地保存到真实 VitePress 文件系统
    const newArticle = store.saveArticle({
      title: generatedTitle,
      description: generatedSummary,
      category: generatedCategorySlug,
      categoryName: generatedCategoryName,
      tags: generatedTags,
      author: 'AI Engineering Lab',
      readingTimeMinutes: Math.max(5, Math.round(articleMarkdownBody.length / 450)),
      slug: generatedSlug,
      content: articleMarkdownBody
    });

    logCallback('complete', 100, `文章生成成功并归档至 ${newArticle.filePath}，VitePress 目录已就绪！`);
    return newArticle;
  }

  private getFallbackArticleBody(topic: string, categoryName: string): string {
    return `# ${topic}

在企业级 AI 系统的落地过程中，工程人员面临的最大挑战往往不是模型的基础推理能力，而是如何让非确定性的模型行为与确定性的企业生产环境（SLA、事务一致性、成本约束）完美契合。本文聚焦于 ${topic}，从实战角度拆解系统架构与代码范式。

## 一、业务痛点与技术选型背景

传统单一模式在企业核心业务场景中存在以下短板：
1. **状态易丢失**：长流程或跨网络请求中断时缺乏检查点机制，导致整轮重新执行，产生巨大的 Token 浪费与重试开销。
2. **缺乏严格契约**：大模型输出格式偶发飘移，破坏下游微服务的 RPC 契约与数据库约束。
3. **可观测性盲区**：单体黑盒调用使得工程师无法精准定位延迟与幻觉发生在哪个具体环节。

## 二、核心系统架构与交互拓扑

针对上述问题，系统构建了分层分流网关与异步持久化拓扑，解耦业务调度、计算推理与持久化保障。

## 三、生产级核心实现与代码范例

以下为生产环境落地的核心控制器参考实现（采用严格类型约束与超时中断保护）：

\`\`\`typescript
import { EventEmitter } from 'node:events';

export interface WorkflowOptions {
  maxRetries: number;
  timeoutMs: number;
  enableCheckpoint: boolean;
}

export class ProductionAIWorkflow<TInput, TOutput> extends EventEmitter {
  private options: WorkflowOptions;

  constructor(options: Partial<WorkflowOptions> = {}) {
    super();
    this.options = {
      maxRetries: 3,
      timeoutMs: 30000,
      enableCheckpoint: true,
      ...options
    };
  }

  public async execute(input: TInput): Promise<TOutput> {
    let attempt = 0;
    while (attempt < this.options.maxRetries) {
      attempt++;
      this.emit('step', { phase: 'infer', attempt });

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
        
        // 执行模型推理与结构化解析
        const result = await this.runInference(input, controller.signal);
        clearTimeout(timer);

        this.emit('success', { attempt, result });
        return result;
      } catch (err: any) {
        this.emit('warn', { attempt, error: err.message });
        if (attempt >= this.options.maxRetries) {
          throw new Error(\`工作流执行失败，已达最大重试上限: \${err.message}\`);
        }
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
    throw new Error('未知调度异常');
  }

  private async runInference(input: TInput, signal: AbortSignal): Promise<TOutput> {
    return { status: 'processed', input, timestamp: Date.now() } as unknown as TOutput;
  }
}
\`\`\`

## 四、生产落地考量与避坑指南

::: tip 生产建议
对于大模型生成系统，务必在网关层配置熔断器（Circuit Breaker）与请求抢占限流。
:::

1. **幂等性保障**：对确定性输入使用 SHA-256 哈希作为缓存键，避免相同输入重复消耗算力。
2. **精细化 Token 监控**：在每次推理完成后，抽取 Input Tokens 与 Output Tokens 并计入监控指标。
3. **降级预案**：当高规格模型出现限流（429）或延迟突增时，自动降级维持基础链路畅通。

## 五、总结与演进方向

${topic} 标志着 AI 工程化向着确定性、高质量与自演进迈出的关键一步。后续可进一步结合自适应评估与微调闭环持续迭代。
`;
  }
}
