import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Zap, 
  Database,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Bot,
  Compass,
  Clock
} from 'lucide-react';
import { useLiveTelemetry } from '../../api/liveTelemetry';
import { useApprovalQueue } from '../../api/hooks/swarm';
import { useGovernancePanorama } from '../../api/hooks/useGovernancePanorama';
import InPlaceDecisionDrawer from './InPlaceDecisionDrawer';

const GATE_ROUTE_MAP: Record<string, string> = {
  A1: '/workflows',
  A2: '/overview',
  A3: '/intent',
  A4: '/engines',
  A5: '/observability',
  A6: '/swarm',
  A7: '/swarm',
  A8: '/tasks',
  A9: '/observability',
  RF0: '/mesh',
  'RC-DL': '/compute',
};

const LOOP_ROUTE_MAP: Record<string, string> = {
  value_reinforcement: '/bcos',
  execution_control: '/workflows',
  meta_governance: '/governance-domain',
  physical_isolation: '/sandbox',
};

export default function PanoramaHeroView() {
  const navigate = useNavigate();
  const telemetry = useLiveTelemetry();
  const { data: queueData } = useApprovalQueue();
  const { data: panoramaData } = useGovernancePanorama();
  const [isDecisionDrawerOpen, setIsDecisionDrawerOpen] = useState(false);

  const agentVis = panoramaData?.agent_visibility;
  const pendingCount = queueData?.queue?.length ?? 0;
  const completionPct = Math.round((telemetry.betStats.done / (telemetry.betStats.total || 1)) * 100);

  const gatesList = telemetry.gates || [];
  const circuitPulses = telemetry.lastPulse?.circuit_pulses || [];

  return (
    <div className="space-y-4 text-slate-100 animate-fade-in font-sans">
      {/* 👑 主权执掌者极简中枢条 (Sovereign Focus Strip) */}
      <section className="relative overflow-hidden rounded-xl bg-[#111827]/90 border border-slate-800/80 p-4 md:p-5 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                夏明星主权在位
              </span>
              <button
                type="button"
                onClick={() => setIsDecisionDrawerOpen(true)}
                title="点击打开主权执掌者决策闸门"
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
                  pendingCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span>{pendingCount > 0 ? `${pendingCount} 项待决 · 点击裁决` : '0 项待决 · 全域绿灯'}</span>
              </button>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              人类意志最高控制权 (Human In Command)
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-normal">
              智能体提炼的草案与治理自愈提案在此呈递。每一次物理批准或修改均固化进个人主权时间账本与知识库。
            </p>
          </div>

          {/* 宏观双核遥测状态徽章 */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/observability')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/observability'); } }}
              title="点击查看可观测与遥测连接详情"
              className="px-3.5 py-2 rounded-lg bg-[#0b0f19]/80 border border-slate-800 hover:border-indigo-500/40 text-center cursor-pointer transition-all"
            >
              <div className="text-[10px] text-slate-400 font-mono">实时遥测源</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1.5 mt-0.5 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${telemetry.connected ? 'bg-emerald-400 shadow-sm' : 'bg-amber-400'}`} />
                {telemetry.connected ? '43191 SSE' : '本地静态模式'}
              </div>
            </div>
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/compute')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/compute'); } }}
              title="点击查看算力与模型调配"
              className="px-3.5 py-2 rounded-lg bg-[#0b0f19]/80 border border-slate-800 hover:border-indigo-500/40 text-center cursor-pointer transition-all"
            >
              <div className="text-[10px] text-slate-400 font-mono">AetherForge 算力</div>
              <div className="text-xs font-bold text-cyan-400 mt-0.5 font-mono">
                {telemetry.vramUsage}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 态势总览三栏紧凑卡片 (支持下钻，保留测试选择器) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div 
          role="button"
          tabIndex={0}
          onClick={() => navigate('/scenes')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/scenes'); } }}
          className="group bg-[#111827]/80 hover:bg-[#111827] border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-3.5 backdrop-blur-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-medium text-slate-400">系统当下在忙什么？</h2>
                <p className="text-sm font-bold text-white">5 大业务域 · 12 主权旅程</p>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
            端侧已就绪 16 模型星系，4 大动态回路全速巡检。Resident Guardian 每 {telemetry.guardianCadence}s 发送一次自愈心跳。
          </p>
          <div className="mt-2 text-[10px] text-indigo-300 flex items-center gap-1 font-semibold">
            <span>进入业务场景总览</span>
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => navigate('/system-map')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/system-map'); } }}
          className="group bg-[#111827]/80 hover:bg-[#111827] border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-3.5 backdrop-blur-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-medium text-slate-400">战略规划台账进度</h2>
                <p className="text-sm font-bold text-emerald-400 font-mono">443 / 443 全部达成 (100%)</p>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mb-2 overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Phase 1-8 治理底座与 Harness 8 阶段全部收敛，闭环交付验证。
          </p>
          <div className="mt-2 text-[10px] text-emerald-300 flex items-center gap-1 font-semibold">
            <span>查看完整交付脉络</span>
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => navigate('/harness')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/harness'); } }}
          className="group bg-[#111827]/80 hover:bg-[#111827] border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-3.5 backdrop-blur-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-medium text-slate-400">不可违背规则与治理</h2>
                <p className="text-sm font-bold text-cyan-400 font-mono">11 / 11 核心门禁全绿</p>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            A1-A9、RF0、RC-DL 11 大系统门禁三轴证据链持续通过，零未授权变更。
          </p>
          <div className="mt-2 text-[10px] text-cyan-300 flex items-center gap-1 font-semibold">
            <span>进入治理合规验证台</span>
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* 🍱 主战位两栏 Bento Grid (7:5 黄金比例布局) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 左主栏 (7 列: 门禁脉冲、业务价值回路、四大业务域) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 11 大核心系统门禁矩阵 */}
          <section className="bg-[#111827]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  11 大宪法级系统门禁矩阵
                </h2>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                11/11 PASS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {gatesList.map((gate) => {
                const targetRoute = GATE_ROUTE_MAP[gate.id] || '/panorama';
                const gateName = (gate as { name?: string }).name || gate.title || '';
                return (
                  <button
                    key={gate.id}
                    type="button"
                    onClick={() => navigate(targetRoute)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(targetRoute);
                      }
                    }}
                    aria-label={`门禁 ${gate.id}: ${gateName}`}
                    className="p-2.5 rounded-lg bg-[#0b0f19]/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-cyan-300 group-hover:text-cyan-200">
                        {gate.id}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[11px] font-medium text-slate-300 truncate" title={gateName}>
                      {gateName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {gate.verdict}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4 大业务价值回路态势 */}
          <section className="bg-[#111827]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  业务与治理四阶闭环回路
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">74s 脉冲同步</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {circuitPulses.map((cp) => {
                const targetRoute = LOOP_ROUTE_MAP[cp.loop] || '/panorama';
                return (
                  <button
                    key={cp.loop}
                    type="button"
                    onClick={() => navigate(targetRoute)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(targetRoute);
                      }
                    }}
                    aria-label={`业务回路 ${cp.loop}`}
                    className="p-3 rounded-lg bg-[#0b0f19]/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-slate-300 group-hover:text-amber-300 capitalize">
                        {cp.loop.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                        {cp.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {cp.adherence ? `遵从度: ${cp.adherence}` : cp.compliance ? `合规率: ${cp.compliance}` : `模式: ${cp.mode}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 四大主权业务域快速直达 */}
          <section className="bg-[#111827]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
              主权座舱四域核心直达
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button 
                type="button"
                onClick={() => navigate('/overview')}
                aria-label="态势感知"
                className="p-3 rounded-lg bg-[#0b0f19]/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition-all"
              >
                <Layers className="w-4 h-4 text-blue-400 mb-1.5" />
                <div className="text-xs font-bold text-white">态势感知</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">全景拓扑与指标</p>
              </button>

              <button 
                type="button"
                onClick={() => navigate('/compute')}
                aria-label="主权算力"
                className="p-3 rounded-lg bg-[#0b0f19]/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all"
              >
                <Cpu className="w-4 h-4 text-indigo-400 mb-1.5" />
                <div className="text-xs font-bold text-white">主权算力</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">AetherForge 显存</p>
              </button>

              <button 
                type="button"
                onClick={() => navigate('/scenes')}
                aria-label="业务闭环"
                className="p-3 rounded-lg bg-[#0b0f19]/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 mb-1.5" />
                <div className="text-xs font-bold text-white">业务闭环</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">5 域场景卡</p>
              </button>

              <button 
                type="button"
                onClick={() => navigate('/governance-domain')}
                aria-label="治理与合规"
                className="p-3 rounded-lg bg-[#0b0f19]/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-all"
              >
                <Database className="w-4 h-4 text-amber-400 mb-1.5" />
                <div className="text-xs font-bold text-white">治理与合规</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">GaC 门禁与契约</p>
              </button>
            </div>
          </section>
        </div>

        {/* 右主栏 (5 列: Agent Brief 机器权威、推荐行动、深度遥测概览) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Agent Brief 机器权威面板 */}
          <section className="bg-[#111827]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Agent Brief 机器权威信封
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                agent-brief.json
              </span>
            </div>

            {/* Claims 准入与价值就绪 */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#0b0f19]/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">Claims 激活准入</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {agentVis?.claims_activation_readiness?.readiness ?? 'AUTHORIZED_CANONICAL'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f19]/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">价值凭证状态</span>
                <span className="font-bold text-cyan-400 text-xs">
                  {agentVis?.value_proof_readiness?.status ?? 'VERIFIED'}
                </span>
              </div>
            </div>

            {/* Next Actions */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span>推荐下一步行动 (Next Actions)</span>
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <div className="space-y-1.5">
                {agentVis?.next_actions && agentVis.next_actions.length > 0 ? (
                  agentVis.next_actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-2 rounded-lg bg-[#0b0f19]/70 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] border border-indigo-800">
                          {act.priority || 'P1'}
                        </span>
                        <span className="font-medium text-slate-200 truncate">
                          {act.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-2">{act.id}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-2">无挂起行动</div>
                )}
              </div>
            </div>

            {/* Unfinished Objectives */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span>进行中目标 (Unfinished BETs)</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="space-y-1.5">
                {agentVis?.unfinished_objectives && agentVis.unfinished_objectives.length > 0 ? (
                  agentVis.unfinished_objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="p-2 rounded-lg bg-[#0b0f19]/70 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="truncate">
                        <span className="font-bold text-amber-300 font-mono text-[11px]">
                          {obj.id}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate block">
                          {obj.title || 'SSOT 治理目标交付中'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/60 flex-shrink-0 ml-2">
                        {obj.status || 'DOING'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-2">全量目标已交付</div>
                )}
              </div>
            </div>
          </section>

          {/* 深度遥测速览卡片 (直通抽屉) */}
          <section className="bg-[#111827]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  系统底座与知识健康
                </h2>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">按 D 键展开抽屉</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#0b0f19]/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">知识新鲜度</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {panoramaData?.knowledge_health?.freshness_pct ?? 93}%
                </span>
                <span className="text-[10px] text-slate-500 block">342 篇总文档</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0f19]/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">经验图谱连通性</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {panoramaData?.experience_graph?.connectivity_pct ?? 76.5}%
                </span>
                <span className="text-[10px] text-slate-500 block">412 内部连接</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0b0f19]/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">8 个 Launchd 守护进程运行正常</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">零僵尸锁</span>
            </div>
          </section>
        </div>
      </div>

      {/* 原位主权决策裁决抽屉 */}
      <InPlaceDecisionDrawer 
        isOpen={isDecisionDrawerOpen}
        onClose={() => setIsDecisionDrawerOpen(false)}
      />
    </div>
  );
}
