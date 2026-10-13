/** Governance Panorama source-of-truth hook. */
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { AgentBriefData, BcosEvolutionRecord, ExperienceGraphData, GateItem, GateVerdict, GovernanceAlert, GuardianPulse, KnowledgeHealthData, LaunchdHealthData, PanoramaFacetObservation, PanoramaOverviewPayload, PostureMetrics, SceneConnectorsData, WorkspaceHygieneData } from '../types/panorama';

const GOVERNANCE_GATE_IDS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'RF0', 'RC-DL'] as const;
const PANORAMA_STALE_AFTER_MS = 5 * 60 * 1000;
const AGENT_VISIBILITY_STALE_AFTER_MS = 6 * 60 * 60 * 1000;
const PANORAMA_REQUEST_TIMEOUT_MS = 10_000;
export type GovernancePanoramaSourceState = 'LIVE' | 'PARTIAL' | 'STALE' | 'UNKNOWN';

export interface DisplayGateItem extends Omit<GateItem, 'verdict'> { verdict: GateVerdict | 'BLOCKED' | 'PENDING'; name: string; description?: string; evidencePath?: string; details?: string[]; exitCode?: number; }
export interface DisplayPosture { health_score: number | null; compliance_rate: number | null; active_agents_count: number | null; }
export interface DisplayGuardian {
  interval_seconds: number | null; status: GuardianPulse['status'] | 'UNKNOWN'; last_heartbeat: string | null;
  healthy_count: number | null; warning_count: number | null; danger_count: number | null;
  pulseIntervalSec: number | null; lastHeartbeat: string | null; healthScore: number | null;
  subsystems: Array<{ id: string; name: string; status: string; latencyMs?: number }>; alerts: GovernanceAlert[];
}
export interface DisplayTopology { layers: Array<{ id: string; name: string; description?: string; status: string; nodes: Array<{ id: string; name: string; label?: string; kind?: string; status: string; description?: string }> }>; slots: Array<{ id: string; name: string; status: string; component?: string }>; }
export interface LegacyBcosEvolution { epoch?: number; selfDistillationCount?: number; learningRate?: number | null; healthScore?: number; lastEvolutionTime?: string; recentRecords?: Array<{ id: string; epoch: number; timestamp: string; summary: string; impactScope: string }>; }
export interface PanoramaDisplayPayload {
  generated_at: string; mode: string; posture: DisplayPosture; gates: DisplayGateItem[]; guardian: DisplayGuardian; alerts: GovernanceAlert[]; topology: DisplayTopology; evolution: BcosEvolutionRecord[]; bcos?: LegacyBcosEvolution;
  knowledge_health?: KnowledgeHealthData; experience_graph?: ExperienceGraphData; workspace?: WorkspaceHygieneData; launchd_health?: LaunchdHealthData; connectors?: SceneConnectorsData; agent_visibility?: AgentBriefData;
  facet_observations?: Record<string, PanoramaFacetObservation>;
}

function createUnknownGates(reason: string): DisplayGateItem[] {
  return GOVERNANCE_GATE_IDS.map((id) => ({ id, title: id, name: id, description: reason, detail: '来源不可用，无法判定。', verdict: 'UNKNOWN', live: false }));
}
function createUnavailablePayload(): PanoramaDisplayPayload {
  return {
    generated_at: '', mode: 'UNAVAILABLE', posture: { health_score: null, compliance_rate: null, active_agents_count: null },
    gates: createUnknownGates('治理全景数据源不可用；此门禁状态未获验证。'),
    guardian: { interval_seconds: null, status: 'UNKNOWN', last_heartbeat: null, healthy_count: null, warning_count: null, danger_count: null, pulseIntervalSec: null, lastHeartbeat: null, healthScore: null, subsystems: [], alerts: [] },
    alerts: [{ id: 'governance-panorama-source-unavailable', title: '治理全景数据源不可用', severity: 'warning', category: 'data-freshness', timestamp: '', message: '没有可验证的治理全景数据，所有聚合状态均为 UNKNOWN。', source: '/api/governance/panorama' }],
    topology: { layers: [], slots: [] }, evolution: [],
  };
}
export const FALLBACK_PANORAMA_DATA: PanoramaDisplayPayload = createUnavailablePayload();

