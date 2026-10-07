import Link from 'next/link';
import { requirePage, sfetch } from '@/lib/auth';
import type { Order } from '@/lib/types';
import AuthenticatedShell from '@/components/AuthenticatedShell';
import StatusChip from '@/components/StatusChip';

export default async function VerifierPage() {
  const user = await requirePage('cutting_verifier');
  const orders = (await sfetch<{ orders: Order[] }>('/orders'))?.orders ?? [];
  const pendingOrders = orders.filter(order => order.status === 'PENDING_VERIFICATION');
  return (
    <AuthenticatedShell user={user}>
      <section className="card">
        <h2 className="mb-3 text-xl font-bold">Batches Awaiting Verification</h2>
        {pendingOrders.length === 0 ? <p className="text-gray-700">No batches waiting.</p> : (
          <table className="w-full">
            <thead><tr>{['Order', 'Recipe', 'Qty', 'Roll', 'Status', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {pendingOrders.map(o => (
                <tr key={o.id}>
                  <td className="td">{o.order_no}</td><td className="td">{o.recipe_name}</td><td className="td">{o.target_qty}</td><td className="td">{o.fabric_roll_id}</td><td className="td"><StatusChip status={o.status} /></td>
                  <td className="td"><Link className="btn inline-block" href={`/verifier/${o.id}`}>Open QC Terminal</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AuthenticatedShell>
  );
}
