import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PeriodPicker from './PeriodPicker';
import {
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
  User,
  Activity,
} from 'lucide-react';

const titleMap = {
  '/': 'Dashboard & Financial Overview',
  '/transactions': 'Transactions & Ledger',
  '/budget': 'Budget & Category Limits',
  '/forecast': 'Predictive Cash Flow Forecast',
  '/insights': 'Smart Financial Insights',
  '/simulator': 'Goal Planner & Savings Target',
  '/chat': 'AI Financial Assistant',
};

export default function Header({ onOpenSettings }) {
  const location = useLocation();
  const { currentUser, connectionStatus, demoMode } = useApp();

  const title = titleMap[location.pathname] || 'FinMate';

  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-slate-800/80 bg-[#0d121f]/60 backdrop-blur-md sticky top-0 z-20">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400">Manage, analyze, and forecast your personal capital</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3.5">
        {/* Period Picker */}
        <PeriodPicker />

        {/* User Badge */}
        <div
          onClick={onOpenSettings}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors text-xs text-slate-300"
          title="Account settings"
        >
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>Account: <strong className="text-white">{currentUser?.username}</strong></span>
        </div>

        {/* Live Network Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            demoMode
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : connectionStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : connectionStatus === 'testing'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
          }`}
          title="Click to view API diagnostics"
        >
          {demoMode ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : connectionStatus === 'connected' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{demoMode ? 'Demo Mode' : connectionStatus === 'connected' ? 'API Online' : 'API Offline'}</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Account settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
