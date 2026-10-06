import AdminCrud from '@/components/AdminCrud';
import AuthenticatedShell from '@/components/AuthenticatedShell';
import { requirePage, sfetch } from '@/lib/auth';
import type { AdminTable } from '@/lib/types';

export default async function AdminPage() {
  const user = await requirePage('cutting_supervisor');
  const tables = (await sfetch<{ tables: AdminTable[] }>('/admin/tables'))?.tables ?? [];
  return <AuthenticatedShell user={user}><AdminCrud initialTables={tables} /></AuthenticatedShell>;
}
