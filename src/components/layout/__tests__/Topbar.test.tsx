import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Topbar } from '../Topbar';
import type { LiveTelemetryState } from '../../../api/liveTelemetry';

vi.mock('../../common/UserMenu', () => ({ default: () => <div data-testid="user-menu" /> }));
vi.mock('../../common/TelemetryPopover', () => ({ default: () => null }));

function telemetry(overrides: Partial<LiveTelemetryState> = {}): LiveTelemetryState {
  return {
    snapshotState: 'LIVE',
    snapshotFailure: null,
    snapshotObservedAt: new Date().toISOString(),
    snapshotAgeMs: 0,
    connected: true,
    vramUsage: '43.2GB / 152GB',
    guardianCadence: 74,
    activeLoopsCount: 4,
    lastGenerationId: 'generation-1',
    lastPulse: null,
    gates: [{ id: 'A1', title: 'A1', verdict: 'PASS', detail: 'verified', live: true }],
    sourcesState: {},
    betStats: { total: 1, done: 1, blocked: 0, candidate: 0 },
    isLoading: false,
    error: null,
    ...overrides,
  };
}

function renderTopbar(state: LiveTelemetryState) {
  render(
    <Topbar
      searchQuery=""
      onSearchChange={vi.fn()}
      onOpenCommandPalette={vi.fn()}
      onOpenQuickActions={vi.fn()}
      telemetry={state}
      onNavigateToPanorama={vi.fn()}
    />,
  );
}

describe('Topbar telemetry badge', () => {
  it('shows current snapshot counts through the Cockpit BFF', () => {
    renderTopbar(telemetry());

    expect(screen.getByText('COCKPIT BFF READY · SNAPSHOT LIVE')).toBeInTheDocument();
    expect(screen.getByText('门禁 1/1')).toBeInTheDocument();
    expect(screen.getByText('台账 1/1')).toBeInTheDocument();
  });

  it.each(['STALE', 'UNKNOWN'] as const)('does not present %s snapshot counts as current', (snapshotState) => {
    renderTopbar(telemetry({ snapshotState }));

    expect(screen.getByText(`COCKPIT BFF READY · SNAPSHOT ${snapshotState}`)).toBeInTheDocument();
    expect(screen.getByText('门禁 UNKNOWN')).toBeInTheDocument();
    expect(screen.getByText('台账 UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByText('门禁 1/1')).not.toBeInTheDocument();
    expect(screen.queryByText('台账 1/1')).not.toBeInTheDocument();
  });

  it('shows BFF CONNECTING while the shared Panorama query is loading', () => {
    renderTopbar(telemetry({
      isLoading: true,
      connected: false,
      snapshotState: 'UNKNOWN',
    }));

    expect(screen.getByText('COCKPIT BFF CONNECTING · SNAPSHOT UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByText(/BFF UNAVAILABLE/)).not.toBeInTheDocument();
  });
});
