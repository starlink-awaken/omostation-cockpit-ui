import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeepTelemetryDrawer } from '../DeepTelemetryDrawer';
import { FALLBACK_PANORAMA_DATA } from '../../../api/hooks/useGovernancePanorama';

describe('DeepTelemetryDrawer Component Tests', () => {
  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={false}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders header and knowledge tab content by default when isOpen is true', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('系统深度遥测透视')).toBeInTheDocument();
    expect(screen.getByText('知识健康度指标 (Knowledge Health)')).toBeInTheDocument();
    expect(screen.getByText('342')).toBeInTheDocument(); // total docs
    expect(screen.getByText('93%')).toBeInTheDocument(); // freshness
  });

  it('switches to hygiene tab and renders worktree & remote hygiene info', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
      />
    );

    const hygieneTabBtn = screen.getByText('工作区与卫生');
    fireEvent.click(hygieneTabBtn);

    expect(screen.getByText(/活动 Worktree 清单/)).toBeInTheDocument();
    expect(screen.getByText(/锁机制与远程卫生守卫/)).toBeInTheDocument();
    expect(screen.getByText('Origin 隔离正常')).toBeInTheDocument();
  });

  it('switches to runtime tab and renders launchd jobs & connectors', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
      />
    );

    const runtimeTabBtn = screen.getByText('守护与连接器');
    fireEvent.click(runtimeTabBtn);

    expect(screen.getByText(/系统 Launchd 守护进程/)).toBeInTheDocument();
    expect(screen.getByText('zhixing-sunset-redirector')).toBeInTheDocument();
    expect(screen.getByText('guardian-74s-pulse')).toBeInTheDocument();
    expect(screen.getByText('apple_mail')).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /关闭抽屉/ });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
