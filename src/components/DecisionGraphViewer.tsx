/**
 * DecisionGraphViewer.tsx — 决策因果图可视化 (T5-05)
 *
 * 三 Tab：概览 | 节点列表 | 因果拓扑图（SVG）
 * 支持国际化 (zh-CN / en-US) + WCAG 2.1 AA 无障碍
 */

import React, { useState, useMemo, useCallback, useRef, useContext, createContext } from "react";

// ── i18n ──

type Locale = "zh-CN" | "en-US";

interface Translations {
  title: string;
  tabs: { overview: string; nodes: string; topology: string };
  stats: { nodes: string; edges: string; actors: string; actions: string };
  overview: { distribution: string; actors: string; actions: string; recent: string };
  nodesTab: { search: string; empty: string; count: (n: number) => string };
  topology: { legend_caused: string; legend_influenced: string; legend_patrol: string; legend_healing: string; legend_decision: string; hint: string; summary: (nodes: number, edges: number) => string };
  table: { time: string; kind: string; action: string; decision: string; actor: string; id: string };
  kinds: { patrol: string; healing: string; decision: string };
}

const dict: Record<Locale, Translations> = {
  "zh-CN": {
    title: "决策因果图可视化",
    tabs: { overview: "概览", nodes: "节点列表", topology: "因果拓扑" },
    stats: { nodes: "决策节点", edges: "因果边", actors: "参与者", actions: "动作类型" },
    overview: { distribution: "按类型分布", actors: "参与者", actions: "动作", recent: "最近节点" },
    nodesTab: { search: "搜索节点 (动作/执行者/类型)...", empty: "无匹配节点", count: (n) => `共 ${n} 个节点` },
    topology: {
      legend_caused: "因果", legend_influenced: "影响",
      legend_patrol: "巡检", legend_healing: "自愈", legend_decision: "决策",
      hint: "悬停节点高亮关联路径",
      summary: (n, e) => `${n} 个节点，${e} 条因果边 · ${"悬停节点高亮关联路径"}`,
    },
    table: { time: "时间", kind: "类型", action: "动作", decision: "决策", actor: "执行者", id: "ID" },
    kinds: { patrol: "巡检", healing: "自愈", decision: "决策" },
  },
  "en-US": {
    title: "Decision Causal Graph",
    tabs: { overview: "Overview", nodes: "Nodes", topology: "Topology" },
    stats: { nodes: "Decision Nodes", edges: "Causal Edges", actors: "Actors", actions: "Action Types" },
    overview: { distribution: "Distribution by Kind", actors: "Actors", actions: "Actions", recent: "Recent Nodes" },
    nodesTab: { search: "Search nodes (action/actor/kind)...", empty: "No matching nodes", count: (n) => `${n} nodes total` },
    topology: {
      legend_caused: "Caused", legend_influenced: "Influenced",
      legend_patrol: "Patrol", legend_healing: "Healing", legend_decision: "Decision",
      hint: "Hover nodes to highlight connected paths",
      summary: (n, e) => `${n} nodes, ${e} causal edges · Hover to highlight`,
    },
    table: { time: "Time", kind: "Kind", action: "Action", decision: "Decision", actor: "Actor", id: "ID" },
    kinds: { patrol: "Patrol", healing: "Healing", decision: "Decision" },
  },
};

interface LocaleContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "zh-CN",
  t: dict["zh-CN"],
  setLocale: () => {},
});

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

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
  locale?: Locale;
}

// ── Constants ──

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

function StatCard({ label, value, id }: { label: string; value: number | string; id?: string }) {
  return (
    <div id={id} className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface-1 p-3" role="group" aria-label={label}>
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
      <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={total} aria-label={`${label}: ${count} of ${total}`}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-mono text-text-secondary">{count}</span>
    </div>
  );
}

function EntityList({ title, entries, maxItems = 5, id }: { title: string; entries: Record<string, number>; maxItems?: number; id?: string }) {
  const sorted = Object.entries(entries).sort(([, a], [, b]) => b - a).slice(0, maxItems);
  if (sorted.length === 0) return null;
  return (
    <div id={id} className="space-y-1" role="region" aria-label={title}>
      <h4 className="text-xs font-medium text-text-secondary">{title}</h4>
      <ul className="space-y-0.5">
        {sorted.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between text-xs">
            <span className="font-mono text-text-primary">{name}</span>
            <span className="text-text-tertiary" aria-label={`${name}: ${count}`}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Tab: Overview ──

function OverviewTab({ data }: { data: DecisionGraphData }) {
  const { t } = useLocale();
  const { summary, nodes, actors, actions } = data;
  const recent = [...nodes].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 10);
  const totalNodes = summary.nodes;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t.stats.nodes} value={summary.nodes} id="stat-nodes" />
        <StatCard label={t.stats.edges} value={summary.edges} id="stat-edges" />
        <StatCard label={t.stats.actors} value={Object.keys(actors).length} id="stat-actors" />
        <StatCard label={t.stats.actions} value={Object.keys(actions).length} id="stat-actions" />
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-1 p-3" role="region" aria-label={t.overview.distribution}>
        <h4 className="text-xs font-medium text-text-secondary mb-2">{t.overview.distribution}</h4>
        <div className="space-y-1.5">
          {Object.entries(summary.by_kind).map(([kind, count]) => (
            <DistributionBar
              key={kind}
              label={t.kinds[kind] ?? kind}
              count={count}
              total={totalNodes}
              color={KIND_COLORS[kind] ?? "#9ca3af"}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <EntityList title={t.overview.actors} entries={actors} maxItems={6} id="entity-actors" />
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
          <EntityList title={t.overview.actions} entries={actions} maxItems={6} id="entity-actions" />
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-hidden" role="region" aria-label={t.overview.recent}>
        <div className="px-3 py-2 border-b border-border-subtle">
          <h4 className="text-xs font-medium text-text-secondary">{t.overview.recent}</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.time}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.kind}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.action}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.actor}</th>
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
                      {t.kinds[n.kind] ?? n.kind}
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
  const { t } = useLocale();
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
      <div className="relative">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t.nodesTab.search}
          aria-label={t.nodesTab.search}
          className="w-full rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-hidden">
        <div className="max-h-96 overflow-y-auto" role="region" aria-label={t.table.action} aria-busy={false} tabIndex={0}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.time}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.kind}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.action}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.decision}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.actor}</th>
                <th scope="col" className="px-3 py-1.5 text-left font-medium text-text-tertiary">{t.table.id}</th>
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
                      {t.kinds[n.kind] ?? n.kind}
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
                  <td colSpan={6} className="px-3 py-4 text-center text-text-tertiary" role="status" aria-live="polite">
                    {t.nodesTab.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-text-tertiary" aria-live="polite">{t.nodesTab.count(filtered.length)}</div>
    </div>
  );
}

