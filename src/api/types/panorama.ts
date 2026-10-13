/**
 * SSOT TypeScript type definitions for Unified Sovereign Dashboard (Panorama).
 * Aligned with ADR-0428, ADR-0450 and GOAL-DASHBOARD-SOVEREIGN-CONVERGENCE.
 */

export type GateVerdict = 'PASS' | 'FAIL' | 'WARN' | 'UNKNOWN' | 'BLOCKED' | 'PENDING';

export interface GateItem {
  id: string; // e.g. 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'RF0', 'RC-DL'
  title: string;
  verdict: GateVerdict;
  detail?: string;
  live?: boolean;
  receipt?: string | Record<string, unknown>;
  last_checked_at?: string;
}

export interface GuardianPulse {
  interval_seconds: number; // 74s nominal heartbeat
  status: 'active' | 'degraded' | 'offline';
  last_heartbeat: string;
  healthy_count: number;
  warning_count: number;
  danger_count: number;
  active_jobs?: number;
  failed_jobs?: number;
}

/** Explicit absence is different from an observed zero or offline status. */
export interface UnknownPostureMetrics {
  health_score: null;
  compliance_rate: null;
  active_agents_count: null;
}

/** Used only when the BFF reports that Guardian has no verified observation. */
export interface UnknownGuardianPulse {
  interval_seconds: null;
  status: 'UNKNOWN';
  last_heartbeat: null;
  healthy_count: null;
  warning_count: null;
  danger_count: null;
}

export interface GovernanceAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  timestamp: string;
  message?: string;
  source?: string;
  action_href?: string;
}

export type DfsqLayer = 'DAO' | 'FA' | 'SHU' | 'QI' | 'SHENG';

export interface TopologyNode {
  id: string;
  name: string;
  layer: DfsqLayer;
  status: 'healthy' | 'warning' | 'offline';
  comp_slot?: string; // e.g. 'COMP-WS-omo'
  description?: string;
  indicators?: Record<string, string | number>;
}

export interface BcosEvolutionRecord {
  id: string;
  event_type: 'self_distill' | 'merkle_ledger' | 'policy_bind' | 'cartridge_mount' | string;
  timestamp: string;
  description: string;
  evidence_digest?: string;
  status: 'proven' | 'pending' | 'rejected' | string;
}

export interface EvolutionProposalObservation {
  total: number;
  proposal_paths: string[];
  recent_proposals: string[];
}

export interface PostureMetrics {
  health_score: number; // 0 - 100
  compliance_rate: number; // 0.0 - 1.0
  active_agents_count: number;
  uncommitted_changes?: number;
  last_patrol_at?: string;
}

export interface KnowledgeHealthData {
  total: number;
  fresh: number;
  stale: number;
  orphaned: number;
  freshness_pct: number;
  coverage_pct: number;
  orphan_pct: number;
  stale_docs?: Array<{ path: string; age_days: number }>;
}

export interface ExperienceGraphData {
  nodes_by_type: Record<string, number>;
  internal_refs: number;
  hotspots: Array<{ type: string; count: number }>;
  connectivity_pct: number;
}

export interface WorkspaceHygieneData {
  total_worktrees: number;
  worktrees?: Array<{ path: string; branch?: string }>;
  total_lock_files: number;
  lock_files: string[];
}

export interface LaunchdJobItem {
  name: string;
  label: string;
  schedule?: string;
  loaded: boolean;
  state?: string;
  pid?: number | null;
  last_exit_code?: string | null;
  last_exit_ok?: boolean;
  verdict: 'PASS' | 'FAILED' | 'UNKNOWN';
}

export interface LaunchdHealthData {
  available: boolean;
  verdict: 'PASS' | 'DEGRADED' | 'FAILED' | 'EMPTY';
  loaded: number;
  failed: number;
  jobs: LaunchdJobItem[];
}

export interface SceneConnectorsData {
  total: number;
  available: string[];
  wired_to_scenes: string[];
  unwired_available: string[];
}

export interface AgentBriefData {
  claims_activation_readiness?: {
    available: boolean;
    readiness: string;
  };
  value_proof_readiness?: {
    available: boolean;
    status: string;
  };
  next_actions?: Array<{
    id: string;
    title: string;
    domain?: string;
    priority?: string;
  }>;
  unfinished_objectives?: Array<{
    id: string;
    title?: string;
    status?: string;
  }>;
}

export interface PanoramaOverviewPayload {
  generated_at: string;
  mode: string;
  data_state?: 'LIVE' | 'PARTIAL' | 'STALE' | 'UNKNOWN';
  source?: {
    kind: string;
    url: string;
    status: 'LIVE' | 'PARTIAL' | 'STALE' | 'UNKNOWN';
    fetched_at: string;
    observed_at?: string;
    error?: string | null;
    generation_id?: string | null;
    projection_fresh_until?: string;
    source_states?: Array<Record<string, unknown>>;
    /** Facets whose current values must not be presented as verified. */
    partial_facets?: string[];
    revision_id?: string;
    field_provenance?: Record<string, {
      revision_id: string;
      observed_at: string;
      source_digest: string;
      source_ref: string;
    }>;
    facet_observations?: Record<string, PanoramaFacetObservation>;
  };
  posture: PostureMetrics | UnknownPostureMetrics;
  gates: GateItem[];
  guardian: GuardianPulse | UnknownGuardianPulse;
  alerts: GovernanceAlert[];
  topology: TopologyNode[] | null;
  evolution: BcosEvolutionRecord[] | EvolutionProposalObservation | null;
  bets_summary?: {
    total: number;
    done: number;
    in_progress: number;
    blocked: number;
  };
  // Tier 2 Deep Telemetry
  knowledge_health?: KnowledgeHealthData;
  experience_graph?: ExperienceGraphData;
  workspace?: WorkspaceHygieneData;
  launchd_health?: LaunchdHealthData;
  connectors?: SceneConnectorsData;
  agent_visibility?: AgentBriefData;
}

export interface PanoramaFacetObservation {
  state: 'LIVE' | 'PARTIAL' | 'STALE' | 'UNKNOWN';
  observed_at: string | null;
  age_ms?: number | null;
  last_attempt_at: string;
  last_success_at: string | null;
  error_class: string | null;
  /** Null only for projection-derived values that have no collector duration. */
  duration_ms: number | null;
  overrun: boolean;
  source_digest: string | null;
  observation_status: 'OBSERVED' | 'STALE' | 'UNKNOWN';
  value?: Record<string, unknown>;
  source_generation_id: string | null;
  source_revision_id: string | null;
  provenance: { kind: string; source_ref: string; collector_sha256: string; source_digest?: string; registry_sha256?: string };
}
