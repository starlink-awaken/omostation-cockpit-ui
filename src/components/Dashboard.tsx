/**
 * Dashboard — 主布局入口组件 (重构后)
 *
 * 核心骨架与子系统已拆解至 src/components/layout/：
 * - AppLayout.tsx: 全局骨架与路由编排
 * - Sidebar.tsx: 侧边栏与四域过滤
 * - Topbar.tsx: 顶栏搜索与实时遥测视窗
 */
import React from 'react';
import AppLayout from './layout/AppLayout';

export default function Dashboard() {
  return <AppLayout />;
}
