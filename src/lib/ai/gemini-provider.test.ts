import type { GenerateContentParameters } from "@google/genai";
import { describe, expect, it } from "vitest";

import { createAICallBudget } from "./provider";
import { GeminiAIProvider, type GeminiModelClient } from "./gemini-provider";
import { analysisPlanSchema } from "./schemas/analysis-plan";

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

const periodLabelDashboard = {
  title: "경기도 판매 수량 분석",
  subtitle: "최근 30일 경기도 판매 흐름을 확인합니다.",
  summary: "선택 기간의 검증된 결과를 보여줍니다.",
  widgets: [
    {
      id: "primary-metric",
      type: "metric",
      title: "경기도 판매 수량",
      queryIds: ["primary"],
      findingIds: [],
      size: "medium",
      config: { queryId: "primary", metric: "unitsSold" },
    },
  ],
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
    expect(
      JSON.stringify(fake.requests[0]?.config?.responseJsonSchema),
    ).not.toContain("minLength");
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

  it("allows a period label without accepting a model-generated business value", async () => {
    const fake = createFakeClient([JSON.stringify(periodLabelDashboard)]);
    const provider = new GeminiAIProvider({
      apiKey: "test-key",
      model: "gemini-test-model",
      timeoutMs: 100,
      maxCallsPerAnalysis: 4,
      client: fake.client,
    });

    await expect(
      provider.createDashboard({
        dashboardId: "dashboard-test",
        plan: analysisPlanSchema.parse(validPlan),
        context: {
          primaryMetric: "unitsSold",
          period: { preset: "last30Days" },
          compareWith: "none",
          filters: [],
        },
        datasets: [],
        findings: [],
      }),
    ).resolves.toMatchObject({
      title: "경기도 판매 수량 분석",
      widgets: [expect.objectContaining({ id: "primary-metric" })],
    });
    expect(fake.requests).toHaveLength(1);
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
