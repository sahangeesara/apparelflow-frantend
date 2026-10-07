import Link from 'next/link';
import { requirePage, sfetch } from '@/lib/auth';
import type { Order } from '@/lib/types';
import AuthenticatedShell from '@/components/AuthenticatedShell';
import StatusChip from '@/components/StatusChip';
import { ShieldCheck, CheckCircle2, ArrowRight, PackageCheck } from 'lucide-react';

export default async function VerifierPage() {
  const user = await requirePage('cutting_verifier');
  const orders = (await sfetch<{ orders: Order[] }>('/orders'))?.orders ?? [];
  const pendingOrders = orders.filter(order => order.status === 'PENDING_VERIFICATION');

  return (
    <AuthenticatedShell user={user}>
      <section className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Batches Awaiting Verification</h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  {pendingOrders.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Perform physical garment component count inspection before approving batches.</p>
            </div>
          </div>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center bg-slate-50/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">All batches are verified!</p>
            <p className="text-xs text-slate-500 mt-1">There are no pending garment cutting orders waiting for inspection.</p>
          </div>
        ) : (
          <div className="table-container custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {['Order No', 'Recipe Name', 'Target Qty', 'Roll ID', 'Status', 'Actions'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(o => (
                  <tr key={o.id} className="table-row-hover">
                    <td className="td font-mono font-bold text-blue-900">{o.order_no}</td>
                    <td className="td font-medium text-slate-800">{o.recipe_name}</td>
                    <td className="td font-semibold text-slate-700">{o.target_qty}</td>
                    <td className="td font-mono text-xs text-slate-600">{o.fabric_roll_id}</td>
                    <td className="td">
                      <StatusChip status={o.status} />
                    </td>
                    <td className="td">
                      <Link
                        className="btn text-xs py-1.5 px-3 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                        href={`/verifier/${o.id}`}
                      >
                        <span>Open QC Terminal</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AuthenticatedShell>
  );
}
