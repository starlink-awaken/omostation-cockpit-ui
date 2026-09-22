import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupMockFetch, setupMockFetchError } from './route-test-helpers';
import WorkCasesPage from '../../features/work-cases/WorkCasesPage';
import { ROUTES } from '../../routes';

function renderWorkCasesPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WorkCasesPage />
    </QueryClientProvider>,
  );
}

describe('WorkCasesPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders active work cases returned by the controlled case API', async () => {
    setupMockFetch({
      '/api/work-cases?scope=active': {
        items: [
          {
            id: 'CASE-001',
            title: '2026 年数据调查',
            status: 'awaiting_confirmation',
            due_at: '2026-09-10T09:00:00Z',
            risk: 'high',
            next_action: '确认调查对象与发送批次',
            plan_confirmed: true,
            valid_submission_count: 4,
            submission_version_count: 6,
          },
        ],
      },
    });

    renderWorkCasesPage();

    expect(await screen.findByRole('heading', { name: '工作案件' })).toBeInTheDocument();
    expect(screen.getByText('2026 年数据调查')).toBeInTheDocument();
    expect(screen.getByText(/确认调查对象与发送批次/)).toBeInTheDocument();
    expect(screen.getByText('待确认')).toBeInTheDocument();
    expect(screen.getByText(/方案已确认/)).toBeInTheDocument();
    expect(screen.getByText(/有效回收 4 · 提交版本 6/)).toBeInTheDocument();
  });

  it('shows an unavailable state instead of fabricated cases when the API is unreachable', async () => {
    setupMockFetchError();

    renderWorkCasesPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('案件数据暂不可用');
    expect(screen.queryByText('2026 年数据调查')).not.toBeInTheDocument();
  });

  it('shows pending external action metadata without presenting approval or execution controls', async () => {
    setupMockFetch({
      '/api/work-cases?scope=active': {
        items: [{
          id: 'CASE-001', title: '2026 年数据调查', status: 'awaiting_confirmation', risk: 'high',
          next_action: '确认调查对象与发送批次', plan_confirmed: true,
          valid_submission_count: 4, submission_version_count: 6,
        }],
      },
      '/api/work-cases/CASE-001/external-actions': {
        items: [{
          id: 'work-case-action:action-1', status: 'pending', action_type: 'email_send',
          recipient_count: 2, attachment_count: 1,
          action_snapshot_digest: 'sha256:snapshot', created_at: '2026-09-03T10:00:00Z',
        }],
      },
    });

    renderWorkCasesPage();

    expect(await screen.findByRole('heading', { name: '对外动作待确认' })).toBeInTheDocument();
    expect(screen.getByText('邮件发送 · 2 个对象 · 1 个附件')).toBeInTheDocument();
    expect(screen.getByText('sha256:snapshot')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /批准外部动作|执行外部动作|发送/ })).not.toBeInTheDocument();
  });

  it('registers a visible work-case route in the primary work navigation', () => {
    expect(ROUTES).toContainEqual(expect.objectContaining({
      id: 'WorkCases',
      path: '/cases',
      label: '案件',
      group: '业务闭环',
    }));
  });

  it('creates only a case draft through the controlled draft endpoint', async () => {
    const fetchMock = setupMockFetch({ '/api/work-cases?scope=active': { items: [] } });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/work-cases/drafts') return { ok: true, status: 200, json: async () => ({ id: 'CASE-001', status: 'draft' }) };
      return { ok: true, status: 200, json: async () => ({ items: [] }) };
    });
    const user = userEvent.setup();
    renderWorkCasesPage();

    await user.type(await screen.findByLabelText('案件编号'), 'CASE-001');
    await user.type(await screen.findByLabelText('案件标题'), '数据调查');
    await user.type(screen.getByLabelText('OA 来源引用'), 'oa://task-1');
    await user.click(screen.getByRole('button', { name: '创建案件草稿' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/work-cases/drafts', expect.objectContaining({ method: 'POST' }));
    expect(await screen.findByText('案件草稿 CASE-001 已创建')).toBeInTheDocument();
  });

  it('submits only the plan digest to the work-case confirmation endpoint', async () => {
    const fetchMock = setupMockFetch({ '/api/work-cases?scope=active': { items: [] } });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/work-cases?scope=active') return { ok: true, status: 200, json: async () => ({ items: [{ id: 'CASE-001', title: '调查', status: 'draft', risk: 'low', next_action: '提交方案', plan_confirmed: false, valid_submission_count: 0, submission_version_count: 0 }] }) };
      return { ok: true, status: 200, json: async () => ({ id: 'CASE-001', status: 'awaiting_confirmation' }) };
    });
    const user = userEvent.setup();
    renderWorkCasesPage();
    await user.type(await screen.findByLabelText('方案摘要'), 'sha256:plan-v1');
    await user.click(screen.getByRole('button', { name: '提交方案确认请求' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/work-cases/CASE-001/plan-requests', expect.objectContaining({ method: 'POST' }));
    expect(await screen.findByText('方案已进入待确认队列')).toBeInTheDocument();
  });

  it('submits only submission metadata to the evidence endpoint', async () => {
    const fetchMock = setupMockFetch({ '/api/work-cases?scope=active': { items: [] } });
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/work-cases?scope=active') return { ok: true, status: 200, json: async () => ({ items: [{ id: 'CASE-001', title: '调查', status: 'executing', risk: 'low', next_action: '收集材料', plan_confirmed: true, valid_submission_count: 0, submission_version_count: 0 }] }) };
      return { ok: true, status: 200, json: async () => ({ id: 'CASE-001', status: 'submission_recorded' }) };
    });
    const user = userEvent.setup();
    renderWorkCasesPage();
    await user.type(await screen.findByLabelText('提交单位'), 'unit-a');
    await user.type(screen.getByLabelText('材料摘要'), 'sha256:reply-v1');
    await user.click(screen.getByRole('button', { name: '提交材料摘要' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/work-cases/CASE-001/submissions', expect.objectContaining({ method: 'POST' }));
    expect(await screen.findByText('材料摘要已记录')).toBeInTheDocument();
  });
});
