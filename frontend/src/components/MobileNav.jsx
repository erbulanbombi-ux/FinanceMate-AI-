import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { navItems } from './Sidebar';
import {
  Menu,
  X,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
  User,
} from 'lucide-react';

export default function MobileNav({ onOpenSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, connectionStatus, demoMode, apiUrl } = useApp();

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="lg:hidden h-14 bg-[#0d121f]/95 border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-sm">F</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-white">FinMate</span>
          {demoMode && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
              Demo
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg active:bg-slate-800"
            aria-label="Toggle navigation drawer"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0d121f] border-r border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">F</span>
            </div>
            <span className="font-bold text-sm text-white">FinMate Navigation</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          <div
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer"
          >
            <div className="flex items-center space-x-2 truncate">
              {demoMode ? (
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : connectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span className="truncate font-mono">{demoMode ? 'Demo Mode' : apiUrl}</span>
            </div>
            <Settings className="w-4 h-4 text-slate-500" />
          </div>

          <div className="flex items-center space-x-2 px-1 text-xs text-slate-400">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Signed in as <strong className="text-white">{currentUser?.username}</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Navigation Bar for quick mobile access */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d121f]/95 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around backdrop-blur-md safe-area-bottom">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-[50px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
