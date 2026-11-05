import fs from 'node:fs';
import path from 'node:path';
import { ArticleMetadata, ArticleRecord, CategoryInfo, DocsTreeNode } from '../src/types/index.ts';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');
const VITEPRESS_CONFIG_PATH = path.resolve(DOCS_DIR, '.vitepress', 'config.mts');

// 默认知名分类的优美中文名对照（其他由 AI 动态推导或自动转换）
const KNOWN_CATEGORY_NAMES: Record<string, string> = {
  'agents': 'LLM Agents 智能体',
  'rag': 'RAG 知识检索增强',
  'frameworks': 'AI 框架与工具链',
  'practice': '工程落地与避坑',
  'deep-research': 'Deep Research 深度研究',
  'code-generation': '代码生成与辅助编程',
  'eval-benchmarks': '大模型评测与基准',
  'multimodal-systems': '多模态系统实战',
  'ai-security': 'AI 安全与对抗防御'
};

export function parseFrontmatter(fileContent: string): { frontmatter: Record<string, any>; content: string } {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: fileContent };
  }

  const rawYaml = match[1];
  const content = match[2];
  const frontmatter: Record<string, any> = {};

  rawYaml.split(/\r?\n/).forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          frontmatter[key] = JSON.parse(val.replace(/'/g, '"'));
          return;
        } catch {
          frontmatter[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          return;
        }
      }
      if (!isNaN(Number(val)) && val !== '') {
        frontmatter[key] = Number(val);
        return;
      }
      frontmatter[key] = val;
    }
  });

  return { frontmatter, content };
}

export function formatMarkdown(article: {
  title: string;
  description: string;
  date: string;
  category: string;
  categoryName: string;
  tags: string[];
  author: string;
  readingTimeMinutes: number;
  content: string;
}): string {
  const tagsFormatted = JSON.stringify(article.tags);
  const header = `---
title: ${JSON.stringify(article.title)}
description: ${JSON.stringify(article.description)}
date: ${article.date}
category: ${JSON.stringify(article.category)}
categoryName: ${JSON.stringify(article.categoryName)}
tags: ${tagsFormatted}
author: ${article.author}
readingTimeMinutes: ${article.readingTimeMinutes}
---

`;
  return header + article.content.trim() + '\n';
}

export class ArticlesStore {
  private static instance: ArticlesStore;

  private constructor() {
    this.ensureBaseDirectories();
  }

  public static getInstance(): ArticlesStore {
    if (!ArticlesStore.instance) {
      ArticlesStore.instance = new ArticlesStore();
    }
    return ArticlesStore.instance;
  }

  private ensureBaseDirectories() {
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    const vitepressDir = path.join(DOCS_DIR, '.vitepress');
    if (!fs.existsSync(vitepressDir)) {
      fs.mkdirSync(vitepressDir, { recursive: true });
    }
  }

