import OrderForm from '@/components/OrderForm';
import OrdersTable from '@/components/OrdersTable';
import { requirePage, sfetch } from '@/lib/auth';
import type { Order, Recipe } from '@/lib/types';

export default async function SupervisorPage() {
  await requirePage('cutting_supervisor');
  const [r, o] = await Promise.all([sfetch<{ recipes: Recipe[] }>('/recipes'), sfetch<{ orders: Order[] }>('/orders')]);
  return (
    <>
      <OrderForm recipes={r?.recipes ?? []} />
      <OrdersTable orders={o?.orders ?? []} />
    </>
  );
}
