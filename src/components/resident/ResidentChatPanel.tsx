import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Cpu,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiDelete } from '../../api/client';

export interface ChatMetadata {
  target_node?: string;
  target_host?: string;
  target_port?: number;
  tier?: string;
  latency_ms?: number;
  fallback_used?: boolean;
  model_used?: string;
  recalled_memories?: Array<{
    id?: string;
    domain?: string;
    directive?: string;
    confidence?: number;
    source?: string;
  }>;
  recalled_pitfalls?: Array<{
    id?: string;
    title?: string;
    rule?: string;
    source?: string;
  }>;
  react_tools_used?: string[];
}

export interface ChatMessageItem {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: ChatMetadata;
}

interface ChatHistoryResponse {
  ok: boolean;
  session_id: string;
  messages: ChatMessageItem[];
  error?: string;
}

interface ChatSendResponse {
  ok: boolean;
  message: ChatMessageItem;
  error?: string;
}

const QUICK_PROMPTS = [
  '查询系统当前全景健康度与运行态势',
  '检查是否有未解除的治理拦截或系统告警',
  '探查 MBP 128G 与 MacMini 双机算力拓扑负载',
  '回顾最新提炼的工程偏好与避坑规则',
];

export default function ResidentChatPanel(): React.ReactElement {
  const queryClient = useQueryClient();
  const [sessionId] = useState<string>('default');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('tier2_dialog');
  const [expandedCapsules, setExpandedCapsules] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 获取历史记录
  const { data: historyData, isLoading } = useQuery<ChatHistoryResponse>({
    queryKey: ['resident-chat-history', sessionId],
    queryFn: async () => {
      const res = await apiFetch<ChatHistoryResponse>(`/api/resident/chat/history?session_id=${sessionId}&limit=50`);
      return res.ok && res.data ? res.data : { ok: false, session_id: sessionId, messages: [] };
    },
    refetchInterval: 10000,
  });

  const messages = historyData?.messages || [];

  // 自动滚动至底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. 发送对话 Mutation
  const sendMutation = useMutation<ChatSendResponse, Error, string>({
    mutationFn: async (promptText: string) => {
      const res = await apiPost<ChatSendResponse>('/api/resident/chat', {
        prompt: promptText,
        session_id: sessionId,
        tier: selectedTier,
        enable_react: true,
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error || '发送失败');
      }
      return res.data;
    },
    onSuccess: () => {
      setInputPrompt('');
      queryClient.invalidateQueries({ queryKey: ['resident-chat-history', sessionId] });
    },
  });

  // 3. 清空会话 Mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiDelete(`/api/resident/chat/history?session_id=${sessionId}`);
      if (!res.ok) {
        throw new Error(res.error || '清空失败');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident-chat-history', sessionId] });
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleCapsule = (idx: number) => {
    setExpandedCapsules((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex flex-col h-[720px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl" data-testid="resident-chat-panel">
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">常驻首席认知 Agent 对话终端</h3>
              <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Session: {sessionId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              跨会话状态保持 · 情境化记忆深度注水 · 算力网关智能分层
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>算力分层:</span>
            <select
              aria-label="选择算力分层"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-indigo-500"
            >
              <option value="tier1_inspection">Tier 1 (轻量巡检/哨兵)</option>
              <option value="tier2_dialog">Tier 2 (人机对话标准)</option>
              <option value="tier3_deep">Tier 3 (深度重推理/旗舰)</option>
            </select>
          </div>

          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded transition disabled:opacity-40"
            title="清空当前会话历史"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空会话</span>
          </button>
        </div>
      </div>

      {/* 消息气泡流区域 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4" role="log" aria-live="polite">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>正在连接常驻长效会话...</span>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 bg-slate-800/80 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-700/50">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <h4 className="text-slate-200 font-medium text-sm mb-1">开始与常驻大脑对话</h4>
            <p className="text-slate-400 text-xs max-w-md mb-6">
              常驻 Agent 实时感知全局架构与硬件拓扑，自动召回夜巡沉淀的工程偏好与避坑规则。
            </p>

            {/* 快捷问答卡片建议 */}
            <div className="grid grid-cols-2 gap-2.5 max-w-xl w-full">
              {QUICK_PROMPTS.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(promptText)}
                  className="flex items-center gap-2 p-3 text-left text-xs text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 rounded-lg transition group"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="line-clamp-2">{promptText}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const meta = msg.metadata || {};
          const recalledMem = meta.recalled_memories || [];
          const recalledPit = meta.recalled_pitfalls || [];
          const toolsUsed = meta.react_tools_used || [];
          const hasCognition = recalledMem.length > 0 || recalledPit.length > 0 || toolsUsed.length > 0;
          const isExpanded = !!expandedCapsules[idx];

          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className="flex items-start gap-2.5">
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* 算力路由与响应指标徽章 */}
                  {!isUser && meta.target_node && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-700/50 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/40">
                        <Cpu className="w-3 h-3 text-indigo-400" />
                        {meta.target_node}
                      </span>
                      <span>{meta.model_used || 'default-model'}</span>
                      <span>·</span>
                      <span>{meta.latency_ms || 0}ms</span>
                      {meta.fallback_used && (
                        <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          自愈降级
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* 记忆召回认知折叠胶囊 (Q2 决议) */}
              {!isUser && hasCognition && (
                <div className="ml-10 mt-1.5 max-w-xl">
                  <button
                    onClick={() => toggleCapsule(idx)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full transition"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>
                      记忆注水 ({recalledMem.length}项偏好 · {recalledPit.length}项避坑
                      {toolsUsed.length > 0 ? ` · ${toolsUsed.length}项探针` : ''})
                    </span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-2.5 shadow-lg">
                      {recalledMem.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 text-indigo-400 font-semibold mb-1">
                            <Sparkles className="w-3 h-3" />
                            <span>情境化长效工程偏好:</span>
                          </div>
                          <ul className="space-y-1 pl-4 list-disc text-slate-300">
                            {recalledMem.map((m, mIdx) => (
                              <li key={mIdx}>
                                <span className="font-mono text-indigo-300">[{m.domain}]</span> {m.directive}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recalledPit.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 text-amber-400 font-semibold mb-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>主权避坑与防御约束:</span>
                          </div>
                          <ul className="space-y-1 pl-4 list-disc text-slate-300">
                            {recalledPit.map((p, pIdx) => (
                              <li key={pIdx}>
                                <span className="text-amber-300 font-medium">{p.title}:</span> {p.rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {toolsUsed.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-1">
                            <Zap className="w-3 h-3" />
                            <span>现场 ReAct 只读探针:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pl-2">
                            {toolsUsed.map((t, tIdx) => (
                              <span key={tIdx} className="font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                                {t}()
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sendMutation.isPending && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>常驻首席认知 Agent 正在检索记忆、调度算力与探针...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入框 */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80">
        <div className="flex gap-2">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的指令或问答 (按 Enter 发送，Shift+Enter 换行)..."
            rows={2}
            className="flex-1 bg-slate-900 border border-slate-700/70 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || sendMutation.isPending}
            className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            {sendMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
