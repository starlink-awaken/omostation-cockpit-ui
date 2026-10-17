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
  Radio,
  Layers,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';

export interface SwarmNode {
  id: string;
  hostname: string;
  role: 'flagship' | 'sentinel' | 'worker' | string;
  status: 'online' | 'standby' | 'offline' | string;
  inference_port?: number;
  tailnet_ip?: string;
  gpu_vram?: string;
  unified_memory?: string;
  supported_tiers?: string[];
  priority?: number;
}

export interface ClusterSummary {
  total_nodes: number;
  online_nodes: number;
  flagship_online: boolean;
  offload_ready: boolean;
}

interface LegacyNodeSpecs {
  unified_memory: string;
  gpu_vram_limit?: string;
  status: string;
  inference_port?: number;
  tailnet_ip?: string;
}

export interface SwarmData {
  ok: boolean;
  nodes?: SwarmNode[];
  cluster_summary?: ClusterSummary;
  mbp_flagship?: LegacyNodeSpecs;
  macmini_sentinel?: LegacyNodeSpecs;
  router_policy?: string;
}

function getNodeRoleBadge(role: string) {
  switch (role.toLowerCase()) {
    case 'flagship':
      return {
        label: '主旗舰机 (Flagship)',
        color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800',
        icon: Server,
      };
    case 'sentinel':
      return {
        label: '边缘哨兵 (Sentinel)',
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
        icon: Network,
      };
    default:
      return {
        label: `计算节点 (${role})`,
        color: 'text-sky-400 bg-sky-950/80 border-sky-800',
        icon: Cpu,
      };
  }
}

function formatTierBadge(tier: string) {
  switch (tier) {
    case 'tier3_deep_reasoning':
      return { label: 'T3 深度思考', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
    case 'tier2_standard':
      return { label: 'T2 标准推理', color: 'bg-blue-950 text-blue-300 border-blue-800' };
    case 'tier1_inspection':
      return { label: 'T1 轻量巡检', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
    default:
      return { label: tier, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
}

function getNodeDisplayName(node: SwarmNode) {
  if (node.id === 'local-mac' || node.hostname?.toLowerCase().includes('mbp')) {
    return 'MBP Flagship (主旗舰机)';
  }
  if (node.id === 'macmini' || node.hostname?.toLowerCase().includes('macmini')) {
    return 'MacMini Sentinel (边缘哨兵机)';
  }
  return `${node.hostname || node.id}`;
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

  // 动态多节点适配（支持未来任意新加入节点，优雅向下兼容双机配置）
  const nodes: SwarmNode[] =
    data?.nodes && data.nodes.length > 0
      ? data.nodes
      : [
          {
            id: 'local-mac',
            hostname: 'mbp.local',
            role: 'flagship',
            status: data?.mbp_flagship?.status || 'online',
            inference_port: data?.mbp_flagship?.inference_port || 1234,
            unified_memory: data?.mbp_flagship?.unified_memory || '128.0 GB',
            gpu_vram: data?.mbp_flagship?.gpu_vram_limit || '112.0 GB',
            supported_tiers: ['tier3_deep_reasoning', 'tier2_standard', 'tier1_inspection'],
            priority: 100,
          },
          {
            id: 'macmini',
            hostname: 'macmini-m4.local',
            role: 'sentinel',
            status: data?.macmini_sentinel?.status || 'standby',
            tailnet_ip: data?.macmini_sentinel?.tailnet_ip || '100.64.110.118',
            inference_port: data?.macmini_sentinel?.inference_port || 11434,
            unified_memory: data?.macmini_sentinel?.unified_memory || '24.0 GB',
            supported_tiers: ['tier1_inspection'],
            priority: 50,
          },
        ];

  const summary = data?.cluster_summary || {
    total_nodes: nodes.length,
    online_nodes: nodes.filter((n) => n.status === 'online').length,
    flagship_online: nodes.some((n) => n.role === 'flagship' && n.status === 'online'),
    offload_ready: nodes.some((n) => n.role === 'sentinel' && n.status === 'online'),
  };

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            异构多机双机物理算力集群与拓扑网 (Dynamic Swarm Compute Mesh)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            以 SSOT 注册表动态发现拓扑。支持本地 MBP、边缘 MacMini 及未来新节点即插即用与自动卸载切流。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            status={summary.online_nodes > 0 ? 'running' : 'failed'}
            label={`${summary.online_nodes} / ${summary.total_nodes} 节点在线`}
          />
          {summary.offload_ready ? (
            <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              边缘卸载就绪
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              本地降级保留
            </span>
          )}
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

      {/* 动态物理机卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => {
          const roleBadge = getNodeRoleBadge(node.role);
          const RoleIcon = roleBadge.icon;
          const isOnline = node.status === 'online';
          const displayName = getNodeDisplayName(node);

          return (
            <div
              key={node.id}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <RoleIcon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {displayName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {node.id} · 优先级 {node.priority ?? 50}
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    status={isOnline ? 'running' : node.status === 'standby' ? 'waiting' : 'failed'}
                    label={node.status.toUpperCase()}
                  />
                </div>

                <div className="mt-2.5 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${roleBadge.color}`}
                  >
                    {roleBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">统一物理内存</span>
                    <span className="text-xs font-bold text-slate-100 font-mono mt-0.5 block">
                      {node.unified_memory || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">
                      {node.gpu_vram ? 'GPU 显存水位' : 'Tailnet IP'}
                    </span>
                    <span className="text-xs font-bold text-indigo-400 font-mono mt-0.5 block truncate">
                      {node.gpu_vram || node.tailnet_ip || 'Localhost'}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px] space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">服务端口:</span>
                    <span className="text-emerald-400">
                      {node.inference_port ? `:${node.inference_port}` : '未配置'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">网络域:</span>
                    <span className="text-slate-300">
                      {node.tailnet_ip ? 'Tailscale Mesh' : 'Local Loopback'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 支持的任务阶梯 */}
              {node.supported_tiers && node.supported_tiers.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block mb-1.5 font-sans">
                    可卸载任务阶梯:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {node.supported_tiers.map((tier) => {
                      const t = formatTierBadge(tier);
                      return (
                        <span
                          key={tier}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${t.color}`}
                        >
                          {t.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 算力阶梯与自适应策略说明卡片 */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-xs space-y-2">
        <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          全链自适应阶梯分派策略 (Adaptive Compute Tiering)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] pt-1">
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-indigo-400 font-bold block mb-0.5">Tier 3: 本地 27B 深度思考</span>
            <span className="text-slate-400">复杂架构研判、深层逻辑推理，锁定旗舰主机保持绝对可控</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-0.5">Tier 1: 边缘哨兵/新节点卸载</span>
            <span className="text-slate-400">巡检探针、死链扫描、AST 轻量校验优先卸载至边缘机或新加入算力节点</span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
            <span className="text-amber-400 font-bold block mb-0.5">自愈降级: 0 宕机回退</span>
            <span className="text-slate-400">当边缘节点离线或网络抖动时，秒级无缝降级回退至本地，业务无感知</span>
          </div>
        </div>
      </div>
    </div>
  );
}
