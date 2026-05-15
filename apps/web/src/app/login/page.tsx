"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/services/auth";
import { ApiError } from "@/services/api-client";
import { useAuth } from "@/features/auth/use-auth";

function LoginScreen() {
  const { session, setSession, isReady } = useAuth();
  const [email, setEmail] = useState("admin@azurebay.example");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    if (isReady && session) {
      router.replace(nextPath);
    }
  }, [isReady, nextPath, router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const nextSession = await login({ email, password });
      setSession(nextSession);
      router.replace(nextPath);
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_38%),linear-gradient(180deg,_#f7f3ea_0%,_#eef2e6_100%)] px-4 py-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/5 bg-[rgba(255,255,255,0.78)] p-8 shadow-[0_24px_80px_rgba(59,48,33,0.12)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-strong)]">
            Control room
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-[var(--foreground)]">
            Review stock, waste, and reorder pressure in one dashboard.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            This dashboard is wired to the live NestJS API, deterministic EOQ
            engine, and the mock hotel dataset already seeded into your local
            Postgres environment.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Recalculated recommendations",
                description: "Review latest deterministic reorder signals by SKU.",
              },
              {
                label: "Waste trend visibility",
                description: "Trace spoilage, overproduction, and quality-loss patterns.",
              },
              {
                label: "Inventory drill-down",
                description: "Inspect batch cover, batch aging, and supplier-linked stock risk.",
              },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]"
              >
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {item.label}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-[#11271f] p-8 text-white shadow-[0_24px_80px_rgba(17,39,31,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8bd7cb]">
            Sign in
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight">
            Use the seeded admin account to enter the live dashboard.
          </h2>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#d8ede8]">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8bd7cb]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[#d8ede8]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8bd7cb]"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-[#f7b3b3] bg-[#5b2626] px-4 py-3 text-sm text-[#ffe3e3]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#0ea5a0] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Open dashboard"}
            </button>
          </form>

          <div className="mt-8 rounded-[1.5rem] border border-white/12 bg-white/6 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bd7cb]">
              Demo credentials
            </p>
            <p className="mt-3 text-sm leading-7 text-[#d8ede8]">
              Admin: <span className="font-semibold">admin@azurebay.example</span>
              <br />
              Password: <span className="font-semibold">Admin123!</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--surface-0)]">
          <div className="rounded-3xl border border-[var(--line-soft)] bg-white px-6 py-5 text-sm text-[var(--muted)] shadow-[var(--shadow-soft)]">
            Preparing sign-in...
          </div>
        </main>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
