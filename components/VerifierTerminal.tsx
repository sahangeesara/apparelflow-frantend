'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Flag, Order } from '@/lib/types';
import StatusChip from './StatusChip';

const flag = (a: number, e: number): Flag => (a === e ? 'GREEN' : a > e ? 'YELLOW' : 'RED');

export default function VerifierTerminal({ order }: { order: Order }) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<number, string>>(() => Object.fromEntries(order.components.map(c => [c.component_id, c.actual_qty?.toString() ?? ''])));
  const [note, setNote] = useState(''), [noteErr, setNoteErr] = useState(''), [msg, setMsg] = useState('');
  const wastage = ((order.actual_fabric_yds - order.expected_fabric) / order.expected_fabric) * 100;

  const rows = useMemo(() => order.components.map(c => {
    const v = (counts[c.component_id] ?? '').trim(), valid = /^\d+$/.test(v);
    return { c, v, valid, status: valid ? flag(+v, c.expected_qty) : null };
  }), [counts, order]);
  // UI convenience only; the server re-checks every count before approving.
  const canApprove = rows.every(r => r.status === 'GREEN' || r.status === 'YELLOW');

  async function approve() {
    setMsg('');
    try {
      await api(`/orders/${order.id}/counts`, 'POST', { counts: Object.fromEntries(rows.filter(r => r.valid).map(r => [r.c.component_id, +r.v])) });
      await api(`/orders/${order.id}/approve`, 'POST');
      router.push('/verifier'); router.refresh();
    } catch (e) { setMsg((e as ApiError).message + ((e as ApiError).status === 422 ? ' (server hard stop)' : '')); }
  }
  async function reject() {
    if (note.trim().length < 5) { setNoteErr('A reason of at least 5 characters is mandatory'); return; }
    try { await api(`/orders/${order.id}/reject`, 'POST', { note }); router.push('/verifier'); router.refresh(); }
    catch (e) { setMsg((e as Error).message); }
  }
  return (
    <section className="card">
      <Link href="/verifier" className="btn btn-ghost inline-block">← Back</Link>
      <h2 className="mt-3 text-xl font-bold">{order.order_no} · {order.recipe_name} × {order.target_qty}</h2>
      <p className="text-gray-700">Roll {order.fabric_roll_id} · Supervisor {order.created_by_name} · Fabric used {order.actual_fabric_yds} yds vs expected {order.expected_fabric} yds</p>
      <p className={`my-3 p-2 ${wastage > order.wastage_cap ? 'border-l-4 border-amber-700 bg-amber-50' : ''}`}>
        Fabric wastage: <b>{wastage.toFixed(2)}%</b> (cap {order.wastage_cap}%){wastage > order.wastage_cap && ' – exceeds cap, mention it in your notes'}
      </p>
      <table className="w-full">
        <thead><tr>{['Component', 'Expected', 'Actual count', 'Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(({ c, v, valid, status }) => (
            <tr key={c.component_id}>
              <td className="td">{c.component_name}</td><td className="td">{c.expected_qty}</td>
              <td className="td"><input aria-label={`Actual ${c.component_name}`} inputMode="numeric" className={`field max-w-[8rem] ${v !== '' && !valid ? 'field-bad' : ''}`} value={counts[c.component_id] ?? ''} onChange={e => setCounts({ ...counts, [c.component_id]: e.target.value })} /></td>
              <td className="td">{v !== '' && !valid ? <span className="font-semibold text-red-700">Whole numbers only</span> : <StatusChip status={status} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4"><button className="btn btn-ok" disabled={!canApprove} onClick={approve}>Approve Batch</button></div>
      {msg && <p role="alert" className="mt-2 font-semibold text-red-700">{msg}</p>}
      <h3 className="mb-1 mt-6 text-lg font-bold">Reject Batch</h3>
      <label htmlFor="note" className="mb-1 block font-semibold">Mandatory rejection reason</label>
      <textarea id="note" rows={3} placeholder="Describe the defect or shortage" className={`field ${noteErr ? 'field-bad' : ''}`} value={note} onChange={e => { setNote(e.target.value); setNoteErr(''); }} />
      <span role="alert" className="block min-h-[1.25rem] text-sm font-semibold text-red-700">{noteErr}</span>
      <button className="btn btn-danger" onClick={reject}>Reject Batch</button>
    </section>
  );
}
