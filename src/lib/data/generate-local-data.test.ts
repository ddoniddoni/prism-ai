import { describe, expect, it } from "vitest";

import {
  LOCAL_DATASET_END_DATE,
  LOCAL_DATASET_START_DATE,
  generateAnalyticsDailyRows,
} from "./generate-local-data";

function totalRevenueFor(
  rows: ReturnType<typeof generateAnalyticsDailyRows>,
  options: { datePrefix: string; device?: string; category?: string },
) {
  return rows
    .filter(
      (row) =>
        row.date.startsWith(options.datePrefix) &&
        (!options.device || row.device === options.device) &&
        (!options.category || row.category === options.category),
    )
    .reduce((total, row) => total + row.revenue, 0);
}

describe("generateAnalyticsDailyRows", () => {
  it("creates the same complete daily dataset for a fixed seed", () => {
    const firstRun = generateAnalyticsDailyRows();
    const secondRun = generateAnalyticsDailyRows();

    expect(firstRun).toEqual(secondRun);
    expect(firstRun).toHaveLength(10_935);
    expect(firstRun[0]?.date).toBe(LOCAL_DATASET_START_DATE);
    expect(firstRun.at(-1)?.date).toBe(LOCAL_DATASET_END_DATE);
  });

  it("encodes the stable desktop and declining mobile Fashion scenario", () => {
    const rows = generateAnalyticsDailyRows();
    const juneMobileFashion = totalRevenueFor(rows, {
      datePrefix: "2026-06",
      device: "mobile",
      category: "Fashion",
    });
    const julyMobileFashion = totalRevenueFor(rows, {
      datePrefix: "2026-07",
      device: "mobile",
      category: "Fashion",
    });
    const juneDesktopFashion = totalRevenueFor(rows, {
      datePrefix: "2026-06",
      device: "desktop",
      category: "Fashion",
    });
    const julyDesktopFashion = totalRevenueFor(rows, {
      datePrefix: "2026-07",
      device: "desktop",
      category: "Fashion",
    });

    expect(julyMobileFashion).toBeLessThan(juneMobileFashion * 0.7);
    expect(julyDesktopFashion).toBeGreaterThan(juneDesktopFashion);
  });
});
