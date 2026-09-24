import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Radio,
  Layers,
  Brain,
  Crown,
  Maximize2,
  Minimize2,
  Activity,
  Sparkles,
} from 'lucide-react';
import { GatesMatrixView } from './GatesMatrixView';
import { GuardianInspectionWallboard } from './GuardianInspectionWallboard';
import { SystemTopologyWallboard } from './SystemTopologyWallboard';
import { BcosEvolutionChainView } from './BcosEvolutionChainView';
import PanoramaHeroView from './PanoramaHeroView';
import { useGovernancePanorama } from '../../api/hooks/useGovernancePanorama';

export type PanoramaTabId = 'gates' | 'guardian' | 'topology' | 'bcos' | 'macro';

export interface PanoramaTabConfig {
  id: PanoramaTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: PanoramaTabConfig[] = [
  {
    id: 'gates',
    label: '门禁全景',
    icon: ShieldCheck,
    description: 'A1-A9、RF0、RC-DL 11 大宪法级系统门禁',
  },
  {
    id: 'guardian',
    label: '74s 哨兵大屏',
    icon: Radio,
    description: '持续心跳巡航、健康雷达与自愈流水线',
  },
  {
    id: 'topology',
    label: '架构拓扑',
    icon: Layers,
    description: '道法术器 4 阶图谱与唯一 Active S 槽位',
  },
  {
    id: 'bcos',
    label: 'BCOS 进化链',
    icon: Brain,
    description: '认知自愈、知识自蒸馏与世代结晶轨迹',
  },
  {
    id: 'macro',
    label: '执掌者总控',
    icon: Crown,
    description: '宏观驾驶舱视界、真值源流与夏明星签署通道',
  },
];

export function PanoramaMasterView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as PanoramaTabId) || 'gates';
  const [activeTab, setActiveTab] = useState<PanoramaTabId>(initialTab);
  const [isWallboardMode, setIsWallboardMode] = useState<boolean>(false);

  const { data, isFallback } = useGovernancePanorama();

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as PanoramaTabId;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tabId: PanoramaTabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Keyboard shortcut: press 'F' to toggle wallboard mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'f' || e.key === 'F') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        setIsWallboardMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalGates = data?.gates?.length ?? 11;
  const passedGates = data?.gates?.filter((g) => g.verdict === 'PASS').length ?? 11;
  const healthScore = data?.guardian?.healthScore ?? 99.4;

  return (
    <div
      className={`min-h-screen text-slate-100 transition-all ${
        isWallboardMode
          ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-6 md:p-10'
          : 'space-y-6'
      }`}
    >
      {/* Top Cockpit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-500/40 text-cyan-300 shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                织星体系全景控制舱
              </h1>
              {isFallback ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  静态容灾双模态
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  LIVE 实时遥测态
                </span>
              )}
            </div>
            <p className="mt-1 text-xs md:text-sm text-slate-400">
              单一人类总控入口 · 门禁矩阵 · 74s 哨兵巡航 · 道法术器 DFSQ 拓扑 · BCOS 认知进化
            </p>
          </div>
        </div>

        {/* Quick Indicators & Wallboard Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs font-mono">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">健康度:</span>
            <strong className="text-emerald-300">{healthScore.toFixed(1)}%</strong>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">门禁:</span>
            <strong className="text-cyan-300">{passedGates}/{totalGates}</strong>
          </div>

          <button
            type="button"
            onClick={() => setIsWallboardMode((prev) => !prev)}
            aria-label="切换沉浸式大屏模式"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isWallboardMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isWallboardMode ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>退出大屏 (按 F)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>沉浸大屏 (按 F)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 text-cyan-300 border border-cyan-500/40 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="transition-all">
        {activeTab === 'gates' && <GatesMatrixView />}
        {activeTab === 'guardian' && <GuardianInspectionWallboard />}
        {activeTab === 'topology' && <SystemTopologyWallboard />}
        {activeTab === 'bcos' && <BcosEvolutionChainView />}
        {activeTab === 'macro' && <PanoramaHeroView />}
      </div>
    </div>
  );
}

export default PanoramaMasterView;
