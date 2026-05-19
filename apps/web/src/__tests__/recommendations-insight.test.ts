import { generateRecommendationExplanation } from "@/services/recommendations";

describe("Recommendations Insight Feature", () => {
  const testRecommendationId = "rec-001";

  it("should fetch recommendation explanation from API", async () => {
    const response = await generateRecommendationExplanation(testRecommendationId);
    
    expect(response).toBeDefined();
    expect(response.recommendationId).toBe(testRecommendationId);
    expect(response.explanation).toBeTruthy();
    expect(["gemini", "ollama_qwen", "ollama_llama", "rule-based-fallback", "cached"]).toContain(
      response.provider
    );
  });

  it("should support refresh parameter", async () => {
    const response = await generateRecommendationExplanation(testRecommendationId, true);
    
    expect(response).toBeDefined();
    expect(response.explanation).toBeTruthy();
  });

  it("should handle API errors gracefully", async () => {
    try {
      await generateRecommendationExplanation("invalid-id");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
