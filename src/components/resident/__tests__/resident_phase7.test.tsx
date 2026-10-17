import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PatrolPanel from '../PatrolPanel';
import SwarmClusterPanel from '../SwarmClusterPanel';
import PitfallRadarPanel from '../PitfallRadarPanel';

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

describe('Phase 7: Trinity Evolution Panels', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders PatrolPanel and triggers patrol cycle with findings and remediations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url, opts) => {
        if (url === '/api/resident/patrol') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              health: 'healthy',
              findings: [
                {
                  component: 'dashboard_projection',
                  issue: '全景投影租约超时',
                  risk_tier: 'R0',
                  remediation_action: 'REFRESH_PROJECTION_LEASE',
                  detail: '已触发全景雷达静默刷新',
                },
              ],
              remediations_executed: [
                {
                  action_id: 'REFRESH_PROJECTION_LEASE',
                  executed_at: '2026-10-17T14:00:00Z',
                  status: 'SUCCESS',
                },
              ],
              escalated_tasks: [],
              scan_duration_ms: 12.3,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(withQueryClient(<PatrolPanel />));

    await waitFor(() => {
      expect(screen.getByText(/自治主动巡检与静默自愈机器人/i)).toBeInTheDocument();
      expect(screen.getByText('健康状态: HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('耗时: 12.3ms')).toBeInTheDocument();
      expect(screen.getByText('全景投影租约超时')).toBeInTheDocument();
      expect(screen.getByText('REFRESH_PROJECTION_LEASE')).toBeInTheDocument();
    });

    const triggerBtn = screen.getByText(/立刻触发巡检/i);
    fireEvent.click(triggerBtn);
  });

  it('renders SwarmClusterPanel with dynamic heterogeneous multi-node mesh (3+ nodes)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          nodes: [
            {
              id: 'local-mac',
              hostname: 'mbp.local',
              role: 'flagship',
              status: 'online',
              inference_port: 1234,
              unified_memory: '128.0 GB',
              gpu_vram: '112.0 GB',
              supported_tiers: ['tier3_deep_reasoning', 'tier1_inspection'],
              priority: 100,
            },
            {
              id: 'macmini',
              hostname: 'macmini-m4.local',
              role: 'sentinel',
              status: 'online',
              tailnet_ip: '100.64.110.118',
              inference_port: 11434,
              unified_memory: '24.0 GB',
              supported_tiers: ['tier1_inspection'],
              priority: 50,
            },
            {
              id: 'y7000p-gpu',
              hostname: 'y7000p.local',
              role: 'worker',
              status: 'online',
              tailnet_ip: '100.64.110.150',
              inference_port: 8000,
              unified_memory: '32.0 GB',
              gpu_vram: '8.0 GB RTX4060',
              supported_tiers: ['tier2_standard'],
              priority: 75,
            },
          ],
          cluster_summary: {
            total_nodes: 3,
            online_nodes: 3,
            flagship_online: true,
            offload_ready: true,
          },
        }),
      })
    );

    render(withQueryClient(<SwarmClusterPanel />));

    await waitFor(() => {
      expect(screen.getByText('3 / 3 节点在线')).toBeInTheDocument();
      expect(screen.getByText(/边缘卸载就绪/i)).toBeInTheDocument();
      expect(screen.getByText(/MBP Flagship/i)).toBeInTheDocument();
      expect(screen.getByText(/MacMini Sentinel/i)).toBeInTheDocument();
      expect(screen.getByText('y7000p.local')).toBeInTheDocument();
      expect(screen.getByText('8.0 GB RTX4060')).toBeInTheDocument();
    });
  });

  it('renders PitfallRadarPanel with ACTIVE vs SHADOW rules and distillation form', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url, opts) => {
        if (url === '/api/resident/pitfalls') {
          return Promise.resolve({
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
                  status: 'active',
                },
                {
                  id: 'pitfall-shadow-001',
                  title: '长任务未声明 profile 降级预警',
                  domain: 'governance',
                  severity: 'HIGH',
                  pattern: '未设置 OMOSTATION_STATE_ROOT',
                  remedy: '建议在长任务前声明 profile',
                  status: 'shadow',
                },
              ],
              recent_intercepts: [],
            }),
          });
        }
        if (url === '/api/resident/pitfalls/distill') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              distilled: true,
              rule: {
                id: 'pitfall-distilled-test',
                title: '测试萃取规则',
                status: 'active',
              },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(withQueryClient(<PitfallRadarPanel />));

    await waitFor(() => {
      expect(screen.getByText('ACTIVE 拦截')).toBeInTheDocument();
      expect(screen.getByText('SHADOW 预警')).toBeInTheDocument();
    });

    const distillBtn = screen.getByText(/踩坑自蒸馏提取/i);
    fireEvent.click(distillBtn);

    expect(screen.getByText(/现场报错补丁自蒸馏/i)).toBeInTheDocument();
  });
});
