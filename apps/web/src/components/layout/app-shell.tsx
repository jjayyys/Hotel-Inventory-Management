"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  children,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] px-4 py-4 text-[var(--foreground)] md:px-6 md:py-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Sidebar />

        <div className="space-y-6">
          <Topbar />

          <section className="rounded-[2rem] border border-[var(--line-soft)] bg-[radial-gradient(circle_at_top_right,_rgba(13,148,136,0.08),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#fbfaf6_100%)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              {eyebrow}
            </p>
            <h3 className="mt-3 font-serif text-4xl leading-tight text-[var(--foreground)]">
              {title}
            </h3>
            <div className="mt-6">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
