import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileText, ChevronRight, ChevronDown, 
  Copy, Check, Download, RefreshCw, FileCode, Info 
} from 'lucide-react';
import { DocsTreeNode } from '../types/index.ts';
import { fetchDocsTree, fetchFileContent } from '../utils/api.ts';

interface FileTreeExplorerViewProps {
  initialSelectedPath?: string | null;
  onSelectArticlePath?: (path: string) => void;
}

export const FileTreeExplorerView: React.FC<FileTreeExplorerViewProps> = ({
  initialSelectedPath,
  onSelectArticlePath
}) => {
  const [tree, setTree] = useState<DocsTreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>(initialSelectedPath || 'docs/.vitepress/config.mts');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [loadingTree, setLoadingTree] = useState<boolean>(false);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    'docs': true,
    'docs/.vitepress': true,
    'docs/agents': true,
    'docs/rag': true,
    'docs/frameworks': true,
    'docs/practice': true
  });
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  // 加载目录树
  const loadTree = async () => {
    setLoadingTree(true);
    try {
      const data = await fetchDocsTree();
      setTree(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  // 当外部传入 initialSelectedPath 变化时同步更新
  useEffect(() => {
    if (initialSelectedPath) {
      setSelectedPath(initialSelectedPath);
    }
  }, [initialSelectedPath]);

  // 加载选中文件内容
  useEffect(() => {
    if (!selectedPath) return;
    setLoadingFile(true);
    fetchFileContent(selectedPath)
      .then(res => {
        setFileContent(res.content);
      })
      .catch(err => {
        setFileContent(`// 读取文件失败: ${err.message}`);
      })
      .finally(() => {
        setLoadingFile(false);
      });
  }, [selectedPath]);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => ({
      ...prev,
      [dirPath]: !prev[dirPath]
    }));
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(selectedPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(fileContent);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  // 渲染递归树节点
  const renderNode = (node: DocsTreeNode, depth = 0) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedDirs[node.path] ?? true;
    const isSelected = selectedPath === node.path;

    return (
      <div key={node.path}>
        <div 
          onClick={() => {
            if (isDir) {
              toggleDir(node.path);
            } else {
              setSelectedPath(node.path);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center gap-2 py-1.5 pr-2 rounded-md cursor-pointer text-xs font-mono transition-colors ${
            isSelected 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {isDir ? (
            <>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" />
              <FileText className={`w-3.5 h-3.5 shrink-0 ${node.name.endsWith('.mts') ? 'text-sky-500' : 'text-slate-400'}`} />
            </>
          )}

          <span className="truncate">{node.name}</span>

          {node.size !== undefined && (
            <span className="ml-auto text-[10px] text-slate-400 font-normal">
              {(node.size / 1024).toFixed(1)}k
            </span>
          )}
        </div>

        {isDir && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* VitePress 规范说明横幅 */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-slate-100">标准 VitePress 工程落地规范：</span>
            所有 AI 生成的文章将直接保存至 <code className="px-1 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono">docs/&lt;category&gt;/&lt;slug&gt;.md</code>，并同步更新 <code className="px-1 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono">docs/.vitepress/config.mts</code> 侧边栏，支持直接执行 <code className="font-mono">npx vitepress build</code>。
          </div>
        </div>
        <button
          onClick={loadTree}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer shadow-2xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingTree ? 'animate-spin' : ''}`} />
          <span>刷新目录</span>
        </button>
      </div>

      {/* 双栏查看器：左侧目录树，右侧代码预览 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        
        {/* 左侧文件树 */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3 px-2 flex items-center justify-between">
            <span>工程文件目录树</span>
            <span className="text-[10px] text-slate-400 font-mono">docs /</span>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {tree ? (
              renderNode(tree)
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">正在扫描文件系统...</div>
            )}
          </div>
        </div>

        {/* 右侧文件源码查看器 */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          
          {/* 文件头信息栏 */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-800 dark:text-slate-200 truncate">
              <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold truncate">{selectedPath}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyPath}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer px-2 py-1 rounded-sm hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                title="复制文件相对路径"
              >
                {copiedPath ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPath ? '已复制路径' : '复制路径'}</span>
              </button>

              <button
                onClick={handleCopyContent}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer px-2 py-1 rounded-sm hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                title="复制文件全部代码"
              >
                {copiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedContent ? '已复制代码' : '复制代码'}</span>
              </button>
            </div>
          </div>

          {/* 代码视图 */}
          <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-auto max-h-[500px] text-slate-300 leading-relaxed scrollbar-thin">
            {loadingFile ? (
              <div className="py-12 text-center text-slate-500">正在读取文件内容...</div>
            ) : (
              <pre className="whitespace-pre-wrap">{fileContent || '// 空文件'}</pre>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