  /**
   * 动态扫描 docs/ 下所有内容分类目录（排除 .vitepress）
   */
  public getCategoryDirs(): string[] {
    this.ensureBaseDirectories();
    const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name);
  }

  public getAllArticles(): ArticleRecord[] {
    this.ensureBaseDirectories();
    const categoryDirs = this.getCategoryDirs();
    const articles: ArticleRecord[] = [];

    for (const cat of categoryDirs) {
      const dir = path.join(DOCS_DIR, cat);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(dir, file);
        const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const stat = fs.statSync(filePath);

        const { frontmatter, content } = parseFrontmatter(fileContent);
        const slug = file.replace(/\.md$/, '');
        const id = `${cat}-${slug}`;

        // 智能确定分类显示名称
        const catName = frontmatter.categoryName || KNOWN_CATEGORY_NAMES[cat] || cat.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

        articles.push({
          id,
          title: frontmatter.title || slug,
          slug,
          category: cat,
          categoryName: catName,
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [cat],
          summary: frontmatter.description || content.slice(0, 160).replace(/[#*`\n]/g, ' ').trim() + '...',
          author: frontmatter.author || 'AI Engineering Lab',
          date: String(frontmatter.date || new Date(stat.mtime).toISOString().split('T')[0]),
          filePath: relPath,
          readingTimeMinutes: Number(frontmatter.readingTimeMinutes) || Math.max(3, Math.round(content.length / 500)),
          rawContent: fileContent,
          createdAt: stat.birthtimeMs || stat.mtimeMs
        });
      }
    }

    return articles.sort((a, b) => b.createdAt - a.createdAt);
  }

  public getAllCategories(): CategoryInfo[] {
    const articles = this.getAllArticles();
    const map = new Map<string, { name: string; count: number }>();

    for (const art of articles) {
      const existing = map.get(art.category);
      if (existing) {
        existing.count++;
      } else {
        map.set(art.category, { name: art.categoryName, count: 1 });
      }
    }

    return Array.from(map.entries()).map(([slug, data]) => ({
      id: slug,
      name: data.name,
      dir: `docs/${slug}`,
      count: data.count
    }));
  }

  public getArticleById(id: string): ArticleRecord | null {
    const articles = this.getAllArticles();
    return articles.find(a => a.id === id || a.slug === id) || null;
  }

  /**
   * 保存文章并自动根据 AI 智能决定的分类进行持久化
   */
  public saveArticle(article: {
    title: string;
    description: string;
    category: string;
    categoryName?: string;
    tags: string[];
    author: string;
    readingTimeMinutes: number;
    slug: string;
    content: string;
  }): ArticleRecord {
    this.ensureBaseDirectories();

    const sanitizedCategory = article.category
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'practice';

    const categoryDisplayName = article.categoryName || KNOWN_CATEGORY_NAMES[sanitizedCategory] || sanitizedCategory;

    const catDir = path.join(DOCS_DIR, sanitizedCategory);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }

    const sanitizedSlug = article.slug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `article-${Date.now()}`;

    const filePath = path.join(catDir, `${sanitizedSlug}.md`);
    const today = new Date().toISOString().split('T')[0];

    const rawContent = formatMarkdown({
      title: article.title,
      description: article.description,
      date: today,
      category: sanitizedCategory,
      categoryName: categoryDisplayName,
      tags: article.tags,
      author: article.author || 'AI Engineering Lab',
      readingTimeMinutes: article.readingTimeMinutes || 6,
      content: article.content
    });

    fs.writeFileSync(filePath, rawContent, 'utf-8');

    // 动态重新同步 VitePress config.mts
    this.syncVitepressConfig();

    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const id = `${sanitizedCategory}-${sanitizedSlug}`;

    return {
      id,
      title: article.title,
      slug: sanitizedSlug,
      category: sanitizedCategory,
      categoryName: categoryDisplayName,
      tags: article.tags,
      summary: article.description,
      author: article.author || 'AI Engineering Lab',
      date: today,
      filePath: relPath,
      readingTimeMinutes: article.readingTimeMinutes || 6,
      rawContent,
      createdAt: Date.now()
    };
  }

  public deleteArticle(id: string): boolean {
    const article = this.getArticleById(id);
    if (!article) return false;

    const fullPath = path.resolve(process.cwd(), article.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      this.syncVitepressConfig();
      return true;
    }
    return false;
  }

  /**
   * 动态同步更新 docs/.vitepress/config.mts 中的导航与多级侧边栏
   */
  public syncVitepressConfig() {
    const articles = this.getAllArticles();

    // 动态聚合分类与对应文章
    const categoryMap = new Map<string, { name: string; items: { text: string; link: string }[] }>();

    for (const art of articles) {
      if (!categoryMap.has(art.category)) {
        categoryMap.set(art.category, {
          name: art.categoryName,
          items: []
        });
      }
      categoryMap.get(art.category)!.items.push({
        text: art.title,
        link: `/${art.category}/${art.slug}`
      });
    }

    // 构建动态导航项
    const navItems = [
      { text: '首页', link: '/' },
      ...Array.from(categoryMap.entries()).map(([slug, data]) => ({
        text: data.name,
        link: data.items[0]?.link || `/${slug}/`
      }))
    ];

    // 构建动态侧边栏映射
    const sidebarMap: Record<string, { text: string; items: { text: string; link: string }[] }[]> = {};
    for (const [slug, data] of categoryMap.entries()) {
      sidebarMap[`/${slug}/`] = [
        {
          text: data.name,
          items: data.items
        }
      ];
    }

    const configCode = `import { defineConfig } from 'vitepress';

// VitePress 核心配置文件 - 由 AI 自动归档系统根据收集内容动态维护
export default defineConfig({
  lang: 'zh-CN',
  title: 'Full-Stack AI 落地实践指南',
  description: '面向开发者的全栈 AI 落地实践知识库：LLM Agents、RAG 检索增强、前沿框架与工程避坑手册',
  
  themeConfig: {
    logo: '⚡',
    siteTitle: 'Full-Stack AI 落地指南',
    
    nav: ${JSON.stringify(navItems, null, 6)},

    sidebar: ${JSON.stringify(sidebarMap, null, 6)},

    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ],

    footer: {
      message: '基于 VitePress 与 Gemini AI 内容自动生成引擎构建',
      copyright: 'Copyright © 2026 AI Engineering Lab'
    }
  }
});
`;

    fs.writeFileSync(VITEPRESS_CONFIG_PATH, configCode, 'utf-8');
  }

  public getDocsTree(): DocsTreeNode {
    const buildNode = (dirPath: string, name: string): DocsTreeNode => {
      const isDir = fs.statSync(dirPath).isDirectory();
      if (!isDir) {
        const stat = fs.statSync(dirPath);
        return {
          name,
          path: path.relative(process.cwd(), dirPath).replace(/\\/g, '/'),
          type: 'file',
          size: stat.size,
          updatedAt: stat.mtime.toISOString()
        };
      }

      const files = fs.readdirSync(dirPath);
      const children: DocsTreeNode[] = [];

      for (const f of files) {
        if (f.startsWith('.') && f !== '.vitepress') continue;
        const full = path.join(dirPath, f);
        children.push(buildNode(full, f));
      }

      children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return {
        name,
        path: path.relative(process.cwd(), dirPath).replace(/\\/g, '/'),
        type: 'directory',
        children
      };
    };

    return buildNode(DOCS_DIR, 'docs');
  }

  public getRawFile(relPath: string): string | null {
    const resolved = path.resolve(process.cwd(), relPath);
    if (!resolved.startsWith(DOCS_DIR)) {
      return null;
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return fs.readFileSync(resolved, 'utf-8');
    }
    return null;
  }
}
