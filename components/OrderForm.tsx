'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Recipe } from '@/lib/types';
import Field from './Field';

export default function OrderForm({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? 0);
  const [qty, setQty] = useState(''), [roll, setRoll] = useState(''), [yds, setYds] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({}), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const recipe = recipes.find(r => r.id === recipeId);
  const qtyOk = /^[1-9]\d*$/.test(qty.trim());
  const cls = (k: string) => `field ${errs[k] ? 'field-bad' : ''}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (!qtyOk) f.target_qty = 'Whole number greater than 0 only (no decimals, negatives or text)';
    if (!/^\d+(\.\d+)?$/.test(yds.trim()) || +yds <= 0) f.actual_fabric_yds = 'Enter a positive number';
    if (!/^[A-Za-z0-9-]{3,40}$/.test(roll.trim())) f.fabric_roll_id = 'Required: letters, digits, dashes (e.g. FAB-ROLL-882)';
    setErrs(f); setMsg('');
    if (Object.keys(f).length) return;
    setBusy(true);
    try {
      await api('/orders', 'POST', { recipe_id: recipeId, target_qty: +qty, fabric_roll_id: roll.trim(), actual_fabric_yds: +yds });
      setQty(''); setRoll(''); setYds(''); setMsg('Order submitted for verification'); router.refresh();
    } catch (err) { const a = err as ApiError; a.fields ? setErrs(a.fields) : setMsg(a.message); }
    setBusy(false);
  }
  return (
    <section className="card">
      <h2 className="mb-3 text-xl font-bold">Create Cutting Order</h2>
      <form onSubmit={submit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Recipe" id="recipe" error={errs.recipe_id}>
            <select id="recipe" className={cls('recipe_id')} value={recipeId} onChange={e => setRecipeId(+e.target.value)}>
              {recipes.map(r => <option key={r.id} value={r.id}>{r.recipe_code} – {r.name}</option>)}
            </select>
          </Field>
          <Field label="Target batch quantity" id="qty" error={errs.target_qty}><input id="qty" inputMode="numeric" placeholder="e.g. 50" className={cls('target_qty')} value={qty} onChange={e => setQty(e.target.value)} /></Field>
          <Field label="Fabric roll ID" id="roll" error={errs.fabric_roll_id}><input id="roll" placeholder="FAB-ROLL-882" className={cls('fabric_roll_id')} value={roll} onChange={e => setRoll(e.target.value)} /></Field>
          <Field label="Actual fabric used (yards)" id="yds" error={errs.actual_fabric_yds}><input id="yds" inputMode="decimal" placeholder="e.g. 92.5" className={cls('actual_fabric_yds')} value={yds} onChange={e => setYds(e.target.value)} /></Field>
        </div>
        {recipe && qtyOk && (
          <p className="mb-3 text-gray-800"><b>Expected counts:</b> {recipe.components.map(c => `${c.component_name}: ${c.pieces_per_garment * +qty}`).join(' · ')} · <b>Expected fabric:</b> {(recipe.std_fabric_yards * +qty).toFixed(2)} yds</p>
        )}
        <button className="btn" disabled={busy}>Submit for Verification</button>
        {msg && <p role="status" className="mt-2 font-semibold">{msg}</p>}
      </form>
    </section>
  );
}
