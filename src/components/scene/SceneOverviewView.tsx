import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSceneList } from '../../../api/hooks/scene';

const LIFECYCLE_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  shadow: 'bg-blue-100 text-blue-700',
  assisted: 'bg-yellow-100 text-yellow-700',
  supervised: 'bg-green-100 text-green-700',
  routine: 'bg-purple-100 text-purple-700',
};

export default function SceneOverviewView() {
  const [domain, setDomain] = useState<string | undefined>();
  const { data, isLoading, error } = useSceneList(domain);

  if (isLoading) return <div className="p-6 text-gray-500">加载中...</div>;
  if (error) return <div className="p-6 text-red-500">加载失败: {(error as Error).message}</div>;

  const scenes = data?.scenes || [];
  const byLifecycle: Record<string, number> = {};
  scenes.forEach((s) => {
    byLifecycle[s.lifecycle] = (byLifecycle[s.lifecycle] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">场景总览</h1>
        <select
          value={domain || ''}
          onChange={(e) => setDomain(e.target.value || undefined)}
          className="px-3 py-1.5 border rounded-lg text-sm"
        >
          <option value="">全部域</option>
          <option value="work">工作域</option>
          <option value="health">健康域</option>
          <option value="research">研究域</option>
          <option value="knowledge">知识域</option>
          <option value="governance">治理域</option>
        </select>
      </div>

      {/* Lifecycle distribution */}
      <div className="grid grid-cols-5 gap-3">
        {Object.entries(LIFECYCLE_COLORS).map(([level, color]) => (
          <div key={level} className={`rounded-lg p-3 text-center ${color}`}>
            <div className="text-2xl font-bold">{byLifecycle[level] || 0}</div>
            <div className="text-xs mt-1">{level}</div>
          </div>
        ))}
      </div>

      {/* Scene table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">场景 ID</th>
              <th className="text-left px-4 py-2">名称</th>
              <th className="text-left px-4 py-2">域</th>
              <th className="text-left px-4 py-2">生命周期</th>
              <th className="text-left px-4 py-2">激活</th>
              <th className="text-left px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((s) => (
              <tr key={s.scene_id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{s.scene_id}</td>
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.domain}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${LIFECYCLE_COLORS[s.lifecycle] || 'bg-gray-100'}`}>
                    {s.lifecycle}
                  </span>
                </td>
                <td className="px-4 py-2">{s.activation}</td>
                <td className="px-4 py-2">
                  <Link to={`/scenes/${s.scene_id}`} className="text-blue-600 hover:underline">
                    详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">共 {scenes.length} 张场景卡</div>
    </div>
  );
}
