export default function StatBadge({ label, value }) {
  return (
    <div className="rounded-lg bg-surface border border-border px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">{label}</div>
      <div className="font-black text-xl text-ink">{value}</div>
    </div>
  );
}
