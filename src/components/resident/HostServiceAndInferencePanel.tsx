import React, { useState } from 'react';
import {
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Cpu,
  Terminal,
  Activity,
  Server,
  Send,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';
import { SkeletonLines } from '../ui/LoadingSkeleton';

export interface ServiceDaemonState {
  installed: boolean;
  label?: string;
  launchd_running: boolean;
  pid?: number | null;
  state?: {
    status?: string;
    last_job?: string;
    last_status?: string;
    last_run_at?: string;
    jobs_completed?: number;
    heartbeat?: string;
    [key: string]: unknown;
  };
  recent_log?: string;
}

export interface NodeMetric {
  requests: number;
  fallbacks: number;
  avg_latency_ms: number;
  last_used_at?: string;
}

export interface InferenceMetrics {
  total_requests: number;
  fallback_count: number;
  nodes: Record<string, NodeMetric>;
  updated_at?: string;
}

export interface InferResult {
  ok: boolean;
  content: string;
  target_node: string;
  target_host: string;
  target_port: number;
  tier: string;
  fallback_used: boolean;
  latency_ms: number;
  model_used: string;
  error?: string;
}

export default function HostServiceAndInferencePanel() {
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // 推断测试交互状态
  const [inferPrompt, setInferPrompt] = useState('请感知当前代码基线与多机算力拓扑健康度');
  const [selectedTier, setSelectedTier] = useState('tier1_inspection');
  const [inferResult, setInferResult] = useState<InferResult | null>(null);
  const [isInferring, setIsInferring] = useState(false);

  // 1. 查询守护进程状态
  const {
    data: serviceData,
    isLoading: isServiceLoading,
    refetch: refetchService,
  } = useQuery({
    queryKey: ['resident-service-status'],
    queryFn: async () => {
      const resp = await apiFetch<{ ok: boolean; service: ServiceDaemonState }>('/api/resident/service/status');
      return resp.data;
    },
    refetchInterval: 10000,
  });

  // 2. 查询推断指标
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['resident-compute-metrics'],
    queryFn: async () => {
      const resp = await apiFetch<{ ok: boolean; metrics: InferenceMetrics }>('/api/resident/compute/metrics');
      return resp.data;
    },
    refetchInterval: 10000,
  });

  // 触发指定守护任务
  const handleTriggerJob = async (jobName: 'patrol' | 'night' | 'briefing') => {
    setIsTriggering(true);
    setTriggerStatus(`正在派生执行 [${jobName}]...`);
    try {
      const res = await apiPost<{ ok: boolean; job: string; result: unknown }>('/api/resident/service/trigger', {
        job: jobName,
      });
      if (res.ok) {
        setTriggerStatus(`✅ 任务 [${jobName}] 演练触发成功并已完成记录`);
        refetchService();
      } else {
        setTriggerStatus(`❌ 触发任务 [${jobName}] 失败`);
      }
    } catch {
      setTriggerStatus('❌ 网络请求失败');
    } finally {
      setIsTriggering(false);
      setTimeout(() => setTriggerStatus(null), 5000);
    }
  };

  // 执行异构推断请求测试
  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inferPrompt.trim()) return;

    setIsInferring(true);
    setInferResult(null);
    try {
      const res = await apiPost<InferResult>('/api/resident/infer', {
        tier: selectedTier,
        prompt: inferPrompt,
        timeout: 2.0,
      });
      if (res.ok && res.data) {
        setInferResult(res.data);
        refetchMetrics();
      } else {
        setInferResult({
          ok: false,
          content: '请求失败或后端超时熔断',
          target_node: 'local-mac',
          target_host: '127.0.0.1',
          target_port: 1234,
          tier: selectedTier,
          fallback_used: true,
          latency_ms: 2000,
          model_used: 'fallback',
          error: res.error || 'Gateway Timeout',
        });
      }
    } catch (err: unknown) {
      setInferResult({
        ok: false,
        content: `客户端异常: ${String(err)}`,
        target_node: 'local-mac',
        target_host: '127.0.0.1',
        target_port: 1234,
        tier: selectedTier,
        fallback_used: true,
        latency_ms: 0,
        model_used: 'none',
      });
    } finally {
      setIsInferring(false);
    }
  };

  if (isServiceLoading && isMetricsLoading) {
    return <SkeletonLines count={5} />;
  }

  const service = serviceData?.service || {
    installed: false,
    launchd_running: false,
    pid: null,
    state: {},
    recent_log: '',
  };

  const metrics: InferenceMetrics = metricsData?.metrics || {
    total_requests: 0,
    fallback_count: 0,
    nodes: {},
  };

  return (
    <div className="space-y-6">
      {/* 1. 操作系统宿主守护进程 (LaunchAgent) 控制卡片 */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                操作系统原生宿主守护 (LaunchAgent Daemon)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  com.omostation.resident-agent
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                双模混合守护：轻量常驻进程维持心跳与日间 30m 巡航，凌晨 03:00 派生隔离子进程进行深度夜巡自愈。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge
              status={service.launchd_running ? 'running' : service.installed ? 'warning' : 'failed'}
              label={
                service.launchd_running
                  ? `守护中 (PID: ${service.pid || 'Active'})`
                  : service.installed
                  ? '已配置 (未激活)'
                  : '未安装'
              }
            />
            <button
              onClick={() => refetchService()}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded transition-colors"
              title="刷新守护状态"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 守护元数据矩阵 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
            <div className="text-slate-400 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              当前调度状态
            </div>
            <div className="font-mono text-slate-200 capitalize">
              {service.state?.status || (service.launchd_running ? 'running' : 'idle')}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
            <div className="text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              最近调度任务
            </div>
            <div className="font-mono text-slate-200">
              {service.state?.last_job ? `${service.state.last_job} (${service.state.last_status || 'ok'})` : '巡检就绪'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
            <div className="text-slate-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              累计完成轮次
            </div>
            <div className="font-mono text-slate-200">
              {service.state?.jobs_completed !== undefined ? `${service.state.jobs_completed} 轮` : '待统计'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
            <div className="text-slate-400 mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              心跳同步
            </div>
            <div className="font-mono text-slate-200 truncate" title={service.state?.heartbeat || '正常'}>
              {service.state?.heartbeat ? service.state.heartbeat.split('T')[1]?.slice(0, 8) || 'Active' : 'Live'}
            </div>
          </div>
        </div>

        {/* 手动演练触发按钮组 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">即时演练触发:</span>
            <button
              onClick={() => handleTriggerJob('patrol')}
              disabled={isTriggering}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3 text-indigo-400" />
              日巡 (Patrol)
            </button>
            <button
              onClick={() => handleTriggerJob('night')}
              disabled={isTriggering}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              隔离夜巡 (Night)
            </button>
            <button
              onClick={() => handleTriggerJob('briefing')}
              disabled={isTriggering}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              晨报投递 (Briefing)
            </button>
          </div>

          {triggerStatus && (
            <span className="text-xs text-indigo-300 font-medium animate-pulse">{triggerStatus}</span>
          )}
        </div>

        {/* 日志截取输出 */}
        {service.recent_log && (
          <div className="mt-3">
            <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1 font-mono">
              <Terminal className="w-3 h-3" />
              守护日志末尾 (resident-daemon.log):
            </div>
            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-32">
              {service.recent_log}
            </pre>
          </div>
        )}
      </div>

      {/* 2. 跨机算力推断网关与实时联调终端 */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                异构多机真实推断网关与切流指标 (Swarm Inference Gateway)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持 OpenAI `/v1` 与 Ollama 原生协议自动协商，2.0s 超时快速熔断透明降级回本地旗舰机。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
              总请求: {metrics.total_requests}
            </span>
            <span className="text-xs font-mono text-amber-300 px-2 py-0.5 bg-amber-950/60 rounded border border-amber-800">
              降级数: {metrics.fallback_count}
            </span>
            <button
              onClick={() => refetchMetrics()}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded transition-colors"
              title="刷新指标"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 节点流量与延迟分布 */}
        {Object.keys(metrics.nodes).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(metrics.nodes).map(([nodeId, stat]) => (
              <div key={nodeId} className="bg-slate-950/60 border border-slate-800/60 rounded p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono font-medium text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    {nodeId}
                  </span>
                  <span className="text-emerald-400">{stat.avg_latency_ms} ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>调用次数: {stat.requests}</span>
                  <span>降级次数: {stat.fallbacks}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-800/40 text-center">
            推断网关已挂载就绪，暂无历史外部请求记录，请通过下方终端执行首次联调试调。
          </div>
        )}

        {/* 实时推断联调测试控制台 */}
        <form onSubmit={handleRunInference} className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              跨机真实推断实时试调终端 (Inference Console)
            </span>

            {/* Tier 选择器 */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">分派梯队:</span>
              <button
                type="button"
                onClick={() => setSelectedTier('tier1_inspection')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  selectedTier === 'tier1_inspection'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Tier 1 边缘哨兵
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier('tier2_reasoning')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  selectedTier === 'tier2_reasoning'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Tier 2 旗舰推理
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier('tier3_heavy')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  selectedTier === 'tier3_heavy'
                    ? 'bg-purple-950 text-purple-300 border-purple-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Tier 3 深度重算
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inferPrompt}
              onChange={(e) => setInferPrompt(e.target.value)}
              placeholder="输入 Prompt 发送跨机智能推断..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isInferring || !inferPrompt.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {isInferring ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {isInferring ? '路由推断中...' : '发送推断请求'}
            </button>
          </div>
        </form>

        {/* 推断结果呈现 */}
        {inferResult && (
          <div className="p-3.5 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">目标路由:</span>
                <span className="text-indigo-400 font-semibold">{inferResult.target_node}</span>
                <span className="text-slate-500">
                  ({inferResult.target_host}:{inferResult.target_port})
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {inferResult.model_used}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">{inferResult.latency_ms} ms</span>
                {inferResult.fallback_used && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    透明降级
                  </span>
                )}
              </div>
            </div>

            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed pt-1">
              {inferResult.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
