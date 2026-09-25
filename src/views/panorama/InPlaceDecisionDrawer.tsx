import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  Send,
  Ban
} from 'lucide-react';
import { useApprovalQueue, useApproveIntent, useRejectIntent, type ApprovalQueueItem } from '../../api/hooks/swarm';

export interface InPlaceDecisionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InPlaceDecisionDrawer({ isOpen, onClose }: InPlaceDecisionDrawerProps) {
  const navigate = useNavigate();
  const { data: queueData, isLoading } = useApprovalQueue();
  const approveMutation = useApproveIntent();
  const rejectMutation = useRejectIntent();

  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState<string>('夏明星');
  const [reviewNote, setReviewNote] = useState<string>('通过，经主权物理审查符合预期');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const items: ApprovalQueueItem[] = queueData?.queue ?? [];
  const currentItem = items.find(item => item.intent_id === selectedIntentId) || items[0] || null;

  // Esc key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!currentItem) return;
    try {
      await approveMutation.mutateAsync({
        intent_id: currentItem.intent_id,
        reviewer: reviewerName,
        note: reviewNote,
      });
      setFeedbackMsg({ type: 'success', text: `决策草案 ${currentItem.intent_id} 已成功签署批准！` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : '签署失败' });
    }
  };

  const handleReject = async () => {
    if (!currentItem) return;
    try {
      await rejectMutation.mutateAsync({
        intent_id: currentItem.intent_id,
        reviewer: reviewerName,
        note: reviewNote || '不予通过，需补充业务依据',
      });
      setFeedbackMsg({ type: 'success', text: `决策草案 ${currentItem.intent_id} 已驳回` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: err instanceof Error ? err.message : '驳回失败' });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-drawer-title"
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <header className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="decision-drawer-title" className="text-base font-bold text-white flex items-center gap-2">
                主权执掌者决策闸门 · 原位裁决
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Human In Command
                </span>
              </h2>
              <p className="text-xs text-slate-400">夏明星物理执掌 · 智能体自进化提议原位签署</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="关闭裁决抽屉"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className={`p-3 text-xs font-medium border-b flex items-center gap-2 ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sovereign identity badge */}
          <div className="rounded-xl p-4 bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center font-bold text-blue-300 text-sm">
                夏
              </div>
              <div>
                <div className="text-sm font-semibold text-white">执掌主体: 夏明星 (Physical Authority)</div>
                <div className="text-xs text-slate-400">PASW 物理隔离环境 · 签署动作具备全仓不可撤销性</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                待决: {items.length} 项
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-sm text-slate-400">正在同步知行待决草案...</div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80 p-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">当前无挂起的人机待决草案</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                所有自愈与自治回路均在安全基线内运行。历史决策已全部固化进时间账本与知识库。
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/decision-inbox');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  <span>查看决策收件箱全量历史</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Items List & Details */
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">待决草案列表</h3>
              <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.intent_id}
                    onClick={() => setSelectedIntentId(item.intent_id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      (currentItem?.intent_id === item.intent_id)
                        ? 'bg-blue-500/10 border-blue-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-mono text-xs font-bold text-blue-300">{item.intent_id}</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span className="text-xs font-medium">{item.scene_name || item.journey_name || '自治提议'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>

              {/* Current Item Inspection & Signature */}
              {currentItem && (
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-mono text-blue-400 font-semibold">{currentItem.intent_id}</div>
                      <div className="text-sm font-bold text-white mt-0.5">{currentItem.scene_name} · {currentItem.journey_name}</div>
                    </div>
                    <span className="text-xs text-slate-400">{currentItem.source}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-1">提议详情与业务意图</h4>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {currentItem.raw_content}
                    </div>
                  </div>

                  {/* Signature Form */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">签署人凭证</label>
                      <input 
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="签署人姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">执掌者审查意见 / 署名附言</label>
                      <input 
                        type="text"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="输入审查附言，将同步固化入自学习回执"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={rejectMutation.isPending}
                      onClick={handleReject}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>驳回提案</span>
                    </button>
                    <button
                      type="button"
                      disabled={approveMutation.isPending}
                      onClick={handleApprove}
                      className="px-5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>夏明星 物理署名批准</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <footer className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>所有裁决将即时生成 Merkle 证据链并通知 Swarm 状态机</span>
          <button 
            type="button"
            onClick={() => {
              onClose();
              navigate('/decision-inbox');
            }}
            className="text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>全量决策收件箱</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </footer>
      </div>
    </div>
  );
}
