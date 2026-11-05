---
title: LangGraph 生产级多智能体反思与自愈工作流实践
description: 详解基于 LangGraph 的 Plan-and-Solve 与 Self-Correction 智能体架构在工程中的落地与容错处理。
date: 2026-11-04
category: agents
tags: ["LangGraph", "Multi-Agent", "Self-Correction", "生产落地"]
author: AI Engineering Lab
readingTimeMinutes: 8
---

# LangGraph 生产级多智能体反思与自愈工作流实践

在复杂的企业级 AI 任务中，单次 LLM 推理往往难以应对长流程、多约束的业务场景，经常出现步骤遗漏或逻辑断层。LangGraph 通过有向状态图（StateGraph）机制，将原本脆弱的线性 Chain 升级为具备循环、分支与自愈能力的多智能体协作网络。

## 架构拓扑与执行流程

本架构核心由四个协作节点构成：**规划专家 (Planner)**、**执行代理 (Executor)**、**质检评审 (Evaluator)** 以及 **回滚修正器 (Reflector)**。

```svg
<svg viewBox="0 0 800 240" xmlns="http://www.w3.org/2000/svg" class="w-full my-6 bg-slate-900 rounded-lg p-4 font-mono text-xs">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981"/>
    </marker>
    <marker id="arrow-warn" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B"/>
    </marker>
  </defs>

  <!-- User Input -->
  <rect x="20" y="90" width="120" height="60" rx="8" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
  <text x="80" y="118" fill="#F8FAFC" font-size="13" font-weight="bold" text-anchor="middle">用户任务输入</text>
  <text x="80" y="136" fill="#94A3B8" font-size="11" text-anchor="middle">Goal & Context</text>

  <!-- Line to Planner -->
  <line x1="140" y1="120" x2="185" y2="120" stroke="#10B981" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Planner -->
  <rect x="190" y="90" width="130" height="60" rx="8" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
  <text x="255" y="118" fill="#34D399" font-size="13" font-weight="bold" text-anchor="middle">01. Planner 节点</text>
  <text x="255" y="136" fill="#94A3B8" font-size="11" text-anchor="middle">分解多阶段子目标</text>

  <!-- Line to Executor -->
  <line x1="320" y1="120" x2="365" y2="120" stroke="#10B981" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Executor -->
  <rect x="370" y="90" width="130" height="60" rx="8" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
  <text x="435" y="118" fill="#38BDF8" font-size="13" font-weight="bold" text-anchor="middle">02. Executor 节点</text>
  <text x="435" y="136" fill="#94A3B8" font-size="11" text-anchor="middle">并行调用 API 与工具</text>

  <!-- Line to Evaluator -->
  <line x1="500" y1="120" x2="545" y2="120" stroke="#10B981" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Evaluator -->
  <rect x="550" y="90" width="130" height="60" rx="8" fill="#0F172A" stroke="#A855F7" stroke-width="1.5"/>
  <text x="615" y="118" fill="#C084FC" font-size="13" font-weight="bold" text-anchor="middle">03. Evaluator 评审</text>
  <text x="615" y="136" fill="#94A3B8" font-size="11" text-anchor="middle">断言检验与语法核实</text>

  <!-- Line to Output -->
  <line x1="680" y1="120" x2="725" y2="120" stroke="#10B981" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="730" y="90" width="60" height="60" rx="8" fill="#064E3B" stroke="#059669" stroke-width="1.5"/>
  <text x="760" y="125" fill="#A7F3D0" font-size="12" font-weight="bold" text-anchor="middle">成功</text>

  <!-- Reflection Loop (Bottom curve) -->
  <path d="M 615 150 L 615 195 L 435 195 L 435 155" fill="none" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="4,4" marker-end="url(#arrow-warn)"/>
  <text x="525" y="215" fill="#FBBF24" font-size="11" text-anchor="middle">反思循环 (自愈与重试，上限 3 次)</text>
</svg>
```

## 核心实现：带类型约束的 StateGraph

在生产环境中，状态（State）对象的不可变性与通道更新策略是系统的基石。下面是基于 LangGraph 的标准 Python 实现框架：

```python
from typing import TypedDict, Annotated, List
import operator
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    task: str
    plan: List[str]
    current_step: int
    tool_outputs: Annotated[List[str], operator.add] # 自动追加模式
    critique_feedback: str
    retry_count: int
    is_success: bool

def planner_node(state: AgentState):
    prompt = f"针对用户任务: {state['task']}，生成执行计划清单..."
    # 结构化输出提取 List[str]
    plan = ["步骤 1: 拉取配置", "步骤 2: 执行数据清洗", "步骤 3: 格式校验"]
    return {"plan": plan, "current_step": 0}

def executor_node(state: AgentState):
    step_desc = state["plan"][state["current_step"]]
    # 执行具体工具调用
    output = f"执行完成: {step_desc}"
    return {
        "tool_outputs": [output],
        "current_step": state["current_step"] + 1
    }

def evaluator_node(state: AgentState):
    if state["current_step"] < len(state["plan"]):
        return {"is_success": False, "critique_feedback": "计划尚未全部执行"}
    # 模拟质量断言
    return {"is_success": True}

def should_continue(state: AgentState):
    if state["is_success"]:
        return END
    if state.get("retry_count", 0) >= 3:
        return "human_fallback"
    return "executor"

# 组装状态图
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_node)
workflow.add_node("executor", executor_node)
workflow.add_node("evaluator", evaluator_node)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "executor")
workflow.add_edge("executor", "evaluator")
workflow.add_conditional_edges("evaluator", should_continue)

app = workflow.compile()
```

## 生产避坑指南

1. **死循环熔断机制**：必须在图状态中维护硬性 `retry_count` 计数器，一旦超过预设阈值（例如 3 次），立刻触发回滚降级或接入人工审批通道，严禁无限制自愈。
2. **状态剪枝（State Pruning）**：随着调用轮次增加，对话历史与工具输出会显著膨胀。建议使用 Summarization 中间件，对执行日志进行定期压缩，控制 Token 开销。
3. **幂等性保障**：在执行写操作的工具（如更新数据库、发信通知）前，必须加入外部分布式锁或根据任务 ID 校验幂等性。
