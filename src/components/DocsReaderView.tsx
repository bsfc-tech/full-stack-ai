import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, Hash, Clock, User, Calendar, 
  ArrowLeft, ArrowRight, Copy, Check, Search, Tag, BookOpen 
} from 'lucide-react';
import { ArticleRecord } from '../types/index.ts';
import { extractToc, renderMarkdown } from '../utils/markdown.ts';

interface DocsReaderViewProps {
  articles: ArticleRecord[];
  activeArticleId: string | null;
  onSelectArticle: (id: string) => void;
  selectedCategory: string | null;
  searchQuery: string;
}

export const DocsReaderView: React.FC<DocsReaderViewProps> = ({
  articles,
  activeArticleId,
  onSelectArticle,
  selectedCategory,
  searchQuery
}) => {
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // 综合搜索与顶栏分类过滤后的文章候选
  const filteredArticles = useMemo(() => {
    let list = articles;
    if (selectedCategory) {
      list = list.filter(a => a.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [articles, selectedCategory, searchQuery]);

  // 当前激活的文章
  const currentArticle = useMemo(() => {
    if (!articles.length) return null;
    if (activeArticleId) {
      const found = articles.find(a => a.id === activeArticleId || a.slug === activeArticleId);
      if (found) return found;
    }
    return filteredArticles[0] || articles[0];
  }, [articles, activeArticleId, filteredArticles]);

  // 解析当前文章 HTML 与 TOC
  const renderedHtml = useMemo(() => {
    if (!currentArticle) return '';
    return renderMarkdown(currentArticle.rawContent);
  }, [currentArticle]);

  const toc = useMemo(() => {
    if (!currentArticle) return [];
    return extractToc(currentArticle.rawContent);
  }, [currentArticle]);

  // 前后篇导航计算
  const { prevArticle, nextArticle } = useMemo(() => {
    if (!currentArticle) return { prevArticle: null, nextArticle: null };
    const idx = articles.findIndex(a => a.id === currentArticle.id);
    return {
      prevArticle: idx > 0 ? articles[idx - 1] : null,
      nextArticle: idx < articles.length - 1 ? articles[idx + 1] : null
    };
  }, [articles, currentArticle]);

  // 动态将文章按分类聚合（支持全动态 AI 推导出的任意新分类）
  const dynamicGroupedCategories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; items: ArticleRecord[] }>();

    const q = sidebarFilter.trim().toLowerCase();
    for (const art of articles) {
      if (q && !art.title.toLowerCase().includes(q) && !art.tags.some(t => t.toLowerCase().includes(q))) {
        continue;
      }
      if (!map.has(art.category)) {
        map.set(art.category, {
          slug: art.category,
          name: art.categoryName || art.category,
          items: []
        });
      }
      map.get(art.category)!.items.push(art);
    }

    return Array.from(map.values());
  }, [articles, sidebarFilter]);

  const handleCopyMarkdown = () => {
    if (!currentArticle) return;
    navigator.clipboard.writeText(currentArticle.rawContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-140px)]">
      
      {/* 左侧侧边栏 (VitePress Navigation Sidebar) */}
      <aside className="w-full lg:w-72 shrink-0 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs self-start lg:sticky lg:top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
        
        {/* 侧边栏搜索 */}
        <div className="relative mb-4">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="过滤目录文章..."
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 动态分类分组列表 */}
        <div className="space-y-5 text-xs">
          {dynamicGroupedCategories.length > 0 ? (
            dynamicGroupedCategories.map((group) => (
              <div key={group.slug}>
                <div className="font-semibold text-slate-900 dark:text-slate-200 px-2 py-1 flex items-center justify-between">
                  <span className="truncate">{group.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0 ml-1">
                    {group.items.length}
                  </span>
                </div>

                <div className="mt-1 space-y-0.5">
                  {group.items.map((art) => {
                    const isActive = currentArticle?.id === art.id;
                    return (
                      <button
                        key={art.id}
                        onClick={() => onSelectArticle(art.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors block truncate cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border-l-2 border-emerald-500'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        title={art.title}
                      >
                        {art.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-slate-400 italic px-2 py-4 text-center">
              暂无匹配的文档
            </div>
          )}
        </div>

      </aside>

      {/* 中间主阅读区 */}
      <main className="flex-1 min-w-0 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xs">
        {currentArticle ? (
          <article className="max-w-3xl mx-auto">
            
            {/* 面包屑导航 */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
              <span>文档库</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>{currentArticle.categoryName}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-xs text-slate-800 dark:text-slate-200 font-medium">
                {currentArticle.title}
              </span>
            </nav>

            {/* 头部标题与元数据栏 (遵循零胶囊规范: 无边框文字 + 点分隔，无内部落地路径) */}
            <header className="pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                  {currentArticle.title}
                </h1>

                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0 py-1.5 px-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800"
                  title="复制 Markdown 原文"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">已复制正文</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制正文</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentArticle.author}</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1 font-mono tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentArticle.date}</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentArticle.readingTimeMinutes} 分钟阅读</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {currentArticle.tags.map((tag, i) => (
                    <span key={i} className="text-slate-600 dark:text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Markdown 正文渲染区 (含代码块、表格、SVG 架构图) */}
            <div 
              className="prose dark:prose-invert prose-slate max-w-none prose-headings:scroll-mt-24 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />

            {/* 底部前后篇导航 (标准 VitePress Pager 风格，支持多行自动换行与对称栅格排版) */}
            <nav 
              aria-label="文章前后页导航"
              className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {prevArticle ? (
                <button
                  onClick={() => onSelectArticle(prevArticle.id)}
                  className="flex flex-col items-start text-left p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer group w-full min-h-[82px] justify-between shadow-2xs"
                >
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>上一篇</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-2 leading-snug whitespace-normal break-words line-clamp-2">
                    {prevArticle.title}
                  </span>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextArticle ? (
                <button
                  onClick={() => onSelectArticle(nextArticle.id)}
                  className="flex flex-col items-end text-right p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer group w-full min-h-[82px] justify-between shadow-2xs sm:col-start-2"
                >
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <span>下一篇</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-2 leading-snug whitespace-normal break-words line-clamp-2 text-right">
                    {nextArticle.title}
                  </span>
                </button>
              ) : null}
            </nav>

          </article>
        ) : (
          <div className="py-24 text-center text-slate-500">
            暂无已选择的文章
          </div>
        )}
      </main>

      {/* 右侧 "本页目录" 导航栏 (On this page / TOC) */}
      {toc.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0 self-start sticky top-20 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-200 mb-3 px-2 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
            <span>本页目录</span>
          </div>

          <div className="space-y-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            {toc.map((item, idx) => (
              <a
                key={idx}
                href={`#${item.id}`}
                className={`block py-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 ${
                  item.level === 3 ? 'pl-3 text-[11px]' : 'font-medium'
                }`}
              >
                {item.text}
              </a>
            ))}
          </div>
        </aside>
      )}

    </div>
  );
};
