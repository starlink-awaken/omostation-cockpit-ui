/**
 * DecisionGraphViewer.tsx — 决策因果图可视化 (T5-05)
 *
 * 三 Tab：概览（统计 + 分布 + 最近节点）| 节点列表 | 因果拓扑图（SVG）
 */

import React, { useState, useMemo } from "react";

// ── Types ──

export interface DecisionNode {
  node_id: string;
  kind: "patrol" | "healing" | "decision";
  actor: string;
  action: string;
  ts: string;
  decision?: string;
  context?: Record<string, unknown>;
}

export interface DecisionEdge {
  from_node: string;
  to_node: string;
  relation: "caused" | "influenced";
}

export interface DecisionGraphSummary {
  nodes: number;
  edges: number;
  by_kind: Record<string, number>;
}

export interface DecisionGraphData {
  summary: DecisionGraphSummary;
  nodes: DecisionNode[];
  edges: DecisionEdge[];
  actors: Record<string, number>;
  actions: Record<string, number>;
}

interface Props {
  data: DecisionGraphData;
}

// ── Constants ──

const KIND_LABELS: Record<string, string> = {
  patrol: "巡检",
  healing: "自愈",
  decision: "决策",
};

const KIND_COLORS: Record<string, string> = {
  patrol: "#10b981",
  healing: "#f59e0b",
  decision: "#6366f1",
};

const RELATION_DASH: Record<string, string> = {
  caused: "",
  influenced: "4 4",
};

// ── Helpers ──

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

// ── Sub-components ──

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface-1 p-3">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-lg font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function DistributionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-mono text-text-secondary">{count}</span>
    </div>
  );
}

function EntityList({ title, entries, maxItems = 5 }: { title: string; entries: Record<string, number>; maxItems?: number }) {
  const sorted = Object.entries(entries).sort(([, a], [, b]) => b - a).slice(0, maxItems);
  if (sorted.length === 0) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium text-text-secondary">{title}</h4>
      <ul className="space-y-0.5">
        {sorted.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between text-xs">
            <span className="font-mono text-text-primary">{name}</span>
            <span className="text-text-tertiary">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Tab: Overview ──

function OverviewTab({ data }: { data: DecisionGraphData }) {
  const { summary, nodes, actors, actions } = data;
  const recent = [...nodes].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 10);
  const totalNodes = summary.nodes;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="决策节点" value={summary.nodes} />
        <StatCard label="因果边" value={summary.edges} />
        <StatCard label="参与者" value={Object.keys(actors).length} />
        <StatCard label="动作类型" value={Object.keys(actions).length} />
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
        <h4 className="text-xs font-medium text-text-secondary mb-2">按类型分布</h4>
        <div className="space-y-1.5">
          {Object.entries(summary.by_kind).map(([kind, count]) => (
            <DistributionBar
              key={kind}
              label={KIND_LABELS[kind] ?? kind}
              count={count}
              total={totalNodes}
              color={KIND_COLORS[kind] ?? "#9ca3af"}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <EntityList title="参与者" entries={actors} maxItems={6} />
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <EntityList title="动作" entries={actions} maxItems={6} />
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-hidden">
        <div className="px-3 py-2 border-b border-border-subtle">
          <h4 className="text-xs font-medium text-text-secondary">最近节点</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="text-text-tertiary">
                <th className="px-3 py-1.5 text-left font-medium">时间</th>
                <th className="px-3 py-1.5 text-left font-medium">类型</th>
                <th className="px-3 py-1.5 text-left font-medium">动作</th>
                <th className="px-3 py-1.5 text-left font-medium">执行者</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((n) => (
                <tr key={n.node_id} className="border-t border-border-subtle">
                  <td className="px-3 py-1.5 font-mono text-text-secondary">{formatDate(n.ts)}</td>
                  <td className="px-3 py-1.5">
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: KIND_COLORS[n.kind] + "22", color: KIND_COLORS[n.kind] }}
                    >
                      {KIND_LABELS[n.kind] ?? n.kind}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-text-primary">{n.action}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{n.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Nodes List ──

function NodesListTab({ nodes }: { nodes: DecisionNode[] }) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return nodes;
    const f = filter.toLowerCase();
    return nodes.filter(
      (n) =>
        n.action.toLowerCase().includes(f) ||
        n.actor.toLowerCase().includes(f) ||
        n.kind.toLowerCase().includes(f) ||
        n.node_id.toLowerCase().includes(f)
    );
  }, [nodes, filter]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="搜索节点 (动作/执行者/类型)..."
        className="w-full rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
      />
      <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="text-text-tertiary">
                <th className="px-3 py-1.5 text-left font-medium">时间</th>
                <th className="px-3 py-1.5 text-left font-medium">类型</th>
                <th className="px-3 py-1.5 text-left font-medium">动作</th>
                <th className="px-3 py-1.5 text-left font-medium">决策</th>
                <th className="px-3 py-1.5 text-left font-medium">执行者</th>
                <th className="px-3 py-1.5 text-left font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.node_id} className="border-t border-border-subtle hover:bg-surface-2/50">
                  <td className="px-3 py-1.5 font-mono text-text-secondary">{formatDate(n.ts)}</td>
                  <td className="px-3 py-1.5">
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: KIND_COLORS[n.kind] + "22", color: KIND_COLORS[n.kind] }}
                    >
                      {KIND_LABELS[n.kind] ?? n.kind}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-text-primary">{n.action}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{n.decision ?? "-"}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{n.actor}</td>
                  <td className="px-3 py-1.5 font-mono text-text-tertiary text-[10px]">{n.node_id}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-text-tertiary">
                    无匹配节点
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-text-tertiary">
        共 {filtered.length} 个节点
      </div>
    </div>
  );
}

