import React, { useState } from 'react';
import type { LiveTelemetryData } from '../../api/liveTelemetry';
import UserMenu from '../common/UserMenu';
import TelemetryPopover from '../common/TelemetryPopover';

export interface TopbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenCommandPalette: (query?: string) => void;
  onOpenQuickActions: () => void;
  telemetry: LiveTelemetryData;
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
            title="知行实时遥测 (端口 43191) - 点击展开指标浮窗"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsTelemetryPopoverOpen(!isTelemetryPopoverOpen);
              }
            }}
            aria-label="知行实时遥测"
            aria-expanded={isTelemetryPopoverOpen}
          >
            <span className={`telemetry-dot ${telemetry?.connected ? 'connected' : 'fallback'}`} />
            <span className="telemetry-text">43191 {telemetry?.connected ? 'LIVE' : 'SYNC'}</span>
            <span className="telemetry-pill">
              门禁 {(telemetry?.gates || []).filter((g) => g.verdict === 'PASS').length}/{(telemetry?.gates || []).length}
            </span>
            <span className="telemetry-pill">
              台账 {telemetry?.betStats?.done ?? 0}/{telemetry?.betStats?.total ?? 0}
            </span>
          </div>

          <TelemetryPopover
            isOpen={isTelemetryPopoverOpen}
            onClose={() => setIsTelemetryPopoverOpen(false)}
            telemetry={telemetry}
            onOpenGuardianInspection={onOpenGuardianInspection}
            onNavigate={(_path) => {
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
