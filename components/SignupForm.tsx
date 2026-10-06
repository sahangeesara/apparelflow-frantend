'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HOME, type Role, type User } from '@/lib/types';
import Field from './Field';

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
      router.push(HOME[user.role]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="auth-eyebrow">ApparelFlow</p>
      <h2 className="mb-2 text-2xl font-bold">Create your account</h2>
      <p className="auth-subtitle">Choose your role and start managing production with your team.</p>
      <form onSubmit={submit}>
        <Field label="Full name" id="signup-name">
          <input id="signup-name" required minLength={2} autoComplete="name" className="field" value={fullName} onChange={e => setFullName(e.target.value)} />
        </Field>
        <Field label="Email" id="signup-email">
          <input id="signup-email" required type="email" autoComplete="email" className="field" value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" id="signup-password" error={error}>
          <input id="signup-password" required minLength={8} type="password" autoComplete="new-password" className="field" value={password} onChange={e => setPassword(e.target.value)} />
        </Field>
        <Field label="Role" id="signup-role">
          <select id="signup-role" className="field" value={role} onChange={e => setRole(e.target.value as Role)}>
            {ROLES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <button className="auth-submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
      </form>
      <button type="button" className="auth-switch" onClick={onLogin}>
        Sign in
      </button>
    </div>
  );
}
