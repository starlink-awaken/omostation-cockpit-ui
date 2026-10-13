import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GovernanceBaseBridgeBanner from '../GovernanceBaseBridgeBanner';

describe('GovernanceBaseBridgeBanner', () => {
  it('renders workbench title and default text', () => {
    render(<GovernanceBaseBridgeBanner workbenchName="测试控制工作台" />);
    expect(screen.getByText('测试控制工作台')).toBeInTheDocument();
    expect(screen.getByText('织星统一控制台')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /打开统一全景/i })).toHaveAttribute('href', '/panorama');
  });

  it('renders deep link with custom targetSection and actionText', () => {
    render(
      <GovernanceBaseBridgeBanner
        workbenchName="治理工作台"
        targetSection="#gov"
        actionText="直达门禁矩阵"
      />,
    );
    const link = screen.getByRole('link', { name: /直达门禁矩阵/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/panorama');
  });

  it('dispatches open-guardian-inspection custom event when button clicked without onOpenDrawer', () => {
    const eventSpy = vi.fn();
    window.addEventListener('open-guardian-inspection', eventSpy);

    render(<GovernanceBaseBridgeBanner workbenchName="保障工作台" />);
    fireEvent.click(screen.getByText('查看系统巡检'));

    expect(eventSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener('open-guardian-inspection', eventSpy);
  });

  it('invokes onOpenDrawer callback if provided', () => {
    const handleDrawer = vi.fn();
    render(
      <GovernanceBaseBridgeBanner
        workbenchName="保障工作台"
        onOpenDrawer={handleDrawer}
      />,
    );
    fireEvent.click(screen.getByText('查看系统巡检'));
    expect(handleDrawer).toHaveBeenCalledTimes(1);
  });
});
