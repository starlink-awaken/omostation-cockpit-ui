import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DecisionGraphViewer from '../DecisionGraphViewer';

function withQueryClient(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchInterval: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SAMPLE_DATA = {
  total_nodes: 5,
  total_edges: 4,
  by_kind: { patrol: 1, healing: 1, decision: 3 },
  by_relation: { CAUSED: 2, INFLUENCED: 2 },
  recent_nodes: [
    { node_id: 'n1', kind: 'patrol', actor: 'patrol-agent', action: 'health-check', ts: '2026-09-12T10:00:00Z' },
    { node_id: 'n2', kind: 'healing', actor: 'heal-agent', action: 'restart', ts: '2026-09-12T10:01:00Z' },
    { node_id: 'n3', kind: 'decision', actor: 'governor', action: 'approve-deploy', ts: '2026-09-12T10:02:00Z' },
  ],
  actor_activity: { 'patrol-agent': 1, 'heal-agent': 1, governor: 1, entity: 2 },
  action_frequency: { 'health-check': 1, restart: 1, 'approve-deploy': 1, 'affected: api-service': 1 },
  nodes: [
    { node_id: 'n1', kind: 'patrol', actor: 'patrol-agent', action: 'health-check', ts: '2026-09-12T10:00:00Z' },
    { node_id: 'n2', kind: 'healing', actor: 'heal-agent', action: 'restart', ts: '2026-09-12T10:01:00Z' },
    { node_id: 'n3', kind: 'decision', actor: 'governor', action: 'approve-deploy', ts: '2026-09-12T10:02:00Z' },
  ],
  edges: [
    { src: 'n1', dst: 'n2', relation: 'CAUSED' },
    { src: 'n2', dst: 'n3', relation: 'CAUSED' },
    { src: 'n2', dst: 'e1', relation: 'INFLUENCED' },
  ],
};

describe('DecisionGraphViewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton initially', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => {}))
    );

    render(withQueryClient(<DecisionGraphViewer />));

    expect(screen.getByText('因果决策图')).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders stats cards when data is available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_DATA,
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('节点总数')).toBeInTheDocument();
    });

    expect(screen.getByText('因果边数')).toBeInTheDocument();
    expect(screen.getByText('Actor 数')).toBeInTheDocument();
    expect(screen.getByText('Action 数')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('renders distribution bars for kind and relation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_DATA,
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('节点类型分布')).toBeInTheDocument();
    });

    expect(screen.getAllByText('patrol').length).toBeGreaterThan(0);
    expect(screen.getAllByText('healing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('decision').length).toBeGreaterThan(0);
    expect(screen.getByText('关系类型分布')).toBeInTheDocument();
    expect(screen.getByText('CAUSED')).toBeInTheDocument();
    expect(screen.getByText('INFLUENCED')).toBeInTheDocument();
  });

  it('renders actor activity and action frequency sections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_DATA,
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('Actor 活跃度')).toBeInTheDocument();
    });

    expect(screen.getByText('Action 频率')).toBeInTheDocument();
  });

  it('renders recent nodes table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_DATA,
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('最近节点')).toBeInTheDocument();
    });

    // Should show table caption
    expect(screen.getByText(/最近 20 个决策图节点/)).toBeInTheDocument();
  });

  it('shows empty state on API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ data: null, error: 'server error' }),
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/)).toBeInTheDocument();
    });
  });

  it('switches to nodes tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_DATA,
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('节点列表')).toBeInTheDocument();
    });

    // Click the nodes tab
    screen.getByText('节点列表').click();

    await waitFor(() => {
      expect(screen.getByText('全部节点')).toBeInTheDocument();
    });
  });

  it('switches to graph tab and renders topology', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_DATA,
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('因果拓扑')).toBeInTheDocument();
    });

    screen.getByText('因果拓扑').click();

    await waitFor(() => {
      // Legend should appear
      expect(screen.getByText('CAUSED')).toBeInTheDocument();
      expect(screen.getByText('INFLUENCED')).toBeInTheDocument();
    });
  });

  it('renders empty data gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_nodes: 0,
          total_edges: 0,
          by_kind: {},
          by_relation: {},
          recent_nodes: [],
          actor_activity: {},
          action_frequency: {},
          nodes: [],
          edges: [],
        }),
      })
    );

    render(withQueryClient(<DecisionGraphViewer />));

    await waitFor(() => {
      expect(screen.getByText('节点总数')).toBeInTheDocument();
    });

    // Empty sections should show "暂无数据"
    expect(screen.getAllByText('暂无数据').length).toBeGreaterThan(0);
  });
});
