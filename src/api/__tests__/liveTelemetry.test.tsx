import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLiveTelemetry } from '../liveTelemetry';
import { useGovernancePanorama, type GovernancePanoramaResult } from '../hooks/useGovernancePanorama';
import { FALLBACK_PANORAMA_DATA } from '../hooks/useGovernancePanorama';

vi.mock('../hooks/useGovernancePanorama', () => ({
  useGovernancePanorama: vi.fn(),
  FALLBACK_PANORAMA_DATA: {
    generated_at: '', mode: 'UNAVAILABLE', posture: { health_score: 0, compliance_rate: 0, active_agents_count: 0 },
    gates: [], guardian: { interval_seconds: 0, status: 'offline', last_heartbeat: '', healthy_count: 0, warning_count: 0, danger_count: 0, pulseIntervalSec: 0, lastHeartbeat: '', healthScore: 0, subsystems: [], alerts: [] },
    alerts: [], topology: { layers: [], slots: [] }, evolution: [],
  },
}));

const freshResult = (overrides: Partial<GovernancePanoramaResult> = {}): GovernancePanoramaResult => ({
  data: {
    ...FALLBACK_PANORAMA_DATA,
    generated_at: '2026-10-07T00:00:00.000Z',
    gates: [{ id: 'A1', title: 'A1', name: 'A1', verdict: 'PASS', detail: 'verified', live: true }],
    guardian: {
      ...FALLBACK_PANORAMA_DATA.guardian,
      interval_seconds: 74,
      pulseIntervalSec: 74,
      status: 'active',
    },
  },
  isFallback: false,
  sourceState: 'LIVE',
  sourceObservedAt: '2026-10-07T00:00:00.000Z',
  sourceAgeMs: 0,
  sourceFailure: null,
  partialFacets: [],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
  ...overrides,
});

describe('useLiveTelemetry BFF compatibility projection', () => {
  beforeEach(() => vi.mocked(useGovernancePanorama).mockReturnValue(freshResult()));

  it('projects verified BFF gate and guardian fields while withholding absent runtime fields', () => {
    const { result } = renderHook(() => useLiveTelemetry());

    expect(result.current.snapshotState).toBe('LIVE');
    expect(result.current.connected).toBe(true);
    expect(result.current.gates).toHaveLength(1);
    expect(result.current.guardianCadence).toBe(74);
    expect(result.current.vramUsage).toBe('UNKNOWN');
    expect(result.current.lastPulse).toBeNull();
    expect(result.current.betStats).toEqual({ total: 0, done: 0, blocked: 0, candidate: 0 });
    expect(result.current.sourcesState).toEqual({ 'cockpit-bff': 'LIVE' });
  });

  it('withholds only partial facets without downgrading independently verified BFF fields', () => {
    vi.mocked(useGovernancePanorama).mockReturnValue(freshResult({
      sourceState: 'PARTIAL',
      partialFacets: ['gates'],
    }));

    const { result } = renderHook(() => useLiveTelemetry());

    expect(result.current.snapshotState).toBe('PARTIAL');
    expect(result.current.gates).toEqual([]);
    expect(result.current.guardianCadence).toBe(74);
    expect(result.current.connected).toBe(true);
  });

  it('uses UNKNOWN for an unavailable BFF projection and clears all projected facets', () => {
    vi.mocked(useGovernancePanorama).mockReturnValue(freshResult({
      isFallback: true,
      sourceState: 'UNKNOWN',
      sourceObservedAt: null,
      sourceAgeMs: null,
      sourceFailure: 'upstream_timeout',
      partialFacets: [],
    }));

    const { result } = renderHook(() => useLiveTelemetry());

    expect(result.current.snapshotState).toBe('UNKNOWN');
    expect(result.current.connected).toBe(false);
    expect(result.current.gates).toEqual([]);
    expect(result.current.guardianCadence).toBe(0);
    expect(result.current.snapshotFailure).toBe('upstream_timeout');
  });
});
