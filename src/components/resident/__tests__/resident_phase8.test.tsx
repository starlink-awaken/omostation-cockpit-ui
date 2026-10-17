import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MorningBriefingCard from '../MorningBriefingCard';
import MemoryEvolutionPanel from '../MemoryEvolutionPanel';

describe('Phase 8: Long-term Autonomy & Memory Evolution Panels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders MorningBriefingCard and triggers simulated night patrol drill', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url === '/api/resident/morning-briefing') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              generated_at: '2026-10-18T08:30:00Z',
              greeting: '早安，夏明星。常驻首席参谋为您呈递今晨自主守护与运行简报。',
              yesterday_commits_count: 3,
              yesterday_summary: '昨日合入 3 次重要提交，全量门禁闭环。',
              night_defense_status: '✅ 夜间深度走查完成，代码基线稳定。',
              cluster_online_summary: '集群 2/3 节点在线（总可用显存: 132.0 GB）。',
              memory_growth_summary: '已沉淀 4 条专属指令偏好，6 条避坑守卫就绪。',
              top_action_items: [
                '保持隔离 worktree 交付纪律',
                '在 Cockpit 审阅最新避坑规则与记忆进化',
              ],
              health_score: 100,
            }),
          });
        }
        if (url === '/api/resident/night-patrol') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              morning_briefing_generated: true,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(<MorningBriefingCard />);

    // 检查问候与各关键域渲染
    await waitFor(() => {
      expect(screen.getByText(/晨间自治与系统运行简报/i)).toBeInTheDocument();
      expect(screen.getByText(/早安，夏明星/i)).toBeInTheDocument();
      expect(screen.getByText(/健康分 100/i)).toBeInTheDocument();
      expect(screen.getByText(/昨日合入 3 次重要提交/i)).toBeInTheDocument();
      expect(screen.getByText(/保持隔离 worktree 交付纪律/i)).toBeInTheDocument();
    });

    // 点击演练按钮
    const drillBtn = screen.getByText(/即刻演练夜巡与简报/i);
    fireEvent.click(drillBtn);

    await waitFor(() => {
      expect(screen.getByText(/夜巡演练执行完毕/i)).toBeInTheDocument();
    });
  });

  it('renders MemoryEvolutionPanel with crystallized preferences and triggers distillation drawer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url === '/api/resident/memory/distilled') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
              updated_at: '2026-10-18T08:00:00Z',
              preferences: [
                {
                  id: 'pref-lang-zh',
                  domain: 'language',
                  directive: '回复优先使用简体中文，英文标识符保持原样',
                  confidence: 1.0,
                  source: 'user_global_rule',
                  learned_at: '2026-10-17T12:00:00Z',
                },
                {
                  id: 'pref-git-wt',
                  domain: 'git',
                  directive: '主工作区只读，常规交付均在隔离 worktree 中完成',
                  confidence: 0.98,
                  source: 'governance_policy',
                  learned_at: '2026-10-17T12:00:00Z',
                },
              ],
              guardrail_count: 6,
              domain_learnings: [
                {
                  topic: '三位一体自治演进',
                  milestone: 'Phase 7 闭环',
                  insight: '解除双机硬编码约束，支持 N 机算力自适应切流与渲染。',
                },
              ],
              growth_metrics: {
                knowledge_nodes_linked: 15,
              },
            }),
          });
        }
        if (url === '/api/resident/memory/distill') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ok: true,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
      })
    );

    render(<MemoryEvolutionPanel />);

    // 检查偏好条目渲染
    await waitFor(() => {
      expect(screen.getByText(/跨会话认知自结晶与长效记忆资产/i)).toBeInTheDocument();
      expect(screen.getByText(/回复优先使用简体中文/i)).toBeInTheDocument();
      expect(screen.getByText(/主工作区只读/i)).toBeInTheDocument();
      expect(screen.getByText(/三位一体自治演进/i)).toBeInTheDocument();
    });

    // 点击展开提炼抽屉
    const addBtn = screen.getByText(/现场提炼新偏好/i);
    fireEvent.click(addBtn);

    const textarea = screen.getByPlaceholderText(/粘贴本轮对话记录/i);
    fireEvent.change(textarea, { target: { value: '注意：评测窗口内禁跑编译等CPU重活' } });

    const submitBtn = screen.getByText(/萃取并沉淀至长期记忆/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/会话偏好与认知已成功萃取并结晶持久化/i)).toBeInTheDocument();
    });
  });
});
