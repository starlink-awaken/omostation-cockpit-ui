/**
 * MissionView — 战略交付工作台 (BET-Y1Q4-T8-24D).
 *
 * 三区: 3Y-BET 全景矩阵（窗口×轨道分组）/ 交互式甘特图（窗口→BET 时间轴）/
 * Golden Slice 真实价值公证面板。数据消费 ledger 只读端点。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { asArray } from '../api/safe';
import BetMatrixCell from '../components/mission/BetMatrixCell';
import GanttBar from '../components/mission/GanttBar';
import GoldenSliceCard from '../components/mission/GoldenSliceCard';

export interface BetRow {
  id: string;
  title: string;
  window: string;   // Y1Q4 ...
  track: string;    // T10-MATURITY ...
  status: 'done' | 'candidate' | 'blocked' | 'in_progress';
}

const WINDOW_ORDER = ['Y1Q1', 'Y1Q2', 'Y1Q3', 'Y1Q4', 'Y2Q1', 'Y2Q2', 'Y2Q3', 'Y2Q4', 'Y3H1', 'Y3H2'];
const STATUS_COLOR: Record<string, string> = {
  done: '#22c55e', candidate: '#94a3b8', blocked: '#ef4444', in_progress: '#f59e0b',
};

export default function MissionView() {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [golden, setGolden] = useState<GoldenSlice[]>([]);
  const [selected, setSelected] = useState<BetRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<unknown>('/api/ledger/bets');
        if (!alive) return;
        setBets(asArray<BetRow>(data?.bets ?? data));
        setGolden(asArray<GoldenSlice>(data?.golden_slice));
      } catch (e: unknown) {
        if (alive) setError(e?.message ?? String(e));
      }
    })();
    return () => { alive = false; };
  }, []);

  const byWindow = useMemo(() => {
    const m = new Map<string, BetRow[]>();
    for (const b of bets) {
      const list = m.get(b.window) ?? [];
      list.push(b);
      m.set(b.window, list);
    }
    return [...m.entries()].sort(
      ([a], [b]) => WINDOW_ORDER.indexOf(a) - WINDOW_ORDER.indexOf(b),
    );
  }, [bets]);

  const spanOf = (b: BetRow) => {
    const i = WINDOW_ORDER.indexOf(b.window);
    return { start: i * 4, len: 4 };
  };

  return (
    <div data-testid="mission-view" style={{ padding: 16 }}>
      <h2>Mission · 战略交付</h2>

      {error && <div role="alert" data-testid="bets-error">{error}</div>}

      <section aria-label="3Y-BET 全景矩阵" data-testid="bet-matrix">
        <h3>全景矩阵（窗口 × 状态）</h3>
        {byWindow.map(([win, list]) => (
          <div key={win} data-testid={`window-${win}`} style={{ marginBottom: 8 }}>
            <strong>{win}</strong>
            {list.map((b) => (
              <BetMatrixCell key={b.id} bet={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        ))}
      </section>

      <section aria-label="甘特图" data-testid="gantt">
        <h3>窗口时间轴</h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${WINDOW_ORDER.length * 4}, 8px)`, gap: 0 }}>
          {bets.map((b) => {
            const { start, len } = spanOf(b);
            return <GanttBar key={b.id} bet={b} start={start} span={len} />;
          })}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {WINDOW_ORDER.map((w) => <span key={w} style={{ width: 32, fontSize: 10 }}>{w}</span>)}
        </div>
      </section>

      <section aria-label="Golden Slice 公证" data-testid="golden-slice">
        <h3>Golden Slice 真实价值公证</h3>
        {golden.length === 0 ? (
          <p data-testid="golden-empty">暂无公证条目</p>
        ) : (
          golden.map((g) => <GoldenSliceCard key={g.bet_id} slice={g} />)
        )}
      </section>

      {selected && (
        <div role="dialog" data-testid="bet-detail" style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
          <h3>{selected.id}</h3>
          <p>{selected.title}</p>
          <p>状态: <span style={{ color: STATUS_COLOR[selected.status] }}>{selected.status}</span></p>
          <button onClick={() => setSelected(null)}>关闭</button>
        </div>
      )}
    </div>
  );
}
