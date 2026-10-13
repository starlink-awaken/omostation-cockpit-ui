import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SystemTopologyWallboard } from '../SystemTopologyWallboard';
import * as hooks from '../../../api/hooks/useGovernancePanorama';
import { ToastProvider } from '../../../components/common/Toast';
import type { PanoramaOverviewPayload } from '../../../api/types/panorama';

const mockTopology: PanoramaOverviewPayload['topology'] = {
  layers: [
    {
      id: 'dao',
      name: '道 (Dao) — 意志与意图',
      description: 'Intent, Values, 治理哲学与主权底座',
      status: 'OPTIMAL',
      nodes: [
        { id: 'intent-compiler', label: 'Intent Compiler', kind: 'service', layer: 'Dao', status: 'active' },
        { id: 'master-ledger', label: '3Y Bet Ledger', kind: 'storage', layer: 'Dao', status: 'active' },
      ],
    },
    {
      id: 'fa',
      name: '法 (Fa) — 契约与门禁',
      description: 'Governance Gates, CI 检验平面与规范守则',
      status: 'OPTIMAL',
      nodes: [
        { id: 'harness-dag', label: 'Harness 8-Stage DAG', kind: 'contract', layer: 'Fa', status: 'active' },
      ],
    },
    {
      id: 'shu',
      name: '术 (Shu) — 编排与协同',
      description: 'Agent Workflow, Multi-Agent Swarm',
      status: 'OPTIMAL',
      nodes: [
        { id: 'workflow-engine', label: 'Workflow Engine', kind: 'service', layer: 'Shu', status: 'active' },
      ],
    },
    {
      id: 'qi',
      name: '器 (Qi) — 工具与具身',
      description: 'Cockpit-UI, Local Edge Compute',
      status: 'OPTIMAL',
      nodes: [
        { id: 'cockpit-ui', label: 'Cockpit UI (:5173)', kind: 'interface', layer: 'Qi', status: 'active' },
      ],
    },
  ],
  slots: [
    {
      id: 'COMP-WS-omo',
      name: 'Active Dispatcher Slot',
      status: 'ACTIVE',
      component: 'projects/omo',
    },
  ],
};

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('SystemTopologyWallboard Component', () => {
  const mockRefetch = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skeleton cards when loading', () => {
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({
      topology: mockTopology,
      isLoading: true,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<SystemTopologyWallboard />);
    expect(screen.getByRole('status', { name: /loading topology/i })).toBeInTheDocument();
  });

  it('renders active S-slot and 4 layers cards', () => {
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({
      topology: mockTopology,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<SystemTopologyWallboard />);

    expect(screen.getByText('道法术器架构拓扑中枢')).toBeInTheDocument();
    expect(screen.getByText(/COMP-WS-omo/i)).toBeInTheDocument();
    expect(screen.getByTestId('layer-card-dao')).toBeInTheDocument();
    expect(screen.getByTestId('layer-card-fa')).toBeInTheDocument();
    expect(screen.getByTestId('layer-card-shu')).toBeInTheDocument();
    expect(screen.getByTestId('layer-card-qi')).toBeInTheDocument();
  });

  it('hides active topology claims for stale data', () => {
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({ topology: mockTopology, isLoading: false, isFallback: false, sourceState: 'STALE', sourceFailure: 'age exceeded', sourceObservedAt: null, sourceAgeMs: 360001, refetch: vi.fn().mockResolvedValue({ sourceState: 'STALE', sourceFailure: 'age exceeded' }) });
    renderWithToast(<SystemTopologyWallboard />);
    expect(screen.getByText(/拓扑来源 STALE/)).toBeInTheDocument();
    expect(screen.queryByText(/COMP-WS-omo/)).not.toBeInTheDocument();
  });

  it('hides topology claims when a PARTIAL source marks topology unverified', () => {
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({ topology: mockTopology, isLoading: false, isFallback: false, sourceState: 'PARTIAL', sourceFailure: 'field_provenance_missing', sourceObservedAt: '2026-10-07T00:00:00Z', sourceAgeMs: 12_000, partialFacets: ['topology'], refetch: vi.fn().mockResolvedValue({ sourceState: 'PARTIAL', sourceFailure: 'field_provenance_missing' }) });
    renderWithToast(<SystemTopologyWallboard />);
    expect(screen.getByText(/拓扑来源 PARTIAL/)).toBeInTheDocument();
    expect(screen.queryByText(/COMP-WS-omo/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('layer-card-dao')).not.toBeInTheDocument();
  });

  it('allows clicking a node to select it', () => {
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({
      topology: mockTopology,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<SystemTopologyWallboard />);

    const intentNode = screen.getByText('Intent Compiler');
    fireEvent.click(intentNode);

    // Verify it handles selection state without crashing
    expect(intentNode).toBeInTheDocument();
  });

  it('triggers refresh when clicking refresh button', async () => {
    vi.spyOn(hooks, 'useSystemTopology').mockReturnValue({
      topology: mockTopology,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<SystemTopologyWallboard />);

    const refreshButton = screen.getByRole('button', { name: /刷新拓扑状态/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
