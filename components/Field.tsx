export default function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">{label}</label>
      {children}
      <span role="alert" className="block min-h-[1.25rem] text-sm font-semibold text-red-700">{error}</span>
    </div>
  );
}
