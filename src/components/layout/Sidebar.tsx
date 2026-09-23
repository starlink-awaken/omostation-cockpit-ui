import React from 'react';
import { NavLink } from 'react-router-dom';
import type { RouteConfig } from '../../routes';
import { getIconComponent } from '../dashboardIcons';

export const DOMAIN_TABS = [
  { id: 'all', label: '全部' },
  { id: '业务闭环', label: '业务' },
  { id: '态势感知', label: '态势' },
  { id: '主权算力', label: '算力' },
] as const;

export interface SidebarProps {
  groupedRoutes: Record<string, RouteConfig[]>;
  activeDomain: string;
  collapsedGroups: Set<string>;
  onDomainSelect: (domainId: string) => void;
  onToggleGroup: (group: string) => void;
  onNavigate: (routeId: string) => void;
  onOpenGuardianInspection?: () => void;
}

export function Sidebar({
  groupedRoutes,
  activeDomain,
  collapsedGroups,
  onDomainSelect,
  onToggleGroup,
  onNavigate,
  onOpenGuardianInspection,
}: SidebarProps) {
  return (
    <aside role="complementary" aria-label="控制台侧边栏" className="sidebar">
      <div className="sidebar-header">
        <div className="logo-box-modern" aria-hidden="true">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="sidebar-brand">
          <h2 className="brand-title">Cockpit Console</h2>
          <span className="brand-tag">eCOS v6</span>
        </div>
      </div>

      {/* Domain Filter Tabs */}
      <div className="sidebar-domain-filter" role="tablist" aria-label="核心业务域过滤">
        {DOMAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeDomain === tab.id}
            className={`domain-tab-pill ${activeDomain === tab.id ? 'active' : ''}`}
            onClick={() => onDomainSelect(tab.id)}
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
                onClick={() => onToggleGroup(group)}
                aria-expanded={!collapsedGroups.has(group)}
              >
                {group}
                <span className="group-toggle">{collapsedGroups.has(group) ? '+' : '−'}</span>
              </button>
              {!collapsedGroups.has(group) &&
                routes.map((route) => {
                  const IconComp = getIconComponent(route.icon);
                  return (
                    <NavLink
                      key={route.id}
                      to={route.path}
                      role="menuitem"
                      aria-describedby={`group-${group}`}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => onNavigate(route.id)}
                    >
                      <IconComp size={16} aria-hidden="true" />
                      <span>{route.label}</span>
                    </NavLink>
                  );
                })}
            </React.Fragment>
          ))}
      </nav>

      {/* 底部主权底座下沉与协同卡片 */}
      <div className="sidebar-governance-footer p-3 mx-2 my-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
            <span>知行治理底座</span>
          </div>
          <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            43191
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          74s 哨兵守护 · 11 全局门禁
        </p>
        <div className="flex items-center gap-1.5 pt-1">
          {onOpenGuardianInspection && (
            <button
              type="button"
              onClick={onOpenGuardianInspection}
              className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium text-center"
            >
              速查
            </button>
          )}
          <a
            href="http://localhost:43191/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1 px-2 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors text-[11px] font-medium text-center"
          >
            监造台 ↗
          </a>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
