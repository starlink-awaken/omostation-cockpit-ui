import React, { useState } from 'react';
import {
  Sparkles,
  GitCommit,
  Brain,
  RefreshCw,
  Clock,
  TrendingUp,
  BookmarkCheck,
} from 'lucide-react';
import { useBcosEvolution } from '../../api/hooks/useGovernancePanorama';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/common/Toast';

export function BcosEvolutionChainView() {
  const { bcos, isLoading, isFallback, refetch } = useBcosEvolution();
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showToast('BCOS 进化图谱与自蒸馏记忆已同步', 'success');
    } catch {
      showToast('进化数据刷新失败，已使用快照', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const records = bcos?.recentRecords ?? [];
  const epoch = bcos?.epoch ?? 24;
  const healthScore = bcos?.healthScore ?? 98.7;
  const distillationCount = bcos?.selfDistillationCount ?? 142;

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top Banner & Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#111827]/80 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              BCOS 主权进化链与学习图谱
            </h2>
            {isFallback && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                静态容灾快照
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            全域知识结晶、MOS 踩坑信念反向萃取与认知操作系统自治自进化轨迹
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            aria-label="刷新进化图谱"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '计算中...' : '刷新进化链'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="status" aria-label="Loading bcos metrics...">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Current Epoch */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-[#111827]/80 to-slate-900/90 border border-purple-500/30 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
              <span>当前主权进化世代</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                Epoch {epoch}
              </span>
              <span className="text-xs text-purple-400 font-medium">当前代</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              知识自净化与行为决策策略已稳固
            </div>
          </div>

          {/* Distillation Count */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>自蒸馏知识结晶条目</span>
              <BookmarkCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono">
                {distillationCount}
              </span>
              <span className="text-xs text-cyan-400 font-medium">条结晶记忆</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              包含 12 章节 Harness 与踩坑护栏
            </div>
          </div>

          {/* Health Score */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>认知自愈指数</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono">
                {healthScore.toFixed(1)}%
              </span>
              <span className="text-xs text-emerald-400 font-medium">高抗干扰</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              学习率: <code className="text-slate-400 font-mono">{bcos?.learningRate ?? 0.001}</code>
            </div>
          </div>
        </div>
      )}

      {/* Evolution Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            历史进化里程碑时间轴
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            共记录 {records.length} 个核心世代
          </span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            暂无历史进化记录
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {records.map((rec) => (
              <div
                key={rec.id}
                data-testid={`evolution-record-${rec.id}`}
                className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all"
              >
                <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-950 shadow-sm" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30 font-mono">
                      Epoch {rec.epoch}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {rec.summary}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    影响范围: <span className="text-cyan-400 font-mono text-[11px]">{rec.impactScope}</span>
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 font-mono shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {rec.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BcosEvolutionChainView;
