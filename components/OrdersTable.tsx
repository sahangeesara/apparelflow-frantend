'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import StatusChip from './StatusChip';

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  async function resubmit(id: number) {
    try { await api(`/orders/${id}/resubmit`, 'POST'); router.refresh(); } catch (e) { setMsg((e as Error).message); }
  }
  return (
    <section className="card">
      <h2 className="mb-3 text-xl font-bold">Cutting Orders</h2>
      {msg && <p role="alert" className="font-semibold text-red-700">{msg}</p>}
      {orders.length === 0 ? <p className="text-gray-700">No orders yet.</p> : (
        <table className="w-full">
          <thead><tr>{['Order', 'Recipe', 'Qty', 'Roll', 'Fabric (yds)', 'Status', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td className="td">{o.order_no}</td><td className="td">{o.recipe_name}</td><td className="td">{o.target_qty}</td><td className="td">{o.fabric_roll_id}</td><td className="td">{o.actual_fabric_yds}</td>
                <td className="td"><StatusChip status={o.status} /></td>
                <td className="td">
                  {o.status === 'REJECTED' && (
                    <>
                      <p className="mb-2 border-l-4 border-red-700 bg-red-50 p-2"><b>Rejected:</b> {o.last_log?.rejection_note}</p>
                      <button className="btn" onClick={() => resubmit(o.id)}>Re-cut &amp; Resubmit</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
