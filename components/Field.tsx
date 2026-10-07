export default function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <span role="alert" className="block text-xs font-semibold text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
