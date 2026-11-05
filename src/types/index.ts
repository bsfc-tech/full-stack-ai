export type ArticleCategory = string;

export interface CategoryInfo {
  id: string; // e.g. 'agents', 'deep-research', 'rag'
  name: string; // e.g. 'LLM Agents 智能体', 'Deep Research 深度研究'
  dir: string;
  count?: number;
}

export const CATEGORIES: Record<string, { id: string; name: string }> = {
  agents: { id: 'agents', name: 'LLM Agents 智能体' },
  rag: { id: 'rag', name: 'RAG 检索增强' },
  frameworks: { id: 'frameworks', name: 'AI 框架与工具' },
  practice: { id: 'practice', name: '工程落地与实战' }
};

export interface ArticleMetadata {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryName: string;
  tags: string[];
  summary: string;
  author: string;
  date: string;
  filePath: string;
  readingTimeMinutes: number;
}

export interface ArticleRecord extends ArticleMetadata {
  rawContent: string;
  createdAt: number;
}

export type PipelineStep = 'idle' | 'searching' | 'writing' | 'diagramming' | 'indexing' | 'complete' | 'error';

export interface SchedulerTaskStatus {
  status: PipelineStep;
  progress: number;
  stepDescription: string;
  logs: string[];
  currentArticleTitle?: string;
  error?: string;
}

export interface SchedulerStatus {
  enabled: boolean;
  intervalMinutes: number;
  lastRunAt: number | null;
  nextRunAt: number | null;
  currentTask: SchedulerTaskStatus;
  totalGenerated: number;
}

export interface DocsTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  category?: string;
  articleId?: string;
  children?: DocsTreeNode[];
  size?: number;
  updatedAt?: string;
}
