export function StatCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "danger" | "success";
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-[rgba(176,58,58,0.08)] text-[var(--danger)]"
      : tone === "success"
        ? "bg-[rgba(13,148,136,0.1)] text-[var(--accent-strong)]"
        : "bg-[var(--surface-2)] text-[var(--foreground)]";

  return (
    <article className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-4xl font-semibold text-[var(--foreground)]">{value}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
          {detail}
        </span>
      </div>
    </article>
  );
}
