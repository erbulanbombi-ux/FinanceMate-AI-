import React from 'react';

export default function LoadingSkeleton({ type = 'cards' }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="fintech-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-800 rounded w-24"></div>
              <div className="w-8 h-8 bg-slate-800 rounded-xl"></div>
            </div>
            <div className="h-8 bg-slate-800 rounded w-36"></div>
            <div className="h-3 bg-slate-800/60 rounded w-28"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="fintech-card p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-48 mb-4"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/60">
            <div className="space-y-2">
              <div className="h-4 bg-slate-800 rounded w-36"></div>
              <div className="h-3 bg-slate-800/60 rounded w-24"></div>
            </div>
            <div className="h-5 bg-slate-800 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="fintech-card p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-48"></div>
        <div className="h-64 bg-slate-800/40 rounded-xl flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-fade-in">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-400">Loading FinMate data...</p>
    </div>
  );
}
