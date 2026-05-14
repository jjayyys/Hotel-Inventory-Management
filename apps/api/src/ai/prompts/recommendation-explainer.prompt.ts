import { RecommendationExplanationContext } from '../ai.types';

export function buildRecommendationExplanationPrompt(
  context: RecommendationExplanationContext,
) {
  const systemPrompt =
    'You explain inventory recommendations for hotel operators. Be concise, practical, and readable. Never invent math. Use only the provided deterministic inputs. Do not use markdown lists. Keep the explanation under 120 words.';

  const userPrompt = [
    'Explain this replenishment recommendation in plain English for an inventory manager.',
    `SKU: ${context.skuName} (${context.skuCode})`,
    `Category: ${context.category ?? 'uncategorized'}`,
    `Supplier: ${context.supplierName ?? 'unknown supplier'}`,
    `Recommendation date: ${context.recommendationDate}`,
    `Current stock: ${context.currentStock} ${context.unit}`,
    `Reorder point: ${context.reorderPoint} ${context.unit}`,
    `Recommended quantity: ${context.recommendedQuantity} ${context.unit}`,
    `EOQ value: ${context.eoqValue} ${context.unit}`,
    `Estimated days of cover: ${context.estimatedDaysOfCover}`,
    `Risk level: ${context.riskLevel}`,
    `Safety stock: ${context.safetyStock} ${context.unit}`,
    `Minimum stock: ${context.minimumStock} ${context.unit}`,
    `Shelf life: ${context.shelfLifeDays} days`,
    `Lead time: ${context.leadTimeDays} days`,
    `Recent waste quantity: ${context.recentWasteQuantity} ${context.unit}`,
    'Focus on why the reorder quantity is zero or non-zero, the stock-vs-reorder-point relationship, and any shelf-life or waste pressure.',
  ].join('\n');

  return {
    systemPrompt,
    userPrompt,
  };
}
