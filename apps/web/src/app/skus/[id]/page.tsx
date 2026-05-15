"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { AuthGuard } from "@/features/auth/auth-guard";
import { fetchSkuDetailDataset } from "@/services/dashboard";
import { Recommendation } from "@/types/api";

function getLatestRecommendation(recommendations: Recommendation[]) {
  const sorted = [...recommendations].sort((left, right) =>
    right.recommendation_date.localeCompare(left.recommendation_date),
  );

  return sorted[0] ?? null;
}

export default function SkuDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchSkuDetailDataset>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    fetchSkuDetailDataset(params.id)
      .then(setData)
      .catch((caughtError: Error) => setError(caughtError.message));
  }, [params.id]);

  const latestRecommendation = data
    ? getLatestRecommendation(data.recommendations)
    : null;

  return (
    <AuthGuard>
      <AppShell eyebrow="SKU detail" title="Ingredient drill-down">
        {!data && !error ? (
          <EmptyState
            title="Loading SKU detail"
            description="Fetching stock, waste, recommendation, and recipe context for this ingredient."
          />
        ) : null}

        {error ? (
          <EmptyState title="SKU unavailable" description={error} />
        ) : null}

        {data ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  {data.sku.sku_code}
                </p>
                <h4 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  {data.sku.name}
                </h4>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Category: {data.sku.category ?? "Uncategorized"} · Supplier:{" "}
                  {data.sku.supplier?.name ?? "Unknown"}
                </p>
              </div>
              <Link
                href="/dashboard/recommendations"
                className="rounded-2xl border border-[var(--line-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
              >
                Back to recommendation board
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Unit cost"
                value={`$${data.sku.unit_cost}`}
                detail={`${data.sku.unit} basis`}
              />
              <StatCard
                label="Safety stock"
                value={data.sku.safety_stock}
                detail={`${data.sku.unit} threshold`}
              />
              <StatCard
                label="Shelf life"
                value={String(data.sku.shelf_life_days)}
                detail="days"
              />
              <StatCard
                label="Latest risk"
                value={latestRecommendation?.risk_level ?? "n/a"}
                detail={
                  latestRecommendation
                    ? `reorder ${latestRecommendation.recommended_quantity}`
                    : "no cycle yet"
                }
                tone={
                  latestRecommendation?.risk_level === "critical"
                    ? "danger"
                    : latestRecommendation?.risk_level === "low"
                      ? "success"
                      : "default"
                }
              />
            </div>

            <DataTable
              emptyMessage="No recommendation history is available for this SKU yet."
              rows={data.recommendations}
              columns={[
                {
                  key: "date",
                  label: "Recommendation date",
                  render: (row) => row.recommendation_date.slice(0, 10),
                },
                {
                  key: "risk",
                  label: "Risk",
                  render: (row) => row.risk_level,
                },
                {
                  key: "quantity",
                  label: "Recommended qty",
                  align: "right",
                  render: (row) => row.recommended_quantity,
                },
                {
                  key: "eoq",
                  label: "EOQ",
                  align: "right",
                  render: (row) => row.eoq_value,
                },
              ]}
            />

            <DataTable
              emptyMessage="No inventory batches are linked to this SKU."
              rows={data.inventoryBatches}
              columns={[
                {
                  key: "remaining",
                  label: "Remaining",
                  align: "right",
                  render: (row) => `${row.remaining_quantity} ${data.sku.unit}`,
                },
                {
                  key: "received",
                  label: "Received",
                  align: "right",
                  render: (row) => `${row.received_quantity} ${data.sku.unit}`,
                },
                {
                  key: "receivedDate",
                  label: "Received date",
                  render: (row) => row.received_date.slice(0, 10),
                },
                {
                  key: "expiry",
                  label: "Expiry date",
                  render: (row) => row.expiry_date.slice(0, 10),
                },
              ]}
            />

            <DataTable
              emptyMessage="No waste logs are linked to this SKU."
              rows={data.wasteLogs}
              columns={[
                {
                  key: "date",
                  label: "Waste date",
                  render: (row) => row.waste_date.slice(0, 10),
                },
                {
                  key: "reason",
                  label: "Reason",
                  render: (row) => row.waste_reason.replaceAll("_", " "),
                },
                {
                  key: "quantity",
                  label: "Quantity",
                  align: "right",
                  render: (row) => `${row.quantity} ${row.unit}`,
                },
                {
                  key: "cost",
                  label: "Estimated cost",
                  align: "right",
                  render: (row) => `$${row.estimated_cost}`,
                },
              ]}
            />
          </div>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
