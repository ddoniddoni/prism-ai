import { describe, expect, it } from "vitest";

import type { DataPoint } from "@/lib/analytics/query-engine";

import {
  createPrismTrendChartSeries,
  getPrismTrendTickValues,
} from "./prism-trend-chart-data";

const points: readonly DataPoint[] = [
  { label: "2026-08-28", previousValue: 96, value: 120 },
  { label: "2026-08-29", previousValue: 102, value: 144 },
  { label: "2026-08-30", previousValue: 108, value: 132 },
  { label: "2026-08-31", previousValue: 97, value: 156 },
];

describe("PrismTrendChart data", () => {
  it("keeps current and comparison periods as separate Nivo series", () => {
    expect(createPrismTrendChartSeries(points)).toEqual([
      {
        data: [
          { x: "2026-08-28", y: 120 },
          { x: "2026-08-29", y: 144 },
          { x: "2026-08-30", y: 132 },
          { x: "2026-08-31", y: 156 },
        ],
        id: "현재 기간",
      },
      {
        data: [
          { x: "2026-08-28", y: 96 },
          { x: "2026-08-29", y: 102 },
          { x: "2026-08-30", y: 108 },
          { x: "2026-08-31", y: 97 },
        ],
        id: "비교 기간",
      },
    ]);
  });

  it("uses first, middle, and last labels for a compact x axis", () => {
    expect(getPrismTrendTickValues(points)).toEqual([
      "2026-08-28",
      "2026-08-30",
      "2026-08-31",
    ]);
  });
});
