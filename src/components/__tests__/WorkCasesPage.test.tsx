import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
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
          },
        ],
      },
    });

    renderWorkCasesPage();

    expect(await screen.findByRole('heading', { name: '工作案件' })).toBeInTheDocument();
    expect(screen.getByText('2026 年数据调查')).toBeInTheDocument();
    expect(screen.getByText(/确认调查对象与发送批次/)).toBeInTheDocument();
    expect(screen.getByText('待确认')).toBeInTheDocument();
  });

  it('shows an unavailable state instead of fabricated cases when the API is unreachable', async () => {
    setupMockFetchError();

    renderWorkCasesPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('案件数据暂不可用');
    expect(screen.queryByText('2026 年数据调查')).not.toBeInTheDocument();
  });

  it('registers a visible work-case route in the primary work navigation', () => {
    expect(ROUTES).toContainEqual(expect.objectContaining({
      id: 'WorkCases',
      path: '/cases',
      label: '案件',
      group: '工作案件',
    }));
  });
});
