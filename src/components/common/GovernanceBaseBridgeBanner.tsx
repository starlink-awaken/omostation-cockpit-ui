import React from 'react';
import { ShieldCheck, ArrowRight, Activity } from 'lucide-react';

export interface GovernanceBaseBridgeBannerProps {
  workbenchName: string;
  sourceModule?: string;
  targetSection?: string;
  actionText?: string;
  onOpenDrawer?: () => void;
}

export function GovernanceBaseBridgeBanner({
  workbenchName,
  sourceModule = 'projects/cockpit',
  targetSection,
  actionText = '打开统一全景',
  onOpenDrawer,
}: GovernanceBaseBridgeBannerProps) {
  const handleOpenInspection = () => {
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      window.dispatchEvent(new CustomEvent('open-guardian-inspection'));
    }
  };

  const targetRoute = (() => {
    const section = targetSection?.replace(/^#/, '');
    if (section === 'swarm') return '/swarm';
    if (section === 'health') return '/observability';
    if (section === 'arch') return '/system-map';
    return '/panorama';
  })();

  return (
    <div className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 text-sm">{workbenchName}</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              织星统一控制台
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({sourceModule})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            在统一控制台查看治理与运行状态；每项数据均保留来源和更新时间。
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleOpenInspection}
          className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          查看系统巡检
        </button>
        <a
          href={targetRoute}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-500/30 cursor-pointer"
        >
          {actionText}
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default GovernanceBaseBridgeBanner;
