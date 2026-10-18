import React, { useState } from 'react';
import {
  Cpu,
  Server,
  Zap,
  RotateCw,
  Network,
  Radio,
  Layers,
  Plus,
  Trash2,
  Bell,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiPost, apiDelete } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';
import HostServiceAndInferencePanel from './HostServiceAndInferencePanel';

export interface SwarmNode {
  id: string;
  hostname?: string;
  name?: string;
  role: 'flagship' | 'sentinel' | 'accelerator' | 'worker' | string;
  status: 'online' | 'standby' | 'offline' | string;
  inference_port?: number;
  port?: number;
  tailnet_ip?: string;
  host?: string;
  gpu_vram?: string;
  vram_gb?: string;
  unified_memory?: string;
  memory_gb?: string;
  supported_tiers?: string[];
  priority?: number;
  source?: 'ssot' | 'dynamic' | string;
  description?: string;
}

export interface ClusterSummary {
  total_nodes: number;
  online_nodes: number;
  flagship_online: boolean;
  offload_ready: boolean;
  cluster_vram_gb?: string;
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
  topology?: {
    nodes?: SwarmNode[];
    online_nodes?: number;
    total_nodes?: number;
    cluster_vram_gb?: string;
  };
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
    case 'accelerator':
      return {
        label: '加速工作站 (Accelerator)',
        color: 'text-purple-400 bg-purple-950/80 border-purple-800',
        icon: Zap,
      };
    default:
      return {
        label: `扩展节点 (${role})`,
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
    case 'tier2_code_gen':
      return { label: 'T2 标准/代码', color: 'bg-blue-950 text-blue-300 border-blue-800' };
    case 'tier1_inspection':
      return { label: 'T1 轻量巡检', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
    default:
      return { label: tier, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
}

function getNodeDisplayName(node: SwarmNode) {
  if (node.name) return node.name;
  if (node.id === 'local-mac' || node.hostname?.toLowerCase().includes('mbp')) {
    return 'MBP Flagship (主旗舰机)';
  }
  if (node.id === 'macmini' || node.hostname?.toLowerCase().includes('macmini')) {
    return 'MacMini Sentinel (边缘哨兵机)';
  }
  return `${node.hostname || node.id}`;
}

export default function SwarmClusterPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 接入新节点表单状态
  const [newNode, setNewNode] = useState({
    id: '',
    name: '',
    host: '100.64.110.',
    port: '11434',
    role: 'worker',
    memory_gb: '32.0',
    vram_gb: '16.0',
    description: '',
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['resident-swarm-and-nodes'],
    queryFn: async () => {
      // 优先请求综合节点 API
      const res = await apiFetch<SwarmData>('/api/resident/nodes');
      if (res.ok && res.data?.topology?.nodes) {
        return {
          ok: true,
          nodes: res.data.topology.nodes,
          cluster_summary: {
            total_nodes: res.data.topology.total_nodes || res.data.topology.nodes.length,
            online_nodes: res.data.topology.online_nodes || 0,
            flagship_online: res.data.topology.nodes.some((n) => n.role === 'flagship' && n.status === 'online'),
            offload_ready: res.data.topology.nodes.some((n) => n.role === 'sentinel' && n.status === 'online'),
            cluster_vram_gb: res.data.topology.cluster_vram_gb,
          },
        };
      }
      // 回退旧端点
      const legacyRes = await apiFetch<SwarmData>('/api/resident/swarm');
      return legacyRes.ok && legacyRes.data ? legacyRes.data : null;
    },
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const handleRegisterNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNode.id.trim() || !newNode.host.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiPost('/api/resident/nodes/register', {
        id: newNode.id.trim(),
        name: newNode.name.trim() || newNode.id.trim(),
        host: newNode.host.trim(),
        port: parseInt(newNode.port, 10) || 11434,
        role: newNode.role,
        memory_gb: parseFloat(newNode.memory_gb) || 16.0,
        vram_gb: parseFloat(newNode.vram_gb) || 0.0,
        description: newNode.description.trim() || '动态接入算力节点',
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewNode({
          id: '',
          name: '',
          host: '100.64.110.',
          port: '11434',
          role: 'worker',
          memory_gb: '32.0',
          vram_gb: '16.0',
          description: '',
        });
        refetch();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregisterNode = async (nodeId: string) => {
    if (!confirm(`确定要移除动态算力节点 ${nodeId} 吗？`)) return;
    const res = await apiDelete(`/api/resident/nodes/${nodeId}`);
    if (res.ok) {
      refetch();
    }
  };

  const handleSendTestNotification = async () => {
    setNotifyStatus('正在发送测试通知...');
    try {
      const res = await apiPost('/api/resident/notify/send', {
        level: 'P2_INFO',
        title: '🔔 驾驶舱通信通道体检',
        body: '多通道通信中枢运行平稳，macOS 系统弹窗与通道驱动就绪。',
        force_macos: true,
      });
      if (res.ok) {
        setNotifyStatus('✅ 通知已成功分发 (桌面已弹窗)');
        setTimeout(() => setNotifyStatus(null), 4000);
      } else {
        setNotifyStatus('❌ 发送失败');
      }
    } catch {
      setNotifyStatus('❌ 请求异常');
    }
  };

  if (isLoading) {
    return <SkeletonLines count={4} />;
  }

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
            source: 'ssot',
          },
          {
            id: 'macmini',
            hostname: 'macmini-m4.local',
            role: 'sentinel',
            status: data?.macmini_sentinel?.status || 'standby',
            tailnet_ip: data?.macmini_sentinel?.tailnet_ip || '100.64.110.118',
            inference_port: data?.macmini_sentinel?.inference_port || 11434,
            unified_memory: data?.macmini_sentinel?.unified_memory || '24.0 GB',
            gpu_vram: '20.0 GB',
            supported_tiers: ['tier1_inspection'],
            priority: 50,
            source: 'ssot',
          },
        ];

  const summary = data?.cluster_summary || {
    total_nodes: nodes.length,
    online_nodes: nodes.filter((n) => n.status === 'online').length,
    flagship_online: nodes.some((n) => n.role === 'flagship' && n.status === 'online'),
    offload_ready: nodes.some((n) => n.role === 'sentinel' && n.status === 'online'),
    cluster_vram_gb: '132.0 GB',
  };

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            可扩展异构多机双机物理算力集群与拓扑网 (Phase 8 Dynamic Mesh)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            支持本地 MBP、常驻哨兵 MacMini、高性能 PC 及未来任意新算力节点即插即用、持久化探活与秒级切流。
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusBadge
            status={summary.online_nodes > 0 ? 'running' : 'failed'}
            label={`${summary.online_nodes} / ${summary.total_nodes} 节点在线`}
          />
          {summary.cluster_vram_gb && (
            <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
              总可用显存: {summary.cluster_vram_gb}
            </span>
          )}
          {summary.offload_ready ? (
            <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              边缘卸载就绪
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              本地单机兜底
            </span>
          )}

          {/* 触发测试通知 */}
          <button
            onClick={handleSendTestNotification}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
            title="触发一次本地与通道测试通知"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            测试通知
          </button>

          {/* 接入新算力机 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            接入新节点
          </button>

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

      {notifyStatus && (
        <div className="p-2.5 text-xs rounded bg-slate-900 border border-indigo-900/60 text-indigo-300 flex items-center justify-between">
          <span>{notifyStatus}</span>
          <button onClick={() => setNotifyStatus(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 动态物理机卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => {
          const roleBadge = getNodeRoleBadge(node.role);
          const RoleIcon = roleBadge.icon;
          const isOnline = node.status === 'online';
          const displayName = getNodeDisplayName(node);
          const isDynamic = node.source === 'dynamic';

          return (
            <div
              key={node.id}
              className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <RoleIcon className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {displayName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {node.id} · 优先级 {node.priority ?? 50}
                        </span>
                        {isDynamic && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            动态接入
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={isOnline ? 'running' : node.status === 'standby' ? 'waiting' : 'failed'}
                      label={node.status.toUpperCase()}
                    />
                    {isDynamic && (
                      <button
                        onClick={() => handleUnregisterNode(node.id)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        title="移除此动态节点"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                      {node.memory_gb || node.unified_memory || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">
                      {node.vram_gb || node.gpu_vram ? 'GPU 显存水位' : '主机地址'}
                    </span>
                    <span className="text-xs font-bold text-indigo-400 font-mono mt-0.5 block truncate">
                      {node.vram_gb || node.gpu_vram || node.host || node.tailnet_ip || 'Localhost'}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px] space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">服务端口:</span>
                    <span className="text-emerald-400">
                      {node.inference_port || node.port ? `:${node.inference_port || node.port}` : '未配置'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">网络地址:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">
                      {node.host || node.tailnet_ip || '127.0.0.1'}
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

      {/* 操作系统宿主守护服务与推断网关实时终端 (Phase 9) */}
      <HostServiceAndInferencePanel />

      {/* 接入新节点弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                接入外部/未来新物理算力节点
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterNode} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">节点标识 ID (唯一)</label>
                <input
                  type="text"
                  required
                  placeholder="例如: mac-studio-m4, gpu-worker-02"
                  value={newNode.id}
                  onChange={(e) => setNewNode({ ...newNode, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">机器显示名称</label>
                <input
                  type="text"
                  placeholder="例如: Mac Studio M4 Max (128G)"
                  value={newNode.name}
                  onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">IP / Tailnet 地址</label>
                  <input
                    type="text"
                    required
                    value={newNode.host}
                    onChange={(e) => setNewNode({ ...newNode, host: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">推断服务端口</label>
                  <input
                    type="number"
                    required
                    value={newNode.port}
                    onChange={(e) => setNewNode({ ...newNode, port: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">总内存 (GB)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newNode.memory_gb}
                    onChange={(e) => setNewNode({ ...newNode, memory_gb: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">可用显存 VRAM (GB)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newNode.vram_gb}
                    onChange={(e) => setNewNode({ ...newNode, vram_gb: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">节点角色</label>
                <select
                  value={newNode.role}
                  onChange={(e) => setNewNode({ ...newNode, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="worker">普通计算节点 (Worker)</option>
                  <option value="accelerator">高性能加速机 (Accelerator)</option>
                  <option value="sentinel">轻量巡检哨兵 (Sentinel)</option>
                  <option value="flagship">备用主旗舰机 (Flagship)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors"
                >
                  {isSubmitting ? '注册并持久化中...' : '确认接入并探活'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
