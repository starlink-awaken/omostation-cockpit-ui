import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Flame,
  AlertTriangle,
  FileText,
  Clock,
  RotateCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';

interface PitfallRule {
  id: string;
  title: string;
  domain: string;
  severity: string;
  pattern: string;
  remedy: string;
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

export default function PitfallRadarPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['resident-pitfalls'],
    queryFn: async () => {
      const res = await apiFetch<PitfallsData>('/api/resident/pitfalls');
      return res.ok && res.data ? res.data : null;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <SkeletonLines count={5} />;
  }

  const rules = data?.rules || [];
  const intercepts = data?.recent_intercepts || [];

  return (
    <div className="space-y-6">
      {/* 头部守护状态 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            主权记忆主动反哺 · 踩坑信念雷达 (Pitfall Radar)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            由 91 篇踩坑记忆逆向萃取。静态守卫在编译与提交前阻断裸变量切词、保留 Emoji 污染及 God-Module 膨胀。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            status={data?.guard_status === 'ACTIVE' ? 'running' : 'failed'}
            label={`守卫状态: ${data?.guard_status || 'ACTIVE'}`}
          />
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

      {/* 核心踩坑规则卡片流 */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          生效中的高优先级踩坑信念库 (Top Guarded Beliefs)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  {rule.title}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    rule.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {rule.severity}
                </span>
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
                <span className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer">
                  <FileText className="w-3 h-3" />
                  SSOT: {rule.source_file || 'AGENTS.md'}
                </span>
              </div>
            </div>
          ))}
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
