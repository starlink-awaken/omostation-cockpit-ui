import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Skeleton, SkeletonCard, SkeletonMetric, SkeletonTable } from '../Skeleton';

describe('Skeleton Components', () => {
  it('renders default Skeleton with role status', () => {
    render(<Skeleton width={100} height={20} className="custom-skeleton" />);
    const el = screen.getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('custom-skeleton');
    expect(el).toHaveStyle({ width: '100px', height: '20px' });
  });

  it('renders circle Skeleton', () => {
    render(<Skeleton circle width={40} height={40} />);
    const el = screen.getByRole('status');
    expect(el).toHaveClass('rounded-full');
  });

  it('renders SkeletonCard with appropriate elements', () => {
    render(<SkeletonCard className="test-card" />);
    const el = screen.getByLabelText('Loading card content...');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('test-card');
  });

  it('renders SkeletonMetric with correct aria-label', () => {
    render(<SkeletonMetric className="test-metric" />);
    const el = screen.getByLabelText('Loading metric...');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('test-metric');
  });

  it('renders SkeletonTable with specified row count', () => {
    render(<SkeletonTable rows={3} />);
    const el = screen.getByLabelText('Loading table...');
    expect(el).toBeInTheDocument();
    // 1 header + 3 rows = 4 child elements in container
    expect(el.children.length).toBe(4);
  });
});
