import { describe, expect, it } from "vitest";

import { MockAIProvider } from "./mock-provider";
import {
  analysisPlanSchema,
  mergeAnalysisContext,
  resolveInitialAnalysisContext,
} from "./schemas/analysis-plan";

const supportedQuestions = [
  "지난달 매출이 왜 감소했어?",
  "이번 달 성과를 보여줘.",
  "모바일만 자세히 분석해줘.",
  "작년 같은 기간과 비교해줘.",
  "가장 많이 하락한 상품은 뭐야?",
  "광고비 대비 성과를 보여줘.",
  "환불률이 높은 지역을 알려줘.",
  "서울에서 산 제품들 판매량만 보여줘.",
  "경기도 판매 상품 수량을 보여줘.",
  "지난달 매출의 디바이스별 구성을 보여줘.",
  "지난달 매출 집중도를 달력 히트맵으로 보여줘.",
] as const;

describe("MockAIProvider", () => {
  it("maps every supported question to schema-valid allowlisted queries", async () => {
    const provider = new MockAIProvider();

    const plans = await Promise.all(
      supportedQuestions.map((question) => provider.createPlan({ question })),
    );

    expect(plans).toHaveLength(supportedQuestions.length);
    expect(plans.every((plan) => plan.queries.length > 0)).toBe(true);
    expect(
      plans.every((plan) => analysisPlanSchema.safeParse(plan).success),
    ).toBe(true);
  });

  it("does not place business values in a planning result", async () => {
    const provider = new MockAIProvider();
    const plan = await provider.createPlan({
      question: "지난달 매출이 왜 감소했어?",
    });

    expect(JSON.stringify(plan)).not.toContain("10935");
    expect(plan.queries.every((query) => "value" in query === false)).toBe(
      true,
    );
  });

  it("maps Seoul product sales to the allowlisted region filter and units-sold query", async () => {
    const provider = new MockAIProvider();
    const plan = await provider.createPlan({
      question: "서울에서 산 제품들 판매량만 보여줘.",
    });

    expect(plan.intent).toBe("ranking");
    expect(plan.contextPatch).toEqual({
      primaryMetric: "unitsSold",
      period: { preset: "lastMonth" },
      compareWith: "none",
      filters: [{ dimension: "region", operator: "eq", values: ["Seoul"] }],
      focusDimension: "product",
    });
    expect(plan.queries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "focus",
          metric: "unitsSold",
          groupBy: "product",
          filters: [{ dimension: "region", operator: "eq", values: ["Seoul"] }],
        }),
      ]),
    );
  });

  it("maps Gyeonggi product units to the allowlisted region filter", async () => {
    const provider = new MockAIProvider();
    const plan = await provider.createPlan({
      question: "경기도 판매 상품 수량을 보여줘.",
    });

    expect(plan.contextPatch.filters).toEqual([
      { dimension: "region", operator: "eq", values: ["Gyeonggi"] },
    ]);
    expect(plan.queries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "focus",
          groupBy: "product",
          filters: [
            { dimension: "region", operator: "eq", values: ["Gyeonggi"] },
          ],
        }),
      ]),
    );
  });

  it("maps a device composition question to independent verified date series", async () => {
    const provider = new MockAIProvider();
    const plan = await provider.createPlan({
      question: "지난달 매출의 디바이스별 구성을 보여줘.",
    });

    expect(plan.intent).toBe("segmentAnalysis");
    expect(plan.queries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stack-desktop",
          metric: "revenue",
          groupBy: "date",
          filters: [
            { dimension: "device", operator: "eq", values: ["desktop"] },
          ],
        }),
        expect.objectContaining({
          id: "stack-mobile",
          metric: "revenue",
          groupBy: "date",
          filters: [
            { dimension: "device", operator: "eq", values: ["mobile"] },
          ],
        }),
        expect.objectContaining({
          id: "stack-tablet",
          metric: "revenue",
          groupBy: "date",
          filters: [
            { dimension: "device", operator: "eq", values: ["tablet"] },
          ],
        }),
      ]),
    );
  });

  it("maps a sales concentration question to a daily revenue query", async () => {
    const provider = new MockAIProvider();
    const plan = await provider.createPlan({
      question: "지난달 매출 집중도를 달력 히트맵으로 보여줘.",
    });

    expect(plan.intent).toBe("trend");
    expect(plan.contextPatch).toEqual({
      primaryMetric: "revenue",
      period: { preset: "lastMonth" },
      compareWith: "none",
      filters: [],
      focusDimension: "category",
    });
    expect(plan.queries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "trend",
          metric: "revenue",
          groupBy: "date",
        }),
      ]),
    );
  });

  it("keeps the active period and metric across mobile and prior-year follow-ups", async () => {
    const provider = new MockAIProvider();
    const initialPlan = await provider.createPlan({
      question: "이번 달 성과를 보여줘.",
    });
    const initialContext = resolveInitialAnalysisContext(initialPlan);
    const mobilePlan = await provider.createPlan({
      question: "모바일만 자세히 분석해줘.",
      currentContext: initialContext,
    });
    const mobileContext = mergeAnalysisContext(initialContext, mobilePlan);
    const previousYearPlan = await provider.createPlan({
      question: "작년 같은 기간과 비교해줘.",
      currentContext: mobileContext,
    });

    expect(mobilePlan.contextPatch).toEqual({
      filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
      focusDimension: "category",
    });
    expect(
      mobilePlan.queries.every(
        (query) =>
          query.metric === "revenue" &&
          query.period.preset === "thisMonth" &&
          query.compareWith === "previousPeriod" &&
          query.filters.some(
            (filter) =>
              filter.dimension === "device" && filter.values.includes("mobile"),
          ),
      ),
    ).toBe(true);
    expect(previousYearPlan.contextPatch).toEqual({
      compareWith: "previousYear",
    });
    expect(
      previousYearPlan.queries.every(
        (query) =>
          query.metric === "revenue" &&
          query.period.preset === "thisMonth" &&
          query.compareWith === "previousYear" &&
          query.filters.some(
            (filter) =>
              filter.dimension === "device" && filter.values.includes("mobile"),
          ),
      ),
    ).toBe(true);
  });
});
