import React, { useState } from 'react';
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCw,
  Clock,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { apiPost } from '../../api/client';
import StatusBadge from '../ui/StatusBadge';

interface TriageResult {
  ok: boolean;
  component?: string;
  status?: string;
  risk_tier?: 'R0' | 'R1';
  suggested_action?: string;
  dispatched?: boolean;
  task_id?: string;
  error?: string;
}

interface RemediateResult {
  ok: boolean;
  action_id?: string;
  title?: string;
  risk_tier?: string;
  execution?: {
    returncode?: number;
    stdout?: string;
    stderr?: string;
  };
  error?: string;
}

const PRESET_COMPONENTS = [
  {
    name: 'dashboard_projection',
    label: '全景驾驶舱投影 (Projection)',
    sampleError: 'projection_stale: lease expired at 2026-10-17T08:00:00Z',
    defaultActionId: 'REFRESH_PROJECTION_LEASE',
  },
  {
    name: 'task_center',
    label: '任务中心状态 (Task Center)',
    sampleError: 'ssot_drift: tasks registry index count mismatch with filesystem',
    defaultActionId: 'FIX_SSOT_DRIFT',
  },
  {
    name: 'projects/omo/tests',
    label: '核心单元测试套件 (Test Suite)',
    sampleError: 'FAILED tests/unit/test_resident_interact.py::test_eval',
    defaultActionId: null,
  },
  {
    name: 'git_submodules',
    label: '子模块指针同步 (Submodules)',
    sampleError: 'submodule_untracked: cache dirty states detected in projects/omo',
    defaultActionId: 'CLEAR_SUBMODULE_CACHE',
  },
];

export default function TriagePanel() {
  const [selectedComp, setSelectedComp] = useState(PRESET_COMPONENTS[0].name);
  const [errorLog, setErrorLog] = useState(PRESET_COMPONENTS[0].sampleError);
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const [remediating, setRemediating] = useState(false);
  const [remediateResult, setRemediateResult] = useState<RemediateResult | null>(null);

  const handleSelectComponent = (compName: string) => {
    setSelectedComp(compName);
    const item = PRESET_COMPONENTS.find((p) => p.name === compName);
    if (item) {
      setErrorLog(item.sampleError);
    }
  };

  const handleRunTriage = async () => {
    setIsLoading(true);
    setTriageResult(null);
    setRemediateResult(null);

    const res = await apiPost<TriageResult>('/api/resident/triage', {
      component: selectedComp,
      status: 'error',
      error_log: errorLog,
      dry_run: true,
      auto_dispatch: false,
    });

    setIsLoading(false);
    if (res.ok && res.data) {
      setTriageResult(res.data);
    } else {
      setTriageResult({
        ok: false,
        error: res.error || '分诊请求失败',
        risk_tier: 'R0',
      });
    }
  };

  const handleExecuteRemediate = async (actionId: string) => {
    setRemediating(true);
    setRemediateResult(null);

    const res = await apiPost<RemediateResult>('/api/resident/remediate', {
      action_id: actionId,
    });

    setRemediating(false);
    if (res.ok && res.data) {
      setRemediateResult(res.data);
    } else {
      setRemediateResult({
        ok: false,
        error: res.error || '自愈执行失败',
      });
    }
  };

  const matchedPreset = PRESET_COMPONENTS.find((p) => p.name === selectedComp);

  return (
    <div className="space-y-6">
      {/* 头部引导卡片 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" />
            常驻 Agent 现场排障分诊台 (Resident Triage Desk)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            实时分析组件故障，精准划分 R0（运维自愈）与 R1（隔离工程）。支持安全枚举白名单一键自愈。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status="running" label="受控自愈引擎 在线" />
        </div>
      </div>

      {/* 排障诊断输入表单 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            1. 选择目标组件
          </label>
          <div className="space-y-2">
            {PRESET_COMPONENTS.map((item) => (
              <button
                key={item.name}
                onClick={() => handleSelectComponent(item.name)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-medium transition-colors border ${
                  selectedComp === item.name
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            2. 故障现象 / 错误日志 (Error Log)
          </label>
          <textarea
            value={errorLog}
            onChange={(e) => setErrorLog(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="输入或粘贴组件报错信息..."
          />
          <button
            onClick={handleRunTriage}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-medium flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            开始现场分诊评估
          </button>
        </div>
      </div>

      {/* 分诊结果卡片 */}
      {triageResult && (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-semibold text-slate-200">分诊诊断报告</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">风险等级判定:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  triageResult.risk_tier === 'R0'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {triageResult.risk_tier} (
                {triageResult.risk_tier === 'R0' ? '运维级·允许自愈' : '工程级·隔离PR'}
                )
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">建议自愈对策:</span>
              <p className="font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                {triageResult.suggested_action || '无需特殊处置'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Action Desk 状态:</span>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between text-slate-300">
                <span>
                  {triageResult.risk_tier === 'R0'
                    ? '已定位自愈脚本'
                    : '建议挂载至 BET-Y2Q4 待办流'}
                </span>
                <span className="text-slate-500 font-mono">
                  {triageResult.task_id || 'IDLE'}
                </span>
              </div>
            </div>
          </div>

          {/* 针对 R0 提供一键自愈 */}
          {triageResult.risk_tier === 'R0' && matchedPreset?.defaultActionId && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                安全枚举白名单已授权：
                <code className="text-[11px] bg-slate-950 px-1 py-0.5 rounded text-slate-300">
                  {matchedPreset.defaultActionId}
                </code>
              </span>
              <button
                onClick={() =>
                  handleExecuteRemediate(matchedPreset.defaultActionId!)
                }
                disabled={remediating}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {remediating ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                一键触发安全自愈
              </button>
            </div>
          )}

          {/* 针对 R1 提示工程隔离 */}
          {triageResult.risk_tier === 'R1' && (
            <div className="pt-2 flex items-center justify-between text-xs text-amber-400/90">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                工程改动红线守护：禁止在生产环境直接写入代码，必须由隔离 worktree 提交 PR。
              </span>
            </div>
          )}

          {/* 自愈执行结果回显 */}
          {remediateResult && (
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs">
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="font-semibold text-emerald-400">
                  自愈执行完成 (Action: {remediateResult.action_id})
                </span>
                <span>返回码: {remediateResult.execution?.returncode ?? 0}</span>
              </div>
              {remediateResult.execution?.stdout && (
                <pre className="text-slate-400 text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {remediateResult.execution.stdout}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
