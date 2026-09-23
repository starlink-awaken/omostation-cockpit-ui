import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SovereignCopilotDrawer from '../SovereignCopilotDrawer';
import * as client from '../../../api/client';

// Mock api client
vi.mock('../../../api/client', () => ({
  apiPost: vi.fn(),
  apiFetch: vi.fn(),
}));

describe('SovereignCopilotDrawer', () => {
  const mockClose = vi.fn();
  const mockRoute = {
    id: 'Workflows',
    path: '/workflows',
    label: '工作流',
    group: '业务闭环',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SovereignCopilotDrawer
        isOpen={false}
        onClose={mockClose}
        currentRoute={mockRoute as any}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders drawer header, context pill, and welcome message when open', () => {
    render(
      <SovereignCopilotDrawer
        isOpen={true}
        onClose={mockClose}
        currentRoute={mockRoute as any}
        pendingApprovalsCount={3}
      />
    );

    expect(screen.getByText('Sovereign Copilot')).toBeInTheDocument();
    expect(screen.getByText('工作流 (/workflows)')).toBeInTheDocument();
    expect(screen.getByText('3 待决')).toBeInTheDocument();
    expect(screen.getByText(/主权执掌者您好/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked or ESC is pressed', () => {
    render(
      <SovereignCopilotDrawer
        isOpen={true}
        onClose={mockClose}
        currentRoute={mockRoute as any}
      />
    );

    const closeBtn = screen.getByTitle('关闭 (ESC)');
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });

  it('sends question and displays answer when prompt button is clicked', async () => {
    vi.mocked(client.apiPost).mockResolvedValueOnce({
      ok: true,
      data: {
        answer: '当前工作流链路健康，运行率 100%。',
        sources: [{ id: 's1', title: 'ADR-0203' }],
      },
    });

    render(
      <SovereignCopilotDrawer
        isOpen={true}
        onClose={mockClose}
        currentRoute={mockRoute as any}
      />
    );

    const promptBtn = screen.getByText('分析当前页面状态与健康度');
    fireEvent.click(promptBtn);

    expect(screen.getAllByText('分析当前页面状态与健康度').length).toBeGreaterThanOrEqual(2);

    await waitFor(() => {
      expect(screen.getByText('当前工作流链路健康，运行率 100%。')).toBeInTheDocument();
      expect(screen.getByText('ADR-0203')).toBeInTheDocument();
    });
  });

  it('clears conversation when reset button is clicked', () => {
    render(
      <SovereignCopilotDrawer
        isOpen={true}
        onClose={mockClose}
        currentRoute={mockRoute as any}
      />
    );

    const resetBtn = screen.getByTitle('重置对话');
    fireEvent.click(resetBtn);

    expect(screen.getByText(/上下文已重置/)).toBeInTheDocument();
  });
});
