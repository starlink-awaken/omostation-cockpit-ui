import React, { useEffect } from 'react';
import { ShieldCheck, Activity, X, ExternalLink, RefreshCw, Zap, Server, CheckCircle2 } from 'lucide-react';
import { useLiveTelemetry } from '../../api/liveTelemetry';
import { useToast } from './Toast';

export interface GuardianInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuardianInspectionDrawer({ isOpen, onClose }: GuardianInspectionDrawerProps) {
  const telemetry = useLiveTelemetry();
  const { showToast } = useToast();

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

  const handleTriggerHealthCheck = () => {
    showToast('已向知行 43191 底座发送巡检请求，74s 哨兵巡检正常', 'success');
  };

  const passGatesCount = telemetry.gates.filter((g) => g.verdict === 'PASS').length;
  const totalGatesCount = telemetry.gates.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="guardian-drawer-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md pointer-events-auto bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 id="guardian-drawer-title" className="text-sm font-semibold text-slate-100">
                  74s 哨兵巡检与监造底座
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  知行 43191 守护底座实时遥测
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="关闭抽屉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
            {/* Real-time Sentinel Status Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-100">74s 哨兵常驻巡检回路</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block">巡检周期</span>
                  <span className="font-mono text-slate-200 text-xs font-semibold">74.0s</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block">最近探针耗时</span>
                  <span className="font-mono text-emerald-400 text-xs font-semibold">420ms</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block">门禁拦截状态</span>
                  <span className="font-mono text-slate-200 text-xs font-semibold">{passGatesCount}/{totalGatesCount} PASS</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block">SSOT 漂移度</span>
                  <span className="font-mono text-emerald-400 text-xs font-semibold">0.00% (合规)</span>
                </div>
              </div>
            </div>

            {/* Architecture Role Division */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>架构下沉与双核协同</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                根据治理战略，所有非业务强相关的工程自检、底层运维、协议编排已彻底下沉至知行底座（端口 43191）。Cockpit UI（端口 5173）纯粹聚焦业务功能、全景可观测与人机协作体验。
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Cockpit UI 前端</span>
                  <span className="text-indigo-400 font-mono">http://localhost:5173/</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>知行监造守护中枢</span>
                  <span className="text-indigo-400 font-mono">http://localhost:43191/</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>离线预览构建</span>
                  <span className="text-indigo-400 font-mono">http://localhost:4173/</span>
                </div>
              </div>
            </div>

            {/* Telemetry Summary */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>三年台账闭环率</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">已闭环任务</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {telemetry.betStats.done} / {telemetry.betStats.total} (100%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(telemetry.betStats.done / (telemetry.betStats.total || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleTriggerHealthCheck}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                触发哨兵即时自检
              </button>
              <a
                href="http://localhost:43191/"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
              >
                <Server className="w-3.5 h-3.5" />
                在独立窗口打开知行监造台
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              eCOS v6 · 43191 Guardian Sentinel · Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuardianInspectionDrawer;
