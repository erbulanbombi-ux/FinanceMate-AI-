import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { currentUser, login, register, requestPasswordReset, resendVerification } = useApp();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (currentUser) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        setMessage(await register({ username: username.trim(), email: email.trim(), password }));
      } else if (mode === 'forgot') {
        setMessage(await requestPasswordReset(email.trim()));
      } else if (mode === 'resend') {
        setMessage(await resendVerification(email.trim()));
      } else {
        await login({ username: username.trim(), password });
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete the request.');
    } finally {
      setSubmitting(false);
    }
  };

  const isRegistering = mode === 'register';
  const isEmailAction = mode === 'forgot' || mode === 'resend';
  const submitLabel = {
    login: 'Sign in',
    register: 'Create account',
    forgot: 'Send reset link',
    resend: 'Resend verification',
  }[mode];
  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">FinMate AI</p>
          <h1 className="mt-2 text-3xl font-bold">Personal finance, simplified.</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to review your money and plan with confidence.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111726] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => changeMode('login')}
              className={`flex-1 border-b-2 px-3 pb-3 text-sm font-semibold ${mode === 'login' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => changeMode('register')}
              className={`flex-1 border-b-2 px-3 pb-3 text-sm font-semibold ${isRegistering ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isEmailAction ? (
              <div>
                <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-300">Username</label>
                  <input
                    id="username"
                    autoComplete="username"
                    minLength={3}
                    maxLength={64}
                    pattern="[A-Za-z0-9_.-]+"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>
                {isRegistering && (
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      id="password"
                      type="password"
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      minLength={isRegistering ? 12 : 1}
                      maxLength={128}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    />
                  </div>
                  {isRegistering && <p className="mt-1.5 text-xs text-slate-500">Use at least 12 characters.</p>}
                </div>
              </>
            )}

            {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">{error}</p>}
            {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200">{message}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-60"
            >
              <span>{submitting ? 'Please wait…' : submitLabel}</span>
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          {mode === 'login' && (
            <div className="mt-4 flex justify-between gap-3 text-sm">
              <button type="button" onClick={() => changeMode('forgot')} className="text-indigo-300 hover:text-indigo-200">
                Forgot password?
              </button>
              <button type="button" onClick={() => changeMode('resend')} className="text-indigo-300 hover:text-indigo-200">
                Resend verification
              </button>
            </div>
          )}
          {(mode === 'forgot' || mode === 'resend') && (
            <button type="button" onClick={() => changeMode('login')} className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm text-indigo-300 hover:text-indigo-200">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </button>
          )}
        </div>
      </section>
    </main>
  );
}