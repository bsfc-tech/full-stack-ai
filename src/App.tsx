/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { DocsReaderView } from './components/DocsReaderView.tsx';
import { ArticleRecord, CategoryInfo } from './types/index.ts';
import { fetchArticles, fetchCategories, fetchSchedulerStatus } from './utils/api.ts';

export default function App() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [articles, setArticles] = useState<ArticleRecord[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(false);

  // 初始化深浅色模式
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('vitepress-ai-theme');
    const dark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSetTheme = (dark: boolean) => {
    setIsDark(dark);
    localStorage.setItem('vitepress-ai-theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 加载动态分类与文章
  const loadData = useCallback(async () => {
    try {
      const [cats, arts] = await Promise.all([
        fetchCategories(),
        fetchArticles()
      ]);
      setCategories(cats);
      setArticles(arts);
      if (arts.length > 0 && !activeArticleId) {
        setActiveArticleId(arts[0].id);
      }
    } catch (err) {
      console.error('加载文档库失败:', err);
    }
  }, [activeArticleId]);

  useEffect(() => {
    loadData();

    // 后台静默轮询（每 10 秒刷新一次，检测 1 小时自动定时任务的新增文章）
    const interval = setInterval(async () => {
      try {
        const status = await fetchSchedulerStatus();
        if (status.currentTask.status === 'complete' || status.totalGenerated !== articles.length) {
          loadData();
        }
      } catch {
        // 静默捕获
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loadData, articles.length]);

  const handleSelectArticle = (id: string) => {
    setActiveArticleId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catSlug: string | null) => {
    setSelectedCategory(catSlug);
    // 切换分类时默认选中该分类下的第一篇
    if (catSlug) {
      const firstInCat = articles.find(a => a.category === catSlug);
      if (firstInCat) {
        setActiveArticleId(firstInCat.id);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col justify-between">
      
      {/* 纯净 VitePress 顶部导航栏 (无任何调试或控制台标签) */}
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDark={isDark}
        setIsDark={handleSetTheme}
      />

      {/* 主工作区：纯净沉浸式 VitePress 文档阅读器 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <DocsReaderView
          articles={articles}
          activeArticleId={activeArticleId}
          onSelectArticle={handleSelectArticle}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />
      </main>

      {/* 极简 VitePress 风格底部版权 */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Full-Stack AI 落地实践指南 · 面向开发者的工程化沉淀
          </div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
            <span>标准 VitePress 规范</span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI 智能动态归档</span>
            <span aria-hidden="true">·</span>
            <span>Copyright © 2026 AI Engineering Lab</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
