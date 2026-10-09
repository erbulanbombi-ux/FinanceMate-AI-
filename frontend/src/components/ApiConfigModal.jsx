import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  X,
  User,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function ApiConfigModal({ isOpen, onClose }) {
  const {
    currentUser,
    demoMode,
    toggleDemoMode,
    connectionStatus,
    connectionError,
    testConnection,
  } = useApp();

  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Demo Settings</h3>
              <p className="text-xs text-slate-400">Check the backend or preview sample data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status indicator */}
        <div className="mt-4 p-3.5 rounded-xl border flex items-center justify-between bg-slate-900/60 border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              {connectionStatus === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : connectionStatus === 'testing' ? (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 animate-pulse"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              )}
            </span>
            <div>
              <p className="text-sm font-semibold capitalize">
                Status:{' '}
                {demoMode ? (
                  <span className="text-amber-400">Demo Mock Mode</span>
                ) : connectionStatus === 'connected' ? (
                  <span className="text-emerald-400">Connected to FastAPI</span>
                ) : connectionStatus === 'testing' ? (
                  <span className="text-amber-400">Checking connection...</span>
                ) : (
                  <span className="text-rose-400">Backend Offline</span>
                )}
              </p>
              <p className="text-xs text-slate-400 truncate max-w-xs">Same-origin /api proxy</p>
            </div>
          </div>

          <button
            onClick={handleRunTest}
            disabled={isTesting || demoMode}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Test</span>
          </button>
        </div>

        {/* Error Details if offline */}
        {!demoMode && connectionError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-medium">Connection failed</p>
              <p className="text-rose-400/80 mt-0.5 text-[11px] leading-relaxed">
                Check that FastAPI is running on host <code>0.0.0.0</code> and CORS allows this origin.
              </p>
            </div>
          </div>
        )}

        {/* Account and demo settings */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <User className="w-4 h-4 text-indigo-400" />
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Demo profile <span className="normal-case text-white">{currentUser?.username}</span>
            </label>
          </div>

          {/* Mock Mode Switch */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Demo / Mock Mode</p>
                  <p className="text-xs text-slate-400">
                    Preview UI with sample data when backend Wi-Fi is disconnected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleDemoMode(!demoMode)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  demoMode ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    demoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between space-x-3 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-500">No account required</span>
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <span>Done</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
