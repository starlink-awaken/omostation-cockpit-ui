import { useQuery } from '@tanstack/react-query';
import { listActiveWorkCases } from './api';
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
              <footer>截止：{formatDueAt(workCase.due_at)}</footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
