import { useMemo } from 'react';
import type {
  CapabilityGapClosureRow,
  CockpitPage,
  CoverageAttentionProject,
  DraftTask,
  FeatureDomain,
  PageMaturity,
  PageMaturityFilter,
  ProjectAction,
  ProjectCapabilityCoverage,
  ProjectCoverageCheck,
  ProjectItem,
  ProjectPortfolioPriority,
  ProjectTriageQueue,
  RoadmapItem,
  SystemMapPayload,
  SystemMapWorkbenchRow,
  UsagePath,
} from './types';
import {
  draftPriorityWeight,
  draftSourceWeight,
  triageRiskWeight,
} from './utils';
import { useSystemMapCoverage } from './useSystemMapCoverage';
import { useSystemMapMaturity } from './useSystemMapMaturity';

export function findMatchingDraft(project: ProjectItem, draftTasks: DraftTask[]): DraftTask | null {
  const portfolioDraft = draftTasks.find(
    (task) => task.source?.type === 'system_map_project_portfolio' && task.source?.id === project.id
  );
  if (portfolioDraft) return portfolioDraft;
  return null;
}

export type LayoutInputs = {
  systemMap: SystemMapPayload | null;
  draftTasks: DraftTask[];
  projectFilter: string;
  coverageFilter: string;
  portfolioFilter: string;
  projectLayerFilter: string;
  projectPageFilter: string;
  projectQuery: string;
  selectedProjectId: string | null;
  selectedUsagePathId: string | null;
  selectedGapId: string | null;
  selectedPageMaturityId: string | null;
  pageMaturityFilter: PageMaturityFilter;
  selectedFeatureDomainId: string | null;
  selectedProjectIds: string[];
};

export type LayoutOutputs = {
  pagesById: Map<string, CockpitPage>;
  projectsById: Map<string, ProjectItem>;
  projectLayerOptions: string[];
  projectPageOptions: { id: string; title: string }[];
  pageGroups: [string, CockpitPage[]][];
  projectFocusOptions: SystemMapPayload['project_focus']['queues'] & { id: string; title: string; severity: string; reason: string; count: number; project_ids: string[]; top_projects: { id: string; diagnostics: ProjectItem['diagnostics'] }[] }[];
  coverageFilterOptions: (ProjectCapabilityCoverage['dimension_summary'][number] & { id: string; title: string; description: string })[];
  coverageDimensions: { id: string; title: string; description: string }[];
  activeCoverage: (ProjectCapabilityCoverage['dimension_summary'][number] & { id: string; title: string; description: string }) | undefined;
  activePortfolioBucket: SystemMapPayload['project_portfolio']['buckets'][number] | null;
  projectEntryRows: { priority: ProjectPortfolioPriority; project: ProjectItem; page: CockpitPage | null; primaryDimension: ProjectItem['portfolio']['non_ready_dimensions'][number] | null; draft: DraftTask | null; draftTarget: { tab: string; taskQuery: string; draftKey?: string } }[];
  projectEntrySummary: { mapped: number; drafts: number; blocked: number };
  activeRepairDimension: ProjectCapabilityCoverage['dimension_summary'][number] | null;
  dimensionRepairRows: { attention: CoverageAttentionProject; project: ProjectItem; check?: ProjectCoverageCheck; commands: ProjectAction[] }[];
  filteredProjects: ProjectItem[];
  coverageMatrixRows: { project: ProjectItem; checks: ProjectCoverageCheck[]; ready: number; warning: number; failed: number }[];
  filteredProjectIds: Set<string>;
  selectedVisibleProjectIds: string[];
  filteredTriageQueues: ProjectTriageQueue[];
  filteredTriageCommandCount: number;
  visibleCommandCount: number;
  runtimeProbeSummary: { runtimeProjects: number; stopped: number; pendingApproval: number; approved: number; commands: number };
  selectedProject: ProjectItem | null;
  activeUsagePath: UsagePath | null;
  activeUsagePageIds: Set<string>;
  activeUsagePlaybooks: SystemMapPayload['playbooks'];
  activeUsageDomains: FeatureDomain[];
  activeUsageRoadmap: RoadmapItem[];
  activeUsageProjects: ProjectItem[];
  activeUsagePlaybookIds: Set<string>;
  activeUsageTouchesDomainApps: boolean;
  activeUsageTriageCommands: ProjectAction[];
  activeUsageDrafts: DraftTask[];
  selectedGap: SystemMapPayload['gaps'][number] | null;
  pageMaturity: PageMaturity[];
  pageMaturitySummary: { ready: number; watch: number; gap: number; tracked: number; untracked: number; roadmapShipped: number };
  visiblePageMaturity: PageMaturity[];
  selectedPageMaturity: PageMaturity | null;
  selectedPageGapSignals: PageMaturity['nextAction'][];
  selectedPagePlaybooks: SystemMapPayload['playbooks'];
  selectedPageDrafts: DraftTask[];
  selectedFeatureDomain: FeatureDomain | null;
  selectedFeaturePage: CockpitPage | null;
  selectedFeatureProjects: ProjectItem[];
  selectedFeatureUsagePaths: UsagePath[];
  selectedFeaturePlaybooks: SystemMapPayload['playbooks'];
  selectedFeatureRoadmapItems: RoadmapItem[];
  selectedFeaturePageMaturity: PageMaturity | null;
  selectedFeatureDrafts: DraftTask[];
  selectedFeatureSignals: { id: string; title: string; detail: string }[];
  gapClosureRows: CapabilityGapClosureRow[];
  selectedGapClosureRow: CapabilityGapClosureRow | null;
  selectedProjectUsagePaths: UsagePath[];
  selectedProjectPlaybooks: SystemMapPayload['playbooks'];
  selectedProjectDrafts: DraftTask[];
  systemMapWorkbenchRows: SystemMapWorkbenchRow[];
  capabilityBuildBacklog: {
    pagesWithoutUsage: PageMaturity[];
    pagesWithoutDomain: PageMaturity[];
    plannedRoadmapItems: RoadmapItem[];
    gapItems: SystemMapPayload['gaps'];
    domainAttention: SystemMapPayload['domain_apps']['attention_items'];
    actionableDrafts: DraftTask[];
  };
  buildControlTower: {
    pageItems: PageMaturity[];
    domainContractItems: SystemMapPayload['domain_apps']['items'];
    verificationItems: ({ kind: 'draft'; task: DraftTask; project: ProjectItem | null } | { kind: 'project'; project: ProjectPortfolioPriority })[];
    priorityItems: ({ kind: 'project'; project: ProjectPortfolioPriority } | { kind: 'roadmap'; roadmap: RoadmapItem })[];
  };
};

