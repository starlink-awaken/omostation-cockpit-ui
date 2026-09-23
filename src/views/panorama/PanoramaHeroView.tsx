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
  Sparkles
} from 'lucide-react';
import { useLiveTelemetry } from '../../api/liveTelemetry';
import { useApprovalQueue } from '../../api/hooks/swarm';
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
  const [isDecisionDrawerOpen, setIsDecisionDrawerOpen] = useState(false);

  const pendingCount = queueData?.queue?.length ?? 0;
  const completionPct = Math.round((telemetry.betStats.done / (telemetry.betStats.total || 1)) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8 animate-fade-in">
      {/* 👑 主权执掌者最高控制权 Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/20 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setIsDecisionDrawerOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsDecisionDrawerOpen(true); } }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold tracking-wider uppercase cursor-pointer hover:bg-blue-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              主权执掌者视界 · 夏明星态势导读与署名自进化舱
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              人类意志最高控制权 (Human In Command)
              <button
                type="button"
                onClick={() => setIsDecisionDrawerOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
                  pendingCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400/60'
                }`}
                title="点击打开主权执掌者决策闸门"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span>{pendingCount > 0 ? `${pendingCount} 项待决 · 点击裁决` : '0 项待决 · 全域绿灯'}</span>
              </button>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              智能体提炼的草案与治理自愈提案在此呈递。每一次物理批准或修改都会作为强化学习样本，固化进个人主权时间账本与知识库。
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/observability')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/observability'); } }}
              title="点击查看可观测与遥测连接详情"
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="text-xs text-slate-400">实时连接</div>
              <div className="text-sm font-semibold flex items-center justify-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${telemetry.connected ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400'}`} />
                {telemetry.connected ? '43191 SSE' : '本地静态模式'}
              </div>
            </div>
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/compute')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/compute'); } }}
              title="点击查看算力与模型调配"
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="text-xs text-slate-400">算力星系</div>
              <div className="text-sm font-semibold text-blue-400 mt-0.5">
                {telemetry.vramUsage}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 态势总览三栏卡片 (支持下钻) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          role="button"
          tabIndex={0}
          onClick={() => navigate('/scenes')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/scenes'); } }}
          className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-slate-400">系统当下在忙什么？</h2>
                <p className="text-base font-semibold text-white">5 大业务域 · 12 主权旅程</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            端侧已就绪 16 模型星系，4 大动态回路全速巡检。Resident Guardian 每 {telemetry.guardianCadence}s 发送一次自愈心跳。
          </p>
          <div className="mt-3 text-[11px] text-blue-400 flex items-center gap-1 font-medium">
            <span>进入业务场景总览</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => navigate('/system-map')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/system-map'); } }}
          className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-slate-400">战略规划台账进度</h2>
                <p className="text-base font-semibold text-white">443 / 443 全部达成 (100%)</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>已完成: 443 (大满贯)</span>
              <span>受阻: 0 (清零)</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span>穿透系统地图与全量台账</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => navigate('/harness')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/harness'); } }}
          className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-slate-400">不可违背规则与治理</h2>
                <p className="text-base font-semibold text-white">11 / 11 核心门禁全绿</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            物理隔离 PASW 强制生效，7720+ 条规则全天候守护，A1~A9 全量门禁达成 100% PASS。
          </p>
          <div className="mt-3 text-[11px] text-indigo-400 flex items-center gap-1 font-medium">
            <span>进入 Harness 全生命周期合规</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* 🛡️ 11 大全局核心运行门禁阵列 (支持点击下钻) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">全局 11 大核心运行门禁阵列</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% PASS
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">点击卡片可下钻 · 读源 43191</span>
            <a
              href="http://localhost:43191/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>进入知行监造台</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {telemetry.gates.map((g) => {
            const targetRoute = GATE_ROUTE_MAP[g.id] || '/overview';
            return (
              <div 
                key={g.id} 
                role="button"
                tabIndex={0}
                onClick={() => navigate(targetRoute)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(targetRoute);
                  }
                }}
                aria-label={`门禁 ${g.id}: ${g.title}，点击下钻`}
                className="group bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    {g.id}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {g.verdict}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200 truncate group-hover:text-white" title={g.title}>{g.title}</div>
                <div className="text-[11px] text-slate-400 truncate mt-1" title={g.detail}>{g.detail}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ⚡ 4 大业务回路实时观测 (支持点击下钻) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">4 大业务闭环回路实时脉冲</h2>
          <span className="text-xs text-slate-400 ml-auto">点击回路进入对应领域控制面</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {telemetry.lastPulse?.circuit_pulses.map((cp, idx) => {
            const targetRoute = LOOP_ROUTE_MAP[cp.loop] || '/bcos';
            return (
              <div 
                key={idx} 
                role="button"
                tabIndex={0}
                onClick={() => navigate(targetRoute)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(targetRoute);
                  }
                }}
                aria-label={`业务回路 ${cp.loop}，点击下钻`}
                className="group bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400 uppercase group-hover:text-blue-300 transition-colors flex items-center gap-1">
                      {cp.loop.replace('_', ' ')}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      {cp.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">
                    {cp.adherence ? `遵从度: ${cp.adherence}` : cp.compliance ? `合规率: ${cp.compliance}` : cp.rules ? `规约: ${cp.rules}` : `模式: ${cp.mode}`}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>周期 #{telemetry.lastPulse?.cycle || 1} · 脉冲正常</span>
                  <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">进入回路 →</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🧭 四大主权业务域快速直达 (规范化 useNavigate) */}
      <section className="space-y-4 pt-4 border-t border-slate-800/80">
        <h2 className="text-lg font-semibold text-white">主权座舱四域核心</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            type="button"
            onClick={() => navigate('/overview')}
            className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-center justify-between text-blue-400 mb-2">
              <Layers className="w-5 h-5" />
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-sm font-semibold text-white">态势感知</div>
            <p className="text-xs text-slate-400 mt-1">443 台账规划、全局拓扑与可观测性</p>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/compute')}
            className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <Cpu className="w-5 h-5" />
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-sm font-semibold text-white">主权算力</div>
            <p className="text-xs text-slate-400 mt-1">AetherForge 显存、Swarm 蜂群与节点拓扑</p>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/scenes')}
            className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-sm font-semibold text-white">业务闭环</div>
            <p className="text-xs text-slate-400 mt-1">5 大业务域场景卡、5 级生命周期与自适应学习</p>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/governance-domain')}
            className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <Database className="w-5 h-5" />
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-sm font-semibold text-white">治理与合规</div>
            <p className="text-xs text-slate-400 mt-1">GaC 门禁规则、MOF 规约与 Kairon/GBrain 架构</p>
          </button>
        </div>
      </section>

      {/* In-place Decision Drawer */}
      <InPlaceDecisionDrawer 
        isOpen={isDecisionDrawerOpen}
        onClose={() => setIsDecisionDrawerOpen(false)}
      />
    </div>
  );
}
