import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResidentChatPanel from '../ResidentChatPanel';

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

describe('Phase 10: Human-in-the-Loop Dialog Bridge & Contextual Memory Recall Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof Element !== 'undefined') {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ResidentChatPanel with session indicator and control bar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/resident/chat/history')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              session_id: 'default',
              messages: [],
            }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      })
    );

    render(<ResidentChatPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('常驻首席认知 Agent 对话终端')).toBeInTheDocument();
      expect(screen.getByText('Session: default')).toBeInTheDocument();
      expect(screen.getByText('清空会话')).toBeInTheDocument();
      expect(screen.getByText('开始与常驻大脑对话')).toBeInTheDocument();
      expect(screen.getByText('查询系统当前全景健康度与运行态势')).toBeInTheDocument();
    });
  });

  it('renders conversation messages, inference badges, and memory recall capsules', async () => {
    const mockMessages = [
      {
        role: 'user',
        content: '请检查当前集群状态',
        timestamp: '2026-10-19T00:00:00Z',
      },
      {
        role: 'assistant',
        content: '双机算力集群感知正常，MBP 与 MacMini 哨兵探针活性良好。',
        timestamp: '2026-10-19T00:00:01Z',
        metadata: {
          target_node: 'local-mac',
          model_used: 'qwen2.5:32b',
          latency_ms: 18.5,
          tier: 'tier2_dialog',
          fallback_used: false,
          recalled_memories: [
            {
              id: 'pref-git',
              domain: 'git',
              directive: '主工作区物理只读，交付在隔离 worktree 中完成',
            },
          ],
          recalled_pitfalls: [
            {
              id: 'pitfall-worktree',
              title: '工作树隔离',
              rule: '严禁直接 commit 到主仓',
            },
          ],
          react_tools_used: ['probe_system_health'],
        },
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/resident/chat/history')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              session_id: 'default',
              messages: mockMessages,
            }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      })
    );

    render(<ResidentChatPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('请检查当前集群状态')).toBeInTheDocument();
      expect(screen.getByText(/双机算力集群感知正常/)).toBeInTheDocument();
      expect(screen.getByText('local-mac')).toBeInTheDocument();
      expect(screen.getByText('18.5ms')).toBeInTheDocument();
      expect(screen.getByText(/记忆注水 \(1项偏好 · 1项避坑 · 1项探针\)/)).toBeInTheDocument();
    });

    // 点击折叠胶囊展开详情
    const capsuleBtn = screen.getByText(/记忆注水/);
    fireEvent.click(capsuleBtn);

    await waitFor(() => {
      expect(screen.getByText(/情境化长效工程偏好/)).toBeInTheDocument();
      expect(screen.getByText(/主工作区物理只读，交付在隔离 worktree 中完成/)).toBeInTheDocument();
      expect(screen.getByText(/主权避坑与防御约束/)).toBeInTheDocument();
      expect(screen.getByText(/严禁直接 commit 到主仓/)).toBeInTheDocument();
      expect(screen.getByText('probe_system_health()')).toBeInTheDocument();
    });
  });

  it('triggers send mutation when clicking quick prompt or enter', async () => {
    let sentPayload: any = null;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url.includes('/api/resident/chat/history')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              ok: true,
              session_id: 'default',
              messages: [],
            }),
          });
        }
        if (url === '/api/resident/chat') {
          if (opts?.body) {
            sentPayload = JSON.parse(opts.body);
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              ok: true,
              message: {
                role: 'assistant',
                content: '收到快捷探查指令',
                timestamp: '2026-10-19T00:00:02Z',
                metadata: { target_node: 'local-mac' },
              },
            }),
          });
        }
        return Promise.reject(new Error(`Unknown url: ${url}`));
      })
    );

    render(<ResidentChatPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('查询系统当前全景健康度与运行态势')).toBeInTheDocument();
    });

    const quickBtn = screen.getByText('查询系统当前全景健康度与运行态势');
    fireEvent.click(quickBtn);

    await waitFor(() => {
      expect(sentPayload).not.toBeNull();
      expect(sentPayload.prompt).toBe('查询系统当前全景健康度与运行态势');
      expect(sentPayload.session_id).toBe('default');
    });
  });

  it('triggers clear history mutation when clicking clear button', async () => {
    let deleteCalled = false;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url.includes('/api/resident/chat/history') && opts?.method === 'DELETE') {
          deleteCalled = true;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({ ok: true, session_id: 'default', cleared: true }),
          });
        }
        if (url.includes('/api/resident/chat/history')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              ok: true,
              session_id: 'default',
              messages: [{ role: 'user', content: 'test message', timestamp: '2026-10-19T00:00:00Z' }],
            }),
          });
        }
        return Promise.reject(new Error(`Unknown url: ${url}`));
      })
    );

    render(<ResidentChatPanel />, { wrapper: createWrapper() });

    // 等待已有消息加载完成，此时清空按钮不再 disabled
    await waitFor(() => {
      expect(screen.getByText('test message')).toBeInTheDocument();
    });

    const clearBtn = screen.getByText('清空会话');
    expect(clearBtn).not.toBeDisabled();
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });
});
