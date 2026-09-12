/** WorkCaseCard — 单案件卡片 (状态色标 + 场景标签). */
import React from 'react';
import type { WorkCase } from '../../views/OperationsView';

const LABEL: Record<string, string> = {
  open: '待处理', in_progress: '进行中', blocked: '受阻', done: '已完成',
};
const COLOR: Record<string, string> = {
  open: '#3b82f6', in_progress: '#f59e0b', blocked: '#ef4444', done: '#22c55e',
};

export default function WorkCaseCard({ workCase: c }: { workCase: WorkCase }) {
  return (
    <div data-testid={`case-${c.id}`} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <strong>{c.title}</strong>
      <span style={{ color: COLOR[c.status], marginLeft: 12 }}>{LABEL[c.status]}</span>
      {c.scene && <span style={{ marginLeft: 12, color: '#888' }}>{c.scene}</span>}
      <div style={{ color: '#aaa', fontSize: 12 }}>{c.updated_at}</div>
    </div>
  );
}
