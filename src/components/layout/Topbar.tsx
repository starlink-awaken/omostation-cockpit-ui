import React, { useState } from 'react';
import type { LiveTelemetryState } from '../../api/liveTelemetry';
import UserMenu from '../common/UserMenu';
import TelemetryPopover from '../common/TelemetryPopover';

export interface TopbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenCommandPalette: (query?: string) => void;
  onOpenQuickActions: () => void;
  telemetry: LiveTelemetryState;
  onNavigateToPanorama: () => void;
  onOpenCopilot?: () => void;
  onOpenGuardianInspection?: () => void;
}

export function Topbar({
  searchQuery,
  onSearchChange,
  onOpenCommandPalette,
  onOpenQuickActions,
  telemetry,
  onNavigateToPanorama,
  onOpenCopilot,
  onOpenGuardianInspection,
}: TopbarProps) {
  const [isTelemetryPopoverOpen, setIsTelemetryPopoverOpen] = useState(false);
  const snapshotState = telemetry.snapshotState ?? 'UNKNOWN';
  const hasCurrentSnapshot = snapshotState === 'LIVE';
  const bffState = telemetry.isLoading ? 'BFF CONNECTING' : telemetry.connected ? 'BFF READY' : 'BFF UNAVAILABLE';

  return (
    <header className="topbar">
      <div className="search-bar-modern" role="search">
        <span className="search-icon-modern">🔍</span>
        <input
          type="text"
          placeholder="搜索服务、模型、智能体..."
          aria-label="全局搜索输入框"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOpenCommandPalette(searchQuery);
          }}
        />
        <kbd className="search-shortcut" onClick={() => onOpenCommandPalette(searchQuery)}>⌘K</kbd>
      </div>

      <div className="topbar-actions">
        <div style={{ position: 'relative' }}>
          <div
            className="topbar-telemetry-badge"
            onClick={() => setIsTelemetryPopoverOpen(!isTelemetryPopoverOpen)}
            title="Cockpit 治理全景数据源 - 点击展开指标浮窗"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsTelemetryPopoverOpen(!isTelemetryPopoverOpen);
              }
            }}
            aria-label="Cockpit 治理全景数据源"
            aria-expanded={isTelemetryPopoverOpen}
          >
            <span className={`telemetry-dot ${!telemetry.isLoading && telemetry.connected && hasCurrentSnapshot ? 'connected' : 'fallback'}`} />
            <span className="telemetry-text">COCKPIT {bffState} · SNAPSHOT {snapshotState}</span>
            <span className="telemetry-pill">
              门禁 {hasCurrentSnapshot ? `${telemetry.gates.filter((g) => g.verdict === 'PASS').length}/${telemetry.gates.length}` : 'UNKNOWN'}
            </span>
            <span className="telemetry-pill">
              台账 {hasCurrentSnapshot ? `${telemetry.betStats.done}/${telemetry.betStats.total}` : 'UNKNOWN'}
            </span>
          </div>

          <TelemetryPopover
            isOpen={isTelemetryPopoverOpen}
            onClose={() => setIsTelemetryPopoverOpen(false)}
            telemetry={telemetry}
            onOpenGuardianInspection={onOpenGuardianInspection}
            onNavigate={() => {
              setIsTelemetryPopoverOpen(false);
              onNavigateToPanorama();
            }}
          />
        </div>

        {onOpenCopilot && (
          <button
            className="topbar-btn"
            onClick={onOpenCopilot}
            title="数字大脑 Copilot 随行抽屉 (Ctrl+Space)"
            aria-label="数字大脑 Copilot"
            style={{ color: '#818cf8' }}
          >
            ✨
          </button>
        )}

        <button
          className="topbar-btn"
          onClick={() => onOpenCommandPalette(searchQuery)}
          title="命令面板 (Ctrl+K)"
        >
          ⌘
        </button>
        <button
          className="topbar-btn"
          onClick={onOpenQuickActions}
          title="快捷操作 (Ctrl+J)"
        >
          ⚡
        </button>
      </div>
      <UserMenu />
    </header>
  );
}

export default Topbar;
