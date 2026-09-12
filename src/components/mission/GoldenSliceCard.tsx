/** GoldenSliceCard — 价值公证卡片. */
import React from 'react';

export interface GoldenSlice {
  bet_id: string;
  receipt: string;
  digest: string;
}

export default function GoldenSliceCard({ slice }: { slice: GoldenSlice }) {
  return (
    <div data-testid={`golden-${slice.bet_id}`} style={{ borderLeft: '4px solid #22c55e', padding: '4px 8px', marginBottom: 4 }}>
      <code>{slice.bet_id}</code> · digest <code>{slice.digest.slice(0, 16)}…</code> ·{' '}
      <a href={slice.receipt}>receipt</a>
    </div>
  );
}
