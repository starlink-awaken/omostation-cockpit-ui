import { useMemo } from 'react';
import type {
  CapabilityGapClosureRow,
  CockpitPage,
  DraftTask,
  FeatureDomain,
  PageMaturity,
  PageMaturityFilter,
  PlaybookStep,
  ProjectItem,
  ProjectPortfolioPriority,
  RoadmapItem,
  SystemMapPayload,
  SystemMapWorkbenchRow,
  UsagePath,
} from './types';
import {
  includesGapTerm,
  inferGapScope,
  normalizeSearchText,
  uniqueById,
  uniquePageMaturityItems,
} from './utils';

export type MaturityInputs = {
  systemMap: SystemMapPayload | null;
  draftTasks: DraftTask[];
  pagesById: Map<string, CockpitPage>;
  projectsById: Map<string, ProjectItem>;
  pageMaturityFilter: PageMaturityFilter;
  selectedPageMaturityId: string | null;
  selectedFeatureDomainId: string | null;
  selectedGapId: string | null;
  selectedProject: ProjectItem | null;
  activeUsagePath: UsagePath | null;
  activeUsageProjects: ProjectItem[];
  activeUsageDomains: FeatureDomain[];
  activeUsagePlaybooks: SystemMapPayload['playbooks'];
  activeUsageRoadmap: RoadmapItem[];
  activeUsageDrafts: DraftTask[];
};

