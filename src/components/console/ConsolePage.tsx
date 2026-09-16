/**
 * ConsolePage — 交互式控制平面主页面.
 *
 * Three tabs: BOS | MOF | Harness
 * URL ?tab= param sync.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SquareTerminal, Terminal, ShieldCheck, Workflow, Activity } from 'lucide-react';
import { useBosCatalog, useBosSchema, useBosHistory, useBosInvoke, useMofRules, useMofAudit, useMofEvaluate } from '../../api/hooks/console';
import type { BosInvokeRequest, MofViolation } from '../../api/console/types';

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
        <MofConsoleTab />
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

// ── MOF Tab ──────────────────────────────────────────────────

function MofConsoleTab() {
  const [activeSub, setActiveSub] = useState<'audit' | 'evaluate' | 'rules' | 'value'>('audit');
  const audit = useMofAudit();
  const evaluate = useMofEvaluate();
  const rules = useMofRules();

  const [evalForm, setEvalForm] = useState({
    constraint_id: '',
    target: '',
    target_kind: 'python_code' as 'python_code' | 'write' | 'command',
  });

  const [auditResult, setAuditResult] = useState<MofViolation[] | null>(null);
  const [auditDegraded, setAuditDegraded] = useState(false);
  const [evalResult, setEvalResult] = useState<{ passed: boolean; violations: MofViolation[] } | null>(null);

  const handleAudit = useCallback(async () => {
    try {
      const result = await audit.mutateAsync();
      setAuditResult(result.violations);
      setAuditDegraded(result.degraded);
    } catch (e) {
      setAuditResult(null);
      setAuditDegraded(true);
      console.error('Audit failed:', e);
    }
  }, [audit]);

  const handleEvaluate = useCallback(async () => {
    if (!evalForm.constraint_id || !evalForm.target) return;
    try {
      const result = await evaluate.mutateAsync(evalForm);
      setEvalResult(result);
    } catch (e) {
      console.error('Evaluate failed:', e);
    }
  }, [evalForm, evaluate]);

  const subs: { id: typeof activeSub; label: string }[] = [
    { id: 'audit', label: '全量审计' },
    { id: 'evaluate', label: '单约束验证' },
    { id: 'rules', label: '规则目录' },
    { id: 'value', label: '价值循环' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b">
        {subs.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSub(s.id)}
            className={`px-3 py-1.5 text-sm border-b-2 transition-colors ${
              activeSub === s.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Audit Panel */}
      {activeSub === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAudit}
              disabled={audit.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
            >
              {audit.isPending ? '审计中...' : '开始全量审计'}
            </button>
            {audit.isPending && <span className="text-sm text-muted-foreground">子进程扫描中，可能需要数分钟...</span>}
          </div>

          {auditDegraded && !audit.isPending && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
              MOF 审计不可用 — ecos 子模块可能未初始化
            </div>
          )}

          {auditResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">
                  {auditResult.length === 0 ? '✅ 无违规' : `❌ ${auditResult.length} 处违规`}
                </span>
              </div>
              {auditResult.length > 0 && (
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">Severity</th>
                        <th className="px-3 py-2 text-left">Message</th>
                        <th className="px-3 py-2 text-left">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditResult.map((v, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5 font-mono text-xs">{v.constraint_id}</td>
                          <td className="px-3 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              v.severity === 'error' ? 'bg-red-100 text-red-700'
                              : v.severity === 'warning' ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>{v.severity}</span>
                          </td>
                          <td className="px-3 py-1.5 text-xs">{v.message}</td>
                          <td className="px-3 py-1.5 text-xs font-mono truncate max-w-48">{v.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Evaluate Panel */}
      {activeSub === 'evaluate' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Constraint ID</label>
              <input
                type="text"
                value={evalForm.constraint_id}
                onChange={(e) => setEvalForm({ ...evalForm, constraint_id: e.target.value })}
                placeholder="e.g. CR-SFOP-003"
                className="w-full px-3 py-2 mt-1 border rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target</label>
              <input
                type="text"
                value={evalForm.target}
                onChange={(e) => setEvalForm({ ...evalForm, target: e.target.value })}
                placeholder="e.g. projects/omo/src/..."
                className="w-full px-3 py-2 mt-1 border rounded-md text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Target Kind</label>
            <select
              value={evalForm.target_kind}
              onChange={(e) => setEvalForm({ ...evalForm, target_kind: e.target.value as 'python_code' | 'write' | 'command' })}
              className="w-full px-3 py-2 mt-1 border rounded-md text-sm"
            >
              <option value="python_code">Python Code (AST)</option>
              <option value="write">Write Path (boundary)</option>
              <option value="command">Command (safety)</option>
            </select>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={!evalForm.constraint_id || !evalForm.target || evaluate.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
          >
            {evaluate.isPending ? '评估中...' : '执行评估'}
          </button>

          {evalResult && (
            <div className={`p-3 rounded-md border ${evalResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="font-medium text-sm">
                {evalResult.passed ? '✅ 通过' : '❌ 未通过'}
              </div>
              {evalResult.violations.length > 0 && (
                <ul className="mt-2 text-sm space-y-1">
                  {evalResult.violations.map((v, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-mono">{v.constraint_id}</span>: {v.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rules Panel */}
      {activeSub === 'rules' && (
        <div className="space-y-2">
          {rules.isLoading && <p className="text-sm text-muted-foreground">加载规则目录...</p>}
          {rules.error && <p className="text-sm text-destructive">规则目录不可用</p>}
          {rules.data && (
            <div className="max-h-96 overflow-y-auto border rounded-md">
              {Object.entries(rules.data.families || {}).map(([fam, info]) => (
                <details key={fam} className="border-b">
                  <summary className="px-3 py-2 text-sm cursor-pointer hover:bg-muted/50">
                    <span className="font-mono">{fam}</span> — {info.count} 条
                  </summary>
                  <div className="px-3 py-1 space-y-1">
                    {info.rules.map((r: { id: string; dimension: string }, i: number) => (
                      <div key={i} className="text-xs flex gap-2">
                        <span className="font-mono">{r.id}</span>
                        <span className="text-muted-foreground">{r.dimension}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Value Loop Panel */}
      {activeSub === 'value' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={16} />
            <span className="font-medium text-sm">价值循环 5 阶段</span>
          </div>
          <p className="text-sm text-muted-foreground">
            信号感知 → 信号分类 → 旅程执行 → 价值记录 → 进化反馈
          </p>
          <p className="text-xs text-muted-foreground">
            价值循环执行引擎将在 V2 实现。当前版本仅提供可视化投影。
          </p>
        </div>
      )}
    </div>
  );
}
