/**
 * 交付面 Store (BET-Y1Q4-T8-24B).
 *
 * 交付旅程 (delivery journey) 状态、worktree/PR 追踪、evidence 呈现。
 */
import { create } from 'zustand';

export interface DeliveryJourneyRef {
  id: string;
  stage: 'intent' | 'task' | 'run' | 'worktree' | 'verification' | 'pr' | 'evidence';
  updatedAt: number;
}

export interface DeliveryPlaneState {
  /** 交付旅程列表 */
  journeys: DeliveryJourneyRef[];
  /** 当前聚焦旅程 */
  focusedJourneyId: string | null;
  /** 证据面板开关 */
  evidencePanelOpen: boolean;

  setJourneys: (journeys: DeliveryJourneyRef[]) => void;
  focusJourney: (id: string | null) => void;
  toggleEvidencePanel: () => void;
  setEvidencePanel: (open: boolean) => void;
}

export const useDeliveryPlaneStore = create<DeliveryPlaneState>((set) => ({
  journeys: [],
  focusedJourneyId: null,
  evidencePanelOpen: false,

  setJourneys: (journeys) => set({ journeys }),
  focusJourney: (focusedJourneyId) => set({ focusedJourneyId }),
  toggleEvidencePanel: () =>
    set((state) => ({ evidencePanelOpen: !state.evidencePanelOpen })),
  setEvidencePanel: (evidencePanelOpen) => set({ evidencePanelOpen }),
}));
