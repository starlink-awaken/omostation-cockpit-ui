import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeepTelemetryDrawer } from '../DeepTelemetryDrawer';
import { FALLBACK_PANORAMA_DATA } from '../../../api/hooks/useGovernancePanorama';

const liveData = {
  ...FALLBACK_PANORAMA_DATA,
  knowledge_health: { total: 342, fresh: 318, stale: 24, orphaned: 0, freshness_pct: 93, coverage_pct: 95, orphan_pct: 0 },
  experience_graph: { nodes_by_type: {}, internal_refs: 412, hotspots: [], connectivity_pct: 76.5 },
  workspace: {
    total_worktrees: 1, worktrees: [{ path: '/tmp/worktree', branch: 'main' }],
    total_lock_files: 0, lock_files: [],
  },
  launchd_health: { available: true, verdict: 'PASS' as const, loaded: 2, failed: 0, jobs: [{ name: 'zhixing-sunset-redirector', label: 'zhixing-sunset-redirector', loaded: true, verdict: 'PASS' as const }, { name: 'guardian-74s-pulse', label: 'guardian-74s-pulse', loaded: true, verdict: 'PASS' as const }] },
  connectors: { total: 1, available: ['apple_mail'], wired_to_scenes: ['apple_mail'], unwired_available: [] },
};
const liveSource = { sourceState: 'LIVE' as const, sourceFailure: null, sourceObservedAt: new Date().toISOString(), sourceAgeMs: 0 };

describe('DeepTelemetryDrawer Component Tests', () => {
  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={false}
        onClose={handleClose}
        data={FALLBACK_PANORAMA_DATA}
        sourceState="UNKNOWN" sourceFailure="Connection refused" sourceObservedAt={null} sourceAgeMs={null}
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
        data={liveData}
        {...liveSource}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('系统深度遥测透视')).toBeInTheDocument();
    expect(screen.getByText('知识健康度指标 (Knowledge Health)')).toBeInTheDocument();
    expect(screen.getByText('342')).toBeInTheDocument(); // total docs
    expect(screen.getByText('93%')).toBeInTheDocument(); // freshness
    expect(screen.getByText('Cockpit BFF 治理投影 · 来源与新鲜度以 source provenance 为准')).toBeInTheDocument();
  });

  it('switches to hygiene tab and renders worktree & remote hygiene info', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={liveData}
        {...liveSource}
      />
    );

    const hygieneTabBtn = screen.getByText('工作区与卫生');
    fireEvent.click(hygieneTabBtn);

    expect(screen.getByText(/观察到的 Worktree 条目/)).toBeInTheDocument();
    expect(screen.getByText(/Workflow lock 文件枚举/)).toBeInTheDocument();
    expect(screen.getByText('未采集 Remote 状态')).toBeInTheDocument();
  });

  it.each(['UNKNOWN', 'STALE'] as const)('does not present hygiene success claims for %s data', (sourceState) => {
    render(<DeepTelemetryDrawer isOpen onClose={vi.fn()} data={liveData} sourceState={sourceState} sourceFailure="source unavailable" sourceObservedAt={null} sourceAgeMs={null} />);
    fireEvent.click(screen.getByText('工作区与卫生'));
    expect(screen.getByText('Worktree 状态 (UNKNOWN)')).toBeInTheDocument();
    expect(screen.getByText('锁文件枚举未验证')).toBeInTheDocument();
    expect(screen.getByText('未采集 Remote 状态')).toBeInTheDocument();
    expect(screen.queryByText('无僵尸死锁')).not.toBeInTheDocument();
    expect(screen.queryByText('Origin 隔离正常')).not.toBeInTheDocument();
  });

  it('keeps a within-TTL last-good workspace value visible as partial when the latest read failed', () => {
    const data = {
      ...liveData,
      facet_observations: {
        workspace: {
          state: 'PARTIAL' as const,
          observation_status: 'STALE' as const,
          observed_at: new Date().toISOString(),
          age_ms: 1000,
          last_attempt_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          error_class: 'collector_error',
          duration_ms: 15,
          overrun: false,
          source_digest: 'b'.repeat(64),
          source_generation_id: null,
          source_revision_id: null,
          value: liveData.workspace,
          provenance: {
            kind: 'direct-read',
            source_ref: 'collect_workspace_hygiene',
            collector_sha256: 'a'.repeat(64),
          },
        },
      },
    };
    render(<DeepTelemetryDrawer isOpen onClose={vi.fn()} data={data} sourceState="STALE" sourceFailure="projection stale" sourceObservedAt={null} sourceAgeMs={null} partialFacets={['workspace']} />);

    fireEvent.click(screen.getByText('工作区与卫生'));

    expect(screen.getByText('最近成功观察的 Worktree 条目 (1)')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('未判断锁的存活或归属')).toBeInTheDocument();
  });

  it('renders PARTIAL facet metrics as UNKNOWN instead of zero or healthy', () => {
    render(
      <DeepTelemetryDrawer
        isOpen
        onClose={vi.fn()}
        data={liveData}
        sourceState="PARTIAL"
        sourceFailure="field_provenance_missing"
        sourceObservedAt="2026-10-07T00:00:00Z"
        sourceAgeMs={12_000}
        partialFacets={['knowledge_health', 'experience_graph', 'workspace', 'launchd_health', 'connectors']}
      />,
    );

    expect(screen.getByText(/遥测来源 PARTIAL/)).toBeInTheDocument();
    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
    expect(screen.queryByText('342')).not.toBeInTheDocument();
    expect(screen.queryByText('93%')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('工作区与卫生'));
    expect(screen.getByText('Worktree 状态 (UNKNOWN)')).toBeInTheDocument();
    expect(screen.queryByText('Origin 隔离正常')).not.toBeInTheDocument();
  });

  it('switches to runtime tab and renders launchd jobs & connectors', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={liveData}
        {...liveSource}
      />
    );

    const runtimeTabBtn = screen.getByText('守护与连接器');
    fireEvent.click(runtimeTabBtn);

    expect(screen.getByText(/系统 Launchd 守护进程/)).toBeInTheDocument();
    expect(screen.getAllByText('zhixing-sunset-redirector').length).toBeGreaterThan(0);
    expect(screen.getAllByText('guardian-74s-pulse').length).toBeGreaterThan(0);
    expect(screen.getByText('apple_mail')).toBeInTheDocument();
  });

  it.each(['UNKNOWN', 'STALE'] as const)('does not present runtime records for %s data', (sourceState) => {
    render(<DeepTelemetryDrawer isOpen onClose={vi.fn()} data={liveData} sourceState={sourceState} sourceFailure="source unavailable" sourceObservedAt={null} sourceAgeMs={null} />);
    fireEvent.click(screen.getByText('守护与连接器'));
    expect(screen.getByText('Launchd 状态 (UNKNOWN)')).toBeInTheDocument();
    expect(screen.getByText('连接器状态 (UNKNOWN)')).toBeInTheDocument();
    expect(screen.queryByText('apple_mail')).not.toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <DeepTelemetryDrawer
        isOpen={true}
        onClose={handleClose}
        data={liveData}
        {...liveSource}
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
        data={liveData}
        {...liveSource}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
