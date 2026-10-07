import Header from './Header';
import type { User } from '@/lib/types';

export default function AuthenticatedShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {children}
      </main>
      <footer className="mt-auto border-t border-slate-200/80 bg-white/60 py-4 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-slate-500 sm:px-6">
          <p>© ApparelFlow Workflow System</p>
          <p className="font-mono text-[11px] text-slate-400">Authenticated as: {user.full_name}</p>
        </div>
      </footer>
    </div>
  );
}
