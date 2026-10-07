const COLORS: Record<string, string> = {
  GREEN: 'bg-emerald-700', VERIFIED: 'bg-emerald-700', YELLOW: 'bg-yellow-800', RED: 'bg-red-700', REJECTED: 'bg-red-700',
  PENDING_VERIFICATION: 'bg-blue-700',
};
export default function StatusChip({ status }: { status: string | null }) {
  const s = status ?? 'UNCOUNTED';
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white ${COLORS[s] ?? 'bg-gray-600'}`}>{s.replace('_', ' ')}</span>;
}
