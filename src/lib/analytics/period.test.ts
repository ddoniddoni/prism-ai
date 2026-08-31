import { describe, expect, it } from "vitest";

import {
  AnalyticsPeriodError,
  resolveComparisonPeriod,
  resolvePeriod,
} from "./period";

const dataRange = { minDate: "2024-09-01", maxDate: "2026-08-30" };

describe("period resolution", () => {
  it("uses the dataset's latest completed date for a preset period", () => {
    expect(
      resolvePeriod({ preset: "lastMonth" }, dataRange.maxDate, dataRange),
    ).toEqual({ startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(
      resolvePeriod({ preset: "last7Days" }, dataRange.maxDate, dataRange),
    ).toEqual({ startDate: "2026-08-24", endDate: "2026-08-30" });
  });

  it("rejects an inverted, invalid, or entirely unavailable custom range", () => {
    expect(() =>
      resolvePeriod(
        {
          preset: "custom",
          startDate: "2026-07-31",
          endDate: "2026-07-01",
        },
        dataRange.maxDate,
        dataRange,
      ),
    ).toThrow(AnalyticsPeriodError);
    expect(() =>
      resolvePeriod(
        {
          preset: "custom",
          startDate: "2026-02-30",
          endDate: "2026-03-01",
        },
        dataRange.maxDate,
        dataRange,
      ),
    ).toThrow(AnalyticsPeriodError);
    expect(() =>
      resolvePeriod(
        {
          preset: "custom",
          startDate: "2027-01-01",
          endDate: "2027-01-31",
        },
        dataRange.maxDate,
        dataRange,
      ),
    ).toThrow(AnalyticsPeriodError);
  });

  it("resolves previous-period, previous-month, and previous-year comparisons", () => {
    const period = { startDate: "2026-07-01", endDate: "2026-07-31" };

    expect(resolveComparisonPeriod(period, "previousPeriod")).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(resolveComparisonPeriod(period, "previousMonth")).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(resolveComparisonPeriod(period, "previousYear")).toEqual({
      startDate: "2025-07-01",
      endDate: "2025-07-31",
    });
  });
});
