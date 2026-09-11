/**
 * 六面正交 Store 统一出口 (BET-Y1Q4-T8-24B).
 *
 * 正交性约定:
 * - 每个 plane store 只管自己的状态, 互相零 import
 * - 跨面组合只发生在组件层 (selector 组合), 不发生在 store 层
 * - 旧 src/store.ts (useCockpitStore) 保持兼容, 不在此文件重新导出
 */
export { useControlPlaneStore } from './controlPlaneStore';
export type { ControlPlaneState } from './controlPlaneStore';

export { useKnowledgePlaneStore } from './knowledgePlaneStore';
export type { KnowledgePlaneState, MemoryTier, KnowledgeEntityRef } from './knowledgePlaneStore';

export { useBusinessPlaneStore } from './businessPlaneStore';
export type { BusinessPlaneState, WorkCaseRef } from './businessPlaneStore';

export { useEvolutionPlaneStore } from './evolutionPlaneStore';
export type { EvolutionPlaneState, EvolutionBetRef } from './evolutionPlaneStore';

export { useCollaborationPlaneStore } from './collaborationPlaneStore';
export type { CollaborationPlaneState, CollaborationMessage } from './collaborationPlaneStore';

export { useDeliveryPlaneStore } from './deliveryPlaneStore';
export type { DeliveryPlaneState, DeliveryJourneyRef } from './deliveryPlaneStore';

export {
  useCommandPaletteStore,
  buildCommandItems,
  fuzzyFilter,
} from './commandPaletteCore';
export type { CommandItem } from './commandPaletteCore';
export { CommandPalette } from './commandPalette';
