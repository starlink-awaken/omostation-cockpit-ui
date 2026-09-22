import { Link } from 'react-router-dom';
import { useSceneList } from '../../api/hooks/sceneLifecycle';
import SceneSubNav from './SceneSubNav';

interface Row {
  scene_id: string;
  name: string;
  lifecycle: string;
  minSamples: number;
  minCalibration: number;
  ready: boolean;
}

export default function CalibrationView() {
  const { data, isLoading, error } = useSceneList();

  if (isLoading) return <div className="p-6 text-sm text-gray-500">加载中…</div>;
  if (error) return <div className="p-6 text-sm text-red-600">加载失败: {(error as Error).message}</div>;

  const scenes = data?.scenes ?? [];
  const rows: Row[] = scenes.map((s) => {
    const cal = s.quality?.calibration;
    const minSamples = cal?.min_samples ?? 30;
    const minCalibration = cal?.min_calibration ?? 0.6;
    const ready = s.lifecycle === 'shadow' || s.lifecycle === 'assisted';
    return { scene_id: s.scene_id, name: s.name, lifecycle: s.lifecycle, minSamples, minCalibration, ready };
  });

  const readyCount = rows.filter((r) => r.ready).length;

  return (
    <div className="space-y-6 p-6">
      <SceneSubNav />
      <div>
        <h1 className="text-xl font-semibold">校准中心</h1>
        <p className="text-sm text-gray-500">
          {rows.length} 张场景卡 · {readyCount} 张处于可校准阶段 (shadow/assisted)
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Scene ID</th>
              <th className="px-4 py-2">名称</th>
              <th className="px-4 py-2">当前等级</th>
              <th className="px-4 py-2">门控要求</th>
              <th className="px-4 py-2">校准阶段</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.scene_id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.scene_id}</td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.lifecycle}</td>
                <td className="px-4 py-2 text-xs text-gray-500">
                  样本 ≥ {r.minSamples} · 校准 ≥ {r.minCalibration}
                </td>
                <td className="px-4 py-2">
                  {r.ready ? (
                    <span className="text-amber-600">⏳ 采集中</span>
                  ) : (
                    <span className="text-green-600">✓ 已就绪</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Link to={`/scenes/${encodeURIComponent(r.scene_id)}`} className="text-blue-600 hover:underline">
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        校准分数由 calibration-engine 每日计算（30 天滑动窗口），达到门控条件后由 approver 确认升级。
      </p>
    </div>
  );
}
