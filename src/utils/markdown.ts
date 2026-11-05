import { marked } from 'marked';

// 配置 marked 解析器
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * 将 Markdown 文本转为安全且优化的 HTML
 * 并支持 VitePress 风格的容器语法 (::: tip ... ::: / ::: warning ... :::)
 * 以及自动提取内联 SVG 流程图
 */
export function renderMarkdown(rawMd: string): string {
  if (!rawMd) return '';

  // 1. 去除 frontmatter 头部（如果包含）
  let body = rawMd;
  if (body.startsWith('---')) {
    const endMatch = body.slice(3).indexOf('---');
    if (endMatch !== -1) {
      body = body.slice(endMatch + 6).trim();
    }
  }

  // 2. 转换 VitePress 风格的 ::: tip 和 ::: warning 容器
  body = body.replace(/::: tip(?:\s+([^\n]+))?\n([\s\S]*?)\n:::/g, (_, title, text) => {
    return `<div class="my-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200">
      <div class="font-semibold text-sm mb-1 text-emerald-800 dark:text-emerald-400">💡 ${title || '提示'}</div>
      <div class="text-sm leading-relaxed">${text}</div>
    </div>`;
  });

  body = body.replace(/::: warning(?:\s+([^\n]+))?\n([\s\S]*?)\n:::/g, (_, title, text) => {
    return `<div class="my-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
      <div class="font-semibold text-sm mb-1 text-amber-800 dark:text-amber-400">⚠️ ${title || '生产注意'}</div>
      <div class="text-sm leading-relaxed">${text}</div>
    </div>`;
  });

  // 3. 处理代码块中包含的 SVG (如 ```svg ... ```) 转换为原生渲染的 SVG
  body = body.replace(/```svg\n([\s\S]*?)\n```/g, (_, svgContent) => {
    return `<div class="svg-diagram-container my-6 overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-950 p-2 shadow-inner">${svgContent.trim()}</div>`;
  });

  // 4. 调用 marked 进行转换
  return marked.parse(body) as string;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * 提取文章中的 H2 / H3 目录大纲
 */
export function extractToc(rawMd: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = rawMd.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3).replace(/[#*`_]/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, '-').replace(/-+/g, '-');
      toc.push({ id, text, level: 2 });
    } else if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4).replace(/[#*`_]/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, '-').replace(/-+/g, '-');
      toc.push({ id, text, level: 3 });
    }
  }

  return toc;
}
