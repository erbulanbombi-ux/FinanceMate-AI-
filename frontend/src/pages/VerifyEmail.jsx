import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { verifyEmail } = useApp();
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('');
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));

  useEffect(() => {
    if (token) navigate('/verify-email', { replace: true });
  }, [navigate, token]);

  const handleVerify = async () => {
    setStatus('loading');
    try {
      setMessage(await verifyEmail(token));
      setStatus('success');
    } catch (error) {
      setMessage(error.message || 'This verification link is invalid or expired.');
      setStatus('error');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090d16] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111726] p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
          {status === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-400">
          {message || 'Confirm this address to activate your FinMate account.'}
        </p>
        {status === 'ready' && token && (
          <button onClick={handleVerify} className="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
            Verify email
          </button>
        )}
        {status === 'loading' && <p className="mt-6 text-sm text-slate-400">Verifying…</p>}
        {!token && <p role="alert" className="mt-4 text-sm text-rose-300">Verification token is missing.</p>}
        {status === 'success' && <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200">Continue to sign in</Link>}
        {status === 'error' && <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-indigo-300 hover:text-indigo-200">Back to sign in</Link>}
      </section>
    </main>
  );
}