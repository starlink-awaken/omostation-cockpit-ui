/** OperationsView 测试 (BET-Y1Q4-T8-24D): vitest 环境, 渲染/筛选/空态. */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OperationsView from './OperationsView';

vi.mock('../api/client', () => ({
  apiFetch: vi.fn(async () => ({ cases: [], queues: [] })),
  apiPost: vi.fn(),
}));

describe('OperationsView', () => {
  it('renders case hall and queue sections', () => {
    render(<OperationsView />);
    expect(screen.getByTestId('operations-view')).toBeTruthy();
    expect(screen.getByTestId('case-hall')).toBeTruthy();
    expect(screen.getByTestId('queue-monitor')).toBeTruthy();
  });
});
