import SewingCard from '@/components/SewingCard';
import { requirePage, sfetch } from '@/lib/auth';
import type { Order } from '@/lib/types';
import AuthenticatedShell from '@/components/AuthenticatedShell';
import { Scissors, CheckCircle } from 'lucide-react';

export default async function SewingPage() {
  const user = await requirePage('sewing_supervisor');
  const orders = (await sfetch<{ orders: Order[] }>('/sewing/queue'))?.orders ?? [];

  return (
    <AuthenticatedShell user={user}>
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Sewing Assembly Queue</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {orders.length} Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">Only verified batches ready for production line assembly appear here.</p>
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center bg-slate-50/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <CheckCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">No verified batches yet</p>
          <p className="text-xs text-slate-500 mt-1">Once cutting verifiers approve batches, they will appear in your queue.</p>
        </div>
      ) : (
        orders.map(o => <SewingCard key={o.id} order={o} />)
      )}
    </AuthenticatedShell>
  );
}
