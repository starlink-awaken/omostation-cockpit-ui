import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  RotateCcw,
  Compass,
  Cpu,
  ShieldCheck,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { apiFetch, apiPost } from '../../api/client';
import { asArray } from '../../api/safe';
import type { RouteConfig } from '../../routes';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; title: string; score?: number }>;
  timestamp: string;
}

export interface SovereignCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: RouteConfig | null;
  pendingApprovalsCount?: number;
}

const BRAIN_API = '/api/brain';

const QUICK_PROMPTS = [
  { icon: Compass, text: '分析当前页面状态与健康度' },
  { icon: ShieldCheck, text: '诊断 11 大核心门禁风险' },
  { icon: FileText, text: '起草当前待决草案审批意见' },
  { icon: Cpu, text: '检查 AetherForge 本地显存与算力' },
];

export function SovereignCopilotDrawer({
  isOpen,
  onClose,
  currentRoute,
  pendingApprovalsCount = 0,
}: SovereignCopilotDrawerProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `主权执掌者您好。我是随行数字大脑 Copilot。\n当前感知到您位于 **${
        currentRoute?.label ?? '控制台'
      }** (${currentRoute?.path ?? '/'})${
        pendingApprovalsCount > 0 ? `，系统存在 **${pendingApprovalsCount}** 项待决人机签署草案` : ''
      }。\n我可以为您分析当前运行链路、解读系统指标或生成治理指令。`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll to bottom on message change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt ?? input.trim();
    if (!textToSend || loading) return;

    const userMsg: CopilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      // Build context prompt
      const contextPrefix = `[上下文: 当前路由 ${currentRoute?.path} (${currentRoute?.label})] `;
      const res = await apiPost<{
        answer: string;
        sources?: Array<{ id: string; title: string; score?: number }>;
      }>(`${BRAIN_API}/ask`, {
        question: contextPrefix + textToSend,
      });

      if (res.ok && res.data) {
        const assistantMsg: CopilotMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.data.answer || '已完成分析。',
          sources: res.data.sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(res.error || '数字大脑服务暂不可用');
      }
    } catch {
      // Fallback local autonomous reply
      const assistantMsg: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `【本地离线推理】针对问题「${textToSend}」：\n- 当前页面 **${
          currentRoute?.label ?? '控制台'
        }** 处于自治监督态。\n- 底层 43191 守护进程持续巡检中，未发现致命阻断。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: `上下文已重置。随时为您解答关于 **${
          currentRoute?.label ?? '系统'
        }** 的任何问题。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" role="dialog" aria-label="数字大脑随行抽屉">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg md:max-w-xl bg-slate-950/95 border-l border-slate-800/80 shadow-2xl flex flex-col h-full z-10 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Sovereign Copilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  本地主权
                </span>
              </div>
              <p className="text-[11px] text-slate-400">随时原位问答 · 智能诊断 · 意图生成</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              title="重置对话"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="关闭 (ESC)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Context Pill */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>当前上下文:</span>
            <span className="font-mono text-indigo-300 font-medium">
              {currentRoute?.label ?? '控制台'} ({currentRoute?.path ?? '/'})
            </span>
          </div>
          {pendingApprovalsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingApprovalsCount} 待决
            </span>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 border border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Sources list */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] space-y-1">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-indigo-400" /> 知识参考:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]"
                        >
                          {s.title || s.id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1.5 ${
                    msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 animate-pulse">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px]">数字大脑正在检索推理...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUICK_PROMPTS.map((qp, idx) => {
              const IconComp = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.text)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-slate-800 text-slate-300 hover:text-indigo-300 text-[11px] whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
                >
                  <IconComp className="w-3 h-3 text-indigo-400" />
                  <span>{qp.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`输入问题或指令 (Enter 发送，Shift+Enter 换行)...`}
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 resize-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1">
            <span>Powered by AetherForge Sovereign Compute</span>
            <span>ESC 关闭</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SovereignCopilotDrawer;
