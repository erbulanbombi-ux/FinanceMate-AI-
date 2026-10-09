import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PeriodPicker() {
  const { currentPeriod, setCurrentPeriod } = useApp();

  // Helper to adjust month by delta (+1 or -1)
  const adjustMonth = (delta) => {
    try {
      const [year, month] = currentPeriod.split('-').map(Number);
      const date = new Date(year, month - 1 + delta, 1);
      const newY = date.getFullYear();
      const newM = String(date.getMonth() + 1).padStart(2, '0');
      setCurrentPeriod(`${newY}-${newM}`);
    } catch {
      // Fallback
    }
  };

  const formatPeriodLabel = (period) => {
    try {
      const [year, month] = period.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return period;
    }
  };

  return (
    <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
      <button
        type="button"
        onClick={() => adjustMonth(-1)}
        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        title="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative flex items-center px-2">
        <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-2 flex-shrink-0" />
        <span className="text-xs font-semibold text-slate-200 min-w-[70px] text-center">
          {formatPeriodLabel(currentPeriod)}
        </span>
        <input
          type="month"
          value={currentPeriod}
          onChange={(e) => setCurrentPeriod(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="Click to pick month"
        />
      </div>

      <button
        type="button"
        onClick={() => adjustMonth(1)}
        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        title="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
