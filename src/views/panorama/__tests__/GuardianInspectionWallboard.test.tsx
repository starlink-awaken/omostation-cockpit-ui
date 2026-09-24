import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GuardianInspectionWallboard } from '../GuardianInspectionWallboard';
import * as hooks from '../../../api/hooks/useGovernancePanorama';
import { ToastProvider } from '../../../components/common/Toast';
import type { GuardianPulse } from '../../../api/types/panorama';

const mockGuardian: GuardianPulse = {
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
      severity: 'WARN',
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
      refetch: mockRefetch,
    });

    renderWithToast(<GuardianInspectionWallboard />);

    expect(screen.getByText('74s 哨兵常态守护与健康大屏')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-gate_guardian')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-ledger_auditor')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-bcos_engine')).toBeInTheDocument();
    expect(screen.getByTestId('subsystem-card-network_mesh')).toBeInTheDocument();
  });

  it('switches tabs and displays active alerts', () => {
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockGuardian,
      isLoading: false,
      isFallback: false,
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
      refetch: mockRefetch,
    });

    renderWithToast(<GuardianInspectionWallboard />);

    const refreshButton = screen.getByRole('button', { name: /触发全量巡检/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
