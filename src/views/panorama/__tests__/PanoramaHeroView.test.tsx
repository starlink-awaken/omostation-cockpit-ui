import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PanoramaHeroView from '../PanoramaHeroView';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('PanoramaHeroView Drill-down Interactions', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders sovereign banner and metrics', () => {
    renderWithClient(<PanoramaHeroView />);
    expect(screen.getByText(/人类意志最高控制权/)).toBeInTheDocument();
    expect(screen.getByText('443 / 443 全部达成 (100%)')).toBeInTheDocument();
    expect(screen.getByText('11 / 11 核心门禁全绿')).toBeInTheDocument();
  });

  it('renders all 11 core gates and drills down to the corresponding route on click', () => {
    renderWithClient(<PanoramaHeroView />);
    
    // A1 -> /workflows
    const gateA1 = screen.getByRole('button', { name: /门禁 A1:/ });
    expect(gateA1).toBeInTheDocument();
    fireEvent.click(gateA1);
    expect(mockNavigate).toHaveBeenCalledWith('/workflows');

    // A3 -> /intent
    const gateA3 = screen.getByRole('button', { name: /门禁 A3:/ });
    fireEvent.click(gateA3);
    expect(mockNavigate).toHaveBeenCalledWith('/intent');

    // A6 -> /swarm
    const gateA6 = screen.getByRole('button', { name: /门禁 A6:/ });
    fireEvent.click(gateA6);
    expect(mockNavigate).toHaveBeenCalledWith('/swarm');

    // A9 -> /observability
    const gateA9 = screen.getByRole('button', { name: /门禁 A9:/ });
    fireEvent.click(gateA9);
    expect(mockNavigate).toHaveBeenCalledWith('/observability');

    // RC-DL -> /compute
    const gateRCDL = screen.getByRole('button', { name: /门禁 RC-DL:/ });
    fireEvent.click(gateRCDL);
    expect(mockNavigate).toHaveBeenCalledWith('/compute');
  });

  it('drills down to corresponding route when clicking circuit pulse cards', () => {
    renderWithClient(<PanoramaHeroView />);

    // value_reinforcement -> /bcos
    const valueLoop = screen.getByRole('button', { name: /业务回路 value_reinforcement/ });
    fireEvent.click(valueLoop);
    expect(mockNavigate).toHaveBeenCalledWith('/bcos');

    // physical_isolation -> /sandbox
    const isolationLoop = screen.getByRole('button', { name: /业务回路 physical_isolation/ });
    fireEvent.click(isolationLoop);
    expect(mockNavigate).toHaveBeenCalledWith('/sandbox');
  });

  it('drills down when clicking posture overview cards', () => {
    renderWithClient(<PanoramaHeroView />);

    // 系统当下在忙什么 -> /scenes
    const scenesCard = screen.getByText('系统当下在忙什么？').closest('[role="button"]');
    expect(scenesCard).not.toBeNull();
    fireEvent.click(scenesCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/scenes');

    // 战略规划台账进度 -> /system-map
    const roadmapCard = screen.getByText('战略规划台账进度').closest('[role="button"]');
    expect(roadmapCard).not.toBeNull();
    fireEvent.click(roadmapCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/system-map');

    // 不可违背规则与治理 -> /harness
    const harnessCard = screen.getByText('不可违背规则与治理').closest('[role="button"]');
    expect(harnessCard).not.toBeNull();
    fireEvent.click(harnessCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/harness');
  });

  it('navigates to four domains when clicking bottom quick cards', () => {
    renderWithClient(<PanoramaHeroView />);

    fireEvent.click(screen.getByRole('button', { name: /态势感知/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/overview');

    fireEvent.click(screen.getByRole('button', { name: /主权算力/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/compute');

    fireEvent.click(screen.getByRole('button', { name: /业务闭环/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/scenes');

    fireEvent.click(screen.getByRole('button', { name: /治理与合规/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/governance-domain');
  });

  it('supports keyboard navigation via Enter key on gate cards', () => {
    renderWithClient(<PanoramaHeroView />);

    const gateA1 = screen.getByRole('button', { name: /门禁 A1:/ });
    fireEvent.keyDown(gateA1, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/workflows');
  });

  it('opens InPlaceDecisionDrawer when clicking the decision status badge and closes via button', async () => {
    renderWithClient(<PanoramaHeroView />);

    const decisionBadge = screen.getByTitle('点击打开主权执掌者决策闸门');
    fireEvent.click(decisionBadge);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('主权执掌者决策闸门 · 原位裁决')).toBeInTheDocument();
    expect(screen.getByText(/执掌主体: 夏明星/)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: '关闭裁决抽屉' });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
