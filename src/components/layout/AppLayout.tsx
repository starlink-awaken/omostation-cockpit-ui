import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES, ROUTE_REDIRECTS, getVisibleRoutes, getRouteById, getRouteByPath } from '../../routes';
import { useLiveTelemetry } from '../../api/liveTelemetry';
import Breadcrumb from '../common/Breadcrumb';
import { RouteErrorBoundary } from '../common/RouteErrorBoundary';
import { CommandPalette, useCommandPalette, useKeyboardShortcuts, type CommandItem } from '../common/CommandPalette';
import QuickActionsPanel, { useQuickActions } from '../common/QuickActionsPanel';
import { useCockpitStore } from '../../store';
import { useApprovalQueue } from '../../api/hooks/swarm';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SovereignCopilotDrawer from '../common/SovereignCopilotDrawer';
import { GuardianInspectionDrawer } from '../common/GuardianInspectionDrawer';
import '../Dashboard.css';

const visibleRoutes = getVisibleRoutes();

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRoute = getRouteByPath(location.pathname);
  const activeTab = currentRoute?.id ?? 'Home';

  const [activeDomain, setActiveDomain] = useState<string>('all');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isGuardianInspectionOpen, setIsGuardianInspectionOpen] = useState<boolean>(false);
  const telemetry = useLiveTelemetry();
  const { data: approvalData } = useApprovalQueue();
  const pendingApprovalsCount = approvalData?.intents?.length ?? 0;

  // Collapsible groups: default-collapse groups with > 5 items
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const groupCounts = visibleRoutes.reduce<Record<string, number>>((acc, r) => {
      acc[r.group] = (acc[r.group] || 0) + 1;
      return acc;
    }, {});
    Object.entries(groupCounts).forEach(([group, count]) => {
      if (count > 5) initial.add(group);
    });
    return initial;
  });

  // Automatically expand group of the active route
  useEffect(() => {
    if (currentRoute?.group) {
      setCollapsedGroups((prev) => {
        if (!prev.has(currentRoute.group)) return prev;
        const next = new Set(prev);
        next.delete(currentRoute.group);
        return next;
      });
    }
  }, [currentRoute?.group]);

  // Global listener for opening Guardian Inspection Drawer
  useEffect(() => {
    const handleOpenGuardian = () => setIsGuardianInspectionOpen(true);
    window.addEventListener('open-guardian-inspection', handleOpenGuardian);
    return () => window.removeEventListener('open-guardian-inspection', handleOpenGuardian);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const handleDomainSelect = useCallback((domainId: string) => {
    setActiveDomain(domainId);
    if (domainId !== 'all') {
      setCollapsedGroups((prev) => {
        if (!prev.has(domainId)) return prev;
        const next = new Set(prev);
        next.delete(domainId);
        return next;
      });
    }
  }, []);

  const goTo = useCallback(
    (tabId: string) => {
      const route = getRouteById(tabId);
      navigate(route?.path ?? '/');
    },
    [navigate],
  );

  // Search state
  const searchQuery = useCockpitStore((s) => s.search.query);
  const setSearchQuery = useCockpitStore((s) => s.search.setQuery);

  // Command palette items including route-level and granular panorama sub-views
  const allCommands = React.useMemo<CommandItem[]>(() => {
    const routeCommands: CommandItem[] = ROUTES.map((r) => ({
      id: r.id,
      label: r.label,
      description: r.subtitle || r.label,
      keywords: r.keywords,
      group: r.group,
      action: () => goTo(r.id),
    }));

    const panoramaSubCommands: CommandItem[] = [
      {
        id: 'panorama-gates',
        label: '治理全景: 门禁矩阵全景',
        description: 'A1-A9、RF0、RC-DL 全局 11 门禁裁决与拦截详情',
        keywords: ['panorama', '全景', '门禁', 'gates', 'a1', 'rf0', 'rc-dl', 'matrix'],
        group: 'govern',
        action: () => navigate('/panorama?tab=gates'),
      },
      {
        id: 'panorama-guardian',
        label: '治理全景: 74s 哨兵大屏巡检',
        description: '四维健康度评分、74s 倒计时心跳脉冲与自愈工作流',
        keywords: ['panorama', '全景', '哨兵', '74s', 'guardian', '倒计时', '自愈', '健康度'],
        group: 'govern',
        action: () => navigate('/panorama?tab=guardian'),
      },
      {
        id: 'panorama-topology',
        label: '治理全景: 道法术器架构拓扑',
        description: 'DFSQ/v1 道法术器四层图谱与 COMP-WS-omo 唯一 S 槽位',
        keywords: ['panorama', '全景', '道法术器', 'dfsq', '拓扑', 'topology', 's槽位'],
        group: 'govern',
        action: () => navigate('/panorama?tab=topology'),
      },
      {
        id: 'panorama-bcos',
        label: '治理全景: BCOS 认知进化链',
        description: '世代进化仪表盘、自蒸馏知识提炼与历代治理轨迹',
        keywords: ['panorama', '全景', 'bcos', '进化', '自蒸馏', 'epoch', '知识'],
        group: 'govern',
        action: () => navigate('/panorama?tab=bcos'),
      },
      {
        id: 'panorama-hero',
        label: '治理全景: 夏明星在位签署抽屉',
        description: '夏明星主权在位签署、治理批次核准与历史抽屉',
        keywords: ['panorama', '全景', '夏明星', '在位签署', '签署', 'hero'],
        group: 'govern',
        action: () => navigate('/panorama?tab=hero'),
      },
    ];

    return [...routeCommands, ...panoramaSubCommands];
  }, [goTo, navigate]);

  // Command palette
  const {
    isOpen: isCommandPaletteOpen,
    initialQuery,
    open: openCommandPalette,
    openWithQuery,
    close: closeCommandPalette,
  } = useCommandPalette(allCommands);

  // Quick actions
  const { isOpen: isQuickActionsOpen, open: openQuickActions, close: closeQuickActions } = useQuickActions();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        ctrl: true,
        description: '搜索/命令面板',
        action: () => (isCommandPaletteOpen ? closeCommandPalette() : openCommandPalette()),
      },
      { key: 'j', ctrl: true, description: '快捷操作', action: openQuickActions },
      {
        key: 'p',
        ctrl: true,
        description: '治理全景大屏',
        action: () => goTo('Panorama'),
      },
      {
        key: ' ',
        ctrl: true,
        description: '随行 Copilot 抽屉',
        action: () => setIsCopilotOpen((prev) => !prev),
      },
      { key: '1', ctrl: true, description: '首页', action: () => goTo('Home') },
      { key: '2', ctrl: true, description: '概览', action: () => goTo('Overview') },
      { key: '3', ctrl: true, description: '告警', action: () => goTo('AlertCenter') },
      { key: '4', ctrl: true, description: '日志', action: () => goTo('LogViewer') },
      { key: '5', ctrl: true, description: '任务', action: () => goTo('TaskCenter') },
    ],
  });

  // Group visible routes for sidebar
  const groupedRoutes = visibleRoutes.reduce<Record<string, typeof visibleRoutes>>((acc, route) => {
    if (!acc[route.group]) acc[route.group] = [];
    acc[route.group].push(route);
    return acc;
  }, {});

  // Breadcrumb
  const breadcrumbItems = [];
  if (currentRoute && currentRoute.id !== 'Home' && currentRoute.id !== 'Panorama') {
    breadcrumbItems.push({
      label: currentRoute.group,
      onClick: () => goTo(visibleRoutes.find((r) => r.group === currentRoute.group)?.id ?? 'Home'),
    });
    breadcrumbItems.push({ label: currentRoute?.label ?? '控制台' });
  }

  // Hero
  const hero = currentRoute
    ? { title: currentRoute.label, subtitle: currentRoute.subtitle || '' }
    : { title: '控制台', subtitle: 'eCOS 管理面板' };

  return (
    <div className="dashboard-container">
      <a href="#main-content" className="sr-only-focusable">
        跳过导航
      </a>

      {/* Extracted Sidebar */}
      <Sidebar
        groupedRoutes={groupedRoutes}
        activeDomain={activeDomain}
        collapsedGroups={collapsedGroups}
        onDomainSelect={handleDomainSelect}
        onToggleGroup={toggleGroup}
        onNavigate={goTo}
        onOpenGuardianInspection={() => setIsGuardianInspectionOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="main-content">
        {/* Extracted Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCommandPalette={openWithQuery}
          onOpenQuickActions={openQuickActions}
          telemetry={telemetry}
          onNavigateToPanorama={() => goTo('Panorama')}
          onOpenCopilot={() => setIsCopilotOpen((prev) => !prev)}
          onOpenGuardianInspection={() => setIsGuardianInspectionOpen(true)}
        />

        <div className="content-area">
          {activeTab !== 'Home' && activeTab !== 'Panorama' && <Breadcrumb items={breadcrumbItems} />}

          <div key={activeTab} className={activeTab === 'Panorama' ? 'sr-only' : 'hero-section animate-fade-in'}>
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-subtitle">{hero.subtitle}</p>
          </div>

          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
            <RouteErrorBoundary>
              <Routes>
                {Object.entries(ROUTE_REDIRECTS).map(([from, to]) => (
                  <Route key={from} path={from} element={<Navigate to={to} replace />} />
                ))}
                {ROUTES.map((route) => (
                  <Route key={route.path} path={route.path} element={<route.component />} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </RouteErrorBoundary>
          </Suspense>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        initialQuery={initialQuery}
        commands={ROUTES.map((r) => ({ id: r.id, label: r.label, description: r.label, action: () => goTo(r.id) }))}
      />
      <QuickActionsPanel isOpen={isQuickActionsOpen} onClose={closeQuickActions} />

      <SovereignCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentRoute={currentRoute ?? null}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      <GuardianInspectionDrawer
        isOpen={isGuardianInspectionOpen}
        onClose={() => setIsGuardianInspectionOpen(false)}
        onNavigate={(p) => goTo(p)}
      />
    </div>
  );
}

export default AppLayout;
