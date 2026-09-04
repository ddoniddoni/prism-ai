import { describe, expect, it } from "vitest";

import {
  applyQuestionFilters,
  resolveQuestionFilters,
} from "./question-filter-resolver";

const plan = {
  intent: "ranking" as const,
  normalizedQuestion: "경기도 판매 상품 수량을 보여줘",
  contextPatch: {
    primaryMetric: "unitsSold" as const,
    period: { preset: "lastMonth" as const },
    compareWith: "none" as const,
    filters: [
      {
        dimension: "region" as const,
        operator: "eq" as const,
        values: ["Seoul"],
      },
    ],
    focusDimension: "product" as const,
  },
  queries: [
    {
      id: "products",
      metric: "unitsSold" as const,
      groupBy: "product" as const,
      period: { preset: "lastMonth" as const },
      compareWith: "none" as const,
      filters: [
        {
          dimension: "region" as const,
          operator: "eq" as const,
          values: ["Seoul"],
        },
      ],
      limit: 20,
    },
  ],
  analysisGoal: "지역별 상품 판매 수량을 확인합니다.",
};

describe("question filter resolver", () => {
  it("maps Korean region aliases to canonical Dataset values", () => {
    expect(resolveQuestionFilters("경기도 판매 상품 수량을 보여줘")).toEqual([
      { dimension: "region", operator: "eq", values: ["Gyeonggi"] },
    ]);
  });

  it("replaces a Planner region filter with the explicit question filter", () => {
    const resolved = applyQuestionFilters(plan, plan.normalizedQuestion);

    expect(resolved.contextPatch.filters).toEqual([
      { dimension: "region", operator: "eq", values: ["Gyeonggi"] },
    ]);
    expect(resolved.queries[0]?.filters).toEqual([
      { dimension: "region", operator: "eq", values: ["Gyeonggi"] },
    ]);
  });

  it("expands a product-units question into a metric, trend, and product ranking", () => {
    const resolved = applyQuestionFilters(plan, plan.normalizedQuestion);

    expect(resolved).toMatchObject({
      intent: "ranking",
      contextPatch: { primaryMetric: "unitsSold", focusDimension: "product" },
      queries: [
        { id: "primary", metric: "unitsSold" },
        { id: "trend", metric: "unitsSold", groupBy: "date" },
        {
          id: "focus",
          metric: "unitsSold",
          groupBy: "product",
          sort: { by: "value", direction: "desc" },
          limit: 20,
        },
      ],
    });
    expect(
      resolved.queries.every((query) =>
        query.filters.some(
          (filter) =>
            filter.dimension === "region" && filter.values.includes("Gyeonggi"),
        ),
      ),
    ).toBe(true);
  });
});
