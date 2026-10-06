import SewingCard from '@/components/SewingCard';
import { requirePage, sfetch } from '@/lib/auth';
import type { Order } from '@/lib/types';

export default async function SewingPage() {
  await requirePage('sewing_supervisor');
  const orders = (await sfetch<{ orders: Order[] }>('/sewing/queue'))?.orders ?? [];
  return (
    <>
      <h2 className="mb-3 text-xl font-bold">Sewing Queue (verified batches only)</h2>
      {orders.length === 0 ? <div className="card text-gray-700">No verified batches yet.</div> : orders.map(o => <SewingCard key={o.id} order={o} />)}
    </>
  );
}
