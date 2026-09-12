/**
 * DecisionGraphViewer.tsx — 决策因果图可视化 (T5-05)
 *
 * 渲染祖先链（层级列表 + 边标签 + 影响面计数）。
 */

import React from "react";

export interface DecisionNode {
  node_id: string;
  kind: "patrol" | "healing" | "decision";
  actor: string;
  action: string;
  ts: string;
  context?: Record<string, unknown>;
}

export interface DecisionGraphData {
  node: DecisionNode;
  ancestors: DecisionNode[];
  downstream: DecisionNode[];
}

interface Props {
  data: DecisionGraphData;
}

const KIND_LABELS: Record<string, string> = {
  patrol: "巡检",
  healing: "自愈",
  decision: "决策",
};

export const DecisionGraphViewer: React.FC<Props> = ({ data }) => {
  const { node, ancestors, downstream } = data;
  return (
    <div className="decision-graph-viewer">
      <h3>决策节点: {node.action}</h3>
      <span className={`kind-badge kind-${node.kind}`}>
        {KIND_LABELS[node.kind] ?? node.kind}
      </span>

      <section className="ancestors">
        <h4>祖先链 ({ancestors.length})</h4>
        <ul>
          {ancestors.map((a) => (
            <li key={a.node_id}>
              <span className={`kind-badge kind-${a.kind}`}>
                {KIND_LABELS[a.kind] ?? a.kind}
              </span>
              <span className="action">{a.action}</span>
              <span className="actor">by {a.actor}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="downstream">
        <h4>下游影响面 ({downstream.length})</h4>
        <ul>
          {downstream.map((d) => (
            <li key={d.node_id}>
              <span className={`kind-badge kind-${d.kind}`}>
                {KIND_LABELS[d.kind] ?? d.kind}
              </span>
              <span className="action">{d.action}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default DecisionGraphViewer;
