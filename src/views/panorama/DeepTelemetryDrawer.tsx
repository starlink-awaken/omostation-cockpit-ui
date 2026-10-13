import { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  GitBranch,
  Server,
  Activity,
  CheckCircle2,
  Network,
  Lock,
  Workflow,
} from 'lucide-react';
import type { GovernancePanoramaSourceState, PanoramaDisplayPayload } from '../../api/hooks/useGovernancePanorama';

export interface DeepTelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: PanoramaDisplayPayload;
  sourceState: GovernancePanoramaSourceState;
  sourceFailure: string | null;
  sourceObservedAt: string | null;
  sourceAgeMs: number | null;
  partialFacets?: string[];
}

export type DrawerTabId = 'knowledge' | 'hygiene' | 'runtime';

export function DeepTelemetryDrawer({ isOpen, onClose, data, sourceState, sourceFailure, sourceObservedAt, sourceAgeMs, partialFacets = [] }: DeepTelemetryDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTabId>('knowledge');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasVerifiedFacet = (facet: string) => {
    const observedState = data.facet_observations?.[facet]?.state;
    return observedState === 'LIVE' || observedState === 'PARTIAL'
      || sourceState === 'LIVE'
      || (sourceState === 'PARTIAL' && !partialFacets.includes(facet));
  };
  const knowledgeAvailable = hasVerifiedFacet('knowledge_health');
  const experienceAvailable = hasVerifiedFacet('experience_graph');
  const workspaceAvailable = hasVerifiedFacet('workspace');
  const launchdAvailable = hasVerifiedFacet('launchd_health');
  const connectorsAvailable = hasVerifiedFacet('connectors');
  const kh = knowledgeAvailable ? data.knowledge_health : undefined;
  const eg = experienceAvailable ? data.experience_graph : undefined;
  const ws = workspaceAvailable ? data.workspace : undefined;
  const workspaceObservation = data.facet_observations?.workspace;
  const ld = launchdAvailable ? data.launchd_health : undefined;
  const conn = connectorsAvailable ? data.connectors : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="系统深度遥测透视抽屉"
      className="fixed inset-0 z-50 flex justify-end animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:w-[560px] h-full bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col z-10 text-slate-200 overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                系统深度遥测透视
              </h2>
              <p className="text-xs text-slate-400">
                底层 70 项治理指标与环境底座感知
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭抽屉 (Esc)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sourceState !== 'LIVE' && (
          <div role="status" className="px-6 py-2 text-xs text-amber-200 bg-amber-950/40 border-b border-amber-500/30">
            遥测来源 {sourceState}：{sourceFailure ?? '未获得可验证数据。'} {sourceObservedAt ? `最后生成 ${sourceObservedAt}` : '最后生成时间未知'} {sourceAgeMs == null ? '' : `，来源年龄 ${Math.floor(sourceAgeMs / 60000)} 分钟`}。
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800/60 bg-slate-900/30">
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'knowledge'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>知识与经验图谱</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hygiene')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'hygiene'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>工作区与卫生</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('runtime')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'runtime'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>守护与连接器</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab 1: Knowledge & Experience */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              {/* Knowledge Health Overview */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  知识健康度指标 (Knowledge Health)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">总文档数</span>
                    <span className="text-lg font-bold text-white font-mono">{knowledgeAvailable ? kh?.total ?? 'UNKNOWN' : 'UNKNOWN'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">新鲜度 %</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      {knowledgeAvailable ? `${kh?.freshness_pct ?? 'UNKNOWN'}%` : 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">陈旧文档</span>
                    <span className="text-lg font-bold text-amber-400 font-mono">{knowledgeAvailable ? kh?.stale ?? 'UNKNOWN' : 'UNKNOWN'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-0.5">孤儿率 %</span>
                    <span className="text-lg font-bold text-slate-300 font-mono">{knowledgeAvailable ? `${kh?.orphan_pct ?? 'UNKNOWN'}%` : 'UNKNOWN'}</span>
                  </div>
                </div>
              </div>

              {/* Experience Graph & Network */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-cyan-400" />
                  经验图谱与连通性 (Experience Graph)
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">知识图谱连通性</span>
                      <span className="text-xl font-black text-cyan-300 font-mono">
                        {experienceAvailable ? `${eg?.connectivity_pct ?? 'UNKNOWN'}%` : 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">内部引用连接数</span>
                      <span className="text-xl font-black text-white font-mono">
                        {experienceAvailable ? eg?.internal_refs ?? 'UNKNOWN' : 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  {/* Hotspots by Type */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
                      各类型知识节点活跃分布
                    </span>
                    <div className="space-y-1.5">
                      {eg?.hotspots.map((item) => (
                        <div
                          key={item.type}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60"
                        >
                          <span className="capitalize font-mono text-slate-300">{item.type}</span>
                          <span className="font-bold text-cyan-400 font-mono">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Workspace & Hygiene */}
          {activeTab === 'hygiene' && (
            <div className="space-y-6">
              {/* Worktree Overview */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  {workspaceAvailable
                    ? `${workspaceObservation?.state === 'PARTIAL' ? '最近成功观察的' : '观察到的'} Worktree 条目 (${ws?.total_worktrees ?? 0})`
                    : 'Worktree 状态 (UNKNOWN)'}
                </h3>
                <div className="space-y-2">
                  {ws?.worktrees && ws.worktrees.length > 0 ? (
                    ws.worktrees.map((wt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                          <span>分支: {wt.branch || 'HEAD'}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            活跃
                          </span>
                        </div>
                        <p className="text-slate-400 truncate text-[11px]">{wt.path}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                      {workspaceAvailable ? '枚举结果不判断活跃度或清理安全性' : '来源未提供已验证的 Worktree 状态'}
                    </div>
                  )}
                </div>
              </div>

              {/* Locks & Remote Hygiene */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Workflow lock 文件枚举
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">观察到的 lock 文件数</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white font-mono">
                        {workspaceAvailable ? ws?.total_lock_files ?? 'UNKNOWN' : 'UNKNOWN'}
                      </span>
                      <span className="text-[11px] text-amber-300 font-semibold">{workspaceAvailable ? '未判断锁的存活或归属' : '锁文件枚举未验证'}</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Git Remote 规范性</span>
                    <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">未采集 Remote 状态</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Keepers & Connectors */}
          {activeTab === 'runtime' && (
            <div className="space-y-6">
              {/* Launchd Health */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-purple-400" />
                  {launchdAvailable ? `系统 Launchd 守护进程 (${ld?.jobs.length ?? 0})` : 'Launchd 状态 (UNKNOWN)'}
                </h3>
                <div className="space-y-2">
                  {ld?.jobs && ld.jobs.length > 0 ? (
                    ld.jobs.map((job) => (
                      <div
                        key={job.name}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800"
                      >
                        <div>
                          <span className="text-xs font-bold text-white block">{job.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{job.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right font-mono">
                          {job.pid && (
                            <span className="text-[10px] text-slate-400">PID: {job.pid}</span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              job.verdict === 'PASS'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                : job.verdict === 'FAILED'
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {job.verdict}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                      {launchdAvailable ? '无运行中的守护进程' : '来源未提供已验证的守护进程状态'}
                    </div>
                  )}
                </div>
              </div>

              {/* Scene Connectors */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-purple-400" />
                  {connectorsAvailable ? `场景系统连接器 (${conn?.total ?? 0})` : '连接器状态 (UNKNOWN)'}
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">{connectorsAvailable ? '已接线连接器:' : '连接器清单未验证'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {conn?.wired_to_scenes.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 rounded-md bg-purple-950/70 border border-purple-500/30 text-[11px] text-purple-300 font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">{connectorsAvailable ? '可用待接线:' : '连接器清单未验证'}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {conn?.unwired_available.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Cockpit BFF 治理投影 · 来源与新鲜度以 source provenance 为准</span>
          <span>按 Esc 或点击遮罩退出</span>
        </div>
      </div>
    </div>
  );
}

export default DeepTelemetryDrawer;
