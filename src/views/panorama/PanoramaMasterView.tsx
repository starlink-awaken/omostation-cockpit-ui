import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Play,
  Pause,
  Clock,
  Database,
} from 'lucide-react';
import { GatesMatrixView } from './GatesMatrixView';
import { GuardianInspectionWallboard } from './GuardianInspectionWallboard';
import { SystemTopologyWallboard } from './SystemTopologyWallboard';
import { BcosEvolutionChainView } from './BcosEvolutionChainView';
import PanoramaHeroView from './PanoramaHeroView';
import { DeepTelemetryDrawer } from './DeepTelemetryDrawer';
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

const ROTATION_TABS: PanoramaTabId[] = ['gates', 'guardian', 'topology', 'bcos'];
const ROTATION_INTERVAL_MS = 25000;
const INTERACTION_PAUSE_MS = 12000;

export function PanoramaMasterView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as PanoramaTabId) || 'gates';
  const [activeTab, setActiveTab] = useState<PanoramaTabId>(initialTab);
  const [isWallboardMode, setIsWallboardMode] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState<boolean>(false);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isFallback } = useGovernancePanorama();

  // Show a toast message with automatic dismissal
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as PanoramaTabId;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = useCallback((tabId: PanoramaTabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  }, [setSearchParams]);

  // Handle user interaction pause for auto-rotation
  const registerUserInteraction = useCallback(() => {
    if (!isAutoRotate) return;
    setIsUserInteracting(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, INTERACTION_PAUSE_MS);
  }, [isAutoRotate]);

  // Auto-rotation timer effect
  useEffect(() => {
    if (!isAutoRotate || isUserInteracting) return;

    const timer = setInterval(() => {
      setActiveTab((current) => {
        const currentIndex = ROTATION_TABS.indexOf(current);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % ROTATION_TABS.length : 0;
        const nextTab = ROTATION_TABS[nextIndex];
        setSearchParams({ tab: nextTab });
        return nextTab;
      });
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isAutoRotate, isUserInteracting, setSearchParams]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // F: Toggle full wallboard mode
      if (e.key === 'f' || e.key === 'F') {
        setIsWallboardMode((prev) => {
          const next = !prev;
          showToast(next ? '已开启沉浸大屏模式 (按 F 退出)' : '已退出沉浸大屏模式');
          return next;
        });
        return;
      }

      // A: Toggle auto-rotation mode
      if (e.key === 'a' || e.key === 'A') {
        setIsAutoRotate((prev) => {
          const next = !prev;
          showToast(next ? '自动巡航轮播已开启 (25s 周期)' : '自动巡航轮播已暂停');
          return next;
        });
        return;
      }

      // D: Toggle deep telemetry drawer
      if (e.key === 'd' || e.key === 'D') {
        setIsTelemetryDrawerOpen((prev) => {
          const next = !prev;
          showToast(next ? '已开启深度遥测透视抽屉' : '已关闭深度遥测透视抽屉');
          return next;
        });
        return;
      }


      // Number keys 1-5: Direct tab switch
      const tabKeys: Record<string, PanoramaTabId> = {
        '1': 'gates',
        '2': 'guardian',
        '3': 'topology',
        '4': 'bcos',
        '5': 'macro',
      };

      if (tabKeys[e.key]) {
        const targetTab = tabKeys[e.key];
        handleTabChange(targetTab);
        const targetLabel = TABS.find((t) => t.id === targetTab)?.label || targetTab;
        showToast(`切换至: ${targetLabel}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange, showToast]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const totalGates = data?.gates?.length ?? 11;
  const passedGates = data?.gates?.filter((g) => g.verdict === 'PASS').length ?? 11;
  const healthScore = data?.guardian?.healthScore ?? 99.4;

  return (
    <div
      onMouseMove={registerUserInteraction}
      onClick={registerUserInteraction}
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

        {/* Quick Indicators, Auto-rotate & Wallboard Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs font-mono">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">健康度:</span>
            <strong className="text-emerald-300">{healthScore.toFixed(1)}%</strong>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">门禁:</span>
            <strong className="text-cyan-300">{passedGates}/{totalGates}</strong>
          </div>

          {/* Auto Rotation Button */}
          <button
            type="button"
            onClick={() => {
              setIsAutoRotate((prev) => {
                const next = !prev;
                showToast(next ? '自动巡航轮播已开启 (25s 周期)' : '自动巡航轮播已暂停');
                return next;
              });
            }}
            aria-label={isAutoRotate ? '暂停大屏轮播' : '开启大屏轮播'}
            aria-pressed={isAutoRotate}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAutoRotate
                ? isUserInteracting
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isAutoRotate ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{isUserInteracting ? '轮播挂起(交互中)' : '巡检轮播中 (按 A)'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>自动轮播 (按 A)</span>
              </>
            )}
          </button>

          {/* Deep Telemetry Drawer Button */}
          <button
            type="button"
            onClick={() => {
              setIsTelemetryDrawerOpen((prev) => !prev);
            }}
            aria-label="切换深度遥测抽屉"
            aria-expanded={isTelemetryDrawerOpen}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isTelemetryDrawerOpen
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>深度遥测 (按 D)</span>
          </button>

          {/* Wallboard Toggle Button */}

          <button
            type="button"
            onClick={() => {
              setIsWallboardMode((prev) => {
                const next = !prev;
                showToast(next ? '已开启沉浸大屏模式 (按 F 退出)' : '已退出沉浸大屏模式');
                return next;
              });
            }}
            aria-label="切换沉浸式大屏模式"
            aria-pressed={isWallboardMode}
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
      <div
        role="tablist"
        aria-label="治理全景视图选择"
        className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md overflow-x-auto"
      >
        <div className="flex items-center gap-2">
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 text-cyan-300 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-40 font-mono">[{idx + 1}]</span>
              </button>
            );
          })}
        </div>

        {/* Rotation indicator info */}
        {isAutoRotate && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>25s 自动轮巡</span>
          </div>
        )}
      </div>

      {/* Tab Panels */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="transition-all animate-fade-in focus:outline-none"
      >
        {activeTab === 'gates' && <GatesMatrixView />}
        {activeTab === 'guardian' && <GuardianInspectionWallboard />}
        {activeTab === 'topology' && <SystemTopologyWallboard />}
        {activeTab === 'bcos' && <BcosEvolutionChainView />}
        {activeTab === 'macro' && <PanoramaHeroView />}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-cyan-300 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-xs font-semibold animate-fade-in"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Deep Telemetry Drawer */}
      <DeepTelemetryDrawer
        isOpen={isTelemetryDrawerOpen}
        onClose={() => setIsTelemetryDrawerOpen(false)}
        data={data}
      />
    </div>
  );

}

export default PanoramaMasterView;
