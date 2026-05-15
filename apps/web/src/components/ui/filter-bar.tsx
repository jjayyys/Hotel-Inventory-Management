type FilterBarProps = {
  children: React.ReactNode;
};

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--line-soft)] bg-white p-4 shadow-[var(--shadow-soft)] md:flex-row md:flex-wrap md:items-center">
      {children}
    </div>
  );
}

export function FilterInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-w-[14rem] flex-1 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
    />
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