export function useSystemMapLayout(inputs: LayoutInputs): LayoutOutputs {
  const {
    systemMap,
    draftTasks,
    projectFilter,
    coverageFilter,
    portfolioFilter,
    projectLayerFilter,
    projectPageFilter,
    projectQuery,
    selectedProjectId,
    selectedUsagePathId,
    selectedGapId,
    selectedPageMaturityId,
    pageMaturityFilter,
    selectedFeatureDomainId,
    selectedProjectIds,
  } = inputs;

  const pagesById = useMemo(() => {
    const index = new Map<string, CockpitPage>();
    systemMap?.cockpit_pages?.forEach((page) => index.set(page.id, page));
    return index;
  }, [systemMap]);

  const projectsById = useMemo(() => {
    const index = new Map<string, ProjectItem>();
    systemMap?.projects?.forEach((project) => index.set(project.id, project));
    return index;
  }, [systemMap]);

  const projectLayerOptions = useMemo(
    () => Array.from(new Set((systemMap?.projects || []).map((project) => project.layer).filter(Boolean))).sort(),
    [systemMap],
  );

  const projectPageOptions = useMemo(() => {
    const pageIds = Array.from(new Set((systemMap?.projects || []).map((project) => project.cockpit_page).filter(Boolean)));
    return pageIds
      .map((id) => ({ id, title: pagesById.get(id)?.title || id }))
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [pagesById, systemMap]);

  const pageGroups = useMemo(() => {
    const groups = new Map<string, CockpitPage[]>();
    systemMap?.cockpit_pages?.forEach((page) => {
      const existing = groups.get(page.group) || [];
      existing.push(page);
      groups.set(page.group, existing);
    });
    return Array.from(groups.entries());
  }, [systemMap]);

  const selectedProject = useMemo(
    () => systemMap?.projects.find((project) => project.id === selectedProjectId) || null,
    [selectedProjectId, systemMap],
  );

  const selectedGap = useMemo(
    () => systemMap?.gaps.find((gap) => gap.id === selectedGapId) || null,
    [selectedGapId, systemMap],
  );

  // 1. Compute Coverage, Triage & Probes via sub-hook
  const coverageOutputs = useSystemMapCoverage({
    systemMap,
    draftTasks,
    pagesById,
    projectsById,
    projectFilter,
    coverageFilter,
    portfolioFilter,
    projectLayerFilter,
    projectPageFilter,
    projectQuery,
    selectedProjectIds,
  });

  // 2. Compute Active Usage Path & Related Entities
  const activeUsagePath = useMemo(() => {
    const paths = systemMap?.usage_paths || [];
    return paths.find((path) => path.id === selectedUsagePathId) || paths[0] || null;
  }, [selectedUsagePathId, systemMap]);

  const activeUsagePageIds = useMemo(
    () => new Set(activeUsagePath?.pages.map((page) => page.id) || []),
    [activeUsagePath],
  );

  const activeUsagePlaybooks = useMemo(() => {
    if (!systemMap || !activeUsagePath) return [];
    return systemMap.playbooks.filter((playbook) =>
      playbook.steps.some((step) => activeUsagePageIds.has(step.page_id)),
    );
  }, [activeUsagePageIds, activeUsagePath, systemMap]);

  const activeUsageDomains = useMemo(() => {
    if (!systemMap || !activeUsagePath) return [];
    return systemMap.feature_domains.filter((domain) => activeUsagePageIds.has(domain.cockpit_page));
  }, [activeUsagePageIds, activeUsagePath, systemMap]);

  const activeUsageRoadmap = useMemo(() => {
    if (!systemMap || !activeUsagePath) return [];
    return systemMap.roadmap.items.filter((item) => activeUsagePageIds.has(item.cockpit_page));
  }, [activeUsagePageIds, activeUsagePath, systemMap]);

  const activeUsageProjects = useMemo(() => {
    if (!systemMap || !activeUsagePath) return [];
    return systemMap.projects
      .filter((project) => activeUsagePageIds.has(project.cockpit_page))
      .sort((left, right) => {
        const statusDelta = left.portfolio.score - right.portfolio.score;
        if (statusDelta !== 0) return statusDelta;
        return (right.triage_commands?.length ?? 0) - (left.triage_commands?.length ?? 0);
      });
  }, [activeUsagePageIds, activeUsagePath, systemMap]);

  const activeUsagePlaybookIds = useMemo(
    () => new Set(activeUsagePlaybooks.map((playbook) => playbook.id)),
    [activeUsagePlaybooks],
  );

  const activeUsageTouchesDomainApps = activeUsagePageIds.has('DomainApps') || activeUsagePageIds.has('QuestBoard');

  const activeUsageTriageCommands = useMemo(() => {
    const unique = new Map<string, ProjectAction>();
    activeUsageProjects.forEach((project) => {
      project.triage_commands.forEach((command) => {
        unique.set(`${project.id}:${command.id}:${command.value}`, command);
      });
    });
    return Array.from(unique.values()).sort((left, right) => {
      const riskDelta = triageRiskWeight(right.risk) - triageRiskWeight(left.risk);
      if (riskDelta !== 0) return riskDelta;
      return (left.project_id || '').localeCompare(right.project_id || '');
    });
  }, [activeUsageProjects]);

  const activeUsageDrafts = useMemo(() => {
    if (!activeUsagePath) return [];
    return draftTasks
      .filter((task) => {
        if (!task.read_only || !task.source?.type) return false;
        if (task.source.type === 'system_map_playbook') {
          return activeUsagePlaybookIds.has(task.source.id);
        }
        if (task.source.type === 'system_map_page_maturity') {
          return activeUsagePageIds.has(task.source.id);
        }
        if (task.source.type === 'system_map_project_portfolio') {
          const project = projectsById.get(task.source.id);
          return Boolean(project && activeUsagePageIds.has(project.cockpit_page));
        }
        if (task.source.type === 'system_map_verification_ready') {
          const project = projectsById.get(task.source.id);
          return Boolean(project && activeUsagePageIds.has(project.cockpit_page));
        }
        if (task.source.type === 'system_map_domain_app') {
          return activeUsageTouchesDomainApps;
        }
        return false;
      })
      .sort((left, right) => {
        const sourceDelta = draftSourceWeight(left.source?.type) - draftSourceWeight(right.source?.type);
        if (sourceDelta !== 0) return sourceDelta;
        const priorityDelta = draftPriorityWeight(right.priority) - draftPriorityWeight(left.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return (left.title || '').localeCompare(right.title || '');
      });
  }, [activeUsagePageIds, activeUsagePath, activeUsagePlaybookIds, activeUsageTouchesDomainApps, draftTasks, projectsById]);

  const selectedProjectUsagePaths = useMemo(() => {
    if (!systemMap || !selectedProject) return [];
    return systemMap.usage_paths.filter((path) =>
      path.pages.some((page) => page.id === selectedProject.cockpit_page),
    );
  }, [selectedProject, systemMap]);

  const selectedProjectPlaybooks = useMemo(() => {
    if (!systemMap || !selectedProject) return [];
    return systemMap.playbooks.filter((playbook) =>
      playbook.steps.some((step) => step.page_id === selectedProject.cockpit_page),
    );
  }, [selectedProject, systemMap]);

  const selectedProjectDrafts = useMemo(() => {
    if (!selectedProject) return [];
    return draftTasks.filter((task) =>
      task.read_only
      && (
        (task.source?.type === 'system_map_project_portfolio' && task.source.id === selectedProject.id)
        || (task.source?.type === 'system_map_verification_ready' && task.source.id === selectedProject.id)
      ),
    );
  }, [draftTasks, selectedProject]);

  // 3. Compute Maturity, Workbenches & Control Tower via sub-hook
  const maturityOutputs = useSystemMapMaturity({
    systemMap,
    draftTasks,
    pagesById,
    projectsById,
    pageMaturityFilter,
    selectedPageMaturityId,
    selectedFeatureDomainId,
    selectedGapId,
    selectedProject,
    activeUsagePath,
    activeUsageProjects,
    activeUsageDomains,
    activeUsagePlaybooks,
    activeUsageRoadmap,
    activeUsageDrafts,
  });

  // 4. Return defaults when systemMap is null
  if (!systemMap) {
    return {
      pagesById: new Map(),
      projectsById: new Map(),
      projectLayerOptions: [],
      projectPageOptions: [],
      pageGroups: [],
      projectFocusOptions: [],
      coverageFilterOptions: [],
      coverageDimensions: [],
      activeCoverage: undefined,
      activePortfolioBucket: null,
      projectEntryRows: [],
      projectEntrySummary: { mapped: 0, drafts: 0, blocked: 0 },
      activeRepairDimension: null,
      dimensionRepairRows: [],
      filteredProjects: [],
      coverageMatrixRows: [],
      filteredProjectIds: new Set(),
      selectedVisibleProjectIds: [],
      filteredTriageQueues: [],
      filteredTriageCommandCount: 0,
      visibleCommandCount: 0,
      runtimeProbeSummary: { runtimeProjects: 0, stopped: 0, pendingApproval: 0, approved: 0, commands: 0 },
      selectedProject: null,
      activeUsagePath: null,
      activeUsagePageIds: new Set(),
      activeUsagePlaybooks: [],
      activeUsageDomains: [],
      activeUsageRoadmap: [],
      activeUsageProjects: [],
      activeUsagePlaybookIds: new Set(),
      activeUsageTouchesDomainApps: false,
      activeUsageTriageCommands: [],
      activeUsageDrafts: [],
      selectedGap: null,
      pageMaturity: [],
      pageMaturitySummary: { ready: 0, watch: 0, gap: 0, tracked: 0, untracked: 0, roadmapShipped: 0 },
      visiblePageMaturity: [],
      selectedPageMaturity: null,
      selectedPageGapSignals: [],
      selectedPagePlaybooks: [],
      selectedPageDrafts: [],
      selectedFeatureDomain: null,
      selectedFeaturePage: null,
      selectedFeatureProjects: [],
      selectedFeatureUsagePaths: [],
      selectedFeaturePlaybooks: [],
      selectedFeatureRoadmapItems: [],
      selectedFeaturePageMaturity: null,
      selectedFeatureDrafts: [],
      selectedFeatureSignals: [],
      gapClosureRows: [],
      selectedGapClosureRow: null,
      selectedProjectUsagePaths: [],
      selectedProjectPlaybooks: [],
      selectedProjectDrafts: [],
      systemMapWorkbenchRows: [],
      capabilityBuildBacklog: { pagesWithoutUsage: [], pagesWithoutDomain: [], plannedRoadmapItems: [], gapItems: [], domainAttention: [], actionableDrafts: [] },
      buildControlTower: { pageItems: [], domainContractItems: [], verificationItems: [], priorityItems: [] },
    };
  }

  // 5. Merge and return
  return {
    pagesById,
    projectsById,
    projectLayerOptions,
    projectPageOptions,
    pageGroups,
    selectedProject,
    activeUsagePath,
    activeUsagePageIds,
    activeUsagePlaybooks,
    activeUsageDomains,
    activeUsageRoadmap,
    activeUsageProjects,
    activeUsagePlaybookIds,
    activeUsageTouchesDomainApps,
    activeUsageTriageCommands,
    activeUsageDrafts,
    selectedGap,
    selectedProjectUsagePaths,
    selectedProjectPlaybooks,
    selectedProjectDrafts,
    ...coverageOutputs,
    ...maturityOutputs,
  };
}
