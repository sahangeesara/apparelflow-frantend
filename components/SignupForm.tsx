'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HOME, type Role, type User } from '@/lib/types';
import { showError } from '@/lib/alerts';
import Field from './Field';
import { Scissors, UserPlus, User as UserIcon, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';

const ROLES: { value: Role; label: string }[] = [
  { value: 'cutting_supervisor', label: 'Cutting Supervisor' },
  { value: 'cutting_verifier', label: 'Cutting Verifier' },
  { value: 'sewing_supervisor', label: 'Sewing Supervisor' },
];

export default function SignupForm({ onLogin }: { onLogin: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('cutting_supervisor');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/signup', 'POST', { email: email.trim(), password, full_name: fullName.trim(), role });
      const { user } = await api<{ user: User }>('/login', 'POST', { email: email.trim(), password });
      router.replace(HOME[user.role]);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create account';
      setError(message);
      await showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
          <Scissors className="h-5 w-5" />
        </div>
        <span className="auth-eyebrow font-black">ApparelFlow</span>
      </div>

      <h2 className="mb-1 text-2xl font-black tracking-tight text-slate-900">Create Account</h2>
      <p className="auth-subtitle">Choose your role and start managing production with your team.</p>

      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Full Name" id="signup-name">
          <div className="relative">
            <input
              id="signup-name"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Sahan Geesara"
              className="field pl-9"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </Field>

        <Field label="Email Address" id="signup-email">
          <div className="relative">
            <input
              id="signup-email"
              required
              type="email"
              autoComplete="email"
              placeholder="sahan@apparelflow.com"
              className="field pl-9"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </Field>

        <Field label="Password" id="signup-password" error={error}>
          <div className="relative">
            <input
              id="signup-password"
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="field pl-9"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </Field>

        <Field label="System Role" id="signup-role">
          <div className="relative">
            <select
              id="signup-role"
              className="field pl-9"
              value={role}
              onChange={e => setRole(e.target.value as Role)}
            >
              {ROLES.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        <button className="auth-submit flex items-center justify-center gap-2" disabled={submitting}>
          <UserPlus className={`h-4 w-4 ${submitting ? 'animate-spin' : ''}`} />
          <span>{submitting ? 'Creating account…' : 'Create Account'}</span>
        </button>
      </form>

      <div className="mt-5 border-t border-slate-200/80 pt-4 text-center">
        <button type="button" className="auth-switch flex items-center justify-center gap-2" onClick={onLogin}>
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </button>
      </div>
    </div>
  );
}
