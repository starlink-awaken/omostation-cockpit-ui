/**
 * ⌘K 全局命令面板组件 (BET-Y1Q4-T8-24B).
 *
 * 纯逻辑见 commandPaletteCore.ts (react-refresh 要求组件文件只导出组件)。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useCommandPaletteStore,
  buildCommandItems,
  fuzzyFilter,
} from './commandPaletteCore';

export function CommandPalette({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { open, setOpen, query, setQuery } = useCommandPaletteStore();
  const [items] = useState(buildCommandItems());
  const filtered = useMemo(() => fuzzyFilter(items, query), [items, query]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="全局命令面板"
      style={{
        position: 'fixed', inset: '10% auto auto 50%', transform: 'translateX(-50%)',
        width: 560, maxHeight: '60vh', overflow: 'auto', zIndex: 1000,
        background: 'var(--bg-elevated, #1a1a2e)', border: '1px solid #333', borderRadius: 8,
        padding: 12,
      }}
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="检索页面 / 能力 / BOS 服务…"
        style={{ width: '100%', padding: 8, fontSize: 14, marginBottom: 8 }}
      />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {filtered.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                item.action();
                onNavigate?.(item.id);
                setOpen(false);
              }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px' }}
            >
              <strong>{item.title}</strong>
              <span style={{ opacity: 0.6, marginLeft: 8, fontSize: 12 }}>{item.group}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li style={{ padding: 8, opacity: 0.6 }}>无匹配结果</li>}
      </ul>
    </div>
  );
}
