import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Flame,
  AlertTriangle,
  FileText,
  Clock,
  RotateCw,
  Sparkles,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';

interface PitfallRule {
  id: string;
  title: string;
  domain: string;
  severity: string;
  pattern: string;
  remedy: string;
  status?: 'active' | 'shadow' | string;
  source_file?: string;
}

interface InterceptEvent {
  timestamp: string;
  rule_id: string;
  component: string;
  detail: string;
  status: string;
}

interface PitfallsData {
  ok: boolean;
  total_rules: number;
  rules: PitfallRule[];
  guard_status: string;
  recent_intercepts: InterceptEvent[];
}

interface DistillResponse {
  ok: boolean;
  distilled: boolean;
  rule?: PitfallRule;
  message?: string;
}

export default function PitfallRadarPanel() {
  const queryClient = useQueryClient();
  const [showDistillForm, setShowDistillForm] = useState(false);
  const [errorLog, setErrorLog] = useState('');
  const [diffText, setDiffText] = useState('');
  const [distillMsg, setDistillMsg] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['resident-pitfalls'],
    queryFn: async () => {
      const res = await apiFetch<PitfallsData>('/api/resident/pitfalls');
      return res.ok && res.data ? res.data : null;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const distillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost<DistillResponse>('/api/resident/pitfalls/distill', {
        error_log: errorLog,
        diff_text: diffText,
        save: true,
      });
      if (!res.ok) throw new Error(res.error || '自蒸馏提取失败');
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.distilled && data.rule) {
        setDistillMsg(`已成功萃取并热加载新规则: ${data.rule.title} [${data.rule.status?.toUpperCase()}]`);
        setErrorLog('');
        setDiffText('');
        queryClient.invalidateQueries({ queryKey: ['resident-pitfalls'] });
      } else {
        setDistillMsg(data?.message || '未能识别出明确的 Anti-pattern 规则');
      }
    },
    onError: (err: Error) => {
      setDistillMsg(`自蒸馏错误: ${err.message}`);
    },
  });

  if (isLoading) {
    return <SkeletonLines count={5} />;
  }

  const rules = data?.rules || [];
  const intercepts = data?.recent_intercepts || [];

  return (
    <div className="space-y-6">
      {/* 头部守护状态 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            主权记忆主动反哺 · 踩坑信念雷达 (Pitfall Radar)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            由历史踩坑记忆与现场故障反向自蒸馏。ACTIVE 规则静态阻断，SHADOW 规则仅记录告警。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            status={data?.guard_status === 'ACTIVE' ? 'running' : 'failed'}
            label={`守卫状态: ${data?.guard_status || 'ACTIVE'}`}
          />
          <button
            onClick={() => setShowDistillForm(!showDistillForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium rounded transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showDistillForm ? '收起自蒸馏器' : '踩坑自蒸馏提取'}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="刷新规则"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 踩坑自蒸馏表单抽屉 */}
      {showDistillForm && (
        <div className="p-4 bg-slate-900/90 border border-indigo-900/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              现场报错补丁自蒸馏 (Distill Anti-pattern from Diff)
            </h4>
            <span className="text-[10px] text-slate-400">
              自动识别确定性特征（硬拦截）与模糊特征（影子告警）
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                报错日志或故障描述 (Error Log / Issue Context):
              </label>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="例如: error: edgesout npm install failed: cannot find package..."
                className="w-full h-20 p-2 bg-slate-950 border border-slate-800 rounded font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                修复补丁代码 (Git Diff Text):
              </label>
              <textarea
                value={diffText}
                onChange={(e) => setDiffText(e.target.value)}
                placeholder="例如: - npm install&#10;+ bun install"
                className="w-full h-20 p-2 bg-slate-950 border border-slate-800 rounded font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {distillMsg ? (
              <span className="text-xs text-indigo-300 font-mono">{distillMsg}</span>
            ) : (
              <span className="text-[11px] text-slate-500">提炼出的规则将存入 .omo/state/memory/pitfalls/ 并即时生效</span>
            )}
            <button
              onClick={() => distillMutation.mutate()}
              disabled={distillMutation.isPending || (!errorLog && !diffText)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {distillMutation.isPending ? '正在萃取规则...' : '开始自蒸馏'}
            </button>
          </div>
        </div>
      )}

      {/* 核心踩坑规则卡片流 */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          生效中的高优先级踩坑信念库 (Top Guarded Beliefs)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const isShadow = rule.status === 'shadow';

            return (
              <div
                key={rule.id}
                className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    {rule.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isShadow
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isShadow ? 'SHADOW 预警' : 'ACTIVE 拦截'}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        rule.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80 font-mono text-[11px] text-rose-300/90">
                    <span className="text-slate-500 select-none">❌ 禁忌: </span>
                    {rule.pattern}
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80 font-mono text-[11px] text-emerald-300/90">
                    <span className="text-slate-500 select-none">✅ 建议: </span>
                    {rule.remedy}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-slate-500">规则域: {rule.domain}</span>
                  <span className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                    <FileText className="w-3 h-3" />
                    SSOT: {rule.source_file || 'AGENTS.md'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 静态守卫现场拦截动态流 */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          最近守卫拦截动态 (Recent Intercept Stream)
        </h4>

        {intercepts.length === 0 ? (
          <p className="text-xs text-slate-500">暂无阻断事件，系统运转良好</p>
        ) : (
          <div className="space-y-2">
            {intercepts.map((evt, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-mono text-slate-200 block">
                      {evt.component}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {evt.detail}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 block">
                    {evt.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {evt.timestamp.split('T')[1]?.replace('Z', '') || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
