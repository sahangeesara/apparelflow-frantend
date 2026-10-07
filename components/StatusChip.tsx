'use client';

import { CheckCircle2, AlertTriangle, XCircle, Clock, MinusCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  GREEN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  VERIFIED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  YELLOW: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
  RED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
  PENDING_VERIFICATION: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Clock },
};

export default function StatusChip({ status }: { status: string | null }) {
  const s = status ?? 'UNCOUNTED';
  const config = STATUS_CONFIG[s] ?? {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: MinusCircle,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{s.replace(/_/g, ' ')}</span>
    </span>
  );
}
