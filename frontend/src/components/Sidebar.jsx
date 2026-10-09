import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Lightbulb,
  ShoppingCart,
  MessageSquare,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/budget', label: 'Budget', icon: PieChart },
  { path: '/forecast', label: 'Forecast', icon: TrendingUp },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/simulator', label: 'Simulator', icon: ShoppingCart },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
];

export default function Sidebar({ onOpenSettings }) {
  const { currentUser, connectionStatus, demoMode, apiUrl } = useApp();
  const username = currentUser?.username || 'Account';

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0d121f] border-r border-slate-800/80 min-h-screen fixed top-0 left-0 z-30 select-none">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="text-white font-extrabold text-lg tracking-wider">F</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              FinMate
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Financial Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'text-indigo-400 scale-105' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Profile & Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
        {/* Connection status indicator */}
        <div
          onClick={onOpenSettings}
          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
          title="Backend connection status"
        >
          <div className="flex items-center space-x-2 truncate">
            {demoMode ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            ) : connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs text-slate-300 font-mono truncate">
              {demoMode ? 'Demo Mode' : apiUrl.replace(/^https?:\/\//, '')}
            </span>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 flex-shrink-0 ml-1" />
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
              {username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="max-w-32 truncate text-xs font-semibold text-slate-200">{username}</p>
              <p className="text-[10px] text-slate-500">Demo profile</p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"
            title="Account Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
