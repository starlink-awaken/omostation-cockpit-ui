/**
 * OperationsView — 业务协同工作台 (BET-Y1Q4-T8-24D).
 *
 * 三区: Work Cases 案件大厅 / Scene v3 旅程状态机 / PersistentQueue 监控。
 * 数据: 消费既有 BOS/API 端点（signal/scene/queue），无新后端。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { asArray } from '../api/safe';
import WorkCaseCard from '../components/operations/WorkCaseCard';
import QueueMonitor from '../components/operations/QueueMonitor';

export interface WorkCase {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'blocked' | 'done';
  scene?: string;
  updated_at: string;
}

export interface QueueStat {
  queue: string;
  depth: number;
  oldest_age_s: number;
}

const STATUS_LABEL: Record<WorkCase['status'], string> = {
  open: '待处理',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
};

export default function OperationsView() {
  const [cases, setCases] = useState<WorkCase[]>([]);
  const [queue, setQueue] = useState<QueueStat[]>([]);
  const [filter, setFilter] = useState<WorkCase['status'] | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<any>('/api/bc-os/cases');
        if (!alive) return;
        setCases(asArray<WorkCase>(data?.cases ?? data));
        setQueue(asArray<QueueStat>(data?.queues));
      } catch (e: any) {
        if (alive) setError(e?.message ?? String(e));
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? cases : cases.filter((c) => c.status === filter)),
    [cases, filter],
  );

  return (
    <div data-testid="operations-view" style={{ padding: 16 }}>
      <h2>Operations · 业务协同</h2>

      <section aria-label="案件筛选">
        {(['all', 'open', 'in_progress', 'blocked', 'done'] as const).map((s) => (
          <button
            key={s}
            data-testid={`filter-${s}`}
            onClick={() => setFilter(s)}
            style={{ fontWeight: filter === s ? 700 : 400, marginRight: 8 }}
          >
            {s === 'all' ? '全部' : STATUS_LABEL[s]}
          </button>
        ))}
      </section>

      {error && <div role="alert" data-testid="cases-error">{error}</div>}

      <section aria-label="案件大厅" data-testid="case-hall">
        {filtered.length === 0 ? (
          <p>暂无案件</p>
        ) : (
          filtered.map((c) => <WorkCaseCard key={c.id} workCase={c} />)
        )}
      </section>

      <section aria-label="PersistentQueue 监控" data-testid="queue-monitor">
        <h3>PersistentQueue 监控</h3>
        <QueueMonitor stats={queue} />
      </section>
    </div>
  );
}
