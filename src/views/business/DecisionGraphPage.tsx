/**
 * DecisionGraphPage.tsx — 决策因果图页面 (T5-05)
 *
 * 数据获取 + loading/error/empty 状态 + 渲染 DecisionGraphViewer
 */

import React, { useState } from 'react';
import { Loader2, AlertCircle, RefreshCw, Network } from 'lucide-react';
import { useDecisionGraphData } from '../../api/hooks/decisionGraph';
import { DecisionGraphViewer } from './DecisionGraphViewer';

type Locale = 'zh-CN' | 'en-US';

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '中文',
  'en-US': 'English',
};

export default function DecisionGraphPage() {
  const { data, isLoading, isError, error, refetch } = useDecisionGraphData();
  const [locale, setLocale] = useState<Locale>('zh-CN');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" aria-hidden />
        <p className="text-sm text-gray-500">加载决策因果图...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" role="alert" aria-live="assertive">
        <AlertCircle className="w-10 h-10 text-red-400" aria-hidden />
        <p className="text-sm text-red-300">{error?.message || '加载失败'}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          aria-label="重新加载"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden />
          重试
        </button>
      </div>
    );
  }

  // Empty state
  if (!data || data.summary.nodes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Network className="w-10 h-10 text-gray-500" aria-hidden />
        <p className="text-sm text-gray-400">暂无决策因果数据</p>
      </div>
    );
  }

  // Success state
  return (
    <div className="space-y-4">
      {/* Locale switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1" role="radiogroup" aria-label="语言选择">
          {(['zh-CN', 'en-US'] as Locale[]).map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={locale === l}
              onClick={() => setLocale(l)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                locale === l
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          aria-label="刷新数据"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden />
          刷新
        </button>
      </div>

      {/* Main viewer */}
      <DecisionGraphViewer data={data} locale={locale} />
    </div>
  );
}
