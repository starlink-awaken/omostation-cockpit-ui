/**
 * GuardianInspectionDrawer.tsx — Cockpit 治理投影巡检视窗
 *
 * All observations come from the Cockpit BFF query cache. Runtime streams,
 * audit timelines, and compliance summaries remain UNKNOWN until the BFF
 * provides provenance-bound fields for them.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Activity, 
  RefreshCw, 
  ChevronRight,
  ChevronDown,
  Terminal,
  Scale,
  Workflow,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useGovernancePanorama, type DisplayGateItem } from '../../api/hooks/useGovernancePanorama';

interface GuardianInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

type DrawerTab = 'sentinel' | 'harness' | 'ssot';

function gateVerdictBadgeClass(verdict: DisplayGateItem['verdict']): string {
  switch (verdict) {
    case 'PASS':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'FAIL':
    case 'BLOCKED':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    case 'WARN':
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    default:
      return 'bg-slate-700/50 text-slate-300 border-slate-600/60';
  }
}

function bffStatusBadgeClass(status: 'CONNECTING' | 'LIVE' | 'PARTIAL' | 'STALE' | 'UNKNOWN'): string {
  if (status === 'LIVE') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'PARTIAL' || status === 'STALE') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return 'bg-slate-700/50 text-slate-300 border-slate-600/60';
}

function guardianStatusBadgeClass(sourceState: string, guardianStatus: string): string {
  if (sourceState === 'STALE') return bffStatusBadgeClass('STALE');
  if (sourceState !== 'LIVE') return bffStatusBadgeClass('UNKNOWN');
  if (guardianStatus === 'active') return bffStatusBadgeClass('LIVE');
  if (guardianStatus === 'degraded') return bffStatusBadgeClass('PARTIAL');
  return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
}

export function GuardianInspectionDrawer({
  isOpen,
  onClose,
  onNavigate,
}: GuardianInspectionDrawerProps) {
  const panorama = useGovernancePanorama();
  const snapshotState = panorama.isFallback ? 'UNKNOWN' : panorama.sourceState;
  const gatesVerified = snapshotState !== 'UNKNOWN' && !panorama.partialFacets.includes('gates');
  const guardianVerified = snapshotState !== 'UNKNOWN' && !panorama.partialFacets.includes('guardian');
  const guardianCadence = guardianVerified && panorama.data.guardian.interval_seconds > 0
    ? panorama.data.guardian.interval_seconds
    : 0;
  const bffStatus = panorama.isLoading ? 'CONNECTING' : snapshotState;
  const guardianStatus = snapshotState === 'LIVE' && guardianVerified
    ? panorama.data.guardian.status.toUpperCase()
    : snapshotState === 'STALE' && guardianVerified
      ? 'STALE · HISTORY'
      : 'UNKNOWN';
  const gates = gatesVerified ? panorama.data.gates : [];
  const [selectedGate, setSelectedGate] = useState<DisplayGateItem | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>('sentinel');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleManualRecheck = () => {
    setIsRefreshing(true);
    void panorama.refetch().finally(() => setIsRefreshing(false));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="系统治理巡检视窗"
    >
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-2xl bg-slate-950 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Cockpit 治理巡检视窗
                  </h2>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${bffStatusBadgeClass(bffStatus)}`}>
                    BFF {bffStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Cockpit BFF 投影 · 仅展示已验证的治理字段
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualRecheck}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="触发即时复核"
                aria-label="触发即时复核"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="关闭抽屉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subsystem Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 px-5 pt-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('sentinel')}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'sentinel'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              哨兵门禁
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('harness')}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'harness'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              Harness 8阶段合规
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ssot')}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'ssot'
                  ? 'border-amber-500 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              SSOT 违规诊断
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'sentinel' && (
              <>
                {/* Top Pulse Status Banner */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      当前巡检状态
                    </span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded border ${guardianStatusBadgeClass(snapshotState, panorama.data.guardian.status)}`}>
                      {guardianStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">{snapshotState === 'STALE' ? '历史巡检周期' : '巡检周期'}</span>
                      <span className="text-white font-mono font-bold text-sm">
                        {guardianVerified && guardianCadence > 0 ? `${guardianCadence}s` : 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">最后心跳观测</span>
                      <span className="text-blue-400 font-mono font-bold text-xs">
                        {guardianVerified && panorama.data.guardian.last_heartbeat ? panorama.data.guardian.last_heartbeat : 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">主权显存</span>
                      <span className="text-indigo-400 font-mono font-bold text-sm truncate">
                        UNKNOWN
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Orthogonal Closed Loops */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    四大正交闭环回路
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p className="col-span-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-amber-200">
                      BFF 当前契约未提供回路脉冲；状态为 UNKNOWN。
                    </p>
                  </div>
                </div>

                {/* 11 Gates Inspection & Verification */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      11 大门禁巡检结果
                    </h3>
                    <span className="text-xs font-mono text-emerald-400">
                      {snapshotState === 'LIVE' && gatesVerified ? `${gates.filter((g) => g.verdict === 'PASS').length} / ${gates.length} PASS` : 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {gates.length === 0 && (
                      <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                        门禁字段未获当前验证，状态为 UNKNOWN。
                      </p>
                    )}
                    {gates.map((gate) => {
                      const isExpanded = selectedGate?.id === gate.id;
                      return (
                        <div
                          key={gate.id}
                          className="rounded-lg bg-slate-900/50 border border-slate-800/80 overflow-hidden text-xs transition-colors hover:border-slate-700"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedGate(isExpanded ? null : gate)}
                            className="w-full p-2.5 flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 text-center font-mono font-bold text-[11px] text-blue-400">
                                {gate.id}
                              </span>
                              <span className="text-slate-200 font-medium">{gate.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span data-testid={`gate-${gate.id}-badge`} className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-bold ${gateVerdictBadgeClass(gate.verdict)}`}>
                                {gate.verdict}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 bg-slate-950/40 space-y-2 text-[11px]">
                              <div className="text-slate-300">
                                <span className="text-slate-500 mr-2">裁决证据:</span>
                                {gate.detail}
                              </div>
                              {gate.depends_on && gate.depends_on.length > 0 && (
                                <div className="text-slate-400 flex items-center gap-1.5">
                                  <span className="text-slate-500">依赖前置:</span>
                                  {gate.depends_on.map((dep) => (
                                    <span key={dep} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                      {dep}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Inspection Timeline / Log Stream */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    最新巡检证据流水
                  </h3>
                  <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                    BFF 当前契约未提供可审计的巡检时间线；无法展示证据流水。
                  </p>
                </div>
              </>
            )}

            {activeTab === 'harness' && (
              <div className="space-y-5 animate-fade-in text-xs">
                {/* Harness Overview */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-indigo-400" />
                      Harness 8 阶段 DAG 全生命周期图谱
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold">
                      UNKNOWN
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11.5px] leading-relaxed">
                    BFF 当前契约没有 Harness 合规字段，不能从界面默认值推断全流程状态。
                  </p>
                </div>

                {/* 8-Stage DAG Flow */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    8 阶段状态机回路
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    <p className="col-span-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-amber-200">Harness 阶段状态 UNKNOWN。</p>
                  </div>
                </div>

                {/* 12 Chapters Compliance */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">12 章节合规扫描</span>
                    <span className="font-mono text-amber-300">UNKNOWN</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full rounded-full" style={{ width: '0%' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                    <div>准入安全与环境检查: UNKNOWN</div>
                    <div>规格完整性与契约: UNKNOWN</div>
                    <div>代码单测与边界审计: UNKNOWN</div>
                    <div>工作树隔离与污染防范: UNKNOWN</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ssot' && (
              <div className="space-y-5 animate-fade-in text-xs">
                {/* SSOT Vitality Banner */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      SSOT 真值与法规活性状态
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold">
                      UNKNOWN
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11.5px] leading-relaxed">
                    BFF 当前契约没有 SSOT 活性与违规诊断字段，不能从静态描述推断状态。
                  </p>
                </div>

                {/* Violation Inspection */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    当前违规诊断：UNKNOWN
                  </h4>
                  <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-200 space-y-1">
                    <div className="font-semibold">尚无可验证的 SSOT 诊断</div>
                    <div className="text-[11px] text-amber-300/80">需要 BFF 将带来源和新鲜度的诊断字段纳入统一契约。</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              数据源: Cockpit BFF /api/governance/panorama
            </span>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('/panorama');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
                >
                  进入全景全屏
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
