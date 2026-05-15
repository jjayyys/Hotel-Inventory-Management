"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";

export default function Home() {
  const { isReady, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    router.replace(session ? "/dashboard" : "/login");
  }, [isReady, router, session]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-0)]">
      <div className="rounded-3xl border border-[var(--line-soft)] bg-white px-6 py-5 text-sm text-[var(--muted)] shadow-[var(--shadow-soft)]">
        Preparing the Food Waste dashboard...
      </div>
    </main>
  );
}
