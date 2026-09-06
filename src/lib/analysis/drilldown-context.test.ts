import { describe, expect, it } from "vitest";
import {
  applyAnalysisContextOverride,
  constrainPlanToContextOverride,
} from "./drilldown-context";
import { analyticsPeriodSchema } from "@/lib/analytics/query-schema";
import type {
  AnalysisContext,
  AnalysisPlan,
} from "@/lib/ai/schemas/analysis-plan";

const context: AnalysisContext = {
  primaryMetric: "revenue",
  period: { preset: "lastMonth" },
  compareWith: "previousYear",
  filters: [{ dimension: "region", operator: "eq", values: ["Seoul"] }],
};

describe("explicit analysis controls", () => {
  it("keeps filters and comparison when the period changes", () => {
    const period = {
      preset: "custom",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    } as const;
    const next = applyAnalysisContextOverride(context, { period });
    expect(next).toEqual({ ...context, period });
  });

  it.each([
    { preset: "custom", startDate: "2026-02-30", endDate: "2026-03-01" },
    { preset: "custom", startDate: "2026-07-31", endDate: "2026-07-01" },
    { preset: "custom", startDate: "2026-07-01" },
  ])("rejects invalid or reversed custom periods: %o", (period) => {
    expect(analyticsPeriodSchema.safeParse(period).success).toBe(false);
  });

  it("removes filters inferred again from the original question", () => {
    const plan: AnalysisPlan = {
      normalizedQuestion: "서울 매출을 보여줘",
      intent: "overview",
      analysisGoal: "지역별 매출 분석",
      contextPatch: {},
      queries: [
        {
          id: "total",
          metric: "revenue",
          period: context.period,
          compareWith: context.compareWith,
          filters: context.filters,
        },
      ],
    };
    const cleared = applyAnalysisContextOverride(context, { filters: [] });
    const result = constrainPlanToContextOverride(plan, cleared, cleared);
    expect(result.queries[0].filters).toEqual([]);
    expect(result.queries[0].period).toEqual(context.period);
  });
});
