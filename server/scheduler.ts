import { SchedulerStatus, SchedulerTaskStatus } from '../src/types/index.ts';
import { AIService } from './aiService.ts';
import { ArticlesStore } from './articlesStore.ts';

export class SchedulerManager {
  private static instance: SchedulerManager;
  // 自动化默认开启，每小时自动执行一次
  private enabled: boolean = true;
  private intervalMinutes: number = 60;
  private lastRunAt: number | null = null;
  private nextRunAt: number | null = null;
  private timer: NodeJS.Timeout | null = null;
  private isExecuting: boolean = false;

  private currentTask: SchedulerTaskStatus = {
    status: 'idle',
    progress: 0,
    stepDescription: '自动化巡检引擎运行中（每小时执行一次）',
    logs: [
      `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] [SCHEDULER] 全天候自动化调度引擎已默认启动（周期: 60 分钟），后台静默运行中。`
    ]
  };

  private aiService: AIService;

  private constructor() {
    this.aiService = new AIService();
    // 默认开启调度器定时器
    this.startScheduler();
  }

  public static getInstance(): SchedulerManager {
    if (!SchedulerManager.instance) {
      SchedulerManager.instance = new SchedulerManager();
    }
    return SchedulerManager.instance;
  }

  private startScheduler() {
    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.nextRunAt = Date.now() + intervalMs;
    this.addLog(`[SCHEDULER] 自动化定时任务已就绪，下次计划执行时间: ${new Date(this.nextRunAt).toLocaleTimeString('zh-CN')}`);

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.runCycle('cron');
    }, intervalMs);
  }

  public getStatus(): SchedulerStatus {
    const store = ArticlesStore.getInstance();
    const articles = store.getAllArticles();
    return {
      enabled: this.enabled,
      intervalMinutes: this.intervalMinutes,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      currentTask: { ...this.currentTask },
      totalGenerated: articles.length
    };
  }

  public toggle(enabled: boolean): SchedulerStatus {
    this.enabled = enabled;
    const now = Date.now();

    if (enabled) {
      this.startScheduler();
    } else {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.nextRunAt = null;
      this.addLog(`[SCHEDULER] 自动化定时调度已暂停。`);
    }

    return this.getStatus();
  }

  public async triggerNow(): Promise<{ success: boolean; message: string }> {
    if (this.isExecuting) {
      return { success: false, message: '已有生成任务正在执行中，请稍候...' };
    }
    this.runCycle('manual');
    return { success: true, message: '已触发后台即时生成流水线' };
  }

  private async runCycle(triggerType: 'cron' | 'manual') {
    if (this.isExecuting) return;
    this.isExecuting = true;
    const startTime = Date.now();
    const prefix = triggerType === 'cron' ? '[CRON-1H]' : '[MANUAL]';

    this.addLog(`${prefix} 触发 AI 内容与智能分类自动生成流水线...`);
    this.currentTask.status = 'searching';
    this.currentTask.progress = 10;
    this.currentTask.stepDescription = '正在检索前沿技术热点与素材情报...';

    try {
      const newArticle = await this.aiService.executeContentPipeline((step, progress, msg) => {
        this.currentTask.status = step as any;
        this.currentTask.progress = progress;
        this.currentTask.stepDescription = msg;
        this.addLog(`${prefix} [${step.toUpperCase()}] ${msg}`);
      });

      this.lastRunAt = Date.now();
      if (this.enabled) {
        this.nextRunAt = Date.now() + this.intervalMinutes * 60 * 1000;
      }

      this.currentTask.status = 'complete';
      this.currentTask.progress = 100;
      this.currentTask.stepDescription = `生成成功并完成分类归档: 《${newArticle.title}》 [${newArticle.categoryName}]`;
      this.currentTask.currentArticleTitle = newArticle.title;
      this.addLog(`${prefix} 耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s，文章已持久化归档至: ${newArticle.filePath}`);

      setTimeout(() => {
        if (!this.isExecuting) {
          this.currentTask.status = 'idle';
          this.currentTask.stepDescription = this.enabled ? '自动化巡检中，等待下一个周期' : '已暂停';
        }
      }, 5000);
    } catch (err: any) {
      this.currentTask.status = 'error';
      this.currentTask.error = err?.message || '生成流水线异常';
      this.addLog(`${prefix} [ERROR] 执行失败: ${err?.message || '未知错误'}`);
    } finally {
      this.isExecuting = false;
    }
  }

  private addLog(msg: string) {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const line = `[${time}] ${msg}`;
    this.currentTask.logs.push(line);
    if (this.currentTask.logs.length > 200) {
      this.currentTask.logs.shift();
    }
  }
}
