import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Lock,
  RefreshCw,
  Search,
  FileCode2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { useGatesMatrix } from '../../api/hooks/useGovernancePanorama';
import type { GateItem, GateVerdict } from '../../api/types/panorama';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/common/Toast';

export type GateFilterType = 'all' | 'abnormal' | 'passed';

export function GatesMatrixView() {
  const { gates, isLoading, isFallback, refetch } = useGatesMatrix();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<GateFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGates, setExpandedGates] = useState<Record<string, boolean>>({});

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showToast('门禁全量巡检完成，体系状态健康', 'success');
    } catch {
      showToast('门禁刷新失败，已维持上一快照', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleExpand = (gateId: string) => {
    setExpandedGates((prev) => ({
      ...prev,
      [gateId]: !prev[gateId],
    }));
  };

  // Metrics
  const totalCount = gates.length;
  const passedCount = gates.filter((g) => g.verdict === 'PASS').length;
  const warnCount = gates.filter((g) => g.verdict === 'WARN').length;
  const failCount = gates.filter((g) => g.verdict === 'FAIL').length;
  const blockedCount = gates.filter((g) => g.verdict === 'BLOCKED').length;
  const abnormalCount = warnCount + failCount + blockedCount;

  // Filtered Gates
  const filteredGates = gates.filter((gate) => {
    // Verdict filter
    if (filter === 'abnormal' && gate.verdict === 'PASS') return false;
    if (filter === 'passed' && gate.verdict !== 'PASS') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = gate.id.toLowerCase().includes(q);
      const matchName = gate.name.toLowerCase().includes(q);
      const matchDesc = gate.description?.toLowerCase().includes(q);
      const matchEvidence = gate.evidencePath?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchDesc && !matchEvidence) {
        return false;
      }
    }

    return true;
  });

  const getVerdictBadge = (verdict: GateVerdict) => {
    switch (verdict) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            通过 (PASS)
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            预警 (WARN)
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            阻断 (FAIL)
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-400 border border-purple-500/30">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            阻塞 (BLOCKED)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            等待 (PENDING)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              系统门禁全景矩阵
            </h2>
            {isFallback && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                静态容灾快照
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            严格覆盖 A1~A9、RF0、RC-DL 11 大宪法级系统门禁，实时把控工程、合规与运维三轴证据链
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="text-slate-400">共计 <strong className="text-slate-200">{totalCount}</strong> 项</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-medium">通过 {passedCount}</span>
            {abnormalCount > 0 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-red-400 font-medium">异常 {abnormalCount}</span>
              </>
            )}
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            aria-label="刷新门禁巡检"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors shadow-sm shadow-cyan-950"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '巡检中...' : '重新巡检'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-inner border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全部 ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('abnormal')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'abnormal'
                ? 'bg-red-500/20 text-red-300 font-semibold shadow-inner border border-red-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            仅异常 ({abnormalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('passed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'passed'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-inner border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            仅通过 ({passedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="搜索门禁 ID、名称或证据..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Gates Matrix Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Loading gates matrix...">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredGates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400" role="status">
          <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">未找到符合条件的门禁项目</p>
          <p className="mt-1 text-xs text-slate-500">可尝试调整筛选状态或重置搜索关键词</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGates.map((gate) => {
            const isExpanded = !!expandedGates[gate.id];
            return (
              <div
                key={gate.id}
                data-testid={`gate-card-${gate.id}`}
                className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 backdrop-blur-md transition-all group"
              >
                <div>
                  {/* Top: Gate ID and Verdict */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-black tracking-wider shadow-sm">
                        {gate.id}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {gate.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Exit Code: <code className="text-slate-400 font-mono">{gate.exitCode ?? 0}</code>
                        </p>
                      </div>
                    </div>
                    {getVerdictBadge(gate.verdict)}
                  </div>

                  {/* Description */}
                  {gate.description && (
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {gate.description}
                    </p>
                  )}

                  {/* Evidence Path */}
                  {gate.evidencePath && (
                    <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 font-mono truncate">
                      <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={gate.evidencePath}>
                        {gate.evidencePath}
                      </span>
                    </div>
                  )}

                  {/* Collapsible Details */}
                  {isExpanded && gate.details && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/90 text-xs text-slate-300 font-mono space-y-1">
                      <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">
                        判定依据 / 详细日志
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-400">
                        {gate.details}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Toggle */}
                {gate.details && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => toggleExpand(gate.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <span>收起详情</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>查看依据</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GatesMatrixView;
