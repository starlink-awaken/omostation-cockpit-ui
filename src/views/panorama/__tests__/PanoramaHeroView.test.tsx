import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import PanoramaHeroView from '../PanoramaHeroView';
import { useGovernancePanorama, type GovernancePanoramaResult } from '../../../api/hooks/useGovernancePanorama';
import { FALLBACK_PANORAMA_DATA } from '../../../api/hooks/useGovernancePanorama';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../api/hooks/useGovernancePanorama', () => ({
  useGovernancePanorama: vi.fn(),
  FALLBACK_PANORAMA_DATA: {
    generated_at: '', mode: 'UNAVAILABLE', posture: { health_score: 0, compliance_rate: 0, active_agents_count: 0 },
    gates: [], guardian: { interval_seconds: 0, status: 'offline', last_heartbeat: '', healthy_count: 0, warning_count: 0, danger_count: 0, pulseIntervalSec: 0, lastHeartbeat: '', healthScore: 0, subsystems: [], alerts: [] },
    alerts: [], topology: { layers: [], slots: [] }, evolution: [],
  },
}));

vi.mock('../../../api/hooks/swarm', () => ({
  useApprovalQueue: () => ({ data: { queue: [] } }),
}));

vi.mock('../InPlaceDecisionDrawer', () => ({ default: () => null }));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function panoramaResult(overrides: Partial<GovernancePanoramaResult> = {}): GovernancePanoramaResult {
  return {
    data: {
      ...FALLBACK_PANORAMA_DATA,
      generated_at: '2026-10-07T00:00:00.000Z',
      gates: [
        { id: 'A1', title: 'Workflow 与 Git 执行完整性', name: 'Workflow 与 Git 执行完整性', verdict: 'PASS', detail: 'verified', live: true },
      ],
      guardian: { ...FALLBACK_PANORAMA_DATA.guardian, interval_seconds: 74, pulseIntervalSec: 74, status: 'active' },
    },
    isLoading: false,
    isError: false,
    isFallback: false,
    sourceState: 'LIVE',
    sourceObservedAt: '2026-10-07T00:00:00.000Z',
    sourceAgeMs: 0,
    sourceFailure: null,
    partialFacets: [],
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('PanoramaHeroView unified BFF contract', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult());
  });

  it('renders the BFF observation and does not create a browser-side runtime telemetry claim', () => {
    renderWithClient(<PanoramaHeroView />);

    expect(screen.getByText('Cockpit BFF LIVE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /门禁 A1:/ })).toBeInTheDocument();
    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
    expect(screen.queryByText(/43191 SSE/)).not.toBeInTheDocument();
    expect(screen.queryByText(/已完成 \(100%\)/)).not.toBeInTheDocument();
  });

  it('shows source-backed evolution and workspace enumeration details', () => {
    const observedAt = new Date().toISOString();
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      data: {
        ...panoramaResult().data,
        facet_observations: {
          evolution: {
            state: 'LIVE', observation_status: 'OBSERVED', observed_at: observedAt,
            last_attempt_at: observedAt, last_success_at: observedAt, error_class: null,
            duration_ms: 10, overrun: false, source_digest: 'b'.repeat(64),
            value: { total: 2, proposal_paths: ['a.yaml', 'b.yaml'], recent_proposals: ['a', 'b'] },
            source_generation_id: null, source_revision_id: null,
            provenance: { kind: 'direct-read', source_ref: 'collect_evolution', collector_sha256: 'a'.repeat(64) },
          },
          workspace: {
            state: 'LIVE', observation_status: 'OBSERVED', observed_at: observedAt,
            last_attempt_at: observedAt, last_success_at: observedAt, error_class: null,
            duration_ms: 12, overrun: false, source_digest: 'c'.repeat(64),
            value: { total_worktrees: 1, worktrees: [{ path: '/tmp/worktree' }], total_lock_files: 3, lock_files: ['a', 'b', 'c'] },
            source_generation_id: null, source_revision_id: null,
            provenance: { kind: 'direct-read', source_ref: 'collect_workspace_hygiene', collector_sha256: 'a'.repeat(64) },
          },
        },
      },
    }));

    renderWithClient(<PanoramaHeroView />);

    expect(screen.getByText('2 个提案路径')).toBeInTheDocument();
    expect(screen.getByText('1 个 worktree · 3 个 lock 文件')).toBeInTheDocument();
    expect(screen.getByText(/collect_workspace_hygiene · c{12}/)).toBeInTheDocument();
  });

  it('does not expose gate success when the BFF marks gates as partial', () => {
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      sourceState: 'PARTIAL',
      partialFacets: ['gates'],
    }));

    renderWithClient(<PanoramaHeroView />);

    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
    expect(screen.getByText(/所有门禁状态均为 UNKNOWN/)).toBeInTheDocument();
    expect(screen.queryByText('1/1 PASS')).not.toBeInTheDocument();
  });

  it('labels stale BFF data as historical rather than current telemetry', () => {
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      sourceState: 'STALE',
      sourceObservedAt: '2026-10-06T18:13:06.584501Z',
      sourceAgeMs: 7 * 60_000,
      sourceFailure: 'projection_stale',
      partialFacets: ['gates', 'guardian'],
    }));

    renderWithClient(<PanoramaHeroView />);

    expect(screen.getByText('Cockpit 治理投影 STALE')).toBeInTheDocument();
    expect(screen.getByText(/来源年龄 7 分钟/)).toBeInTheDocument();
    expect(screen.queryByText('1/1 PASS')).not.toBeInTheDocument();
  });

  it('shows independently fresh facets while keeping the overall projection stale', () => {
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      data: {
        ...panoramaResult().data,
        facet_observations: {
          knowledge_health: {
            state: 'LIVE',
            observed_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            error_class: null,
            duration_ms: 1200,
            overrun: false,
            provenance: { kind: 'direct-read', source_ref: 'collector', collector_sha256: 'a'.repeat(64) },
          },
        },
      },
      sourceState: 'STALE',
      sourceFailure: 'projection_stale',
    }));

    renderWithClient(<PanoramaHeroView />);

    expect(screen.getByText('Cockpit 治理投影 STALE')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '直接观测分面状态' })).toBeInTheDocument();
    expect(screen.getByText('知识健康')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('uses verdict-specific dots for stale historical gates instead of green defaults', () => {
    const data = panoramaResult().data;
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      data: {
        ...data,
        gates: [
          { id: 'A1', title: 'A1', name: 'A1', verdict: 'FAIL', detail: 'failed', live: false },
          { id: 'A2', title: 'A2', name: 'A2', verdict: 'WARN', detail: 'warned', live: false },
          { id: 'A3', title: 'A3', name: 'A3', verdict: 'UNKNOWN', detail: 'unknown', live: false },
        ],
      },
      sourceState: 'STALE',
      sourceAgeMs: 7 * 60_000,
      sourceObservedAt: '2026-10-06T18:13:06.584501Z',
      sourceFailure: 'projection_stale',
    }));

    renderWithClient(<PanoramaHeroView />);

    expect(screen.getByText('历史快照 · 7 分钟')).toBeInTheDocument();
    expect(screen.getByTestId('gate-A1-verdict')).toHaveClass('bg-rose-400');
    expect(screen.getByTestId('gate-A2-verdict')).toHaveClass('bg-amber-400');
    expect(screen.getByTestId('gate-A3-verdict')).toHaveClass('bg-slate-500');
  });

  it('keeps BFF-projected gates drillable', () => {
    renderWithClient(<PanoramaHeroView />);

    fireEvent.click(screen.getByRole('button', { name: /门禁 A1:/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/workflows');
  });
});
