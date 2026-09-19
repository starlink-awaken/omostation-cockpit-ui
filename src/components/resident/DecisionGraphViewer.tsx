/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * DecisionGraphViewer — 因果决策图可视化页面 (BET-Y1Q4-T5-05).
 *
 * 展示因果决策图的聚合统计、最近节点、Actor 活跃度和因果边拓扑。
 * 数据源: cockpit.handlers.decision_graph → cockpit API → 前端 useQuery。
 * 零模型调用, 纯展示。
 */
import React, { useState } from 'react';
import {
  GitBranch,
  Network,
  Clock,
  User,
  Activity,
  BarChart3,
  RefreshCw,
  NetworkIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import { SkeletonLines } from '../ui/LoadingSkeleton';
import StatusBadge from '../ui/StatusBadge';
import type { ColumnDef } from '../ui/DataTable';
import { DataTable } from '../ui/DataTable';

// ── Types ──

interface DecisionGraphNode {
  node_id: string;
  kind: 'patrol' | 'healing' | 'decision' | string;
  actor: string;
  action: string;
  ts: string;
}

interface DecisionGraphEdge {
  src: string;
  dst: string;
  relation: 'CAUSED' | 'INFLUENCED' | string;
}

interface DecisionGraphData {
  total_nodes: number;
  total_edges: number;
  by_kind: Record<string, number>;
  by_relation: Record<string, number>;
  recent_nodes: DecisionGraphNode[];
  actor_activity: Record<string, number>;
  action_frequency: Record<string, number>;
  edges?: DecisionGraphEdge[];
  nodes?: DecisionGraphNode[];
}

type TabKey = 'overview' | 'nodes' | 'graph';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

// ── Constants ──

const TABS: TabDef[] = [
  { key: 'overview', label: '概览', icon: NetworkIcon },
  { key: 'nodes', label: '节点列表', icon: GitBranch },
  { key: 'graph', label: '因果拓扑', icon: Network },
];

const KIND_COLORS: Record<string, string> = {
  patrol: '#3b82f6',   // blue
  healing: '#10b981',  // green
  decision: '#8b5cf6', // violet
};

const RELATION_COLORS: Record<string, string> = {
  CAUSED: '#3b82f6',   // blue — solid
  INFLUENCED: '#f59e0b', // amber — dashed
};

function kindColor(kind: string): string {
  return KIND_COLORS[kind] ?? '#6b7280';
}

function relationColor(relation: string): string {
  return RELATION_COLORS[relation] ?? '#6b7280';
}

function formatTimestamp(ts?: string): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return ts;
  }
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

// ── Sub-components ──

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface p-3 border border-border">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-xl font-bold" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-text-secondary">{label}</div>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-text-secondary text-right shrink-0">
        {label}
      </span>
      <div className="flex-1 h-5 rounded bg-surface-alt overflow-hidden">
        <div
          className="h-full rounded transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-xs text-text-primary text-right font-mono">
        {value}
      </span>
    </div>
  );
}

function ActorList({ activity }: { activity: Record<string, number> }) {
  const sorted = Object.entries(activity).sort((a, b) => b[1] - a[1]);
  const max = sorted.length > 0 ? sorted[0][1] : 1;
  if (sorted.length === 0) {
    return <div className="text-sm text-text-secondary">暂无 Actor 数据</div>;
  }
  return (
    <div className="space-y-1.5">
      {sorted.map(([actor, count]) => (
        <DistributionBar
          key={actor}
          label={actor}
          value={count}
          max={max}
          color="#3b82f6"
        />
      ))}
    </div>
  );
}

function ActionList({ frequency }: { frequency: Record<string, number> }) {
  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  const max = sorted.length > 0 ? sorted[0][1] : 1;
  if (sorted.length === 0) {
    return <div className="text-sm text-text-secondary">暂无 Action 数据</div>;
  }
  return (
    <div className="space-y-1.5">
      {sorted.map(([action, count]) => (
        <DistributionBar
          key={action}
          label={action.length > 14 ? `${action.slice(0, 12)}…` : action}
          value={count}
          max={max}
          color="#8b5cf6"
        />
      ))}
    </div>
  );
}

