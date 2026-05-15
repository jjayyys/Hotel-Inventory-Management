import {
  InventoryBatch,
  Recommendation,
  Recipe,
  Sku,
  WasteLog,
} from "@/types/api";
import {
  DashboardDataset,
  DashboardMetrics,
  RecommendationRiskPoint,
  StockCoveragePoint,
  WasteTrendPoint,
} from "@/types/dashboard";
import { fetchInventoryBatches } from "./inventory";
import { fetchRecommendations } from "./recommendations";
import { fetchRecipesBySku, fetchSkus } from "./skus";
import { fetchSuppliers } from "./suppliers";
import { fetchWasteLogs } from "./waste";

export async function fetchDashboardDataset(): Promise<DashboardDataset> {
  const suppliers = await fetchSuppliers();
  const hotelId = suppliers[0]?.hotel_id;

  if (!hotelId) {
    throw new Error("No seeded hotel data is available yet.");
  }

  const [skus, recommendations, wasteLogs, inventoryBatches] =
    await Promise.all([
      fetchSkus(hotelId),
      fetchRecommendations(hotelId),
      fetchWasteLogs(),
      fetchInventoryBatches(),
    ]);

  const latestRecommendationDate =
    recommendations
      .map((item) => item.recommendation_date)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;

  const latestRecommendations = latestRecommendationDate
    ? recommendations.filter(
        (item) => item.recommendation_date === latestRecommendationDate,
      )
    : [];

  const topSkuId = skus[0]?.id;
  const recipes = topSkuId ? await fetchRecipesBySku(topSkuId) : [];

  return {
    hotelId,
    suppliers,
    skus,
    recommendations,
    latestRecommendationDate,
    latestRecommendations,
    wasteLogs,
    inventoryBatches,
    recipes,
  };
}

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

export function buildDashboardMetrics(
  dataset: DashboardDataset,
): DashboardMetrics {
  const wasteCost = dataset.wasteLogs.reduce(
    (sum, item) => sum + toNumber(item.estimated_cost),
    0,
  );
  const lowStockSkus = dataset.latestRecommendations.filter((item) => {
    return toNumber(item.current_stock) < toNumber(item.reorder_point);
  }).length;

  return {
    totalSkus: dataset.skus.length,
    totalSuppliers: dataset.suppliers.length,
    totalRecommendations: dataset.latestRecommendations.length,
    criticalAlerts: dataset.latestRecommendations.filter(
      (item) => item.risk_level === "critical",
    ).length,
    reorderAlerts: dataset.latestRecommendations.filter(
      (item) => toNumber(item.recommended_quantity) > 0,
    ).length,
    wasteEvents: dataset.wasteLogs.length,
    wasteCost,
    lowStockSkus,
  };
}

export function buildWasteTrend(dataset: DashboardDataset): WasteTrendPoint[] {
  const grouped = new Map<string, WasteTrendPoint>();

  for (const waste of dataset.wasteLogs) {
    const label = waste.waste_date.slice(5, 10);
    const current = grouped.get(label) ?? {
      label,
      quantity: 0,
      estimatedCost: 0,
    };

    current.quantity += toNumber(waste.quantity);
    current.estimatedCost += toNumber(waste.estimated_cost);
    grouped.set(label, current);
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

export function buildRecommendationRiskBreakdown(
  recommendations: Recommendation[],
): RecommendationRiskPoint[] {
  const labels: RecommendationRiskPoint["label"][] = [
    "critical",
    "high",
    "medium",
    "low",
  ];

  return labels.map((label) => ({
    label,
    count: recommendations.filter((item) => item.risk_level === label).length,
  }));
}

export function buildStockCoverage(
  recommendations: Recommendation[],
): StockCoveragePoint[] {
  return recommendations.slice(0, 8).map((item) => ({
    skuCode: item.sku.sku_code,
    daysOfCover: toNumber(item.estimated_days_of_cover),
    reorderPoint: toNumber(item.reorder_point),
  }));
}

export function filterRecommendations(
  recommendations: Recommendation[],
  searchTerm: string,
  riskFilter: string,
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return recommendations.filter((item) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      item.sku.name.toLowerCase().includes(normalizedSearch) ||
      item.sku.sku_code.toLowerCase().includes(normalizedSearch);
    const matchesRisk =
      riskFilter === "all" || item.risk_level === riskFilter;

    return matchesSearch && matchesRisk;
  });
}

export function filterWasteLogs(
  wasteLogs: WasteLog[],
  skuId: string,
  fromDate: string,
) {
  return wasteLogs.filter((item) => {
    const matchesSku = skuId === "all" || item.sku_id === skuId;
    const matchesDate = fromDate.length === 0 || item.waste_date >= fromDate;
    return matchesSku && matchesDate;
  });
}

export function filterInventoryBatches(
  inventoryBatches: InventoryBatch[],
  searchTerm: string,
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return inventoryBatches.filter((batch) => {
    if (normalizedSearch.length === 0) {
      return true;
    }

    return (
      batch.sku?.name.toLowerCase().includes(normalizedSearch) ||
      batch.sku?.sku_code.toLowerCase().includes(normalizedSearch)
    );
  });
}

export function getSkuRelatedWaste(wasteLogs: WasteLog[], skuId: string) {
  return wasteLogs.filter((item) => item.sku_id === skuId);
}

export function getSkuRelatedBatches(
  inventoryBatches: InventoryBatch[],
  skuId: string,
) {
  return inventoryBatches.filter((item) => item.sku_id === skuId);
}

export async function fetchSkuDetailDataset(skuId: string): Promise<{
  sku: Sku;
  recommendations: Recommendation[];
  wasteLogs: WasteLog[];
  inventoryBatches: InventoryBatch[];
  recipes: Recipe[];
}> {
  const [skus, recommendations, wasteLogs, inventoryBatches, recipes] =
    await Promise.all([
      fetchSkus(),
      fetchRecommendations(),
      fetchWasteLogs(skuId),
      fetchInventoryBatches(skuId),
      fetchRecipesBySku(skuId),
    ]);

  const sku = skus.find((item) => item.id === skuId);

  if (!sku) {
    throw new Error("The requested SKU was not found.");
  }

  return {
    sku,
    recommendations: recommendations.filter((item) => item.sku_id === skuId),
    wasteLogs,
    inventoryBatches,
    recipes,
  };
}
