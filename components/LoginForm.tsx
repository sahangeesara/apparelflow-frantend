'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HOME, type User } from '@/lib/types';
import { showError, showSuccess } from '@/lib/alerts';
import Field from './Field';

export default function LoginForm({ onSignup }: { onSignup: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState('');
  async function signIn(e: string, p: string) {
    setError('');
    try {
      const { user } = await api<{ user: User }>('/login', 'POST', { email: e, password: p });
      await showSuccess(`Welcome back, ${user.full_name}.`);
      router.replace(HOME[user.role]);
      router.refresh();
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      await showError(message);
    }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); signIn(email.trim(), password); };
  return (
    <div className="auth-card">
      <p className="auth-eyebrow">ApparelFlow</p>
      <h2 className="mb-2 text-2xl font-bold">Welcome back</h2>
      <p className="auth-subtitle">Sign in to manage your cutting and sewing workflow.</p>
      <form onSubmit={submit}>
        <Field label="Email" id="email"><input id="email" type="email" autoComplete="username" className="field" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password" id="pw" error={error}><input id="pw" type="password" autoComplete="current-password" className="field" value={password} onChange={e => setPassword(e.target.value)} /></Field>
        <button className="auth-submit">Sign in</button>
      </form>
      <button type="button" className="auth-switch" onClick={onSignup}>
        Sign up
      </button>
    </div>
  );
}
