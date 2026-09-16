/**
 * ConsolePage — 交互式控制平面主页面.
 *
 * Three tabs: BOS | MOF | Harness
 * URL ?tab= param sync.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SquareTerminal, Terminal, ShieldCheck, Workflow } from 'lucide-react';

type ConsoleTab = 'bos' | 'mof' | 'harness';

interface ConsolePageProps {
  initialTab?: ConsoleTab;
  initialUri?: string;
}

export default function ConsolePage({ initialTab = 'bos', initialUri }: ConsolePageProps) {
  const [activeTab, setActiveTab] = useState<ConsoleTab>(initialTab);
  const [selectedUri, setSelectedUri] = useState<string | undefined>(initialUri);

  // Sync with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ConsoleTab | null;
    const uri = params.get('uri') as string | null;
    if (tab) setActiveTab(tab);
    if (uri) setSelectedUri(uri);
  }, []);

  const switchTab = useCallback((tab: ConsoleTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const tabs: { id: ConsoleTab; label: string; icon: React.ReactNode }[] = [
    { id: 'bos', label: 'BOS 调用', icon: <Terminal size={16} /> },
    { id: 'mof', label: 'MOF 校验', icon: <ShieldCheck size={16} /> },
    { id: 'harness', label: 'Harness 运行', icon: <Workflow size={16} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SquareTerminal className="text-primary" size={24} />
        <h1 className="text-2xl font-bold">控制台</h1>
        <span className="text-sm text-muted-foreground">
          交互式控制平面 — BOS 调用 / MOF 校验 / Harness 运行
        </span>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'bos' && (
        <BosConsoleTab initialUri={selectedUri} />
      )}
      {activeTab === 'mof' && (
        <div className="text-muted-foreground">MOF 控制台 — M2 实现中</div>
      )}
      {activeTab === 'harness' && (
        <div className="text-muted-foreground">Harness 控制台 — M3 实现中</div>
      )}
    </div>
  );
}

// ── BOS Tab ──────────────────────────────────────────────────

function BosConsoleTab({ initialUri }: { initialUri?: string }) {
  return <BosRepl initialUri={initialUri} />;
}

// ── BOS REPL ─────────────────────────────────────────────────

const HISTORY_KEY = 'cockpit.console.bos.history';
const HISTORY_MAX = 200;

interface ReplEntry {
  input: string;
  result: unknown;
  error: string | null;
  elapsed_ms: number | null;
  timestamp: string;
}

function loadHistory(): ReplEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: ReplEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-HISTORY_MAX)));
  } catch {
    // storage full or unavailable
  }
}

function BosRepl({ initialUri }: { initialUri?: string }) {
  const [input, setInput] = useState(initialUri ?? '');
  const [history, setHistory] = useState<ReplEntry[]>(loadHistory);
  const [histIndex, setHistIndex] = useState(-1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBody, setPendingBody] = useState<BosInvokeRequest | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const invoke = useBosInvoke();

  const execute = useCallback(
    async (body: BosInvokeRequest, token?: string) => {
      const entry: ReplEntry = {
        input: `bos://${body.uri.removeprefix('bos://')} ${JSON.stringify(body.arguments)}`,
        result: null,
        error: null,
        elapsed_ms: null,
        timestamp: new Date().toISOString(),
      };
      try {
        const result = await invoke.mutateAsync({ request: body, confirmToken: token });
        entry.result = result;
        entry.elapsed_ms = result.elapsed_ms;
      } catch (e) {
        entry.error = e instanceof Error ? e.message : String(e);
      }
      setHistory((prev) => {
        const next = [...prev, entry];
        saveHistory(next);
        return next;
      });
      setHistIndex(-1);
    },
    [invoke],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    let body: BosInvokeRequest;
    try {
      // Try parsing as "bos://uri {json}" or just "bos://uri" or pure JSON
      if (trimmed.startsWith('bos://')) {
        const parts = trimmed.split(' ', 2);
        const uri = parts[0];
        const argsStr = parts[1] ?? '{}';
        const args = argsStr ? JSON.parse(argsStr) : {};
        body = { uri, arguments: args };
      } else {
        body = JSON.parse(trimmed);
        if (!body.uri || !body.uri.startsWith('bos://')) {
          throw new Error('Must be a bos:// URI or JSON with uri field');
        }
      }
    } catch (e) {
      const entry: ReplEntry = {
        input: trimmed,
        result: null,
        error: e instanceof Error ? e.message : String(e),
        elapsed_ms: null,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => {
        const next = [...prev, entry];
        saveHistory(next);
        return next;
      });
      return;
    }

    const risk = classifyRisk(body.uri);
    if (risk === 'write' || risk === 'dangerous') {
      setPendingBody(body);
      setConfirmInput('');
      setConfirmOpen(true);
    } else {
      void execute(body);
    }
    setInput('');
  }, [input, execute]);

  const handleConfirm = useCallback(() => {
    if (!pendingBody || confirmInput !== pendingBody.uri) return;
    const token = generateConfirmToken(pendingBody);
    setConfirmOpen(false);
    void execute(pendingBody, token);
  }, [pendingBody, confirmInput, execute]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (e.key === 'ArrowUp' && history.length > 0) {
        e.preventDefault();
        const idx = histIndex === -1 ? history.length - 1 : Math.max(0, histIndex - 1);
        setHistIndex(idx);
        setInput(history[idx].input);
      }
      if (e.key === 'ArrowDown' && histIndex > -1) {
        e.preventDefault();
        const idx = histIndex + 1;
        if (idx >= history.length) {
          setHistIndex(-1);
          setInput('');
        } else {
          setHistIndex(idx);
          setInput(history[idx].input);
        }
      }
    },
    [history, histIndex, handleSubmit],
  );

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='输入 bos:// URI，如 bos://system/health 或 bos://memory/mos/write {"content":"test"}'
          className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
          spellCheck={false}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || invoke.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
        >
          {invoke.isPending ? '执行中...' : '执行'}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Ctrl+Enter 执行 | ↑/↓ 翻阅历史 | 输入格式: bos://URI {"{\"key\":val}"} 或纯 JSON
      </p>

      {/* Output */}
      {history.length > 0 && (
        <div className="space-y-2">
          {history.slice(-20).reverse().map((entry, i) => (
            <div key={i} className="border rounded-md p-3 text-sm font-mono bg-muted/30">
              <div className="flex justify-between items-start gap-4">
                <div className="text-xs text-muted-foreground">{entry.timestamp}</div>
                <div className="text-xs">
                  {entry.elapsed_ms != null && <span>{entry.elapsed_ms}ms</span>}
                </div>
              </div>
              <div className="text-foreground mt-1">
                <span className="text-primary">&gt;</span> {entry.input}
              </div>
              {entry.error ? (
                <div className="text-destructive mt-1">{entry.error}</div>
              ) : (
                <pre className="text-xs mt-1 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(entry.result, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <SquareTerminal className="mx-auto mb-2 opacity-50" size={32} />
          <p>输入 BOS URI 开始调用</p>
          <p className="text-xs mt-1">示例: bos://system/health</p>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && pendingBody && (
        <ConfirmDialog
          uri={pendingBody.uri}
          confirmInput={confirmInput}
          onConfirmChange={setConfirmInput}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
          risk={classifyRisk(pendingBody.uri)}
        />
      )}
    </div>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────

function ConfirmDialog({
  uri,
  confirmInput,
  onConfirmChange,
  onConfirm,
  onCancel,
  risk,
}: {
  uri: string;
  confirmInput: string;
  onConfirmChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  risk: string;
}) {
  const canConfirm = confirmInput === uri;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-background border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${risk === 'dangerous' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <h3 className="font-semibold">
            {risk === 'dangerous' ? '高危操作确认' : '写入操作确认'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          此操作有副作用。请逐字输入以下 URI 以确认执行:
        </p>
        <code className="block text-xs bg-muted p-2 rounded mb-3 break-all">{uri}</code>
        <input
          type="text"
          value={confirmInput}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="输入 URI 确认..."
          className="w-full px-3 py-2 border rounded-md text-sm font-mono mb-3"
          spellCheck={false}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-md text-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              canConfirm
                ? risk === 'dangerous'
                  ? 'bg-red-600 text-white'
                  : 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            确认执行
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Risk classification (frontend mirror) ────────────────────

function classifyRisk(uri: string): string {
  try {
    const rest = uri.replace('bos://', '');
    const parts = rest.split('/');
    if (parts.length < 2) return 'read';
    const domain = parts[0];
    const action = parts[parts.length - 1].toLowerCase();

    if (domain === 'harness') return 'dangerous';

    const dangerous = ['enforce', 'delete', 'trip', 'reset', 'closeout', 'sign', 'sediment'];
    for (const kw of dangerous) {
      if (action.includes(kw)) return 'dangerous';
    }

    const write = ['write', 'put', 'create', 'submit', 'run', 'infer', 'compile', 'trigger', 'patch', 'challenge', 'inject'];
    for (const kw of write) {
      if (action.includes(kw)) return 'write';
    }

    return 'read';
  } catch {
    return 'read';
  }
}

// ── Confirm token generation (frontend mirror) ───────────────

function generateConfirmToken(body: BosInvokeRequest): string {
  // Simplified: just use uri + body hash approximation
  // The server will validate the exact token; this is for the dialog UI
  // In production, we need a proper sha256 implementation
  const bodyStr = JSON.stringify({ uri: body.uri, arguments: body.arguments, timeout_ms: body.timeout_ms ?? 30000 });
  // Use a simple hash for now - the server does the real validation
  let hash = 0;
  for (let i = 0; i < bodyStr.length; i++) {
    const char = bodyStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${body.uri}:${Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16)}`;
}
