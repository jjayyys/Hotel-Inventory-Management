"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { Recommendation } from "@/types/api";
import { DashboardMetrics, StockCoveragePoint, WasteTrendPoint } from "@/types/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

function riskTone(riskLevel: Recommendation["risk_level"]) {
  if (riskLevel === "critical") {
    return "danger";
  }

  if (riskLevel === "low") {
    return "success";
  }

  return "default";
}

export function DashboardOverview({
  metrics,
  latestRecommendationDate,
  recommendations,
  wasteTrend,
  stockCoverage,
}: {
  metrics: DashboardMetrics;
  latestRecommendationDate: string | null;
  recommendations: Recommendation[];
  wasteTrend: WasteTrendPoint[];
  stockCoverage: StockCoveragePoint[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active skus"
          value={String(metrics.totalSkus)}
          detail={`${metrics.totalSuppliers} suppliers`}
        />
        <StatCard
          label="Reorder alerts"
          value={String(metrics.reorderAlerts)}
          detail={`${metrics.totalRecommendations} latest recommendations`}
          tone="success"
        />
        <StatCard
          label="Critical pressure"
          value={String(metrics.criticalAlerts)}
          detail={`${metrics.lowStockSkus} low-stock SKUs`}
          tone="danger"
        />
        <StatCard
          label="Waste cost"
          value={`$${metrics.wasteCost.toFixed(2)}`}
          detail={`${metrics.wasteEvents} logged events`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Waste trend
              </p>
              <h4 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                Logged waste quantity over time
              </h4>
            </div>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wasteTrend}>
                <defs>
                  <linearGradient id="wasteFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#B03A3A" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#B03A3A" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e7e1d5" vertical={false} />
                <XAxis dataKey="label" stroke="#6b7280" tickLine={false} />
                <YAxis stroke="#6b7280" tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="quantity"
                  stroke="#B03A3A"
                  fill="url(#wasteFill)"
                  strokeWidth={2.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Recommendation cycle
          </p>
          <h4 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            Latest alerts
          </h4>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {latestRecommendationDate
              ? `Showing recommendations from ${latestRecommendationDate.slice(0, 10)}.`
              : "No recommendation cycle has been generated yet."}
          </p>

          <div className="mt-5 space-y-3">
            {recommendations.length === 0 ? (
              <EmptyState
                title="No active alerts"
                description="Run the recommendation engine and this panel will surface the latest high-priority reorder decisions."
              />
            ) : (
              recommendations.slice(0, 5).map((recommendation) => (
                <Link
                  key={recommendation.id}
                  href={`/skus/${recommendation.sku_id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-1)] px-4 py-4 transition hover:bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {recommendation.sku.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {recommendation.sku.sku_code}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        riskTone(recommendation.risk_level) === "danger"
                          ? "bg-[rgba(176,58,58,0.12)] text-[var(--danger)]"
                          : riskTone(recommendation.risk_level) === "success"
                            ? "bg-[rgba(13,148,136,0.12)] text-[var(--accent-strong)]"
                            : "bg-[var(--surface-2)] text-[var(--foreground)]"
                      }`}
                    >
                      {recommendation.risk_level}
                    </span>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      reorder qty {recommendation.recommended_quantity}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Stock coverage
            </p>
            <h4 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              Days of cover by SKU
            </h4>
          </div>
          <Link
            href="/dashboard/recommendations"
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Open recommendation board
          </Link>
        </div>

        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockCoverage}>
              <CartesianGrid stroke="#e7e1d5" vertical={false} />
              <XAxis dataKey="skuCode" stroke="#6b7280" tickLine={false} />
              <YAxis stroke="#6b7280" tickLine={false} />
              <Tooltip />
              <Bar dataKey="daysOfCover" fill="#0f766e" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
