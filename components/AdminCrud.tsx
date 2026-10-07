'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { api } from '@/lib/api';
import { showVerificationVariances } from '@/lib/alerts';
import type { AdminColumn, AdminTable, Order, Recipe } from '@/lib/types';
import StatusChip from './StatusChip';
import { Database, Plus, RefreshCw, Edit, Trash2, ArrowLeft, Eye, Image as ImageIcon, Layers, Table, CheckCircle, AlertCircle } from 'lucide-react';

type TableData = { name: string; columns: AdminColumn[]; rows: Record<string, unknown>[] };

const title = (name: string) => name.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
const normalizedType = (column: AdminColumn) => column.type.trim().toLowerCase();
const isDateColumn = (column: AdminColumn) => normalizedType(column) === 'date';
const isTimestampColumn = (column: AdminColumn) => normalizedType(column).includes('timestamp') || normalizedType(column) === 'timestamptz';
const isJsonColumn = (column: AdminColumn) => normalizedType(column).includes('json');
const isUserReference = (column: AdminColumn) => /(^|_)(created_by|updated_by|sewing_started_by|verifier_id|user_id)$/.test(column.name);
const isGeneratedColumn = (column: AdminColumn) => isUserReference(column) || ['order_no', 'created_at', 'updated_at'].includes(column.name);
const isImageColumn = (column: AdminColumn) => column.name === 'image_url';
const inputType = (column: AdminColumn) => isDateColumn(column) ? 'date' : isTimestampColumn(column) ? 'datetime-local' : 'text';

function pickerValue(column: AdminColumn, value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  const text = isJsonColumn(column) && typeof value === 'object'
    ? JSON.stringify(value, null, 2)
    : String(value);
  if (isDateColumn(column)) return text.slice(0, 10);
  if (isTimestampColumn(column)) return text.replace(' ', 'T').slice(0, 16);
  return text;
}

