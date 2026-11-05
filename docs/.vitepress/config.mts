import { defineConfig } from 'vitepress';

// VitePress 核心配置文件 - 由 AI 自动归档系统根据收集内容动态维护
export default defineConfig({
  lang: 'zh-CN',
  title: 'Full-Stack AI 落地实践指南',
  description: '面向开发者的全栈 AI 落地实践知识库：LLM Agents、RAG 检索增强、前沿框架与工程避坑手册',
  
  themeConfig: {
    logo: '⚡',
    siteTitle: 'Full-Stack AI 落地指南',
    
    nav: [
      {
            "text": "首页",
            "link": "/"
      },
      {
            "text": "Deep Research 深度研究",
            "link": "/deep-research/deep-research-multi-step-backtracking-architecture"
      },
      {
            "text": "LLM Agents 智能体",
            "link": "/agents/sql-analysis-agent-function-calling-injection-sandbox"
      },
      {
            "text": "工程落地与避坑",
            "link": "/practice/llm-cascading-router-dynamic-fallback-cost-reduction"
      },
      {
            "text": "AI 框架与工具链",
            "link": "/frameworks/tensorrt-llm-fp8-quantization-cluster-throughput-tuning"
      },
      {
            "text": "RAG 知识检索增强",
            "link": "/rag/colbertv2-late-interaction-vertical-rag-optimization"
      }
],

    sidebar: {
      "/deep-research/": [
            {
                  "text": "Deep Research 深度研究",
                  "items": [
                        {
                              "text": "Deep Research 深度自主科研智能体的多步推理与回溯搜索架构",
                              "link": "/deep-research/deep-research-multi-step-backtracking-architecture"
                        }
                  ]
            }
      ],
      "/agents/": [
            {
                  "text": "LLM Agents 智能体",
                  "items": [
                        {
                              "text": "基于 Function Calling 的生产级 SQL 自主数据分析 Agent 与防注入安全隔离",
                              "link": "/agents/sql-analysis-agent-function-calling-injection-sandbox"
                        },
                        {
                              "text": "LangGraph 生产级多智能体反思与自愈工作流实践",
                              "link": "/agents/langgraph-multi-agent-reflection"
                        },
                        {
                              "text": "LangGraph 与 Temporal 结合的长周期可靠工作流调度实践",
                              "link": "/agents/langgraph-temporal-reliable-long-running-workflow"
                        }
                  ]
            }
      ],
      "/practice/": [
            {
                  "text": "工程落地与避坑",
                  "items": [
                        {
                              "text": "多模型路由门控 (LLM Cascading Router) 与动态降级节约 70% Token 成本",
                              "link": "/practice/llm-cascading-router-dynamic-fallback-cost-reduction"
                        },
                        {
                              "text": "大模型生产环境幻觉评估与结构化 JSON 强校验流水线",
                              "link": "/practice/llm-hallucination-evaluation-json-validation"
                        }
                  ]
            }
      ],
      "/frameworks/": [
            {
                  "text": "AI 框架与工具链",
                  "items": [
                        {
                              "text": "TensorRT-LLM 配合 FP8 量化在千卡推理集群中的吞吐翻倍实践",
                              "link": "/frameworks/tensorrt-llm-fp8-quantization-cluster-throughput-tuning"
                        },
                        {
                              "text": "vLLM 与 Ollama 高并发推理服务器吞吐量性能压测与选型",
                              "link": "/frameworks/vllm-ollama-high-concurrency-benchmark"
                        }
                  ]
            }
      ],
      "/rag/": [
            {
                  "text": "RAG 知识检索增强",
                  "items": [
                        {
                              "text": "ColBERTv2 Late Interaction 在高精尖垂直问答中的极致召回优化",
                              "link": "/rag/colbertv2-late-interaction-vertical-rag-optimization"
                        },
                        {
                              "text": "GraphRAG 结合知识图谱的高精度混合检索实践",
                              "link": "/rag/graphrag-hybrid-knowledge-retrieval"
                        }
                  ]
            }
      ]
},

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],

    footer: {
      message: '基于 VitePress 与 Gemini AI 内容自动生成引擎构建',
      copyright: 'Copyright © 2026 AI Engineering Lab'
    }
  }
});
