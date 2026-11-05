import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { ArticlesStore } from './server/articlesStore.ts';
import { SchedulerManager } from './server/scheduler.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

const store = ArticlesStore.getInstance();
const scheduler = SchedulerManager.getInstance();

// ----------------- API 路由 -----------------

// 获取调度器状态与日志
app.get('/api/scheduler/status', (req: Request, res: Response) => {
  res.json(scheduler.getStatus());
});

// 开启 / 关闭每小时定时任务
app.post('/api/scheduler/toggle', (req: Request, res: Response) => {
  const { enabled } = req.body;
  const status = scheduler.toggle(Boolean(enabled));
  res.json(status);
});

// 手动立即触发一次生成
app.post('/api/scheduler/trigger', async (req: Request, res: Response) => {
  const result = await scheduler.triggerNow();
  res.json(result);
});

// 获取所有分类列表 (含动态生成的分类)
app.get('/api/categories', (req: Request, res: Response) => {
  const categories = store.getAllCategories();
  res.json(categories);
});

// 获取所有文章列表
app.get('/api/articles', (req: Request, res: Response) => {
  const articles = store.getAllArticles();
  res.json(articles);
});

// 获取单篇文章详情
app.get('/api/articles/:id', (req: Request, res: Response) => {
  const article = store.getArticleById(req.params.id);
  if (!article) {
    res.status(404).json({ error: '文章不存在' });
    return;
  }
  res.json(article);
});

// 删除文章
app.delete('/api/articles/:id', (req: Request, res: Response) => {
  const success = store.deleteArticle(req.params.id);
  if (!success) {
    res.status(404).json({ error: '文章不存在或删除失败' });
    return;
  }
  res.json({ success: true, message: '文章已从磁盘删除并同步更新 VitePress 侧边栏' });
});

// 获取 VitePress 目录树
app.get('/api/docs/tree', (req: Request, res: Response) => {
  const tree = store.getDocsTree();
  res.json(tree);
});

// 获取任意文档或配置文件的原始内容 (如 docs/.vitepress/config.mts)
app.get('/api/docs/file', (req: Request, res: Response) => {
  const relPath = req.query.path as string;
  if (!relPath) {
    res.status(400).json({ error: '必须指定 path 参数' });
    return;
  }
  const content = store.getRawFile(relPath);
  if (content === null) {
    res.status(404).json({ error: '文件不存在或超出文档目录边界' });
    return;
  }
  res.json({ path: relPath, content });
});

// ----------------- Vite 集成 -----------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // 开发模式：挂载 Vite 中间件
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // 生产模式：提供静态打包资源
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] VitePress AI 系统全栈服务已在 http://0.0.0.0:${PORT} 启动`);
  });
}

startServer().catch(err => {
  console.error('[SERVER] 服务启动失败:', err);
});
