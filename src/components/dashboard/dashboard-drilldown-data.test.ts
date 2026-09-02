import { describe, expect, it } from "vitest";

import type { AnalyticsDataset } from "@/lib/analytics/query-engine";

import {
  createDashboardDrilldown,
  createDashboardDrilldownFilter,
} from "./dashboard-drilldown-data";

const dataset: AnalyticsDataset = {
  queryId: "category",
  metric: "revenue",
  groupBy: "category",
  currentTotal: 1_000,
  previousTotal: 800,
  points: [
    {
      label: "Electronics",
      value: 500,
      previousValue: 400,
      absoluteChange: 100,
      percentChange: 25,
    },
    {
      label: "Fashion",
      value: 300,
      previousValue: 300,
      absoluteChange: 0,
      percentChange: 0,
    },
    {
      label: "Home",
      value: 200,
      previousValue: 100,
      absoluteChange: 100,
      percentChange: 100,
    },
  ],
  dataRange: { startDate: "2026-07-01", endDate: "2026-07-31" },
  comparisonRange: { startDate: "2026-06-01", endDate: "2026-06-30" },
  empty: false,
  warnings: [],
};

describe("createDashboardDrilldown", () => {
  it("derives ranking, average, share, and comparison from a verified dataset", () => {
    expect(createDashboardDrilldown(dataset, "Electronics")).toMatchObject({
      averageValue: 1000 / 3,
      comparison: {
        absoluteChange: 100,
        percentChange: 25,
        previousValue: 400,
      },
      rank: 1,
      sharePercent: 50,
      validPointCount: 3,
    });
  });

  it("does not calculate a segment share for derived metrics or date series", () => {
    const dateDataset: AnalyticsDataset = {
      ...dataset,
      metric: "conversionRate",
      groupBy: "date",
    };

    expect(
      createDashboardDrilldown(dateDataset, "Electronics")?.sharePercent,
    ).toBeNull();
  });

  it("rejects a selection label that is not in the verified dataset", () => {
    expect(createDashboardDrilldown(dataset, "Unknown")).toBeUndefined();
  });

  it("only creates an eq filter for a verified filterable chart dimension", () => {
    expect(createDashboardDrilldownFilter(dataset, "Electronics")).toEqual({
      dimension: "category",
      operator: "eq",
      values: ["Electronics"],
    });
    expect(
      createDashboardDrilldownFilter(
        { ...dataset, groupBy: "date" },
        "Electronics",
      ),
    ).toBeUndefined();
  });
});
