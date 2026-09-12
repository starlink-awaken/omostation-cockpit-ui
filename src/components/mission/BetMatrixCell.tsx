/** BetMatrixCell — 矩阵单元格 (状态色块 + 悬浮标题). */
import React from 'react';
import type { BetRow } from '../../views/MissionView';

const COLOR: Record<string, string> = {
  done: '#22c55e', candidate: '#94a3b8', blocked: '#ef4444', in_progress: '#f59e0b',
};

export default function BetMatrixCell({ bet, onClick }: { bet: BetRow; onClick?: () => void }) {
  return (
    <button
      data-testid={`cell-${bet.id}`}
      onClick={onClick}
      title={`${bet.id} ${bet.title} [${bet.status}]`}
      style={{ background: COLOR[bet.status] ?? '#94a3b8', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
    >
      {bet.id.replace('BET-', '')}
    </button>
  );
}
