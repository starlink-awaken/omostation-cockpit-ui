/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Dashboard — 主布局组件 (重构后)
 *
 * 从 677 行精简到 < 250 行。
 * 图标映射、路由包装器已提取到独立模块。
 */
import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES, ROUTE_REDIRECTS, getVisibleRoutes, getRouteById, getRouteByPath } from '../routes';
import { useLiveTelemetry } from '../api/liveTelemetry';
import Breadcrumb from './common/Breadcrumb';
import { RouteErrorBoundary } from './common/RouteErrorBoundary';
import { CommandPalette, useCommandPalette } from './common/CommandPalette';
import QuickActionsPanel, { useQuickActions } from './common/QuickActionsPanel';
import { useKeyboardShortcuts } from './common/CommandPalette';
import UserMenu from './common/UserMenu';
import { useCockpitStore } from '../store';
import { getIconComponent } from './dashboardIcons';
import './Dashboard.css';

const visibleRoutes = getVisibleRoutes();

const DOMAIN_TABS = [
  { id: 'all', label: '全部' },
  { id: '态势感知', label: '态势' },
  { id: '主权算力', label: '算力' },
  { id: '业务闭环', label: '业务' },
  { id: '治理与合规', label: '治理' },
] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRoute = getRouteByPath(location.pathname);
  const activeTab = currentRoute?.id ?? 'Home';

  const [activeDomain, setActiveDomain] = useState<string>('all');
  const telemetry = useLiveTelemetry();

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
      setCollapsedGroups(prev => {
        if (!prev.has(currentRoute.group)) return prev;
        const next = new Set(prev);
        next.delete(currentRoute.group);
        return next;
      });
    }
  }, [currentRoute?.group]);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const handleDomainSelect = useCallback((domainId: string) => {
    setActiveDomain(domainId);
    if (domainId !== 'all') {
      setCollapsedGroups(prev => {
        if (!prev.has(domainId)) return prev;
        const next = new Set(prev);
        next.delete(domainId);
        return next;
      });
    }
  }, []);

  const goTo = useCallback((tabId: string) => {
    const route = getRouteById(tabId);
    navigate(route?.path ?? '/');
  }, [navigate]);

  // Search state
  const searchQuery = useCockpitStore((s) => s.search.query);
  const setSearchQuery = useCockpitStore((s) => s.search.setQuery);

  // Command palette
  const { isOpen: isCommandPaletteOpen, initialQuery, open: openCommandPalette, openWithQuery, close: closeCommandPalette } = useCommandPalette(
    visibleRoutes.map(r => ({ id: r.id, label: r.label, description: r.label, action: () => goTo(r.id) })),
  );

  // Quick actions
  const { isOpen: isQuickActionsOpen, open: openQuickActions, close: closeQuickActions } = useQuickActions();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      { key: 'k', ctrl: true, description: '搜索/命令面板', action: () => isCommandPaletteOpen ? closeCommandPalette() : openCommandPalette() },
      { key: 'j', ctrl: true, description: '快捷操作', action: openQuickActions },
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
    breadcrumbItems.push({ label: currentRoute.group, onClick: () => goTo(visibleRoutes.find(r => r.group === currentRoute.group)?.id ?? 'Home') });
    breadcrumbItems.push({ label: currentRoute?.label ?? '控制台' });
  }

  // Hero
  const hero = currentRoute
    ? { title: currentRoute.label, subtitle: currentRoute.subtitle || '' }
    : { title: '控制台', subtitle: 'eCOS 管理面板' };

  return (
    <div className="dashboard-container">
      <a href="#main-content" className="sr-only-focusable">跳过导航</a>

      {/* Sidebar */}
      <aside role="complementary" aria-label="控制台侧边栏" className="sidebar">
        <div className="sidebar-header">
          <div className="logo-box" aria-hidden="true">
            <span className="text-accent font-bold text-lg">C</span>
          </div>
          <h2>Cockpit Console</h2>
        </div>

        {/* Domain Filter Tabs */}
        <div className="sidebar-domain-filter" role="tablist" aria-label="核心业务域过滤">
          {DOMAIN_TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeDomain === tab.id}
              className={`domain-tab-pill ${activeDomain === tab.id ? 'active' : ''}`}
              onClick={() => handleDomainSelect(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <nav aria-label="控制台主导航" className="sidebar-nav" role="menu">
          {Object.entries(groupedRoutes)
            .filter(([group]) => activeDomain === 'all' || group === activeDomain)
            .map(([group, routes]) => (
              <React.Fragment key={group}>
                <button
                  className="nav-group-title"
                  id={`group-${group}`}
                  onClick={() => toggleGroup(group)}
                  aria-expanded={!collapsedGroups.has(group)}
                >
                  {group}
                  <span className="group-toggle">{collapsedGroups.has(group) ? '+' : '−'}</span>
                </button>
                {!collapsedGroups.has(group) && routes.map(route => {
                  const IconComp = getIconComponent(route.icon);
                  return (
                    <NavLink
                      key={route.id}
                      to={route.path}
                      role="menuitem"
                      aria-describedby={`group-${group}`}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => goTo(route.id)}
                    >
                      <IconComp size={16} aria-hidden="true" />
                      <span>{route.label}</span>
                    </NavLink>
                  );
                })}
              </React.Fragment>
            ))}
        </nav>
      </aside>

      {/* Main */}
      <main id="main-content" tabIndex={-1} className="main-content">
        <header className="topbar">
          <div className="search-bar" role="search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索服务、模型、智能体... (Enter 打开命令面板)"
              aria-label="全局搜索输入框"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') openWithQuery(searchQuery); }}
            />
          </div>
          <div className="topbar-actions">
            <div
              className="topbar-telemetry-badge"
              onClick={() => goTo('Panorama')}
              title="知行实时遥测 (端口 43191) - 点击进入全景座舱"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goTo('Panorama'); }}
              aria-label="知行实时遥测"
            >
              <span className={`telemetry-dot ${telemetry.connected ? 'connected' : 'fallback'}`} />
              <span className="telemetry-text">43191 {telemetry.connected ? 'LIVE' : 'SYNC'}</span>
              <span className="telemetry-pill">
                门禁 {telemetry.gates.filter(g => g.verdict === 'PASS').length}/{telemetry.gates.length}
              </span>
              <span className="telemetry-pill">
                台账 {telemetry.betStats.done}/{telemetry.betStats.total}
              </span>
            </div>
            <button className="topbar-btn" onClick={() => openWithQuery(searchQuery)} title="命令面板 (Ctrl+K)">
              ⌘
            </button>
            <button className="topbar-btn" onClick={openQuickActions} title="快捷操作 (Ctrl+J)">
              ⚡
            </button>
          </div>
          <UserMenu />
        </header>

        <div className="content-area">
          {activeTab !== 'Home' && activeTab !== 'Panorama' && <Breadcrumb items={breadcrumbItems} />}

          <div key={activeTab} className="hero-section animate-fade-in">
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-subtitle">{hero.subtitle}</p>
          </div>

          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
            <RouteErrorBoundary>
              <Routes>
                {Object.entries(ROUTE_REDIRECTS).map(([from, to]) => (
                  <Route key={from} path={from} element={<Navigate to={to} replace />} />
                ))}
                {visibleRoutes.map(route => (
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
        commands={visibleRoutes.map(r => ({ id: r.id, label: r.label, description: r.label, action: () => goTo(r.id) }))}
      />
      <QuickActionsPanel isOpen={isQuickActionsOpen} onClose={closeQuickActions} />
    </div>
  );
}
