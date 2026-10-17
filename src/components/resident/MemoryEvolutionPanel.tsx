import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, BookOpen, ShieldCheck, Plus, CheckCircle, RefreshCw } from 'lucide-react';

export interface DistilledPreference {
  id: string;
  domain: string;
  directive: string;
  confidence: number;
  source: string;
  learned_at?: string;
}

export interface DomainLearning {
  topic: string;
  milestone: string;
  insight: string;
}

export interface CrystallizedMemoryData {
  ok: boolean;
  updated_at?: string;
  total_episodes_processed?: number;
  preferences?: DistilledPreference[];
  guardrail_count?: number;
  domain_learnings?: DomainLearning[];
  growth_metrics?: {
    crystallization_duration_ms?: number;
    total_preferences?: number;
    knowledge_nodes_linked?: number;
  };
}

export const MemoryEvolutionPanel: React.FC = () => {
  const [data, setData] = useState<CrystallizedMemoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDistillDrawer, setShowDistillDrawer] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchDistilledMemory = async () => {
    try {
      const res = await fetch('/api/resident/memory/distilled');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load distilled memory', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistilledMemory();
  }, []);

  const handleTriggerDistillation = async () => {
    if (!inputText.trim()) return;
    setSubmitting(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/resident/memory/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extra_text: inputText }),
      });
      if (res.ok) {
        setActionMsg('✅ 会话偏好与认知已成功萃取并结晶持久化！');
        setInputText('');
        setShowDistillDrawer(false);
        await fetchDistilledMemory();
      } else {
        setActionMsg('❌ 提炼结晶失败');
      }
    } catch (e) {
      setActionMsg(`❌ 提炼异常: ${String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 animate-pulse">
        加载跨会话长期记忆与心智结晶资产中...
      </div>
    );
  }

  const memory = data || {
    preferences: [
      {
        id: 'pref-baseline-zh',
        domain: 'language',
        directive: '回复优先使用简体中文，英文标识符保持原样',
        confidence: 1.0,
        source: 'user_global_rule',
      },
      {
        id: 'pref-baseline-git',
        domain: 'git',
        directive: '主工作区物理只读，常规交付均在隔离 worktree 中完成',
        confidence: 1.0,
        source: 'governance_policy',
      },
    ],
    guardrail_count: 6,
    domain_learnings: [
      {
        topic: '三位一体自治演进',
        milestone: 'Phase 7 闭环',
        insight: '解除双机硬编码约束，支持 N 机算力自适应切流与渲染。',
      },
    ],
    growth_metrics: {
      total_preferences: 2,
      knowledge_nodes_linked: 9,
    },
  };

  return (
    <div className="space-y-6">
      {/* 顶部指标横栏 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              跨会话认知自结晶与长效记忆资产
              <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Phase 8
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              自动反思抽取日常交互、纠错指令与架构共识，会话冷启动自动召回，让 Agent 具备跨会话成长性。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">已沉淀心智节点</div>
            <div className="text-base font-bold text-slate-100">
              {memory.growth_metrics?.knowledge_nodes_linked || 12}
            </div>
          </div>
          <button
            onClick={() => setShowDistillDrawer(!showDistillDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            现场提炼新偏好
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* 提炼抽屉 */}
      {showDistillDrawer && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            从会话记录或用户纠错中萃取长效偏好
          </h3>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="粘贴本轮对话记录、用户纠错提示（例如：'注意：评测窗口内禁跑编译等CPU重活，回复优先使用中文'）..."
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDistillDrawer(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
            >
              取消
            </button>
            <button
              onClick={handleTriggerDistillation}
              disabled={submitting || !inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
              {submitting ? '萃取结晶中...' : '萃取并沉淀至长期记忆'}
            </button>
          </div>
        </div>
      )}

      {/* 用户专属长效偏好列表 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            用户专属长效偏好资产 ({memory.preferences?.length || 0})
          </h3>
          <span className="text-xs text-slate-400">会话冷启动自动载入</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {memory.preferences && memory.preferences.length > 0 ? (
            memory.preferences.map((pref) => (
              <div
                key={pref.id}
                className="bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 transition space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {pref.domain}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    置信度 {Math.round((pref.confidence || 1.0) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {pref.directive}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                  <span>来源: {pref.source}</span>
                  {pref.learned_at && <span>{new Date(pref.learned_at).toLocaleDateString('zh-CN')}</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 p-4">暂无沉淀偏好</div>
          )}
        </div>
      </div>

      {/* 架构共识与关键结论 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          全系统架构演进共识与结晶知识 ({memory.domain_learnings?.length || 0})
        </h3>
        <div className="space-y-3">
          {memory.domain_learnings && memory.domain_learnings.length > 0 ? (
            memory.domain_learnings.map((learning, idx) => (
              <div
                key={idx}
                className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{learning.topic}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                      {learning.milestone}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{learning.insight}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400">暂无领域共识记录</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryEvolutionPanel;
