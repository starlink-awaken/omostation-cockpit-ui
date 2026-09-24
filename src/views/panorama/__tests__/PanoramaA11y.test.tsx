import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PanoramaMasterView } from '../PanoramaMasterView';
import * as hooks from '../../../api/hooks/useGovernancePanorama';
import { ToastProvider } from '../../../components/common/Toast';
import type { PanoramaOverviewPayload } from '../../../api/types/panorama';

const mockPanoramaData: PanoramaOverviewPayload = {
  timestamp: '2026-09-24T20:00:00Z',
  version: '2.0.0-dual-core',
  gates: [
    {
      id: 'A1',
      name: '架构契约检查',
      verdict: 'PASS',
      exitCode: 0,
      timestamp: '2026-09-24T20:00:00Z',
    },
  ],
  guardian: {
    pulseIntervalSec: 74,
    lastHeartbeat: '2026-09-24T20:00:00Z',
    healthScore: 99.4,
    subsystems: [],
    alerts: [],
  },
  topology: {
    layers: [],
    slots: [],
  },
  bcos: {
    epoch: 24,
    selfDistillationCount: 142,
    learningRate: 0.001,
    healthScore: 98.7,
    lastEvolutionTime: '2026-09-24T12:00:00Z',
    recentRecords: [],
  },
};

function renderA11yTest(initialRoute = '/panorama') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <PanoramaMasterView />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('PanoramaMasterView Accessibility (A11y)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(hooks, 'useGovernancePanorama').mockReturnValue({
      data: mockPanoramaData,
      isLoading: false,
      isError: false,
      isFallback: false,
      refetch: vi.fn(),
    });
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockPanoramaData.gates,
      isLoading: false,
      isFallback: false,
      refetch: vi.fn(),
    });
    vi.spyOn(hooks, 'useGuardianStatus').mockReturnValue({
      guardian: mockPanoramaData.guardian,
      isLoading: false,
      isFallback: false,
      refetch: vi.fn(),
    });
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({
      topology: mockPanoramaData.topology,
      isLoading: false,
      isFallback: false,
      refetch: vi.fn(),
    });
    vi.spyOn(hooks, 'useBcosEvolution').mockReturnValue({
      bcos: mockPanoramaData.bcos,
      isLoading: false,
      isFallback: false,
      refetch: vi.fn(),
    });
  });

  it('renders tablist and tabs with correct ARIA attributes', () => {
    renderA11yTest();

    const tablist = screen.getByRole('tablist', { name: '治理全景视图选择' });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(5);

    // Initial gates tab should be selected
    const gatesTab = screen.getByRole('tab', { name: /门禁全景/i });
    expect(gatesTab).toHaveAttribute('aria-selected', 'true');
    expect(gatesTab).toHaveAttribute('id', 'tab-gates');
    expect(gatesTab).toHaveAttribute('aria-controls', 'tabpanel-gates');

    // Guardian tab should not be selected initially
    const guardianTab = screen.getByRole('tab', { name: /74s 哨兵大屏/i });
    expect(guardianTab).toHaveAttribute('aria-selected', 'false');

    // Tabpanel should be labeled by the selected tab
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'tabpanel-gates');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-gates');
  });

  it('updates aria-selected and tabpanel aria-labelledby upon tab click', () => {
    renderA11yTest();

    const guardianTab = screen.getByRole('tab', { name: /74s 哨兵大屏/i });
    fireEvent.click(guardianTab);

    expect(guardianTab).toHaveAttribute('aria-selected', 'true');

    const gatesTab = screen.getByRole('tab', { name: /门禁全景/i });
    expect(gatesTab).toHaveAttribute('aria-selected', 'false');

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'tabpanel-guardian');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-guardian');
  });

  it('toggles aria-pressed on auto-rotation and wallboard buttons', () => {
    renderA11yTest();

    const rotateBtn = screen.getByRole('button', { name: /开启大屏轮播/i });
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(rotateBtn);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'true');

    const wallboardBtn = screen.getByRole('button', { name: /切换沉浸式大屏模式/i });
    expect(wallboardBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(wallboardBtn);
    expect(wallboardBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders status toast with aria-live="polite"', () => {
    renderA11yTest();

    fireEvent.keyDown(window, { key: 'a' });

    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
    expect(statusElement).toHaveTextContent(/自动巡航轮播已开启/i);
  });
});
