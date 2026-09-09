import React from 'react';
import { useSceneGraph } from '../../../api/hooks/scene';

export default function SceneGraphView() {
  const { data, isLoading, error } = useSceneGraph();

  if (isLoading) return <div className="p-6 text-gray-500">加载中...</div>;
  if (error) return <div className="p-6 text-red-500">加载失败</div>;
  if (!data) return <div className="p-6 text-gray-500">无数据</div>;

  const nodes = data.nodes || {};
  const order = data.topological_order || [];
  const entryPoint = data.entry_point;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">场景图</h1>
        <div className="text-sm text-gray-500">
          入口: <span className="font-mono">{entryPoint}</span> | 节点: {order.length}
        </div>
      </div>

      {/* DAG visualization (simplified list view) */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">拓扑排序</h2>
        <div className="space-y-2">
          {order.map((nodeId: string, idx: number) => {
            const node = nodes[nodeId] || {};
            const edges = node.edges || [];
            return (
              <div key={nodeId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <span className="text-gray-400 text-sm w-6">{idx + 1}.</span>
                <span className="font-mono text-sm">{nodeId}</span>
                {nodeId === entryPoint && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">入口</span>
                )}
                {edges.length > 0 && (
                  <span className="text-xs text-gray-400">→ {edges.map((e: any) => e.target).join(', ')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Node details */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">节点详情</h2>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(nodes).map(([nodeId, node]: [string, any]) => (
            <div key={nodeId} className="p-3 border rounded">
              <div className="font-mono text-sm font-semibold">{nodeId}</div>
              <div className="text-xs text-gray-500 mt-1">类型: {node.type || 'scene'}</div>
              {node.edges && node.edges.length > 0 && (
                <div className="mt-2 space-y-1">
                  {node.edges.map((edge: any, i: number) => (
                    <div key={i} className="text-xs">
                      <span className="text-gray-400">→</span>{' '}
                      <span className="font-mono">{edge.target}</span>
                      {edge.condition !== 'always' && (
                        <span className="text-gray-400 ml-2">({edge.condition})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
