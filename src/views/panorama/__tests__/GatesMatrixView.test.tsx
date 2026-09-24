import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GatesMatrixView } from '../GatesMatrixView';
import * as hooks from '../../../api/hooks/useGovernancePanorama';
import { ToastProvider } from '../../../components/common/Toast';
import type { GateItem } from '../../../api/types/panorama';

const mockGates: GateItem[] = [
  {
    id: 'A1',
    name: '架构契约检查 (Architecture Contracts)',
    description: '道法术器 DFSQ/v1 分层拓扑',
    verdict: 'PASS',
    exitCode: 0,
    evidencePath: '.omo/_truth/registry/ci-surfaces.yaml',
    timestamp: '2026-09-24T20:00:00Z',
    details: 'COMP-WS-omo active, single S slot intact.',
  },
  {
    id: 'A2',
    name: '静态类型与构建检查 (Typecheck & Build)',
    description: 'TypeScript 全局类型合规',
    verdict: 'WARN',
    exitCode: 0,
    evidencePath: 'projects/cockpit-ui/tsconfig.json',
    timestamp: '2026-09-24T20:00:00Z',
    details: '1 warning found in test file.',
  },
  {
    id: 'RF0',
    name: '回归零容忍门禁 (Zero-Regression Gate)',
    description: '核心资产保护与历史 Pitfall 零复发拦截',
    verdict: 'FAIL',
    exitCode: 1,
    evidencePath: 'bin/gac/ci-check-runner.py',
    timestamp: '2026-09-24T20:00:00Z',
    details: 'Regression detected: test assertion fail.',
  },
];

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('GatesMatrixView Component', () => {
  const mockRefetch = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skeleton cards when loading', () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: [],
      isLoading: true,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);
    expect(screen.getByRole('status', { name: /loading gates matrix/i })).toBeInTheDocument();
  });

  it('renders gate cards with proper badges and IDs', () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockGates,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);

    expect(screen.getByText('系统门禁全景矩阵')).toBeInTheDocument();
    expect(screen.getByText('通过 (PASS)')).toBeInTheDocument();
    expect(screen.getByText('预警 (WARN)')).toBeInTheDocument();
    expect(screen.getByText('阻断 (FAIL)')).toBeInTheDocument();

    expect(screen.getByTestId('gate-card-A1')).toBeInTheDocument();
    expect(screen.getByTestId('gate-card-A2')).toBeInTheDocument();
    expect(screen.getByTestId('gate-card-RF0')).toBeInTheDocument();
  });

  it('filters abnormal gates when clicking filter tab', () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockGates,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);

    // Click "仅异常"
    const abnormalButton = screen.getByRole('button', { name: /仅异常/i });
    fireEvent.click(abnormalButton);

    // A1 (PASS) should be hidden, A2 (WARN) and RF0 (FAIL) should be visible
    expect(screen.queryByTestId('gate-card-A1')).not.toBeInTheDocument();
    expect(screen.getByTestId('gate-card-A2')).toBeInTheDocument();
    expect(screen.getByTestId('gate-card-RF0')).toBeInTheDocument();
  });

  it('filters passed gates when clicking filter tab', () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockGates,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);

    // Click "仅通过"
    const passedButton = screen.getByRole('button', { name: /仅通过/i });
    fireEvent.click(passedButton);

    expect(screen.getByTestId('gate-card-A1')).toBeInTheDocument();
    expect(screen.queryByTestId('gate-card-A2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gate-card-RF0')).not.toBeInTheDocument();
  });

  it('filters gates via search input', () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockGates,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);

    const searchInput = screen.getByPlaceholderText(/搜索门禁 ID、名称或证据/i);
    fireEvent.change(searchInput, { target: { value: 'RF0' } });

    expect(screen.queryByTestId('gate-card-A1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gate-card-A2')).not.toBeInTheDocument();
    expect(screen.getByTestId('gate-card-RF0')).toBeInTheDocument();
  });

  it('toggles collapsible details on click', () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockGates,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);

    // Initially details text shouldn't be visible
    expect(screen.queryByText(/COMP-WS-omo active, single S slot intact/i)).not.toBeInTheDocument();

    // Click toggle expand for A1
    const cardA1 = screen.getByTestId('gate-card-A1');
    const expandButton = cardA1.querySelector('button');
    expect(expandButton).not.toBeNull();
    fireEvent.click(expandButton!);

    // Details should be rendered
    expect(screen.getByText(/COMP-WS-omo active, single S slot intact/i)).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(expandButton!);
    expect(screen.queryByText(/COMP-WS-omo active, single S slot intact/i)).not.toBeInTheDocument();
  });

  it('triggers refresh and calls refetch', async () => {
    vi.spyOn(hooks, 'useGatesMatrix').mockReturnValue({
      gates: mockGates,
      isLoading: false,
      isFallback: false,
      refetch: mockRefetch,
    });

    renderWithToast(<GatesMatrixView />);

    const refreshButton = screen.getByRole('button', { name: /刷新门禁巡检/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
