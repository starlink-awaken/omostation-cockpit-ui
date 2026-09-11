/**
 * 进化面 Store (BET-Y1Q4-T8-24B).
 *
 * 3Y-BET Ledger 观测、战役进度、进化脉搏状态。
 */
import { create } from 'zustand';

export interface EvolutionBetRef {
  id: string;
  title: string;
  status: 'candidate' | 'pending' | 'in_progress' | 'review' | 'done' | 'blocked' | 'failed';
}

export interface EvolutionPlaneState {
  /** 关注的 BET 列表 (本地 pin) */
  pinnedBetIds: string[];
  /** 战役 ID (本地关注) */
  watchedCampaigns: string[];
  /** 进化脉搏最后刷新时间 */
  pulseRefreshedAt: number | null;

  pinBet: (id: string) => void;
  unpinBet: (id: string) => void;
  watchCampaign: (id: string) => void;
  unwatchCampaign: (id: string) => void;
  markPulseRefreshed: () => void;
}

export const useEvolutionPlaneStore = create<EvolutionPlaneState>((set) => ({
  pinnedBetIds: [],
  watchedCampaigns: [],
  pulseRefreshedAt: null,

  pinBet: (id) =>
    set((state) => ({
      pinnedBetIds: state.pinnedBetIds.includes(id)
        ? state.pinnedBetIds
        : [...state.pinnedBetIds, id],
    })),
  unpinBet: (id) =>
    set((state) => ({ pinnedBetIds: state.pinnedBetIds.filter((x) => x !== id) })),
  watchCampaign: (id) =>
    set((state) => ({
      watchedCampaigns: state.watchedCampaigns.includes(id)
        ? state.watchedCampaigns
        : [...state.watchedCampaigns, id],
    })),
  unwatchCampaign: (id) =>
    set((state) => ({
      watchedCampaigns: state.watchedCampaigns.filter((x) => x !== id),
    })),
  markPulseRefreshed: () => set({ pulseRefreshedAt: Date.now() }),
}));
