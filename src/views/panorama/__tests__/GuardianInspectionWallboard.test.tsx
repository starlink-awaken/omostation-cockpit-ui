import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GuardianInspectionWallboard } from '../GuardianInspectionWallboard';
import * as hooks from '../../../api/hooks/useGovernancePanorama';
import { ToastProvider } from '../../../components/common/Toast';
import type { DisplayGuardian } from '../../../api/hooks/useGovernancePanorama';

const mockGuardian: DisplayGuardian = {
  interval_seconds: 74,
  status: 'active',
  last_heartbeat: '2026-09-24T20:00:00Z',
  healthy_count: 4,
  warning_count: 0,
  danger_count: 0,
  pulseIntervalSec: 74,
  lastHeartbeat: '2026-09-24T20:00:00Z',
  healthScore: 99.4,
  subsystems: [
    { id: 'gate_guardian', name: '门禁巡航守卫', status: 'HEALTHY', latencyMs: 12 },
    { id: 'ledger_auditor', name: '台账原子审计器', status: 'HEALTHY', latencyMs: 25 },
    { id: 'bcos_engine', name: 'BCOS 自蒸馏引擎', status: 'HEALTHY', latencyMs: 40 },
    { id: 'network_mesh', name: 'TinyBOS 局域网算力网格', status: 'HEALTHY', latencyMs: 8 },
  ],
  alerts: [
    {
      id: 'alt-1',
      title: '网络抖动',
      severity: 'warning',
      category: 'network',
      message: '检测到短暂网络抖动，已自动应用内存快照',
      source: 'network_mesh',
      timestamp: '2026-09-24T19:50:00Z',
    },
  ],
};

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('GuardianInspectionWallboard Component', () => {
  const mockRefetch = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skeleton cards when loading', () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockGuardian,
      isLoading: true,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GuardianInspectionWallboard />);
    expect(screen.getByRole('status', { name: /loading guardian stats/i })).toBeInTheDocument();
  });

  it('renders guardian stats and 4 subsystem cards', () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockGuardian,
      isLoading: false,
      isFallback: false,
      sourceState: 'LIVE',
      sourceFailure: null,
      sourceObservedAt: '2026-09-24T20:00:00Z',
      sourceAgeMs: 0,
      partialFacets: [],
      refetch: mockRefetch,
    });

    renderWithToast(<GuardianInspectionWallboard />);

    expect(screen.getByText('哨兵守护与健康大屏')).toBeInTheDocument();
    expect(screen.getByText('已报告巡检周期:')).toBeInTheDocument();
    expect(screen.getAllByText('74s').length).toBeGreaterThan(0);
    expect(screen.getByText('观测于 2026-09-24T20:00:00Z · 不足 1 分钟前')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-gate_guardian')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-ledger_auditor')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-bcos_engine')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-network_mesh')).toBeInTheDocument();
  });

  it('marks stale guardian data UNKNOWN instead of healthy', () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({ guardian: mockGuardian, isLoading: false, isFallback: false, sourceState: 'STALE', sourceFailure: 'age exceeded', sourceObservedAt: '2026-09-24T20:00:00Z', sourceAgeMs: 360001, refetch: vi.fn().mockResolvedValue({ sourceState: 'STALE', sourceFailure: 'age exceeded' }) });
    renderWithToast(<GuardianInspectionWallboard />);
    expect(screen.getByText(/来源 STALE/)).toBeInTheDocument();
    expect(screen.getByText('观测于 2026-09-24T20:00:00Z · 6 分钟前')).toBeInTheDocument();
    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
    expect(screen.queryByText('99.4%')).not.toBeInTheDocument();
  });

  it('withholds current alert totals but preserves known observations for PARTIAL data', () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockGuardian,
      isLoading: false,
      isFallback: false,
      sourceState: 'PARTIAL',
      sourceFailure: 'field_provenance_missing',
      sourceObservedAt: '2026-10-07T00:00:00Z',
      sourceAgeMs: 12_000,
      partialFacets: ['gates', 'alerts', 'posture', 'guardian', 'topology'],
      refetch: vi.fn().mockResolvedValue({ sourceState: 'PARTIAL', sourceFailure: 'field_provenance_missing' }),
    });

    renderWithToast(<GuardianInspectionWallboard />);

    expect(screen.getByText(/来源 PARTIAL/)).toBeInTheDocument();
    expect(screen.getByText('哨兵状态 UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByText('99.4%')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /实时告警与自愈流/i }));
    expect(screen.getByText('完整告警状态 UNKNOWN')).toBeInTheDocument();
    expect(screen.getByText(/以下为来源中已观察到的记录/)).toBeInTheDocument();
    expect(screen.getByText('检测到短暂网络抖动，已自动应用内存快照')).toBeInTheDocument();
  });

  it('switches tabs and displays active alerts', () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockGuardian,
      isLoading: false,
      isFallback: false,
      sourceState: 'LIVE',
      sourceFailure: null,
      sourceObservedAt: '2026-09-24T20:00:00Z',
      sourceAgeMs: 0,
      partialFacets: [],
      refetch: mockRefetch,
    });

    renderWithToast(<GuardianInspectionWallboard />);

    const logsTab = screen.getByRole('button', { name: /实时告警与自愈流/i });
    fireEvent.click(logsTab);

    expect(screen.getByText('检测到短暂网络抖动，已自动应用内存快照')).toBeInTheDocument();
  });

  it('triggers inspection and calls refetch', async () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockGuardian,
      isLoading: false,
      isFallback: false,
      sourceState: 'LIVE',
      sourceFailure: null,
      sourceObservedAt: '2026-09-24T20:00:00Z',
      sourceAgeMs: 0,
      partialFacets: [],
      refetch: mockRefetch,
    });

    renderWithToast(<GuardianInspectionWallboard />);

    const refreshButton = screen.getByRole('button', { name: /触发全量巡检/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it.each(['STALE', 'UNKNOWN'] as const)('does not turn an empty %s alert list into a green no-alert claim', (sourceState) => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: { ...mockGuardian, alerts: [] },
      isLoading: false,
      isFallback: sourceState === 'UNKNOWN',
      sourceState,
      sourceFailure: 'source_not_current',
      sourceObservedAt: sourceState === 'STALE' ? '2026-10-06T18:13:06.584501Z' : null,
      sourceAgeMs: sourceState === 'STALE' ? 7 * 60_000 : null,
      partialFacets: [],
      refetch: vi.fn().mockResolvedValue({ sourceState, sourceFailure: 'source_not_current' }),
    });

    renderWithToast(<GuardianInspectionWallboard />);
    fireEvent.click(screen.getByRole('button', { name: /实时告警与自愈流/i }));

    expect(screen.getByText('完整告警状态 UNKNOWN')).toBeInTheDocument();
    expect(screen.getByText('不能以空列表推断“没有活动告警”。')).toBeInTheDocument();
    if (sourceState === 'UNKNOWN') expect(screen.getByText('观测时间 UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByText('当前没有处于活动状态的告警')).not.toBeInTheDocument();
    expect(screen.queryByText('当前 BFF 已验证告警集合为空。')).not.toBeInTheDocument();
  });
});
