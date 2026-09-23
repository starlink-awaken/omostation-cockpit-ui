/**
 * React Query hooks for cockpit-ui — scene lifecycle v2 domain.
 *
 * Covers: scene list/status, execution, calibration metrics, scene graph.
 * Backend: cockpit /api/scene-lifecycle/* (see api_scene_lifecycle.py).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../client';

// ── Types ──

export interface SceneCapability {
  uri: string;
}

export interface SceneRuntime {
  journey_ref?: string;
  timeout?: string;
  sandbox?: {
    level?: string;
    capabilities?: string[];
    permissions?: string[];
  };
}

export interface SceneTopologyEntry {
  scene: string;
  handoff_via?: string;
  trigger_on?: string;
}

export interface SceneCardV3 {
  schema: string;
  scene_id: string;
  version?: string;
  name: string;
  description?: string;
  scene_class: string;
  scene_type: string;
  domain: string;
  lifecycle: string;
  activation: string;
  owner?: string;
  approver?: string;
  bet?: string;
  runtime?: SceneRuntime;
  topology?: {
    upstream?: SceneTopologyEntry[];
    downstream?: SceneTopologyEntry[];
  };
  quality?: {
    calibration?: {
      min_samples?: number;
      min_calibration?: number;
    };
  };
}

export interface CalibrationMetrics {
  scene_id: string;
  window_days: number;
  sample_count: number;
  calibration_score: number;
  precision: number;
  avg_confidence?: number;
  false_positive_rate: number;
  avg_duration_ms?: number;
  intervention_rate?: number;
  trend_14d?: number;
  computed_at?: string;
}

export interface SceneGraphNode {
  scene_id: string;
  type: string;
  edges: { target: string; condition: string }[];
}

export interface SceneGraph {
  graph_id: string;
  name?: string;
  entry_point: string | null;
  nodes: Record<string, SceneGraphNode>;
  topological_order: string[];
  cycles_detected?: number;
  valid?: boolean;
}

// ── Endpoints (inline until endpoints.ts merge) ──

const SCENE_LIFECYCLE = {
  list: '/api/scene-lifecycle/list',
  status: (sceneId: string) => `/api/scene-lifecycle/status/${encodeURIComponent(sceneId)}`,
  execute: '/api/scene-lifecycle/execute',
  promote: '/api/scene-lifecycle/promote',
  demote: '/api/scene-lifecycle/demote',
  graph: '/api/scene-lifecycle/graph',
  metrics: (sceneId: string, window = 30) =>
    `/api/scene-lifecycle/metrics/${encodeURIComponent(sceneId)}?window=${window}`,
  escalations: '/api/scene-lifecycle/escalations',
  adjudicate: '/api/scene-lifecycle/adjudicate',
} as const;

// ── Escalation types ──

export interface SceneEscalation {
  run_id: string;
  scene_id: string;
  journey_id?: string;
  confidence?: number;
  ts?: string;
  trace_steps?: number;
}

// ── Queries ──

export function useSceneList(domain?: string) {
  return useQuery({
    queryKey: ['scene-lifecycle-list', domain ?? 'all'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; count: number; scenes: SceneCardV3[] }>(
        domain ? `${SCENE_LIFECYCLE.list}?domain=${encodeURIComponent(domain)}` : SCENE_LIFECYCLE.list,
      );
      return res.ok && res.data ? res.data : { ok: true, count: 0, scenes: [] };
    },
    staleTime: 30_000,
  });
}

export function useSceneStatus(sceneId: string | undefined) {
  return useQuery({
    queryKey: ['scene-lifecycle-status', sceneId],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; scene: SceneCardV3 }>(SCENE_LIFECYCLE.status(sceneId!));
      return res.ok && res.data ? res.data : null;
    },
    enabled: !!sceneId,
    staleTime: 15_000,
  });
}

export function useSceneMetrics(sceneId: string | undefined, window = 30) {
  return useQuery({
    queryKey: ['scene-lifecycle-metrics', sceneId, window],
    queryFn: async () => {
      const res = await apiFetch<CalibrationMetrics>(SCENE_LIFECYCLE.metrics(sceneId!, window));
      return res.ok && res.data ? res.data : null;
    },
    enabled: !!sceneId,
    staleTime: 60_000,
  });
}

export function useSceneGraph() {
  return useQuery({
    queryKey: ['scene-lifecycle-graph'],
    queryFn: async () => {
      const res = await apiFetch<SceneGraph>(SCENE_LIFECYCLE.graph);
      return res.ok && res.data ? res.data : {
        graph_id: 'empty',
        entry_point: null,
        nodes: {},
        topological_order: [],
      };
    },
    staleTime: 120_000,
  });
}

export function useEscalationQueue() {
  return useQuery({
    queryKey: ['scene-lifecycle-escalations'],
    queryFn: async () => {
      const res = await apiFetch<{ ok: boolean; count: number; escalations: SceneEscalation[] }>(
        SCENE_LIFECYCLE.escalations,
      );
      return res.ok && res.data ? res.data : { ok: true, count: 0, escalations: [] };
    },
    staleTime: 10_000,
  });
}

// ── Mutations ──

export function useExecuteScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scene_id: string; signal?: Record<string, unknown>; dry_run?: boolean }) =>
      apiPost(SCENE_LIFECYCLE.execute, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scene-lifecycle-list'] }),
  });
}

export function useAdjudicateScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      scene_id: string;
      run_id: string;
      decision: 'accept' | 'reject';
      notes?: string;
      review_seconds?: number;
      saved_seconds?: number;
    }) => apiPost(SCENE_LIFECYCLE.adjudicate, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scene-lifecycle-escalations'] });
      qc.invalidateQueries({ queryKey: ['scene-lifecycle-metrics'] });
    },
  });
}

export function useTransitionScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scene_id: string; target_level: string }) =>
      apiPost(SCENE_LIFECYCLE.promote, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scene-lifecycle-list'] });
      qc.invalidateQueries({ queryKey: ['scene-lifecycle-status'] });
    },
  });
}
