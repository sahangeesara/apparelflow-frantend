'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, fmtDate } from '@/lib/api';
import { showError, showSuccess } from '@/lib/alerts';
import type { Order } from '@/lib/types';
import StatusChip from './StatusChip';
import { Play, CheckCircle2, Scissors, Clock, AlertCircle } from 'lucide-react';

export default function SewingCard({ order: o }: { order: Order }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [starting, setStarting] = useState(false);
  const l = o.last_log;

  async function start() {
    setStarting(true);
    try {
      await api(`/sewing/${o.id}/start`, 'POST');
      await showSuccess('Sewing assembly started.');
      router.refresh();
    } catch (e) {
      const message = (e as Error).message;
      setMsg(message);
      await showError(message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <article className="card mb-4 border-slate-200 hover:border-blue-300">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Scissors className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{o.order_no}</span>
              <span className="text-sm font-normal text-slate-500">· {o.recipe_name} × {o.target_qty} pcs</span>
            </h3>
          </div>
        </div>
        <StatusChip status="VERIFIED" />
      </div>

      {l && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Verified by <b className="text-slate-900">{l.verifier_name}</b> on {fmtDate(l.timestamp)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium ml-auto">
            <span>Fabric Wastage:</span>
            <span className="font-bold text-slate-900">{l.wastage_pct}%</span>
            <span className="text-slate-400">(cap {o.wastage_cap}%)</span>
          </div>
        </div>
      )}

      <div className="table-container custom-scrollbar mb-4">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['Component', 'Expected Qty', 'Actual Qty', 'Status'].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {o.components.map(c => (
              <tr key={c.component_id} className="table-row-hover">
                <td className="td font-medium text-slate-800">{c.component_name}</td>
                <td className="td font-mono">{c.expected_qty}</td>
                <td className="td font-mono font-bold text-slate-900">{c.actual_qty}</td>
                <td className="td"><StatusChip status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-1">
        {o.sewing_started_at ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
            <Clock className="h-4 w-4" />
            <span>Sewing assembly started on {fmtDate(o.sewing_started_at)}</span>
          </div>
        ) : (
          <button className="btn" disabled={starting} onClick={start}>
            <Play className={`h-4 w-4 ${starting ? 'animate-spin' : ''}`} />
            <span>{starting ? 'Starting…' : 'Start Sewing Assembly'}</span>
          </button>
        )}
      </div>

      {msg && (
        <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
    </article>
  );
}
