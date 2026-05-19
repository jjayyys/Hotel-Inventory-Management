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
import {
  recalculateRecommendations,
  generateRecommendationExplanation,
  type RecommendationExplanationResponse,
} from "@/services/recommendations";
import { DashboardDataset } from "@/types/dashboard";
import { Spinner } from "@/components/ui/spinner";

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
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<
    string | null
  >(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] =
    useState(false);
  const [explanationData, setExplanationData] =
    useState<RecommendationExplanationResponse | null>(null);

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

  async function handleGetInsight(recommendationId: string) {
    setSelectedRecommendationId(recommendationId);
    setIsGeneratingExplanation(true);

    try {
      const response = await generateRecommendationExplanation(
        recommendationId,
      );
      setExplanationData(response);
    } catch (error) {
      console.error("Failed to generate explanation:", error);
      setExplanationData({
        recommendationId,
        provider: "rule-based-fallback",
        explanation:
          "Failed to generate explanation. Please try again later.",
        cached: false,
        fallback: true,
      });
    } finally {
      setIsGeneratingExplanation(false);
    }
  }

  async function handleRegenerate() {
    if (!selectedRecommendationId) return;

    setIsGeneratingExplanation(true);

    try {
      const response = await generateRecommendationExplanation(
        selectedRecommendationId,
        true,
      );
      setExplanationData(response);
    } catch (error) {
      console.error("Failed to regenerate explanation:", error);
    } finally {
      setIsGeneratingExplanation(false);
    }
  }

  function closeModal() {
    setSelectedRecommendationId(null);
    setExplanationData(null);
  }

  function getProviderBadgeColor(provider: string) {
    switch (provider) {
      case "gemini":
        return "bg-[rgba(66,133,244,0.12)] text-[#4285f4]";
      case "ollama_qwen":
        return "bg-[rgba(255,82,0,0.12)] text-[#ff5200]";
      case "ollama_llama":
        return "bg-[rgba(255,193,7,0.12)] text-[#ffc107]";
      case "rule-based-fallback":
        return "bg-[rgba(120,120,45,0.12)] text-[#6b6b1f]";
      case "cached":
        return "bg-[rgba(13,148,136,0.12)] text-[var(--accent-strong)]";
      default:
        return "bg-[rgba(120,120,120,0.12)] text-[#777]";
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
                {
                  key: "insight",
                  label: "",
                  render: (row) => (
                    <button
                      onClick={() => handleGetInsight(row.id)}
                      className="rounded-lg border border-[var(--line-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-2)]"
                    >
                      Insight
                    </button>
                  ),
                },
              ]}
            />
          )}
        </div>
      </AppShell>

      {selectedRecommendationId && explanationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--line-soft)] bg-white shadow-lg">
            <div className="border-b border-[var(--line-soft)] px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    AI Recommendation Insight
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {visibleRecommendations
                      .find((r) => r.id === selectedRecommendationId)
                      ?.sku.name || "Loading..."}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Provider:
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getProviderBadgeColor(
                    explanationData.provider,
                  )}`}
                >
                  {explanationData.provider.replace(/_/g, " ")}
                </span>
                {explanationData.cached && (
                  <span className="text-xs text-[var(--muted)]">• Cached</span>
                )}
                {explanationData.fallback && (
                  <span className="text-xs text-[var(--warning)]">
                    • Fallback
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-[var(--surface-2)] p-4">
                {isGeneratingExplanation ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-[var(--muted)]">
                      Generating explanation...
                    </span>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-[var(--foreground)]">
                    {explanationData.explanation}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--line-soft)] px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={handleRegenerate}
                disabled={isGeneratingExplanation}
                className="rounded-xl border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={closeModal}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
