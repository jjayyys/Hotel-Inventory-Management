export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[var(--line-strong)] bg-white px-6 py-10 text-center shadow-[var(--shadow-soft)]">
      <h4 className="text-xl font-semibold text-[var(--foreground)]">{title}</h4>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
    </div>
  );
}
