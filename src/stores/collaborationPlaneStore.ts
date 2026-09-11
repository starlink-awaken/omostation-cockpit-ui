/**
 * 协作面 Store (BET-Y1Q4-T8-24B).
 *
 * Multi-agent 协作会话、IRC 消息流、共享认领状态。
 */
import { create } from 'zustand';

export interface CollaborationMessage {
  id: string;
  from: string;
  preview: string;
  at: number;
}

export interface CollaborationPlaneState {
  /** 活跃协作 agent 数 */
  activeAgents: number;
  /** 未读协作消息 */
  unreadMessages: CollaborationMessage[];
  /** 当前会话过滤 */
  sessionFilter: string | null;

  setActiveAgents: (n: number) => void;
  pushMessage: (msg: CollaborationMessage) => void;
  markAllRead: () => void;
  setSessionFilter: (session: string | null) => void;
}

export const useCollaborationPlaneStore = create<CollaborationPlaneState>((set) => ({
  activeAgents: 0,
  unreadMessages: [],
  sessionFilter: null,

  setActiveAgents: (activeAgents) => set({ activeAgents }),
  pushMessage: (msg) =>
    set((state) => ({ unreadMessages: [msg, ...state.unreadMessages].slice(0, 50) })),
  markAllRead: () => set({ unreadMessages: [] }),
  setSessionFilter: (sessionFilter) => set({ sessionFilter }),
}));
