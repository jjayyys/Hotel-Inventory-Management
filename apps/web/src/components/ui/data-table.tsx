type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
};

export function DataTable<T>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--line-soft)] bg-white shadow-[var(--shadow-soft)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--line-soft)] bg-[var(--surface-1)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-[var(--line-soft)] last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-4 text-sm text-[var(--foreground)] ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
