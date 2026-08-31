import { describe, expect, it } from "vitest";

import {
  analysisPlanSchema,
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
});
