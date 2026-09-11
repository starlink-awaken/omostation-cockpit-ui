/**
 * 六面正交 Store 测试 (BET-Y1Q4-T8-24B).
 *
 * 核心断言: 状态解耦互不污染 — 一个 store 的 set 不影响其他 store。
 */
import { describe, expect, it, beforeEach } from 'bun:test';
import {
  useControlPlaneStore,
  useKnowledgePlaneStore,
  useBusinessPlaneStore,
  useEvolutionPlaneStore,
  useCollaborationPlaneStore,
  useDeliveryPlaneStore,
  useCommandPaletteStore,
} from './index';
import { buildCommandItems, fuzzyFilter, useCommandPaletteStore } from './commandPaletteCore';

const resetAll = () => {
  useControlPlaneStore.setState({
    decisionInboxPending: 0,
    activeWorkCases: 0,
    omoConnected: false,
    lastSyncedAt: null,
  });
  useKnowledgePlaneStore.setState({
    activeMemoryTier: null,
    activeSkillNodeId: null,
    searchQuery: '',
    recentEntities: [],
  });
  useBusinessPlaneStore.setState({ workCases: [], focusedCaseId: null, hitlPendingCount: 0 });
  useEvolutionPlaneStore.setState({ pinnedBetIds: [], watchedCampaigns: [], pulseRefreshedAt: null });
  useCollaborationPlaneStore.setState({ activeAgents: 0, unreadMessages: [], sessionFilter: null });
  useDeliveryPlaneStore.setState({ journeys: [], focusedJourneyId: null, evidencePanelOpen: false });
  useCommandPaletteStore.setState({ open: false, query: '' });
};

describe('六面正交 Store', () => {
  beforeEach(resetAll);

  it('控制面: 独立更新计数与连接态', () => {
    useControlPlaneStore.getState().setDecisionInboxPending(3);
    useControlPlaneStore.getState().setOmoConnected(true);
    const s = useControlPlaneStore.getState();
    expect(s.decisionInboxPending).toBe(3);
    expect(s.omoConnected).toBe(true);
  });

  it('知识面: recentEntities 去重且截断 20 条', () => {
    for (let i = 0; i < 25; i++) {
      useKnowledgePlaneStore
        .getState()
        .pushRecentEntity({ id: `e${i}`, kind: 'bet', title: `T${i}` });
    }
    const s = useKnowledgePlaneStore.getState();
    expect(s.recentEntities.length).toBe(20);
    expect(s.recentEntities[0].id).toBe('e24');
    // 去重: 再推 e24, 不重复
    useKnowledgePlaneStore.getState().pushRecentEntity({ id: 'e24', kind: 'bet', title: 'T24' });
    expect(useKnowledgePlaneStore.getState().recentEntities.filter((e) => e.id === 'e24').length).toBe(1);
  });

  it('正交性: 业务面 set 不污染知识面/进化面', () => {
    useKnowledgePlaneStore.getState().setSearchQuery('ledger');
    useEvolutionPlaneStore.getState().pinBet('BET-1');
    useBusinessPlaneStore.getState().setWorkCases([
      { id: 'wc1', title: '案件', status: 'open', updatedAt: 1 },
    ]);
    expect(useKnowledgePlaneStore.getState().searchQuery).toBe('ledger');
    expect(useEvolutionPlaneStore.getState().pinnedBetIds).toEqual(['BET-1']);
    expect(useBusinessPlaneStore.getState().workCases.length).toBe(1);
    // 业务面更新后其他两面仍不变
    useBusinessPlaneStore.getState().focusCase('wc1');
    expect(useKnowledgePlaneStore.getState().searchQuery).toBe('ledger');
    expect(useEvolutionPlaneStore.getState().pinnedBetIds).toEqual(['BET-1']);
  });

  it('协作面: push 未读消息并 markAllRead', () => {
    useCollaborationPlaneStore.getState().pushMessage({
      id: 'm1', from: 'agent-a', preview: 'hello', at: Date.now(),
    });
    expect(useCollaborationPlaneStore.getState().unreadMessages.length).toBe(1);
    useCollaborationPlaneStore.getState().markAllRead();
    expect(useCollaborationPlaneStore.getState().unreadMessages.length).toBe(0);
  });

  it('交付面: evidence panel 开关', () => {
    useDeliveryPlaneStore.getState().toggleEvidencePanel();
    expect(useDeliveryPlaneStore.getState().evidencePanelOpen).toBe(true);
    useDeliveryPlaneStore.getState().toggleEvidencePanel();
    expect(useDeliveryPlaneStore.getState().evidencePanelOpen).toBe(false);
  });

  it('进化面: pin 去重', () => {
    useEvolutionPlaneStore.getState().pinBet('BET-A');
    useEvolutionPlaneStore.getState().pinBet('BET-A');
    expect(useEvolutionPlaneStore.getState().pinnedBetIds).toEqual(['BET-A']);
  });
});

describe('⌘K 命令面板', () => {
  beforeEach(() => useCommandPaletteStore.setState({ open: false, query: '' }));

  const pages = [
    { id: 'home', title: '运行大盘', group: '入口', purpose: '总览', dimensions: ['dashboard'] },
    { id: 'know', title: '知识中枢', group: '智能与知识', purpose: '六记忆', dimensions: ['memory'] },
    { id: 'bos-debug', title: 'BOS 调试', group: '开发工具', purpose: '302 服务调试', dimensions: ['bos'] },
  ];
  const items = buildCommandItems(pages, [
    { id: 'bos:resident/task/submit', title: 'resident task submit', group: 'BOS', action: () => {} },
  ]);

  it('命令项包含页面与注入实体', () => {
    expect(items.length).toBe(4);
    expect(items.some((i) => i.id === 'entity:bos:resident/task/submit')).toBe(true);
  });

  it('空 query 返回前 50 条', () => {
    expect(fuzzyFilter(items, '').length).toBe(4);
  });

  it('前缀匹配得分最高且排序在前', () => {
    const r = fuzzyFilter(items, 'bos');
    expect(r[0].id).toBe('page:bos-debug');
  });

  it('无匹配返回空数组', () => {
    expect(fuzzyFilter(items, 'zzzz-not-exist')).toEqual([]);
  });

  it('palette store 开关与 query 联动', () => {
    useCommandPaletteStore.getState().setOpen(true);
    expect(useCommandPaletteStore.getState().open).toBe(true);
    useCommandPaletteStore.getState().setQuery('abc');
    expect(useCommandPaletteStore.getState().query).toBe('abc');
    useCommandPaletteStore.getState().setOpen(false);
    expect(useCommandPaletteStore.getState().open).toBe(false);
  });
});
