import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getDashboard } from '../api/dashboard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Lightbulb,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#ef4444', // Red
];

export default function Dashboard() {
  const { userId, currentUser, currentPeriod, formatCurrency } = useApp();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard(userId, currentPeriod);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-800 rounded w-48 animate-pulse" />
        </div>
        <LoadingSkeleton type="cards" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          message={error}
          onRetry={fetchDashboardData}
          onOpenConfig={() => {}}
        />
      </div>
    );
  }

  // Extract dashboard data fields gracefully supporting both standard & variation API shapes
  const balance = data?.balance ?? data?.current_balance ?? 0;
  const totalIncome = data?.total_income ?? data?.income ?? 0;
  const totalExpenses = data?.total_expenses ?? data?.expenses ?? 0;
  const netSavings = totalIncome - totalExpenses;

  // Format category breakdown for charts
  const rawCategories = data?.categories_breakdown || data?.categories || {};
  const categoriesList = Array.isArray(rawCategories)
    ? rawCategories.map((c) => ({
        name: c.category || c.name,
        value: Math.abs(Number(c.amount || c.spent || c.value || 0)),
      }))
    : Object.entries(rawCategories).map(([key, val]) => ({
        name: key,
        value: Math.abs(Number(typeof val === 'object' ? val.spent || val.amount : val)),
      }));

  const totalCategorySpent = categoriesList.reduce((acc, c) => acc + c.value, 0) || 1;

  // Format recent transactions
  const recentTransactions = data?.recent_transactions || data?.transactions || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, {currentUser?.username} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Financial snapshot and metrics for <span className="text-indigo-400 font-semibold">{currentPeriod}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/transactions')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={() => navigate('/simulator')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="fintech-card p-5 relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-[#111726] to-[#111726] border-indigo-900/40 hover:border-indigo-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Balance</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-indigo-300/80 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Available capital
            </p>
          </div>
        </div>

        {/* Total Income */}
        <div className="fintech-card p-5 border-emerald-900/30 hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Income</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              +{formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total received this month</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="fintech-card p-5 border-rose-900/30 hover:border-rose-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              -{formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total spent this month</p>
          </div>
        </div>

        {/* Net Savings */}
        <div className="fintech-card p-5 border-cyan-900/30 hover:border-cyan-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Flow</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${netSavings >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Cash flow surplus / deficit</p>
          </div>
        </div>
      </div>

      {/* Charts Section: Category Breakdown + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie / Donut Chart */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Expenses by Category
              </h3>
              <p className="text-xs text-slate-400">Distribution of monthly expenditures</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {categoriesList.length} Categories
            </span>
          </div>

          {categoriesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-2">
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriesList}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoriesList.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Amount']}
                      contentStyle={{
                        backgroundColor: '#111726',
                        borderColor: '#1e293b',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with percentages */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {categoriesList.map((item, idx) => {
                  const percent = Math.round((item.value / totalCategorySpent) * 100);
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 font-medium">
                        <span className="text-slate-400">{percent}%</span>
                        <span className="text-white">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No categories recorded"
              subtitle="Add transactions to view category distribution"
            />
          )}
        </div>

        {/* Bar Chart Comparison */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Category Spending Comparison
              </h3>
              <p className="text-xs text-slate-400">Sorted view of largest outlays</p>
            </div>
            <button
              onClick={() => navigate('/budget')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Budget Limits <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {categoriesList.length > 0 ? (
            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...categoriesList].sort((a, b) => b.value - a.value).slice(0, 6)}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#1e293b' }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#111726',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoriesList.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No spending data"
              subtitle="Spending will appear here as transactions are logged"
            />
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & AI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 columns wide) */}
        <div className="lg:col-span-2 fintech-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Recent Transactions
              </h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all ({recentTransactions.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentTransactions.slice(0, 5).map((tx, idx) => {
                      const isIncome = tx.type === 'income' || Number(tx.amount) > 0 && tx.type !== 'expense';
                      return (
                        <tr key={tx.id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-200 truncate max-w-[140px] sm:max-w-xs">
                            {tx.description || 'Transaction'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700/60 font-medium">
                              {tx.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">
                            {tx.date || '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold whitespace-nowrap">
                            <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No recent transactions"
                subtitle="Your latest transactions will show up here"
                actionText="Add Transaction"
                onAction={() => navigate('/transactions')}
              />
            )}
          </div>
        </div>

        {/* AI Insight & Forecast summary widgets */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Quick Insight Card */}
          <div className="fintech-card p-5 bg-gradient-to-br from-indigo-950/30 to-[#111726] border-indigo-900/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Financial Insight
              </span>
              <button
                onClick={() => navigate('/insights')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                All Insights →
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {typeof data?.insight === 'string'
                ? data.insight
                : data?.insight?.message ||
                  data?.insight?.text ||
                  '💡 Keep monitoring your discretionary expenses. Your savings balance is on track for the month.'}
            </p>
          </div>

          {/* Quick Forecast Card */}
          <div className="fintech-card p-5 bg-gradient-to-br from-cyan-950/30 to-[#111726] border-cyan-900/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Forecast Summary
              </span>
              <button
                onClick={() => navigate('/forecast')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                View Curve →
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {typeof data?.forecast_summary === 'string'
                ? data.forecast_summary
                : data?.forecast_summary?.summary ||
                  data?.forecast_summary?.message ||
                  '📈 Cash flow projections show positive end-of-period liquidity with steady inflows.'}
            </p>
          </div>

          {/* AI Chat Banner */}
          <div
            onClick={() => navigate('/chat')}
            className="fintech-card p-4 border-indigo-800/40 bg-indigo-600/10 hover:bg-indigo-600/15 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ask FinMate AI</p>
                <p className="text-[11px] text-indigo-300">"Can I afford a new phone?"</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
