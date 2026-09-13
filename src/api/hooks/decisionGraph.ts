/**
 * React Query hooks for cockpit-ui — decision graph domain (T5-05).
 *
 * Provides data fetching hooks for the DecisionGraphViewer component.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import { API_ENDPOINTS } from '../endpoints';

// ── Types ──

export interface DecisionNode {
  node_id: string;
  kind: 'patrol' | 'healing' | 'decision';
  actor: string;
  action: string;
  ts: string;
  decision?: string;
  context?: Record<string, unknown>;
}

export interface DecisionEdge {
  from_node: string;
  to_node: string;
  relation: 'caused' | 'influenced';
}

export interface DecisionGraphSummary {
  nodes: number;
  edges: number;
  by_kind: Record<string, number>;
  actors: Record<string, number>;
  actions: Record<string, number>;
}

export interface DecisionGraphData {
  summary: DecisionGraphSummary;
  nodes: DecisionNode[];
  edges: DecisionEdge[];
  actors: Record<string, number>;
  actions: Record<string, number>;
}

export interface NodeSubgraph {
  node: DecisionNode;
  ancestors: DecisionNode[];
  downstream: DecisionNode[];
}

// ── Hooks ──

/**
 * Fetch complete decision graph data (summary + nodes + edges + aggregations).
 * Combines /summary and /nodes into the DecisionGraphData shape expected by DecisionGraphViewer.
 */
export function useDecisionGraphData() {
  return useQuery({
    queryKey: ['decision-graph-data'],
    queryFn: async (): Promise<DecisionGraphData> => {
      // Fetch summary and nodes in parallel
      const [summaryRes, nodesRes] = await Promise.all([
        apiFetch<DecisionGraphSummary>(API_ENDPOINTS.decisionGraph.summary),
        apiFetch<{ nodes: DecisionNode[]; edges: DecisionEdge[] }>(
          API_ENDPOINTS.decisionGraph.nodes,
        ),
      ]);

      if (!summaryRes.ok || !summaryRes.data) {
        throw new Error(summaryRes.error || 'Failed to load graph summary');
      }
      if (!nodesRes.ok || !nodesRes.data) {
        throw new Error(nodesRes.error || 'Failed to load graph nodes');
      }

      return {
        summary: summaryRes.data,
        nodes: nodesRes.data.nodes,
        edges: nodesRes.data.edges,
        actors: summaryRes.data.actors,
        actions: summaryRes.data.actions,
      };
    },
    staleTime: 30000,
    retry: 1,
  });
}

/**
 * Fetch subgraph (ancestors + downstream) for a specific node.
 */
export function useDecisionGraphNode(nodeId: string) {
  return useQuery({
    queryKey: ['decision-graph-node', nodeId],
    queryFn: async (): Promise<NodeSubgraph> => {
      const res = await apiFetch<NodeSubgraph>(
        API_ENDPOINTS.decisionGraph.node(nodeId),
      );
      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Failed to load node subgraph');
      }
      return res.data;
    },
    enabled: Boolean(nodeId),
    staleTime: 30000,
  });
}
