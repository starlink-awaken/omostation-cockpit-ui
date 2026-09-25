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
  const activeTab = (searchParams.get('tab') as PanoramaTabId) || 'gates';
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

  const handleTabChange = useCallback((tabId: PanoramaTabId) => {
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
      const currentIndex = ROTATION_TABS.indexOf(activeTab);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % ROTATION_TABS.length : 0;
      const nextTab = ROTATION_TABS[nextIndex];
      setSearchParams({ tab: nextTab });
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isAutoRotate, isUserInteracting, activeTab, setSearchParams]);

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
          ? 'fixed inset-0 z-50 overflow-y-auto bg-[#0b0f19] p-4 md:p-6'
          : 'space-y-4'
      }`}
    >
      {/* 👑 Sovereign Integrated Master Dock (合并型极简高精浮动控制栏) */}
      <header
        role="navigation"
        aria-label="主权全景中枢导引栏"
        className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#111827]/90 border border-slate-800/80 backdrop-blur-xl shadow-lg shadow-black/40"
      >
        {/* 左侧：微型品牌与全局态势感知 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wide text-white uppercase font-mono">
                  织星体系全景控制舱
                </span>
                {isFallback ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    静态容灾
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 姿态微卡 */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-[#0b0f19]/80 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">健康度:</span>
            <strong className="text-emerald-300">{healthScore.toFixed(1)}%</strong>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 text-[11px]">门禁:</span>
            <strong className="text-cyan-300">{passedGates}/{totalGates}</strong>
          </div>
        </div>

        {/* 中间：视界切换 Segmented Controls (5大核心视界) */}
        <div
          role="tablist"
          aria-label="治理全景视图选择"
          className="flex items-center gap-1 p-1 rounded-xl bg-[#0b0f19]/90 border border-slate-800/80 overflow-x-auto"
        >
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-900/60 to-blue-900/60 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-40 font-mono">[{idx + 1}]</span>
              </button>
            );
          })}
        </div>

        {/* 右侧：紧凑工具操作组 */}
        <div className="flex items-center gap-2">
          {/* 深度遥测抽屉按钮 */}
          <button
            type="button"
            onClick={() => setIsTelemetryDrawerOpen((prev) => !prev)}
            aria-label="切换深度遥测抽屉"
            aria-expanded={isTelemetryDrawerOpen}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isTelemetryDrawerOpen
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">深度遥测</span>
            <span className="text-[10px] font-mono text-slate-400">[D]</span>
          </button>

          {/* 自动轮播按钮 */}
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isAutoRotate
                ? isUserInteracting
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
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

          {/* 沉浸大屏壁挂模式按钮 */}
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isWallboardMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {isWallboardMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>退出大屏 (按 F)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>沉浸大屏 (按 F)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Rotation indicator info bar (when active) */}
      {isAutoRotate && (
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>自动巡航模式运行中 · 25 秒自动切换视界 · 移动鼠标静默避让 12 秒</span>
          </div>
          <span className="text-[10px] text-slate-400">当前视界: {TABS.find(t => t.id === activeTab)?.label}</span>
        </div>
      )}

      {/* Tab Panels */}
      <main
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
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827]/95 text-cyan-300 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-xs font-semibold animate-fade-in"
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
