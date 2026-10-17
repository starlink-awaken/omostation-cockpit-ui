import React from 'react';
import {
  Cpu,
  Server,
  Zap,
  Activity,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Network,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';

interface NodeSpecs {
  unified_memory: string;
  gpu_vram_limit?: string;
  status: string;
  inference_port?: number;
  tailnet_ip?: string;
  role?: string;
}

interface SwarmData {
  ok: boolean;
  mbp_flagship: NodeSpecs;
  macmini_sentinel: NodeSpecs;
  router_policy?: string;
}

export default function SwarmClusterPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['resident-swarm'],
    queryFn: async () => {
      const res = await apiFetch<SwarmData>('/api/resident/swarm');
      return res.ok && res.data ? res.data : null;
    },
    staleTime: 15000,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return <SkeletonLines count={4} />;
  }

  const mbp = data?.mbp_flagship || {
    unified_memory: '128.0 GB',
    gpu_vram_limit: '112.0 GB',
    status: 'online',
    inference_port: 1234,
  };

  const mini = data?.macmini_sentinel || {
    unified_memory: '24.0 GB',
    status: 'standby',
    tailnet_ip: '100.64.110.118',
    inference_port: 11434,
  };

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            双机物理算力集群与拓扑 (Dual-Machine Swarm Fabric)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            动态调度 MBP (128GB/27B 思考机) 与 MacMini (24GB/9B 哨兵机)。全本地免 API 费用运行。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status="running" label="异构双机在线" />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="刷新拓扑"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 双物理机卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MBP 旗舰机卡片 */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  MBP Flagship (主旗舰机)
                </h4>
                <span className="text-[10px] text-slate-400">Apple M3 Max · 本地主机</span>
              </div>
            </div>
            <StatusBadge status="running" label="ONLINE" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">统一物理内存</span>
              <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
                {mbp.unified_memory}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">GPU 显存安全水位</span>
              <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">
                {mbp.gpu_vram_limit || '112.0 GB'}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-xs space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">推理服务:</span>
              <span className="text-emerald-400">LM Studio (:1234)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">运行模型:</span>
              <span className="text-indigo-300">Qwen-27B 深度思考</span>
            </div>
          </div>
        </div>

        {/* MacMini 哨兵机卡片 */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  MacMini Sentinel (边缘哨兵机)
                </h4>
                <span className="text-[10px] text-slate-400">Apple M2 · Tailscale 远端</span>
              </div>
            </div>
            <StatusBadge
              status={mini.status === 'online' ? 'running' : 'waiting'}
              label={mini.status.toUpperCase()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">统一物理内存</span>
              <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
                {mini.unified_memory}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">Tailnet 节点 IP</span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                {mini.tailnet_ip || '100.64.110.118'}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 text-xs space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">推理服务:</span>
              <span className="text-emerald-400">Ollama (:11434)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">运行模型:</span>
              <span className="text-indigo-300">Qwen-9B 快速巡检</span>
            </div>
          </div>
        </div>
      </div>

      {/* 算力阶梯与自适应策略说明卡片 */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-xs space-y-2">
        <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          全链自适应阶梯分派策略 (Adaptive Compute Tiering)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] pt-1">
          <div className="p-2 bg-slate-950 rounded border border-slate-800">
            <span className="text-indigo-400 font-bold block mb-0.5">Tier 1: 本地 27B 思考</span>
            <span className="text-slate-400">日常交互、架构研判、现场排障诊断，0 延迟 0 成本</span>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-0.5">Tier 2: 哨兵 9B 协同</span>
            <span className="text-slate-400">夜间巡检、死链扫描、轻量问答分流至 MacMini 从机</span>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-slate-800">
            <span className="text-amber-400 font-bold block mb-0.5">Tier 3: 云端旗舰升级</span>
            <span className="text-slate-400">超长上下文、复杂代码全量重构时自动无缝接力</span>
          </div>
        </div>
      </div>
    </div>
  );
}