export type MaturityOutputs = {
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

export function useSystemMapMaturity(inputs: MaturityInputs): MaturityOutputs {
  const {
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
  } = inputs;

  const pageMaturity = useMemo<PageMaturity[]>(() => {
    if (!systemMap) return [];
    if (systemMap.page_maturity?.items?.length) {
      const projectsByIdLocal = new Map(systemMap.projects.map((project) => [project.id, project]));
      const domainsById = new Map(systemMap.feature_domains.map((domain) => [domain.id, domain]));
      const usagePathsById = new Map(systemMap.usage_paths.map((path) => [path.id, path]));
      const roadmapById = new Map(systemMap.roadmap.items.map((item) => [item.id, item]));
      const playbookStepsById = new Map(
        systemMap.playbooks.flatMap((playbook) => playbook.steps.map((step) => [step.id, step] as const)),
      );
      return systemMap.page_maturity.items.map((item) => ({
        page: item.page,
        score: item.score,
        status: item.status,
        projects: item.projects.map((id) => projectsByIdLocal.get(id)).filter((project): project is ProjectItem => Boolean(project)),
        domains: item.domains.map((id) => domainsById.get(id)).filter((domain): domain is FeatureDomain => Boolean(domain)),
        usagePaths: item.usage_paths.map((id) => usagePathsById.get(id)).filter((path): path is UsagePath => Boolean(path)),
        playbookSteps: item.playbook_steps.map((id) => playbookStepsById.get(id)).filter((step): step is PlaybookStep => Boolean(step)),
        roadmapItems: item.roadmap_items.map((id) => roadmapById.get(id)).filter((roadmapItem): roadmapItem is RoadmapItem => Boolean(roadmapItem)),
        actions: item.actions,
        operatorActions: item.operator_actions || [],
        operatorActionDetails: item.operator_action_details || [],
        nextAction: item.next_action,
        traceabilityStatus: item.traceability_status || ((item.roadmap_items?.length ?? 0) > 0 ? 'tracked' : 'untracked'),
        traceabilityNextAction: item.traceability_next_action || ((item.roadmap_items?.length ?? 0) > 0 ? '保持页面路线图与验收项同步。' : '补一条页面路线图或验收项，记录下一步能力建设。'),
        roadmapStatus: item.roadmap_status || (item.roadmap_items.some((id) => roadmapById.get(id)?.status === 'shipped') ? 'shipped' : 'planned'),
      }));
    }
    return systemMap.cockpit_pages.map((page) => {
      const projects = systemMap.projects.filter((project) => project.cockpit_page === page.id);
      const domains = systemMap.feature_domains.filter((domain) => domain.cockpit_page === page.id);
      const usagePaths = systemMap.usage_paths.filter((path) =>
        path.pages.some((usagePage) => usagePage.id === page.id),
      );
      const playbookSteps = systemMap.playbooks.flatMap((playbook) =>
        playbook.steps.filter((step) => step.page_id === page.id || step.page.id === page.id),
      );
      const roadmapItems = systemMap.roadmap.items.filter((item) => item.cockpit_page === page.id);
      const actions = projects.reduce(
        (total, project) => total + (project.actions?.length ?? 0) + (project.triage_commands?.length ?? 0),
        0,
      );
      const score =
        (projects.length > 0 ? 25 : 0) +
        (domains.length > 0 ? 20 : 0) +
        (usagePaths.length > 0 ? 20 : 0) +
        (playbookSteps.length > 0 ? 15 : 0) +
        (roadmapItems.length > 0 ? 10 : 0) +
        (actions > 0 ? 10 : 0);
      const traceabilityStatus = roadmapItems.length > 0 ? 'tracked' : 'untracked';
      const status: PageMaturity['status'] = score >= 70 && traceabilityStatus === 'tracked'
        ? 'ready'
        : score >= 40
          ? 'watch'
          : 'gap';
      let nextAction = '保持页面、项目、清单和路线图证据新鲜。';
      if (usagePaths.length === 0) nextAction = '把页面接入至少一条使用路径。';
      else if (playbookSteps.length === 0) nextAction = '补一条操作清单步骤，让页面进入日常流程。';
      else if (domains.length === 0) nextAction = '补功能域映射，说明页面承载的能力。';
      else if (projects.length === 0) nextAction = '补项目或服务映射，避免页面只有入口没有对象。';
      else if (actions === 0) nextAction = '补受控动作或排查命令，让页面能推进问题。';

      return {
        page,
        score,
        status,
        projects,
        domains,
        usagePaths,
        playbookSteps,
        roadmapItems,
        actions,
        operatorActions: page.operator_actions || [],
        operatorActionDetails: page.operator_action_details || [],
        nextAction,
        traceabilityStatus,
        traceabilityNextAction: traceabilityStatus === 'tracked' ? '保持页面路线图与验收项同步。' : '补一条页面路线图或验收项，记录下一步能力建设。',
        roadmapStatus: roadmapItems.some((item) => item.status === 'shipped') ? 'shipped' : 'planned',
      };
    });
  }, [systemMap]);

  const pageMaturitySummary = useMemo(() => ({
    ready: pageMaturity.filter((item) => item.status === 'ready').length,
    watch: pageMaturity.filter((item) => item.status === 'watch').length,
    gap: pageMaturity.filter((item) => item.status === 'gap').length,
    tracked: pageMaturity.filter((item) => item.traceabilityStatus === 'tracked').length,
    untracked: pageMaturity.filter((item) => item.traceabilityStatus === 'untracked').length,
    roadmapShipped: pageMaturity.filter((item) => item.roadmapStatus === 'shipped').length,
  }), [pageMaturity]);

  const visiblePageMaturity = useMemo(() => pageMaturity.filter((item) => {
    if (pageMaturityFilter === 'tracked' || pageMaturityFilter === 'untracked') {
      return item.traceabilityStatus === pageMaturityFilter;
    }
    return pageMaturityFilter === 'all' || item.status === pageMaturityFilter;
  }), [pageMaturity, pageMaturityFilter]);

  const selectedPageMaturity = useMemo(
    () => pageMaturity.find((item) => item.page.id === selectedPageMaturityId) || null,
    [pageMaturity, selectedPageMaturityId],
  );

  const selectedPageGapSignals = useMemo(
    () => (selectedPageMaturity ? [] : []),
    [selectedPageMaturity],
  );

  const selectedPagePlaybooks = useMemo(() => {
    if (!systemMap || !selectedPageMaturity) return [];
    return systemMap.playbooks.filter((playbook) =>
      playbook.steps.some((step) => step.page_id === selectedPageMaturity.page.id),
    );
  }, [selectedPageMaturity, systemMap]);

  const selectedPageDrafts = useMemo(() => {
    if (!selectedPageMaturity) return [];
    return draftTasks.filter((task) =>
      task.read_only
      && task.source?.type === 'system_map_page_maturity'
      && task.source.id === selectedPageMaturity.page.id,
    );
  }, [draftTasks, selectedPageMaturity]);

  const selectedFeatureDomain = useMemo(
    () => systemMap?.feature_domains.find((domain) => domain.id === selectedFeatureDomainId) || null,
    [selectedFeatureDomainId, systemMap],
  );

  const selectedFeaturePage = useMemo(
    () => (selectedFeatureDomain ? pagesById.get(selectedFeatureDomain.cockpit_page) || null : null),
    [pagesById, selectedFeatureDomain],
  );

  const selectedFeatureProjects = useMemo(() => {
    if (!systemMap || !selectedFeatureDomain) return [];
    return systemMap.projects.filter((project) => project.cockpit_page === selectedFeatureDomain.cockpit_page);
  }, [selectedFeatureDomain, systemMap]);

  const selectedFeatureUsagePaths = useMemo(() => {
    if (!systemMap || !selectedFeatureDomain) return [];
    return systemMap.usage_paths.filter((path) =>
      path.pages.some((page) => page.id === selectedFeatureDomain.cockpit_page),
    );
  }, [selectedFeatureDomain, systemMap]);

  const selectedFeaturePlaybooks = useMemo(() => {
    if (!systemMap || !selectedFeatureDomain) return [];
    return systemMap.playbooks.filter((playbook) =>
      playbook.steps.some((step) => step.page_id === selectedFeatureDomain.cockpit_page),
    );
  }, [selectedFeatureDomain, systemMap]);

  const selectedFeatureRoadmapItems = useMemo(() => {
    if (!systemMap || !selectedFeatureDomain) return [];
    return systemMap.roadmap.items.filter((item) => item.cockpit_page === selectedFeatureDomain.cockpit_page);
  }, [selectedFeatureDomain, systemMap]);

  const selectedFeaturePageMaturity = useMemo(
    () => pageMaturity.find((item) => item.page.id === selectedFeatureDomain?.cockpit_page) || null,
    [pageMaturity, selectedFeatureDomain],
  );

  const selectedFeatureDrafts = useMemo(() => {
    if (!selectedFeatureDomain) return [];
    return draftTasks.filter((task) =>
      task.read_only
      && task.source?.type === 'system_map_page_maturity'
      && task.source.id === selectedFeatureDomain.cockpit_page,
    );
  }, [draftTasks, selectedFeatureDomain]);

  const selectedFeatureSignals = useMemo(() => {
    if (!selectedFeatureDomain) return [];
    const signals: { id: string; title: string; detail: string }[] = [];
    if ((selectedFeatureDomain.providers?.length ?? 0) === 0) {
      signals.unshift({
        id: 'providers',
        title: '提供方未登记',
        detail: '能力域已经存在，但还没标明由哪些页面或模块提供。',
      });
    }
    if (signals.length === 0) {
      signals.push({
        id: 'steady',
        title: '当前没有显性缺口',
        detail: selectedFeaturePageMaturity?.nextAction || '保持能力域、页面和使用路径之间的映射新鲜。',
      });
    }
    return signals.slice(0, 4);
  }, [selectedFeatureDomain, selectedFeaturePageMaturity]);

  const gapClosureRows = useMemo<CapabilityGapClosureRow[]>(() => {
    if (!systemMap) return [];

    const attentionProjects = uniqueById(
      systemMap.project_portfolio.priority_projects
        .map((item) => projectsById.get(item.id) || null)
        .filter((project): project is ProjectItem => Boolean(project)),
    );
    const nonReadyPages = pageMaturity.filter((item) => item.status !== 'ready');
    const domainAttentionPages = new Set(nonReadyPages.map((item) => item.page.id));

    return systemMap.gaps.map((gap) => {
      const gapText = normalizeSearchText([gap.id, gap.title, gap.evidence, gap.next].join(' '));
      const scope = inferGapScope(gap);

      const matchedProjects = systemMap.projects.filter((project) =>
        [
          project.id,
          project.role,
          project.stack,
          project.portfolio.primary_gap,
          project.portfolio.next_action,
          ...project.diagnostics.map((item) => item.title),
          ...project.diagnostics.map((item) => item.detail),
        ].some((value) => includesGapTerm(gapText, value)),
      );

      const matchedPages = pageMaturity.filter((item) =>
        [
          item.page.id,
          item.page.title,
          item.page.group,
          item.page.purpose,
          ...item.page.dimensions,
        ].some((value) => includesGapTerm(gapText, value)),
      );

      const matchedDomains = systemMap.feature_domains.filter((domain) =>
        [
          domain.id,
          domain.title,
          domain.english,
          ...domain.providers,
          ...domain.capability_items,
        ].some((value) => includesGapTerm(gapText, value)),
      );

      let projects = uniqueById(matchedProjects);
      let pages = uniquePageMaturityItems(matchedPages);
      let domains = uniqueById(matchedDomains);

      if (scope === 'project' && projects.length === 0) {
        projects = attentionProjects.length > 0
          ? attentionProjects
          : systemMap.projects.filter((project) => project.portfolio.status !== 'healthy');
      }
      if (scope === 'page' && pages.length === 0) {
        pages = nonReadyPages;
      }
      if (scope === 'domain' && domains.length === 0) {
        domains = systemMap.feature_domains.filter((domain) => domainAttentionPages.has(domain.cockpit_page));
      }
      if (scope === 'flow' && pages.length === 0) {
        pages = pageMaturity.filter((item) => item.usagePaths.length === 0 || item.playbookSteps.length === 0);
      }

      if (pages.length === 0 && projects.length > 0) {
        pages = uniquePageMaturityItems(
          projects
            .map((project) => pageMaturity.find((item) => item.page.id === project.cockpit_page) || null),
        );
      }
      if (pages.length === 0 && domains.length > 0) {
        pages = uniquePageMaturityItems(
          domains
            .map((domain) => pageMaturity.find((item) => item.page.id === domain.cockpit_page) || null),
        );
      }
      if (domains.length === 0 && pages.length > 0) {
        const pageIds = new Set(pages.map((item) => item.page.id));
        domains = systemMap.feature_domains.filter((domain) => pageIds.has(domain.cockpit_page));
      }
      if (projects.length === 0 && pages.length > 0) {
        const pageIds = new Set(pages.map((item) => item.page.id));
        projects = systemMap.projects.filter((project) => pageIds.has(project.cockpit_page));
      }

      const pageIds = new Set(pages.map((item) => item.page.id));
      const usagePaths = systemMap.usage_paths.filter((path) =>
        path.pages.some((page) => pageIds.has(page.id)),
      );
      const playbooks = systemMap.playbooks.filter((playbook) =>
        playbook.steps.some((step) => pageIds.has(step.page_id)),
      );
      const roadmapItems = systemMap.roadmap.items.filter((item) =>
        pageIds.has(item.cockpit_page) && item.status !== 'shipped',
      );

      const gapDraft = draftTasks.find((task) =>
        task.read_only && task.source?.type === 'system_map_capability_gap' && task.source.id === gap.id,
      ) || null;
      const projectDraft = draftTasks.find((task) =>
        task.read_only
        && (
          (task.source?.type === 'system_map_project_portfolio' && projects.some((project) => project.id === task.source?.id))
          || (task.source?.type === 'system_map_verification_ready' && projects.some((project) => project.id === task.source?.id))
        ),
      ) || null;
      const pageDraft = draftTasks.find((task) =>
        task.read_only
        && task.source?.type === 'system_map_page_maturity'
        && pageIds.has(task.source?.id || ''),
      ) || null;
      const playbookDraft = draftTasks.find((task) =>
        task.read_only
        && task.source?.type === 'system_map_playbook'
        && playbooks.some((playbook) => playbook.id === task.source?.id),
      ) || null;
      const domainDraft = draftTasks.find((task) =>
        task.read_only
        && task.source?.type === 'system_map_domain_app'
        && domains.some((domain) => domain.id === task.source?.id),
      ) || null;
      const draft = gapDraft || projectDraft || pageDraft || playbookDraft || domainDraft || null;

      const page = pages[0]
        || (projects[0] ? pageMaturity.find((item) => item.page.id === projects[0].cockpit_page) || null : null)
        || (domains[0] ? pageMaturity.find((item) => item.page.id === domains[0].cockpit_page) || null : null)
        || null;

      const nextAction = draft?.description
        || projects[0]?.portfolio.next_action
        || page?.nextAction
        || roadmapItems[0]?.problem
        || playbooks[0]?.goal
        || gap.next;

      const taskQuery = draft?.source?.id
        || draft?.id
        || projects[0]?.id
        || playbooks[0]?.id
        || page?.page.id
        || domains[0]?.id
        || gap.id;

      return {
        gap,
        scope,
        page,
        projects: projects.slice(0, 3),
        domains: domains.slice(0, 3),
        usagePaths: usagePaths.slice(0, 2),
        playbooks: playbooks.slice(0, 2),
        roadmapItems: roadmapItems.slice(0, 2),
        draft,
        nextAction,
        taskQuery,
      };
    });
  }, [draftTasks, pageMaturity, projectsById, systemMap]);

  const selectedGapClosureRow = useMemo(
    () => gapClosureRows.find((row) => row.gap.id === selectedGapId) || null,
    [gapClosureRows, selectedGapId],
  );

  const systemMapWorkbenchRows = useMemo<SystemMapWorkbenchRow[]>(() => {
    const rows: SystemMapWorkbenchRow[] = [];

    if (activeUsagePath) {
      const usageMissingSignals = [
        activeUsageProjects.length === 0,
        activeUsageDomains.length === 0,
        activeUsagePlaybooks.length === 0,
        activeUsageRoadmap.length === 0,
        activeUsageDrafts.length === 0,
      ].filter(Boolean).length;
      rows.push({
        id: `workbench-usage-${activeUsagePath.id}`,
        title: `${activeUsagePath.title} · 路径闭环`,
        laneLabel: '使用路径工作台',
        summary: activeUsagePath.intent,
        nextAction: activeUsagePath.steps[0]
          ? `先从"${activeUsagePath.steps[0]}"开始，顺着路径把页面、清单、能力域和草稿重新串起来。`
          : '先把这条路径重新挂回页面、清单和任务承接。',
        evidence: `覆盖页 ${activeUsagePath.pages?.length ?? 0} · 清单 ${activeUsagePlaybooks.length} · 草稿 ${activeUsageDrafts.length}`,
        statusTone: usageMissingSignals === 0 ? 'online' : usageMissingSignals <= 2 ? 'degraded' : 'offline',
        statusLabel: usageMissingSignals === 0 ? '路径成型' : usageMissingSignals <= 2 ? '可走待补' : '断链较多',
        primaryTarget: { tab: 'SystemMap', usagePathId: activeUsagePath.id },
        primaryLabel: '打开路径',
        secondaryTarget: { tab: 'TaskCenter', taskQuery: activeUsagePath.title || activeUsagePath.id },
        secondaryLabel: '打开任务',
      });
    }

    if (selectedPageMaturity) {
      rows.push({
        id: `workbench-page-${selectedPageMaturity.page.id}`,
        title: `${selectedPageMaturity.page.title} · 页面闭环`,
        laneLabel: `页面成熟度 · ${selectedPageMaturity.status === 'ready' ? '可日用' : selectedPageMaturity.status === 'watch' ? '观察' : '待补齐'}`,
        summary: selectedPageMaturity.page.purpose,
        nextAction: selectedPageMaturity.nextAction,
        evidence: `项目 ${selectedPageMaturity.projects.length} · 能力域 ${selectedPageMaturity.domains.length} · 路线图 ${selectedPageMaturity.roadmapItems.length}`,
        statusTone: selectedPageMaturity.status === 'ready' ? 'online' : selectedPageMaturity.status === 'watch' ? 'degraded' : 'offline',
        statusLabel: selectedPageMaturity.status === 'ready' ? '可日用' : selectedPageMaturity.status === 'watch' ? '待补观察' : '优先补位',
        primaryTarget: { tab: selectedPageMaturity.page.id, pageId: selectedPageMaturity.page.id },
        primaryLabel: '进入页面',
        secondaryTarget: { tab: 'TaskCenter', taskQuery: selectedPageMaturity.page.id },
        secondaryLabel: '页面草稿',
      });
    }

    if (selectedFeatureDomain) {
      rows.push({
        id: `workbench-domain-${selectedFeatureDomain.id}`,
        title: `${selectedFeatureDomain.title} · 能力域闭环`,
        laneLabel: `能力域 · ${selectedFeatureDomain.coverage === 'native' ? '原生' : selectedFeatureDomain.coverage}`,
        summary: selectedFeatureDomain.english || 'Capability Domain',
        nextAction: selectedFeaturePageMaturity?.nextAction || '继续补页面、路径、清单和路线图之间的能力映射。',
        evidence: `提供方 ${selectedFeatureDomain.providers?.length ?? 0} · 能力项 ${selectedFeatureDomain.capability_items?.length ?? 0} · 项目 ${selectedFeatureProjects.length}`,
        statusTone: selectedFeatureDomain.coverage === 'native' ? 'online' : (selectedFeatureDomain.providers?.length ?? 0) > 0 ? 'degraded' : 'offline',
        statusLabel: selectedFeatureDomain.coverage === 'native' ? '映射成型' : (selectedFeatureDomain.providers?.length ?? 0) > 0 ? '映射待补' : '待建能力链',
        primaryTarget: { tab: 'SystemMap', featureDomainId: selectedFeatureDomain.id },
        primaryLabel: '打开能力域',
        secondaryTarget: { tab: 'TaskCenter', taskQuery: selectedFeatureDomain.cockpit_page },
        secondaryLabel: '页面草稿',
      });
    }

    if (selectedProject) {
      const verification = selectedProject.runtime.latest_verification;
      rows.push({
        id: `workbench-project-${selectedProject.id}`,
        title: `${selectedProject.id} · 项目闭环`,
        laneLabel: `项目组合 · ${selectedProject.portfolio.status === 'healthy' ? '健康' : selectedProject.portfolio.status === 'watch' ? '观察' : selectedProject.portfolio.status === 'at_risk' ? '风险' : '阻塞'}`,
        summary: selectedProject.portfolio.primary_gap || selectedProject.role || selectedProject.stack,
        nextAction: selectedProject.portfolio.next_action || selectedProject.operational.next_action,
        evidence: `验证 ${verification.status} · triage ${selectedProject.triage_commands?.length ?? 0} · workflow ${selectedProject.workflow.latest_status}`,
        statusTone: selectedProject.portfolio.status === 'healthy'
          ? 'online'
          : selectedProject.portfolio.status === 'at_risk' || selectedProject.portfolio.status === 'watch'
            ? 'degraded'
            : 'offline',
        statusLabel: selectedProject.portfolio.status === 'healthy'
          ? '项目稳定'
          : selectedProject.portfolio.status === 'at_risk' || selectedProject.portfolio.status === 'watch'
            ? '项目待跟'
            : '项目阻塞',
        primaryTarget: { tab: 'TaskCenter', taskQuery: selectedProject.id },
        primaryLabel: '项目草稿',
        secondaryTarget: { tab: 'SystemMap', pageId: selectedProject.cockpit_page },
        secondaryLabel: '关联页面',
      });
    }

    if (selectedGapId) {
      const selectedGap = systemMap?.gaps.find((gap) => gap.id === selectedGapId) || null;
      if (selectedGap) {
        const gapDraft = draftTasks.find((task) =>
          task.read_only && task.source?.type === 'system_map_capability_gap' && task.source.id === selectedGap.id,
        ) || null;
        rows.push({
          id: `workbench-gap-${selectedGap.id}`,
          title: `${selectedGap.title} · 缺口闭环`,
          laneLabel: `能力缺口 · ${selectedGap.severity}`,
          summary: selectedGap.evidence,
          nextAction: selectedGap.next,
          evidence: gapDraft?.title || '先把缺口转回任务、页面或项目入口。',
          statusTone: selectedGap.severity === 'high' ? 'offline' : selectedGap.severity === 'medium' ? 'degraded' : 'online',
          statusLabel: selectedGap.severity === 'high' ? '优先修复' : selectedGap.severity === 'medium' ? '继续收口' : '保持观察',
          primaryTarget: { tab: 'TaskCenter', taskQuery: selectedGap.id },
          primaryLabel: '缺口草稿',
          secondaryTarget: { tab: 'SystemMap', gapId: selectedGap.id },
          secondaryLabel: '定位缺口',
        });
      }
    }

    return rows.slice(0, 4);
  }, [
    activeUsageDomains.length,
    activeUsageDrafts,
    activeUsagePath,
    activeUsagePlaybooks.length,
    activeUsageProjects.length,
    activeUsageRoadmap.length,
    draftTasks,
    selectedFeatureDomain,
    selectedFeaturePageMaturity,
    selectedFeatureProjects.length,
    selectedGapId,
    selectedPageMaturity,
    selectedProject,
    systemMap,
  ]);

  const capabilityBuildBacklog = useMemo(() => {
    if (!systemMap) {
      return {
        pagesWithoutUsage: [] as PageMaturity[],
        pagesWithoutDomain: [] as PageMaturity[],
        plannedRoadmapItems: [] as RoadmapItem[],
        gapItems: [] as SystemMapPayload['gaps'],
        domainAttention: [] as SystemMapPayload['domain_apps']['attention_items'],
        actionableDrafts: [] as DraftTask[],
      };
    }

    const pagesWithoutUsage = pageMaturity
      .filter((item) => item.usagePaths.length === 0)
      .sort((left, right) => left.score - right.score)
      .slice(0, 4);

    const pagesWithoutDomain = pageMaturity
      .filter((item) => item.domains.length === 0)
      .sort((left, right) => left.score - right.score)
      .slice(0, 4);

    const plannedRoadmapItems = systemMap.roadmap.items
      .filter((item) => item.status !== 'shipped')
      .slice(0, 4);

    const actionableDrafts = draftTasks
      .filter((task) =>
        task.read_only
        && (
          task.source?.type === 'system_map_page_maturity'
          || task.source?.type === 'system_map_domain_app'
          || task.source?.type === 'system_map_capability_gap'
        ),
      )
      .slice(0, 5);

    return {
      pagesWithoutUsage,
      pagesWithoutDomain,
      plannedRoadmapItems,
      gapItems: systemMap.gaps.slice(0, 3),
      domainAttention: systemMap.domain_apps.attention_items.slice(0, 3),
      actionableDrafts,
    };
  }, [draftTasks, pageMaturity, systemMap]);

  const buildControlTower = useMemo(() => {
    if (!systemMap) {
      return {
        pageItems: [] as PageMaturity[],
        domainContractItems: [] as SystemMapPayload['domain_apps']['items'],
        verificationItems: [] as Array<
          | { kind: 'draft'; task: DraftTask; project: ProjectItem | null }
          | { kind: 'project'; project: ProjectPortfolioPriority }
        >,
        priorityItems: [] as Array<
          | { kind: 'project'; project: ProjectPortfolioPriority }
          | { kind: 'roadmap'; roadmap: RoadmapItem }
        >,
      };
    }

    const pageItems = pageMaturity
      .filter((item) => item.status !== 'ready')
      .sort((left, right) => left.score - right.score)
      .slice(0, 5);

    const domainContractItems = systemMap.domain_apps.items
      .filter((app) =>
        app.runtime_status !== 'running'
        || app.security_posture !== 'passed'
        || (app.integration_mode !== 'native_cockpit_view' && !app.launch_url && !app.api_url),
      )
      .slice(0, 5);

    const verificationDraftItems = draftTasks
      .filter((task) => task.read_only && task.source?.type === 'system_map_verification_ready')
      .map((task) => ({
        kind: 'draft' as const,
        task,
        project: projectsById.get(task.source?.id || '') || null,
      }));

    const verificationProjectItems = systemMap.project_portfolio.priority_projects
      .filter((project) => project.verification_status !== 'verified')
      .map((project) => ({
        kind: 'project' as const,
        project,
      }));

    const verificationSeen = new Set<string>();
    const verificationItems = [...verificationDraftItems, ...verificationProjectItems]
      .filter((item) => {
        const id = item.kind === 'draft' ? item.task.source?.id || item.task.id : item.project.id;
        if (verificationSeen.has(id)) return false;
        verificationSeen.add(id);
        return true;
      })
      .slice(0, 5);

    const priorityItems = [
      ...systemMap.project_portfolio.priority_projects.map((project) => ({ kind: 'project' as const, project })),
      ...systemMap.roadmap.items
        .filter((roadmap) => roadmap.status !== 'shipped')
        .map((roadmap) => ({ kind: 'roadmap' as const, roadmap })),
    ].slice(0, 6);

    return {
      pageItems,
      domainContractItems,
      verificationItems,
      priorityItems,
    };
  }, [draftTasks, pageMaturity, projectsById, systemMap]);

  return {
    pageMaturity,
    pageMaturitySummary,
    visiblePageMaturity,
    selectedPageMaturity,
    selectedPageGapSignals,
    selectedPagePlaybooks,
    selectedPageDrafts,
    selectedFeatureDomain,
    selectedFeaturePage,
    selectedFeatureProjects,
    selectedFeatureUsagePaths,
    selectedFeaturePlaybooks,
    selectedFeatureRoadmapItems,
    selectedFeaturePageMaturity,
    selectedFeatureDrafts,
    selectedFeatureSignals,
    gapClosureRows,
    selectedGapClosureRow,
    systemMapWorkbenchRows,
    capabilityBuildBacklog,
    buildControlTower,
  };
}
