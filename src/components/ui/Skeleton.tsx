import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width,
  height,
  circle = false,
  className = '',
  style,
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`animate-pulse bg-slate-800/80 border border-slate-700/40 ${
        circle ? 'rounded-full' : 'rounded-lg'
      } ${className}`.trim()}
      style={customStyle}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading card content..."
      className={`p-5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4 animate-pulse ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-800" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-1/3 bg-slate-800 rounded" />
          <div className="h-3 w-1/4 bg-slate-800/60 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full bg-slate-800/70 rounded" />
        <div className="h-3.5 w-5/6 bg-slate-800/50 rounded" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <div className="h-3 w-16 bg-slate-800/60 rounded" />
        <div className="h-6 w-20 bg-slate-800/80 rounded" />
      </div>
    </div>
  );
}

export function SkeletonMetric({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading metric..."
      className={`p-4 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-2 ${className}`.trim()}
    >
      <div className="flex justify-between items-center">
        <div className="h-3 w-20 bg-slate-800/80 rounded" />
        <div className="w-4 h-4 rounded bg-slate-800/60" />
      </div>
      <div className="h-7 w-28 bg-slate-800 rounded mt-1" />
      <div className="h-3 w-32 bg-slate-800/50 rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading table..."
      className={`w-full rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/60 animate-pulse ${className}`.trim()}
    >
      <div className="p-3.5 bg-slate-800/30 flex gap-4">
        <div className="h-4 w-24 bg-slate-800 rounded" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="h-4 w-20 bg-slate-800 rounded ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-slate-800/70 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-1/3 bg-slate-800/80 rounded" />
            <div className="h-3 w-1/2 bg-slate-800/50 rounded" />
          </div>
          <div className="h-6 w-16 bg-slate-800/60 rounded" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
