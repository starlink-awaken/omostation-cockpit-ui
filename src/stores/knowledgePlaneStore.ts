/**
 * 知识面 Store (BET-Y1Q4-T8-24B).
 *
 * 六大记忆分类 + 42 技能拓扑 + 知识条目的选择与检索状态。
 */
import { create } from 'zustand';

export type MemoryTier =
  | 'episodic'
  | 'semantic'
  | 'procedural'
  | 'prospective'
  | 'emotional'
  | 'identity';

export interface KnowledgeEntityRef {
  id: string;
  kind: string;
  title: string;
}

export interface KnowledgePlaneState {
  /** 当前选中记忆分类 */
  activeMemoryTier: MemoryTier | null;
  /** 当前选中技能拓扑节点 */
  activeSkillNodeId: string | null;
  /** 知识检索关键词 */
  searchQuery: string;
  /** 最近浏览的知识实体 */
  recentEntities: KnowledgeEntityRef[];

  setActiveMemoryTier: (tier: MemoryTier | null) => void;
  setActiveSkillNode: (nodeId: string | null) => void;
  setSearchQuery: (q: string) => void;
  pushRecentEntity: (entity: KnowledgeEntityRef) => void;
  clearRecentEntities: () => void;
}

const MAX_RECENT = 20;

export const useKnowledgePlaneStore = create<KnowledgePlaneState>((set) => ({
  activeMemoryTier: null,
  activeSkillNodeId: null,
  searchQuery: '',
  recentEntities: [],

  setActiveMemoryTier: (activeMemoryTier) => set({ activeMemoryTier }),
  setActiveSkillNode: (activeSkillNodeId) => set({ activeSkillNodeId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  pushRecentEntity: (entity) =>
    set((state) => ({
      recentEntities: [
        entity,
        ...state.recentEntities.filter((e) => e.id !== entity.id),
      ].slice(0, MAX_RECENT),
    })),
  clearRecentEntities: () => set({ recentEntities: [] }),
}));
