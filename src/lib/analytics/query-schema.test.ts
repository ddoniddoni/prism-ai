import { describe, expect, it } from "vitest";

import {
  analyticsQueriesSchema,
  analyticsQuerySchema,
  deduplicateAnalyticsQueries,
  normalizeAnalyticsFilters,
  type AnalyticsQuery,
} from "./query-schema";

const query: AnalyticsQuery = {
  id: "revenue-by-device",
  metric: "revenue",
  groupBy: "device",
  period: { preset: "lastMonth" },
  compareWith: "previousPeriod",
  filters: [],
};

describe("Analytics Query DSL", () => {
  it("accepts allowlisted query values and custom periods", () => {
    const result = analyticsQuerySchema.safeParse({
      ...query,
      period: {
        preset: "custom",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      },
      filters: [
        {
          dimension: "device",
          operator: "in",
          values: ["mobile", "desktop"],
        },
      ],
      limit: 10,
    });

    expect(result.success).toBe(true);
  });

  it("rejects unregistered values, invalid limits, and incomplete custom periods", () => {
    expect(
      analyticsQuerySchema.safeParse({
        ...query,
        metric: "profit",
      }).success,
    ).toBe(false);
    expect(
      analyticsQuerySchema.safeParse({
        ...query,
        limit: 51,
      }).success,
    ).toBe(false);
    expect(
      analyticsQuerySchema.safeParse({
        ...query,
        period: { preset: "custom", startDate: "2026-07-01" },
      }).success,
    ).toBe(false);
  });

  it("normalizes duplicate filter values and canonical duplicate queries", () => {
    expect(
      normalizeAnalyticsFilters([
        {
          dimension: "device",
          operator: "in",
          values: ["mobile", "desktop", "mobile"],
        },
        {
          dimension: "device",
          operator: "in",
          values: ["desktop", "mobile"],
        },
      ]),
    ).toEqual([
      {
        dimension: "device",
        operator: "in",
        values: ["desktop", "mobile"],
      },
    ]);

    expect(
      deduplicateAnalyticsQueries([
        {
          ...query,
          filters: [
            {
              dimension: "device",
              operator: "in",
              values: ["mobile", "desktop"],
            },
          ],
        },
        {
          ...query,
          id: "same-query-different-id",
          filters: [
            {
              dimension: "device",
              operator: "in",
              values: ["desktop", "mobile"],
            },
          ],
        },
      ]),
    ).toHaveLength(1);
  });

  it("rejects duplicate IDs and more than eight queries in one analysis", () => {
    expect(analyticsQueriesSchema.safeParse([query, query]).success).toBe(
      false,
    );
    expect(
      analyticsQueriesSchema.safeParse(
        Array.from({ length: 9 }, (_, index) => ({
          ...query,
          id: `query-${index}`,
        })),
      ).success,
    ).toBe(false);
  });
});
