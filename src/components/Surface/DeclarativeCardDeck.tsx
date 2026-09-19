import React, { useState } from 'react';
import {
  Activity,
  Table,
  Terminal,
  Sliders,
  GitFork,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import type {
  ActionButton,
  CardType,
  DataTablePayload,
  DeclarativeCard,
  ExtensionManifestData,
  LogStreamPayload,
  MetricCell,
  MetricGridPayload,
  TableColumn,
} from './types';

export interface DeclarativeCardDeckProps {
  manifest?: ExtensionManifestData;
  cards?: DeclarativeCard[];
  title?: string;
  domain?: string;
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
}

function MetricGridRenderer({ card }: { card: DeclarativeCard }) {
  const data = (card.static_data || card.payload || {}) as MetricGridPayload;
  const cells: MetricCell[] = data.cells || data.metrics || [];

  return (
    <div
      data-testid={`card-${card.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {cells.map((cell, idx) => {
        const isWarn =
          cell.status === 'warning' ||
          (typeof cell.warn_threshold === 'number' &&
            typeof cell.value === 'number' &&
            cell.value >= cell.warn_threshold);

        return (
          <div
            key={`${cell.label}-${idx}`}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--antd-radius-md, 8px)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: isWarn
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                className="text-muted"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {cell.label}
              </span>
              {cell.trend === 'up' && (
                <TrendingUp size={14} style={{ color: '#10b981' }} />
              )}
              {cell.trend === 'down' && (
                <TrendingDown size={14} style={{ color: '#ef4444' }} />
              )}
              {cell.trend === 'neutral' && (
                <Minus size={14} style={{ color: '#94a3b8' }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>
                {cell.value}
              </span>
              {cell.unit && (
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {cell.unit}
                </span>
              )}
            </div>
            {cell.description && (
              <span
                className="text-muted"
                style={{ fontSize: 11, lineHeight: 1.4 }}
              >
                {cell.description}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DataTableRenderer({ card }: { card: DeclarativeCard }) {
  const data = (card.static_data || card.payload || {}) as DataTablePayload;
  const rawColumns = data.columns || [];
  const rows = data.rows || [];

  const columns: TableColumn[] = rawColumns.map((c, i) =>
    typeof c === 'string'
      ? { key: c, label: c }
      : { key: c.key || `col_${i}`, label: c.label || c.key || `col_${i}` }
  );

  return (
    <div
      data-testid={`card-${card.id}`}
      style={{ overflowX: 'auto', borderRadius: 'var(--antd-radius-md, 8px)' }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          textAlign: 'left',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '8px 12px',
                  fontWeight: 600,
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length || 1}
                style={{
                  padding: 16,
                  textAlign: 'center',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                暂无数据
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background:
                    rIdx % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}
                  >
                    {String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionPanelRenderer({
  card,
  onAction,
}: {
  card: DeclarativeCard;
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
}) {
  const data = card.static_data || card.payload || {};
  const actions: ActionButton[] = data.actions || [];
  const description = data.description || card.title;
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const handleActionClick = (btn: ActionButton) => {
    if (btn.confirm && confirmedId !== btn.id) {
      setConfirmedId(btn.id);
      return;
    }
    setConfirmedId(null);
    onAction?.(btn.id, btn.payload);
  };

  return (
    <div
      data-testid={`card-${card.id}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {description && (
        <p
          className="text-muted"
          style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}
        >
          {description}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {actions.map((btn) => {
          const isConfirming = confirmedId === btn.id;
          const isDanger = btn.variant === 'danger';
          const isPrimary = btn.variant === 'primary';

          let bg = 'rgba(255, 255, 255, 0.06)';
          let color = 'inherit';
          let border = '1px solid rgba(255, 255, 255, 0.12)';

          if (isDanger) {
            bg = isConfirming
              ? '#dc2626'
              : 'rgba(239, 68, 68, 0.15)';
            color = '#fca5a5';
            border = '1px solid rgba(239, 68, 68, 0.4)';
          } else if (isPrimary) {
            bg = 'rgba(59, 130, 246, 0.2)';
            color = '#93c5fd';
            border = '1px solid rgba(59, 130, 246, 0.4)';
          }

          return (
            <button
              key={btn.id}
              type="button"
              disabled={btn.disabled}
              onClick={() => handleActionClick(btn)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--antd-radius-md, 6px)',
                background: bg,
                color: color,
                border: border,
                cursor: btn.disabled ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                opacity: btn.disabled ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {isConfirming ? (
                <>
                  <AlertTriangle size={14} />
                  <span>确认: {btn.label}？</span>
                </>
              ) : (
                <span>{btn.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LogStreamRenderer({ card }: { card: DeclarativeCard }) {
  const data = (card.static_data || card.payload || {}) as LogStreamPayload;
  const lines = data.lines || [];

  return (
    <div
      data-testid={`card-${card.id}`}
      style={{
        background: '#0d1117',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--antd-radius-md, 8px)',
        padding: '12px 16px',
        maxHeight: 240,
        overflowY: 'auto',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        color: '#e6edf3',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {lines.length === 0 ? (
        <span style={{ color: '#8b949e' }}>[无日志流记录]</span>
      ) : (
        lines.map((line, idx) => (
          <div key={idx} style={{ wordBreak: 'break-all' }}>
            <span style={{ color: '#58a6ff', marginRight: 8 }}>{`>`}</span>
            {line}
          </div>
        ))
      )}
    </div>
  );
}

const TYPE_ICONS: Record<CardType, React.ReactNode> = {
  metric_grid: <Activity size={16} />,
  data_table: <Table size={16} />,
  action_panel: <Sliders size={16} />,
  log_stream: <Terminal size={16} />,
  dag_graph: <GitFork size={16} />,
};

export function DeclarativeCardDeck({
  manifest,
  cards: directCards,
  title,
  domain,
  onAction,
}: DeclarativeCardDeckProps) {
  const cards = directCards || manifest?.cards || [];
  const displayTitle = title || manifest?.title || '声明式扩展甲板';
  const displayDomain = domain || manifest?.domain;
  const description = manifest?.description;

  return (
    <section
      data-testid="declarative-card-deck"
      className="declarative-card-deck antd-card"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        borderRadius: 'var(--antd-radius-lg, 12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 17, margin: 0, fontWeight: 600 }}>
              {displayTitle}
            </h2>
            {displayDomain && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                {displayDomain}
              </span>
            )}
          </div>
          {description && (
            <p
              className="text-muted"
              style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5 }}
            >
              {description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={15} style={{ color: '#10b981' }} />
          <span className="text-muted" style={{ fontSize: 12 }}>
            {cards.length} 张卡片挂载
          </span>
        </div>
      </div>

      {/* Cards List / Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cards.map((card) => {
          const icon = TYPE_ICONS[card.type] || <Activity size={16} />;

          return (
            <article
              key={card.id}
              style={{
                padding: 16,
                borderRadius: 'var(--antd-radius-md, 8px)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: 'var(--primary-color, #3b82f6)' }}>
                  {icon}
                </span>
                <strong style={{ fontSize: 14 }}>{card.title}</strong>
                <span
                  className="text-muted"
                  style={{ fontSize: 11, marginLeft: 'auto' }}
                >
                  ID: {card.id}
                </span>
              </div>

              {card.type === 'metric_grid' && <MetricGridRenderer card={card} />}
              {card.type === 'data_table' && <DataTableRenderer card={card} />}
              {card.type === 'action_panel' && (
                <ActionPanelRenderer card={card} onAction={onAction} />
              )}
              {card.type === 'log_stream' && <LogStreamRenderer card={card} />}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default DeclarativeCardDeck;
