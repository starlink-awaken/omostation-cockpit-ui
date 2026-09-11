/**
 * 业务面 Store (BET-Y1Q4-T8-24B).
 *
 * Work Cases 业务协同 + HITL 签名待办 + 协作流状态。
 */
import { create } from 'zustand';

export interface WorkCaseRef {
  id: string;
  title: string;
  status: 'open' | 'running' | 'blocked' | 'closed';
  updatedAt: number;
}

export interface BusinessPlaneState {
  /** 业务案件列表 (引用, 非全量持久化) */
  workCases: WorkCaseRef[];
  /** 当前聚焦案件 */
  focusedCaseId: string | null;
  /** HITL 签名待办数 */
  hitlPendingCount: number;

  setWorkCases: (cases: WorkCaseRef[]) => void;
  focusCase: (id: string | null) => void;
  setHitlPendingCount: (n: number) => void;
}

export const useBusinessPlaneStore = create<BusinessPlaneState>((set) => ({
  workCases: [],
  focusedCaseId: null,
  hitlPendingCount: 0,

  setWorkCases: (workCases) => set({ workCases }),
  focusCase: (focusedCaseId) => set({ focusedCaseId }),
  setHitlPendingCount: (hitlPendingCount) => set({ hitlPendingCount }),
}));
