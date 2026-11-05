import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Clock, Sparkles, Terminal as TerminalIcon, 
  Search, ExternalLink, Trash2, CheckCircle2, AlertCircle, 
  Copy, RefreshCw, FileText, Cpu, Bot, ShieldCheck, ArrowRight, BookOpen
} from 'lucide-react';
import { ArticleCategory, ArticleRecord, CATEGORIES, SchedulerStatus } from '../types/index.ts';

interface ConsoleViewProps {
  schedulerStatus: SchedulerStatus | null;
  onToggleScheduler: (enabled: boolean) => void;
  onTriggerGenerate: () => void;
  isGenerating: boolean;
  articles: ArticleRecord[];
  onSelectArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  onViewFile: (path: string) => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  schedulerStatus,
  onToggleScheduler,
  onTriggerGenerate,
  isGenerating,
  articles,
  onSelectArticle,
  onDeleteArticle,
  onViewFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [copiedLog, setCopiedLog] = useState(false);
  const [countdownText, setCountdownText] = useState<string>('--:--');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const isEnabled = schedulerStatus?.enabled ?? false;
  const currentTask = schedulerStatus?.currentTask;

  // 倒计时计算逻辑
  useEffect(() => {
    if (!isEnabled || !schedulerStatus?.nextRunAt) {
      setCountdownText('已暂停');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, (schedulerStatus.nextRunAt || now) - now);
      if (diff <= 0) {
        setCountdownText('即将执行...');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdownText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isEnabled, schedulerStatus?.nextRunAt]);

  // 日志自动滚动到底部
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentTask?.logs]);

  // 复制终端日志
  const handleCopyLogs = () => {
    if (!currentTask?.logs) return;
    navigator.clipboard.writeText(currentTask.logs.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  // 筛选文章
  const filteredArticles = articles.filter(a => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchQuery = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  // 分类统计
  const categoryCounts = {
    agents: articles.filter(a => a.category === 'agents').length,
    rag: articles.filter(a => a.category === 'rag').length,
    frameworks: articles.filter(a => a.category === 'frameworks').length,
    practice: articles.filter(a => a.category === 'practice').length
  };

  const pipelineStages = [
    { key: 'searching', label: '1. 检索热点素材', desc: 'Google Search 探索最新落地痛点' },
    { key: 'writing', label: '2. 深度正文撰写', desc: 'Gemini 3.8 Flash 输出实操代码与分析' },
    { key: 'diagramming', label: '3. 矢量插图绘制', desc: '生成响应式 SVG 架构交互流程图' },
    { key: 'indexing', label: '4. 智能分类判定', desc: '分析文章核心特征并打标' },
    { key: 'complete', label: '5. VitePress 落地', desc: '更新 docs/ 目录与 config.mts' }
  ];

  const getStageStatus = (stageKey: string) => {
    if (!currentTask) return 'pending';
    const status = currentTask.status;
    if (status === 'error') return 'error';
    if (status === 'idle') return 'pending';
    if (status === 'complete') return 'finished';

    const order = ['searching', 'writing', 'diagramming', 'indexing', 'complete'];
    const currentIdx = order.indexOf(status);
    const thisIdx = order.indexOf(stageKey);

    if (thisIdx < currentIdx) return 'finished';
    if (thisIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部三栏指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 卡片 1: 定时调度引擎控制 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">自动化引擎调度</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
                <span>每小时自动巡检</span>
                <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              </div>
            </div>

            {/* 开关 Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {isEnabled ? '运行中' : '已暂停'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => onToggleScheduler(!isEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>下次计划执行：</span>
            </div>
            <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {countdownText}
            </div>
          </div>
        </div>

        {/* 卡片 2: 知识库落地统计 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">已归档技术文档</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {articles.length} <span className="text-xs font-normal text-slate-500">篇 Markdown</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1 text-[11px] text-center text-slate-600 dark:text-slate-400">
            <div>
              <div className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{categoryCounts.agents}</div>
              <div className="text-[10px] text-slate-400">Agents</div>
            </div>
            <div>
              <div className="font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">{categoryCounts.rag}</div>
              <div className="text-[10px] text-slate-400">RAG</div>
            </div>
            <div>
              <div className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">{categoryCounts.frameworks}</div>
              <div className="text-[10px] text-slate-400">框架</div>
            </div>
            <div>
              <div className="font-mono tabular-nums font-semibold text-purple-600 dark:text-purple-400">{categoryCounts.practice}</div>
              <div className="text-[10px] text-slate-400">实战</div>
            </div>
          </div>
        </div>

        {/* 卡片 3: AI 流水线状态与快捷触发 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">生成模型与引擎</div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <span>Gemini 3.8 Flash</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                Google Search
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">插图格式: 响应式 SVG 架构图</span>
            <button
              onClick={onTriggerGenerate}
              disabled={isGenerating}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? '生成运行中...' : '即刻生成 →'}
            </button>
          </div>
        </div>

      </div>

      {/* 流水线阶段执行监控 (Pipeline Tracker) */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              流水线执行看板
            </h3>
            {isGenerating && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                正在实时处理
              </span>
            )}
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            进度: <span className="text-slate-900 dark:text-slate-100 font-semibold">{currentTask?.progress || 0}%</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${currentTask?.progress || 0}%` }}
          />
        </div>

        {/* 步骤节点卡片横排 */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
          {pipelineStages.map((stage) => {
            const status = getStageStatus(stage.key);
            let borderClass = 'border-slate-200 dark:border-slate-800';
            let bgClass = 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-400';
            let icon = <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />;

            if (status === 'finished') {
              borderClass = 'border-emerald-500/40';
              bgClass = 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300';
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            } else if (status === 'active') {
              borderClass = 'border-sky-500 ring-1 ring-sky-500/30';
              bgClass = 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200';
              icon = <RefreshCw className="w-3.5 h-3.5 text-sky-500 animate-spin" />;
            }

            return (
              <div 
                key={stage.key}
                className={`p-3 rounded-lg border ${borderClass} ${bgClass} transition-all`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {icon}
                  <span>{stage.label}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight line-clamp-1">
                  {stage.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* 状态描述 */}
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 pt-1">
          <span className="font-medium text-slate-800 dark:text-slate-200">当前动作：</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{currentTask?.stepDescription || '系统待机中'}</span>
        </div>
      </div>

      {/* 终端实时运行日志面板 */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 overflow-hidden shadow-md">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">实时控制台调度日志 (Execution Logs)</span>
          </div>
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>{copiedLog ? '已复制' : '复制日志'}</span>
          </button>
        </div>

        <div className="p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
          {currentTask?.logs && currentTask.logs.length > 0 ? (
            currentTask.logs.map((log, index) => {
              const isError = log.includes('[ERROR]');
              const isSuccess = log.includes('归档至') || log.includes('成功');
              const isCron = log.includes('[CRON');

              return (
                <div 
                  key={index}
                  className={`leading-relaxed whitespace-pre-wrap ${
                    isError 
                      ? 'text-rose-400' 
                      : isSuccess 
                      ? 'text-emerald-400' 
                      : isCron 
                      ? 'text-sky-300' 
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              );
            })
          ) : (
            <div className="text-slate-600 italic">暂无日志输出...</div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* 文章归档管理列表 */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        
        {/* 表格工具栏 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              VitePress 落地文档清单
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredArticles.length} / {articles.length})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 分类过滤器 */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                  selectedCategory === 'all' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                全部
              </button>
              {(Object.keys(CATEGORIES) as ArticleCategory[]).map(catKey => (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer ${
                    selectedCategory === catKey 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-medium' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {CATEGORIES[catKey].name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索标题、标签或关键字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* 高密度数据表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-4">文章标题与摘要</th>
                <th className="py-2.5 px-4 w-32">所属分类</th>
                <th className="py-2.5 px-4 w-48">核心标签</th>
                <th className="py-2.5 px-4 w-28">落地路径</th>
                <th className="py-2.5 px-4 w-24">日期</th>
                <th className="py-2.5 px-4 w-28 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => {
                  const catInfo = CATEGORIES[article.category] || CATEGORIES.agents;

                  return (
                    <tr 
                      key={article.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 标题 */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectArticle(article.id)}
                          className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {article.title}
                        </button>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {article.summary}
                        </div>
                      </td>

                      {/* 分类 (遵循零胶囊原则：纯净无框文本 + 点分隔) */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {catInfo.name}
                      </td>

                      {/* 标签 */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {article.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="text-[11px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 落地路径 */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <button 
                          onClick={() => onViewFile(article.filePath)}
                          className="hover:text-sky-500 hover:underline cursor-pointer"
                          title="在目录树中查看 Markdown 源码"
                        >
                          {article.filePath.replace('docs/', '')}
                        </button>
                      </td>

                      {/* 日期 */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 text-[11px]">
                        {article.date}
                      </td>

                      {/* 操作按钮 */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectArticle(article.id)}
                            className="p-1 rounded-sm text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="在 VitePress 阅读器中查看"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteArticle(article.id)}
                            className="p-1 rounded-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="删除文章及文件"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    未找到匹配的文章文档
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
