export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) { super(message); }
}
export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError('The backend service is unavailable. Start the API server and try again.', 503);
    }
    throw error;
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(d.error || r.statusText, r.status, d.fields);
  return d as T;
}
export const fmtDate = (t: string | null) => (t ? new Date(t).toLocaleString() : '—');
