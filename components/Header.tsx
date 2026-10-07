'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { showConfirm, showError, showSuccess } from '@/lib/alerts';
import type { User } from '@/lib/types';
import { Scissors, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();

  async function logout() {
    const confirmation = await showConfirm('Are you sure you want to log out?');
    if (!confirmation.isConfirmed) return;

    try {
      await api('/logout', 'POST');
      await showSuccess('You have been logged out.');
      router.push('/');
      router.refresh();
    } catch (error) {
      await showError((error as Error).message);
    }
  }

  const roleLabels: Record<string, string> = {
    cutting_supervisor: 'Cutting Supervisor',
    cutting_verifier: 'Cutting Verifier',
    sewing_supervisor: 'Sewing Supervisor',
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">ApparelFlow</span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-400/30">
                PROD
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">
              Cutting Operations &amp; Gatekeeper Terminal
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs sm:text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">{user.full_name}</span>
                <span className="text-[11px] font-medium text-slate-400">
                  {roleLabels[user.role] ?? user.role}
                </span>
              </div>
            </div>

            {user.role === 'cutting_supervisor' && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              >
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>Admin</span>
              </Link>
            )}

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 transition"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
