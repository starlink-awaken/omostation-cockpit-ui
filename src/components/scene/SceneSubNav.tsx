import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, GitBranch, FileCheck2, TrendingUp } from 'lucide-react';

export interface SceneSubNavProps {
  className?: string;
}

const SCENE_NAV_ITEMS = [
  { path: '/scenes', label: '场景总览', icon: LayoutGrid },
  { path: '/scene-graph', label: 'DAG 拓扑', icon: GitBranch },
  { path: '/scene-cards', label: '场景卡评审', icon: FileCheck2 },
  { path: '/calibration', label: '校准中心', icon: TrendingUp },
];

export default function SceneSubNav({ className = '' }: SceneSubNavProps) {
  return (
    <nav
      aria-label="场景卡中心子导航"
      className={`scene-subnav-bar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 6px',
        background: 'rgba(16, 24, 48, 0.45)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
        borderRadius: '8px',
        marginBottom: '16px',
        width: 'fit-content',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {SCENE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `scene-subnav-pill ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-accent, #6366f1)' : 'var(--color-text-secondary, #94a3b8)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            })}
          >
            <Icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
