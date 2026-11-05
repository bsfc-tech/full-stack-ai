import React from 'react';
import { Sun, Moon, Search, Github } from 'lucide-react';
import { CategoryInfo } from '../types/index.ts';

interface HeaderProps {
  categories: CategoryInfo[];
  selectedCategory: string | null;
  onSelectCategory: (categorySlug: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  isDark,
  setIsDark
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Site Title */}
        <div 
          onClick={() => onSelectCategory(null)}
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight">
                Full-Stack AI 落地实践
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              VitePress AI 自动知识库
            </div>
          </div>
        </div>

        {/* 动态分类快速直达链接 (VitePress Top Nav) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === null
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            全部文档
          </button>

          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* 右侧工具栏：全局搜索、深浅色模式切换、GitHub */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* 全局搜索框 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索文档内容..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-32 sm:w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* 深浅色模式切换 */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? '切换至浅色模式' : '切换至深色模式'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* GitHub 图标 */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex"
            title="GitHub 仓库"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

      </div>
    </header>
  );
};
