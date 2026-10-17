import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TriagePanel from '../TriagePanel';
import PitfallRadarPanel from '../PitfallRadarPanel';
import SwarmClusterPanel from '../SwarmClusterPanel';

function withQueryClient(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchInterval: false,
      },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('Phase 6: Resident Panels', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders TriagePanel and triggers triage diagnostic flow', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url, opts) => {
        if (url === '/api/resident/triage') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              component: 'dashboard_projection',
              risk_tier: 'R0',
              suggested_action: '刷新投影租约',
              task_id: 'TASK-TRIAGE-TEST',
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      })
    );

    render(withQueryClient(<TriagePanel />));

    expect(
      screen.getByText(/常驻 Agent 现场排障分诊台/i)
    ).toBeInTheDocument();

    const triggerBtn = screen.getByText(/开始现场分诊评估/i);
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByText(/分诊诊断报告/i)).toBeInTheDocument();
      expect(screen.getByText(/运维级·允许自愈/i)).toBeInTheDocument();
      expect(screen.getByText('刷新投影租约')).toBeInTheDocument();
      expect(screen.getByText(/一键触发安全自愈/i)).toBeInTheDocument();
    });
  });

  it('renders PitfallRadarPanel with rules and intercept events', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          total_rules: 2,
          guard_status: 'ACTIVE',
          rules: [
            {
              id: 'pitfall-001',
              title: 'zsh 裸变量展开切词禁令',
              domain: 'shell',
              severity: 'CRITICAL',
              pattern: 'VAR="a b c"; for x in $VAR',
              remedy: '改用数组 arr=(a b c)',
            },
          ],
          recent_intercepts: [
            {
              timestamp: '2026-10-17T13:30:00Z',
              rule_id: 'pitfall-001',
              component: 'tests/test_audit.sh',
              detail: '拦截劣质循环展开',
              status: 'BLOCKED',
            },
          ],
        }),
      })
    );

    render(withQueryClient(<PitfallRadarPanel />));

    await waitFor(() => {
      expect(screen.getByText(/踩坑信念雷达/i)).toBeInTheDocument();
      expect(screen.getByText('zsh 裸变量展开切词禁令')).toBeInTheDocument();
      expect(screen.getByText(/拦截劣质循环展开/i)).toBeInTheDocument();
      expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    });
  });

  it('renders SwarmClusterPanel with dual-machine node specs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          mbp_flagship: {
            unified_memory: '128.0 GB',
            gpu_vram_limit: '112.0 GB',
            status: 'online',
            inference_port: 1234,
          },
          macmini_sentinel: {
            unified_memory: '24.0 GB',
            status: 'standby',
            tailnet_ip: '100.64.110.118',
            inference_port: 11434,
          },
        }),
      })
    );

    render(withQueryClient(<SwarmClusterPanel />));

    await waitFor(() => {
      expect(screen.getByText(/双机物理算力集群/i)).toBeInTheDocument();
      expect(screen.getByText(/MBP Flagship/i)).toBeInTheDocument();
      expect(screen.getByText(/MacMini Sentinel/i)).toBeInTheDocument();
      expect(screen.getByText('128.0 GB')).toBeInTheDocument();
      expect(screen.getByText('100.64.110.118')).toBeInTheDocument();
    });
  });
});
