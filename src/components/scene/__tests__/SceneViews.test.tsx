import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SceneOverviewView from '../SceneOverviewView';
import SceneGraphView from '../SceneGraphView';

vi.mock('../../../api/hooks/sceneLifecycle', () => ({
  useSceneList: vi.fn(),
  useEscalationQueue: vi.fn(() => ({ data: { count: 0 } })),
  useSceneGraph: vi.fn(),
}));

import { useSceneList, useSceneGraph } from '../../../api/hooks/sceneLifecycle';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Scene Views with Skeleton & EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SceneOverviewView', () => {
    it('renders Skeleton loading state when isLoading is true', () => {
      vi.mocked(useSceneList).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithClient(<SceneOverviewView />);
      expect(screen.getByLabelText('Loading table...')).toBeInTheDocument();
    });

    it('renders EmptyState when scenes array is empty', () => {
      vi.mocked(useSceneList).mockReturnValue({
        data: { scenes: [] },
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<SceneOverviewView />);
      expect(screen.getByText('暂无场景卡')).toBeInTheDocument();
    });

    it('renders scenes list when data is available', () => {
      vi.mocked(useSceneList).mockReturnValue({
        data: {
          scenes: [
            {
              scene_id: 'scene-01',
              name: '测试场景',
              domain: 'work',
              lifecycle: 'routine',
              activation: 'active',
            },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<SceneOverviewView />);
      expect(screen.getByText('测试场景')).toBeInTheDocument();
      expect(screen.getAllByText('routine').length).toBeGreaterThan(0);
    });
  });

  describe('SceneGraphView', () => {
    it('renders Skeleton loading state when isLoading is true', () => {
      vi.mocked(useSceneGraph).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithClient(<SceneGraphView />);
      expect(screen.getByLabelText('Loading table...')).toBeInTheDocument();
    });

    it('renders EmptyState when topological order is empty', () => {
      vi.mocked(useSceneGraph).mockReturnValue({
        data: { topological_order: [], nodes: {} },
        isLoading: false,
        error: null,
      } as any);

      renderWithClient(<SceneGraphView />);
      expect(screen.getByText('暂无场景 DAG 拓扑')).toBeInTheDocument();
    });
  });
});
