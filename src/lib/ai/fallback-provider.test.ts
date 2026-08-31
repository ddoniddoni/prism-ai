import { describe, expect, it } from "vitest";

import { MockAIProvider } from "./mock-provider";
import { FallbackAIProvider } from "./fallback-provider";
import type { AIProvider } from "./provider";

const failingGeminiProvider: AIProvider = {
  metadata: {
    provider: "gemini",
    model: "gemini-test-model",
    mockMode: false,
    fallbackUsed: false,
  },
  async createPlan() {
    throw new Error("Gemini request failed");
  },
  async createDashboard() {
    throw new Error("Gemini request failed");
  },
};

describe("FallbackAIProvider", () => {
  it("uses the deterministic Mock provider after a live Planner failure", async () => {
    const provider = new FallbackAIProvider(
      failingGeminiProvider,
      new MockAIProvider(),
    );

    const plan = await provider.createPlan({
      question: "지난달 매출이 왜 감소했어?",
    });

    expect(plan.intent).toBe("rootCause");
    expect(provider.metadata).toEqual({
      provider: "gemini",
      model: "gemini-test-model",
      mockMode: false,
      fallbackUsed: true,
    });
  });
});
