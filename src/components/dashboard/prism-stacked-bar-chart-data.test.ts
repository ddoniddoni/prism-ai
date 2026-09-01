import { describe, expect, it } from "vitest";

import {
  createPrismStackedBarData,
  getPrismStackedBarTooltipAnchor,
  getPrismStackedBarTickValues,
  getPrismStackedBarTotal,
} from "./prism-stacked-bar-chart-data";

const series = [
  {
    id: "desktop",
    label: "Desktop",
    points: [
      { label: "2026-08-02", value: 280 },
      { label: "2026-08-01", value: 240 },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    points: [
      { label: "2026-08-01", value: 120 },
      { label: "2026-08-02", value: null },
    ],
  },
] as const;

describe("PrismStackedBarChart data", () => {
  it("aligns verified series by date and replaces missing values with zero", () => {
    expect(createPrismStackedBarData(series)).toEqual([
      { label: "2026-08-01", desktop: 240, mobile: 120 },
      { label: "2026-08-02", desktop: 280, mobile: 0 },
    ]);
  });

  it("derives the visible total and a compact set of x-axis ticks", () => {
    const data = createPrismStackedBarData(series);

    expect(getPrismStackedBarTotal(data[0]!, series)).toBe(360);
    expect(getPrismStackedBarTickValues(data)).toEqual([
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("anchors tooltips below bars that do not have enough space above", () => {
    expect(getPrismStackedBarTooltipAnchor(12, 32)).toBe("bottom");
    expect(getPrismStackedBarTooltipAnchor(104, 32)).toBe("top");
  });
});
