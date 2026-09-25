import React, { useState } from 'react';
import {
  Compass,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  Database,
  Workflow,
  CheckCircle2,
  Box,
} from 'lucide-react';
import { useSystemTopology } from '../../api/hooks/useGovernancePanorama';
import type { TopologyNode } from '../../api/types/panorama';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/common/Toast';

export function SystemTopologyWallboard() {
  const { topology, isLoading, isFallback, refetch } = useSystemTopology();
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      showToast('道法术器拓扑状态已更新，架构槽位合规', 'success');
    } catch {
      showToast('拓扑状态刷新失败，已使用快照', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getLayerColor = (layerId: string) => {
    switch (layerId.toLowerCase()) {
      case 'dao':
        return {
          bg: 'bg-purple-950/20',
          border: 'border-purple-500/30',
          badge: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
          title: 'text-purple-300',
        };
      case 'fa':
        return {
          bg: 'bg-amber-950/20',
          border: 'border-amber-500/30',
          badge: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
          title: 'text-amber-300',
        };
      case 'shu':
        return {
          bg: 'bg-cyan-950/20',
          border: 'border-cyan-500/30',
          badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
          title: 'text-cyan-300',
        };
      case 'qi':
      default:
        return {
          bg: 'bg-emerald-950/20',
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
          title: 'text-emerald-300',
        };
    }
  };

  const getNodeKindIcon = (kind: TopologyNode['kind']) => {
    switch (kind) {
      case 'service':
        return <Workflow className="w-3.5 h-3.5 text-cyan-400" />;
      case 'storage':
        return <Database className="w-3.5 h-3.5 text-purple-400" />;
      case 'contract':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
      case 'interface':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case 'compute':
      default:
        return <Cpu className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const layers = topology?.layers ?? [];
  const slots = topology?.slots ?? [];
  const activeSlot = slots.find((s) => s.status === 'ACTIVE') ?? slots[0];

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top Banner & Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#111827]/80 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              道法术器架构拓扑中枢
            </h2>
            {isFallback && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                静态容灾快照
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            DFSQ/v1 经典分层与主权计算图谱，唯一合规调度槽位驱动全域 Agent 协同
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            aria-label="刷新拓扑状态"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '更新中...' : '刷新拓扑'}
          </button>
        </div>
      </div>

      {/* Active S-Slot Highlight Banner */}
      {activeSlot && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
                  唯一合规 S 槽位 (Active Dispatcher)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  {activeSlot.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mt-0.5 font-mono">
                {activeSlot.id} &rarr; <span className="text-slate-400 font-normal">{activeSlot.component}</span>
              </h3>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 max-w-sm text-left sm:text-right">
            严禁挂载第二套分发器或第五类本体，所有调度均收敛于该核心节点。
          </div>
        </div>
      )}

      {/* 4 Layers Flow (Dao, Fa, Shu, Qi) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-label="Loading topology...">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layers.map((layer) => {
            const colors = getLayerColor(layer.id);
            return (
              <div
                key={layer.id}
                data-testid={`layer-card-${layer.id}`}
                className={`p-5 rounded-2xl ${colors.bg} border ${colors.border} flex flex-col justify-between backdrop-blur-md transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className={`text-base font-bold tracking-tight ${colors.title}`}>
                      {layer.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colors.badge}`}>
                      {layer.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {layer.description}
                  </p>

                  {/* Nodes in this layer */}
                  <div className="space-y-2">
                    {layer.nodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(isSelected ? null : node)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-slate-800/90 border-cyan-500 shadow-md'
                              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                              {getNodeKindIcon(node.kind)}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-200 truncate">
                                {node.label}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate">
                                {node.id}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-[10px] font-medium text-slate-400 uppercase">
                              {node.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>纳管节点: <strong className="text-slate-300 font-mono">{layer.nodes.length}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    契约守备中
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SystemTopologyWallboard;
