import { describe, expect, it } from "vitest";

import type { AnalyticsDailyRow } from "@/lib/data/repository";

import { buildFindings } from "./findings";
import { executeAnalyticsQuery } from "./query-engine";
import { type AnalyticsQuery } from "./query-schema";
import { generateAnalyticsDailyRows } from "@/lib/data/generate-local-data";

const testDataRange = { minDate: "2026-06-01", maxDate: "2026-07-31" };

function createRow(
  date: string,
  device: AnalyticsDailyRow["device"],
  category: string,
  revenue: number,
): AnalyticsDailyRow {
  return {
    date,
    device,
    category,
    product: `${category} product`,
    trafficSource: "direct",
    region: "Seoul",
    customerSegment: "returning",
    campaign: null,
    revenue,
    orders: revenue / 10,
    unitsSold: revenue / 10,
    customers: revenue / 20,
    sessions: revenue,
    adSpend: revenue / 10,
    attributedRevenue: revenue / 2,
    refunds: 0,
  };
}

const comparisonQuery: AnalyticsQuery = {
  id: "revenue-by-device",
  metric: "revenue",
  groupBy: "device",
  period: {
    preset: "custom",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  },
  compareWith: "previousMonth",
  filters: [],
  sort: { by: "value", direction: "asc" },
  limit: 1,
};

describe("Analytics query engine", () => {
  it("filters, groups, compares, sorts, and limits deterministic values", () => {
    const rows = [
      createRow("2026-06-01", "mobile", "Fashion", 150),
      createRow("2026-06-01", "desktop", "Electronics", 90),
      createRow("2026-07-01", "mobile", "Fashion", 50),
      createRow("2026-07-01", "desktop", "Electronics", 100),
    ];

    const dataset = executeAnalyticsQuery(rows, comparisonQuery, testDataRange);

    expect(dataset.currentTotal).toBe(150);
    expect(dataset.previousTotal).toBe(240);
    expect(dataset.points).toEqual([
      {
        label: "mobile",
        value: 50,
        previousValue: 150,
        absoluteChange: -100,
        percentChange: expect.closeTo(-66.66666666666666),
      },
    ]);
  });

  it("returns a nullable metric and warning instead of inventing a value for empty data", () => {
    const dataset = executeAnalyticsQuery(
      [createRow("2026-07-01", "mobile", "Fashion", 50)],
      {
        ...comparisonQuery,
        id: "empty-filter",
        groupBy: undefined,
        compareWith: "none",
        filters: [{ dimension: "device", operator: "eq", values: ["tablet"] }],
      },
      testDataRange,
    );

    expect(dataset.empty).toBe(true);
    expect(dataset.currentTotal).toBeNull();
    expect(dataset.warnings).toHaveLength(1);
    expect(dataset.points[0]?.value).toBeNull();
  });

  it("derives Mobile and Fashion findings from the seeded scenario without UI hardcoding", () => {
    const rows = generateAnalyticsDailyRows();
    const dataRange = { minDate: "2024-09-01", maxDate: "2026-08-30" };
    const baseQuery = {
      metric: "revenue" as const,
      period: { preset: "lastMonth" as const },
      compareWith: "previousPeriod" as const,
      filters: [],
    };
    const deviceDataset = executeAnalyticsQuery(
      rows,
      { ...baseQuery, id: "device-drop", groupBy: "device" },
      dataRange,
    );
    const categoryDataset = executeAnalyticsQuery(
      rows,
      { ...baseQuery, id: "category-drop", groupBy: "category" },
      dataRange,
    );
    const findings = buildFindings([deviceDataset, categoryDataset]);

    expect(
      findings.find(
        (finding) =>
          finding.type === "driver" && finding.dimension === "device",
      )?.segment,
    ).toBe("mobile");
    expect(
      findings.find(
        (finding) =>
          finding.type === "driver" && finding.dimension === "category",
      )?.segment,
    ).toBe("Fashion");
  });
});
