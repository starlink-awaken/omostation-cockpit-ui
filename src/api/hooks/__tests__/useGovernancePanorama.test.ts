import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FALLBACK_PANORAMA_DATA,
  fetchGovernancePanoramaData,
  useGatesMatrix,
  useGovernancePanorama,
} from '../useGovernancePanorama';
import type { PanoramaOverviewPayload } from '../../types/panorama';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchInterval: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function livePayload(generatedAt = new Date().toISOString()): PanoramaOverviewPayload {
  return {
    generated_at: generatedAt,
    mode: 'LIVE',
    posture: { health_score: 81, compliance_rate: 0.9, active_agents_count: 3 },
    gates: [{ id: 'A1', title: 'Architecture', verdict: 'PASS', live: true }],
    guardian: {
      interval_seconds: 74,
      status: 'active',
      last_heartbeat: generatedAt,
      healthy_count: 1,
      warning_count: 0,
      danger_count: 0,
    },
    alerts: [],
    topology: [],
    evolution: [],
  };
}

function successfulResponse(data: unknown) {
  const payload = data as PanoramaOverviewPayload & { data_state?: string; source?: Record<string, unknown> };
  const observedAt = payload.generated_at;
  const declaredPayload = {
    ...payload,
    data_state: payload.data_state ?? 'LIVE',
    source: payload.source ?? {
      kind: 'zhixing-projection',
      url: 'http://127.0.0.1:43191/data.json',
      status: 'LIVE',
      fetched_at: observedAt,
      observed_at: observedAt,
    },
  };
  return {
    ok: true,
    json: async () => ({ code: 0, data: declaredPayload }),
  };
}

