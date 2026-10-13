import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BcosEvolutionChainView } from '../BcosEvolutionChainView';
import * as hooks from '../../../api/hooks/useGovernancePanorama';
import { ToastProvider } from '../../../components/common/Toast';
import type { PanoramaOverviewPayload } from '../../../api/types/panorama';

const mockBcos: PanoramaOverviewPayload['bcos'] = {
  epoch: 24,
  selfDistillationCount: 142,
  learningRate: 0.001,
  healthScore: 98.7,
  lastEvolutionTime: '2026-09-24T12:00:00Z',
  recentRecords: [
    {
      id: 'evo-24',
      epoch: 24,
      timestamp: '2026-09-24T12:00:00Z',
      summary: '收敛双核视图，确立单一人类入口',
      impactScope: 'Cockpit UI / Observatory',
    },
  ],
};

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BcosEvolutionChainView Component', () => {
  const mockRefetch = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skeleton cards when loading', () => {
    vi.spyOn(hooks, 'useBcosEvolution').mockReturnValue({
      bcos: mockBcos,
      isLoading: true,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<BcosEvolutionChainView />);
    expect(screen.getByRole('status', { name: /loading bcos metrics/i })).toBeInTheDocument();
  });

  it('renders current epoch, distillation count, and evolution records', () => {
    vi.spyOn(hooks, 'useBcosEvolution').mockReturnValue({
      bcos: mockBcos,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<BcosEvolutionChainView />);

    expect(screen.getByText('BCOS 主权进化链与学习图谱')).toBeInTheDocument();
    expect(screen.getAllByText('Epoch 24').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('98.7%')).toBeInTheDocument();
    expect(screen.getByTestId('evolution-record-evo-24')).toBeInTheDocument();
    expect(screen.getByText(/收敛双核视图/i)).toBeInTheDocument();
  });

  it('does not show stale evolution as a current epoch', () => {
    vi.spyOn(hooks, 'useBcosEvolution').mockReturnValue({ bcos: mockBcos, isLoading: false, isFallback: false, sourceState: 'STALE', sourceFailure: 'age exceeded', sourceObservedAt: null, sourceAgeMs: 360001, refetch: vi.fn().mockResolvedValue({ sourceState: 'STALE', sourceFailure: 'age exceeded' }) });
    renderWithToast(<BcosEvolutionChainView />);
    expect(screen.getByText(/来源 STALE/)).toBeInTheDocument();
    expect(screen.queryByText('Epoch 24')).not.toBeInTheDocument();
  });

  it('does not show evolution metrics when a PARTIAL source marks evolution unverified', () => {
    vi.spyOn(hooks, 'useBcosEvolution').mockReturnValue({ bcos: mockBcos, isLoading: false, isFallback: false, sourceState: 'PARTIAL', sourceFailure: 'field_provenance_missing', sourceObservedAt: '2026-10-07T00:00:00Z', sourceAgeMs: 12_000, partialFacets: ['evolution'], refetch: vi.fn().mockResolvedValue({ sourceState: 'PARTIAL', sourceFailure: 'field_provenance_missing' }) });
    renderWithToast(<BcosEvolutionChainView />);
    expect(screen.getByText(/来源 PARTIAL/)).toBeInTheDocument();
    expect(screen.queryByText('Epoch 24')).not.toBeInTheDocument();
    expect(screen.getByText('进化记录未验证')).toBeInTheDocument();
  });

  it('triggers refresh when clicking refresh button', async () => {
    vi.spyOn(hooks, 'useBcosEvolution').mockReturnValue({
      bcos: mockBcos,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<BcosEvolutionChainView />);

    const refreshButton = screen.getByRole('button', { name: /刷新进化图谱/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
