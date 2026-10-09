import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getForecast } from '../api/forecast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import {
  TrendingUp,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function Forecast() {
  const { userId, currentPeriod, formatCurrency } = useApp();

  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForecastData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getForecast(userId, currentPeriod);
      setForecast(res);
    } catch (err) {
      setError(err.message || 'Failed to generate financial forecast');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPeriod]);

  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={fetchForecastData} />;
  }

  if (!forecast) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No forecast data"
        subtitle="Forecast is unavailable for the selected period."
      />
    );
  }

  // Extract fields safely
  const currentBalance = forecast.current_balance ?? forecast.balance ?? 0;
  const predictedBalance = forecast.predicted_balance ?? forecast.projected_balance ?? currentBalance;
  const predictedExpenses = forecast.predicted_expenses ?? forecast.forecast_expenses ?? 0;
  const predictedIncome = forecast.predicted_income ?? forecast.forecast_income ?? 0;
  const balanceDiff = predictedBalance - currentBalance;

  // Chart data
  const chartData =
    forecast.forecast_data ||
    forecast.monthly_forecast ||
    forecast.trend ||
    forecast.history ||
    [];

  // Warnings
  const rawWarnings = forecast.warnings || forecast.alerts || [];
  const warningsList = Array.isArray(rawWarnings)
    ? rawWarnings
    : typeof rawWarnings === 'string'
    ? [rawWarnings]
    : [];

  // Summary
  const summaryText =
    typeof forecast.summary === 'string'
      ? forecast.summary
      : forecast.summary?.text ||
        forecast.summary?.message ||
        forecast.description ||
        'Based on historical trends and recurring velocity, your balance trajectory is being tracked.';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <TrendingUp className="w-7 h-7 text-indigo-400" />
          Financial Forecast & Trajectory
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Predictive modeling for balance, revenue velocity, and cash runway
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="fintech-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Capital
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-3">
            {formatCurrency(currentBalance)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Starting reference</p>
        </div>

        {/* Projected End Balance */}
        <div className="fintech-card p-5 border-indigo-900/40 bg-gradient-to-br from-indigo-950/20 to-[#111726]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Predicted Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 mt-3">
            {formatCurrency(predictedBalance)}
          </div>
          <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${balanceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span>{balanceDiff >= 0 ? '▲' : '▼'}</span>
            <span>{balanceDiff >= 0 ? '+' : ''}{formatCurrency(balanceDiff)} projected change</span>
          </p>
        </div>

        {/* Projected Income */}
        <div className="fintech-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Expected Inflows
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-3">
            +{formatCurrency(predictedIncome)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Anticipated deposits</p>
        </div>

        {/* Projected Outflows */}
        <div className="fintech-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Expected Outflows
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-3">
            -{formatCurrency(predictedExpenses)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Projected burn rate</p>
        </div>
      </div>

      {/* Main Curve Chart */}
      {chartData.length > 0 && (
        <div className="fintech-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Capital Balance Projection Curve
              </h3>
              <p className="text-xs text-slate-400">
                Simulated trajectory based on recurring cash movements
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                Balance
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                Inflows
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
                Expenses
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey={chartData[0]?.month ? 'month' : chartData[0]?.date ? 'date' : 'period'}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [formatCurrency(val), name]}
                  contentStyle={{
                    backgroundColor: '#111726',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Capital Balance"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGradient)"
                />
                {chartData[0]?.income !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Inflows"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}
                {chartData[0]?.expenses !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights & Warnings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Executive Summary */}
        <div className="fintech-card p-6 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Executive Model Summary</span>
          </div>
          <h3 className="text-base font-bold text-white">Algorithm Assessment</h3>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {summaryText}
          </p>
        </div>

        {/* Predictive Risk Warnings */}
        <div className="fintech-card p-6 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Indicators & Warnings</span>
          </div>
          <h3 className="text-base font-bold text-white">Alert Thresholds</h3>

          {warningsList.length > 0 ? (
            <div className="space-y-2.5">
              {warningsList.map((warn, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 flex items-start space-x-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {typeof warn === 'string' ? warn : warn.message || JSON.stringify(warn)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>No critical cash deficits or financial bottlenecks detected.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
