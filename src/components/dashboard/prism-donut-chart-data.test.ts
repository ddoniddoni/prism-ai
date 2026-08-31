import { describe, expect, it } from "vitest";

import type { DataPoint } from "@/lib/analytics/query-engine";

import {
  createPrismDonutData,
  getPrismDonutPercentage,
  getPrismDonutTotal,
} from "./prism-donut-chart-data";

const points: readonly DataPoint[] = [
  { label: "Organic", value: 320_000 },
  { label: "Paid", value: 180_000 },
  { label: "Zero", value: 0 },
  { label: "Unavailable", value: null },
];

describe("PrismDonutChart data", () => {
  it("keeps only drawable segments with a deterministic color", () => {
    expect(createPrismDonutData(points)).toEqual([
      { color: "#4f46e5", id: "Organic-0", label: "Organic", value: 320_000 },
      { color: "#6172e8", id: "Paid-1", label: "Paid", value: 180_000 },
    ]);
  });

  it("derives the total and percentage from the rendered segments", () => {
    const data = createPrismDonutData(points);
    const total = getPrismDonutTotal(data);

    expect(total).toBe(500_000);
    expect(getPrismDonutPercentage(data[0]?.value ?? 0, total)).toBe(64);
  });
});
