import { useMemo } from 'react';
import type {
  CockpitPage,
  CoverageAttentionProject,
  DraftTask,
  ProjectAction,
  ProjectCapabilityCoverage,
  ProjectCoverageCheck,
  ProjectItem,
  ProjectPortfolioPriority,
  ProjectTriageQueue,
  SystemMapPayload,
} from './types';
import {
  triageCategoryForDimension,
  withTaskDraftHandoff,
} from './utils';

function findMatchingDraft(project: ProjectItem, draftTasks: DraftTask[]): DraftTask | null {
  const portfolioDraft = draftTasks.find(
    (task) => task.source?.type === 'system_map_project_portfolio' && task.source?.id === project.id
  );
  if (portfolioDraft) return portfolioDraft;
  return null;
}

export type CoverageInputs = {
  systemMap: SystemMapPayload | null;
  draftTasks: DraftTask[];
  pagesById: Map<string, CockpitPage>;
  projectsById: Map<string, ProjectItem>;
  projectFilter: string;
  coverageFilter: string;
  portfolioFilter: string;
  projectLayerFilter: string;
  projectPageFilter: string;
  projectQuery: string;
  selectedProjectIds: string[];
};

export type CoverageOutputs = {
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
};

export function useSystemMapCoverage(inputs: CoverageInputs): CoverageOutputs {
  const {
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
  } = inputs;

  const projectFocusOptions = useMemo(() => {
    const queues = systemMap?.project_focus?.queues || [];
    return [
      {
        id: 'all',
        title: '全部项目',
        severity: 'low',
        reason: '查看所有已登记项目。',
        count: systemMap?.projects.length || 0,
        project_ids: systemMap?.projects.map((project) => project.id) || [],
        top_projects: [],
      },
      ...queues,
    ];
  }, [systemMap]);

  const coverageFilterOptions = useMemo(() => {
    const dimensions = systemMap?.project_capability_coverage?.dimension_summary || [];
    return [
      {
        id: 'all',
        title: '全部维度',
        description: '不按覆盖维度过滤项目。',
        status: 'ready',
        score: systemMap?.project_capability_coverage?.summary.score || 0,
        ready: systemMap?.project_capability_coverage?.summary.ready_cells || 0,
        warning: systemMap?.project_capability_coverage?.summary.warning_cells || 0,
        failed: systemMap?.project_capability_coverage?.summary.failed_cells || 0,
        documented: systemMap?.project_capability_coverage?.summary.documented_cells || 0,
        evidence_score: systemMap?.project_capability_coverage?.summary.evidence_score || 0,
        attention_projects: [],
      },
      ...dimensions,
    ];
  }, [systemMap]);

  const coverageDimensions = useMemo(() => {
    const dimensions = systemMap?.project_capability_coverage?.dimensions || [];
    if (dimensions.length > 0) return dimensions;
    return (systemMap?.project_capability_coverage?.dimension_summary || []).map((dimension) => ({
      id: dimension.id,
      title: dimension.title,
      description: dimension.description,
    }));
  }, [systemMap]);

  const activeCoverage = coverageFilterOptions.find((item) => item.id === coverageFilter);
  const activePortfolioBucket = useMemo(
    () => systemMap?.project_portfolio.buckets.find((bucket) => bucket.id === portfolioFilter) || null,
    [portfolioFilter, systemMap],
  );

  const projectEntryRows = useMemo(() => {
    if (!systemMap) return [];
    return systemMap.project_portfolio.priority_projects
      .map((priority) => {
        const project = projectsById.get(priority.id);
        if (!project) return null;
        const pageId = project.cockpit_page || priority.cockpit_page;
        const page = pageId ? pagesById.get(pageId) || null : null;
        const primaryDimension = project.portfolio.non_ready_dimensions[0] || priority.non_ready_dimensions[0] || null;
        return {
          priority,
          project,
          page,
          primaryDimension,
          draft: findMatchingDraft(project, draftTasks),
          draftTarget: withTaskDraftHandoff({ tab: 'TaskCenter', taskQuery: project.id }, draftTasks),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [draftTasks, pagesById, projectsById, systemMap]);

  const projectEntrySummary = useMemo(() => ({
    mapped: projectEntryRows.filter((row) => row.page).length,
    drafts: projectEntryRows.filter((row) => row.draft).length,
    blocked: projectEntryRows.filter((row) => row.priority.status === 'blocked').length,
  }), [projectEntryRows]);

  const activeRepairDimension = useMemo(() => {
    const dimensions = systemMap?.project_capability_coverage?.dimension_summary || [];
    if (coverageFilter !== 'all') {
      return dimensions.find((dimension) => dimension.id === coverageFilter) || null;
    }
    return (
      systemMap?.project_capability_coverage?.weakest_dimensions?.[0]
      || dimensions.find((dimension) => dimension.status !== 'ready')
      || null
    );
  }, [coverageFilter, systemMap]);

  const dimensionRepairRows = useMemo(() => {
    if (!systemMap || !activeRepairDimension) return [];
    const category = triageCategoryForDimension(activeRepairDimension.id);
    return activeRepairDimension.attention_projects
      .map((attention) => {
        const project = systemMap.projects.find((item) => item.id === attention.id);
        if (!project) return null;
        const check = project.coverage_checks.find((item) => item.id === activeRepairDimension.id);
        const exactCommands = project.triage_commands.filter((command) =>
          command.category === category
          || command.id.includes(activeRepairDimension.id)
          || command.reason?.includes(activeRepairDimension.title),
        );
        return {
          attention,
          project,
          check,
          commands: exactCommands.length > 0 ? exactCommands : project.triage_commands.slice(0, 2),
        };
      })
      .filter((item): item is {
        attention: CoverageAttentionProject;
        project: ProjectItem;
        check?: ProjectCoverageCheck;
        commands: ProjectAction[];
      } => Boolean(item));
  }, [activeRepairDimension, systemMap]);

  const filteredProjects = useMemo(() => {
    const projects = systemMap?.projects || [];
    const queue = projectFocusOptions.find((item) => item.id === projectFilter);
    const allowed = projectFilter === 'all' || !queue ? null : new Set(queue.project_ids);
    const portfolioAllowed = activePortfolioBucket ? new Set(activePortfolioBucket.project_ids) : null;
    const query = projectQuery.trim().toLowerCase();
    return projects.filter((project) => {
      if (allowed && !allowed.has(project.id)) return false;
      if (portfolioAllowed && !portfolioAllowed.has(project.id)) return false;
      if (projectLayerFilter !== 'all' && project.layer !== projectLayerFilter) return false;
      if (projectPageFilter !== 'all' && project.cockpit_page !== projectPageFilter) return false;
      if (coverageFilter !== 'all') {
        const check = project.coverage_checks.find((item) => item.id === coverageFilter);
        if (!check || check.status === 'ready') return false;
      }
      if (!query) return true;
      return [
        project.id,
        project.layer,
        project.stack,
        project.role,
        project.operational.next_action,
        ...project.operational.risks,
        ...project.coverage_checks.map((check) => `${check.title} ${check.status} ${check.next_action}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activePortfolioBucket, coverageFilter, projectFilter, projectFocusOptions, projectLayerFilter, projectPageFilter, projectQuery, systemMap]);

  const coverageMatrixRows = useMemo(() => {
    const matrixByProject = new Map(
      (systemMap?.project_capability_coverage?.matrix || []).map((row) => [row.project_id, row]),
    );
    return filteredProjects.map((project) => {
      const matrixRow = matrixByProject.get(project.id);
      return {
        project,
        checks: matrixRow?.checks?.length ? matrixRow.checks : project.coverage_checks,
        ready: matrixRow?.ready ?? project.coverage_checks.filter((check) => check.status === 'ready').length,
        warning: matrixRow?.warning ?? project.coverage_checks.filter((check) => check.status === 'warning').length,
        failed: matrixRow?.failed ?? project.coverage_checks.filter((check) => check.status === 'failed').length,
      };
    });
  }, [filteredProjects, systemMap]);

  const filteredProjectIds = useMemo(() => new Set(filteredProjects.map((project) => project.id)), [filteredProjects]);
  const selectedVisibleProjectIds = selectedProjectIds.filter((projectId) => filteredProjectIds.has(projectId));

  const filteredTriageQueues = useMemo(() => {
    const queues = systemMap?.project_triage?.queues || [];
    return queues.map((queue) => {
      const commands = queue.commands.filter((command) => command.project_id && filteredProjectIds.has(command.project_id));
      return {
        ...queue,
        count: commands.length,
        project_ids: Array.from(new Set(commands.map((command) => command.project_id || '').filter(Boolean))),
        commands,
      };
    });
  }, [filteredProjectIds, systemMap]);

  const filteredTriageCommandCount = filteredTriageQueues.reduce((total, queue) => total + queue.count, 0);

  const visibleCommandCount = useMemo(() => {
    return (systemMap?.project_triage?.queues || []).reduce((total, queue) => {
      const commands = queue.commands.filter((command) => command.project_id && filteredProjectIds.has(command.project_id));
      return total + commands.length;
    }, 0);
  }, [filteredProjectIds, systemMap]);

  const runtimeProbeSummary = useMemo(() => {
    const projects = systemMap?.projects || [];
    const runtimeProjects = projects.filter((project) => project.runtime.needs_runtime);
    const pendingApproval = runtimeProjects.filter((project) => {
      const task = project.runtime.probe_task;
      return Boolean(task?.human_approval_required && task.approval_state !== 'granted' && task.status !== 'succeeded');
    }).length;
    const approved = runtimeProjects.filter((project) => {
      const task = project.runtime.probe_task;
      return Boolean(task?.human_approval_required && task.approval_state === 'granted' && task.status !== 'succeeded');
    }).length;
    return {
      runtimeProjects: runtimeProjects.length,
      stopped: runtimeProjects.filter((project) => project.runtime.status === 'stopped').length,
      pendingApproval,
      approved,
      commands: systemMap?.project_triage.summary.runtime_commands || 0,
    };
  }, [systemMap]);

  return {
    projectFocusOptions,
    coverageFilterOptions,
    coverageDimensions,
    activeCoverage,
    activePortfolioBucket,
    projectEntryRows,
    projectEntrySummary,
    activeRepairDimension,
    dimensionRepairRows,
    filteredProjects,
    coverageMatrixRows,
    filteredProjectIds,
    selectedVisibleProjectIds,
    filteredTriageQueues,
    filteredTriageCommandCount,
    visibleCommandCount,
    runtimeProbeSummary,
  };
}
