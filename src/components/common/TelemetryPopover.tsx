import React, { useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Layers,
  Inbox
} from 'lucide-react';
import type { LiveTelemetryState } from '../../api/liveTelemetry';

export interface TelemetryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: LiveTelemetryState;
  onNavigate: (path: string) => void;
  onOpenGuardianInspection?: () => void;
}

export default function TelemetryPopover({
  isOpen,
  onClose,
  telemetry,
  onNavigate,
  onOpenGuardianInspection,
}: TelemetryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gates = telemetry?.gates || [];
  const passedGates = gates.filter(g => g.verdict === 'PASS').length;
  const snapshotLive = telemetry.snapshotState === 'LIVE';
  const snapshotState = telemetry.snapshotState ?? 'UNKNOWN';
  const bffState = telemetry.isLoading ? 'BFF CONNECTING' : telemetry.connected ? 'BFF READY' : 'BFF UNAVAILABLE';

  return (
    <div
      ref={popoverRef}
      className="absolute top-14 right-20 z-50 w-80 md:w-96 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl p-4 backdrop-blur-md text-slate-100 animate-fade-in space-y-4"
      role="region"
      aria-label="Cockpit 治理全景态势浮窗"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${telemetry.connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`} />
          <span className="font-bold text-xs tracking-wider uppercase text-white">Cockpit 治理全景</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {bffState}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${snapshotLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
          SNAPSHOT {snapshotState}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-slate-400 flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>算力显存</span>
          </div>
          <div className="font-bold font-mono text-white text-[11px] truncate">
            {snapshotLive ? telemetry.vramUsage : 'UNKNOWN'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="text-slate-400 flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>自愈心跳</span>
          </div>
          <div className="font-bold font-mono text-white text-[11px]">
            {snapshotLive && telemetry.guardianCadence > 0 ? `Guardian: ${telemetry.guardianCadence}s` : 'UNKNOWN'}
          </div>
        </div>
      </div>

      {/* 11 Gates Micro Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>全局门禁</span>
          </span>
          <span className={`font-mono font-semibold text-[11px] ${snapshotLive ? 'text-emerald-400' : 'text-amber-300'}`}>
            {snapshotLive ? `${passedGates}/${telemetry.gates.length} PASS` : 'UNKNOWN'}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
          {snapshotLive ? telemetry.gates.map((g) => (
            <div 
              key={g.id}
              title={`${g.id}: ${g.title} (${g.verdict})`}
              className="text-center py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {g.id}
            </div>
          )) : <span className="col-span-6 text-center text-[11px] text-amber-300">门禁快照不可用，当前状态未知</span>}
        </div>
      </div>

      {/* 3Y Bet Ledger Completion */}
      <div className="space-y-1 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>三年台账进度</span>
          </span>
          <span className={`font-mono font-bold text-[11px] ${snapshotLive ? 'text-indigo-400' : 'text-amber-300'}`}>
            {snapshotLive ? `${telemetry.betStats.done} / ${telemetry.betStats.total} (${telemetry.betStats.total > 0 ? Math.round((telemetry.betStats.done / telemetry.betStats.total) * 100) : 0}%)` : 'UNKNOWN'}
          </span>
        </div>
        {snapshotLive ? (
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-indigo-500 h-full" style={{ width: `${telemetry.betStats.total > 0 ? Math.min(100, Math.max(0, (telemetry.betStats.done / telemetry.betStats.total) * 100)) : 0}%` }} />
          </div>
        ) : <p className="mt-1 text-[10px] text-amber-300">快照不可用，完成率未验证</p>}
      </div>

      {/* Guardian Inspection Action */}
      {onOpenGuardianInspection && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenGuardianInspection();
          }}
          className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 font-medium text-xs shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>展开系统巡检视窗</span>
        </button>
      )}

      {/* Quick Navigation Footer */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate('/decision-inbox');
          }}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>决策箱</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigate('/panorama');
          }}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <span>进入全景座舱</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
