import VerifierTerminal from '@/components/VerifierTerminal';
import { notFound, requirePage, sfetch } from '@/lib/auth';
import type { Order } from '@/lib/types';

export default async function TerminalPage({ params }: { params: { id: string } }) {
  await requirePage('cutting_verifier');
  const res = await sfetch<{ order: Order }>(`/orders/${encodeURIComponent(params.id)}`);
  if (!res) notFound();
  return <VerifierTerminal order={res.order} />;
}
