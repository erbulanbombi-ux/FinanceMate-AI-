import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));

  useEffect(() => {
    if (token) navigate('/reset-password', { replace: true });
  }, [navigate, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('Reset token is missing. Request a new password reset link.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      setMessage(await resetPassword(token, password));
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || 'This reset link is invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090d16] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111726] p-7 shadow-2xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
          {complete ? <CheckCircle2 className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
        </div>
        <h1 className="text-2xl font-bold">Set a new password</h1>
        {complete ? (
          <>
            <p role="status" className="mt-3 text-sm text-emerald-200">{message}</p>
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200">Continue to sign in</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-slate-300">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
              <p className="mt-1.5 text-xs text-slate-500">Use at least 12 characters.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-300">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>
            {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
              {submitting ? 'Changing password…' : 'Change password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}