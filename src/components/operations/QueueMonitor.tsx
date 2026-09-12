/** QueueMonitor — PersistentQueue 水位/延迟/死信面板. */
import React from 'react';
import type { QueueStat } from '../../views/OperationsView';

export default function QueueMonitor({ stats }: { stats: QueueStat[] }) {
  if (stats.length === 0) return <p data-testid="queue-empty">队列空闲</p>;
  return (
    <table data-testid="queue-table" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr><th style={{ textAlign: 'left' }}>队列</th><th>深度</th><th>最老消息</th></tr>
      </thead>
      <tbody>
        {stats.map((q) => (
          <tr key={q.queue}>
            <td>{q.queue}</td>
            <td style={{ textAlign: 'right' }}>{q.depth}</td>
            <td style={{ textAlign: 'right' }}>{q.oldest_age_s}s</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
