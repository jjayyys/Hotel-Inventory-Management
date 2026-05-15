"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/ui/data-table";
import {
  FilterBar,
  FilterInput,
  FilterSelect,
} from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  fetchDashboardDataset,
  filterRecommendations,
} from "@/services/dashboard";
import { recalculateRecommendations } from "@/services/recommendations";
import { DashboardDataset } from "@/types/dashboard";

function riskBadge(risk: string) {
  const classes =
    risk === "critical"
      ? "bg-[rgba(176,58,58,0.12)] text-[var(--danger)]"
      : risk === "high"
        ? "bg-[rgba(196,105,12,0.12)] text-[var(--warning)]"
        : risk === "medium"
          ? "bg-[rgba(120,120,45,0.12)] text-[#6b6b1f]"
          : "bg-[rgba(13,148,136,0.12)] text-[var(--accent-strong)]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {risk}
    </span>
  );
}

export default function RecommendationsPage() {
  const [dataset, setDataset] = useState<DashboardDataset | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    fetchDashboardDataset().then(setDataset).catch(console.error);
  }, []);

  const visibleRecommendations = dataset
    ? filterRecommendations(dataset.latestRecommendations, search, riskFilter)
    : [];

  async function handleRecalculate() {
    if (!dataset) {
      return;
    }

    setIsRecalculating(true);

    try {
      await recalculateRecommendations(dataset.hotelId, 30);
      setDataset(await fetchDashboardDataset());
    } finally {
      setIsRecalculating(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell
        eyebrow="Recommendations"
        title="Deterministic reorder board"
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">
                Review the latest SKU-level EOQ output and trigger a fresh
                recalculation when you want a new deterministic cycle.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={!dataset || isRecalculating}
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRecalculating ? "Recalculating..." : "Run recalculation"}
            </button>
          </div>

          <FilterBar>
            <FilterInput
              value={search}
              placeholder="Search by SKU name or code"
              onChange={setSearch}
            />
            <FilterSelect
              value={riskFilter}
              onChange={setRiskFilter}
              options={[
                { label: "All risks", value: "all" },
                { label: "Critical", value: "critical" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ]}
            />
          </FilterBar>

          {!dataset ? (
            <EmptyState
              title="Loading recommendations"
              description="Pulling the latest persisted recommendation cycle from the API."
            />
          ) : (
            <DataTable
              emptyMessage="No recommendations match the current filters."
              rows={visibleRecommendations}
              columns={[
                {
                  key: "sku",
                  label: "SKU",
                  render: (row) => (
                    <Link
                      href={`/skus/${row.sku_id}`}
                      className="font-semibold text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      {row.sku.name}
                    </Link>
                  ),
                },
                {
                  key: "code",
                  label: "Code",
                  render: (row) => row.sku.sku_code,
                },
                {
                  key: "risk",
                  label: "Risk",
                  render: (row) => riskBadge(row.risk_level),
                },
                {
                  key: "stock",
                  label: "Current stock",
                  align: "right",
                  render: (row) => `${row.current_stock} ${row.sku.unit}`,
                },
                {
                  key: "rop",
                  label: "ROP",
                  align: "right",
                  render: (row) => row.reorder_point,
                },
                {
                  key: "quantity",
                  label: "Recommended qty",
                  align: "right",
                  render: (row) => row.recommended_quantity,
                },
                {
                  key: "cover",
                  label: "Days of cover",
                  align: "right",
                  render: (row) => row.estimated_days_of_cover,
                },
              ]}
            />
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
