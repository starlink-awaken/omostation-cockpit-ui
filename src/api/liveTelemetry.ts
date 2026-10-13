/**
 * Compatibility view over the Cockpit governance-panorama query.
 *
 * This module deliberately does not contact Zhixing from the browser. The
 * Cockpit BFF owns the upstream boundary and React Query owns the shared
 * browser cache, so shell telemetry and Panorama render the same observation.
 */

import { useMemo } from 'react';
import {
  useGovernancePanorama,
  type DisplayGateItem,
  type GovernancePanoramaSourceState,
} from './hooks/useGovernancePanorama';

export interface TelemetryPulseLoop {
  loop: string;
  status: string;
  adherence?: string;
  compliance?: string;
  rules?: string;
  mode?: string;
}

export interface TelemetryPulse {
  type: string;
  cycle: number;
  timestamp: string;
  sentinel: string;
  status: string;
  circuit_pulses: TelemetryPulseLoop[];
}

export type GateReport = DisplayGateItem;
export type TelemetrySnapshotState = GovernancePanoramaSourceState;

export interface LiveTelemetryState {
  /** BFF projection state, never an SSE connection state. */
  snapshotState: TelemetrySnapshotState;
  snapshotFailure: string | null;
  snapshotObservedAt: string | null;
  snapshotAgeMs: number | null;
  /** The Cockpit BFF returned a non-UNKNOWN projection. */
  connected: boolean;
  /** Runtime-only fields are UNKNOWN until the BFF contract explicitly adds them. */
  vramUsage: string;
  guardianCadence: number;
  activeLoopsCount: number;
  lastGenerationId: string | null;
  lastPulse: TelemetryPulse | null;
  gates: GateReport[];
  sourcesState: Record<string, string>;
  betStats: {
    total: number;
    done: number;
    blocked: number;
    candidate: number;
  };
  isLoading: boolean;
  error: string | null;
}

const EMPTY_BET_STATS = {
  total: 0,
  done: 0,
  blocked: 0,
  candidate: 0,
};

function canUseFacet(state: TelemetrySnapshotState, partialFacets: string[], facet: string): boolean {
  return state !== 'UNKNOWN' && !partialFacets.includes(facet);
}

/**
 * Legacy shell consumers still use this name. Its values are projected only
 * from useGovernancePanorama(), sharing the exact same BFF cache as Panorama.
 */
export function useLiveTelemetry(): LiveTelemetryState {
  const panorama = useGovernancePanorama();

  return useMemo(() => {
    const snapshotState: TelemetrySnapshotState = panorama.isFallback ? 'UNKNOWN' : panorama.sourceState;
    const gatesVerified = canUseFacet(snapshotState, panorama.partialFacets, 'gates');
    const guardianVerified = canUseFacet(snapshotState, panorama.partialFacets, 'guardian');
    const guardianCadence = guardianVerified && panorama.data.guardian.interval_seconds > 0
      ? panorama.data.guardian.interval_seconds
      : 0;

    return {
      snapshotState,
      snapshotFailure: panorama.sourceFailure,
      snapshotObservedAt: panorama.sourceObservedAt,
      snapshotAgeMs: panorama.sourceAgeMs,
      connected: snapshotState !== 'UNKNOWN',
      vramUsage: 'UNKNOWN',
      guardianCadence,
      activeLoopsCount: 0,
      lastGenerationId: null,
      lastPulse: null,
      gates: gatesVerified ? panorama.data.gates : [],
      sourcesState: { 'cockpit-bff': snapshotState },
      betStats: EMPTY_BET_STATS,
      isLoading: panorama.isLoading,
      error: panorama.sourceFailure,
    };
  }, [panorama]);
}
