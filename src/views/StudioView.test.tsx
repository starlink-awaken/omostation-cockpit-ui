/**
 * StudioView unit tests — BET-Y1Q4-T8-24C.
 *
 * Covers:
 * - Rendering of all four tabs
 * - Memory channel status display
 * - Tab switching
 * - Skill topology graph rendering
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it } from 'vitest';
import StudioView from './StudioView';

describe('StudioView', () => {
  it('renders the header with title', () => {
    render(<StudioView />);
    expect(screen.getByText('🔧 机理工坊')).toBeDefined();
  });

  it('renders all four tabs', () => {
    render(<StudioView />);
    expect(screen.getByText('记忆通道')).toBeDefined();
    expect(screen.getByText('技能拓扑')).toBeDefined();
    expect(screen.getByText('BOS 网格')).toBeDefined();
    expect(screen.getByText('文档 Diff')).toBeDefined();
  });

  it('shows memory channels by default', () => {
    render(<StudioView />);
    expect(screen.getByText('情景记忆')).toBeDefined();
    expect(screen.getByText('语义记忆')).toBeDefined();
    expect(screen.getByText('程序记忆')).toBeDefined();
    expect(screen.getByText('前瞻记忆')).toBeDefined();
    expect(screen.getByText('情感记忆')).toBeDefined();
    expect(screen.getByText('元认知记忆')).toBeDefined();
  });

  it('displays memory channel status labels', () => {
    render(<StudioView />);
    // At least one "健康" label should be visible
    expect(screen.getAllByText('健康').length).toBeGreaterThan(0);
  });

  it('switches to skills tab and shows skill nodes', async () => {
    const user = userEvent.setup();
    render(<StudioView />);

    await user.click(screen.getByText('技能拓扑'));

    // Check that skill names are rendered
    expect(screen.getByText('公文拟办')).toBeDefined();
    expect(screen.getByText('健康评估')).toBeDefined();
  });

  it('switches to BOS tab', async () => {
    const user = userEvent.setup();
    render(<StudioView />);

    await user.click(screen.getByText('BOS 网格'));
    expect(screen.getByText('BOS 服务网格调试器')).toBeDefined();
  });

  it('switches to docs tab', async () => {
    const user = userEvent.setup();
    render(<StudioView />);

    await user.click(screen.getByText('文档 Diff'));
    expect(screen.getByText('受管文档双版本 Diff')).toBeDefined();
  });

  it('renders badge counts on tabs', () => {
    render(<StudioView />);
    // Skills tab has badge
    const skillsTab = screen.getByText('技能拓扑').closest('button');
    expect(skillsTab).toBeTruthy();
    // The badge shows skill count
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
  });
});
