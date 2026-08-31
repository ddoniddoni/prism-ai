import type { GenerateContentParameters } from "@google/genai";
import { describe, expect, it } from "vitest";

import { createAICallBudget } from "./provider";
import { GeminiAIProvider, type GeminiModelClient } from "./gemini-provider";

const validPlan = {
  intent: "overview",
  normalizedQuestion: "이번 달 성과를 보여줘.",
  contextPatch: {
    primaryMetric: "revenue",
    period: { preset: "thisMonth" },
    compareWith: "previousPeriod",
    filters: [],
    focusDimension: "device",
  },
  queries: [
    {
      id: "primary",
      metric: "revenue",
      period: { preset: "thisMonth" },
      compareWith: "previousPeriod",
      filters: [],
    },
  ],
  analysisGoal: "이번 달 핵심 성과를 확인합니다.",
};

function createFakeClient(responseTexts: readonly string[]): {
  client: GeminiModelClient;
  requests: GenerateContentParameters[];
} {
  const requests: GenerateContentParameters[] = [];
  const remainingResponses = [...responseTexts];

  return {
    client: {
      models: {
        async generateContent(parameters) {
          requests.push(parameters);
          const text = remainingResponses.shift();

          if (!text) {
            throw new Error("No fake response available");
          }

          return { text };
        },
      },
    },
    requests,
  };
}

describe("GeminiAIProvider", () => {
  it("requests a JSON Schema response and revalidates it with the Plan schema", async () => {
    const fake = createFakeClient([JSON.stringify(validPlan)]);
    const provider = new GeminiAIProvider({
      apiKey: "test-key",
      model: "gemini-test-model",
      timeoutMs: 100,
      maxCallsPerAnalysis: 4,
      client: fake.client,
    });

    const plan = await provider.createPlan({
      question: "이번 달 성과를 보여줘.",
      callBudget: createAICallBudget(4),
    });

    expect(plan).toEqual(validPlan);
    expect(fake.requests).toHaveLength(1);
    expect(fake.requests[0]?.config?.responseMimeType).toBe("application/json");
    expect(fake.requests[0]?.config?.responseJsonSchema).toBeDefined();
  });

  it("uses one correction retry after an invalid structured response", async () => {
    const fake = createFakeClient(["{}", JSON.stringify(validPlan)]);
    const provider = new GeminiAIProvider({
      apiKey: "test-key",
      model: "gemini-test-model",
      timeoutMs: 100,
      maxCallsPerAnalysis: 4,
      client: fake.client,
    });

    await expect(
      provider.createPlan({
        question: "이번 달 성과를 보여줘.",
        callBudget: createAICallBudget(4),
      }),
    ).resolves.toEqual(validPlan);
    expect(fake.requests).toHaveLength(2);
  });

  it("reports a timeout when the SDK abort signal expires", async () => {
    const client: GeminiModelClient = {
      models: {
        generateContent(parameters) {
          const signal = parameters.config?.abortSignal;

          if (signal?.aborted) {
            return Promise.reject(new Error("aborted"));
          }

          return new Promise((_, reject) => {
            signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true },
            );
          });
        },
      },
    };
    const provider = new GeminiAIProvider({
      apiKey: "test-key",
      model: "gemini-test-model",
      timeoutMs: 1,
      maxCallsPerAnalysis: 4,
      client,
    });

    await expect(
      provider.createPlan({ question: "이번 달 성과를 보여줘." }),
    ).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });
});
