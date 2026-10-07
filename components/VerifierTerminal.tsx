'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { showError, showSuccess } from '@/lib/alerts';
import type { Flag, Order } from '@/lib/types';
import StatusChip from './StatusChip';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Scale, Scissors, FileText } from 'lucide-react';

const flag = (a: number, e: number): Flag => (a === e ? 'GREEN' : a > e ? 'YELLOW' : 'RED');

export default function VerifierTerminal({ order }: { order: Order }) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<number, string>>(() =>
    Object.fromEntries(order.components.map(c => [c.component_id, c.actual_qty?.toString() ?? ''])),
  );
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState('');
  const [msg, setMsg] = useState('');
  const wastage = ((order.actual_fabric_yds - order.expected_fabric) / order.expected_fabric) * 100;

  const rows = useMemo(() => {
    return order.components.map(c => {
      const v = (counts[c.component_id] ?? '').trim();
      const valid = /^\d+$/.test(v);
      return { c, v, valid, status: valid ? flag(+v, c.expected_qty) : null };
    });
  }, [counts, order]);

  const canApprove = rows.every(r => r.status === 'GREEN' || r.status === 'YELLOW');

  async function approve() {
    setMsg('');
    try {
      await api(`/orders/${order.id}/counts`, 'POST', {
        counts: Object.fromEntries(rows.filter(r => r.valid).map(r => [r.c.component_id, +r.v])),
      });
      await api(`/orders/${order.id}/approve`, 'POST');
      await showSuccess('Batch approved successfully.');
      router.push('/verifier');
      router.refresh();
    } catch (e) {
      const message = (e as ApiError).message + ((e as ApiError).status === 422 ? ' (server hard stop)' : '');
      setMsg(message);
      await showError(message);
    }
  }

  async function reject() {
    if (note.trim().length < 5) {
      const message = 'A reason of at least 5 characters is mandatory';
      setNoteErr(message);
      await showError(message);
      return;
    }
    try {
      await api(`/orders/${order.id}/reject`, 'POST', { note });
      await showSuccess('Batch rejected and returned to the supervisor.');
      router.push('/verifier');
      router.refresh();
    } catch (e) {
      const message = (e as Error).message;
      setMsg(message);
      await showError(message);
    }
  }

  return (
    <section className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/verifier"
          className="btn btn-ghost inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Queue</span>
        </Link>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          QC Verification Terminal
        </span>
      </div>

      {/* Main Details Banner Card */}
      <div className="card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-black tracking-tight text-white">{order.order_no}</h2>
            </div>
            <p className="text-sm font-medium text-slate-300">
              {order.recipe_name} · Target Batch Qty: <span className="font-bold text-white">{order.target_qty} units</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 text-xs">
              <span className="text-slate-400">Roll ID:</span> <span className="font-mono font-bold text-slate-200">{order.fabric_roll_id}</span>
            </div>
            <div className="rounded-lg bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 text-xs">
              <span className="text-slate-400">Supervisor:</span> <span className="font-semibold text-slate-200">{order.created_by_name}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3 border-t border-slate-700/60 pt-4 text-xs">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
            <Scissors className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Fabric Used</p>
              <p className="text-base font-bold text-slate-100">{order.actual_fabric_yds} yds <span className="text-xs font-normal text-slate-400">(std: {order.expected_fabric} yds)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
            <Scale className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Wastage Cap</p>
              <p className="text-base font-bold text-slate-100">{order.wastage_cap}% max</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 rounded-lg p-3 ${wastage > order.wastage_cap ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
            <AlertTriangle className={`h-5 w-5 shrink-0 ${wastage > order.wastage_cap ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div>
              <p className="text-slate-300 font-medium">Calculated Wastage</p>
              <p className={`text-base font-bold ${wastage > order.wastage_cap ? 'text-amber-300' : 'text-emerald-300'}`}>
                {wastage.toFixed(2)}% {wastage > order.wastage_cap && '⚠️ Exceeds Cap'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Component Counts Verification Table with Scroll */}
      <div className="card">
        <h3 className="mb-3 text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Component Quality Inspection</span>
        </h3>

        <div className="table-container custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr>
                {['Component Name', 'Expected Qty', 'Actual Count Input', 'Status Result'].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, v, valid, status }) => (
                <tr key={c.component_id} className="table-row-hover">
                  <td className="td font-semibold text-slate-800">{c.component_name}</td>
                  <td className="td font-mono font-bold text-slate-600">{c.expected_qty} pcs</td>
                  <td className="td">
                    <input
                      aria-label={`Actual ${c.component_name}`}
                      inputMode="numeric"
                      className={`field max-w-[9rem] font-mono font-bold ${v !== '' && !valid ? 'field-bad' : ''}`}
                      value={counts[c.component_id] ?? ''}
                      onChange={e => setCounts({ ...counts, [c.component_id]: e.target.value })}
                    />
                  </td>
                  <td className="td">
                    {v !== '' && !valid ? (
                      <span className="font-semibold text-rose-600 text-xs">Whole numbers only</span>
                    ) : (
                      <StatusChip status={status} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            {canApprove ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> All components verified within limits.
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Correct red flag counts to allow approval.
              </span>
            )}
          </div>
          <button className="btn btn-ok" disabled={!canApprove} onClick={approve}>
            <CheckCircle2 className="h-4.5 w-4.5" />
            <span>Approve Batch</span>
          </button>
        </div>

        {msg && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">{msg}</p>}
      </div>

      {/* Reject Batch Section */}
      <div className="card border-rose-200 bg-rose-50/30">
        <h3 className="mb-2 text-lg font-bold text-rose-900 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-rose-600" />
          <span>Reject Batch</span>
        </h3>
        <p className="text-xs text-slate-600 mb-3">If defects or shortages cannot be accepted, provide detailed notes for the supervisor.</p>
        
        <div className="space-y-3">
          <textarea
            id="note"
            rows={3}
            placeholder="Describe the defect, shortage, or reason for rejection…"
            className={`field ${noteErr ? 'field-bad' : ''}`}
            value={note}
            onChange={e => {
              setNote(e.target.value);
              setNoteErr('');
            }}
          />
          {noteErr && <span role="alert" className="block text-xs font-semibold text-rose-600">{noteErr}</span>}
          
          <button className="btn btn-danger" onClick={reject}>
            <XCircle className="h-4 w-4" />
            <span>Reject Batch</span>
          </button>
        </div>
      </div>
    </section>
  );
}
