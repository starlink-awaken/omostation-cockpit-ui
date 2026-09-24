import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
      name: '架构契约检查 (Architecture Contracts)',
      verdict: 'PASS',
      exitCode: 0,
      timestamp: '2026-09-24T20:00:00Z',
    },
  ],
  guardian: {
    pulseIntervalSec: 74,
    lastHeartbeat: '2026-09-24T20:00:00Z',
    healthScore: 99.4,
    subsystems: [
      { id: 'gate_guardian', name: '门禁巡航守卫', status: 'HEALTHY' },
    ],
    alerts: [],
  },
  topology: {
    layers: [
      {
        id: 'dao',
        name: '道 (Dao) — 意志与意图',
        description: 'Intent',
        status: 'OPTIMAL',
        nodes: [],
      },
    ],
    slots: [
      { id: 'COMP-WS-omo', name: 'Active Dispatcher', status: 'ACTIVE', component: 'projects/omo' },
    ],
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

function renderComponent(initialRoute = '/panorama') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <PanoramaMasterView />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('PanoramaMasterView Master Deck', () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders top master deck header and default gates tab', () => {
    renderComponent();

    expect(screen.getByText('织星体系全景控制舱')).toBeInTheDocument();
    expect(screen.getByText('99.4%')).toBeInTheDocument();
    expect(screen.getByText('系统门禁全景矩阵')).toBeInTheDocument();
  });

  it('switches to guardian wallboard tab', () => {
    renderComponent();

    const guardianTab = screen.getByRole('button', { name: /74s 哨兵大屏/i });
    fireEvent.click(guardianTab);

    expect(screen.getByText('74s 哨兵常态守护与健康大屏')).toBeInTheDocument();
  });

  it('switches to architecture topology tab', () => {
    renderComponent();

    const topologyTab = screen.getByRole('button', { name: /架构拓扑/i });
    fireEvent.click(topologyTab);

    expect(screen.getByText('道法术器架构拓扑中枢')).toBeInTheDocument();
  });

  it('switches to bcos evolution chain tab', () => {
    renderComponent();

    const bcosTab = screen.getByRole('button', { name: /BCOS 进化链/i });
    fireEvent.click(bcosTab);

    expect(screen.getByText('BCOS 主权进化链与学习图谱')).toBeInTheDocument();
  });

  it('toggles wallboard immersion mode', () => {
    renderComponent();

    const wallboardBtn = screen.getByRole('button', { name: /切换沉浸式大屏模式/i });
    expect(screen.getByText(/沉浸大屏/i)).toBeInTheDocument();

    fireEvent.click(wallboardBtn);
    expect(screen.getByText(/退出大屏/i)).toBeInTheDocument();
  });
});
