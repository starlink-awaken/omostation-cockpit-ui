/** MissionView 测试 (BET-Y1Q4-T8-24D): vitest 环境, 矩阵/甘特/公证. */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MissionView from './MissionView';

vi.mock('../api/client', () => ({
  apiFetch: vi.fn(async () => ({ bets: [], golden_slice: [] })),
  apiPost: vi.fn(),
}));

describe('MissionView', () => {
  it('renders matrix, gantt, golden slice sections', () => {
    render(<MissionView />);
    expect(screen.getByTestId('mission-view')).toBeTruthy();
    expect(screen.getByTestId('bet-matrix')).toBeTruthy();
    expect(screen.getByTestId('gantt')).toBeTruthy();
    expect(screen.getByTestId('golden-slice')).toBeTruthy();
  });
});
