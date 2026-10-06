'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { AdminColumn, AdminTable } from '@/lib/types';

type TableData = { name: string; columns: AdminColumn[]; rows: Record<string, unknown>[] };

const title = (name: string) => name.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

export default function AdminCrud({ initialTables }: { initialTables: AdminTable[] }) {
  const [selected, setSelected] = useState(initialTables.find(table => table.available)?.name ?? '');
  const [data, setData] = useState<TableData | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load(table: string) {
    if (!table) return;
    try {
      setError('');
      setNotice('');
      setSelected(table);
      setEditing(null);
      setDraft({});
      setData(await api<TableData>(`/admin/${table}`));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const primary = data?.columns.filter(column => column.pk > 0) ?? [];
  const editable = data?.columns.filter(column => !column.pk && !column.dflt_value) ?? [];
  const createFields = data?.columns.filter(column => !column.dflt_value) ?? [];
  const keyFor = (row: Record<string, unknown>) => encodeURIComponent(
    JSON.stringify(Object.fromEntries(primary.map(column => [column.name, row[column.name]]))),
  );

  function fieldValue(column: AdminColumn, value: unknown) {
    return value === null || value === undefined ? '' : String(value);
  }

  async function create() {
    if (!data) return;
    try {
      await api(`/admin/${data.name}`, 'POST', draft);
      setDraft({});
      await load(data.name);
      setNotice(`${title(data.name)} record created.`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(row: Record<string, unknown>) {
    if (!data || !primary.length || !confirm(`Delete this ${title(data.name).toLowerCase()} record?`)) return;
    try {
      await api(`/admin/${data.name}/${keyFor(row)}`, 'DELETE');
      await load(data.name);
      setNotice('Record deleted.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function update() {
    if (!data || !editing || !primary.length) return;
    try {
      await api(`/admin/${data.name}/${keyFor(editing)}`, 'PATCH', editing);
      setEditing(null);
      await load(data.name);
      setNotice('Record updated.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Supervisor workspace</p>
          <h2 className="text-2xl font-bold text-slate-900">Database administration</h2>
          <p className="text-sm text-slate-600">Manage recipes, orders, verification records and sessions.</p>
        </div>
        <Link href="/supervisor" className="btn btn-ghost">Back to operations</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {initialTables.map(table => (
          <button
            key={table.name}
            type="button"
            disabled={!table.available}
            onClick={() => void load(table.name)}
            className={`rounded-lg border p-4 text-left transition ${selected === table.name ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="block font-semibold text-slate-900">{title(table.name)}</span>
            <span className="mt-1 block text-xs text-slate-500">{table.available ? 'Open CRUD view' : 'Not available in local database'}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded bg-green-50 p-3 text-green-700">{notice}</p>}

      {!data && <div className="card rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Select a table above to view and manage its records.</div>}

      {data && (
        <>
          <div className="card rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{title(data.name)}</h3>
                <p className="text-sm text-slate-500">Add a new record. Fields with database defaults are generated automatically.</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => void load(data.name)}>Refresh</button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {createFields.map(column => (
                <label className="text-sm font-semibold text-slate-700" key={column.name}>
                  {title(column.name)}
                  <input className="field mt-1" placeholder={column.name} value={draft[column.name] ?? ''} onChange={event => setDraft({ ...draft, [column.name]: event.target.value })} />
                </label>
              ))}
            </div>
            <button type="button" className="btn mt-4" onClick={() => void create()}>Add {title(data.name).replace(/s$/, '')}</button>
          </div>

          {editing && (
            <div className="card rounded-lg border border-blue-200 bg-blue-50 p-5">
              <h3 className="mb-4 font-bold text-slate-900">Edit {title(data.name)} record</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {editable.map(column => (
                  <label className="text-sm font-semibold text-slate-700" key={column.name}>
                    {title(column.name)}
                    <input className="field mt-1" value={fieldValue(column, editing[column.name])} onChange={event => setEditing({ ...editing, [column.name]: event.target.value })} />
                  </label>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn" onClick={() => void update()}>Save changes</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="card overflow-x-auto rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Existing records ({data.rows.length})</h3>
              <span className="text-xs text-slate-500">Supervisor access only</span>
            </div>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr>{data.columns.map(column => <th className="th" key={column.name}>{title(column.name)}</th>)}<th className="th">Actions</th></tr></thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={index}>
                    {data.columns.map(column => <td className="td max-w-xs truncate" key={column.name}>{String(row[column.name] ?? '—')}</td>)}
                    <td className="td"><div className="flex gap-2"><button type="button" className="btn btn-ghost" disabled={!primary.length} onClick={() => setEditing({ ...row })}>Edit</button><button type="button" className="btn btn-ghost" disabled={!primary.length} onClick={() => void remove(row)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.rows.length && <p className="py-8 text-center text-sm text-slate-500">No records found. Use the form above to add one.</p>}
          </div>
        </>
      )}
    </section>
  );
}
