import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  const dummyRoutes = {
    govern: [
      {
        id: 'Panorama',
        path: '/panorama',
        label: '治理全景',
        group: 'govern',
        icon: 'compass',
        component: () => <div>Panorama View</div>,
      },
    ],
  };

  it('renders sidebar brand and domain tabs', () => {
    render(
      <MemoryRouter>
        <Sidebar
          groupedRoutes={dummyRoutes}
          activeDomain="all"
          collapsedGroups={new Set()}
          onDomainSelect={vi.fn()}
          onToggleGroup={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Cockpit Console')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  it('triggers onNavigate with Panorama when clicking the native panorama button', () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar
          groupedRoutes={dummyRoutes}
          activeDomain="all"
          collapsedGroups={new Set()}
          onDomainSelect={vi.fn()}
          onToggleGroup={vi.fn()}
          onNavigate={onNavigate}
        />
      </MemoryRouter>,
    );

    const panoramaBtn = screen.getByRole('button', { name: '打开全景大屏' });
    expect(panoramaBtn).toBeInTheDocument();
    fireEvent.click(panoramaBtn);
    expect(onNavigate).toHaveBeenCalledWith('Panorama');
  });

  it('triggers onOpenGuardianInspection when clicking inspect button', () => {
    const onOpenGuardian = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar
          groupedRoutes={dummyRoutes}
          activeDomain="all"
          collapsedGroups={new Set()}
          onDomainSelect={vi.fn()}
          onToggleGroup={vi.fn()}
          onNavigate={vi.fn()}
          onOpenGuardianInspection={onOpenGuardian}
        />
      </MemoryRouter>,
    );

    const inspectBtn = screen.getByRole('button', { name: '打开哨兵速查抽屉' });
    expect(inspectBtn).toBeInTheDocument();
    fireEvent.click(inspectBtn);
    expect(onOpenGuardian).toHaveBeenCalledTimes(1);
  });

  it('does not contain external 43191 links (native convergence)', () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar
          groupedRoutes={dummyRoutes}
          activeDomain="all"
          collapsedGroups={new Set()}
          onDomainSelect={vi.fn()}
          onToggleGroup={vi.fn()}
          onNavigate={vi.fn()}
        />
      </MemoryRouter>,
    );

    const externalLinks = container.querySelectorAll('a[href*="43191"]');
    expect(externalLinks.length).toBe(0);
  });
});
