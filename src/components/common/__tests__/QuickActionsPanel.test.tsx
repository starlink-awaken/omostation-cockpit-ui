import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import QuickActionsPanel from '../QuickActionsPanel';
import * as nav from '../../cockpitNavigation';

describe('QuickActionsPanel', () => {
  it('does not render when closed', () => {
    render(<QuickActionsPanel isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog', { name: '快捷操作' })).toBeNull();
  });

  it('renders default quick actions including view-panorama when open', () => {
    render(<QuickActionsPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: '快捷操作' })).toBeInTheDocument();
    expect(screen.getByText('查看治理全景')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
  });

  it('triggers navigation when clicking view-panorama', () => {
    const navSpy = vi.spyOn(nav, 'openCockpitNavigationTarget').mockImplementation(() => {});
    const onClose = vi.fn();
    render(<QuickActionsPanel isOpen={true} onClose={onClose} />);

    const panoramaItem = screen.getByText('查看治理全景');
    fireEvent.click(panoramaItem);

    expect(navSpy).toHaveBeenCalledWith({ tab: 'Panorama' });
    expect(onClose).toHaveBeenCalledTimes(1);
    navSpy.mockRestore();
  });

  it('filters actions by search query', () => {
    render(<QuickActionsPanel isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('搜索操作...');

    fireEvent.change(input, { target: { value: '全景' } });
    expect(screen.getByText('查看治理全景')).toBeInTheDocument();
    expect(screen.queryByText('打开任务中心')).toBeNull();
  });
});