// ── Tab: Causal Topology ──

function GraphTopology({ nodes, edges }: { nodes: DecisionNode[]; edges: DecisionEdge[] }) {
  const { t } = useLocale();
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
      <div className="flex items-center gap-3 text-xs text-text-secondary" role="note" aria-label={t.topology.hint}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-text-primary" /> {t.topology.legend_caused}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 border-t-2 border-dashed border-text-secondary" /> {t.topology.legend_influenced}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.patrol }} /> {t.topology.legend_patrol}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.healing }} /> {t.topology.legend_healing}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: KIND_COLORS.decision }} /> {t.topology.legend_decision}
        </span>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-auto" role="img" aria-label={t.topology.summary(nodes.length, edges.length)}>
        <svg width={W} height={H} className="mx-auto" style={{ maxWidth: "100%" }} role="graphics-document" aria-label={t.topology.summary(nodes.length, edges.length)}>
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
            const relationLabel = edge.relation === "caused" ? t.topology.legend_caused : t.topology.legend_influenced;
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
                  aria-hidden="true"
                />
                {highlighted && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6366f1"
                    aria-hidden="true"
                  >
                    {relationLabel}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const pos = positions[n.node_id];
            if (!pos) return null;
            const highlighted = hoverNode === n.node_id;
            const kindLabel = t.kinds[n.kind] ?? n.kind;
            return (
              <g
                key={n.node_id}
                onMouseEnter={() => setHoverNode(n.node_id)}
                onMouseLeave={() => setHoverNode(null)}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                aria-label={`${kindLabel}: ${n.action} (${n.actor})`}
                aria-pressed={highlighted}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setHoverNode(hoverNode === n.node_id ? null : n.node_id);
                  }
                }}
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
      <div className="text-xs text-text-tertiary" aria-live="polite">{t.topology.summary(nodes.length, edges.length)}</div>
    </div>
  );
}

// ── Main Component ──

type TabKey = "overview" | "nodes" | "topology";

const TAB_KEYS: TabKey[] = ["overview", "nodes", "topology"];

export const DecisionGraphViewer: React.FC<Props> = ({ data, locale = "zh-CN" }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = dict[currentLocale];

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    let newIdx = idx;
    if (e.key === "ArrowRight") {
      newIdx = (idx + 1) % TAB_KEYS.length;
    } else if (e.key === "ArrowLeft") {
      newIdx = (idx - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    } else if (e.key === "Home") {
      newIdx = 0;
    } else if (e.key === "End") {
      newIdx = TAB_KEYS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(TAB_KEYS[newIdx]);
    tabRefs.current[newIdx]?.focus();
  }, []);

  return (
    <LocaleContext.Provider value={{ locale: currentLocale, t, setLocale: setCurrentLocale }}>
      <div className="decision-graph-viewer space-y-4" role="region" aria-label={t.title}>
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border-subtle pb-0 overflow-x-auto" role="tablist" aria-label={t.title} aria-orientation="horizontal">
          {TAB_KEYS.map((key, idx) => (
            <button
              key={key}
              ref={(el) => { tabRefs.current[idx] = el; }}
              role="tab"
              id={`tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`panel-${key}`}
              tabIndex={activeTab === key ? 0 : -1}
              onClick={() => setActiveTab(key)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                activeTab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {t.tabs[key]}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="min-h-[300px]" aria-live="polite" aria-atomic="false">
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={activeTab !== "overview"}>
            {activeTab === "overview" && <OverviewTab data={data} />}
          </div>
          <div id="panel-nodes" role="tabpanel" aria-labelledby="tab-nodes" hidden={activeTab !== "nodes"}>
            {activeTab === "nodes" && <NodesListTab nodes={data.nodes} />}
          </div>
          <div id="panel-topology" role="tabpanel" aria-labelledby="tab-topology" hidden={activeTab !== "topology"}>
            {activeTab === "topology" && <GraphTopology nodes={data.nodes} edges={data.edges} />}
          </div>
        </div>
      </div>
    </LocaleContext.Provider>
  );
};

export default DecisionGraphViewer;
