import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getBudget, setBudget } from '../api/budget';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import {
  PieChart as PieIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

const BUDGET_CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Other',
];

export default function Budget() {
  const { userId, currentPeriod, formatCurrency } = useApp();

  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set Budget Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('Food');
  const [modalAmount, setModalAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchBudgetItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBudget(userId, currentPeriod);
      setBudgetData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch budget');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPeriod]);

  useEffect(() => {
    fetchBudgetItems();
  }, [fetchBudgetItems]);

  // Normalize budget list from diverse API response shapes
  const budgetsList = React.useMemo(() => {
    if (!budgetData) return [];
    if (Array.isArray(budgetData)) return budgetData;
    if (Array.isArray(budgetData.budgets)) return budgetData.budgets;

    // If it's a key-value object: { "Food": { limit: 40000, spent: 25000 } } or { "Food": 40000 }
    return Object.entries(budgetData)
      .filter(([k]) => k !== 'user_id' && k !== 'period' && k !== 'id')
      .map(([cat, val]) => {
        if (typeof val === 'object' && val !== null) {
          return {
            category: cat,
            limit: val.limit || val.amount || val.budget || 0,
            spent: val.spent || 0,
          };
        }
        return {
          category: cat,
          limit: Number(val) || 0,
          spent: 0,
        };
      });
  }, [budgetData]);

  // Overall totals
  const totalLimit = budgetsList.reduce((sum, b) => sum + (Number(b.limit || b.amount || 0)), 0);
  const totalSpent = budgetsList.reduce((sum, b) => sum + (Number(b.spent || 0)), 0);
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const exceededCount = budgetsList.filter((b) => {
    const limit = Number(b.limit || b.amount || 0);
    const spent = Number(b.spent || 0);
    return limit > 0 && spent > limit;
  }).length;

  const handleOpenEdit = (category, currentLimit = '') => {
    setModalCategory(category);
    setModalAmount(currentLimit ? String(currentLimit) : '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!modalAmount || Number(modalAmount) <= 0) {
      setModalError('Please enter a valid positive budget amount.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      const payload = {
        user_id: String(userId),
        category: modalCategory,
        amount: Number(modalAmount),
        period: currentPeriod,
      };

      await setBudget(payload);
      setIsModalOpen(false);
      setModalAmount('');
      fetchBudgetItems();
    } catch (err) {
      setModalError(err.message || 'Failed to save budget limit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Budget Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Establish category limits and prevent overspending
          </p>
        </div>

        <button
          onClick={() => handleOpenEdit('Food')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fintech-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Allocated Budget
          </span>
          <p className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(totalLimit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Sum of all category caps</p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Budget Spent
          </span>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1">
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {overallPercentage}% of total limit utilized
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Budget Health
          </span>
          <p className={`text-2xl font-extrabold mt-1 ${exceededCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {exceededCount > 0 ? `${exceededCount} Exceeded` : 'All Within Limit'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {exceededCount > 0
              ? 'Immediate action recommended'
              : 'Spending is safely controlled'}
          </p>
        </div>
      </div>

      {/* Main Budget Grid */}
      {loading ? (
        <LoadingSkeleton type="cards" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchBudgetItems} />
      ) : budgetsList.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title="No budgets configured"
          subtitle="Set spending thresholds to track your financial health"
          actionText="Create First Budget"
          onAction={() => handleOpenEdit('Food')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgetsList.map((item, idx) => {
            const category = item.category || `Category #${idx + 1}`;
            const limit = Number(item.limit || item.amount || 0);
            const spent = Number(item.spent || 0);
            const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isExceeded = percentage > 100;
            const isWarning = percentage >= 80 && !isExceeded;
            const diff = Math.abs(spent - limit);

            return (
              <div
                key={category}
                className={`fintech-card p-5 space-y-4 relative overflow-hidden transition-all ${
                  isExceeded
                    ? 'border-rose-900/60 bg-rose-950/10 hover:border-rose-700/80'
                    : isWarning
                    ? 'border-amber-900/40 hover:border-amber-600/60'
                    : 'hover:border-indigo-500/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{category}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCurrency(spent)} of {formatCurrency(limit)}
                    </p>
                  </div>

                  {/* Percentage Badge */}
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                      isExceeded
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isExceeded && <ShieldAlert className="w-3.5 h-3.5 mr-0.5" />}
                    <span>{percentage}%</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-sm shadow-rose-500/50'
                          : isWarning
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                          : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {isExceeded ? (
                        <span className="text-rose-400 font-semibold">
                          ⚠️ Exceeded by {formatCurrency(diff)}
                        </span>
                      ) : (
                        <span>{formatCurrency(diff)} remaining</span>
                      )}
                    </span>
                    <span>Cap: {formatCurrency(limit)}</span>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {isExceeded ? 'Requires adjustment' : 'On schedule'}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(category, limit)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Edit Limit →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Set Budget Limit
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Monthly Limit (₸)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₸</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="40000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Alert triggers when expenses exceed 80% and 100% of this value.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