describe('useGovernancePanorama source truthfulness', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps an unproven API payload PARTIAL while preserving independently observed facets', async () => {
    const payload = livePayload();
    const observedKnowledge = { total: 12, fresh: 10, stale: 2, orphaned: 0, freshness_pct: 83.3, coverage_pct: 100, orphan_pct: 0 };
    payload.knowledge_health = observedKnowledge;
    payload.source = {
      kind: 'zhixing-projection',
      url: 'http://127.0.0.1:43191/data.json',
      status: 'LIVE',
      fetched_at: payload.generated_at,
      observed_at: payload.generated_at,
      facet_observations: {
        knowledge_health: {
          state: 'LIVE',
          observed_at: payload.generated_at,
          last_attempt_at: payload.generated_at,
          last_success_at: payload.generated_at,
          error_class: null,
          source_digest: 'b'.repeat(64),
          source_generation_id: null,
          source_revision_id: null,
          duration_ms: 10,
          overrun: false,
          provenance: { kind: 'direct-read', source_ref: 'bin/panorama/panorama-collect.py::collect_knowledge_health', collector_sha256: 'a'.repeat(64) },
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const { result } = renderHook(() => useGovernancePanorama(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isFallback).toBe(false);
    expect(result.current.sourceState).toBe('PARTIAL');
    expect(result.current.sourceObservedAt).toBe(payload.generated_at);
    expect(result.current.sourceAgeMs).not.toBeNull();
    expect(result.current.data.gates[0].verdict).toBe('UNKNOWN');
    expect(result.current.data.facet_observations?.knowledge_health.state).toBe('LIVE');
    expect(result.current.data.knowledge_health).toEqual(observedKnowledge);
    expect(result.current.partialFacets).not.toContain('knowledge_health');
  });

  it('accepts observed evolution and workspace enumerations without treating them as legacy records', async () => {
    const payload = livePayload();
    payload.data_state = 'PARTIAL';
    const generatedAt = payload.generated_at;
    const evolution = {
      total: 2,
      proposal_paths: ['.omo/state/evolution-proposals/a.yaml', '.omo/state/evolution-proposals/b.yaml'],
      recent_proposals: ['a', 'b'],
    };
    const workspace = {
      worktrees: [{ path: '/tmp/worktree', branch: 'main' }],
      total_worktrees: 1,
      lock_files: ['.omo/_delivery/agent-workflows/locks/held.yaml'],
      total_lock_files: 1,
    };
    payload.evolution = evolution;
    payload.workspace = workspace;
    const sourceRef = {
      evolution: 'bin/panorama/panorama-collect.py::collect_evolution',
      workspace: 'bin/panorama/panorama-collect.py::collect_workspace_hygiene',
    };
    const observation = (value: typeof evolution | typeof workspace, source: string) => ({
      state: 'LIVE', observation_status: 'OBSERVED', observed_at: generatedAt,
      last_attempt_at: generatedAt, last_success_at: generatedAt, error_class: null,
      duration_ms: 10, overrun: false, source_digest: 'b'.repeat(64),
      value, source_generation_id: null, source_revision_id: null,
      provenance: { kind: 'direct-read', source_ref: source, collector_sha256: 'a'.repeat(64), source_digest: 'b'.repeat(64) },
    });
    payload.source = {
      kind: 'zhixing-projection', url: 'http://127.0.0.1:43191/data.json', status: 'PARTIAL',
      fetched_at: generatedAt, observed_at: generatedAt, partial_facets: [],
      facet_observations: {
        evolution: observation(evolution, sourceRef.evolution),
        workspace: observation(workspace, sourceRef.workspace),
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const { result } = renderHook(() => useGovernancePanorama(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isFallback).toBe(false);
    expect(result.current.data.evolution).toEqual([]);
    expect(result.current.data.facet_observations?.evolution.value).toEqual(evolution);
    expect(result.current.data.facet_observations?.workspace.value).toEqual(workspace);
    expect(result.current.partialFacets).not.toContain('evolution');
    expect(result.current.partialFacets).not.toContain('workspace');
  });

  it.each([
    ['future observation', { state: 'LIVE', observed_at: new Date(Date.now() + 60_000).toISOString(), last_success_at: new Date(Date.now() + 60_000).toISOString() }, 'UNKNOWN'],
    ['missing observation time', { state: 'LIVE', observed_at: null, last_success_at: null }, 'UNKNOWN'],
    ['expired LIVE observation', { state: 'LIVE', observed_at: new Date(Date.now() - 6 * 60_000).toISOString(), last_success_at: new Date(Date.now() - 6 * 60_000).toISOString() }, 'STALE'],
  ])('fails closed for a %s', async (_name, timestamps, expectedState) => {
    const payload = livePayload();
    const observed = {
      ...timestamps,
      last_attempt_at: new Date().toISOString(),
      error_class: null,
      source_digest: 'b'.repeat(64),
      source_generation_id: null,
      source_revision_id: null,
      duration_ms: 10,
      overrun: false,
      provenance: { kind: 'direct-read', source_ref: 'bin/panorama/panorama-collect.py::collect_knowledge_health', collector_sha256: 'a'.repeat(64) },
    };
    payload.source = {
      kind: 'zhixing-projection',
      url: 'http://127.0.0.1:43191/data.json',
      status: 'LIVE',
      fetched_at: payload.generated_at,
      observed_at: payload.generated_at,
      facet_observations: { knowledge_health: observed },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.data.facet_observations?.knowledge_health?.state).toBe(expectedState);
  });

  it('drops facet observations with an invalid state declaration', async () => {
    const payload = livePayload();
    const timestamp = payload.generated_at;
    payload.source = {
      kind: 'zhixing-projection',
      url: 'http://127.0.0.1:43191/data.json',
      status: 'LIVE',
      fetched_at: payload.generated_at,
      observed_at: payload.generated_at,
      facet_observations: {
        knowledge_health: {
          state: 'FRESH',
          observed_at: timestamp,
          last_attempt_at: timestamp,
          last_success_at: timestamp,
          error_class: null,
          duration_ms: 10,
          overrun: false,
          provenance: { kind: 'direct-read', source_ref: 'collector', collector_sha256: 'a'.repeat(64) },
        } as never,
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.data.facet_observations).toBeUndefined();
  });

  it('retains projection-derived agent visibility without inventing a collector duration', async () => {
    const payload = livePayload();
    const timestamp = payload.generated_at;
    payload.source = {
      kind: 'zhixing-projection',
      url: 'http://127.0.0.1:43191/data.json',
      status: 'LIVE',
      fetched_at: timestamp,
      observed_at: timestamp,
      generation_id: 'generation-1', revision_id: 'revision-1',
      facet_observations: {
        agent_visibility: {
          state: 'LIVE', observed_at: timestamp, last_attempt_at: timestamp,
          last_success_at: timestamp, error_class: null, duration_ms: null,
          source_digest: 'b'.repeat(64), source_generation_id: 'generation-1', source_revision_id: 'revision-1',
          overrun: false,
          provenance: { kind: 'projection-derived', source_ref: 'collect_agent_visibility', collector_sha256: 'a'.repeat(64) },
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.data.facet_observations?.agent_visibility).toMatchObject({ state: 'LIVE', duration_ms: null });
  });

  it.each([
    ['within the six-hour projection TTL', 5 * 60 * 60 * 1000, 'LIVE'],
    ['past the six-hour projection TTL', 7 * 60 * 60 * 1000, 'STALE'],
  ])('applies the agent visibility TTL when its generation is %s', async (_name, ageMs, expectedState) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T01:00:00Z'));
    const timestamp = new Date(Date.now() - ageMs).toISOString();
    const payload = livePayload(timestamp);
    payload.source = {
      kind: 'zhixing-projection', url: 'http://127.0.0.1:43191/data.json', status: 'LIVE',
      fetched_at: timestamp, observed_at: timestamp,
      generation_id: 'generation-1', revision_id: 'revision-1',
      facet_observations: {
        agent_visibility: {
          state: 'LIVE', observed_at: timestamp, last_attempt_at: timestamp,
          last_success_at: timestamp, error_class: null, duration_ms: null,
          source_digest: 'b'.repeat(64), source_generation_id: 'generation-1', source_revision_id: 'revision-1',
          overrun: false,
          provenance: { kind: 'projection-derived', source_ref: 'collect_agent_visibility', collector_sha256: 'a'.repeat(64) },
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.data.facet_observations?.agent_visibility.state).toBe(expectedState);
  });

  it.each([
    ['missing revision binding', 'generation-1', null],
    ['mismatched generation binding', 'other-generation', 'revision-1'],
  ])('keeps agent_visibility partial with a %s', async (_name, sourceGeneration, sourceRevision) => {
    const payload = livePayload();
    const timestamp = payload.generated_at;
    payload.source = {
      kind: 'zhixing-projection', url: 'http://127.0.0.1:43191/data.json', status: 'LIVE',
      fetched_at: timestamp, observed_at: timestamp, generation_id: 'generation-1', revision_id: 'revision-1',
      facet_observations: {
        agent_visibility: {
          state: 'LIVE', observed_at: timestamp, last_attempt_at: timestamp,
          last_success_at: timestamp, error_class: null, duration_ms: null,
          source_digest: 'b'.repeat(64), source_generation_id: sourceGeneration, source_revision_id: sourceRevision,
          overrun: false,
          provenance: { kind: 'projection-derived', source_ref: 'collect_agent_visibility', collector_sha256: 'a'.repeat(64) },
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.partialFacets).toContain('agent_visibility');
    expect(result.data.agent_visibility).toBeUndefined();
    expect(result.data.facet_observations?.agent_visibility).toBeUndefined();
  });

  it('rejects an unmeasured direct observation', async () => {
    const payload = livePayload();
    const timestamp = new Date().toISOString();
    payload.source = {
      kind: 'zhixing-projection', url: 'http://127.0.0.1:43191/data.json', status: 'LIVE', fetched_at: timestamp, observed_at: timestamp,
      facet_observations: {
        knowledge_health: {
          state: 'LIVE', observed_at: timestamp, last_attempt_at: timestamp,
          last_success_at: timestamp, error_class: null, duration_ms: null,
          overrun: false,
          provenance: { kind: 'direct-read', source_ref: 'collector', collector_sha256: 'a'.repeat(64) },
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.data.facet_observations).toBeUndefined();
  });

  it('allows the local fallback aggregation to finish before aborting a slow response', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T03:00:00Z'));
    const payload = livePayload('2026-10-07T03:00:00Z');
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise((resolve, reject) => {
      const finish = setTimeout(() => resolve(successfulResponse(payload)), 5000);
      init?.signal?.addEventListener('abort', () => {
        clearTimeout(finish);
        reject(new DOMException('aborted', 'AbortError'));
      });
    }));
    vi.stubGlobal('fetch', fetchMock);

    const request = fetchGovernancePanoramaData();
    await vi.advanceTimersByTimeAsync(5000);
    const result = await request;

    expect(result.sourceState).toBe('PARTIAL');
  });

  it('uses UNKNOWN data, not a success-looking snapshot, when the API rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));

    const { result } = renderHook(() => useGatesMatrix(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isFallback).toBe(true);
    expect(result.current.gates).toHaveLength(11);
    expect(result.current.gates.every((gate) => gate.verdict === 'UNKNOWN')).toBe(true);
    expect(result.current.gates.some((gate) => gate.verdict === 'PASS')).toBe(false);
    expect(FALLBACK_PANORAMA_DATA.guardian.healthScore).toBeNull();
    expect(FALLBACK_PANORAMA_DATA.guardian.status).toBe('UNKNOWN');
  });

  it('records a failed HTTP response as an UNKNOWN source with its failure reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' }));

    const result = await fetchGovernancePanoramaData();

    expect(result.sourceState).toBe('UNKNOWN');
    expect(result.isFallback).toBe(true);
    expect(result.sourceObservedAt).toBeNull();
    expect(result.sourceAgeMs).toBeNull();
    expect(result.sourceFailure).toContain('HTTP 503');
  });

  it('masks gates and alerts when a fresh PARTIAL projection marks those facets unverified', async () => {
    const generatedAt = new Date().toISOString();
    const payload = {
      ...livePayload(generatedAt),
      data_state: 'PARTIAL' as const,
      source: {
        kind: 'zhixing-projection',
        url: 'http://127.0.0.1:43191/data.json',
        status: 'PARTIAL' as const,
        fetched_at: generatedAt,
        observed_at: generatedAt,
        error: 'field_provenance_missing',
        partial_facets: ['gates', 'alerts', 'posture', 'guardian', 'topology', 'evolution', 'knowledge_health', 'workspace'],
      },
      alerts: [{ id: 'alert-1', title: 'Observed issue', severity: 'warning' as const, category: 'observer', timestamp: generatedAt, message: 'Observed issue' }],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.isFallback).toBe(false);
    expect(result.sourceState).toBe('PARTIAL');
    expect(result.sourceFailure).toBe('field_provenance_missing');
    expect(result.partialFacets).toEqual(expect.arrayContaining(['gates', 'alerts', 'guardian']));
    expect(result.data.gates.every((gate) => gate.verdict === 'UNKNOWN')).toBe(true);
    expect(result.data.gates.some((gate) => gate.verdict === 'PASS')).toBe(false);
    expect(result.data.alerts).toEqual([]);
    expect(result.data.guardian.alerts).toEqual([]);
  });

  it('accepts explicit unknown facet nulls without manufacturing zero, offline, or empty-success values', async () => {
    const generatedAt = new Date().toISOString();
    const payload = {
      ...livePayload(generatedAt),
      data_state: 'PARTIAL' as const,
      posture: { health_score: null, compliance_rate: null, active_agents_count: null },
      guardian: { interval_seconds: null, status: 'UNKNOWN' as const, last_heartbeat: null, healthy_count: null, warning_count: null, danger_count: null },
      topology: null,
      evolution: null,
      source: {
        kind: 'zhixing-projection', url: 'http://127.0.0.1:43191/data.json', status: 'PARTIAL' as const,
        fetched_at: generatedAt, observed_at: generatedAt, partial_facets: ['gates'],
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.isFallback).toBe(false);
    expect(result.data.posture.health_score).toBeNull();
    expect(result.data.guardian.status).toBe('UNKNOWN');
    expect(result.data.guardian.healthScore).toBeNull();
    expect(result.partialFacets).toEqual(expect.arrayContaining(['posture', 'guardian', 'topology', 'evolution']));
    expect(result.data.gates.every((gate) => gate.verdict === 'UNKNOWN')).toBe(true);
  });

  it('keeps a valid but old response visible as STALE with its source age', async () => {
    const oldGeneratedAt = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(livePayload(oldGeneratedAt))));

    const result = await fetchGovernancePanoramaData();

    expect(result.isFallback).toBe(false);
    expect(result.sourceState).toBe('STALE');
    expect(result.sourceObservedAt).toBe(oldGeneratedAt);
    expect(result.sourceAgeMs).toBeGreaterThan(5 * 60 * 1000);
    expect(result.sourceFailure).toContain('超过 5 分钟');
  });

  it.each([
    ['empty gates', { ...livePayload(), gates: [] }],
    ['missing guardian', { ...livePayload(), guardian: {} }],
    ['future generated_at', livePayload(new Date(Date.now() + 60_000).toISOString())],
  ])('does not classify %s as LIVE', async (_name, payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));
    const result = await fetchGovernancePanoramaData();
    expect(result.sourceState).toBe('UNKNOWN');
    expect(result.isFallback).toBe(true);
    expect(result.data.gates.every((gate) => gate.verdict === 'UNKNOWN')).toBe(true);
  });

  it.each([
    ['unknown state', { ...livePayload(), data_state: 'FRESH' }],
    ['conflicting LIVE and PARTIAL states', { ...livePayload(), data_state: 'LIVE', source: { kind: 'zhixing-projection', url: '/data.json', status: 'PARTIAL', fetched_at: new Date().toISOString() } }],
  ])('fails closed for %s', async (_name, payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.sourceState).toBe('UNKNOWN');
    expect(result.isFallback).toBe(true);
    expect(result.data.gates.every((gate) => gate.verdict === 'UNKNOWN')).toBe(true);
  });

  it('keeps an explicit STALE declaration ahead of a conflicting LIVE declaration', async () => {
    const payload = {
      ...livePayload(),
      data_state: 'LIVE',
      source: { kind: 'zhixing-projection', url: '/data.json', status: 'STALE', fetched_at: new Date().toISOString(), observed_at: new Date().toISOString() },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulResponse(payload)));

    const result = await fetchGovernancePanoramaData();

    expect(result.sourceState).toBe('STALE');
    expect(result.isFallback).toBe(false);
  });
});
