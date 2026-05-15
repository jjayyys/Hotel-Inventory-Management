"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/recommendations", label: "Recommendations" },
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/waste", label: "Waste Trends" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-8 rounded-[2rem] border border-[var(--line-soft)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-soft)] md:w-72">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
          Food Waste
        </p>
        <div>
          <h1 className="font-serif text-3xl text-[var(--foreground)]">
            Hotel inventory cockpit
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Monitor demand pressure, waste trends, and reorder signals from one
            working surface.
          </p>
        </div>
      </div>

      <nav className="grid gap-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[var(--accent)] text-white shadow-[0_16px_32px_rgba(13,148,136,0.24)]"
                  : "bg-white text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
