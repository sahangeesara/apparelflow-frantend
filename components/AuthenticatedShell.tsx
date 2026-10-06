import Header from './Header';
import type { User } from '@/lib/types';

export default function AuthenticatedShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 p-5">{children}</main>
    </>
  );
}
