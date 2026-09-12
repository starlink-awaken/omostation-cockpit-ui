/**
 * useObservatory — 拉取 43191/cockpit observatory 快照数据 (BET-Y1Q4-T8-24C).
 *
 * 数据源: /api/v1/observatory (cockpit 端 24A 收敛的统一数据面)。
 * 按 kind 检索实体, 供 StudioView 六大区块消费。
 */
import { useQuery } from '@tanstack/react-query';

export interface ObservatoryEntity {
  id: string;
  title: string;
  kind: string;
  status?: string;
  facts?: Record<string, unknown>;
}

async function searchByKind(kind: string, limit = 100): Promise<ObservatoryEntity[]> {
  const res = await fetch(
    `/api/v1/observatory/query?operation=search&kind=${encodeURIComponent(kind)}&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`observatory search ${kind} -> ${res.status}`);
  const envelope = (await res.json()) as { data?: { items?: ObservatoryEntity[] } };
  return envelope.data?.items ?? [];
}

export function useObservatoryEntities(kind: string, limit = 100) {
  return useQuery({
    queryKey: ['observatory', kind, limit],
    queryFn: () => searchByKind(kind, limit),
    staleTime: 60_000,
  });
}

/** 记忆类型清单 (snapshot 里 kind=memory_type, 实际 6+ 条) */
export function useMemoryTypes() {
  return useObservatoryEntities('memory_type', 20);
}

/** 技能拓扑节点 (kind=skill, 42 条) */
export function useSkills() {
  return useObservatoryEntities('skill', 100);
}

/** BOS 服务网格 (kind=bos_service, 306 条) */
export function useBosServices() {
  return useObservatoryEntities('bos_service', 400);
}

/** 受管文档 (kind=document, 46+ 条) */
export function useDocuments() {
  return useObservatoryEntities('document', 100);
}
