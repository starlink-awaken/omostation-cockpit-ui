import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TelemetryPopover from '../TelemetryPopover';
import type { LiveTelemetryState } from '../../../api/liveTelemetry';

const mockTelemetry: LiveTelemetryState = {
  snapshotState: 'LIVE',
  connected: true,
  vramUsage: '43.2GB / 152GB',
  guardianCadence: 74,
  activeLoopsCount: 4,
  lastGenerationId: 'gen-01',
  lastPulse: null,
  gates: [
    { id: 'A1', title: 'Workflow 与 Git 执行完整性', verdict: 'PASS', detail: '隔离工作树完整', live: true },
    { id: 'A2', title: 'Resident 与宿主健康真值', verdict: 'PASS', detail: 'all technical checks pass', live: true },
  ],
  sourcesState: {},
  betStats: { total: 443, done: 443, blocked: 0, candidate: 0 },
  isLoading: false,
  error: null,
};

describe('TelemetryPopover component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TelemetryPopover
        isOpen={false}
        onClose={vi.fn()}
        telemetry={mockTelemetry}
        onNavigate={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders status, metrics, gates, and navigation actions when isOpen is true', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(
      <TelemetryPopover
        isOpen={true}
        onClose={onClose}
        telemetry={mockTelemetry}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText('Cockpit 治理全景')).toBeInTheDocument();
    expect(screen.getByText('BFF READY')).toBeInTheDocument();
    expect(screen.getByText('SNAPSHOT LIVE')).toBeInTheDocument();
    expect(screen.getByText('43.2GB / 152GB')).toBeInTheDocument();
    expect(screen.getByText('Guardian: 74s')).toBeInTheDocument();
    expect(screen.getByText('2/2 PASS')).toBeInTheDocument();
    expect(screen.getByText('443 / 443 (100%)')).toBeInTheDocument();

    // Click "进入全景座舱"
    const panoBtn = screen.getByRole('button', { name: /进入全景座舱/ });
    fireEvent.click(panoBtn);
    expect(onNavigate).toHaveBeenCalledWith('/panorama');
    expect(onClose).toHaveBeenCalled();

    // Click "决策箱"
    const inboxBtn = screen.getByRole('button', { name: /决策箱/ });
    fireEvent.click(inboxBtn);
    expect(onNavigate).toHaveBeenCalledWith('/decision-inbox');
  });

  it.each(['UNKNOWN', 'STALE'] as const)('withholds success counts and progress for a %s snapshot', (snapshotState) => {
    render(
      <TelemetryPopover
        isOpen
        onClose={vi.fn()}
        telemetry={{ ...mockTelemetry, snapshotState, connected: true }}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText(`SNAPSHOT ${snapshotState}`)).toBeInTheDocument();
    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
    expect(screen.getByText('门禁快照不可用，当前状态未知')).toBeInTheDocument();
    expect(screen.getByText('快照不可用，完成率未验证')).toBeInTheDocument();
    expect(screen.queryByText(/443 \/ 443/)).not.toBeInTheDocument();
    expect(screen.queryByText('2/2 PASS')).not.toBeInTheDocument();
    expect(document.querySelector('.bg-indigo-500.h-full')).toBeNull();
  });

  it('shows BFF CONNECTING while the shared Panorama query is loading', () => {
    render(
      <TelemetryPopover
        isOpen
        onClose={vi.fn()}
        telemetry={{ ...mockTelemetry, isLoading: true, connected: false, snapshotState: 'UNKNOWN' }}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText('BFF CONNECTING')).toBeInTheDocument();
    expect(screen.queryByText('BFF UNAVAILABLE')).not.toBeInTheDocument();
  });

  it('triggers onOpenGuardianInspection when inspection button is clicked', () => {
    const onOpenGuardianInspection = vi.fn();
    const onClose = vi.fn();

    render(
      <TelemetryPopover
        isOpen={true}
        onClose={onClose}
        telemetry={mockTelemetry}
        onNavigate={vi.fn()}
        onOpenGuardianInspection={onOpenGuardianInspection}
      />
    );

    const inspectionBtn = screen.getByRole('button', { name: /展开系统巡检视窗/ });
    fireEvent.click(inspectionBtn);

    expect(onOpenGuardianInspection).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();

    render(
      <TelemetryPopover
        isOpen={true}
        onClose={onClose}
        telemetry={mockTelemetry}
        onNavigate={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
