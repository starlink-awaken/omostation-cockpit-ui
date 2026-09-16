/** Console API types — shared across BOS, MOF, Harness tabs. */

export type RiskLevel = 'read' | 'write' | 'dangerous';

export type InvokeRoute =
  | 'agora_http'
  | 'in_process_compat'
  | 'agora_fallback_in_process'
  | 'agora_unreachable_fallback_failed'
  | 'timeout'
  | 'error';

export interface ConsoleEnvelope<T> {
  ok: boolean;
  error_code: string | null;
  error: string | null;
  data: T | null;
}

// ── BOS ──────────────────────────────────────────────────────

export interface BosInvokeRequest {
  uri: string;
  arguments: Record<string, unknown>;
  timeout_ms?: number;
}

export interface BosInvokeResult {
  uri: string;
  transport: string;
  route: InvokeRoute;
  elapsed_ms: number;
  result: unknown;
  risk: RiskLevel;
  confirmed: boolean;
  recorded_at: string;
  error: string | null;
}

export interface BosParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default: unknown;
  description: string;
}

export interface BosSchema {
  uri: string;
  domain: string;
  action: string;
  transport: string;
  risk: RiskLevel;
  parameters: BosParameter[];
  example_arguments: Record<string, unknown>;
}

export interface BosServiceEntry {
  uri: string;
  domain: string;
  action: string;
  transport: string;
  description: string;
}

// ── MOF ──────────────────────────────────────────────────────

export interface MofViolation {
  constraint_id: string;
  family: string;
  severity: 'error' | 'warning' | 'advisory';
  target: string;
  message: string;
  fix_hint?: string;
}

export interface MofAuditResult {
  total_rules: number;
  checked: number;
  violations: MofViolation[];
  by_family: Record<string, { total: number; violations: number }>;
  elapsed_ms: number;
  source: string;
  degraded: boolean;
}

// ── Harness ──────────────────────────────────────────────────

export interface HarnessRun {
  run_id: string;
  bet_id: string;
  profile: string;
  objective: string;
  status: 'submitted' | 'running' | 'blocked' | 'completed' | 'cancelled' | 'failed';
  stage: string;
  exit_code: number | null;
  elapsed_ms: number | null;
  started_at: string;
}

export interface HarnessSseEvent {
  run_id: string;
  seq: number;
  stage?: string;
  check?: string;
  blocking?: boolean;
  state?: string;
  gate?: string;
  reason?: string;
  exit_code?: number;
  elapsed_ms?: number;
  ts: string;
}

export type StreamPhase = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';
