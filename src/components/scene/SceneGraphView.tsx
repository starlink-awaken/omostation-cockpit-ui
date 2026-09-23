import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { useSceneGraph } from '../../api/hooks/sceneLifecycle';
import SceneSubNav from './SceneSubNav';
import EmptyState from '../ui/EmptyState';

export default function SceneGraphView() {
  const { data, isLoading, error } = useSceneGraph();

  if (isLoading) return <div className="p-6 text-sm text-gray-500">构建场景图中…</div>;
  if (error) return <div className="p-6 text-sm text-red-600">加载失败: {(error as Error).message}</div>;

  const topologicalOrder = data?.topological_order ?? [];
  const nodes = data?.nodes ?? {};

  if (!data || topologicalOrder.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <SceneSubNav />
        <EmptyState
          icon={<GitBranch size={32} className="text-indigo-400" />}
          title="暂无场景 DAG 拓扑"
          message="当前尚未检测到活跃场景流转数据。可在知行 43191 监造底座或场景卡评审中初始化场景。"
        />
      </div>
    );
  }

  const roots = topologicalOrder.filter(
    (id) => !topologicalOrder.some(
      (other) => nodes[other]?.edges?.some((e) => e.target === id),
    ),
  );

  return (
    <div className="space-y-6 p-6">
      <SceneSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">场景图</h1>
          <p className="text-sm text-gray-500">DAG 拓扑 · {topologicalOrder.length} 节点 · 入口 {data.entry_point ?? '—'}</p>
        </div>
      </div>

      {data.cycles_detected != null && data.cycles_detected > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          ⚠️ 检测到 {data.cycles_detected} 个环 — 场景图不是合法 DAG
        </div>
      )}

      {/* Topological levels */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">拓扑排序</h2>
        <div className="space-y-1 font-mono text-xs">
          {data.topological_order.map((id, idx) => (
            <div key={id} className="flex items-center gap-2">
              <span className="w-8 text-gray-400">{idx + 1}.</span>
              <Link to={`/scenes/${encodeURIComponent(id)}`} className="text-blue-600 hover:underline">
                {id}
              </Link>
              {id === data.entry_point && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">入口</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Roots */}
      {roots.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">根节点（无上游）</h2>
          <div className="font-mono text-xs text-gray-600">{roots.join(', ')}</div>
        </div>
      )}

      {/* Edge details per node */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">边详情</h2>
        <div className="space-y-3">
          {Object.entries(data.nodes).map(([id, node]) => (
            <div key={id} className="rounded border p-3 text-sm">
              <Link to={`/scenes/${encodeURIComponent(id)}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
                {id}
              </Link>
              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">{node.type}</span>
              {node.edges.length === 0 ? (
                <p className="mt-1 text-xs text-gray-400">无出边（叶子节点）</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {node.edges.map((e, i) => (
                    <li key={i} className="text-xs">
                      <span className="text-gray-400">→</span>{' '}
                      <Link to={`/scenes/${encodeURIComponent(e.target)}`} className="font-mono text-blue-600 hover:underline">
                        {e.target}
                      </Link>
                      {e.condition !== 'always' && (
                        <span className="ml-2 text-gray-400">[{e.condition}]</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
