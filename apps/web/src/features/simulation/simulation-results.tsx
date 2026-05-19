"use client";

import { SimulationResult } from "@/types/simulation";
import { DataTable } from "@/components/ui/data-table";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Helper function to safely format numbers
function safeFormat(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}

export interface SimulationResultsProps {
  results: SimulationResult[];
  scenarioName?: string;
}

export function SimulationResults({
  results,
}: SimulationResultsProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <p className="text-sm text-[var(--muted)]">No results to display.</p>
      </div>
    );
  }

  // Prepare chart data for impact visualization
  const chartData = results.slice(0, 10).map((result) => ({
    skuCode: result.skuCode,
    baselineQty: result.baselineMetrics.recommendedQuantity,
    projectedQty: result.projectedMetrics.recommendedQuantity,
  }));

  // Risk level summary
  const riskChanges = results.filter((r) => r.variance.riskUpgrade);

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            SKUs Affected
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {results.length}
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Risk Upgrades
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {riskChanges.length}
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Avg. Quantity Change
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {safeFormat(
              results.reduce((sum, r) => sum + (r.variance.quantityChange ?? 0), 0) /
              results.length,
              0,
            )}
            %
          </p>
        </div>
      </div>

      {/* Recommended Quantity Comparison Chart */}
      <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Order Quantity Impact
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
          Baseline vs. Projected Order Quantities
        </h4>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#e7e1d5" vertical={false} />
              <XAxis dataKey="skuCode" stroke="#6b7280" tickLine={false} />
              <YAxis stroke="#6b7280" tickLine={false} />
              <Tooltip />
              <Bar dataKey="baselineQty" fill="#0f766e" name="Baseline" />
              <Bar dataKey="projectedQty" fill="#c7522a" name="Projected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Detailed Results Table */}
      <section className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <h4 className="text-lg font-semibold text-[var(--foreground)]">
          SKU-Level Impact Details
        </h4>
        <div className="mt-4">
          <DataTable
            emptyMessage="No SKU results available."
            rows={results}
            columns={[
              {
                key: "skuCode",
                label: "SKU Code",
                render: (row) => (row as SimulationResult).skuCode,
              },
              {
                key: "skuName",
                label: "SKU Name",
                render: (row) => (row as SimulationResult).skuName,
              },
              {
                key: "baselineRisk",
                label: "Baseline Risk",
                render: (row) => (row as SimulationResult).baselineMetrics.riskLevel,
              },
              {
                key: "projectedRisk",
                label: "Projected Risk",
                render: (row) => {
                  const result = row as SimulationResult;
                  return (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        result.projectedMetrics.riskLevel === "critical"
                          ? "bg-[rgba(176,58,58,0.12)] text-[var(--danger)]"
                          : result.projectedMetrics.riskLevel === "high"
                            ? "bg-[rgba(196,105,12,0.12)] text-[var(--warning)]"
                            : result.projectedMetrics.riskLevel === "medium"
                              ? "bg-[rgba(120,120,45,0.12)] text-[#6b6b1f]"
                              : "bg-[rgba(13,148,136,0.12)] text-[var(--accent-strong)]"
                      }`}
                    >
                      {result.projectedMetrics.riskLevel}
                    </span>
                  );
                },
              },
              {
                key: "quantityChange",
                label: "Qty Change",
                align: "right",
                render: (row) => {
                  const change = (row as SimulationResult).variance.quantityChange;
                  if (change === null || change === undefined || !Number.isFinite(change)) {
                    return "—";
                  }
                  return (
                    <span
                      className={change > 0 ? "text-[#c7522a]" : "text-[#0f766e]"}
                    >
                      {change > 0 ? "+" : ""}{change.toFixed(1)}%
                    </span>
                  );
                },
              },
              {
                key: "daysChange",
                label: "Days of Cover Δ",
                align: "right",
                render: (row) => {
                  const change = (row as SimulationResult).variance.daysOfCoverChange;
                  if (change === null || change === undefined || !Number.isFinite(change)) {
                    return "—";
                  }
                  return (
                    <span className={change > 0 ? "text-[#0f766e]" : "text-[#c7522a]"}>
                      {change > 0 ? "+" : ""}{change.toFixed(1)}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
      </section>

      {/* Risk Upgrades Alert */}
      {riskChanges.length > 0 && (
        <section className="rounded-[1.75rem] border-2 border-[var(--warning)] bg-[rgba(196,105,12,0.08)] p-5">
          <h4 className="font-semibold text-[var(--warning)]">
            ⚠ Risk Upgrades Detected
          </h4>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The following SKUs show increased risk in this scenario:
          </p>
          <ul className="mt-3 space-y-2">
            {riskChanges.map((result) => (
              <li
                key={result.skuId}
                className="text-sm text-[var(--foreground)]"
              >
                <strong>{result.skuName}</strong> (
                {result.baselineMetrics.riskLevel} →{" "}
                {result.projectedMetrics.riskLevel})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
