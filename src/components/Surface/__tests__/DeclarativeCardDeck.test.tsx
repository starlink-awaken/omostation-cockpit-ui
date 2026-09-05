import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeclarativeCardDeck } from '../DeclarativeCardDeck';
import type { ExtensionManifestData } from '../types';

const mockManifest: ExtensionManifestData = {
  schema_version: 'surface-manifest/v1',
  extension_id: 'omlxc-compute',
  domain: 'compute',
  title: 'omlxc 异构主权算力织网',
  description: 'MPS / CUDA 显存监控与 DFlash 2 投机解码',
  cards: [
    {
      id: 'kpi-card',
      type: 'metric_grid',
      title: 'MPS 显存状态',
      static_data: {
        metrics: [
          {
            label: '统一显存使用率',
            value: '64.2%',
            unit: 'GB',
            trend: 'up',
            status: 'normal',
          },
          {
            label: 'DFlash 解码吞吐',
            value: 148.5,
            unit: 'tok/s',
            trend: 'neutral',
            status: 'normal',
          },
        ],
      },
    },
    {
      id: 'table-card',
      type: 'data_table',
      title: 'Paged KV 块分布',
      static_data: {
        columns: [
          { key: 'session', label: '会话 ID' },
          { key: 'model', label: '模型' },
          { key: 'hit_rate', label: '命中率' },
        ],
        rows: [
          { session: 'sess-01', model: 'Qwen-32B', hit_rate: '92.4%' },
          { session: 'sess-02', model: 'DeepSeek-14B', hit_rate: '85.1%' },
        ],
      },
    },
    {
      id: 'action-card',
      type: 'action_panel',
      title: '算力编排操作',
      static_data: {
        description: '显存释放与缓存预热',
        actions: [
          {
            id: 'evict-kv',
            label: '淘汰冷区 KV',
            variant: 'primary',
            payload: { mode: 'lru' },
          },
          {
            id: 'emergency-quant',
            label: '紧急降级量化',
            variant: 'danger',
            confirm: true,
            payload: { bits: 4 },
          },
        ],
      },
    },
    {
      id: 'log-card',
      type: 'log_stream',
      title: 'DFlash 投机流',
      static_data: {
        lines: [
          '[INFO] DFlash 2 speculative draft verified: 8/8 tokens',
          '[WARN] MPS memory reach 64.2% threshold',
        ],
      },
    },
  ],
};

describe('DeclarativeCardDeck', () => {
  it('renders deck header, title, domain badge, and card count', () => {
    render(<DeclarativeCardDeck manifest={mockManifest} />);

    expect(screen.getByText('omlxc 异构主权算力织网')).toBeInTheDocument();
    expect(screen.getByText('compute')).toBeInTheDocument();
    expect(
      screen.getByText('MPS / CUDA 显存监控与 DFlash 2 投机解码')
    ).toBeInTheDocument();
    expect(screen.getByText('4 张卡片挂载')).toBeInTheDocument();
  });

  it('renders metric grid card with cells, units and values', () => {
    render(<DeclarativeCardDeck manifest={mockManifest} />);

    expect(screen.getByText('MPS 显存状态')).toBeInTheDocument();
    expect(screen.getByText('统一显存使用率')).toBeInTheDocument();
    expect(screen.getByText('64.2%')).toBeInTheDocument();
    expect(screen.getByText('DFlash 解码吞吐')).toBeInTheDocument();
    expect(screen.getByText('148.5')).toBeInTheDocument();
    expect(screen.getByText('tok/s')).toBeInTheDocument();
  });

  it('renders data table card with columns and rows', () => {
    render(<DeclarativeCardDeck manifest={mockManifest} />);

    expect(screen.getByText('Paged KV 块分布')).toBeInTheDocument();
    expect(screen.getByText('会话 ID')).toBeInTheDocument();
    expect(screen.getByText('sess-01')).toBeInTheDocument();
    expect(screen.getByText('Qwen-32B')).toBeInTheDocument();
    expect(screen.getByText('92.4%')).toBeInTheDocument();
    expect(screen.getByText('sess-02')).toBeInTheDocument();
  });

  it('renders action panel and fires callback on button click', () => {
    const handleAction = vi.fn();
    render(
      <DeclarativeCardDeck manifest={mockManifest} onAction={handleAction} />
    );

    expect(screen.getByText('算力编排操作')).toBeInTheDocument();
    const evictBtn = screen.getByText('淘汰冷区 KV');
    fireEvent.click(evictBtn);

    expect(handleAction).toHaveBeenCalledWith('evict-kv', { mode: 'lru' });
  });

  it('handles confirmation state for dangerous actions', () => {
    const handleAction = vi.fn();
    render(
      <DeclarativeCardDeck manifest={mockManifest} onAction={handleAction} />
    );

    const dangerBtn = screen.getByText('紧急降级量化');
    fireEvent.click(dangerBtn);

    // First click: requires confirmation, does not invoke callback yet
    expect(handleAction).not.toHaveBeenCalled();
    expect(screen.getByText(/确认: 紧急降级量化？/)).toBeInTheDocument();

    // Second click: confirms and triggers callback
    fireEvent.click(screen.getByText(/确认: 紧急降级量化？/));
    expect(handleAction).toHaveBeenCalledWith('emergency-quant', { bits: 4 });
  });

  it('renders log stream lines', () => {
    render(<DeclarativeCardDeck manifest={mockManifest} />);

    expect(screen.getByText('DFlash 投机流')).toBeInTheDocument();
    expect(
      screen.getByText(/DFlash 2 speculative draft verified/)
    ).toBeInTheDocument();
    expect(screen.getByText(/MPS memory reach 64.2%/)).toBeInTheDocument();
  });
});
