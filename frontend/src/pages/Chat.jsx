import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SendHorizonal, Sparkles, LoaderCircle, Bot, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendChatMessage } from '../api/chat';
import ErrorAlert from '../components/ErrorAlert';

const starterMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hi! I can review your budget, spending trends, and upcoming affordability decisions. Ask me about a purchase, your balance, or where to save more.',
  },
];

const normalizeReply = (payload) => {
  if (!payload) return 'I could not generate a response right now.';
  if (typeof payload === 'string') return payload;
  if (typeof payload.reply === 'string') return payload.reply;
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.answer === 'string') return payload.answer;
  if (typeof payload.content === 'string') return payload.content;
  if (typeof payload.text === 'string') return payload.text;
  return JSON.stringify(payload);
};

const toolLabels = {
  get_balance: 'balance and monthly summary',
  get_transactions: 'recent transactions',
  get_budget: 'budgets',
  analyze_spending: 'spending by category',
  detect_anomalies: 'spending anomalies',
  forecast_cashflow: 'cash-flow forecast',
  simulate_purchase: 'purchase affordability',
};

export default function Chat() {
  const { userId, currentPeriod } = useApp();
  const [messages, setMessages] = useState(starterMessages);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage({
        user_id: String(userId),
        message: trimmed,
        period: currentPeriod,
      });

      const reply = normalizeReply(response);
      const toolsUsed = Array.isArray(response?.tools_used) ? response.tools_used : [];
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: reply,
          toolsUsed,
        },
      ]);
    } catch (err) {
      setError(err.message || 'The assistant could not answer your question right now.');
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = useMemo(
    () => [
      'Can I afford a new laptop for ₸400,000?',
      'How am I doing on my monthly budget?',
      'What should I focus on this week?',
    ],
    []
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-indigo-400" />
          AI Financial Assistant
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Ask about affordability, spending habits, and the next smart step for your finances.
        </p>
      </div>

      <div className="fintech-card overflow-hidden">
        <div ref={scrollRef} className="h-[560px] overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-950/40">
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-lg ${
                    isUser
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-slate-100'
                      : 'bg-slate-900/80 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {isUser ? <UserRound className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    <span>{isUser ? 'You' : 'FinMate AI'}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {!isUser && message.toolsUsed?.length > 0 && (
                    <p className="mt-3 border-t border-slate-700 pt-2 text-xs text-slate-400">
                      Data checked: {message.toolsUsed.map((tool) => toolLabels[tool] || tool).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-200">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <Bot className="w-3.5 h-3.5" />
                  <span>FinMate AI</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <LoaderCircle className="w-4 h-4 animate-spin text-indigo-400" />
                  Thinking through your finances...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => setDraft(question)}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-indigo-500 hover:text-white"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your budget, savings, or upcoming purchase..."
              className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-2">
          <ErrorAlert message={error} onRetry={() => setError(null)} />
        </div>
      )}
    </div>
  );
}
