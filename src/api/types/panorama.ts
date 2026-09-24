/**
 * SSOT TypeScript type definitions for Unified Sovereign Dashboard (Panorama).
 * Aligned with ADR-0428, ADR-0450 and GOAL-DASHBOARD-SOVEREIGN-CONVERGENCE.
 */

export type GateVerdict = 'PASS' | 'FAIL' | 'WARN' | 'UNKNOWN';

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

export interface PostureMetrics {
  health_score: number; // 0 - 100
  compliance_rate: number; // 0.0 - 1.0
  active_agents_count: number;
  uncommitted_changes?: number;
  last_patrol_at?: string;
}

export interface PanoramaOverviewPayload {
  generated_at: string;
  mode: string;
  posture: PostureMetrics;
  gates: GateItem[];
  guardian: GuardianPulse;
  alerts: GovernanceAlert[];
  topology: TopologyNode[];
  evolution: BcosEvolutionRecord[];
  bets_summary?: {
    total: number;
    done: number;
    in_progress: number;
    blocked: number;
  };
}
