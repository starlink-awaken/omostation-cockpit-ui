import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useExecuteScene, usePromoteScene, useSceneMetrics, useSceneStatus } from '../../../api/hooks/scene';

export default function SceneDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: sceneData, isLoading } = useSceneStatus(id || '');
  const { data: metricsData } = useSceneMetrics(id || '');
  const executeMutation = useExecuteScene();
  const promoteMutation = usePromoteScene();
  const [targetLevel, setTargetLevel] = useState('');

  if (isLoading) return <div className="p-6 text-gray-500">加载中...</div>;
  if (!sceneData?.scene) return <div className="p-6 text-red-500">场景不存在</div>;

  const scene = sceneData.scene;
  const metrics = metricsData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{scene.name}</h1>
        <span className="text-sm text-gray-500 font-mono">{scene.scene_id}</span>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
        <div><span className="text-gray-500">Class:</span> {scene.scene_class}</div>
        <div><span className="text-gray-500">Type:</span> {scene.scene_type}</div>
        <div><span className="text-gray-500">Domain:</span> {scene.domain}</div>
        <div><span className="text-gray-500">Lifecycle:</span> {scene.lifecycle}</div>
        <div><span className="text-gray-500">Activation:</span> {scene.activation}</div>
        <div><span className="text-gray-500">Owner:</span> {scene.owner}</div>
      </div>

      {/* Calibration metrics */}
      {metrics && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">校准指标</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-xl font-bold">{metrics.calibration_score.toFixed(3)}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-xl font-bold">{metrics.sample_count}</div>
              <div className="text-xs text-gray-500">Samples</div>
            </div>
            <div className="bg-yellow-50 rounded p-3">
              <div className="text-xl font-bold">{metrics.precision.toFixed(3)}</div>
              <div className="text-xs text-gray-500">Precision</div>
            </div>
            <div className="bg-red-50 rounded p-3">
              <div className="text-xl font-bold">{metrics.false_positive_rate.toFixed(3)}</div>
              <div className="text-xs text-gray-500">FP Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities */}
      {scene.runtime?.sandbox?.capability_refs && (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">能力引用</h2>
          <div className="flex flex-wrap gap-2">
            {scene.runtime.sandbox.capability_refs.map((cap: string) => (
              <span key={cap} className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{cap}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">操作</h2>
        <div className="flex gap-3">
          <button
            onClick={() => executeMutation.mutate({ scene_id: scene.scene_id, dry_run: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            执行 (dry-run)
          </button>
          <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">选择目标等级...</option>
            <option value="shadow">shadow</option>
            <option value="assisted">assisted</option>
            <option value="supervised">supervised</option>
            <option value="routine">routine</option>
          </select>
          <button
            onClick={() => promoteMutation.mutate({ scene_id: scene.scene_id, target_level: targetLevel })}
            disabled={!targetLevel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            晋升
          </button>
        </div>
      </div>
    </div>
  );
}
