'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { showError, showSuccess } from '@/lib/alerts';
import type { Recipe } from '@/lib/types';
import Field from './Field';
import { PlusCircle, Calculator, Send, CheckCircle } from 'lucide-react';

export default function OrderForm({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? 0);
  const [qty, setQty] = useState('');
  const [roll, setRoll] = useState('');
  const [yds, setYds] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const recipe = recipes.find(r => r.id === recipeId);
  const qtyOk = /^[1-9]\d*$/.test(qty.trim());
  const cls = (k: string) => `field ${errs[k] ? 'field-bad' : ''}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (!qtyOk) f.target_qty = 'Whole number greater than 0 only (no decimals, negatives or text)';
    if (!/^\d+(\.\d+)?$/.test(yds.trim()) || +yds <= 0) f.actual_fabric_yds = 'Enter a positive number';
    if (!/^[A-Za-z0-9-]{3,40}$/.test(roll.trim())) f.fabric_roll_id = 'Required: letters, digits, dashes (e.g. FAB-ROLL-882)';
    
    setErrs(f);
    setMsg('');
    if (Object.keys(f).length) return;

    setBusy(true);
    try {
      await api('/orders', 'POST', { recipe_id: recipeId, target_qty: +qty, fabric_roll_id: roll.trim(), actual_fabric_yds: +yds });
      setQty('');
      setRoll('');
      setYds('');
      setMsg('Order submitted for verification');
      await showSuccess('Order submitted for verification.');
      router.refresh();
    } catch (err) {
      const a = err as ApiError;
      if (a.fields) setErrs(a.fields);
      else {
        setMsg(a.message);
        await showError(a.message);
      }
    }
    setBusy(false);
  }

  return (
    <section className="card mb-6">
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Create Cutting Order</h2>
          <p className="text-xs text-slate-500">Initiate a new garment batch cutting order for verification.</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Recipe" id="recipe" error={errs.recipe_id}>
            <select id="recipe" className={cls('recipe_id')} value={recipeId} onChange={e => setRecipeId(+e.target.value)}>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.recipe_code} – {r.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Target Batch Qty" id="qty" error={errs.target_qty}>
            <input
              id="qty"
              inputMode="numeric"
              placeholder="e.g. 50"
              className={cls('target_qty')}
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </Field>

          <Field label="Fabric Roll ID" id="roll" error={errs.fabric_roll_id}>
            <input
              id="roll"
              placeholder="FAB-ROLL-882"
              className={cls('fabric_roll_id')}
              value={roll}
              onChange={e => setRoll(e.target.value)}
            />
          </Field>

          <Field label="Actual Fabric Used (Yards)" id="yds" error={errs.actual_fabric_yds}>
            <input
              id="yds"
              inputMode="decimal"
              placeholder="e.g. 92.5"
              className={cls('actual_fabric_yds')}
              value={yds}
              onChange={e => setYds(e.target.value)}
            />
          </Field>
        </div>

        {recipe && qtyOk && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 shadow-2xs">
            <div className="mb-2 flex items-center gap-1.5 font-bold text-blue-800 uppercase tracking-wider text-[10px]">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span>Calculated Batch Targets</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-slate-600">Expected Component Counts:</span>
              {recipe.components.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-white border border-blue-200/80 px-2 py-1 font-semibold text-slate-800 shadow-2xs">
                  <span>{c.component_name}:</span>
                  <span className="text-blue-700 font-bold">{c.pieces_per_garment * +qty} pcs</span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white px-2 py-1 font-semibold shadow-2xs ml-auto">
                <span>Expected Fabric:</span>
                <span className="font-bold">{(recipe.std_fabric_yards * +qty).toFixed(2)} yds</span>
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button className="btn" disabled={busy}>
            <Send className="h-4 w-4" />
            <span>{busy ? 'Submitting…' : 'Submit for Verification'}</span>
          </button>
          {msg && (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>{msg}</span>
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