function databaseValue(column: AdminColumn, value: string) {
  if (!value) return value;
  if (isJsonColumn(column)) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${column.name} must contain valid JSON.`);
    }
  }
  if (isDateColumn(column)) return value;
  if (isTimestampColumn(column)) {
    const type = normalizedType(column);
    if (type.includes('with time zone') || type === 'timestamptz') return new Date(value).toISOString();
    return value.length === 16 ? `${value}:00` : value;
  }
  return value;
}

function displayDatabaseValue(value: unknown) {
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return JSON.stringify(value);
  }
  return String(value);
}

export default function AdminCrud({ initialTables }: { initialTables: AdminTable[] }) {
  const [selected, setSelected] = useState(initialTables.find(table => table.available)?.name ?? '');
  const [data, setData] = useState<TableData | null>(null);
  const [orderRecipes, setOrderRecipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDraft, setOrderDraft] = useState({ recipeId: '', qty: '', roll: '', yds: '' });
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
      if (table === 'cutting_orders') {
        const recipes = await api<{ recipes: Recipe[] }>('/recipes');
        setOrderRecipes(recipes.recipes);
        setOrderDraft({ recipeId: String(recipes.recipes[0]?.id ?? ''), qty: '', roll: '', yds: '' });
        setOrders((await api<{ orders: Order[] }>('/orders')).orders);
      }
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
  const canCreate = data?.name !== 'verification_items' && data?.name !== 'verification_logs';
  const canEdit = data?.name !== 'verification_logs';
  const canDelete = data?.name !== 'verification_logs';
  const editable = data?.columns.filter(column => !column.pk && !column.dflt_value && !isGeneratedColumn(column)) ?? [];
  const createFields = data?.columns.filter(column => !column.dflt_value && !isGeneratedColumn(column)) ?? [];
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
    if (isJsonColumn(column)) {
      return (
        <textarea
          className="field mt-1 min-h-32 font-mono text-xs"
          placeholder={`{"${column.name}": "value"}`}
          value={value}
          onChange={event => onChange(event.target.value)}
        />
      );
    }
    if (isImageColumn(column)) {
      return (
        <div className="mt-1 space-y-2">
          <input
            type="file"
            accept="image/*"
            className="field text-xs"
            onChange={event => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                setError('Image must be 2 MB or smaller.');
                return;
              }
              const reader = new FileReader();
              reader.onload = () => onChange(String(reader.result));
              reader.onerror = () => setError('Could not read the selected image.');
              reader.readAsDataURL(file);
            }}
          />
          {value && (
            <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
              <Image src={value} alt="Component preview" width={80} height={80} unoptimized className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      );
    }
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
    return displayDatabaseValue(value);
  }

  function renderCell(column: AdminColumn, row: Record<string, unknown>) {
    if (column.name === 'variances' && row[column.name] !== null && row[column.name] !== undefined && row[column.name] !== '') {
      let value: unknown = row[column.name];
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          value = row[column.name];
        }
      }
      return (
        <button
          type="button"
          className="btn btn-ghost text-xs py-1 px-2.5"
          onClick={() => void showVerificationVariances(value)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View variances</span>
        </button>
      );
    }
    if (isImageColumn(column) && typeof row[column.name] === 'string' && row[column.name]) {
      return (
        <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-300">
          <Image src={String(row[column.name])} alt="Component image" width={40} height={40} unoptimized className="h-full w-full object-cover" />
        </div>
      );
    }
    const value = displayValue(column, row);
    return value;
  }

  async function create() {
    if (!data) return;
    try {
      if (data.name === 'cutting_orders') {
        const fields: Record<string, string> = {};
        if (!/^[1-9]\d*$/.test(orderDraft.qty.trim())) fields.target_qty = 'Whole number greater than 0 only';
        if (!/^\d+(\.\d+)?$/.test(orderDraft.yds.trim()) || +orderDraft.yds <= 0) fields.actual_fabric_yds = 'Enter a positive number';
        if (!/^[A-Za-z0-9-]{3,40}$/.test(orderDraft.roll.trim())) fields.fabric_roll_id = 'Use letters, digits and dashes only';
        if (!orderDraft.recipeId) fields.recipe_id = 'Select a recipe';
        if (Object.keys(fields).length) {
          setError(Object.values(fields).join(' · '));
          return;
        }
        await api('/admin/cutting_orders', 'POST', {
          recipe_id: +orderDraft.recipeId,
          target_qty: +orderDraft.qty,
          fabric_roll_id: orderDraft.roll.trim(),
          actual_fabric_yds: +orderDraft.yds,
        });
        setOrderDraft({ ...orderDraft, qty: '', roll: '', yds: '' });
        await load(data.name);
        setNotice('Cutting order created.');
        return;
      }
      const payload = Object.fromEntries(
        data.columns
          .filter(column => Object.hasOwn(draft, column.name) && !isGeneratedColumn(column))
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
          .filter(column => Object.hasOwn(editing, column.name) && !isGeneratedColumn(column))
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
    <section className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Supervisor Portal</span>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            <span>Database Administration</span>
          </h2>
          <p className="text-xs text-slate-500">Manage recipes, orders, verification logs, and system sessions.</p>
        </div>
        <Link href="/supervisor" className="btn btn-ghost text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Operations</span>
        </Link>
      </div>

      {/* Table Selector Pills Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {initialTables.map(table => {
          const isSel = selected === table.name;
          return (
            <button
              key={table.name}
              type="button"
              disabled={!table.available}
              onClick={() => void load(table.name)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                isSel
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSel ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Table className="h-4.5 w-4.5" />
              </div>
              <div className="truncate">
                <span className="block text-sm font-bold truncate">{title(table.name)}</span>
                <span className="text-[11px] font-medium text-slate-500">{table.available ? 'Ready to manage' : 'Unavailable'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {!data && (
        <div className="card rounded-2xl border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <Database className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold">Select a database table above to view and modify records.</p>
        </div>
      )}

      {data && (
        <>
          {/* Create Record Form */}
          {canCreate && (
            <div className="card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span>Create {title(data.name)} Record</span>
                  </h3>
                  <p className="text-xs text-slate-500">Fill in the fields below. Generated IDs and timestamps are handled automatically.</p>
                </div>
                <button type="button" className="btn btn-ghost text-xs py-1 px-3" onClick={() => void load(data.name)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {data.name === 'cutting_orders' ? (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-700">
                    Recipe Selection
                    <select
                      className="field mt-1"
                      value={orderDraft.recipeId}
                      onChange={event => setOrderDraft({ ...orderDraft, recipeId: event.target.value })}
                    >
                      {orderRecipes.map(recipe => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.recipe_code} – {recipe.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    Target Batch Quantity
                    <input className="field mt-1" inputMode="numeric" placeholder="e.g. 50" value={orderDraft.qty} onChange={event => setOrderDraft({ ...orderDraft, qty: event.target.value })} />
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    Fabric Roll ID
                    <input className="field mt-1" placeholder="FAB-ROLL-882" value={orderDraft.roll} onChange={event => setOrderDraft({ ...orderDraft, roll: event.target.value })} />
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    Actual Fabric Used (Yards)
                    <input className="field mt-1" inputMode="decimal" placeholder="e.g. 92.5" value={orderDraft.yds} onChange={event => setOrderDraft({ ...orderDraft, yds: event.target.value })} />
                  </label>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                  {createFields.map(column => (
                    <label className="text-xs font-bold text-slate-700" key={column.name}>
                      {title(column.name)}
                      {renderInput(column, draft[column.name] ?? '', value => setDraft({ ...draft, [column.name]: value }))}
                    </label>
                  ))}
                </div>
              )}
              <button type="button" className="btn mt-4 text-xs" onClick={() => void create()}>
                <Plus className="h-4 w-4" />
                <span>Add {title(data.name).replace(/s$/, '')}</span>
              </button>
            </div>
          )}

          {/* Operational View for Cutting Orders with Scroll */}
          {data.name === 'cutting_orders' && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    <span>Live Cutting Orders Overview</span>
                  </h3>
                  <p className="text-xs text-slate-500">Operational view of active cutting orders and verification stages.</p>
                </div>
                <button type="button" className="btn btn-ghost text-xs py-1 px-3" onClick={() => void load(data.name)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {orders.length ? (
                <div className="table-container custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        {['Order No', 'Recipe', 'Qty', 'Roll ID', 'Fabric Used', 'Created By', 'Status', 'Verification Note'].map(header => (
                          <th className="th" key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="table-row-hover">
                          <td className="td font-mono font-bold text-blue-900">{order.order_no}</td>
                          <td className="td font-medium text-slate-800">{order.recipe_code} – {order.recipe_name}</td>
                          <td className="td font-bold">{order.target_qty}</td>
                          <td className="td font-mono text-xs">{order.fabric_roll_id}</td>
                          <td className="td font-semibold">{order.actual_fabric_yds} yds</td>
                          <td className="td font-medium text-slate-600">{order.created_by_name || '—'}</td>
                          <td className="td"><StatusChip status={order.status} /></td>
                          <td className="td text-xs text-slate-600">
                            {order.last_log
                              ? `${order.last_log.decision} · ${order.last_log.verifier_name}`
                              : order.components.some(component => component.actual_qty !== null)
                                ? 'Counts submitted · awaiting decision'
                                : 'Not submitted'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No orders currently logged.</p>
              )}
            </div>
          )}

          {/* Edit Drawer Card */}
          {editing && canEdit && (
            <div className="card border-blue-200 bg-blue-50/40">
              <h3 className="mb-3 text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-blue-600" />
                <span>Edit {title(data.name)} Record</span>
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {editable.map(column => (
                  <label className="text-xs font-bold text-slate-700" key={column.name}>
                    {title(column.name)}
                    {renderInput(column, fieldValue(column, editing[column.name]), value => setEditing({ ...editing, [column.name]: value }))}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn text-xs" onClick={() => void update()}>Save Changes</button>
                <button type="button" className="btn btn-ghost text-xs" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Records Table View with Scroll */}
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Database Records ({data.rows.length})</h3>
                <p className="text-xs text-slate-500">Raw database table rows and parameters.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">Supervisor Access</span>
            </div>

            <div className="table-container custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    {data.columns.map(column => (
                      <th className="th" key={column.name}>{title(column.name)}</th>
                    ))}
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, index) => (
                    <tr key={index} className="table-row-hover">
                      {data.columns.map(column => {
                        const rawValue = row[column.name];
                        const titleValue = rawValue && typeof rawValue === 'object'
                          ? JSON.stringify(rawValue, null, 2)
                          : isUserReference(column) ? String(rawValue ?? '') : undefined;
                        return (
                          <td className="td max-w-xs truncate" key={column.name} title={titleValue}>
                            {renderCell(column, row)}
                          </td>
                        );
                      })}
                      <td className="td">
                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-ghost text-xs p-1.5"
                              disabled={!primary.length}
                              onClick={() => setEditing({ ...row })}
                              title="Edit record"
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-600" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-ghost text-xs p-1.5 text-rose-600 hover:bg-rose-50"
                              disabled={!primary.length}
                              onClick={() => void remove(row)}
                              title="Delete record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!canEdit && !canDelete && <span className="text-xs text-slate-400">View only</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.rows.length && (
              <p className="py-8 text-center text-xs text-slate-500">No records found in table.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
