/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Route configuration for cockpit-ui.
 *
 * Single source of truth for routing, navigation, and page metadata.
 * cockpitPageRegistry.ts and cockpitNavigation.ts derive from ROUTES.
 *
 * Phase 2: 6 new capability-reflection routes added (Commands, Chain, CommandAudit, Agents, Bcos, GovernancePulse).
 * IA restructured: 51 → ~42 routes, 7 functional domains.
 */

import React from 'react';
import { lazy } from 'react';

// Lazy-loaded view components
// eslint-disable-next-line react-refresh/only-export-components
const HomePage = lazy(() => import('./views/common/HomePage'));
// eslint-disable-next-line react-refresh/only-export-components
const WorkCasesPage = lazy(() => import('./features/work-cases/WorkCasesPage'));
// eslint-disable-next-line react-refresh/only-export-components
const CockpitGuideView = lazy(() => import('./components/CockpitGuideView'));
// eslint-disable-next-line react-refresh/only-export-components
const SystemMapView = lazy(() => import('./components/SystemMapView'));
// eslint-disable-next-line react-refresh/only-export-components
const OverviewPage = lazy(() => import('./views/posture/OverviewPage'));
// eslint-disable-next-line react-refresh/only-export-components
const McpMeshView = lazy(() => import('./views/compute/McpMeshView'));
// eslint-disable-next-line react-refresh/only-export-components
const TopologyView = lazy(() => import('./views/posture/TopologyView'));
// eslint-disable-next-line react-refresh/only-export-components
const ComputeView = lazy(() => import('./views/compute/ComputeView'));
// eslint-disable-next-line react-refresh/only-export-components
const ResearchHubView = lazy(() => import('./components/ResearchHubView'));
// eslint-disable-next-line react-refresh/only-export-components
const KnowledgeHubView = lazy(() => import('./views/governance/KnowledgeHubView'));
// eslint-disable-next-line react-refresh/only-export-components
const GBrainDashboard = lazy(() => import('./components/GBrain/GBrainDashboard'));
// eslint-disable-next-line react-refresh/only-export-components
const EnginesView = lazy(() => import('./views/compute/EnginesView'));
// eslint-disable-next-line react-refresh/only-export-components
const AssetsView = lazy(() => import('./views/governance/AssetsView'));
// eslint-disable-next-line react-refresh/only-export-components
const ProtocolWorkbenchView = lazy(() => import('./components/ProtocolWorkbenchView'));
// eslint-disable-next-line react-refresh/only-export-components
const KemsWorkbench = lazy(() => import('./views/governance/KemsWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const SceneCardReviewView = lazy(() => import('./components/SceneCardReviewView'));
// eslint-disable-next-line react-refresh/only-export-components
const ExternalResourceCatalogView = lazy(() => import('./views/governance/ExternalResourceCatalogView'));
// eslint-disable-next-line react-refresh/only-export-components
const BrainChat = lazy(() => import('./views/BrainChat'));
// eslint-disable-next-line react-refresh/only-export-components
const WorkflowsView = lazy(() => import('./views/business/WorkflowsView'));
// eslint-disable-next-line react-refresh/only-export-components
const AlertCenterPage = lazy(() => import('./views/posture/AlertCenterPage'));
// eslint-disable-next-line react-refresh/only-export-components
const L4HealthView = lazy(() => import('./views/posture/L4HealthView'));
// eslint-disable-next-line react-refresh/only-export-components
const DebtView = lazy(() => import('./views/governance/DebtView'));
// eslint-disable-next-line react-refresh/only-export-components
const ObservabilityView = lazy(() => import('./views/posture/ObservabilityView'));
// eslint-disable-next-line react-refresh/only-export-components
const C2GStrategyView = lazy(() => import('./views/governance/C2GStrategyView'));
// eslint-disable-next-line react-refresh/only-export-components
const Wave2DashboardView = lazy(() => import('./views/governance/Wave2DashboardView'));
// eslint-disable-next-line react-refresh/only-export-components
const DomainAppsView = lazy(() => import('./components/DomainAppsView'));
// eslint-disable-next-line react-refresh/only-export-components
const QuestBoard = lazy(() => import('./views/business/QuestBoard'));
// eslint-disable-next-line react-refresh/only-export-components
const KnowledgeFlow = lazy(() => import('./views/governance/KnowledgeFlow'));
// eslint-disable-next-line react-refresh/only-export-components
const HarnessDashboard = lazy(() => import('./components/harness/HarnessDashboard'));
// eslint-disable-next-line react-refresh/only-export-components
const IntentCompiler = lazy(() => import('./components/intent/IntentCompiler'));
// eslint-disable-next-line react-refresh/only-export-components
const GovernanceSelfCheck = lazy(() => import('./components/governance/GovernanceSelfCheck'));
// eslint-disable-next-line react-refresh/only-export-components
const SceneOverviewView = lazy(() => import('./components/scene/SceneOverviewView'));
// eslint-disable-next-line react-refresh/only-export-components
const SceneDetailView = lazy(() => import('./components/scene/SceneDetailView'));
// eslint-disable-next-line react-refresh/only-export-components
const SceneGraphView = lazy(() => import('./components/scene/SceneGraphView'));
// eslint-disable-next-line react-refresh/only-export-components
const CalibrationView = lazy(() => import('./components/scene/CalibrationView'));
// eslint-disable-next-line react-refresh/only-export-components
const PilotReviewView = lazy(() => import('./views/governance/PilotReviewView'));
// eslint-disable-next-line react-refresh/only-export-components
const LogViewerPage = lazy(() => import('./views/common/LogViewerPage'));
// eslint-disable-next-line react-refresh/only-export-components
const TaskCenterPage = lazy(() => import('./views/business/TaskCenterPage'));
// eslint-disable-next-line react-refresh/only-export-components
const PerformanceMonitorPage = lazy(() => import('./views/posture/PerformanceMonitorPage'));
// eslint-disable-next-line react-refresh/only-export-components
const SandboxTerminal = lazy(() => import('./views/governance/SandboxTerminal'));
// eslint-disable-next-line react-refresh/only-export-components
const ConsolePage = lazy(() => import('./components/console/ConsolePage'));
// eslint-disable-next-line react-refresh/only-export-components
const SettingsView = lazy(() => import('./views/common/SettingsView'));
// eslint-disable-next-line react-refresh/only-export-components
const DeliveryJourneyView = lazy(() => import('./views/business/DeliveryJourneyView'));
// eslint-disable-next-line react-refresh/only-export-components
const OutcomesView = lazy(() => import('./views/business/OutcomesView'));
// eslint-disable-next-line react-refresh/only-export-components
const JourneysTimelineView = lazy(() => import('./views/business/JourneysTimelineView'));
// eslint-disable-next-line react-refresh/only-export-components
const WorkflowMeshOperationsView = lazy(() => import('./views/business/WorkflowMeshOperationsView'));
// eslint-disable-next-line react-refresh/only-export-components
const CapabilityExplorer = lazy(() => import('./views/governance/CapabilityExplorer'));
// eslint-disable-next-line react-refresh/only-export-components
const EcosWorkflowWorkbench = lazy(() => import('./views/business/EcosWorkflowWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const GovernanceDomainWorkbench = lazy(() => import('./views/governance/GovernanceDomainWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const InfrastructureOpsWorkbench = lazy(() => import('./views/governance/InfrastructureOpsWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const KnowledgeExecutionWorkbench = lazy(() => import('./views/governance/KnowledgeExecutionWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const KnowledgeActionView = lazy(() => import('./views/governance/KnowledgeActionView'));
// eslint-disable-next-line react-refresh/only-export-components
const KOSWorkbench = lazy(() => import('./views/governance/KOSWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const MemoryInjector = lazy(() => import('./components/MemoryInjector'));
// eslint-disable-next-line react-refresh/only-export-components
const PlatformControlWorkbench = lazy(() => import('./views/governance/PlatformControlWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const RuntimeOpsWorkbench = lazy(() => import('./views/governance/RuntimeOpsWorkbench'));
// eslint-disable-next-line react-refresh/only-export-components
const SystemAssuranceWorkbench = lazy(() => import('./views/governance/SystemAssuranceWorkbench'));

// Phase 2 capability-reflection views (lazy loaded)
// eslint-disable-next-line react-refresh/only-export-components
const CommandExplorer = lazy(() => import('./components/commands/CommandExplorer'));
// eslint-disable-next-line react-refresh/only-export-components
const ChainStudio = lazy(() => import('./components/chain/ChainStudio'));
// eslint-disable-next-line react-refresh/only-export-components
const AuditDashboard = lazy(() => import('./components/audit/AuditDashboard'));
// eslint-disable-next-line react-refresh/only-export-components
const ResidentMonitor = lazy(() => import('./components/resident/ResidentMonitor'));
// eslint-disable-next-line react-refresh/only-export-components
const BcosDashboard = lazy(() => import('./components/bcos/BcosDashboard'));
// eslint-disable-next-line react-refresh/only-export-components
const PulseView = lazy(() => import('./components/p74/PulseView'));
// eslint-disable-next-line react-refresh/only-export-components
const DecisionGraphPage = lazy(() => import('./views/business/DecisionGraphPage'));
// eslint-disable-next-line react-refresh/only-export-components
const DecisionInboxView = lazy(() => import('./views/business/DecisionInboxView'));
// eslint-disable-next-line react-refresh/only-export-components
const SwarmDashboard = lazy(() => import('./views/compute/SwarmDashboard'));
// eslint-disable-next-line react-refresh/only-export-components
const PanoramaMasterView = lazy(() => import('./views/panorama/PanoramaMasterView'));

export type SurfaceDomainType =
  | 'overview'
  | 'execution'
  | 'swarm'
  | 'compute'
  | 'memory'
  | 'registry'
  | 'security'
  | 'system';

export interface RouteConfig {
  id: string;
  path: string;
  label: string;
  subtitle?: string;
  group: string;
  domain?: SurfaceDomainType;
  component: React.LazyExoticComponent<React.ComponentType>;
  icon?: string;
  /** When true, the route is reachable but hidden from the sidebar navigation */
  hidden?: boolean;
  /** Parent route ID for nested navigation / breadcrumb hierarchies */
  parentId?: string;
  /** Page purpose — single sentence describing what this page is for */
  purpose?: string;
  /** When to use this page — guidance for users */
  whenToUse?: string;
  /** Search/discovery keywords */
  keywords?: string[];
}

export const ROUTES: RouteConfig[] = [
  // ── 态势感知 (Situation Awareness) ──
  { id: 'Panorama', path: '/panorama', label: '体系全景', subtitle: '单一人类总控入口：11大系统门禁、74s哨兵巡航、道法术器拓扑与BCOS认知进化。', group: '态势感知', domain: 'overview', component: PanoramaMasterView, icon: 'Sparkles', purpose: '单一人类总控入口，门禁矩阵与全屏大屏。', whenToUse: '体系全局巡检、门禁与哨兵实时管控。' },
  { id: 'Home', path: '/', label: '首页', subtitle: '系统健康总览、实时告警、关键指标趋势。', group: '态势感知', domain: 'overview', component: HomePage, icon: 'LayoutDashboard', purpose: '健康、告警、任务、指标趋势的日常总览。', whenToUse: '每天先看这里。' },
  { id: 'Overview', path: '/overview', label: '概览中心', subtitle: '实时监控 eCOS v6 微服务环境，掌握集群全貌。', group: '态势感知', domain: 'overview', component: OverviewPage, icon: 'LayoutDashboard', purpose: '查看服务节点、运行状态和集群概貌。', whenToUse: '每天巡检、出问题先看。' },
  { id: 'Topology', path: '/topology', label: '全局拓扑', subtitle: '可视化服务间的调用流向与网格状态。', group: '态势感知', domain: 'system', component: TopologyView, icon: 'Network', purpose: '查看服务调用流向与拓扑结构。', whenToUse: '排查影响范围时。' },
  { id: 'Observability', path: '/observability', label: '可观测性', subtitle: '多维度链路日志与可观测性分析面板。', group: '态势感知', domain: 'system', component: ObservabilityView, icon: 'BarChart3', purpose: '查看链路日志与可观测信号。', whenToUse: '需要证据而不是直觉时。' },
  { id: 'LogViewer', path: '/logs', label: '日志查看器', subtitle: '实时日志流、搜索、过滤、导出。', group: '态势感知', domain: 'system', component: LogViewerPage, icon: 'FileText', purpose: '实时日志流、搜索、过滤和导出。', whenToUse: '看错误细节时。' },
  { id: 'SystemMap', path: '/system-map', label: '系统地图', subtitle: '全局系统结构与依赖关系可视化。', group: '态势感知', domain: 'overview', component: SystemMapView, icon: 'Network', purpose: '按页面、项目、能力域和使用路径解释整个 Cockpit。', whenToUse: '想知道 cockpit 还缺什么时。' },
  { id: 'Capabilities', path: '/capabilities', label: '能力全景', subtitle: '全生态 MCP 工具 / BOS 服务 / CLI 命令一览。', group: '态势感知', domain: 'overview', component: CapabilityExplorer, icon: 'Layers', purpose: '浏览全生态能力：MCP 工具、BOS 服务、CLI 命令、工作流。', whenToUse: '找现成能力而不是重造轮子。' },
  { id: 'Guide', path: '/guide', label: '驾驶舱指南', subtitle: '快速了解驾驶舱功能与操作方式。', group: '态势感知', domain: 'overview', component: CockpitGuideView, icon: 'Compass', purpose: '把页面、工作带和推荐入口梳成上手总览。', whenToUse: '第一次进入或迷路时。' },

  // ── 主权算力 (Sovereign Compute & Agents) ──
  { id: 'Compute', path: '/compute', label: '算力调配', subtitle: '查看分布式节点 CPU/GPU 使用率与任务调度。', group: '主权算力', domain: 'compute', component: ComputeView, icon: 'Cpu', purpose: '查看节点算力、GPU/CPU 使用率与任务调度。', whenToUse: '推理或调度卡住时。' },
  { id: 'McpMesh', path: '/mesh', label: '网格与 MCP', subtitle: '分布式新实例动态注册与基于域路由的 BOS URI 在线解析调试。', group: '主权算力', domain: 'compute', component: McpMeshView, icon: 'Globe', purpose: '查看网格连接、MCP 接入和 URI 解析。', whenToUse: '怀疑入口或路由异常时。' },
  { id: 'Agents', path: '/agents', label: 'Agent 监控', subtitle: '常驻 Agent 五类角色状态与事件流。', group: '主权算力', domain: 'swarm', component: ResidentMonitor, icon: 'Bot', purpose: '常驻 Agent 五类角色状态与事件流。', whenToUse: '监控常驻 Agent 运行状态时。' },
  { id: 'Swarm', path: '/swarm', label: 'Swarm 协同', subtitle: 'agent 协同运行链路、工作流窗口、声明占用与合规决策。', group: '主权算力', domain: 'swarm', component: SwarmDashboard, icon: 'Activity', purpose: 'agent 协同运行链路、工作流窗口、声明占用与合规决策。', whenToUse: '查看 agent 协同时。' },
  { id: 'Brain', path: '/brain', label: '智能大脑', subtitle: '基于知识库 + 记忆 + LLM 的智能问答助手。', group: '主权算力', domain: 'memory', component: BrainChat, icon: 'Brain', purpose: '基于知识库 + 记忆 + LLM 的智能问答助手。', whenToUse: '与智能助手对话时。' },
  { id: 'GBrainAdmin', path: '/gbrain-admin', label: 'GBrain 管理', subtitle: 'GBrain 智能体管理、校准与监控。', group: '主权算力', domain: 'memory', component: GBrainDashboard, icon: 'Brain', purpose: '管理智能体接入、访问凭证、模型校准与请求日志。', whenToUse: '需要处理 GBrain 控制面或凭证时。' },
  { id: 'Engines', path: '/engines', label: '引擎调度', subtitle: '管理 Kairon, Gbrain 等底层知识与智能引擎。', group: '主权算力', domain: 'compute', component: EnginesView, icon: 'Cpu', purpose: '管理 Kairon、Gbrain 等智能引擎。', whenToUse: '排查能力供给层时。' },
  { id: 'Commands', path: '/commands', label: '命令全景', subtitle: '全量 CLI 命令浏览、搜索与帮助引导。', group: '主权算力', domain: 'system', component: CommandExplorer, icon: 'Terminal', purpose: '全量 CLI 命令浏览、搜索与帮助引导。', whenToUse: '找命令、看命令用法时。' },
  { id: 'Chain', path: '/chain', label: '链路编排', subtitle: '多命令联动链路的 DAG 可视化与 dry-run 执行。', group: '主权算力', domain: 'execution', component: ChainStudio, icon: 'GitBranch', purpose: '多命令联动链路的 DAG 可视化与 dry-run 执行。', whenToUse: '编排多命令联动链路时。' },

  // ── 业务闭环 (Business Journeys & Execution) ──
  { id: 'WorkCases', path: '/cases', label: '案件', subtitle: '按案件组织任务、材料、确认、回执和归档。', group: '业务闭环', domain: 'execution', component: WorkCasesPage, icon: 'ClipboardList', purpose: '处理正式工作案件，而不是在工具页面间跳转。', whenToUse: '收到 OA 任务或需要推进一项正式工作时。' },
  { id: 'TaskCenter', path: '/tasks', label: '任务中心', subtitle: '任务统一管理、状态跟踪、操作控制。', group: '业务闭环', domain: 'swarm', component: TaskCenterPage, icon: 'ClipboardList', purpose: '统一管理任务、草稿和承接动作。', whenToUse: '需要把发现变成任务时。' },
  { id: 'Workflows', path: '/workflows', label: '工作流', subtitle: '实时跟踪与干预自治 Agent 的运行链路。', group: '业务闭环', domain: 'execution', component: WorkflowsView, icon: 'GitCommit', purpose: '跟踪自治 Agent 工作流运行链路。', whenToUse: '验证流程有没有真正闭环时。' },
  { id: 'Bcos', path: '/bcos', label: 'BCOS 北极星', subtitle: '业务闭环系统：北极星价值度量 + 信号路由 + 进化引擎。', group: '业务闭环', domain: 'system', component: BcosDashboard, icon: 'Compass', purpose: '业务闭环系统：北极星价值度量、信号路由与进化引擎。', whenToUse: '查看业务闭环健康度时。' },
  { id: 'DomainApps', path: '/domain-apps', label: '领域应用', subtitle: '第三方领域应用集成。', group: '业务闭环', domain: 'registry', component: DomainAppsView, icon: 'LayoutDashboard', purpose: '统一挂载领域应用。', whenToUse: '进入领域应用时。' },
  { id: 'SceneOverview', path: '/scenes', label: '场景总览', subtitle: 'v3 场景卡生命周期分布、健康状态与域过滤。', group: '业务闭环', domain: 'swarm', component: SceneOverviewView, icon: 'LayoutGrid', purpose: '浏览所有 v3 场景卡的生命周期阶段和健康度。', whenToUse: '需要总览场景体系或找某个场景时。' },
  { id: 'SceneDetail', path: '/scenes/:id', label: '场景详情', subtitle: '单场景 journey、校准曲线、能力引用与拓扑。', group: '业务闭环', domain: 'swarm', component: SceneDetailView, icon: 'FileText', purpose: '深入查看单个场景卡的运行与校准数据。', whenToUse: '需要执行场景或查看其依赖时。', hidden: true },
  { id: 'SceneCards', path: '/scene-cards', label: '场景卡评审', subtitle: '评审 Workflow Mesh 场景候选，完整性不足时保持提案态。', group: '业务闭环', domain: 'swarm', component: SceneCardReviewView, icon: 'FileText', purpose: '评审 Workflow Mesh 场景候选并保持 proposal-only 边界。', whenToUse: '把业务机会转成可验证场景时。' },
  { id: 'SceneGraphView', path: '/scene-graph', label: '场景图', subtitle: 'DAG 拓扑可视化场景间上下游关系。', group: '业务闭环', domain: 'swarm', component: SceneGraphView, icon: 'GitBranch', purpose: '可视化场景间 DAG 拓扑与依赖链。', whenToUse: '需要理解场景协作链路时。' },
  { id: 'CalibrationCenter', path: '/calibration', label: '校准中心', subtitle: '场景校准门控状态与升级队列。', group: '业务闭环', domain: 'swarm', component: CalibrationView, icon: 'TrendingUp', purpose: '跟踪场景校准进度和生命周期升级条件。', whenToUse: '需要评估场景信任升级时机时。' },
  { id: 'DecisionInbox', path: '/decision-inbox', label: '决策收件箱', subtitle: '场景卡驱动的决策生命周期管理 — 摄入→审批→完成。', group: '业务闭环', domain: 'swarm', component: DecisionInboxView, icon: 'Inbox', purpose: '场景卡驱动的决策生命周期管理。', whenToUse: '处理待审批决策时。' },
  { id: 'DecisionGraph', path: '/decision-graph', label: '决策因果图', subtitle: '决策因果拓扑可视化 — 节点、边、参与者、动作聚合。', group: '业务闭环', domain: 'swarm', component: DecisionGraphPage, icon: 'GitFork', purpose: '可视化决策因果拓扑，追踪节点上下游影响面。', whenToUse: '需要理解决策链路或影响范围时。' },
  { id: 'Research', path: '/research', label: '研究中心', subtitle: '学术文献检索、阅读与知识沉淀。', group: '业务闭环', domain: 'memory', component: ResearchHubView, icon: 'Search', purpose: '承接研究发起、追问、发布和后续任务。', whenToUse: '做内容、研究、产品推演时。' },
  { id: 'Knowledge', path: '/knowledge', label: '知识中枢', subtitle: '跨域检索与记忆摄取管线的状态和监控。', group: '业务闭环', domain: 'memory', component: KnowledgeHubView, icon: 'Database', purpose: '查看知识与检索能力状态。', whenToUse: '想知道知识是否能支撑动作时。' },
  { id: 'KnowledgeAction', path: '/knowledge-action', label: '知识到行动', subtitle: '将知识引用承接为受治理任务并记录行动回执。', group: '业务闭环', domain: 'memory', component: KnowledgeActionView, icon: 'ArrowRight', purpose: '把知识引用承接为受治理任务并留下行动回执。', whenToUse: '需要把研究结论转成可验证动作时。' },
  { id: 'Assets', path: '/assets', label: '技术资产库', subtitle: '集中索引自动化工作流、工具管线与智能体自定义开发技能。', group: '业务闭环', domain: 'registry', component: AssetsView, icon: 'Briefcase', purpose: '索引工作流、工具管线与智能体技能资产。', whenToUse: '找现成能力而不是重造轮子。' },
  { id: 'Kems', path: '/kems', label: 'KEMS 质量治理', subtitle: '以质量指标、哈希和证据引用驱动 OCR 复核与知识准入。', group: '业务闭环', domain: 'registry', component: KemsWorkbench, icon: 'FileText', purpose: '以质量指标、哈希和证据引用驱动 OCR 复核与知识准入。', whenToUse: '做知识质量治理时。' },
  { id: 'ExternalResources', path: '/external-resources', label: '外部能力目录', subtitle: '查看外部知识、数据、方法、工具和渠道的动态发现与健康状态。', group: '业务闭环', domain: 'registry', component: ExternalResourceCatalogView, icon: 'Database', purpose: '查看动态发现的外部知识、数据、方法、工具和渠道。', whenToUse: '判断外部能力是否存在、健康和可触达时。' },

  // ── 治理与合规 (Security & Governance Domain) —— 已全面下沉至知行 43191 底座监造台 ──
  { id: 'GovernanceDomain', path: '/governance-domain', label: '治理域', subtitle: '治理工作台：域治理、合规检查、SSOT 巡检。', group: '治理与合规', domain: 'security', component: GovernanceDomainWorkbench, icon: 'Shield', purpose: '统一治理工作台，覆盖域治理、合规检查与 SSOT 巡检。', whenToUse: '做治理巡检或合规审查时。', hidden: true },
  { id: 'AlertCenter', path: '/alerts', label: '告警中心', subtitle: '统一告警管理、规则配置、告警历史。', group: '治理与合规', domain: 'security', component: AlertCenterPage, icon: 'Bell', purpose: '统一管理告警、规则和历史。', whenToUse: 'P0/P1 先从这里落点。' },
  { id: 'L4Health', path: '/l4-health', label: 'L4 域健康', subtitle: '实时监控 L4 域健康状态、趋势分析和风险评估。', group: '治理与合规', domain: 'security', component: L4HealthView, icon: 'Heart', purpose: '查看 L4 域健康状态与风险。', whenToUse: '比单页看得更全时。', hidden: true },
  { id: 'Debt', path: '/debt', label: '债务治理', subtitle: '全自动审计技术债务评分，追踪高危风险。', group: '治理与合规', domain: 'security', component: DebtView, icon: 'FileText', purpose: '追踪高风险技术债务与治理优先级。', whenToUse: '规划补位和治理投入时。', hidden: true },
  { id: 'Harness', path: '/harness', label: 'Harness 合规', subtitle: '8 阶段 DAG 全生命周期合规管理与 12 章节检查。', group: '治理与合规', domain: 'execution', component: HarnessDashboard, icon: 'ShieldCheck', purpose: 'Harness 准入→验收全链路治理。', whenToUse: 'BET 交付合规审查时。' },
  { id: 'Intent', path: '/intent', label: 'Intent 编译器', subtitle: '自然语言→结构化 Spec 编译与历史管理。', group: '治理与合规', domain: 'execution', component: IntentCompiler, icon: 'Zap', purpose: '把模糊需求编译成可执行 Spec。', whenToUse: '把想法转成结构化任务时。' },
  { id: 'GovernanceSelfCheck', path: '/governance-self-check', label: '治理自检', subtitle: '架构漂移、混沌演练、画布服务、SSOT 状态自检。', group: '治理与合规', domain: 'security', component: GovernanceSelfCheck, icon: 'Activity', purpose: '一键运行全量治理自检。', whenToUse: '定期治理巡检时。', hidden: true },
  { id: 'CommandAudit', path: '/command-audit', label: '命令评分卡', subtitle: '全量命令 15 维质量评分看板。', group: '治理与合规', domain: 'system', component: AuditDashboard, icon: 'ClipboardCheck', purpose: '全量命令 15 维质量评分看板。', whenToUse: '评估命令质量、发现薄弱命令时。', hidden: true },
  { id: 'GovernancePulse', path: '/governance-pulse', label: '治理脉搏', subtitle: 'P74 工作流沉默治理 + 战略追踪。', group: '治理与合规', domain: 'security', component: PulseView, icon: 'Activity', purpose: 'P74 工作流沉默治理与战略追踪。', whenToUse: '发现工作流沉默或战略脱节时。', hidden: true },
  { id: 'Sandbox', path: '/sandbox', label: '隔离沙箱', subtitle: '在线执行测试或运行未校验的任务指令。', group: '治理与合规', domain: 'compute', component: SandboxTerminal, icon: 'Terminal', purpose: '隔离执行验证、复现和临时实验。', whenToUse: '先试再动生产面时。', hidden: true },
  { id: 'Console', path: '/console', label: '控制台', subtitle: 'BOS 调用 / MOF 校验 / Harness 运行 — 交互式控制平面。', group: '治理与合规', domain: 'execution', component: ConsolePage, icon: 'SquareTerminal', purpose: '从只读仪表盘升级为可执行控制平面。', whenToUse: '需要真正调用 BOS、跑 MOF 校验或发起 Harness 运行时。', hidden: true },
  { id: 'Performance', path: '/performance', label: '性能监控', subtitle: 'CPU/内存/磁盘/网络实时监控。', group: '治理与合规', domain: 'system', component: PerformanceMonitorPage, icon: 'Activity', purpose: '查看 CPU、内存、网络与系统性能。', whenToUse: '系统慢、负载高时。', hidden: true },
  { id: 'Settings', path: '/settings', label: '系统设置', subtitle: '配置网格路由、API Token 与治理阈值。', group: '治理与合规', domain: 'system', component: SettingsView, icon: 'Settings', purpose: '配置网格路由、凭据和治理阈值。', whenToUse: '准备挂载新应用或修配置时。' },

  // ── 工作台（保留，未消化的 workbench 页）──
  { id: 'EcosWorkflow', path: '/workbench/ecos-workflow', label: 'eCOS 工作流', group: '工作台', domain: 'execution', component: EcosWorkflowWorkbench, icon: 'GitBranch', hidden: true },
  { id: 'InfrastructureOps', path: '/workbench/infrastructure-ops', label: '基础设施运维', group: '工作台', domain: 'compute', component: InfrastructureOpsWorkbench, icon: 'Server', hidden: true },
  { id: 'KnowledgeExecution', path: '/workbench/knowledge-execution', label: '知识执行', group: '工作台', domain: 'memory', component: KnowledgeExecutionWorkbench, icon: 'BookOpen', hidden: true },
  { id: 'MemoryInjectorView', path: '/workbench/memory-injector', label: '记忆注入', group: '工作台', domain: 'memory', component: MemoryInjector, icon: 'Brain', hidden: true },
  { id: 'PlatformControl', path: '/workbench/platform-control', label: '平台控制', group: '工作台', domain: 'security', component: PlatformControlWorkbench, icon: 'MonitorCog', hidden: true },
  { id: 'RuntimeOps', path: '/workbench/runtime-ops', label: '运行时运维', group: '工作台', domain: 'compute', component: RuntimeOpsWorkbench, icon: 'Cpu', hidden: true },
  { id: 'SystemAssurance', path: '/workbench/system-assurance', label: '系统保障', group: '工作台', domain: 'security', component: SystemAssuranceWorkbench, icon: 'ShieldCheck', hidden: true },
];

/** Redirects for merged/deprecated routes — preserves deep links */
export const ROUTE_REDIRECTS: Record<string, string> = {
  '/performance-monitor': '/performance',
  '/knowledge-flow': '/knowledge',
  '/protocol': '/kems',
  '/pilot-review': '/scene-cards',
  '/c2g': '/governance-pulse',
  '/wave2': '/governance-pulse',
  '/delivery-journey': '/governance-domain',
  '/outcomes': '/governance-domain',
  '/journeys': '/governance-domain',
  '/workflow-mesh-operations': '/governance-domain',
  '/quests': '/domain-apps',
  '/digital-brain': '/brain',
  '/workbench/governance-domain': '/governance-domain',
  '/workbench/system-assurance': '/governance-domain',
  '/workbench/kos': '/',
};

/** Get route by tab ID */
export function getRouteById(id: string): RouteConfig | undefined {
  return ROUTES.find((r) => r.id === id);
}

/** Get route by path */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return ROUTES.find((r) => r.path === path);
}

/** Get all routes in a group */
export function getRoutesByGroup(group: string): RouteConfig[] {
  return ROUTES.filter((r) => r.group === group);
}

/** Get all unique groups */
export function getRouteGroups(): string[] {
  return [...new Set(ROUTES.map((r) => r.group))];
}

/** Get all routes including hidden — for E2E smoke matrix */
export function getAllRoutes(): RouteConfig[] {
  return ROUTES;
}

/** Get visible routes only (hidden=false) — for sidebar navigation */
export function getVisibleRoutes(): RouteConfig[] {
  return ROUTES.filter((r) => !r.hidden);
}

/** Get all routes matching an orthogonal surface domain */
export function getRoutesByDomain(domain: SurfaceDomainType): RouteConfig[] {
  return ROUTES.filter((r) => r.domain === domain);
}

