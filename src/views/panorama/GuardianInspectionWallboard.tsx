import { useState } from 'react';
import {
  Activity,
  Radio,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Zap,
  Server,
  Layers,
  Clock,
  Filter,
} from 'lucide-react';
import { useGuardianStatus } from '../../api/hooks/useGovernancePanorama';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/common/Toast';

export type AlertFilterLevel = 'all' | 'critical' | 'warn' | 'info';

function observationLabel(observedAt: string | null, ageMs: number | null): string {
  if (!observedAt || ageMs == null) return '观测时间 UNKNOWN';
  if (ageMs < 60_000) return `观测于 ${observedAt} · 不足 1 分钟前`;
  return `观测于 ${observedAt} · ${Math.floor(ageMs / 60_000)} 分钟前`;
}

export function GuardianInspectionWallboard() {
  const { guardian, isLoading, sourceState, sourceFailure, sourceObservedAt, sourceAgeMs, partialFacets, refetch } = useGuardianStatus();
  const { showToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertFilter, setAlertFilter] = useState<AlertFilterLevel>('all');
  const [activeTab, setActiveTab] = useState<'subsystems' | 'logs'>('subsystems');

  const handleTriggerInspection = async () => {
    setIsRefreshing(true);
    try {
      const result = await refetch();
      showToast(result.sourceState === 'LIVE' ? 'BFF 治理投影已刷新；请以观测时间与来源状态为准。' : `哨兵来源 ${result.sourceState}：${result.sourceFailure ?? '未获得可验证状态。'}`, result.sourceState === 'LIVE' ? 'success' : 'warning');
    } catch {
      showToast('巡检触发异常，系统维持保护模式', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSubsystemIcon = (id: string) => {
    switch (id) {
      case 'gate_guardian':
        return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
      case 'ledger_auditor':
        return <Terminal className="w-5 h-5 text-indigo-400" />;
      case 'bcos_engine':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'network_mesh':
      default:
        return <Server className="w-5 h-5 text-emerald-400" />;
    }
  };

  const subsystems = guardian?.subsystems ?? [];
  const alerts = guardian?.alerts ?? [];
  const sourceUnavailable = sourceState === 'UNKNOWN' || sourceState === 'STALE';
  const guardianUnavailable = sourceUnavailable || partialFacets?.includes('guardian') || partialFacets?.includes('posture');
  const alertsUnavailable = sourceUnavailable || partialFacets?.includes('alerts');
  const healthScore = guardian?.healthScore;
  const reportedInterval = !guardianUnavailable && typeof guardian?.pulseIntervalSec === 'number' && guardian.pulseIntervalSec > 0
    ? guardian.pulseIntervalSec
    : null;

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === 'critical') return alert.severity === 'critical';
    if (alertFilter === 'warn') return alert.severity === 'warning';
    if (alertFilter === 'info') return alert.severity === 'info';
    return true;
  });

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top Banner & Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-[#111827]/80 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className={`w-5 h-5 ${guardianUnavailable ? 'text-amber-400' : 'text-emerald-400 animate-pulse'}`} />
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              哨兵守护与健康大屏
            </h2>
            {sourceState !== 'LIVE' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                来源 {sourceState} · {sourceFailure ?? '当前哨兵状态未获验证'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Cockpit BFF 治理投影；仅显示带来源与新鲜度证明的 Guardian 观测。
            <span className="ml-1 font-mono text-slate-500">{observationLabel(sourceObservedAt, sourceAgeMs)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <div className="flex items-center gap-2 bg-[#0b0f19]/80 border border-slate-800 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-300">
              已报告巡检周期: <strong className="text-cyan-300 font-mono text-xs">{reportedInterval === null ? 'UNKNOWN' : `${reportedInterval}s`}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleTriggerInspection}
            disabled={isRefreshing || isLoading}
            aria-label="触发全量巡检"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '巡查中...' : '立即全局巡检'}
          </button>
        </div>
      </div>

      {/* Hero Stats Matrix */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3" role="status" aria-label="Loading guardian stats...">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Health Score */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#111827]/90 to-slate-950/80 border border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>体系综合健康指数</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                {guardianUnavailable || typeof healthScore !== 'number' ? 'UNKNOWN' : `${healthScore.toFixed(1)}%`}
              </span>
              <span className={`text-xs font-medium ${guardianUnavailable ? 'text-amber-300' : 'text-emerald-400'}`}>
                {guardianUnavailable ? '未获验证' : 'BFF 已验证'}
              </span>
            </div>
            {!guardianUnavailable && typeof healthScore === 'number' && (
              <div className="mt-3 w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(healthScore, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Pulse Cadence */}
          <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>哨兵扫描心跳周期</span>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                {reportedInterval === null ? 'UNKNOWN' : reportedInterval}
              </span>
              <span className="text-xs text-slate-400 font-mono">秒 / 循环</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {guardianUnavailable ? '来源不含已验证的哨兵观测，不能确认心跳周期' : `BFF 已报告 ${reportedInterval}s 巡检周期`}
            </div>
          </div>

          {/* Subsystems Count */}
          <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>已纳管子系统</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                {guardianUnavailable ? 'UNKNOWN' : subsystems.length}
              </span>
              <span className="text-xs text-indigo-400 font-mono">{guardianUnavailable ? '状态未知' : `${subsystems.length} 已报告`}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {guardianUnavailable ? '来源不含已验证的哨兵观测，无法验证子系统状态' : '子系统状态来自当前 BFF 投影'}
            </div>
          </div>

          {/* Active Alerts */}
          <div className="p-4 rounded-xl bg-[#111827]/80 border border-slate-800/80 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>实时未决告警</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                {alertsUnavailable ? 'UNKNOWN' : alerts.length}
              </span>
              <span className={`text-xs font-medium ${alertsUnavailable ? 'text-amber-300' : 'text-emerald-400'}`}>
                {alertsUnavailable ? '告警状态未知' : '无阻断级风险'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {alertsUnavailable
                ? alerts.length > 0 ? `已观察到 ${alerts.length} 条记录；完整告警状态未知` : '数据源不可用，无法判断未决告警'
                : '当前 BFF 已验证告警集合的记录数'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('subsystems')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'subsystems'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            四大子系统状态矩阵 ({guardianUnavailable ? 'UNKNOWN' : subsystems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            实时告警与自愈流 ({alertsUnavailable ? 'UNKNOWN' : alerts.length})
          </button>
        </div>

        {activeTab === 'logs' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as AlertFilterLevel)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">全量告警</option>
              <option value="critical">严重 (Critical)</option>
              <option value="warn">预警 (Warning)</option>
              <option value="info">提示 (Info)</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === 'subsystems' ? (
        guardianUnavailable ? (
          <div className="p-12 text-center rounded-2xl bg-amber-950/20 border border-dashed border-amber-500/30 text-amber-200" role="status">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
            <p className="text-sm font-medium">哨兵状态 UNKNOWN</p>
            <p className="mt-1 text-xs text-amber-300/80">当前部分来源不含已验证的 Guardian 观测，不能从零值或空列表推断健康。</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subsystems.map((sub) => (
            <div
              key={sub.id}
              data-testid={`subsystem-card-${sub.id}`}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 backdrop-blur-md flex flex-col justify-between transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    {getSubsystemIcon(sub.id)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {sub.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Subsystem ID: {sub.id}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    sub.status === 'HEALTHY'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                      : sub.status === 'WARN'
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                      : 'bg-red-950/60 text-red-400 border border-red-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {sub.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>响应延迟: <strong className="text-cyan-300 font-mono">{sub.latencyMs === undefined ? 'UNKNOWN' : `${sub.latencyMs}ms`}</strong></span>
                <span className="text-[11px] text-slate-500">状态来自 BFF 投影</span>
              </div>
            </div>
          ))}
        </div>
        )
      ) : (
        <div className="space-y-3">
          {alertsUnavailable ? (
            <>
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-dashed border-amber-500/30 text-amber-200" role="status">
                <AlertTriangle className="w-6 h-6 mb-2 text-amber-400" />
                <p className="text-sm font-medium">完整告警状态 UNKNOWN</p>
                <p className="mt-1 text-xs text-amber-300/80">
                  {alerts.length > 0
                    ? '以下为来源中已观察到的记录，不代表当前未决告警总数。'
                    : '不能以空列表推断“没有活动告警”。'}
                </p>
              </div>
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/20 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">{alert.message}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        已观察记录 · 来源: {alert.source} | 时间: {alert.timestamp}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                    {alert.severity}
                  </span>
                </div>
              ))}
            </>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400" role="status">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/80" />
              <p className="text-sm font-medium text-slate-300">当前没有处于活动状态的告警</p>
              <p className="mt-1 text-xs text-slate-500">当前 BFF 已验证告警集合为空。</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">{alert.message}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      来源: {alert.source} | 时间: {alert.timestamp}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                  {alert.severity}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GuardianInspectionWallboard;
