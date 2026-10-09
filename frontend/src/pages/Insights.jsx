import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getInsights } from '../api/insights';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Target,
} from 'lucide-react';

export default function Insights() {
  const { userId, currentPeriod } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchInsightsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInsights(userId, currentPeriod);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch financial insights');
    } finally {
      setLoading(false);
    }
  }, [userId, currentPeriod]);

  useEffect(() => {
    fetchInsightsList();
  }, [fetchInsightsList]);

  // Normalize insights array
  const rawList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.insights)) return data.insights;
    if (Array.isArray(data.items)) return data.items;
    if (typeof data.message === 'string') {
      return [{ title: 'Financial Overview', message: data.message, type: 'info' }];
    }
    return [];
  }, [data]);

  // Filter list
  const filteredInsights = useMemo(() => {
    if (activeFilter === 'ALL') return rawList;
    return rawList.filter((item) => {
      const type = (item.type || item.severity || '').toLowerCase();
      if (activeFilter === 'warning') return type.includes('warn') || type.includes('danger') || type.includes('risk');
      if (activeFilter === 'success') return type.includes('success') || type.includes('good') || type.includes('positive');
      if (activeFilter === 'info') return type.includes('info') || type.includes('tip');
      return true;
    });
  }, [rawList, activeFilter]);

  // Card icon & color styling helper
  const getStyleForInsight = (item) => {
    const type = (item.type || item.severity || item.level || 'info').toLowerCase();
    const title = (item.title || '').toLowerCase();

    if (type.includes('danger') || type.includes('exceed') || title.includes('exceeded')) {
      return {
        icon: ShieldAlert,
        colorClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10',
        borderClass: 'border-rose-900/40 hover:border-rose-600/60',
        badge: 'Warning',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    }
    if (type.includes('warn') || title.includes('increase')) {
      return {
        icon: AlertTriangle,
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-900/40 hover:border-amber-600/60',
        badge: 'Caution',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    if (type.includes('success') || title.includes('good') || title.includes('decreased')) {
      return {
        icon: Target,
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-900/40 hover:border-emerald-600/60',
        badge: 'Achievement',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    return {
      icon: Lightbulb,
      colorClass: 'text-indigo-400',
      bgClass: 'bg-indigo-500/10',
      borderClass: 'border-indigo-900/40 hover:border-indigo-600/60',
      badge: 'Tip',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-indigo-400" />
            Smart Financial Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data-driven observations and suggestions generated from your ledger
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({rawList.length})
          </button>
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFilter === 'warning'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveFilter('success')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFilter === 'success'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Positive
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSkeleton type="cards" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchInsightsList} />
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights available"
          subtitle="Record more transactions to enable automated pattern detection."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInsights.map((item, idx) => {
            const style = getStyleForInsight(item);
            const Icon = style.icon;
            const title = item.title || item.heading || 'Financial Observation';
            const message = item.message || item.description || item.text || JSON.stringify(item);
            const recommendation = item.recommendation || item.action || item.suggestion;

            return (
              <div
                key={item.id || idx}
                className={`fintech-card p-6 flex flex-col justify-between space-y-4 border transition-all ${style.borderClass}`}
              >
                <div className="space-y-3">
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl ${style.bgClass} ${style.colorClass} flex items-center justify-center border border-current/20`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${style.badgeClass}`}
                    >
                      {style.badge}
                    </span>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">{message}</p>
                  </div>
                </div>

                {/* Recommendation Footer if available */}
                {recommendation && (
                  <div className="pt-3 border-t border-slate-800/80 bg-slate-900/40 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <p className="text-xs text-indigo-300 flex items-start space-x-2">
                      <span className="font-bold flex-shrink-0">Recommendation:</span>
                      <span className="text-slate-300">{recommendation}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
