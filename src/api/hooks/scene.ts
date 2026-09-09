import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../index';
import { SCENE_ENDPOINTS } from '../endpoints';

export interface SceneCard {
  schema: string;
  scene_id: string;
  name: string;
  scene_class: string;
  scene_type: string;
  domain: string;
  lifecycle: string;
  activation: string;
  owner: string;
  approver: string;
  runtime?: {
    journey_ref?: string;
    sandbox?: { capability_refs?: string[] };
  };
  quality?: { calibration?: { min_samples?: number; min_calibration?: number } };
  topology?: { upstream?: any[]; downstream?: any[] };
}

export interface CalibrationMetrics {
  scene_id: string;
  sample_count: number;
  calibration_score: number;
  precision: number;
  false_positive_rate: number;
  avg_duration_ms: number;
  trend_14d: number;
}

export function useSceneList(domain?: string) {
  return useQuery({
    queryKey: ['scene-list', domain],
    queryFn: () => apiFetch<{ ok: boolean; count: number; scenes: SceneCard[] }>(
      domain ? `${SCENE_ENDPOINTS.list}?domain=${domain}` : SCENE_ENDPOINTS.list,
    ),
    staleTime: 30000,
  });
}

export function useSceneStatus(sceneId: string) {
  return useQuery({
    queryKey: ['scene-status', sceneId],
    queryFn: () => apiFetch<{ ok: boolean; scene: SceneCard }>(SCENE_ENDPOINTS.status(sceneId)),
    enabled: !!sceneId,
    staleTime: 15000,
  });
}

export function useSceneMetrics(sceneId: string, window = 30) {
  return useQuery({
    queryKey: ['scene-metrics', sceneId, window],
    queryFn: () => apiFetch<CalibrationMetrics>(SCENE_ENDPOINTS.metrics(sceneId, window)),
    enabled: !!sceneId,
    staleTime: 60000,
  });
}

export function useSceneGraph() {
  return useQuery({
    queryKey: ['scene-graph'],
    queryFn: () => apiFetch<any>(SCENE_ENDPOINTS.graph),
    staleTime: 120000,
  });
}

export function useExecuteScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scene_id: string; signal?: Record<string, unknown>; dry_run?: boolean }) =>
      apiPost(SCENE_ENDPOINTS.execute, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scene-list'] }),
  });
}

export function usePromoteScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scene_id: string; target_level: string }) =>
      apiPost(SCENE_ENDPOINTS.promote, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scene-status'] }),
  });
}
