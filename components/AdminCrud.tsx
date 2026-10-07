'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { AdminColumn, AdminTable } from '@/lib/types';

type TableData = { name: string; columns: AdminColumn[]; rows: Record<string, unknown>[] };

const title = (name: string) => name.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
const normalizedType = (column: AdminColumn) => column.type.trim().toLowerCase();
const isDateColumn = (column: AdminColumn) => normalizedType(column) === 'date';
const isTimestampColumn = (column: AdminColumn) => normalizedType(column).includes('timestamp') || normalizedType(column) === 'timestamptz';
const isUserReference = (column: AdminColumn) => /(^|_)(created_by|updated_by|sewing_started_by|verifier_id|user_id)$/.test(column.name);
const inputType = (column: AdminColumn) => isDateColumn(column) ? 'date' : isTimestampColumn(column) ? 'datetime-local' : 'text';

function pickerValue(column: AdminColumn, value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value);
  if (isDateColumn(column)) return text.slice(0, 10);
  if (isTimestampColumn(column)) return text.replace(' ', 'T').slice(0, 16);
  return text;
}

function databaseValue(column: AdminColumn, value: string) {
  if (!value) return value;
  if (isDateColumn(column)) return value;
  if (isTimestampColumn(column)) {
    const type = normalizedType(column);
    if (type.includes('with time zone') || type === 'timestamptz') return new Date(value).toISOString();
    return value.length === 16 ? `${value}:00` : value;
  }
  return value;
}

export default function AdminCrud({ initialTables }: { initialTables: AdminTable[] }) {
  const [selected, setSelected] = useState(initialTables.find(table => table.available)?.name ?? '');
  const [data, setData] = useState<TableData | null>(null);
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});
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
      if (table !== 'profiles' && initialTables.some(item => item.name === 'profiles' && item.available)) {
        const profiles = await api<TableData>('/admin/profiles');
        setUserLabels(Object.fromEntries(
          profiles.rows
            .filter(row => typeof row.id === 'string' && typeof row.full_name === 'string')
            .map(row => [row.id as string, row.full_name as string]),
        ));
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const primary = data?.columns.filter(column => column.pk > 0) ?? [];
  const editable = data?.columns.filter(column => !column.pk && !column.dflt_value && !isUserReference(column)) ?? [];
  const createFields = data?.columns.filter(column => !column.dflt_value && !isUserReference(column)) ?? [];
  const keyFor = (row: Record<string, unknown>) => encodeURIComponent(
    JSON.stringify(Object.fromEntries(primary.map(column => [column.name, row[column.name]]))),
  );

  function fieldValue(column: AdminColumn, value: unknown) {
    return pickerValue(column, value);
  }

  function createValue(column: AdminColumn, value: string) {
    return databaseValue(column, value);
  }

  function renderInput(
    column: AdminColumn,
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <input
        type={inputType(column)}
        className="field mt-1"
        placeholder={inputType(column) === 'text' ? column.name : undefined}
        step={inputType(column) === 'datetime-local' ? 60 : undefined}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    );
  }

  function displayValue(column: AdminColumn, row: Record<string, unknown>) {
    const value = row[column.name];
    if (value === null || value === undefined || value === '') return '—';
    if (isUserReference(column)) {
      const id = String(value);
      const name = userLabels[id] ?? row[`${column.name}_name`] ?? row[`${column.name.replace(/_id$|_by$/, '')}_name`];
      if (typeof name === 'string' && name.trim()) return name;
      return `User ${id.length > 12 ? `${id.slice(0, 8)}…` : id}`;
    }
    if (isDateColumn(column) || isTimestampColumn(column)) return pickerValue(column, value).replace('T', ' ');
    return String(value);
  }

  async function create() {
    if (!data) return;
    try {
      const payload = Object.fromEntries(
        data.columns
          .filter(column => Object.hasOwn(draft, column.name))
          .map(column => [column.name, createValue(column, draft[column.name])]),
      );
      await api(`/admin/${data.name}`, 'POST', payload);
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
      const payload = Object.fromEntries(
        data.columns
          .filter(column => Object.hasOwn(editing, column.name))
          .map(column => [column.name, createValue(column, fieldValue(column, editing[column.name]))]),
      );
      await api(`/admin/${data.name}/${keyFor(editing)}`, 'PATCH', payload);
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
                  {renderInput(column, draft[column.name] ?? '', value => setDraft({ ...draft, [column.name]: value }))}
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
                    {renderInput(column, fieldValue(column, editing[column.name]), value => setEditing({ ...editing, [column.name]: value }))}
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
                    {data.columns.map(column => <td className="td max-w-xs truncate" key={column.name} title={isUserReference(column) ? String(row[column.name] ?? '') : undefined}>{displayValue(column, row)}</td>)}
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
