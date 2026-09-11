/**
 * ⌘K 命令面板纯逻辑层 (BET-Y1Q4-T8-24B).
 *
 * 与组件分离以满足 react-refresh/only-export-components。
 */
import { create } from 'zustand';
import { normalizeSearchText } from '../utils/search';
import { COCKPIT_PAGE_REGISTRY, type CockpitPageRegistryItem } from '../components/cockpitPageRegistry';

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  keywords: string[];
  action: () => void;
}

interface CommandPaletteState {
  open: boolean;
  query: string;
  setOpen: (open: boolean) => void;
  setQuery: (q: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  query: '',
  setOpen: (open) => set({ open, query: open ? '' : '' }),
  setQuery: (query) => set({ query }),
}));

/** 构建命令项: 页面注册表 + 注入的外部实体 (BOS 服务 / 能力) */
export function buildCommandItems(
  pages: CockpitPageRegistryItem[] = COCKPIT_PAGE_REGISTRY,
  extraEntities: { id: string; title: string; group: string; keywords?: string[]; action: () => void }[] = [],
): CommandItem[] {
  const pageItems: CommandItem[] = pages.map((p) => ({
    id: `page:${p.id}`,
    title: p.title,
    subtitle: p.purpose,
    group: p.group,
    keywords: p.dimensions,
    action: () => {
      window.location.hash = `#${p.id}`;
    },
  }));
  const entityItems: CommandItem[] = extraEntities.map((e) => ({
    id: `entity:${e.id}`,
    title: e.title,
    subtitle: e.id,
    group: e.group,
    keywords: e.keywords ?? [],
    action: e.action,
  }));
  return [...pageItems, ...entityItems];
}

/** 模糊检索: 前缀 > 子串 > 关键词, 稳定排序 */
export function fuzzyFilter(items: CommandItem[], query: string): CommandItem[] {
  const q = normalizeSearchText(query);
  if (!q) return items.slice(0, 50);
  const scored: { item: CommandItem; score: number }[] = [];
  for (const item of items) {
    const title = normalizeSearchText(item.title);
    const sub = normalizeSearchText(item.subtitle);
    const kw = item.keywords.map(normalizeSearchText).join(' ');
    let score = -1;
    if (title.startsWith(q)) score = 100;
    else if (title.includes(q)) score = 80;
    else if (sub.includes(q)) score = 60;
    else if (kw.includes(q)) score = 40;
    else if (q.split(' ').every((w) => (title + ' ' + kw).includes(w))) score = 20;
    if (score > 0) scored.push({ item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 50)
    .map((s) => s.item);
}
