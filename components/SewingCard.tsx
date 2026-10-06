'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, fmtDate } from '@/lib/api';
import { showError, showSuccess } from '@/lib/alerts';
import type { Order } from '@/lib/types';
import StatusChip from './StatusChip';

export default function SewingCard({ order: o }: { order: Order }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const l = o.last_log;
  async function start() {
    try {
      await api(`/sewing/${o.id}/start`, 'POST');
      await showSuccess('Sewing assembly started.');
      router.refresh();
    } catch (e) {
      const message = (e as Error).message;
      setMsg(message);
      await showError(message);
    }
  }
  return (
    <article className="card">
      <h3 className="mb-1 flex flex-wrap items-center gap-2 text-xl font-bold">{o.order_no} · {o.recipe_name} × {o.target_qty} <StatusChip status="VERIFIED" /></h3>
      {l && <p className="mb-2 text-gray-700">Verified by <b>{l.verifier_name}</b> on {fmtDate(l.timestamp)} · Fabric wastage <b>{l.wastage_pct}%</b> (cap {o.wastage_cap}%)</p>}
      <table className="mb-3 w-full">
        <thead><tr>{['Component', 'Expected', 'Actual', 'Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{o.components.map(c => <tr key={c.component_id}><td className="td">{c.component_name}</td><td className="td">{c.expected_qty}</td><td className="td">{c.actual_qty}</td><td className="td"><StatusChip status={c.status} /></td></tr>)}</tbody>
      </table>
      {o.sewing_started_at ? <p><b>Sewing started</b> {fmtDate(o.sewing_started_at)}</p> : <button className="btn" onClick={start}>Start Sewing Assembly</button>}
      {msg && <p role="alert" className="mt-2 font-semibold text-red-700">{msg}</p>}
    </article>
  );
}
