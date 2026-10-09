import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  subtitle = 'There is currently no data recorded for this period.',
  actionText,
  onAction,
}) {
  return (
    <div className="fintech-card p-12 text-center flex flex-col items-center justify-center space-y-3.5 my-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center border border-slate-700/60 shadow-inner">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h4 className="text-base font-bold text-slate-200 mt-1">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed">{subtitle}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
        >
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
