'use client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/alerts';
import type { User } from '@/lib/types';

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();
  async function logout() {
    try {
      await api('/logout', 'POST');
      await showSuccess('You have been logged out.');
      router.push('/');
      router.refresh();
    } catch (error) {
      await showError((error as Error).message);
    }
  }
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 bg-blue-900 px-5 py-3 text-white">
      <h1 className="text-lg font-bold">ApparelFlow <span className="text-sm font-normal opacity-90">Cutting Operations &amp; Gatekeeper Terminal</span></h1>
      {user && (
        <div className="text-sm">{user.full_name} · <b>{user.role}</b>
          <button onClick={logout} className="ml-3 rounded bg-white px-3 py-1 font-semibold text-blue-900">Log out</button>
        </div>
      )}
    </header>
  );
}
