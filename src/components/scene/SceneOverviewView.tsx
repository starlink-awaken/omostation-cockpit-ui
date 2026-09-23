import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEscalationQueue, useSceneList } from '../../api/hooks/sceneLifecycle';
import SceneSubNav from './SceneSubNav';

const LIFECYCLE_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  shadow: 'bg-blue-50 text-blue-700 border-blue-200',
  assisted: 'bg-amber-50 text-amber-700 border-amber-200',
  supervised: 'bg-green-50 text-green-700 border-green-200',
  routine: 'bg-purple-50 text-purple-700 border-purple-200',
};

const DOMAINS = ['work', 'health', 'research', 'knowledge', 'governance'];

export default function SceneOverviewView() {
  const [domain, setDomain] = useState<string | undefined>();
  const { data, isLoading, error } = useSceneList(domain);
  const { data: escalations } = useEscalationQueue();
  const pendingCount = escalations?.count ?? 0;

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">加载场景卡中…</div>;
  }
  if (error) {
    return <div className="p-6 text-sm text-red-600">加载失败: {(error as Error).message}</div>;
  }

  const scenes = data?.scenes ?? [];

  const byLifecycle: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  for (const s of scenes) {
    byLifecycle[s.lifecycle] = (byLifecycle[s.lifecycle] ?? 0) + 1;
    byDomain[s.domain] = (byDomain[s.domain] ?? 0) + 1;
  }

  return (
    <div className="space-y-6 p-6">
      <SceneSubNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">场景总览</h1>
          <p className="text-sm text-gray-500">v3 场景卡生命周期分布与健康状态</p>
        </div>
        <select
          value={domain ?? ''}
          onChange={(e) => setDomain(e.target.value || undefined)}
          className="rounded-lg border px-3 py-1.5 text-sm"
          aria-label="按域过滤"
        >
          <option value="">全部域</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Pending escalations banner */}
      {pendingCount > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          ⏳ {pendingCount} 个场景等待人工裁决 —
          <Link to="/calibration" className="ml-1 underline">前往校准中心处理</Link>
        </div>
      )}

      {/* Lifecycle distribution */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(LIFECYCLE_STYLES).map(([level, cls]) => (
          <div key={level} className={`rounded-lg border p-3 text-center ${cls}`}>
            <div className="text-2xl font-bold">{byLifecycle[level] ?? 0}</div>
            <div className="mt-1 text-xs">{level}</div>
          </div>
        ))}
      </div>

      {/* Domain chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(byDomain).map(([d, n]) => (
          <span key={d} className="rounded-full bg-gray-100 px-2.5 py-1">
            {d}: {n}
          </span>
        ))}
      </div>

      {/* Scene table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Scene ID</th>
              <th className="px-4 py-2">名称</th>
              <th className="px-4 py-2">域</th>
              <th className="px-4 py-2">生命周期</th>
              <th className="px-4 py-2">激活</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {scenes.map((s) => (
              <tr key={s.scene_id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{s.scene_id}</td>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.domain}</td>
                <td className="px-4 py-2">
                  <span className={`rounded border px-2 py-0.5 text-xs ${LIFECYCLE_STYLES[s.lifecycle] ?? 'bg-gray-100'}`}>
                    {s.lifecycle}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">{s.activation}</td>
                <td className="px-4 py-2">
                  <Link to={`/scenes/${encodeURIComponent(s.scene_id)}`} className="text-blue-600 hover:underline">
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">共 {scenes.length} 张场景卡</div>
    </div>
  );
}
