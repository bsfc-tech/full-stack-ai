---
title: GraphRAG 结合知识图谱的高精度混合检索实践
description: 突破传统向量相似度检索在多跳推理与宏观归纳上的局限，实现实体拓扑与向量语义的协同召回。
date: 2026-11-04
category: rag
tags: ["GraphRAG", "知识图谱", "混合检索", "向量数据库"]
author: AI Engineering Lab
readingTimeMinutes: 10
---

# GraphRAG 结合知识图谱的高精度混合检索实践

传统的密集向量检索（Dense Vector Retrieval）基于句嵌入相似度，在处理“这篇文章的核心主旨是什么？”或“实体 A 与实体 B 存在哪几层间接业务关系？”等多跳与宏观汇总问题时，往往因召回的片段过于零碎而导致回答片面。GraphRAG 引入知识图谱（Entity-Relation Graph）与层次化聚类，成功弥补了这一短板。

## 混合检索链路设计

系统将检索路径解耦为三条并行支路：**图谱实体多跳遍历**、**语义向量近似最近邻 (HNSW)** 以及 **BM25 关键词精确匹配**，最后经过交叉编码器（Cross-Encoder）进行统一重排序。

```svg
<svg viewBox="0 0 800 240" xmlns="http://www.w3.org/2000/svg" class="w-full my-6 bg-slate-900 rounded-lg p-4 font-mono text-xs">
  <defs>
    <marker id="arrow-rag" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#38BDF8"/>
    </marker>
  </defs>

  <!-- Query -->
  <rect x="20" y="90" width="110" height="60" rx="8" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>
  <text x="75" y="118" fill="#F8FAFC" font-size="12" font-weight="bold" text-anchor="middle">复杂业务查询</text>
  <text x="75" y="136" fill="#94A3B8" font-size="10" text-anchor="middle">User Query</text>

  <!-- 3 Parallel Branches -->
  <!-- Branch 1: Graph -->
  <path d="M 130 110 L 220 50" stroke="#38BDF8" stroke-width="1.8" marker-end="url(#arrow-rag)"/>
  <rect x="225" y="20" width="160" height="50" rx="6" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
  <text x="305" y="42" fill="#38BDF8" font-size="11" font-weight="bold" text-anchor="middle">① 知识图谱实体多跳</text>
  <text x="305" y="58" fill="#94A3B8" font-size="10" text-anchor="middle">Neo4j / Cypher Graph Traversal</text>

  <!-- Branch 2: Vector -->
  <line x1="130" y1="120" x2="220" y2="120" stroke="#38BDF8" stroke-width="1.8" marker-end="url(#arrow-rag)"/>
  <rect x="225" y="95" width="160" height="50" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
  <text x="305" y="117" fill="#34D399" font-size="11" font-weight="bold" text-anchor="middle">② 语义向量相似度</text>
  <text x="305" y="133" fill="#94A3B8" font-size="10" text-anchor="middle">Milvus / Qdrant HNSW</text>

  <!-- Branch 3: BM25 -->
  <path d="M 130 130 L 220 190" stroke="#38BDF8" stroke-width="1.8" marker-end="url(#arrow-rag)"/>
  <rect x="225" y="170" width="160" height="50" rx="6" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="305" y="192" fill="#FBBF24" font-size="11" font-weight="bold" text-anchor="middle">③ 关键词倒排检索</text>
  <text x="305" y="208" fill="#94A3B8" font-size="10" text-anchor="middle">BM25 / 精确术语过滤</text>

  <!-- Converge to Reranker -->
  <path d="M 385 45 L 450 110" stroke="#38BDF8" stroke-width="1.8"/>
  <line x1="385" y1="120" x2="455" y2="120" stroke="#38BDF8" stroke-width="1.8"/>
  <path d="M 385 195 L 450 130" stroke="#38BDF8" stroke-width="1.8" marker-end="url(#arrow-rag)"/>

  <!-- Rerank Box -->
  <rect x="460" y="85" width="150" height="70" rx="8" fill="#1E1B4B" stroke="#818CF8" stroke-width="1.5"/>
  <text x="535" y="113" fill="#A5B4FC" font-size="12" font-weight="bold" text-anchor="middle">Cross-Encoder 重排</text>
  <text x="535" y="131" fill="#E0E7FF" font-size="10" text-anchor="middle">Reciprocal Rank Fusion</text>
  <text x="535" y="146" fill="#818CF8" font-size="9" text-anchor="middle">动态衰减与相关性打分</text>

  <!-- Final Synthesis -->
  <line x1="610" y1="120" x2="655" y2="120" stroke="#38BDF8" stroke-width="1.8" marker-end="url(#arrow-rag)"/>
  <rect x="660" y="90" width="120" height="60" rx="8" fill="#064E3B" stroke="#059669" stroke-width="1.5"/>
  <text x="720" y="118" fill="#6EE7B7" font-size="12" font-weight="bold" text-anchor="middle">高质量上下文</text>
  <text x="720" y="136" fill="#A7F3D0" font-size="10" text-anchor="middle">LLM 最终生成</text>
</svg>
```

## 关键代码实现：RRF (倒数排名融合)

```typescript
interface ScoredChunk {
  id: string;
  text: string;
  source: 'graph' | 'vector' | 'keyword';
  rawScore: number;
}

/**
 * 倒数排名融合算法 (Reciprocal Rank Fusion, k=60 黄金常量)
 */
export function reciprocalRankFusion(
  vectorResults: ScoredChunk[],
  graphResults: ScoredChunk[],
  bm25Results: ScoredChunk[],
  k: number = 60
): { id: string; text: string; score: number }[] {
  const scores = new Map<string, { text: string; score: number }>();

  const rankLists = [vectorResults, graphResults, bm25Results];

  rankLists.forEach((list) => {
    list.forEach((item, rank) => {
      const current = scores.get(item.id) || { text: item.text, score: 0 };
      // RRF 公式: 1 / (k + rank)
      current.score += 1 / (k + rank + 1);
      scores.set(item.id, current);
    });
  });

  return Array.from(scores.entries())
    .map(([id, val]) => ({ id, text: val.text, score: val.score }))
    .sort((a, b) => b.score - a.score);
}
```

## 落地实践要点

1. **实体抽取流水线异步化**：构建知识图谱耗时较高，不要在实时链路中进行 Entity 抽取，而应在离线或消息队列中完成。
2. **社区摘要层次（Community Summaries）**：利用图社群发现算法（Leiden），为子图自动预生成宏观摘要，使 RAG 在回答系统级问题时具备全局视野。
