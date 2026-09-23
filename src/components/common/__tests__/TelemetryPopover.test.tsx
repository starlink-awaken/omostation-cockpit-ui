import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TelemetryPopover from '../TelemetryPopover';
import type { LiveTelemetryState } from '../../../api/liveTelemetry';

const mockTelemetry: LiveTelemetryState = {
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

    expect(screen.getByText('43191 知行实时遥测')).toBeInTheDocument();
    expect(screen.getByText('SSE CONNECTED')).toBeInTheDocument();
    expect(screen.getByText('43.2GB / 152GB')).toBeInTheDocument();
    expect(screen.getByText('Guardian: 74s 脉冲')).toBeInTheDocument();
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

    const inspectionBtn = screen.getByRole('button', { name: /展开 74s 哨兵巡检视窗/ });
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
