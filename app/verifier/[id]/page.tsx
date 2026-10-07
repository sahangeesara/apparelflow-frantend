import VerifierTerminal from '@/components/VerifierTerminal';
import { notFound, requirePage, sfetch } from '@/lib/auth';
import type { Order } from '@/lib/types';
import AuthenticatedShell from '@/components/AuthenticatedShell';

export default async function TerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('cutting_verifier');
  const { id } = await params;
  const res = await sfetch<{ order: Order }>(`/orders/${encodeURIComponent(id)}`);
  if (!res) notFound();
  return <AuthenticatedShell user={user}><VerifierTerminal order={res.order} /></AuthenticatedShell>;
}