// ── Tab: Causal Topology ──

function GraphTopology({ nodes, edges }: { nodes: DecisionNode[]; edges: DecisionEdge[] }) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const layout = useMemo(() => {
    const W = 600;
    const H = 400;
    const padding = 40;
    const kinds = ["patrol", "healing", "decision"];
    const columns: Record<string, DecisionNode[]> = {};
    for (const k of kinds) {
      columns[k] = nodes.filter((n) => n.kind === k);
    }

    const positions: Record<string, { x: number; y: number }> = {};
    kinds.forEach((kind, colIdx) => {
      const colNodes = columns[kind];
      const colX = padding + (colIdx * (W - 2 * padding)) / (kinds.length - 1);
      const availableH = H - 2 * padding;
      colNodes.forEach((n, rowIdx) => {
        const rowY = padding + (colNodes.length > 1 ? (rowIdx * availableH) / (colNodes.length - 1) : availableH / 2);
        positions[n.node_id] = { x: colX, y: rowY };
      });
    });
    return { positions, W, H };
  }, [nodes]);

  const { positions, W, H } = layout;

  const isEdgeHighlighted = (edge: DecisionEdge) => {
    if (!hoverNode) return false;
    return edge.from_node === hoverNode || edge.to_node === hoverNode;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-text-primary" /> 因果
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 border-t-2 border-dashed border-text-secondary" /> 影响
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.patrol }} /> 巡检
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.healing }} /> 自愈
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.decision }} /> 决策
        </span>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-auto">
        <svg width={W} height={H} className="mx-auto" style={{ maxWidth: "100%" }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const from = positions[edge.from_node];
            const to = positions[edge.to_node];
            if (!from || !to) return null;
            const highlighted = isEdgeHighlighted(edge);
            return (
              <g key={`${edge.from_node}-${edge.to_node}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={highlighted ? "#6366f1" : "#9ca3af"}
                  strokeWidth={highlighted ? 2 : 1}
                  strokeDasharray={RELATION_DASH[edge.relation]}
                  markerEnd="url(#arrowhead)"
                />
                {highlighted && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6366f1"
                  >
                    {edge.relation === "caused" ? "因果" : "影响"}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const pos = positions[n.node_id];
            if (!pos) return null;
            const highlighted = hoverNode === n.node_id;
            return (
              <g
                key={n.node_id}
                onMouseEnter={() => setHoverNode(n.node_id)}
                onMouseLeave={() => setHoverNode(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={highlighted ? 14 : 10}
                  fill={KIND_COLORS[n.kind]}
                  opacity={hoverNode && !highlighted ? 0.3 : 1}
                  stroke={highlighted ? "#fff" : "none"}
                  strokeWidth={highlighted ? 2 : 0}
                />
                <text
                  x={pos.x}
                  y={pos.y + 22}
                  textAnchor="middle"
                  fontSize={10}
                  fill={hoverNode && !highlighted ? "#9ca3af" : "#374151"}
                >
                  {n.action.length > 14 ? n.action.slice(0, 12) + "…" : n.action}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="text-xs text-text-tertiary">
        {nodes.length} 个节点，{edges.length} 条因果边 · 悬停节点高亮关联路径
      </div>
    </div>
  );
}

// ── Main Component ──

type TabKey = "overview" | "nodes" | "topology";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概览" },
  { key: "nodes", label: "节点列表" },
  { key: "topology", label: "因果拓扑" },
];

export const DecisionGraphViewer: React.FC<Props> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="decision-graph-viewer space-y-4">
      <div className="flex gap-1 border-b border-border-subtle pb-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
            aria-current={activeTab === tab.key ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "nodes" && <NodesListTab nodes={data.nodes} />}
        {activeTab === "topology" && <GraphTopology nodes={data.nodes} edges={data.edges} />}
      </div>
    </div>
  );
};

export default DecisionGraphViewer;
