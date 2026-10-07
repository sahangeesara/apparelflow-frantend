'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/lib/alerts';
import type { Order } from '@/lib/types';
import StatusChip from './StatusChip';
import { Layers, RefreshCw, AlertCircle, PackageCheck } from 'lucide-react';

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [resubmittingId, setResubmittingId] = useState<number | null>(null);

  async function resubmit(id: number) {
    setResubmittingId(id);
    try {
      await api(`/orders/${id}/resubmit`, 'POST');
      await showSuccess('Order resubmitted for verification.');
      router.refresh();
    } catch (e) {
      const message = (e as Error).message;
      setMsg(message);
      await showError(message);
    } finally {
      setResubmittingId(null);
    }
  }

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Cutting Orders Queue</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                {orders.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">Manage and track live cutting orders and verification status.</p>
          </div>
        </div>
      </div>

      {msg && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center bg-slate-50/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <PackageCheck className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No cutting orders found</p>
          <p className="text-xs text-slate-500 mt-1">Submit a new cutting order above to begin tracking.</p>
        </div>
      ) : (
        <div className="table-container custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr>
                {['Order No', 'Recipe Name', 'Target Qty', 'Roll ID', 'Fabric (Yards)', 'Status', 'Actions & Notes'].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="table-row-hover transition-colors">
                  <td className="td font-mono font-bold text-blue-900">{o.order_no}</td>
                  <td className="td font-medium text-slate-800">{o.recipe_name}</td>
                  <td className="td font-semibold text-slate-700">{o.target_qty}</td>
                  <td className="td font-mono text-xs text-slate-600">{o.fabric_roll_id}</td>
                  <td className="td font-semibold text-slate-700">{o.actual_fabric_yds} yds</td>
                  <td className="td">
                    <StatusChip status={o.status} />
                  </td>
                  <td className="td max-w-xs">
                    {o.status === 'REJECTED' && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 p-2 text-xs text-rose-800">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                          <div>
                            <span className="font-bold">Rejected:</span> {o.last_log?.rejection_note || 'Quality check failed'}
                          </div>
                        </div>
                        <button
                          className="btn text-xs py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white"
                          disabled={resubmittingId === o.id}
                          onClick={() => resubmit(o.id)}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${resubmittingId === o.id ? 'animate-spin' : ''}`} />
                          <span>{resubmittingId === o.id ? 'Resubmitting…' : 'Re-cut & Resubmit'}</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
