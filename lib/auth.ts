import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { HOME, type Role, type User } from './types';

const BACKEND = process.env.BACKEND_URL || 'https://apparelflow-bacend.onrender.com';

/** Server-side fetch to the Express API, forwarding the browser's session cookie. */
export async function sfetch<T>(path: string): Promise<T | null> {
  try {
    const requestCookies = await cookies();
    const r = await fetch(BACKEND + '/api' + path, { headers: { cookie: requestCookies.toString() }, cache: 'no-store' });
    return r.ok ? ((await r.json()) as T) : null;
  } catch (error) {
    const cause = error instanceof TypeError ? (error as TypeError & { cause?: { code?: string } }).cause : undefined;
    if (error instanceof TypeError && cause?.code === 'ECONNREFUSED') {
      console.error(`Backend unavailable while requesting ${path}: ${BACKEND}`);
      return null;
    }
    throw error;
  }
}
export const getUser = async () => (await sfetch<{ user: User }>('/me'))?.user ?? null;

export async function requirePage(role: Role): Promise<User> {
  const u = await getUser();
  if (!u) redirect('/');
  if (u.role !== role) redirect(HOME[u.role]);
  return u;
}
export { notFound };
