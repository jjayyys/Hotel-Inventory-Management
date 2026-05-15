"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthGuard } from "@/features/auth/auth-guard";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import {
  buildDashboardMetrics,
  buildStockCoverage,
  buildWasteTrend,
  fetchDashboardDataset,
} from "@/services/dashboard";
import { DashboardDataset } from "@/types/dashboard";

export default function DashboardPage() {
  const [dataset, setDataset] = useState<DashboardDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardDataset()
      .then(setDataset)
      .catch((caughtError: Error) => setError(caughtError.message));
  }, []);

  const metrics = dataset ? buildDashboardMetrics(dataset) : null;
  const wasteTrend = dataset ? buildWasteTrend(dataset) : [];
  const stockCoverage = dataset
    ? buildStockCoverage(dataset.latestRecommendations)
    : [];

  return (
    <AuthGuard>
      <AppShell
        eyebrow="Overview"
        title="Operational inventory pulse"
      >
        {!dataset && !error ? (
          <EmptyState
            title="Loading dashboard"
            description="Gathering live inventory, waste, and recommendation data from the API."
          />
        ) : null}

        {error ? (
          <EmptyState title="Dashboard unavailable" description={error} />
        ) : null}

        {dataset && metrics ? (
          <DashboardOverview
            metrics={metrics}
            latestRecommendationDate={dataset.latestRecommendationDate}
            recommendations={dataset.latestRecommendations}
            wasteTrend={wasteTrend}
            stockCoverage={stockCoverage}
          />
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
