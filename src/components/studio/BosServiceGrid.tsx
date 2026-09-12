/**
 * BOS 服务网格 — 在线 Dry-run (BET-Y1Q4-T8-24C done_when#3).
 *
 * 每个服务端点支持只读探测 (GET), 非只读操作置灰 (execution_enabled=false 语义)。
 */
import React, { useMemo, useState } from 'react';
import { useBosServices } from '../hooks/useObservatory';

interface BosService {
  id: string;
  title: string;
  status?: string;
}

interface DryRunResult {
  id: string;
  httpStatus: number | null;
  latencyMs: number | null;
  error: string | null;
}

export function BosServiceGrid() {
  const { data: services, isLoading, isError } = useBosServices();
  const [filter, setFilter] = useState('');
  const [dryRunResults, setDryRunResults] = useState<Record<string, DryRunResult>>({});
  const [running, setRunning] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const all = services ?? [];
    if (!filter) return all;
    const q = filter.toLowerCase();
    return all.filter(
      (s) => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
    );
  }, [services, filter]);

  const runDryRun = async (id: string) => {
    setRunning(id);
    const t0 = performance.now();
    try {
      // 只读探测: GET manifest (非执行面)
      const probeUrl = `/api/v1/observatory/query?operation=entity&id=${encodeURIComponent(id)}`;
      const res = await fetch(probeUrl);
      const latency = Math.round(performance.now() - t0);
      setDryRunResults((prev) => ({
        ...prev,
        [id]: { id, httpStatus: res.status, latencyMs: latency, error: null },
      }));
    } catch (e) {
      setDryRunResults((prev) => ({
        ...prev,
        [id]: { id, httpStatus: null, latencyMs: null, error: String(e).slice(0, 80) },
      }));
    } finally {
      setRunning(null);
    }
  };

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
        {filtered.length} / {services?.length ?? 0} 个服务
      </p>
      <table>
        <thead>
          <tr>
            <th>服务</th>
            <th>标题</th>
            <th>Dry-run</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 50).map((s) => {
            const dr = dryRunResults[s.id];
            return (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.title}</td>
                <td>
                  <button
                    type="button"
                    disabled={running === s.id}
                    onClick={() => runDryRun(s.id)}
                  >
                    {running === s.id ? '…' : 'Probe'}
                  </button>
                </td>
                <td>
                  {dr
                    ? dr.error
                      ? `ERR: ${dr.error}`
                      : `${dr.httpStatus} / ${dr.latencyMs}ms`
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length > 50 && <p>… 其余 {filtered.length - 50} 条略</p>}
    </div>
  );
}
