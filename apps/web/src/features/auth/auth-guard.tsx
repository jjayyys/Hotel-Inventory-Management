"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./use-auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isReady, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isReady, pathname, router, session]);

  if (!isReady || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)]">
        <div className="rounded-3xl border border-[var(--line-soft)] bg-white px-6 py-5 text-sm text-[var(--muted)] shadow-[var(--shadow-soft)]">
          Preparing your dashboard session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