function displayGate(gate: GateItem): DisplayGateItem { return { ...gate, name: gate.title, description: gate.detail, evidencePath: typeof gate.receipt === 'string' ? gate.receipt : undefined }; }
function normalizeFacetObservations(value: unknown, payload: PanoramaOverviewPayload): Record<string, PanoramaFacetObservation> | undefined {
  if (!isRecord(value)) return undefined;
  const now = Date.now();
  const normalized: Record<string, PanoramaFacetObservation> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!isRecord(raw) || (raw.state !== 'LIVE' && raw.state !== 'PARTIAL' && raw.state !== 'STALE' && raw.state !== 'UNKNOWN')) continue;
    const lastAttemptMs = typeof raw.last_attempt_at === 'string' ? Date.parse(raw.last_attempt_at) : Number.NaN;
    const duration = raw.duration_ms;
    const provenance = raw.provenance;
    const digestValid = (raw.state === 'UNKNOWN' && raw.source_digest === null)
      || (typeof raw.source_digest === 'string' && /^[a-f0-9]{64}$/i.test(raw.source_digest));
    const collectorValid = isRecord(provenance) && typeof provenance.collector_sha256 === 'string' && /^[a-f0-9]{64}$/i.test(provenance.collector_sha256);
    const isMeasuredDuration = typeof duration === 'number' && Number.isFinite(duration) && duration >= 0;
    const hasExactProjectionBinding = typeof raw.source_generation_id === 'string' && raw.source_generation_id.trim().length > 0
      && typeof raw.source_revision_id === 'string' && raw.source_revision_id.trim().length > 0
      && typeof payload.source?.generation_id === 'string' && payload.source.generation_id.trim().length > 0
      && typeof payload.source?.revision_id === 'string' && payload.source.revision_id.trim().length > 0;
    const isProjectionDerived = key === 'agent_visibility'
      && isRecord(provenance) && provenance.kind === 'projection-derived' && duration === null
      && hasExactProjectionBinding
      && raw.source_generation_id === payload.source?.generation_id
      && raw.source_revision_id === payload.source?.revision_id
      && typeof payload.generated_at === 'string' && raw.observed_at === payload.generated_at;
    const expectedSourceRef: Record<string, string> = {
      knowledge_health: 'bin/panorama/panorama-collect.py::collect_knowledge_health',
      experience_graph: 'bin/panorama/panorama-collect.py::collect_experience_graph',
      connectors: 'bin/panorama/panorama-collect.py::collect_connectors',
      bos_verifier: 'bin/panorama/panorama-collect.py::collect_bos_verifier',
      evolution: 'bin/panorama/panorama-collect.py::collect_evolution',
      workspace: 'bin/panorama/panorama-collect.py::collect_workspace_hygiene',
      launchd_health: 'bin/panorama/panorama-collect.py::collect_launchd_health',
      agent_visibility: 'collect_agent_visibility',
    };
    const registryDigestValid = key !== 'launchd_health' || raw.state === 'UNKNOWN'
      || (isRecord(provenance)
        && typeof provenance.registry_sha256 === 'string'
        && /^[a-f0-9]{64}$/i.test(provenance.registry_sha256)
        && isRecord(raw.value)
        && raw.value.registry_sha256 === provenance.registry_sha256);
    if (!Number.isFinite(lastAttemptMs) || lastAttemptMs > now
      || (!isMeasuredDuration && !isProjectionDerived)
      || !digestValid || !collectorValid || !registryDigestValid
      || typeof raw.overrun !== 'boolean'
      || !isRecord(provenance)
      || typeof provenance.kind !== 'string'
      || typeof provenance.source_ref !== 'string'
      || provenance.source_ref !== expectedSourceRef[key]
      || typeof provenance.collector_sha256 !== 'string') continue;

    const observedMs = typeof raw.observed_at === 'string' ? Date.parse(raw.observed_at) : Number.NaN;
    const successMs = typeof raw.last_success_at === 'string' ? Date.parse(raw.last_success_at) : Number.NaN;
    const timestampsValid = Number.isFinite(observedMs) && observedMs <= now
      && Number.isFinite(successMs) && successMs <= now && observedMs === successMs;
    let state = raw.state as PanoramaFacetObservation['state'];
    if (!timestampsValid) state = 'UNKNOWN';
    else {
      const ttlMs = key === 'agent_visibility' ? AGENT_VISIBILITY_STALE_AFTER_MS : PANORAMA_STALE_AFTER_MS;
      if ((state === 'LIVE' || state === 'PARTIAL') && now - observedMs > ttlMs) state = 'STALE';
    }
    normalized[key] = {
      state,
      observed_at: timestampsValid ? raw.observed_at as string : null,
      age_ms: timestampsValid ? Math.max(0, now - observedMs) : null,
      last_attempt_at: raw.last_attempt_at,
      last_success_at: timestampsValid ? raw.last_success_at as string : null,
      error_class: typeof raw.error_class === 'string' ? raw.error_class : null,
      duration_ms: isMeasuredDuration ? duration : null,
      overrun: raw.overrun,
      source_digest: typeof raw.source_digest === 'string' ? raw.source_digest : null,
      observation_status: raw.observation_status === 'OBSERVED' || raw.observation_status === 'STALE' || raw.observation_status === 'UNKNOWN'
        ? raw.observation_status
        : raw.state === 'LIVE' ? 'OBSERVED' : raw.state === 'PARTIAL' ? 'STALE' : raw.state as 'STALE' | 'UNKNOWN',
      value: isRecord(raw.value) ? raw.value : undefined,
      source_generation_id: typeof raw.source_generation_id === 'string' ? raw.source_generation_id : null,
      source_revision_id: typeof raw.source_revision_id === 'string' ? raw.source_revision_id : null,
      provenance: {
        kind: provenance.kind,
        source_ref: provenance.source_ref,
        collector_sha256: provenance.collector_sha256,
        source_digest: typeof provenance.source_digest === 'string' ? provenance.source_digest : undefined,
        registry_sha256: typeof provenance.registry_sha256 === 'string' ? provenance.registry_sha256 : undefined,
      },
    };
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}
function unknownGuardian(alerts: GovernanceAlert[]): DisplayGuardian {
  return { interval_seconds: null, status: 'UNKNOWN', last_heartbeat: null, healthy_count: null, warning_count: null, danger_count: null, pulseIntervalSec: null, lastHeartbeat: null, healthScore: null, subsystems: [], alerts };
}
function unknownPosture(): DisplayPosture { return { health_score: null, compliance_rate: null, active_agents_count: null }; }
function adaptPayload(payload: PanoramaOverviewPayload, partialFacets: string[]): PanoramaDisplayPayload {
  const gatesVerified = !partialFacets.includes('gates');
  const topology = Array.isArray(payload.topology) ? payload.topology : null;
  const layers = topology?.reduce<DisplayTopology['layers']>((all, node) => {
    const existing = all.find((layer) => layer.id === node.layer);
    const item = { id: node.id, name: node.name, status: node.status, description: node.description };
    if (existing) existing.nodes.push(item); else all.push({ id: node.layer, name: node.layer, status: node.status, nodes: [item] });
    return all;
  }, []);
  const posture = isPosture(payload.posture) ? payload.posture : unknownPosture();
  const alerts = partialFacets.includes('alerts') ? [] : payload.alerts;
  const facetObservations = normalizeFacetObservations(payload.source?.facet_observations, payload);
  const facetUsable = (name: string) => !partialFacets.includes(name) || facetObservations?.[name]?.state === 'PARTIAL';
  const guardian = isGuardian(payload.guardian)
    ? { ...payload.guardian, pulseIntervalSec: payload.guardian.interval_seconds, lastHeartbeat: payload.guardian.last_heartbeat, healthScore: posture.health_score, subsystems: [], alerts }
    : unknownGuardian(alerts);
  return {
    generated_at: payload.generated_at, mode: payload.mode,
    posture,
    gates: gatesVerified ? payload.gates.map(displayGate) : createUnknownGates('门禁字段缺少已验证的来源与新鲜度证明。'),
    guardian,
    alerts, topology: { layers: layers ?? [], slots: topology?.filter((node) => node.comp_slot).map((node) => ({ id: node.comp_slot ?? node.id, name: node.name, status: node.status, component: node.id })) ?? [] }, evolution: Array.isArray(payload.evolution) && facetUsable('evolution') ? payload.evolution : [],
    knowledge_health: facetUsable('knowledge_health') ? payload.knowledge_health : undefined, experience_graph: facetUsable('experience_graph') ? payload.experience_graph : undefined, workspace: facetUsable('workspace') ? payload.workspace : undefined, launchd_health: facetUsable('launchd_health') ? payload.launchd_health : undefined, connectors: facetUsable('connectors') ? payload.connectors : undefined, agent_visibility: facetUsable('agent_visibility') ? payload.agent_visibility : undefined,
    facet_observations: facetObservations,
  };
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function isGateVerdict(value: unknown): value is GateVerdict { return value === 'PASS' || value === 'FAIL' || value === 'WARN' || value === 'UNKNOWN' || value === 'BLOCKED' || value === 'PENDING'; }
function isGate(value: unknown): value is GateItem { return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' && isGateVerdict(value.verdict); }
function isGuardian(value: unknown): value is GuardianPulse { return isRecord(value) && typeof value.interval_seconds === 'number' && (value.status === 'active' || value.status === 'degraded' || value.status === 'offline') && typeof value.last_heartbeat === 'string' && typeof value.healthy_count === 'number' && typeof value.warning_count === 'number' && typeof value.danger_count === 'number'; }
function isPosture(value: unknown): value is PostureMetrics { return isRecord(value) && typeof value.health_score === 'number' && typeof value.compliance_rate === 'number' && typeof value.active_agents_count === 'number'; }
function isUnknownPosture(value: unknown): boolean { return isRecord(value) && value.health_score === null && value.compliance_rate === null && value.active_agents_count === null; }
function isUnknownGuardian(value: unknown): boolean { return isRecord(value) && value.interval_seconds === null && value.status === 'UNKNOWN' && value.last_heartbeat === null && value.healthy_count === null && value.warning_count === null && value.danger_count === null; }
function isEvolutionObservation(value: unknown): boolean { return isRecord(value) && typeof value.total === 'number' && Number.isInteger(value.total) && value.total >= 0 && Array.isArray(value.proposal_paths) && value.proposal_paths.every((path) => typeof path === 'string') && Array.isArray(value.recent_proposals) && value.recent_proposals.every((item) => typeof item === 'string'); }
function isPanoramaPayload(value: unknown): value is PanoramaOverviewPayload { return isRecord(value) && typeof value.generated_at === 'string' && typeof value.mode === 'string' && (isPosture(value.posture) || isUnknownPosture(value.posture)) && Array.isArray(value.gates) && value.gates.length > 0 && value.gates.every(isGate) && (isGuardian(value.guardian) || isUnknownGuardian(value.guardian)) && Array.isArray(value.alerts) && (Array.isArray(value.topology) || value.topology === null) && (Array.isArray(value.evolution) || value.evolution === null || isEvolutionObservation(value.evolution)); }
function extractPayload(response: unknown): unknown { return isRecord(response) && 'data' in response && response.data !== undefined ? response.data : response; }

export interface GovernancePanoramaFetchResult { data: PanoramaDisplayPayload; isFallback: boolean; sourceState: GovernancePanoramaSourceState; sourceObservedAt: string | null; sourceAgeMs: number | null; sourceFailure: string | null; partialFacets: string[]; }
function unavailablePanorama(reason: string): GovernancePanoramaFetchResult { return { data: createUnavailablePayload(), isFallback: true, sourceState: 'UNKNOWN', sourceObservedAt: null, sourceAgeMs: null, sourceFailure: reason, partialFacets: [] }; }
export async function fetchGovernancePanoramaData(): Promise<GovernancePanoramaFetchResult> {
  try {
    const res = await apiFetch<unknown>('/api/governance/panorama', { timeout: PANORAMA_REQUEST_TIMEOUT_MS });
    if (!res.ok || !res.data) return unavailablePanorama(res.error ?? '治理全景接口未返回可用数据。');
    const payload = extractPayload(res.data);
    let source: Record<string, unknown> | undefined;
    let declaredState: GovernancePanoramaSourceState;
    if (isRecord(payload)) {
      source = isRecord(payload.source) ? payload.source : undefined;
      const candidates = [payload.data_state, source?.status].filter((value) => value !== undefined);
      if (candidates.includes('STALE')) declaredState = 'STALE';
      else if (candidates.length === 0 || candidates.some((value) => value !== 'LIVE' && value !== 'PARTIAL' && value !== 'STALE' && value !== 'UNKNOWN')) {
        return unavailablePanorama('治理全景响应缺少有效的数据状态声明。');
      } else if (candidates.includes('UNKNOWN')) {
        return unavailablePanorama(typeof source?.error === 'string' ? source.error : '治理全景数据源尚未通过完整性验证。');
      } else if (new Set(candidates).size !== 1) {
        return unavailablePanorama('治理全景响应的数据状态声明互相冲突。');
      } else {
        declaredState = candidates[0] as GovernancePanoramaSourceState;
      }
    } else {
      return unavailablePanorama('治理全景响应格式无效。');
    }
    if (declaredState === 'UNKNOWN') {
      return unavailablePanorama(typeof source?.error === 'string' ? source.error : '治理全景数据源尚未通过完整性验证。');
    }
    if (!isPanoramaPayload(payload)) return unavailablePanorama('治理全景响应不完整：需要非空门禁、完整哨兵与有效生成时间。');
    const observedAtMs = Date.parse(payload.generated_at);
    if (!Number.isFinite(observedAtMs)) return unavailablePanorama('治理全景响应未提供可验证的生成时间。');
    const sourceObservedAt = typeof source?.observed_at === 'string' ? source.observed_at : payload.generated_at;
    const sourceTimestampMs = Date.parse(sourceObservedAt);
    if (!Number.isFinite(sourceTimestampMs)) return unavailablePanorama('治理全景响应未提供可验证的来源观察时间。');
    const sourceAgeMs = Date.now() - sourceTimestampMs;
    if (sourceAgeMs < 0) return unavailablePanorama('治理全景响应的生成时间位于未来，无法验证当前状态。');
    const declaredPartialFacets = Array.isArray(source?.partial_facets) ? source.partial_facets : null;
    const hasPartialFacetDeclaration = declaredPartialFacets !== null;
    const partialFacets = declaredPartialFacets !== null
      ? declaredPartialFacets.filter((facet): facet is string => typeof facet === 'string' && facet.length > 0)
      : ['gates', 'alerts', 'posture', 'guardian', 'topology', 'evolution', 'knowledge_health', 'experience_graph', 'connectors', 'agent_visibility'];
    const fieldProofs = isRecord(source?.field_provenance) ? source.field_provenance : {};
    const facetObservations = normalizeFacetObservations(source?.facet_observations, payload);
    for (const field of ['gates', 'alerts', 'posture', 'guardian', 'topology', 'evolution', 'knowledge_health', 'experience_graph', 'workspace', 'launchd_health', 'connectors', 'agent_visibility']) {
      const proof = fieldProofs[field];
      const proofAt = isRecord(proof) && typeof proof.observed_at === 'string' ? Date.parse(proof.observed_at) : Number.NaN;
      const fieldProofValid = isRecord(proof)
        && proof.revision_id === source?.revision_id
        && typeof proof.source_ref === 'string' && proof.source_ref.length > 0
        && typeof proof.source_digest === 'string' && /^[a-f0-9]{64}$/i.test(proof.source_digest)
        && Number.isFinite(proofAt) && proofAt <= Date.now() && Date.now() - proofAt <= PANORAMA_STALE_AFTER_MS;
      const observationProofValid = facetObservations?.[field]?.state === 'LIVE';
      const proofValid = fieldProofValid || observationProofValid;
      if (!proofValid && !partialFacets.includes(field)) partialFacets.push(field);
      if (proofValid && !hasPartialFacetDeclaration) {
        const unprovenIndex = partialFacets.indexOf(field);
        if (unprovenIndex >= 0) partialFacets.splice(unprovenIndex, 1);
      }
    }
    // A nullable backend facet is an explicit UNKNOWN value. Preserve the raw
    // null in the contract while ensuring views never mistake their internal
    // empty display shape for a verified, empty topology or evolution stream.
    if (!isPosture(payload.posture) && !partialFacets.includes('posture')) partialFacets.push('posture');
    if (!isGuardian(payload.guardian) && !partialFacets.includes('guardian')) partialFacets.push('guardian');
    if (payload.topology === null && !partialFacets.includes('topology')) partialFacets.push('topology');
    if (payload.evolution === null && !partialFacets.includes('evolution')) partialFacets.push('evolution');
    const sourceState: GovernancePanoramaSourceState = declaredState === 'STALE' || sourceAgeMs > PANORAMA_STALE_AFTER_MS
      ? 'STALE'
      : declaredState === 'PARTIAL' || source?.status === 'PARTIAL' || partialFacets.length > 0
        ? 'PARTIAL'
        : 'LIVE';
    const sourceFailure = typeof source?.error === 'string' ? source.error : sourceState === 'STALE' ? '治理全景数据已超过 5 分钟的新鲜度窗口。' : null;
    return { data: { ...adaptPayload(payload, partialFacets), facet_observations: facetObservations }, isFallback: sourceState === 'UNKNOWN', sourceState, sourceObservedAt, sourceAgeMs, sourceFailure, partialFacets };
  } catch (error) { return unavailablePanorama(error instanceof Error ? error.message : '治理全景请求失败。'); }
}
export interface GovernancePanoramaResult extends GovernancePanoramaFetchResult { isLoading: boolean; isError: boolean; refetch: () => Promise<GovernancePanoramaFetchResult>; }
export function useGovernancePanorama(): GovernancePanoramaResult {
  const query = useQuery({ queryKey: ['governance-panorama'], queryFn: fetchGovernancePanoramaData, staleTime: 30000, refetchInterval: 74000 });
  const current = query.data ?? unavailablePanorama('治理全景数据尚未加载。');
  return { ...current, isLoading: query.isLoading, isError: query.isError, refetch: async () => { const result = await query.refetch(); return result.data ?? unavailablePanorama(result.error instanceof Error ? result.error.message : '治理全景刷新失败。'); } };
}
type PanoramaSubResult<T> = { isLoading: boolean; isFallback: boolean; sourceState: GovernancePanoramaSourceState; sourceFailure: string | null; sourceObservedAt: string | null; sourceAgeMs: number | null; partialFacets: string[]; refetch: () => Promise<GovernancePanoramaFetchResult>; } & T;
export function useGatesMatrix(): PanoramaSubResult<{ gates: DisplayGateItem[] }> { const panorama = useGovernancePanorama(); return { gates: panorama.data.gates, ...panorama }; }
export function useGuardianStatus(): PanoramaSubResult<{ guardian: DisplayGuardian }> { const panorama = useGovernancePanorama(); return { guardian: panorama.data.guardian, ...panorama }; }
export function useSystemTopology(): PanoramaSubResult<{ topology: DisplayTopology }> { const panorama = useGovernancePanorama(); return { topology: panorama.data.topology, ...panorama }; }
export function useBcosEvolution(): PanoramaSubResult<{ bcos: LegacyBcosEvolution | undefined }> { const panorama = useGovernancePanorama(); return { bcos: panorama.data.bcos, ...panorama }; }
