"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterBar,
  FilterSelect,
} from "@/components/ui/filter-bar";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  buildWasteTrend,
  fetchDashboardDataset,
  filterWasteLogs,
} from "@/services/dashboard";
import { DashboardDataset } from "@/types/dashboard";

export default function WastePage() {
  const [dataset, setDataset] = useState<DashboardDataset | null>(null);
  const [skuFilter, setSkuFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");

  useEffect(() => {
    fetchDashboardDataset().then(setDataset).catch(console.error);
  }, []);

  const visibleWasteLogs = dataset
    ? filterWasteLogs(dataset.wasteLogs, skuFilter, fromDate)
    : [];

  const chartData = dataset
    ? buildWasteTrend({
        ...dataset,
        wasteLogs: visibleWasteLogs,
      })
    : [];

  return (
    <AuthGuard>
      <AppShell eyebrow="Waste" title="Waste monitoring and spoilage trend">
        <div className="space-y-6">
          <FilterBar>
            <FilterSelect
              value={skuFilter}
              onChange={setSkuFilter}
              options={[
                { label: "All SKUs", value: "all" },
                ...((dataset?.skus ?? []).map((sku) => ({
                  label: `${sku.sku_code} · ${sku.name}`,
                  value: sku.id,
                })) ?? []),
              ]}
            />
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--foreground)]">
              <span className="font-medium text-[var(--muted)]">From date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
          </FilterBar>

          {!dataset ? (
            <EmptyState
              title="Loading waste logs"
              description="Pulling waste events and building the chart series from the API."
            />
          ) : (
            <>
              <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Waste quantity
                </p>
                <h4 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  Quantity over time
                </h4>

                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="wasteTrendFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#b03a3a" stopOpacity={0.42} />
                          <stop offset="95%" stopColor="#b03a3a" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e7e1d5" vertical={false} />
                      <XAxis dataKey="label" stroke="#6b7280" tickLine={false} />
                      <YAxis stroke="#6b7280" tickLine={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="quantity"
                        stroke="#b03a3a"
                        fill="url(#wasteTrendFill)"
                        strokeWidth={2.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <DataTable
                emptyMessage="No waste logs match the current filters."
                rows={visibleWasteLogs}
                columns={[
                  {
                    key: "sku",
                    label: "SKU",
                    render: (row) => row.sku?.name ?? "Unknown SKU",
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
                    render: (row) =>
                      `${row.quantity} ${row.unit}`.trim(),
                  },
                  {
                    key: "cost",
                    label: "Estimated cost",
                    align: "right",
                    render: (row) => `$${row.estimated_cost}`,
                  },
                  {
                    key: "date",
                    label: "Waste date",
                    render: (row) => row.waste_date.slice(0, 10),
                  },
                ]}
              />
            </>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
