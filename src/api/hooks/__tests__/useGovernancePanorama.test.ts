import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useGovernancePanorama,
  useGatesMatrix,
  useGuardianStatus,
  useSystemTopology,
  useBcosEvolution,
  FALLBACK_PANORAMA_DATA,
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

const mockLiveData: PanoramaOverviewPayload = {
  timestamp: '2026-09-24T20:00:00.000Z',
  version: '2.5.0-live',
  gates: [
    {
      id: 'A1',
      name: '架构契约检查 (Architecture Contracts)',
      verdict: 'PASS',
      exitCode: 0,
      timestamp: '2026-09-24T20:00:00.000Z',
      details: 'All verified.',
    },
  ],
  guardian: {
    pulseIntervalSec: 74,
    lastHeartbeat: '2026-09-24T20:00:00.000Z',
    healthScore: 100,
    subsystems: [],
    alerts: [],
  },
  topology: {
    layers: [],
    slots: [],
  },
  bcos: {
    epoch: 25,
    selfDistillationCount: 150,
    learningRate: 0.001,
    healthScore: 99.9,
    lastEvolutionTime: '2026-09-24T20:00:00.000Z',
    recentRecords: [],
  },
};

describe('useGovernancePanorama Dual-Mode Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns live data when API endpoint is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 0,
          data: mockLiveData,
        }),
      })
    );

    const { result } = renderHook(() => useGovernancePanorama(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFallback).toBe(false);
    expect(result.current.data.version).toBe('2.5.0-live');
    expect(result.current.data.gates[0].id).toBe('A1');
  });

  it('gracefully degrades to static fallback data when API fails or throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection refused / 503 service unavailable'))
    );

    const { result } = renderHook(() => useGovernancePanorama(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFallback).toBe(true);
    expect(result.current.data.version).toBe('2.0.0-dual-core');
    expect(result.current.data.gates.length).toBeGreaterThanOrEqual(10);
    expect(result.current.data.guardian.pulseIntervalSec).toBe(74);
  });

  it('sub-hooks correctly select granular slices of governance state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Fallback expected'))
    );

    const wrapper = createWrapper();

    const { result: gatesResult } = renderHook(() => useGatesMatrix(), { wrapper });
    const { result: guardianResult } = renderHook(() => useGuardianStatus(), { wrapper });
    const { result: topologyResult } = renderHook(() => useSystemTopology(), { wrapper });
    const { result: bcosResult } = renderHook(() => useBcosEvolution(), { wrapper });

    await waitFor(() => {
      expect(gatesResult.current.isLoading).toBe(false);
    });

    expect(gatesResult.current.gates.some((g) => g.id === 'A1')).toBe(true);
    expect(gatesResult.current.isFallback).toBe(true);

    expect(guardianResult.current.guardian.healthScore).toBeGreaterThanOrEqual(90);
    expect(topologyResult.current.topology.slots.length).toBeGreaterThan(0);
    expect(bcosResult.current.bcos.epoch).toBeGreaterThanOrEqual(24);
  });
});
