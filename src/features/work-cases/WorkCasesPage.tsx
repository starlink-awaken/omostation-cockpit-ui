import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createWorkCaseDraft, listActiveWorkCases, recordWorkCaseSubmission, requestWorkCasePlan } from './api';
import { useState } from 'react';
import type { WorkCaseRisk, WorkCaseStatus } from './types';
import './WorkCasesPage.css';

const STATUS_LABELS: Record<WorkCaseStatus, string> = {
  draft: '草稿',
  planned: '待启动',
  awaiting_confirmation: '待确认',
  executing: '执行中',
  reporting: '待上报',
  archiving: '归档中',
  completed: '已结案',
  blocked: '已阻断',
};

const RISK_LABELS: Record<WorkCaseRisk, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

function formatDueAt(value?: string) {
  if (!value) return '未设置截止时间';
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString('zh-CN', { hour12: false });
}

export default function WorkCasesPage() {
  const [caseId, setCaseId] = useState('');
  const [title, setTitle] = useState('');
  const [sourceRef, setSourceRef] = useState('');
  const [planDigest, setPlanDigest] = useState('');
  const [unitId, setUnitId] = useState('');
  const [submissionDigest, setSubmissionDigest] = useState('');
  const queryClient = useQueryClient();
  const casesQuery = useQuery({
    queryKey: ['work-cases', 'active'],
    queryFn: async () => {
      const result = await listActiveWorkCases();
      if (!result.ok || !result.data) {
        throw new Error(result.error || '案件服务不可用');
      }
      return result.data.items;
    },
    retry: false,
  });
  const draftMutation = useMutation({
    mutationFn: async () => {
      const result = await createWorkCaseDraft({ case_id: caseId, title, source_ref: sourceRef });
      if (!result.ok || !result.data) throw new Error(result.error || '案件草稿创建失败');
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-cases', 'active'] }),
  });
  const planMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const result = await requestWorkCasePlan(caseId, planDigest);
      if (!result.ok || !result.data) throw new Error(result.error || '方案确认请求失败');
      return result.data;
    },
  });
  const submissionMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const result = await recordWorkCaseSubmission(caseId, { unit_id: unitId, digest: submissionDigest, valid: true });
      if (!result.ok || !result.data) throw new Error(result.error || '材料摘要提交失败');
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-cases', 'active'] }),
  });

  if (casesQuery.isLoading) {
    return <div className="work-cases-state" role="status">正在读取案件数据…</div>;
  }

  if (casesQuery.isError) {
    return (
      <div className="work-cases-state work-cases-error" role="alert">
        案件数据暂不可用。系统未展示模拟案件；请检查案件服务或改用人工操作卡继续处理。
      </div>
    );
  }

  const cases = casesQuery.data ?? [];
  return (
    <section className="work-cases-page" aria-labelledby="work-cases-title">
      <div className="work-cases-heading">
        <div>
          <h2 id="work-cases-title">工作案件</h2>
          <p>按案件组织任务、材料、确认与回执；对外动作必须进入待确认队列。</p>
        </div>
        <span className="work-cases-count">{cases.length} 个进行中</span>
      </div>
      <form className="work-case-draft-form" onSubmit={(event) => { event.preventDefault(); draftMutation.mutate(); }}>
        <label>案件编号<input aria-label="案件编号" value={caseId} onChange={(event) => setCaseId(event.target.value)} required /></label>
        <label>案件标题<input aria-label="案件标题" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>OA 来源引用<input aria-label="OA 来源引用" value={sourceRef} onChange={(event) => setSourceRef(event.target.value)} required /></label>
        <button type="submit" disabled={draftMutation.isPending}>创建案件草稿</button>
        {draftMutation.isSuccess && <span>案件草稿 {draftMutation.data.id} 已创建</span>}
        {draftMutation.isError && <span role="alert">{draftMutation.error.message}</span>}
      </form>

      {cases.length === 0 ? (
        <div className="work-cases-state">当前没有进行中的案件。</div>
      ) : (
        <div className="work-cases-list">
          {cases.map((workCase) => (
            <article className="work-case-card" key={workCase.id}>
              <div className="work-case-card-topline">
                <span className={`work-case-status status-${workCase.status}`}>{STATUS_LABELS[workCase.status]}</span>
                <span className={`work-case-risk risk-${workCase.risk}`}>{RISK_LABELS[workCase.risk]}</span>
              </div>
              <h3>{workCase.title}</h3>
              <p className="work-case-next-action">下一步：{workCase.next_action}</p>
              <p className="work-case-facts">
                {workCase.plan_confirmed ? '方案已确认' : '方案待确认'}
                {' · '}
                有效回收 {workCase.valid_submission_count} · 提交版本 {workCase.submission_version_count}
              </p>
              {!workCase.plan_confirmed && (
                <div className="work-case-plan-request">
                  <input aria-label="方案摘要" value={planDigest} onChange={(event) => setPlanDigest(event.target.value)} placeholder="sha256:方案摘要" />
                  <button type="button" onClick={() => planMutation.mutate(workCase.id)} disabled={!planDigest || planMutation.isPending}>提交方案确认请求</button>
                  {planMutation.isSuccess && <span>方案已进入待确认队列</span>}
                </div>
              )}
              <div className="work-case-submission">
                <input aria-label="提交单位" value={unitId} onChange={(event) => setUnitId(event.target.value)} placeholder="单位 ID" />
                <input aria-label="材料摘要" value={submissionDigest} onChange={(event) => setSubmissionDigest(event.target.value)} placeholder="sha256:材料摘要" />
                <button type="button" onClick={() => submissionMutation.mutate(workCase.id)} disabled={!unitId || !submissionDigest || submissionMutation.isPending}>提交材料摘要</button>
                {submissionMutation.isSuccess && <span>材料摘要已记录</span>}
              </div>
              <footer>截止：{formatDueAt(workCase.due_at)}</footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
