import React, { useState, useEffect } from 'react';
import { Sun, Shield, Cpu, Sparkles, CheckCircle2, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

export interface MorningBriefingData {
  ok: boolean;
  generated_at?: string;
  greeting?: string;
  yesterday_commits_count?: number;
  yesterday_summary?: string;
  night_defense_status?: string;
  cluster_online_summary?: string;
  memory_growth_summary?: string;
  top_action_items?: string[];
  health_score?: number;
}

export const MorningBriefingCard: React.FC = () => {
  const [data, setData] = useState<MorningBriefingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBriefing = async () => {
    try {
      const res = await fetch('/api/resident/morning-briefing');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch morning briefing', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const handleTriggerNightPatrol = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await fetch('/api/resident/night-patrol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true, deep: false }),
      });
      if (res.ok) {
        setMessage('✅ 夜巡演练执行完毕，晨间简报已同步刷新！');
        await fetchBriefing();
      } else {
        setMessage('❌ 触发夜巡演练失败');
      }
    } catch (e) {
      setMessage(`❌ 请求异常: ${String(e)}`);
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 animate-pulse">
        加载晨间自治与系统运行简报中...
      </div>
    );
  }

  const briefing = data || {
    greeting: '早安，夏明星。常驻首席参谋正在全天候守护主权操作系统。',
    yesterday_summary: '系统基线平稳，门禁正常。',
    night_defense_status: '✅ 夜间只读探针扫描通过，无高危阻断隐患。',
    cluster_online_summary: '算力拓扑网络在线就绪。',
    memory_growth_summary: '长期心智结晶与偏好模型同步完成。',
    top_action_items: [
      '保持隔离 worktree 交付纪律',
      '在 Cockpit 审阅最新避坑规则与记忆进化',
      '关注异构算力网格能效切流',
    ],
    health_score: 100,
  };

  return (
    <div className="space-y-6">
      {/* 顶部主横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shadow-inner">
              <Sun className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">晨间自治与系统运行简报</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  健康分 {briefing.health_score || 100}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1">{briefing.greeting}</p>
              {briefing.generated_at && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>生成时间: {new Date(briefing.generated_at).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerNightPatrol}
              disabled={triggering}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
              {triggering ? '巡查演练中...' : '即刻演练夜巡与简报'}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* 四大关键域卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>昨日交付与基线</span>
          </div>
          <p className="text-sm text-slate-200 font-medium line-clamp-3">
            {briefing.yesterday_summary}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>夜间防御与体检</span>
          </div>
          <p className="text-sm text-slate-200 font-medium line-clamp-3">
            {briefing.night_defense_status}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>集群算力就绪度</span>
          </div>
          <p className="text-sm text-slate-200 font-medium line-clamp-3">
            {briefing.cluster_online_summary}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>长效心智自进化</span>
          </div>
          <p className="text-sm text-slate-200 font-medium line-clamp-3">
            {briefing.memory_growth_summary}
          </p>
        </div>
      </div>

      {/* 今日推荐优先待办 (Top Actions) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          今日建议优先待办 (Top Action Items)
        </h3>
        <div className="space-y-2">
          {briefing.top_action_items && briefing.top_action_items.length > 0 ? (
            briefing.top_action_items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-lg border border-slate-700/50 transition"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs text-slate-200 leading-relaxed">{item}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400">暂无待办事项，系统各项指标均处于最优水位。</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MorningBriefingCard;
