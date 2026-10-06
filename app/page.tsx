import { redirect } from 'next/navigation';
import AuthForms from '@/components/AuthForms';
import { getUser } from '@/lib/auth';
import { HOME } from '@/lib/types';

export default async function Home() {
  const u = await getUser();
  if (u) redirect(HOME[u.role]);
  return <AuthForms />;
}
