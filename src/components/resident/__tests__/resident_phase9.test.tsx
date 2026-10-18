import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HostServiceAndInferencePanel from '../HostServiceAndInferencePanel';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Phase 9: Host Service Daemon & Swarm Inference Gateway Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders HostServiceAndInferencePanel and displays LaunchAgent running status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url === '/api/resident/service/status') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              service: {
                installed: true,
                label: 'com.omostation.resident-agent',
                launchd_running: true,
                pid: 48921,
                state: {
                  status: 'running',
                  last_job: 'patrol',
                  last_status: 'ok',
                  last_run_at: '2026-10-18T19:00:00Z',
                  jobs_completed: 18,
                  heartbeat: '2026-10-18T19:30:00Z',
                },
                recent_log: '[2026-10-18 19:30:00] [INFO] Patrol completed cleanly: 0 errors',
              },
            }),
          });
        }
        if (url === '/api/resident/compute/metrics') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              metrics: {
                total_requests: 25,
                fallback_count: 2,
                nodes: {
                  'local-mac': {
                    requests: 10,
                    fallbacks: 0,
                    avg_latency_ms: 120.4,
                  },
                  'macmini': {
                    requests: 15,
                    fallbacks: 2,
                    avg_latency_ms: 48.2,
                  },
                },
              },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(<HostServiceAndInferencePanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/操作系统原生宿主守护/i)).toBeInTheDocument();
      expect(screen.getByText(/com\.omostation\.resident-agent/i)).toBeInTheDocument();
      expect(screen.getByText(/守护中 \(PID: 48921\)/i)).toBeInTheDocument();
      expect(screen.getByText(/18 轮/i)).toBeInTheDocument();
      expect(screen.getByText(/总请求: 25/i)).toBeInTheDocument();
      expect(screen.getByText(/降级数: 2/i)).toBeInTheDocument();
      expect(screen.getByText(/macmini/i)).toBeInTheDocument();
      expect(screen.getByText(/48.2 ms/i)).toBeInTheDocument();
    });
  });

  it('triggers manual patrol job and displays success toast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url === '/api/resident/service/status') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              service: {
                installed: true,
                launchd_running: true,
                pid: 48921,
                state: {},
              },
            }),
          });
        }
        if (url === '/api/resident/compute/metrics') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, metrics: { total_requests: 0, fallback_count: 0, nodes: {} } }),
          });
        }
        if (url === '/api/resident/service/trigger' && opts?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              job: 'patrol',
              result: { scanned_files: 10, issues: 0 },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(<HostServiceAndInferencePanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/日巡 \(Patrol\)/i)).toBeInTheDocument();
    });

    const patrolBtn = screen.getByText(/日巡 \(Patrol\)/i);
    fireEvent.click(patrolBtn);

    await waitFor(() => {
      expect(screen.getByText(/任务 \[patrol\] 演练触发成功并已完成记录/i)).toBeInTheDocument();
    });
  });

  it('runs interactive live inference and displays routed node and latency', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url === '/api/resident/service/status') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, service: { installed: true, launchd_running: true } }),
          });
        }
        if (url === '/api/resident/compute/metrics') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, metrics: { total_requests: 0, fallback_count: 0, nodes: {} } }),
          });
        }
        if (url === '/api/resident/infer' && opts?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              content: '常驻守护感知正常，各算力节点拓扑连通。',
              target_node: 'macmini-sentinel',
              target_host: '100.64.110.118',
              target_port: 11434,
              tier: 'tier1_inspection',
              fallback_used: false,
              latency_ms: 54.2,
              model_used: 'qwen2.5:7b',
              raw_response: {},
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(<HostServiceAndInferencePanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/发送推断请求/i)).toBeInTheDocument();
    });

    const sendBtn = screen.getByText(/发送推断请求/i);
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/macmini-sentinel/i)).toBeInTheDocument();
      expect(screen.getByText(/54.2 ms/i)).toBeInTheDocument();
      expect(screen.getByText(/常驻守护感知正常，各算力节点拓扑连通。/i)).toBeInTheDocument();
    });
  });
});
