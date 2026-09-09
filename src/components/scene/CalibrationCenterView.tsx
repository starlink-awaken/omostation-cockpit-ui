import React from 'react';
import { useSceneList } from '../../../api/hooks/scene';

export default function CalibrationCenterView() {
  const { data, isLoading, error } = useSceneList();

  if (isLoading) return <div className="p-6 text-gray-500">加载中...</div>;
  if (error) return <div className="p-6 text-red-500">加载失败</div>;

  const scenes = data?.scenes || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">校准中心</h1>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">场景 ID</th>
              <th className="text-left px-4 py-2">名称</th>
              <th className="text-left px-4 py-2">生命周期</th>
              <th className="text-left px-4 py-2">校准状态</th>
              <th className="text-left px-4 py-2">升级就绪</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((s) => {
              const minSamples = s.quality?.calibration?.min_samples || 30;
              const minCal = s.quality?.calibration?.min_calibration || 0.6;
              const ready = s.lifecycle === 'shadow' || s.lifecycle === 'assisted';
              return (
                <tr key={s.scene_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{s.scene_id}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.lifecycle}</td>
                  <td className="px-4 py-2 text-gray-400">
                    需 {minSamples} 样本 / 校准 ≥ {minCal}
                  </td>
                  <td className="px-4 py-2">
                    {ready ? (
                      <span className="text-yellow-600">⏳ 待升级</span>
                    ) : (
                      <span className="text-green-600">✓ 已就绪</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">共 {scenes.length} 张场景卡</div>
    </div>
  );
}
