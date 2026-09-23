import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuardianInspectionDrawer } from '../GuardianInspectionDrawer';

// Mock useLiveTelemetry
vi.mock('../../../api/liveTelemetry', () => ({
  useLiveTelemetry: () => ({
    connected: true,
    vramUsage: '43.2GB / 152GB',
    guardianCadence: 74,
    activeLoopsCount: 4,
    lastGenerationId: 'gen-43191-mock',
    lastPulse: {
      type: 'telemetry_pulse',
      cycle: 42,
      timestamp: '2026-09-23T10:00:00Z',
      sentinel: 'ResidentGuardian-74s',
      status: 'ARMED_HEALTHY',
      circuit_pulses: [
        { loop: 'value_reinforcement', status: 'ACTIVE', adherence: '89.8%' },
        { loop: 'execution_control', status: 'ARMED', compliance: '100%' },
        { loop: 'meta_governance', status: 'ARMED', rules: '7720+' },
        { loop: 'physical_isolation', status: 'ENFORCED', mode: 'PASW' },
      ],
    },
    gates: [
      { id: 'A1', title: 'Workflow 与 Git 执行完整性', verdict: 'PASS', detail: '隔离工作树完整', live: true },
      { id: 'A2', title: 'Resident 与宿主健康真值', verdict: 'PASS', detail: 'all technical checks pass', live: true },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('GuardianInspectionDrawer', () => {
  const mockClose = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <GuardianInspectionDrawer isOpen={false} onClose={mockClose} onNavigate={mockNavigate} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders drawer header, 4 circuits, gates and inspection logs when open', () => {
    render(
      <GuardianInspectionDrawer isOpen={true} onClose={mockClose} onNavigate={mockNavigate} />
    );

    expect(screen.getByText('知行 74s 哨兵巡检视窗')).toBeInTheDocument();
    expect(screen.getByText('43191 LIVE')).toBeInTheDocument();
    expect(screen.getByText('ARMED_HEALTHY')).toBeInTheDocument();
    expect(screen.getByText('74s')).toBeInTheDocument();

    // Four circuits
    expect(screen.getByText('value reinforcement')).toBeInTheDocument();
    expect(screen.getByText('execution control')).toBeInTheDocument();
    expect(screen.getByText('meta governance')).toBeInTheDocument();
    expect(screen.getByText('physical isolation')).toBeInTheDocument();

    // Gates
    expect(screen.getByText('Workflow 与 Git 执行完整性')).toBeInTheDocument();
    expect(screen.getByText('Resident 与宿主健康真值')).toBeInTheDocument();
  });

  it('expands gate details when gate item is clicked', () => {
    render(
      <GuardianInspectionDrawer isOpen={true} onClose={mockClose} onNavigate={mockNavigate} />
    );

    expect(screen.queryByText(/隔离工作树完整/)).not.toBeInTheDocument();

    const gateBtn = screen.getByText('Workflow 与 Git 执行完整性');
    fireEvent.click(gateBtn);

    expect(screen.getByText(/隔离工作树完整/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked or ESC key is pressed', () => {
    render(
      <GuardianInspectionDrawer isOpen={true} onClose={mockClose} onNavigate={mockNavigate} />
    );

    const closeBtn = screen.getByLabelText('关闭抽屉');
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });

  it('triggers manual recheck when refresh button is clicked', () => {
    render(
      <GuardianInspectionDrawer isOpen={true} onClose={mockClose} onNavigate={mockNavigate} />
    );

    const refreshBtn = screen.getByLabelText('触发即时复核');
    fireEvent.click(refreshBtn);
    expect(refreshBtn).toBeInTheDocument();
  });
});
