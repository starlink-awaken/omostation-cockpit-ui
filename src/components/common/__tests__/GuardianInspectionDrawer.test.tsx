import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GuardianInspectionDrawer } from '../GuardianInspectionDrawer';
import { useGovernancePanorama, type GovernancePanoramaResult } from '../../../api/hooks/useGovernancePanorama';
import { FALLBACK_PANORAMA_DATA } from '../../../api/hooks/useGovernancePanorama';

vi.mock('../../../api/hooks/useGovernancePanorama', () => ({
  useGovernancePanorama: vi.fn(),
  FALLBACK_PANORAMA_DATA: {
    generated_at: '', mode: 'UNAVAILABLE', posture: { health_score: 0, compliance_rate: 0, active_agents_count: 0 },
    gates: [], guardian: { interval_seconds: 0, status: 'offline', last_heartbeat: '', healthy_count: 0, warning_count: 0, danger_count: 0, pulseIntervalSec: 0, lastHeartbeat: '', healthScore: 0, subsystems: [], alerts: [] },
    alerts: [], topology: { layers: [], slots: [] }, evolution: [],
  },
}));

const mockClose = vi.fn();
const mockNavigate = vi.fn();

function panoramaResult(overrides: Partial<GovernancePanoramaResult> = {}): GovernancePanoramaResult {
  return {
    data: {
      ...FALLBACK_PANORAMA_DATA,
      generated_at: '2026-10-07T00:00:00.000Z',
      gates: [{ id: 'A1', title: 'Workflow 与 Git 执行完整性', name: 'Workflow 与 Git 执行完整性', verdict: 'PASS', detail: '隔离工作树完整', live: true }],
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
    refetch: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('GuardianInspectionDrawer BFF projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult());
  });

  it('renders nothing when closed', () => {
    const { container } = render(<GuardianInspectionDrawer isOpen={false} onClose={mockClose} onNavigate={mockNavigate} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders only BFF-projected gate and guardian fields when LIVE', () => {
    render(<GuardianInspectionDrawer isOpen onClose={mockClose} onNavigate={mockNavigate} />);

    expect(screen.getByText('Cockpit 治理巡检视窗')).toBeInTheDocument();
    expect(screen.getByText('BFF LIVE')).toBeInTheDocument();
    expect(screen.getByText('BFF LIVE')).toHaveClass('bg-emerald-500/10');
    expect(screen.getByText('1 / 1 PASS')).toBeInTheDocument();
    expect(screen.getByText('74s')).toBeInTheDocument();
    expect(screen.getByText('Workflow 与 Git 执行完整性')).toBeInTheDocument();
    expect(screen.getByText('BFF 当前契约未提供回路脉冲；状态为 UNKNOWN。')).toBeInTheDocument();
    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
  });

  it.each(['PARTIAL', 'UNKNOWN'] as const)('withholds unverified gates and guardian fields for %s', (sourceState) => {
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      isFallback: sourceState === 'UNKNOWN',
      sourceState,
      partialFacets: sourceState === 'PARTIAL' ? ['gates', 'guardian'] : [],
    }));

    render(<GuardianInspectionDrawer isOpen onClose={mockClose} onNavigate={mockNavigate} />);

    expect(screen.getByText(`BFF ${sourceState}`)).toBeInTheDocument();
    expect(screen.getByText(`BFF ${sourceState}`)).toHaveClass(
      sourceState === 'PARTIAL' ? 'bg-amber-500/10' : 'bg-slate-700/50',
    );
    expect(screen.getByText('门禁字段未获当前验证，状态为 UNKNOWN。')).toBeInTheDocument();
    expect(screen.queryByText('1 / 1 PASS')).not.toBeInTheDocument();
    expect(screen.queryByText('74s')).not.toBeInTheDocument();
  });

  it('does not present stale BFF gates as current PASS counts', () => {
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({ sourceState: 'STALE' }));

    render(<GuardianInspectionDrawer isOpen onClose={mockClose} onNavigate={mockNavigate} />);

    expect(screen.getByText('BFF STALE')).toBeInTheDocument();
    expect(screen.getByText('BFF STALE')).toHaveClass('bg-amber-500/10');
    expect(screen.getByText('Workflow 与 Git 执行完整性')).toBeInTheDocument();
    expect(screen.queryByText('1 / 1 PASS')).not.toBeInTheDocument();
  });

  it('renders stale historical gate verdicts with distinct accurate badge classes', () => {
    const data = panoramaResult().data;
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({
      sourceState: 'STALE',
      data: {
        ...data,
        gates: [
          { id: 'A1', title: 'A1', name: 'A1', verdict: 'FAIL', detail: 'failed', live: false },
          { id: 'A2', title: 'A2', name: 'A2', verdict: 'WARN', detail: 'warned', live: false },
          { id: 'A3', title: 'A3', name: 'A3', verdict: 'UNKNOWN', detail: 'unknown', live: false },
          { id: 'A4', title: 'A4', name: 'A4', verdict: 'PASS', detail: 'passed', live: false },
        ],
      },
    }));

    render(<GuardianInspectionDrawer isOpen onClose={mockClose} onNavigate={mockNavigate} />);

    expect(screen.getByTestId('gate-A1-badge')).toHaveClass('bg-rose-500/10');
    expect(screen.getByTestId('gate-A2-badge')).toHaveClass('bg-amber-500/10');
    expect(screen.getByTestId('gate-A3-badge')).toHaveClass('bg-slate-700/50');
    expect(screen.getByTestId('gate-A4-badge')).toHaveClass('bg-emerald-500/10');
    expect(screen.getByText('BFF STALE')).toBeInTheDocument();
    expect(screen.queryByText('4 / 4 PASS')).not.toBeInTheDocument();
  });

  it('expands BFF gate details and asks the BFF cache to refetch', () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useGovernancePanorama).mockReturnValue(panoramaResult({ refetch }));
    render(<GuardianInspectionDrawer isOpen onClose={mockClose} onNavigate={mockNavigate} />);

    fireEvent.click(screen.getByText('Workflow 与 Git 执行完整性'));
    expect(screen.getByText(/隔离工作树完整/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('触发即时复核'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the close control and Escape', () => {
    render(<GuardianInspectionDrawer isOpen onClose={mockClose} onNavigate={mockNavigate} />);
    fireEvent.click(screen.getByLabelText('关闭抽屉'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});
