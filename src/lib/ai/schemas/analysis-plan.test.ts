import { describe, expect, it } from "vitest";

import {
  analysisPlanSchema,
  mergeAnalysisContext,
  normalizeAnalysisPlan,
  resolveInitialAnalysisContext,
} from "./analysis-plan";

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

describe("Analysis Plan schema", () => {
  it("accepts an allowlisted plan and resolves its initial context", () => {
    const plan = normalizeAnalysisPlan(validPlan);

    expect(resolveInitialAnalysisContext(plan)).toMatchObject({
      primaryMetric: "revenue",
      compareWith: "previousPeriod",
      focusDimension: "device",
    });
  });

  it("rejects invalid query catalog values and extra properties", () => {
    expect(
      analysisPlanSchema.safeParse({
        ...validPlan,
        queries: [
          {
            ...validPlan.queries[0],
            metric: "profit",
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      analysisPlanSchema.safeParse({ ...validPlan, unsafeSql: "select *" })
        .success,
    ).toBe(false);
  });

  it("applies only a follow-up patch while retaining the current context", () => {
    const currentContext = resolveInitialAnalysisContext(
      normalizeAnalysisPlan(validPlan),
    );
    const mobilePlan = normalizeAnalysisPlan({
      ...validPlan,
      contextPatch: {
        filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
        focusDimension: "category",
      },
      queries: [
        {
          ...validPlan.queries[0],
          filters: [
            { dimension: "device", operator: "eq", values: ["mobile"] },
          ],
          groupBy: "category",
        },
      ],
    });

    const mobileContext = mergeAnalysisContext(currentContext, mobilePlan);
    const previousYearPlan = normalizeAnalysisPlan({
      ...validPlan,
      contextPatch: { compareWith: "previousYear" },
      queries: [
        {
          ...validPlan.queries[0],
          compareWith: "previousYear",
          filters: mobileContext.filters,
        },
      ],
    });

    expect(mobileContext).toMatchObject({
      primaryMetric: "revenue",
      period: { preset: "thisMonth" },
      compareWith: "previousPeriod",
      focusDimension: "category",
      filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
    });
    expect(mergeAnalysisContext(mobileContext, previousYearPlan)).toMatchObject(
      {
        primaryMetric: "revenue",
        period: { preset: "thisMonth" },
        compareWith: "previousYear",
        focusDimension: "category",
        filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
      },
    );

    const replacementPlan = normalizeAnalysisPlan({
      ...validPlan,
      contextPatch: {
        filters: [{ dimension: "region", operator: "eq", values: ["Seoul"] }],
      },
      queries: [
        {
          ...validPlan.queries[0],
          filters: [{ dimension: "region", operator: "eq", values: ["Seoul"] }],
        },
      ],
    });
    const removalPlan = normalizeAnalysisPlan({
      ...validPlan,
      contextPatch: { filters: [] },
    });

    expect(
      mergeAnalysisContext(mobileContext, replacementPlan).filters,
    ).toEqual([{ dimension: "region", operator: "eq", values: ["Seoul"] }]);
    expect(mergeAnalysisContext(mobileContext, removalPlan).filters).toEqual(
      [],
    );
  });
});
