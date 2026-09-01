import { describe, expect, it } from "vitest";

import type { DataPoint } from "@/lib/analytics/query-engine";

import {
  createPrismRankedBarData,
  getPrismRankedBarChartHeight,
} from "./prism-ranked-bar-chart-data";

const points: readonly DataPoint[] = [
  { label: "Mobile", percentChange: -8.4, value: 180_000 },
  { label: "Desktop", percentChange: 3.2, value: 320_000 },
  { label: "Unavailable", value: null },
  { label: "Tablet", value: 210_000 },
];

describe("PrismRankedBarChart data", () => {
  it("orders visible values by rank and assigns emphasis colors by rank", () => {
    expect(createPrismRankedBarData(points)).toEqual([
      {
        change: 3.2,
        color: "#4f46e5",
        hasChange: 1,
        id: "Desktop-1",
        label: "Desktop",
        rank: 1,
        value: 320_000,
      },
      {
        change: 0,
        color: "#7c87e8",
        hasChange: 0,
        id: "Tablet-3",
        label: "Tablet",
        rank: 2,
        value: 210_000,
      },
      {
        change: -8.4,
        color: "#b6bdcf",
        hasChange: 1,
        id: "Mobile-0",
        label: "Mobile",
        rank: 3,
        value: 180_000,
      },
    ]);
  });

  it("keeps the chart height dense for short rankings and bounded for long ones", () => {
    expect(getPrismRankedBarChartHeight(3)).toBe(176);
    expect(getPrismRankedBarChartHeight(20)).toBe(264);
  });
});
