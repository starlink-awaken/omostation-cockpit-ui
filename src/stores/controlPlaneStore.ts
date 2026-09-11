/**
 * 控制面 Store (BET-Y1Q4-T8-24B).
 *
 * 六面正交 Store 之一: 控制面 (OMO 控制台 / 决策收件箱 / Work Cases 入口态)。
 * 严格解耦: 不引用其他五面 store, 状态不跨界。
 */
import { create } from 'zustand';

export interface ControlPlaneState {
  /** 决策收件箱待办数 */
  decisionInboxPending: number;
  /** Work Cases 活跃案件数 */
  activeWorkCases: number;
  /** OMO 控制台连接态 */
  omoConnected: boolean;
  /** 数据新鲜度 (ISO 时间) */
  lastSyncedAt: string | null;

  setDecisionInboxPending: (n: number) => void;
  setActiveWorkCases: (n: number) => void;
  setOmoConnected: (connected: boolean) => void;
  markSynced: () => void;
}

export const useControlPlaneStore = create<ControlPlaneState>((set) => ({
  decisionInboxPending: 0,
  activeWorkCases: 0,
  omoConnected: false,
  lastSyncedAt: null,

  setDecisionInboxPending: (decisionInboxPending) => set({ decisionInboxPending }),
  setActiveWorkCases: (activeWorkCases) => set({ activeWorkCases }),
  setOmoConnected: (omoConnected) => set({ omoConnected }),
  markSynced: () => set({ lastSyncedAt: new Date().toISOString() }),
}));
