import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ComputeView from '../ComputeView';
import LocalModelPanel from '../../views/compute/LocalModelPanel';

const createTestClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0, refetchInterval: false, refetchOnWindowFocus: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const client = createTestClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('ComputeView', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>(() => undefined));
  });

  it('renders loading state while data is pending', () => {
    renderWithProviders(<ComputeView />);
    expect(screen.getByText(/算力调配/)).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));
    renderWithProviders(<ComputeView />);
    await waitFor(() => {
      expect(screen.getByText(/算力调配/)).toBeInTheDocument();
    });
  });

  it('renders the local compute model panel', () => {
    renderWithProviders(<ComputeView />);
    expect(screen.getByText('本地算力模型')).toBeInTheDocument();
  });
});

describe('LocalModelPanel residency evidence', () => {
  const modelId = 'ENG-LMSTUDIO-MACBOOKPRO/mlai3-gpt-oss-120b';

  function serveCatalog(catalog: Record<string, unknown>) {
    vi.mocked(fetch).mockImplementation(async (_url, options) => new Response(
      JSON.stringify(options?.method === 'POST' ? { status: 'success' } : catalog),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
  }

  async function rowFor(id: string) {
    const name = await screen.findByText(id);
    return within(name.parentElement!);
  }

  it('keeps the production unknown catalog visible and cannot send model actions by mouse or keyboard', async () => {
    serveCatalog({
      status: 'success', source: 'aetherforge_gateway', residency: 'unknown',
      loaded_by_node: {}, models: [{ model_id: modelId, residency: 'unknown' }],
    });
    render(<LocalModelPanel />);
    const row = await rowFor(modelId);
    expect(row.getByText('驻留未知')).toBeVisible();
    const action = row.getByRole('button', { name: '状态未知' });
    expect(action).toBeDisabled();
    const user = userEvent.setup();
    await user.click(action);
    action.focus();
    await user.keyboard('{Enter} ');
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => options?.method !== 'POST')).toBe(true);
  });

  it.each([
    ['missing evidence', {}, {}],
    ['malformed model evidence', { residency: 'invalid' }, {}],
    ['malformed aggregate evidence', {}, { residency: 42 }],
    ['explicit unknown despite a positive observation', { residency: 'unknown' }, { loaded_by_node: { host: [modelId] } }],
    ['aggregate unknown without a per-model verdict', {}, { residency: 'unknown', loaded_by_node: { host: [modelId] } }],
    ['conflicting unloaded verdict and positive observation', { residency: 'unloaded' }, { loaded_by_node: { host: [modelId] } }],
  ])('keeps %s unknown', async (_name, modelEvidence, aggregateEvidence) => {
    serveCatalog({
      status: 'success', loaded_by_node: {}, models: [{ model_id: modelId, ...modelEvidence }], ...aggregateEvidence,
    });
    render(<LocalModelPanel />);
    const row = await rowFor(modelId);
    expect(row.getByText('驻留未知')).toBeVisible();
    expect(row.getByRole('button', { name: '状态未知' })).toBeDisabled();
  });

  it.each([
    ['loaded', '已加载', '卸载', 'unload'],
    ['unloaded', '未加载', '加载', 'load'],
  ])('preserves the explicit %s model verdict over an unknown aggregate', async (residency, label, button, action) => {
    serveCatalog({
      status: 'success', residency: 'unknown', loaded_by_node: {}, models: [{ model_id: modelId, residency }],
    });
    render(<LocalModelPanel />);
    const row = await rowFor(modelId);
    expect(row.getByText(label)).toBeVisible();
    expect(row.getByRole('button', { name: button })).toBeEnabled();
    await userEvent.click(row.getByRole('button', { name: button }));
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(([url, options]) =>
      url === '/api/governance/compute/model-action' && options?.method === 'POST'
      && options.body === JSON.stringify({ model: modelId, action }),
    )).toBe(true));
  });

  it('keeps mixed rows separate and never borrows a same-name model from another engine', async () => {
    const otherId = 'ENG-LMSTUDIO-MACMINI/mlai3-gpt-oss-120b';
    const unknownId = 'ENG-OMLX-LOCAL/another-model';
    serveCatalog({
      status: 'success', loaded_by_node: { host: [modelId] },
      models: [{ model_id: modelId }, { model_id: otherId }, { model_id: unknownId, residency: 'unknown' }],
    });
    render(<LocalModelPanel />);
    expect((await rowFor(modelId)).getByRole('button', { name: '卸载' })).toBeEnabled();
    expect((await rowFor(otherId)).getByText('驻留未知')).toBeVisible();
    expect((await rowFor(unknownId)).getByRole('button', { name: '状态未知' })).toBeDisabled();
  });

  it('does not turn empty node records into idle or unloaded claims', async () => {
    serveCatalog({ status: 'success', loaded_by_node: { host: [] }, models: [{ model_id: modelId }] });
    render(<LocalModelPanel />);
    expect((await rowFor(modelId)).getByText('驻留未知')).toBeVisible();
    expect(screen.getByText(/无加载记录/)).toBeVisible();
    expect(screen.queryByText(/空闲/)).not.toBeInTheDocument();
  });

  it('disables a formerly known row when a refresh reports unknown', async () => {
    serveCatalog({ status: 'success', models: [{ model_id: modelId, residency: 'loaded' }] });
    render(<LocalModelPanel />);
    expect((await rowFor(modelId)).getByRole('button', { name: '卸载' })).toBeEnabled();
    serveCatalog({ status: 'success', residency: 'unknown', loaded_by_node: {}, models: [{ model_id: modelId }] });
    await userEvent.click(screen.getByRole('button', { name: '刷新' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '状态未知' })).toBeDisabled());
    await userEvent.click(screen.getByRole('button', { name: '状态未知' }));
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => options?.method !== 'POST')).toBe(true);
  });
});
