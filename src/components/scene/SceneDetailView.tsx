import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useAdjudicateScene,
  useEscalationQueue,
  useExecuteScene,
  useSceneMetrics,
  useSceneStatus,
  useTransitionScene,
} from '../../api/hooks/sceneLifecycle';

const LEVELS = ['shadow', 'assisted', 'supervised', 'routine'];

export default function SceneDetailView() {
  const { id } = useParams<{ id: string }>();
  const sceneId = decodeURIComponent(id ?? '');
  const { data, isLoading, error } = useSceneStatus(sceneId);
  const { data: metrics } = useSceneMetrics(sceneId);
  const execute = useExecuteScene();
  const transition = useTransitionScene();
  const adjudicate = useAdjudicateScene();
  const { data: escalations } = useEscalationQueue();
  const [targetLevel, setTargetLevel] = useState('');
  const [execResult, setExecResult] = useState<string | null>(null);
  const [reviewSec, setReviewSec] = useState('30');
  const [savedSec, setSavedSec] = useState('600');

  const pendingEscalations = (escalations?.escalations ?? []).filter(
    (e) => e.scene_id === sceneId,
  );

  if (isLoading) return <div className="p-6 text-sm text-gray-500">加载中…</div>;
  if (error) return <div className="p-6 text-sm text-red-600">加载失败: {(error as Error).message}</div>;
  if (!data?.scene) return <div className="p-6 text-sm text-gray-500">场景不存在</div>;

  const s = data.scene;
  const caps = s.runtime?.sandbox?.capabilities ?? [];
  const upstream = s.topology?.upstream ?? [];
  const downstream = s.topology?.downstream ?? [];

  const onExecute = async (dryRun: boolean) => {
    const res = await execute.mutateAsync({ scene_id: s.scene_id, dry_run: dryRun });
    try {
      const body = typeof res === 'string' ? JSON.parse(res) : res;
      setExecResult(JSON.stringify(body, null, 2));
    } catch {
      setExecResult(String(res));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{s.name}</h1>
          <p className="font-mono text-xs text-gray-500">{s.scene_id}</p>
        </div>
        <Link to="/scenes" className="text-sm text-blue-600 hover:underline">← 返回总览</Link>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm md:grid-cols-4">
        <div><span className="text-gray-500">Class:</span> {s.scene_class}</div>
        <div><span className="text-gray-500">Type:</span> {s.scene_type}</div>
        <div><span className="text-gray-500">Domain:</span> {s.domain}</div>
        <div><span className="text-gray-500">Lifecycle:</span> {s.lifecycle}</div>
        <div><span className="text-gray-500">Activation:</span> {s.activation}</div>
        <div><span className="text-gray-500">Owner:</span> {s.owner ?? '—'}</div>
        {s.bet && <div><span className="text-gray-500">BET:</span> {s.bet}</div>}
        {s.runtime?.journey_ref && (
          <div><span className="text-gray-500">Journey:</span> {s.runtime.journey_ref}</div>
        )}
      </div>

      {/* Calibration metrics */}
      {metrics && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">校准指标（{metrics.window_days}d 窗口）</h2>
          <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-5">
            <div className="rounded bg-blue-50 p-3">
              <div className="text-lg font-bold">{metrics.calibration_score.toFixed(3)}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div className="rounded bg-green-50 p-3">
              <div className="text-lg font-bold">{metrics.sample_count}</div>
              <div className="text-xs text-gray-500">Samples</div>
            </div>
            <div className="rounded bg-amber-50 p-3">
              <div className="text-lg font-bold">{metrics.precision.toFixed(3)}</div>
              <div className="text-xs text-gray-500">Precision</div>
            </div>
            <div className="rounded bg-red-50 p-3">
              <div className="text-lg font-bold">{metrics.false_positive_rate.toFixed(3)}</div>
              <div className="text-xs text-gray-500">FP Rate</div>
            </div>
            <div className="rounded bg-gray-50 p-3">
              <div className="text-lg font-bold">{(metrics.trend_14d ?? 0).toFixed(3)}</div>
              <div className="text-xs text-gray-500">Trend 14d</div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      {caps.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">能力引用（BOS URI）</h2>
          <div className="flex flex-wrap gap-2">
            {caps.map((c) => (
              <span key={c} className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Topology */}
      {(upstream.length > 0 || downstream.length > 0) && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm md:grid-cols-2">
          <div>
            <h2 className="mb-2 font-semibold">上游</h2>
            {upstream.length === 0 ? (
              <p className="text-xs text-gray-400">无</p>
            ) : (
              upstream.map((u) => (
                <Link key={u.scene} to={`/scenes/${encodeURIComponent(u.scene)}`} className="block font-mono text-xs text-blue-600 hover:underline">
                  {u.scene} {u.handoff_via && `(${u.handoff_via})`}
                </Link>
              ))
            )}
          </div>
          <div>
            <h2 className="mb-2 font-semibold">下游</h2>
            {downstream.length === 0 ? (
              <p className="text-xs text-gray-400">无</p>
            ) : (
              downstream.map((d) => (
                <Link key={d.scene} to={`/scenes/${encodeURIComponent(d.scene)}`} className="block font-mono text-xs text-blue-600 hover:underline">
                  {d.scene} {d.trigger_on && `on: ${d.trigger_on}`}
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pending escalations (human adjudication) */}
      {pendingEscalations.length > 0 && (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-800">
            ⏳ 待人工裁决 ({pendingEscalations.length})
          </h2>
          {pendingEscalations.map((esc) => (
            <div key={esc.run_id} className="rounded border border-amber-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-gray-500">{esc.run_id}</span>
                <span className="text-xs text-gray-500">
                  confidence: {esc.confidence?.toFixed(2) ?? '—'} · {esc.trace_steps ?? '?'} steps
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={reviewSec}
                  onChange={(e) => setReviewSec(e.target.value)}
                  className="w-20 rounded border px-2 py-1 text-xs"
                  title="人工审查用时 (秒)"
                  aria-label="审查秒数"
                />
                <input
                  type="number"
                  value={savedSec}
                  onChange={(e) => setSavedSec(e.target.value)}
                  className="w-20 rounded border px-2 py-1 text-xs"
                  title="估计节省时间 (秒)"
                  aria-label="节省秒数"
                />
                <button
                  onClick={() =>
                    adjudicate.mutateAsync({
                      scene_id: sceneId,
                      run_id: esc.run_id,
                      decision: 'accept',
                      review_seconds: Number(reviewSec) || undefined,
                      saved_seconds: Number(savedSec) || undefined,
                    })
                  }
                  disabled={adjudicate.isPending}
                  className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() =>
                    adjudicate.mutateAsync({
                      scene_id: sceneId,
                      run_id: esc.run_id,
                      decision: 'reject',
                      notes: 'Rejected via cockpit UI',
                    })
                  }
                  disabled={adjudicate.isPending}
                  className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">操作</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onExecute(true)}
            disabled={execute.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {execute.isPending ? '执行中…' : '执行 (dry-run)'}
          </button>
          <select
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            aria-label="目标生命周期等级"
          >
            <option value="">选择目标等级…</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            onClick={() => targetLevel && transition.mutateAsync({ scene_id: s.scene_id, target_level: targetLevel })}
            disabled={!targetLevel || transition.isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {transition.isPending ? '处理中…' : '转换生命周期'}
          </button>
        </div>
        {execResult && (
          <pre className="max-h-64 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">{execResult}</pre>
        )}
      </div>
    </div>
  );
}
