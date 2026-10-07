'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HOME, type User } from '@/lib/types';
import { showError, showSuccess } from '@/lib/alerts';
import Field from './Field';
import { Scissors, LogIn, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginForm({ onSignup }: { onSignup: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(e: string, p: string) {
    setError('');
    setLoading(true);
    try {
      const { user } = await api<{ user: User }>('/login', 'POST', { email: e, password: p });
      await showSuccess(`Welcome back, ${user.full_name}.`);
      router.replace(HOME[user.role]);
      router.refresh();
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      await showError(message);
    } finally {
      setLoading(false);
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    signIn(email.trim(), password);
  };

  return (
    <div className="auth-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
          <Scissors className="h-5 w-5" />
        </div>
        <span className="auth-eyebrow font-black">ApparelFlow</span>
      </div>

      <h2 className="mb-1 text-2xl font-black tracking-tight text-slate-900">Welcome Back</h2>
      <p className="auth-subtitle">Sign in to manage your cutting and sewing workflow.</p>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email Address" id="email">
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="supervisor@apparelflow.com"
              className="field pl-9"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </Field>

        <Field label="Password" id="pw" error={error}>
          <div className="relative">
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="field pl-9"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </Field>

        <button className="auth-submit flex items-center justify-center gap-2" disabled={loading}>
          <LogIn className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Signing in…' : 'Sign In'}</span>
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200/80 pt-4 text-center">
        <p className="text-xs text-slate-500 mb-2">Don't have an account yet?</p>
        <button type="button" className="auth-switch flex items-center justify-center gap-2" onClick={onSignup}>
          <span>Create an Account</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
