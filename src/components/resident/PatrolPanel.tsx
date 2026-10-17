import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Zap,
  Play,
  ArrowUpRight,
  Clock,
  CheckSquare,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';

interface PatrolFinding {
  component: string;
  issue: string;
  risk_tier: 'R0' | 'R1' | string;
  remediation_action?: string | null;
  detail: string;
}

interface RemediationRecord {
  action_id: string;
  executed_at: string;
  status: string;
}

interface EscalatedTask {
  component: string;
  issue: string;
  detail: string;
}

interface PatrolReport {
  ok: boolean;
  health: 'healthy' | 'warning' | 'degraded' | string;
  findings: PatrolFinding[];
  remediations_executed: RemediationRecord[];
  escalated_tasks: EscalatedTask[];
  scan_duration_ms: number;
}

export default function PatrolPanel() {
  const queryClient = useQueryClient();
  const [autoRemediate, setAutoRemediate] = useState(true);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['resident-patrol'],
    queryFn: async () => {
      const res = await apiFetch<PatrolReport>('/api/resident/patrol');
      return res.ok && res.data ? res.data : null;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const patrolMutation = useMutation({
    mutationFn: async (remediate: boolean) => {
      const res = await apiPost<PatrolReport>('/api/resident/patrol', {
        auto_remediate: remediate,
      });
      if (!res.ok) throw new Error(res.error || '巡检执行失败');
      return res.data;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['resident-patrol'], newData);
    },
  });

  if (isLoading) {
    return <SkeletonLines count={5} />;
  }

  const report = data || {
    ok: true,
    health: 'healthy',
    findings: [],
    remediations_executed: [],
    escalated_tasks: [],
    scan_duration_ms: 8.5,
  };

  const isHealthy = report.health === 'healthy';
  const isDegraded = report.health === 'degraded';

  return (
    <div className="space-y-6">
      {/* 头部状态条 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            自治主动巡检与静默自愈机器人 (Autonomous Patrol & Self-Healing)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            周期执行低开销只读探针 (单轮 &lt;500ms)。R0 级轻微漂移沙箱静默修复，R1 级工程断链自动升级工单。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            status={isHealthy ? 'running' : isDegraded ? 'failed' : 'waiting'}
            label={`健康状态: ${report.health.toUpperCase()}`}
          />
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            耗时: {report.scan_duration_ms.toFixed(1)}ms
          </span>
          <button
            onClick={() => patrolMutation.mutate(autoRemediate)}
            disabled={patrolMutation.isPending || isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${patrolMutation.isPending || isFetching ? 'animate-spin' : ''}`}
            />
            {patrolMutation.isPending ? '正在巡检...' : '立刻触发巡检'}
          </button>
        </div>
      </div>

      {/* 巡检策略控制卡片 */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>R0 级安全沙箱静默自愈:</span>
          <span className="text-slate-400">
            {autoRemediate ? '已启用 (投影租约超时/SSOT 状态脱落自动物化修复)' : '已暂停 (仅探针报警)'}
          </span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={autoRemediate}
            onChange={(e) => setAutoRemediate(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
          />
          <span>开启 R0 自动自愈</span>
        </label>
      </div>

      {/* 探针发现问题流 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          当前巡检发现 (Active Findings)
        </h4>

        {report.findings.length === 0 ? (
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg flex items-center gap-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>所有探针（全景投影租约、SSOT 运行态状态、异构算力集群存活）均正常无漂移。</span>
          </div>
        ) : (
          <div className="space-y-2">
            {report.findings.map((f, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        f.risk_tier === 'R0'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {f.risk_tier}
                    </span>
                    <span className="font-semibold text-slate-200">{f.issue}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{f.component}]</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.detail}</p>
                </div>
                {f.remediation_action && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    自愈动作: {f.remediation_action}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 双栏历史与工单卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* R0 自愈记录 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            最近自愈执行历史 (Executed Remediations)
          </h4>
          {report.remediations_executed.length === 0 ? (
            <p className="text-xs text-slate-500">本周期内无自愈触发，系统保持稳态</p>
          ) : (
            <div className="space-y-2">
              {report.remediations_executed.map((rem, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-950 rounded border border-slate-800/80 text-xs flex items-center justify-between"
                >
                  <span className="font-mono text-slate-300">{rem.action_id}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{rem.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* R1 工单升级 */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            已升级待办工单 (Escalated Tasks)
          </h4>
          {report.escalated_tasks.length === 0 ? (
            <p className="text-xs text-slate-500">暂无工程级风险工单升级</p>
          ) : (
            <div className="space-y-2">
              {report.escalated_tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-950 rounded border border-rose-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-rose-300 font-semibold">
                    <span>{task.issue}</span>
                    <span className="text-[10px] font-mono text-slate-500">[{task.component}]</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{task.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
