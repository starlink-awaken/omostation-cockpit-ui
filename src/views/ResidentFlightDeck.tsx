/**
 * ResidentFlightDeck — 四维透明指挥舱 (BET-Y1Q4-T8-23).
 *
 * 四维: 心跳健康 / 任务 DAG 流水 / 算力显存遥测 / 人工熔断介入.
 * 数据: 消费 /api/flight-deck/snapshot 端点.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

interface AuthorizationDecision {
  action: string;
  risk_tier: number;
  risk_tier_label: string;
  confidence: number;
  band: string;
  allowed: boolean;
  reason: string;
  requires_human_approval: boolean;
  timestamp: number;
}

interface HeartbeatStatus {
  agent_id: string;
  last_heartbeat: number;
  alive: boolean;
  latency_ms: number;
}

interface TaskDAGNode {
  task_id: string;
  label: string;
  status: string;
  parent_ids: string[];
}

interface ComputeTelemetry {
  device: string;
  gpu_utilization: number;
  vram_used_mb: number;
  vram_total_mb: number;
  vram_usage_pct: number;
  temperature_c: number;
}

interface FlightDeckSnapshot {
  heartbeats: HeartbeatStatus[];
  task_dag: TaskDAGNode[];
  compute: ComputeTelemetry[];
  recent_decisions: AuthorizationDecision[];
}

const TIER_COLORS: Record<number, string> = {
  1: '#22c55e', // green
  2: '#eab308', // yellow
  3: '#f97316', // orange
  4: '#ef4444', // red
};

const STATUS_LABEL: Record<string, string> = {
  pending: '待执行',
  running: '运行中',
  done: '已完成',
  failed: '失败',
  blocked: '受阻',
};

export default function ResidentFlightDeck() {
  const [snapshot, setSnapshot] = useState<FlightDeckSnapshot | null>(null);
  const [circuitTripped, setCircuitTripped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSnapshot = useCallback(async () => {
    try {
      const data = await apiFetch<{ ok: boolean; circuit_tripped: boolean; snapshot: FlightDeckSnapshot }>(
        '/api/flight-deck/snapshot',
      );
      if (data?.ok) {
        setSnapshot(data.snapshot);
        setCircuitTripped(data.circuit_tripped);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadSnapshot();
    const interval = setInterval(loadSnapshot, 5000);
    return () => clearInterval(interval);
  }, [loadSnapshot]);

  const handleTrip = async () => {
    try {
      await apiFetch('/api/flight-deck/circuit/trip', { method: 'POST' });
      setCircuitTripped(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleReset = async () => {
    try {
      await apiFetch('/api/flight-deck/circuit/reset', { method: 'POST' });
      setCircuitTripped(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) {
    return <div className="flight-deck-loading">加载 Flight Deck 快照...</div>;
  }

  return (
    <div className="flight-deck">
      <header className="flight-deck-header">
        <h2>Resident Flight Deck</h2>
        <div className="circuit-breaker-status" style={{ color: circuitTripped ? '#ef4444' : '#22c55e' }}>
          {circuitTripped ? '🔴 熔断已触发' : '🟢 系统正常'}
        </div>
        <div className="circuit-controls">
          <button onClick={handleTrip} disabled={circuitTripped} className="btn-danger">
            紧急熔断
          </button>
          <button onClick={handleReset} disabled={!circuitTripped} className="btn-primary">
            复位
          </button>
        </div>
      </header>

      {error && <div className="flight-deck-error">{error}</div>}

      {!snapshot ? (
        <div>无数据</div>
      ) : (
        <div className="flight-deck-grid">
          {/* 心跳健康 */}
          <section className="panel">
            <h3>心跳健康</h3>
            {snapshot.heartbeats.map((hb) => (
              <div key={hb.agent_id} className="heartbeat-row">
                <span className={hb.alive ? 'alive' : 'dead'}>
                  {hb.alive ? '🟢' : '🔴'} {hb.agent_id}
                </span>
                <span>{hb.latency_ms.toFixed(0)}ms</span>
              </div>
            ))}
          </section>

          {/* 任务 DAG */}
          <section className="panel">
            <h3>任务 DAG</h3>
            {snapshot.task_dag.map((node) => (
              <div key={node.task_id} className="dag-node">
                <span className={`status-badge status-${node.status}`}>
                  {STATUS_LABEL[node.status] ?? node.status}
                </span>
                <span>{node.label}</span>
              </div>
            ))}
          </section>

          {/* 算力遥测 */}
          <section className="panel">
            <h3>算力显存</h3>
            {snapshot.compute.map((c) => (
              <div key={c.device} className="compute-row">
                <span className="device">{c.device}</span>
                <div className="vram-bar">
                  <div
                    className="vram-fill"
                    style={{ width: `${(c.vram_usage_pct * 100).toFixed(1)}%` }}
                  />
                </div>
                <span>{c.vram_used_mb.toFixed(0)}/{c.vram_total_mb.toFixed(0)} MB</span>
                <span>{c.temperature_c.toFixed(0)}°C</span>
              </div>
            ))}
          </section>

          {/* 最近决策 */}
          <section className="panel">
            <h3>授权决策</h3>
            {snapshot.recent_decisions.length === 0 ? (
              <div className="no-decisions">暂无决策记录</div>
            ) : (
              <div className="decisions-list">
                {snapshot.recent_decisions.slice(-10).reverse().map((d, i) => (
                  <div key={i} className="decision-row" style={{ borderLeftColor: TIER_COLORS[d.risk_tier] }}>
                    <span className="action">{d.action}</span>
                    <span className="tier" style={{ color: TIER_COLORS[d.risk_tier] }}>
                      {d.risk_tier_label}
                    </span>
                    <span className="confidence">{(d.confidence * 100).toFixed(0)}%</span>
                    <span className={d.allowed ? 'allowed' : 'blocked'}>
                      {d.allowed ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
