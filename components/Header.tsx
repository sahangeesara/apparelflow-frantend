'use client';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();
  async function logout() { await api('/logout', 'POST'); router.push('/'); router.refresh(); }
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
