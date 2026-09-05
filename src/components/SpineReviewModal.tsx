import React, { useMemo, useState } from "react";

/**
 * SpineReviewModal — Web 审阅工作台 (BET-Y1Q3-T10-116)
 *
 * 左右分栏展示初稿与当前编辑态的实时 Diff（行级 -/+ 标记），
 * 确认按钮触发 `cockpit spine send`（经外发网关 spool 队列）。
 * diffLines 由后端 `spine review --json` 的 draft_lines/edited_lines 提供；
 * 组件侧只做展示与确认动作，保持薄客户端。
 */

export interface SpineReviewModalProps {
  open: boolean;
  draftLines: string[];
  editedLines: string[];
  channel?: "api" | "smtp";
  to?: string;
  onConfirm?: (channel: "api" | "smtp", to: string) => void;
  onClose?: () => void;
}

function isChanged(line: string): boolean {
  return line.startsWith("- ") || line.startsWith("+ ");
}

export const SpineReviewModal: React.FC<SpineReviewModalProps> = ({
  open,
  draftLines,
  editedLines,
  channel = "api",
  to = "",
  onConfirm,
  onClose,
}) => {
  const [dest, setDest] = useState(to);
  const [ch, setCh] = useState<"api" | "smtp">(channel);
  const rowCount = useMemo(() => Math.max(draftLines.length, editedLines.length), [draftLines, editedLines]);
  const changedCount = useMemo(
    () => draftLines.filter(isChanged).length + editedLines.filter(isChanged).length,
    [draftLines, editedLines],
  );

  if (!open) return null;

  return (
    <div className="spine-review-modal" role="dialog" aria-label="Spine 审阅工作台" data-testid="spine-review-modal">
      <header>
        <h3>Spine 审阅 · 左右分栏 Diff</h3>
        <span data-testid="changed-count">{changedCount} 处变更</span>
        <button aria-label="关闭" onClick={onClose}>×</button>
      </header>
      <div className="spine-review-columns">
        <div className="spine-review-col" data-testid="draft-column">
          <h4>初稿 (draft)</h4>
          <pre>
            {draftLines.map((l, i) => (
              <div key={`d${i}`} className={isChanged(l) ? "changed" : ""}>{l}</div>
            ))}
          </pre>
        </div>
        <div className="spine-review-col" data-testid="edited-column">
          <h4>当前编辑态 (edited)</h4>
          <pre>
            {editedLines.map((l, i) => (
              <div key={`e${i}`} className={isChanged(l) ? "changed" : ""}>{l}</div>
            ))}
          </pre>
        </div>
      </div>
      <footer>
        <select aria-label="外发通道" value={ch} onChange={(e) => setCh(e.target.value as "api" | "smtp")}>
          <option value="api">致远 OA API</option>
          <option value="smtp">邮箱 SMTP</option>
        </select>
        <input
          aria-label="外发目标"
          placeholder="收件地址"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
        />
        <button
          data-testid="confirm-send"
          disabled={!dest}
          onClick={() => onConfirm?.(ch, dest)}
        >
          一键确认署名并外发
        </button>
      </footer>
      <span data-testid="row-count" hidden>{rowCount}</span>
    </div>
  );
};

export default SpineReviewModal;
