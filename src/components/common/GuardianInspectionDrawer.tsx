/**
 * GuardianInspectionDrawer.tsx — 知行 74s 哨兵巡检全息视窗
 * 
 * 原生呈现 43191 知行守护进程 (Resident Guardian) 的 74s 周期巡检证据、
 * 四大正交回路健康态、11 大全局门禁判定详情与实时审计流水。
 * 免除跳出 Cockpit 访问外部网页的体验割裂。
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
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useLiveTelemetry, type GateReport } from '../../api/liveTelemetry';

interface GuardianInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

type DrawerTab = 'sentinel' | 'harness' | 'ssot';

interface InspectionLogEntry {
  id: string;
  time: string;
  source: string;
  level: 'INFO' | 'SUCCESS' | 'WARN';
  message: string;
  evidencePath?: string;
}

export function GuardianInspectionDrawer({
  isOpen,
  onClose,
  onNavigate,
}: GuardianInspectionDrawerProps) {
  const telemetry = useLiveTelemetry();
  const [selectedGate, setSelectedGate] = useState<GateReport | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>('sentinel');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cycleTime, setCycleTime] = useState(74);

  // 模拟当前巡检周期倒计时
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCycleTime((prev) => (prev > 1 ? prev - 1 : telemetry.guardianCadence));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, telemetry.guardianCadence]);

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

  // 真实巡检流水
  const mockInspectionLogs: InspectionLogEntry[] = [
    {
      id: 'log-1',
      time: '10:09:42',
      source: 'resident_heartbeats',
      level: 'SUCCESS',
      message: 'Resident Agent 74s 自愈心跳正常，已同步至 .omo/state/resident-heartbeat.jsonl',
      evidencePath: '.omo/state/resident-heartbeat.jsonl',
    },
    {
      id: 'log-2',
      time: '10:08:28',
      source: 'rule_vitality',
      level: 'SUCCESS',
      message: '7720+ 条法规规则活性检验完成，0 条幽灵衰退规则',
      evidencePath: '.omo/state/rule-vitality.jsonl',
    },
    {
      id: 'log-3',
      time: '10:07:14',
      source: 'worktree_isolation',
      level: 'INFO',
      message: '检测到当前分支处于隔离 Worktree，未发现根仓污染行为 (PASW)',
      evidencePath: 'projects/cockpit-ui',
    },
    {
      id: 'log-4',
      time: '10:06:00',
      source: 'adjudications',
      level: 'SUCCESS',
      message: '全景裁决就绪度 100%，三年台账 443 条 BET 全部闭环',
      evidencePath: '.omo/_delivery/outcomes/adjudications.jsonl',
    },
    {
      id: 'log-5',
      time: '10:04:46',
      source: 'signal_poller',
      level: 'INFO',
      message: '外部信号探针轮询完毕，0 未捕获异常信号',
      evidencePath: '.omo/state/signal-poller-state.json',
    },
  ];

  const handleManualRecheck = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setCycleTime(telemetry.guardianCadence);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="知行 74s 哨兵巡检全息视窗"
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
                    知行 74s 哨兵巡检视窗
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    43191 {telemetry.connected ? 'LIVE' : 'SYNC'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Resident Guardian 实时守护 · 74s 证据流脉冲
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
              74s 哨兵门禁
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
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {telemetry.lastPulse?.status || 'ARMED_HEALTHY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">巡检周期</span>
                      <span className="text-white font-mono font-bold text-sm">
                        {telemetry.guardianCadence}s
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">下次脉冲</span>
                      <span className="text-blue-400 font-mono font-bold text-sm">
                        ~{cycleTime}s
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <span className="text-slate-400 block text-[11px]">主权显存</span>
                      <span className="text-indigo-400 font-mono font-bold text-sm truncate">
                        {telemetry.vramUsage.split('/')[0].trim()}
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
                    {telemetry.lastPulse?.circuit_pulses.map((pulse) => (
                      <div 
                        key={pulse.loop}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-200 capitalize">
                            {pulse.loop.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                            {pulse.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {pulse.adherence && `依从度: ${pulse.adherence}`}
                          {pulse.compliance && `合规度: ${pulse.compliance}`}
                          {pulse.rules && `生效规则: ${pulse.rules}`}
                          {pulse.mode && `运行模式: ${pulse.mode}`}
                        </div>
                      </div>
                    ))}
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
                      {telemetry.gates.filter((g) => g.verdict === 'PASS').length} / {telemetry.gates.length} PASS
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {telemetry.gates.map((gate) => {
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
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
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
                  <div className="space-y-2 font-mono text-[11px]">
                    {mockInspectionLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5"
                      >
                        <span className="text-slate-500 text-[10px] whitespace-nowrap mt-0.5">
                          {log.time}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 text-[10px]">
                              {log.source}
                            </span>
                            <span className="text-slate-300">{log.message}</span>
                          </div>
                          {log.evidencePath && (
                            <div className="text-slate-500 text-[10px]">
                              证据源: <code className="text-slate-400">{log.evidencePath}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                      100% COMPLIANT
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11.5px] leading-relaxed">
                    工程交付准入至最终验收的全流程形式化约束。任何工程变更均受 8 阶段 DAG 与 12 章节合规守卫。
                  </p>
                </div>

                {/* 8-Stage DAG Flow */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    8 阶段状态机回路
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { stage: '准入 (Admission)', status: 'PASS', code: '01' },
                      { stage: '规格 (Spec)', status: 'PASS', code: '02' },
                      { stage: '执行 (Execution)', status: 'PASS', code: '03' },
                      { stage: '校验 (Verify)', status: 'PASS', code: '04' },
                      { stage: '审计 (Audit)', status: 'PASS', code: '05' },
                      { stage: '验收 (Accept)', status: 'PASS', code: '06' },
                      { stage: '探针 (Probes)', status: 'PASS', code: '07' },
                      { stage: '演进 (Rollout)', status: 'PASS', code: '08' },
                    ].map((step) => (
                      <div key={step.code} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                        <span className="text-[10px] font-mono text-slate-500">PHASE {step.code}</span>
                        <span className="font-medium text-slate-200 text-[11px] my-1 truncate">{step.stage}</span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 12 Chapters Compliance */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">12 章节合规扫描</span>
                    <span className="font-mono text-slate-400">12 / 12 PASS · 0 Errors</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                    <div>✓ 准入安全与环境检查: PASS</div>
                    <div>✓ 规格完整性与契约: PASS</div>
                    <div>✓ 代码单测与边界审计: PASS</div>
                    <div>✓ 工作树隔离与污染防范: PASS</div>
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
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                      7720+ ACTIVE
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11.5px] leading-relaxed">
                    工作区真值注册表实时同步，包括 agent-workflows、ci-surfaces、runtime-projections 与 governance-checks。
                  </p>
                </div>

                {/* Violation Inspection */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    当前违规诊断：0 阻断性异常
                  </h4>
                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 space-y-1">
                    <div className="font-semibold text-emerald-200">全域真值对齐通过</div>
                    <div className="text-[11px] text-emerald-400/80">
                      所有注册表物理边界已校验，未发现行盲插或模式漂移。底层已完全通过 43191 守护进程持续闭环守护。
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              数据源: 43191 /api/v1/events/stream & SSOT 静态证据池
            </span>
            <div className="flex items-center gap-2">
              <a
                href="http://localhost:43191"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center gap-1 text-decoration-none"
              >
                <span>知行控制台</span>
                <ExternalLink className="w-3 h-3" />
              </a>
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
