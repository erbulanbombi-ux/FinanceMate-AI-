import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Target,
  Sparkles,
  RefreshCw,
  CircleDollarSign,
} from 'lucide-react';

const SUGGESTIONS = [
  { name: 'MacBook Pro', price: '950000' },
  { name: 'iPhone 16', price: '550000' },
  { name: 'Weekend Trip to Almaty', price: '85000' },
  { name: 'Gym Annual Membership', price: '120000' },
];

export default function Simulator() {
  const { formatCurrency } = useApp();

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [dailyExpenses, setDailyExpenses] = useState('');
  const [timeFrameMonths, setTimeFrameMonths] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (
      !itemName.trim() ||
      Number(price) <= 0 ||
      Number(monthlyIncome) <= 0 ||
      Number(dailyExpenses) < 0 ||
      Number(timeFrameMonths) <= 0
    ) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthly_income: Number(monthlyIncome),
          daily_expenses: Number(dailyExpenses),
          target_goal: itemName.trim(),
          target_price: Number(price),
          time_frame_months: Number(timeFrameMonths),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Не удалось проанализировать финансы.');
      }
      setResult(data);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Не удалось подключиться к FastAPI через локальный /api proxy.'
          : err.message || 'Не удалось проанализировать финансы.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setItemName(preset.name);
    setPrice(preset.price);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Target className="w-7 h-7 text-indigo-400" />
          Financial Goal Planner
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Get an AI-powered savings plan for your financial goal
        </p>
      </div>

      {/* Simulator Input Card */}
      <div className="fintech-card p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Plan Your Goal
          </h2>
          <span className="text-xs text-slate-400">
            Your financial details stay with your backend
          </span>
        </div>

        <form onSubmit={handleSimulate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Monthly income (₸)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="500000"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Daily expenses (₸)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={dailyExpenses}
                onChange={(e) => setDailyExpenses(e.target.value)}
                placeholder="8000"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Goal name
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="MacBook Pro"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Goal price (₸)
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="950000"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Time frame (months)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={timeFrameMonths}
                onChange={(e) => setTimeFrameMonths(e.target.value)}
                placeholder="12"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-xs text-slate-400 block mb-2">Popular presets:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  {preset.name} (₸{Number(preset.price).toLocaleString()})
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !itemName || !price || !monthlyIncome || !dailyExpenses || !timeFrameMonths}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI анализирует ваши финансы...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Рассчитать</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="fintech-card border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {result && (
        <div className="fintech-card p-6 sm:p-8 space-y-5 border border-emerald-500/40 bg-emerald-500/5 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Your savings plan</h3>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4">
            <CircleDollarSign className="w-6 h-6 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Daily target savings
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-300">
                {formatCurrency(result.daily_target_savings)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI advice</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{result.ai_advice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
