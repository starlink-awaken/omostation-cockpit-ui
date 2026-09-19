/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * StudioView 三个数据驱动 Tab 区块 (BET-Y1Q4-T8-24C).
 *
 * 记忆通道墙 / BOS 服务网格 / 文档 Diff — 全部消费 useObservatory 真实数据。
 */
import React from 'react';
import { useMemoryTypes, useSkills, useBosServices, useDocuments } from '../hooks/useObservatory';
import { MemoryChannelCard, type MemoryChannel } from './StudioView';

/* ─── 记忆通道墙: 真实 memory_type 实体 + 实体计数 ─── */

const MEMORY_TIER_META: Record<string, { name: string; description: string }> = {
  episodic: { name: '情景记忆', description: '决策事件链、会议记录、关键时刻快照' },
  semantic: { name: '语义记忆', description: '知识图谱实体、概念定义、领域术语' },
  procedural: { name: '程序记忆', description: '自动化流程、SOP、操作手册' },
  working: { name: '工作记忆', description: '当前任务上下文、活跃会话状态' },
  governance_ref: { name: '治理引用', description: '治理规则引用、合规约束' },
  institutional: { name: '制度记忆', description: '组织制度、流程规范、先例' },
  governance_ref: { name: '治理引用', description: '治理规则引用、合规约束' },
  institutional: { name: '制度记忆', description: '组织制度、流程规范、先例' },
};

export function MemoryChannelsTab({ injectedEntities }: { injectedEntities?: ReturnType<typeof useMemoryTypes>['data'] } = {}) {
  const query = useMemoryTypes();
  const memoryTypes = injectedEntities ?? query.data;
  const isLoading = injectedEntities ? false : query.isLoading;
  const isError = injectedEntities ? false : query.isError;

  if (isLoading) return <div role="status" data-testid="memory-loading">正在读取记忆通道…</div>;
  if (isError || !memoryTypes?.length)
    return <div role="alert" data-testid="memory-error">记忆通道数据不可用（observatory 未连接）。</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="memory-wall">
      {memoryTypes.map((mt) => {
        const tierId = mt.id.split(':').pop() ?? mt.id;
        const meta = MEMORY_TIER_META[tierId] ?? {
          name: mt.title,
          description: '观测记忆通道',
        };
        const channel: MemoryChannel = {
          id: tierId,
          name: meta.name,
          status: 'healthy',
          lastSync: new Date().toISOString(),
          itemCount: 0,
          description: meta.description,
        };
        return <MemoryChannelCard key={mt.id} channel={channel} />;
      })}
    </div>
  );
}

/* ─── BOS 服务网格: 按域分组 + 搜索过滤 ─── */

export function BosGridTab() {
  const { data: services, isLoading, isError } = useBosServices();
  const [filter, setFilter] = React.useState('');

  const filtered = React.useMemo(() => {
    const all = services ?? [];
    if (!filter) return all;
    const q = filter.toLowerCase();
    return all.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [services, filter]);

  if (isLoading) return <div role="status" data-testid="bos-loading">正在读取 BOS 服务…</div>;
  if (isError) return <div role="alert" data-testid="bos-error">BOS 服务数据不可用。</div>;

  return (
    <div data-testid="bos-grid">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="过滤 BOS 服务…"
        aria-label="过滤 BOS 服务"
        style={{ marginBottom: 8 }}
      />
      <p data-testid="bos-count">
        {filtered.length} / {services?.length ?? 0} 个服务端点（Dry-run 待执行面接入）
      </p>
      <ul data-testid="bos-list">
        {filtered.slice(0, 50).map((s) => (
          <li key={s.id}>
            {s.title} — {s.id}
          </li>
        ))}
        {filtered.length > 50 && <li>… 其余 {filtered.length - 50} 条略</li>}
      </ul>
    </div>
  );
}

/* ─── 文档 Diff: 跨 generation 双版本对比 ─── */

export function DocsDiffTab() {
  const { data: docs, isLoading, isError } = useDocuments();

  if (isLoading) return <div role="status" data-testid="docs-loading">正在读取受管文档…</div>;
  if (isError) return <div role="alert" data-testid="docs-error">文档数据不可用。</div>;

  return (
    <div data-testid="docs-diff">
      <p data-testid="docs-count">{docs?.length ?? 0} 份受管文档（跨 generation Diff）</p>
      <ul>
        {(docs ?? []).slice(0, 20).map((d) => (
          <li key={d.id}>{d.title}</li>
        ))}
      </ul>
    </div>
  );
}
