import React from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, Settings, Sparkles, WifiOff } from 'lucide-react';

export default function ErrorAlert({ message, onRetry, onOpenConfig }) {
  const { apiUrl, toggleDemoMode } = useApp();
  const missingProvider = message?.match(/^([A-Z]+) API key is not configured\.$/);
  const billingIssue = message?.includes('Gemini API credits are depleted');
  const heading = billingIssue
    ? 'Gemini billing needs attention'
    : missingProvider
      ? `${missingProvider[1]} API key is missing`
      : 'Unable to connect to FinMate API';
  const guidance = billingIssue
    ? 'Add credits or enable billing in Google AI Studio, then retry.'
    : missingProvider
      ? `Add ${missingProvider[1]}_API_KEY to backend/.env and restart FastAPI.`
      : `Ensure FastAPI is running (uvicorn main:app --host 0.0.0.0 --port 8000) and firewall allows incoming connections.`;

  return (
    <div className="fintech-card p-6 my-6 border-rose-800/60 bg-rose-950/20 shadow-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 flex-shrink-0 mt-0.5 sm:mt-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              {heading}
            </h4>
            <p className="text-sm text-rose-300/80 mt-1 leading-relaxed max-w-xl">
              {message || `Could not establish connection to ${apiUrl}.`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {guidance}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          {onOpenConfig && (
            <button
              onClick={onOpenConfig}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure URL</span>
            </button>
          )}

          <button
            onClick={() => toggleDemoMode(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Demo Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
