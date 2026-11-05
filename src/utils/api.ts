import { ArticleRecord, CategoryInfo, DocsTreeNode, SchedulerStatus } from '../types/index.ts';

export async function fetchSchedulerStatus(): Promise<SchedulerStatus> {
  const res = await fetch('/api/scheduler/status');
  if (!res.ok) throw new Error('无法连接到调度服务');
  return res.json();
}

export async function toggleScheduler(enabled: boolean): Promise<SchedulerStatus> {
  const res = await fetch('/api/scheduler/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('切换调度状态失败');
  return res.json();
}

export async function triggerArticleGeneration(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/scheduler/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('触发生成失败');
  return res.json();
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('无法获取分类列表');
  return res.json();
}

export async function fetchArticles(): Promise<ArticleRecord[]> {
  const res = await fetch('/api/articles');
  if (!res.ok) throw new Error('无法获取文章列表');
  return res.json();
}

export async function fetchArticleById(id: string): Promise<ArticleRecord> {
  const res = await fetch(`/api/articles/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('无法获取文章详情');
  return res.json();
}

export async function deleteArticle(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('删除文章失败');
  return res.json();
}

export async function fetchDocsTree(): Promise<DocsTreeNode> {
  const res = await fetch('/api/docs/tree');
  if (!res.ok) throw new Error('无法获取目录结构');
  return res.json();
}

export async function fetchFileContent(path: string): Promise<{ path: string; content: string }> {
  const res = await fetch(`/api/docs/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error('无法读取文件内容');
  return res.json();
}
