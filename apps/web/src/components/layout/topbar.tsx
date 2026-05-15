"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

export function Topbar() {
  const { session, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--line-soft)] bg-white px-5 py-4 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
          Live workspace
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
          Inventory signals and replenishment review
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--foreground)]">
          <p className="font-semibold">{session?.user.name}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            {session?.user.role.replaceAll("_", " ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="rounded-2xl border border-[var(--line-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
