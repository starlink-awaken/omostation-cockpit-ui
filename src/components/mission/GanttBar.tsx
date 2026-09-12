/** GanttBar — 甘特条 (窗口起点 + 跨度). */
import React from 'react';
import type { BetRow } from '../../views/MissionView';

const COLOR: Record<string, string> = {
  done: '#22c55e', candidate: '#94a3b8', blocked: '#ef4444', in_progress: '#f59e0b',
};

export default function GanttBar({ bet, start, span }: { bet: BetRow; start: number; span: number }) {
  return (
    <div
      data-testid={`gantt-${bet.id}`}
      title={`${bet.id} [${bet.status}]`}
      style={{ gridColumn: `${start + 1} / span ${span}`, height: 10, background: COLOR[bet.status] ?? '#94a3b8', margin: 1, borderRadius: 2 }}
    />
  );
}
