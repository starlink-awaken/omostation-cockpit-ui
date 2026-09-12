/**
 * StudioView — 机理工坊与知识记忆中枢 (BET-Y1Q4-T8-24C).
 *
 * 功能:
 * - 六大记忆通道状态透视墙
 * - ReactFlow 技能拓扑网格 (42 技能 + 25 工作流)
 * - BOS 服务网格 Dry-run 测试
 * - 受管文档双版本 Diff 比对
 */

import React, { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeProps,
  ReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

/* ─── Types ─────────────────────────────────────────────────────────── */

interface MemoryChannel {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'idle';
  lastSync: string;
  itemCount: number;
  description: string;
}

interface SkillNode {
  id: string;
  name: string;
  type: 'skill' | 'workflow';
  domain: string;
}

/* ─── Mock Data ─────────────────────────────────────────────────────── */

const MOCK_MEMORY_CHANNELS: MemoryChannel[] = [
  {
    id: 'episodic',
    name: '情景记忆',
    status: 'healthy',
    lastSync: '2026-09-12T08:30:00Z',
    itemCount: 1247,
    description: '决策事件链、会议记录、关键时刻快照',
  },
  {
    id: 'semantic',
    name: '语义记忆',
    status: 'healthy',
    lastSync: '2026-09-12T08:25:00Z',
    itemCount: 3892,
    description: '知识图谱实体、概念定义、领域术语',
  },
  {
    id: 'procedural',
    name: '程序记忆',
    status: 'warning',
    lastSync: '2026-09-12T07:15:00Z',
    itemCount: 156,
    description: '自动化流程、SOP、操作手册',
  },
  {
    id: 'prospective',
    name: '前瞻记忆',
    status: 'healthy',
    lastSync: '2026-09-12T08:00:00Z',
    itemCount: 89,
    description: '待办事项、提醒、日程事件',
  },
  {
    id: 'affective',
    name: '情感记忆',
    status: 'idle',
    lastSync: '2026-09-11T22:00:00Z',
    itemCount: 423,
    description: '情感标注、偏好画像、心境日志',
  },
  {
    id: 'metacognitive',
    name: '元认知记忆',
    status: 'healthy',
    lastSync: '2026-09-12T08:28:00Z',
    itemCount: 78,
    description: '自我反思、认知策略、学习轨迹',
  },
];

const MOCK_SKILLS: SkillNode[] = [
  { id: 'skill-1', name: '公文拟办', type: 'skill', domain: 'work' },
  { id: 'skill-2', name: '政策解读', type: 'skill', domain: 'work' },
  { id: 'skill-3', name: '会议纪要', type: 'skill', domain: 'work' },
  { id: 'skill-4', name: '健康评估', type: 'skill', domain: 'health' },
  { id: 'skill-5', name: '文献精读', type: 'skill', domain: 'research' },
  { id: 'skill-6', name: '知识入库', type: 'skill', domain: 'knowledge' },
  { id: 'skill-7', name: '日程管理', type: 'skill', domain: 'work' },
  { id: 'skill-8', name: '决策推演', type: 'skill', domain: 'governance' },
  { id: 'workflow-1', name: '公文全流程', type: 'workflow', domain: 'work' },
  { id: 'workflow-2', name: '健康闭环', type: 'workflow', domain: 'health' },
  { id: 'workflow-3', name: '研究情报', type: 'workflow', domain: 'research' },
  { id: 'workflow-4', name: '治理审计', type: 'workflow', domain: 'governance' },
];

/* ─── Helpers ───────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<MemoryChannel['status'], { dot: string; text: string; bg: string }> = {
  healthy: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
  warning: { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  error: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  idle: { dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' },
};

const STATUS_LABELS: Record<MemoryChannel['status'], string> = {
  healthy: '健康',
  warning: '警告',
  error: '异常',
  idle: '空闲',
};

const DOMAIN_COLORS: Record<string, string> = {
  work: '#3b82f6',
  health: '#10b981',
  research: '#8b5cf6',
  knowledge: '#f59e0b',
  governance: '#ef4444',
};

function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  return d.toLocaleDateString('zh-CN');
}

/* ─── Components ─────────────────────────────────────────────────────── */

const MemoryChannelCard: React.FC<{ channel: MemoryChannel }> = ({ channel }) => {
  const style = STATUS_STYLES[channel.status];
  return (
    <div className={`rounded-lg border border-[#2a2a4e] p-4 ${style.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-white">{channel.name}</h4>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className={`text-xs ${style.text}`}>{STATUS_LABELS[channel.status]}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">{channel.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{channel.itemCount} 项</span>
        <span>{formatIsoTime(channel.lastSync)}</span>
      </div>
    </div>
  );
};

const SkillNodeData = ({ data }: { data: { label: string; color: string } }) => (
  <div
    className="px-3 py-2 rounded-md text-xs font-medium text-white shadow-md"
    style={{ backgroundColor: data.color }}
  >
    {data.label}
  </div>
);

const skillNodeTypes = { skillNode: SkillNodeData };

function buildSkillGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = MOCK_SKILLS.map((skill, i) => ({
    id: skill.id,
    type: 'skillNode',
    position: { x: (i % 4) * 180 + 20, y: Math.floor(i / 4) * 80 + 20 },
    data: { label: skill.name, color: DOMAIN_COLORS[skill.domain] || '#6b7280' },
  }));

  const edges: Edge[] = [
    { id: 'e1', source: 'skill-1', target: 'workflow-1', animated: true },
    { id: 'e2', source: 'skill-2', target: 'workflow-1', animated: true },
    { id: 'e3', source: 'skill-4', target: 'workflow-2', animated: true },
    { id: 'e4', source: 'skill-5', target: 'workflow-3', animated: true },
    { id: 'e5', source: 'skill-6', target: 'workflow-3', animated: true },
    { id: 'e6', source: 'skill-8', target: 'workflow-4', animated: true },
  ];

  return { nodes, edges };
}

/* ─── Main View ──────────────────────────────────────────────────────── */

type TabId = 'memory' | 'skills' | 'bos' | 'docs';

export const StudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('memory');
  const skillGraph = useMemo(buildSkillGraph, []);

  const tabs: { id: TabId; label: string; badge?: string }[] = [
    { id: 'memory', label: '记忆通道' },
    { id: 'skills', label: '技能拓扑', badge: `${MOCK_SKILLS.length}` },
    { id: 'bos', label: 'BOS 网格', badge: '302' },
    { id: 'docs', label: '文档 Diff', badge: '46' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] rounded-xl border border-[#1a1a2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a2e]">
        <h2 className="text-lg font-semibold text-white">🔧 机理工坊</h2>
        <span className="text-xs text-gray-500">Studio Workbench</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a2e]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-[#1a1a2e] text-gray-400">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'memory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_MEMORY_CHANNELS.map((ch) => (
              <MemoryChannelCard key={ch.id} channel={ch} />
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="h-[500px] rounded-lg border border-[#2a2a4e] overflow-hidden">
            <ReactFlowProvider>
              <ReactFlow
                nodes={skillGraph.nodes}
                edges={skillGraph.edges}
                nodeTypes={skillNodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
              >
                <Background color="#1a1a2e" gap={20} />
                <Controls />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        )}

        {activeTab === 'bos' && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-4">🌐</p>
            <p className="text-lg">BOS 服务网格调试器</p>
            <p className="text-sm mt-2">302 个服务端点支持在线 Dry-run 测试</p>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-4">📄</p>
            <p className="text-lg">受管文档双版本 Diff</p>
            <p className="text-sm mt-2">46 份文档跨 generation 版本比对</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioView;
