/**
 * Types for ComputeView components.
 */

export interface NodeTraffic {
  node_id: string;
  node_label: string;
  route_type: string;
  calls: number;
  tokens: number;
  estimated_cost_usd: number;
  equivalent_cloud_cost_usd: number;
  saved_vs_cloud_usd: number;
  latency_ms_avg: number | null;
  tokens_per_second_avg: number | null;
}

export interface ComputeStatus {
  nodes: NodeTraffic[];
  total_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  total_cloud_cost_usd: number;
  total_saved_usd: number;
  circuit_broken: boolean;
  daily_budget: number;
}

export interface GenerateResult {
  status: string;
  content?: string;
  error?: string;
  detail?: string;
}

export interface StrictComputeRound {
  id: number;
  model: string;
  input: string;
  output?: string;
  status: 'pending' | 'success' | 'rejected' | 'unknown';
  notice: string;
}

export interface StrictComputeRequest {
  prompt: string;
  model: string;
  max_tokens: number;
  timeout: number;
  strict_model: true;
}

export type StrictComputeOutcome =
  | { status: 'success'; content: string }
  | { status: 'rejected' | 'unknown'; notice: string };

export interface LocalModel {
  model_id: string;
  display_name?: string;
  capabilities?: string[];
  runs_on?: string;
  context_window?: number;
}