function GraphTopology({
  nodes,
  edges,
}: {
  nodes: DecisionGraphNode[];
  edges: DecisionGraphEdge[];
}) {
  if (nodes.length === 0) {
    return <div className="text-sm text-text-secondary">暂无图数据</div>;
  }

  // Simple force-directed-ish layout (deterministic, no physics engine)
  const padding = 60;
  const nodeRadius = 28;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const gapX = 180;
  const gapY = 140;

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(node.node_id, {
      x: padding + col * gapX,
      y: padding + row * gapY,
    });
  });

  const width = padding * 2 + (cols - 1) * gapX;
  const height = padding * 2 + (rows - 1) * gapY;

  return (
    <div className="overflow-auto rounded-lg border border-border bg-surface-alt p-4">
      <svg
        width={width}
        height={height}
        className="mx-auto"
        style={{ maxWidth: '100%' }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const src = positions.get(edge.src);
          const dst = positions.get(edge.dst);
          if (!src || !dst) return null;
          return (
            <line
              key={`edge-${i}`}
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              stroke={relationColor(edge.relation)}
              strokeWidth={2}
              strokeDasharray={edge.relation === 'INFLUENCED' ? '6,3' : 'none'}
              markerEnd={`url(#arrow-${edge.relation})`}
            />
          );
        })}

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrow-CAUSED"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={relationColor('CAUSED')} />
          </marker>
          <marker
            id="arrow-INFLUENCED"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={relationColor('INFLUENCED')} />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.node_id);
          if (!pos) return null;
          const color = kindColor(node.kind);
          return (
            <g key={node.node_id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={`${color}30`}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y - 4}
                textAnchor="middle"
                fill="#e5e7eb"
                fontSize="10"
                fontWeight="bold"
              >
                {shortId(node.node_id)}
              </text>
              <text
                x={pos.x}
                y={pos.y + 10}
                textAnchor="middle"
                fill={color}
                fontSize="9"
              >
                {node.kind}
              </text>
              <text
                x={pos.x}
                y={pos.y + nodeRadius + 14}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="9"
              >
                {node.actor}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Table columns ──

const nodeColumns: ColumnDef<DecisionGraphNode>[] = [
  {
    key: 'node_id',
    header: 'ID',
    render: (row) => (
      <span className="text-xs font-mono text-text-secondary">
        {shortId(row.node_id)}
      </span>
    ),
    width: '100px',
  },
  {
    key: 'kind',
    header: '类型',
    render: (row) => (
      <span
        className="text-xs font-medium px-1.5 py-0.5 rounded"
        style={{
          color: kindColor(row.kind),
          backgroundColor: `${kindColor(row.kind)}15`,
        }}
      >
        {row.kind}
      </span>
    ),
    width: '80px',
  },
  {
    key: 'actor',
    header: 'Actor',
    render: (row) => (
      <span className="text-xs">{row.actor || '—'}</span>
    ),
    width: '120px',
  },
  {
    key: 'action',
    header: 'Action',
    render: (row) => (
      <span className="text-xs text-text-primary">{row.action || '—'}</span>
    ),
  },
  {
    key: 'ts',
    header: '时间',
    render: (row) => (
      <span className="text-xs text-text-secondary font-mono">
        {formatTimestamp(row.ts)}
      </span>
    ),
    width: '140px',
  },
];

// ── Main component ──

export default function DecisionGraphViewer() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data, isLoading, isError, error } = useQuery<DecisionGraphData>({
    queryKey: ['decision-graph'],
    queryFn: async () => {
      const res = await apiFetch<DecisionGraphData>(
        '/api/decision-graph/summary'
      );
      if (!res.ok) {
        throw new Error(res.error ?? '加载失败');
      }
      return res.data!;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="因果决策图" subtitle="Resident Agent 决策因果链" />
        <SkeletonLines count={8} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <PageHeader title="因果决策图" subtitle="Resident Agent 决策因果链" />
        <EmptyState
          message={error?.message ?? '数据加载失败'}
          description="请确认 decision-graph handler 已启动"
        />
      </div>
    );
  }

  const kindEntries = Object.entries(data.by_kind ?? {});
  const relationEntries = Object.entries(data.by_relation ?? {});
  const maxKind = kindEntries.length > 0 ? Math.max(...kindEntries.map(([, v]) => v)) : 1;
  const maxRelation = relationEntries.length > 0 ? Math.max(...relationEntries.map(([, v]) => v)) : 1;
  const totalStats = (data.by_kind ?? {}).patrol + (data.by_kind ?? {}).healing + (data.by_kind ?? {}).decision;

  return (
    <div>
      <PageHeader
        title="因果决策图"
        subtitle="Resident Agent 决策因果链"
        actions={
          <button
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => {
              // Trigger refetch by changing key would need refetch logic
            }}
            title="刷新"
          >
            <RefreshCw size={14} />
            刷新
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                active
                  ? 'text-accent border-accent'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="节点总数" value={data.total_nodes} color="#3b82f6" icon={GitBranch} />
            <StatCard label="因果边数" value={data.total_edges} color="#8b5cf6" icon={Network} />
            <StatCard label="Actor 数" value={Object.keys(data.actor_activity ?? {}).length} color="#10b981" icon={User} />
            <StatCard label="Action 数" value={Object.keys(data.action_frequency ?? {}).length} color="#f59e0b" icon={Activity} />
          </div>

          {/* Distributions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <GitBranch size={14} className="text-text-secondary" />
                节点类型分布
              </h3>
              <div className="space-y-1.5">
                {kindEntries.length > 0 ? (
                  kindEntries.map(([kind, value]) => (
                    <DistributionBar
                      key={kind}
                      label={kind}
                      value={value}
                      max={maxKind}
                      color={kindColor(kind)}
                    />
                  ))
                ) : (
                  <div className="text-sm text-text-secondary">暂无数据</div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Network size={14} className="text-text-secondary" />
                关系类型分布
              </h3>
              <div className="space-y-1.5">
                {relationEntries.length > 0 ? (
                  relationEntries.map(([relation, value]) => (
                    <DistributionBar
                      key={relation}
                      label={relation}
                      value={value}
                      max={maxRelation}
                      color={relationColor(relation)}
                    />
                  ))
                ) : (
                  <div className="text-sm text-text-secondary">暂无数据</div>
                )}
              </div>
            </div>
          </div>

          {/* Actor + Action */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <User size={14} className="text-text-secondary" />
                Actor 活跃度
              </h3>
              <ActorList activity={data.actor_activity ?? {}} />
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <BarChart3 size={14} className="text-text-secondary" />
                Action 频率
              </h3>
              <ActionList frequency={data.action_frequency ?? {}} />
            </div>
          </div>

          {/* Recent nodes */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock size={14} className="text-text-secondary" />
              最近节点
            </h3>
            <DataTable
              columns={nodeColumns}
              data={data.recent_nodes ?? []}
              emptyMessage="暂无节点"
              caption="最近 20 个决策图节点"
            />
          </div>
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-medium mb-3">全部节点</h3>
          <DataTable
            columns={nodeColumns}
            data={data.nodes ?? data.recent_nodes ?? []}
            emptyMessage="暂无节点"
            caption={`${data.total_nodes} 个节点`}
          />
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.patrol }} />
              Patrol
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.healing }} />
              Healing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.decision }} />
              Decision
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 border-t-2" style={{ borderColor: RELATION_COLORS.CAUSED }} />
              CAUSED
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: RELATION_COLORS.INFLUENCED }} />
              INFLUENCED
            </span>
          </div>

          <GraphTopology
            nodes={data.nodes ?? []}
            edges={data.edges ?? []}
          />
        </div>
      )}
    </div>
  );
}
