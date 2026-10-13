/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * DecisionInboxView — 决策收件箱视图 (Phase 1.5).
 *
 * 功能:
 * - 收件箱概览 (总意图数/待审批数/来源分布)
 * - 场景列表与详情
 * - 待审批队列 (approve/reject)
 * - 快速摄入 (添加意图到场景)
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Inbox,
  Plus,
  RefreshCw,
  List,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import {
  useDecisionInboxScenes,
  useInboxSummary,
  useApprovalQueue,
  useApproveIntent,
  useRejectIntent,
  useAddIntent,
  useCreateScene,
  usePersonalPendingReviews,
  type DecisionInboxScene,
  type ApprovalQueueItem,
} from '../../api/hooks';

// ── Tab switcher ──

type Tab = 'overview' | 'scenes' | 'queue' | 'intake' | 'personal';

function TabButton({ id, label, icon: Icon, active, onClick }: {
  id: Tab; label: string; icon: React.FC<{ className?: string }>; active: boolean; onClick: () => void;
}) {
  return (
    <button
      className={`antd-tab ${active ? 'antd-tab-active' : ''}`}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
    >
      <Icon className="icon" /> {label}
    </button>
  );
}

// ── Main View ──

export default function DecisionInboxView() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');

  const { data: scenes = [], isLoading: scenesLoading } = useDecisionInboxScenes();
  const { data: summary, isLoading: summaryLoading } = useInboxSummary();
  const { data: queueData, isLoading: queueLoading } = useApprovalQueue();
  const approve = useApproveIntent();
  const reject = useRejectIntent();
  const addIntent = useAddIntent(selectedSceneId);
  const createScene = useCreateScene();

  const [newSceneName, setNewSceneName] = useState('');
  const [newIntentContent, setNewIntentContent] = useState('');
  const [newIntentSource, setNewIntentSource] = useState('manual');
  const [newIntentPriority, setNewIntentPriority] = useState('P3');

  const queue = queueData?.queue ?? [];
  const [principalInput, setPrincipalInput] = useState('');
  const [reviewPrincipalId, setReviewPrincipalId] = useState('');
  const personalReviews = usePersonalPendingReviews(reviewPrincipalId);
  const personalReviewLabel = !reviewPrincipalId
    ? '个人待审阅'
    : personalReviews.isLoading || personalReviews.isFetching
      ? '个人待审阅（读取中）'
      : personalReviews.isError
        ? '个人待审阅（读取失败）'
        : `个人待审阅 (${personalReviews.data?.length ?? 0})`;

  const loadPersonalReviews = () => {
    const principalId = principalInput.trim();
    if (!principalId) return;
    if (principalId === reviewPrincipalId) {
      void personalReviews.refetch();
      return;
    }
    setReviewPrincipalId(principalId);
  };

  const handleApprove = (item: ApprovalQueueItem) => {
    approve.mutate({ intent_id: item.intent_id, reviewer: 'human', note: 'Approved via cockpit-ui' });
  };

  const handleReject = (item: ApprovalQueueItem) => {
    reject.mutate({ intent_id: item.intent_id, reviewer: 'human', note: 'Rejected via cockpit-ui' });
  };

  const handleCreateScene = () => {
    if (!newSceneName.trim()) return;
    createScene.mutate({ name: newSceneName });
    setNewSceneName('');
  };

  const handleAddIntent = () => {
    if (!newIntentContent.trim() || !selectedSceneId) return;
    addIntent.mutate({ source: newIntentSource, raw_content: newIntentContent, priority: newIntentPriority });
    setNewIntentContent('');
  };

  return (
    <div className="antd-page">
      <div className="antd-page-header">
        <h1><Inbox className="icon" /> 决策收件箱</h1>
        <p>场景卡驱动的决策生命周期管理 — 从摄入到审批的全链路</p>
      </div>

      {/* Tab bar */}
      <div className="antd-tab-bar" style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <TabButton id="overview" label="概览" icon={BarChart3} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton id="scenes" label="场景列表" icon={List} active={activeTab === 'scenes'} onClick={() => setActiveTab('scenes')} />
        <TabButton id="queue" label={`待审批 (${queue.length})`} icon={ClipboardList} active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} />
        <TabButton id="personal" label={personalReviewLabel} icon={ClipboardList} active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
        <TabButton id="intake" label="快速摄入" icon={Plus} active={activeTab === 'intake'} onClick={() => setActiveTab('intake')} />
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div>
          {summaryLoading ? (
            <div className="antd-card" style={{ padding: 24 }}>加载概览中...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="antd-card" style={{ padding: 16 }}>
                <h3>场景数</h3>
                <p style={{ fontSize: 32, fontWeight: 'bold' }}>{summary?.scene_count ?? 0}</p>
              </div>
              <div className="antd-card" style={{ padding: 16 }}>
                <h3>总意图</h3>
                <p style={{ fontSize: 32, fontWeight: 'bold' }}>{summary?.total_intents ?? 0}</p>
              </div>
              <div className="antd-card" style={{ padding: 16, borderLeft: '4px solid #faad14' }}>
                <h3>待审批</h3>
                <p style={{ fontSize: 32, fontWeight: 'bold', color: '#faad14' }}>{summary?.pending_intents ?? 0}</p>
              </div>
              <div className="antd-card" style={{ padding: 16 }}>
                <h3>来源分布</h3>
                <pre style={{ fontSize: 12 }}>{JSON.stringify(summary?.by_source ?? {}, null, 2)}</pre>
              </div>
            </div>
          )}
          {queue.length > 0 && (
            <div className="antd-card" style={{ marginTop: 16, padding: 16 }}>
              <h3>待处理事项</h3>
              {queue.slice(0, 5).map((item) => (
                <div key={item.intent_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>{item.raw_content.slice(0, 60)}</span>
                  <span style={{ fontWeight: 'bold', color: item.priority === 'P0' ? '#f5222d' : '#1890ff' }}>{item.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scenes tab */}
      {activeTab === 'scenes' && (
        <div>
          <div className="antd-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3>创建新场景</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="antd-input"
                placeholder="场景名称"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="antd-btn antd-btn-primary" onClick={handleCreateScene}>创建</button>
            </div>
          </div>
          {scenesLoading ? (
            <div className="antd-card" style={{ padding: 24 }}>加载场景中...</div>
          ) : scenes.length === 0 ? (
            <div className="antd-card" style={{ padding: 24, textAlign: 'center' }}>暂无场景，创建一个开始</div>
          ) : (
            scenes.map((scene) => (
              <div key={scene.id} className="antd-card" style={{ padding: 16, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{scene.name}</h3>
                  <span style={{ fontSize: 12, color: '#888' }}>{scene.priority} · {scene.status}</span>
                </div>
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{scene.description}</p>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {scene.journeys.length} 个旅程 · 总意图: {scene.journeys.reduce((acc, j) => acc + j.intents.length, 0)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approval Queue tab */}
      {activeTab === 'queue' && (
        <div>
          {queueLoading ? (
            <div className="antd-card" style={{ padding: 24 }}>加载审批队列中...</div>
          ) : queue.length === 0 ? (
            <div className="antd-card" style={{ padding: 24, textAlign: 'center' }}>暂无待审批事项</div>
          ) : (
            <div>
              <p style={{ marginBottom: 8, color: '#888' }}>共 {queue.length} 项待审批</p>
              {queue.map((item) => (
                <div key={item.intent_id} className="antd-card" style={{ padding: 16, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.scene_name}</span>
                        <span style={{ fontSize: 12, background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>{item.source}</span>
                        <span style={{ fontWeight: 'bold', color: item.priority === 'P0' ? '#f5222d' : '#1890ff' }}>{item.priority}</span>
                      </div>
                      <p style={{ marginTop: 4, fontSize: 14 }}>{item.raw_content}</p>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        证据: {item.evidence_count} 条 · 创建: {item.created_at.slice(0, 19)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
                      <button
                        className="antd-btn antd-btn-primary"
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => handleApprove(item)}
                        disabled={approve.isPending}
                      >
                        <CheckCircle2 className="icon" size={14} /> 通过
                      </button>
                      <button
                        className="antd-btn"
                        style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                        onClick={() => handleReject(item)}
                        disabled={reject.isPending}
                      >
                        <XCircle className="icon" size={14} /> 拒绝
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Personal review tab — read-only: no confirmation or execution action is exposed here. */}
      {activeTab === 'personal' && (
        <div>
          <div className="antd-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3>个人待审阅</h3>
            <p style={{ marginTop: 4, color: '#666' }}>输入身份 ID 查看你的待审阅事项；此处不会确认、签署或执行。</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="antd-input"
                aria-label="Principal ID"
                placeholder="principal:…"
                value={principalInput}
                onChange={(event) => setPrincipalInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') loadPersonalReviews(); }}
                style={{ flex: 1 }}
              />
              <button className="antd-btn antd-btn-primary" onClick={loadPersonalReviews} disabled={!principalInput.trim() || personalReviews.isFetching}>
                <RefreshCw className="icon" size={14} /> {reviewPrincipalId === principalInput.trim() ? '刷新' : '读取'}
              </button>
            </div>
          </div>
          {!reviewPrincipalId ? (
            <div className="antd-card" style={{ padding: 24, textAlign: 'center' }}>请先输入 Principal ID 读取待审阅项</div>
          ) : personalReviews.isLoading ? (
            <div className="antd-card" style={{ padding: 24 }}>加载个人待审阅项中...</div>
          ) : personalReviews.isError ? (
            <div className="antd-card" style={{ padding: 24, borderLeft: '4px solid #ff4d4f' }}>
              读取个人待审阅项失败：{personalReviews.error instanceof Error ? personalReviews.error.message : '未知错误'}
            </div>
          ) : personalReviews.data?.length === 0 ? (
            <div className="antd-card" style={{ padding: 24, textAlign: 'center' }}>当前 Principal 没有待确认项</div>
          ) : (
            <div>
              <p style={{ marginBottom: 8, color: '#888' }}>共 {personalReviews.data?.length ?? 0} 项，均需在人类确认提供方中处理。</p>
              {personalReviews.data?.map((item) => (
                <div key={item.episodeId} className="antd-card" style={{ padding: 16, marginBottom: 8, borderLeft: '4px solid #faad14' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.summary}</span>
                        <span style={{ fontSize: 12, background: '#fff7e6', color: '#d46b08', padding: '2px 6px', borderRadius: 4 }}>{item.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>角色：{item.role} · 职责：{item.responsibility}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Episode：{item.episodeId}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>来源版本：{item.sourceVersion ?? '事件未提供'} · 来源事件：{item.sourceEventId ?? '事件未提供'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Intake tab */}
      {activeTab === 'intake' && (
        <div>
          <div className="antd-card" style={{ padding: 16, marginBottom: 16 }}>
            <h3>选择场景</h3>
            <select
              className="antd-input"
              value={selectedSceneId}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">-- 选择场景 --</option>
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="antd-card" style={{ padding: 16 }}>
            <h3>快速摄入</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select
                className="antd-input"
                value={newIntentSource}
                onChange={(e) => setNewIntentSource(e.target.value)}
                style={{ width: 120 }}
              >
                <option value="manual">手动</option>
                <option value="email">邮件</option>
                <option value="message">消息</option>
                <option value="file">文件</option>
                <option value="oa">OA</option>
                <option value="sms">短信</option>
              </select>
              <select
                className="antd-input"
                value={newIntentPriority}
                onChange={(e) => setNewIntentPriority(e.target.value)}
                style={{ width: 100 }}
              >
                <option value="P0">P0 紧急</option>
                <option value="P1">P1 重要</option>
                <option value="P2">P2 一般</option>
                <option value="P3" selected>P3 低</option>
              </select>
            </div>
            <textarea
              className="antd-input"
              placeholder="输入内容..."
              value={newIntentContent}
              onChange={(e) => setNewIntentContent(e.target.value)}
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <button
              className="antd-btn antd-btn-primary"
              onClick={handleAddIntent}
              disabled={!selectedSceneId || !newIntentContent.trim() || addIntent.isPending}
              style={{ marginTop: 8 }}
            >
              <Plus className="icon" size={14} /> 添加意图
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
