import { describe, expect, it } from "vitest";

import {
  createPrismCalendarHeatmapData,
  createPrismCalendarHeatmapSummary,
} from "./prism-calendar-heatmap-data";

describe("PrismCalendarHeatmap data", () => {
  it("pads a daily series to Monday-Sunday calendar weeks and scales its intensity", () => {
    const result = createPrismCalendarHeatmapData([
      { label: "2026-08-03", value: 100 },
      { label: "2026-08-04", value: 400 },
      { label: "2026-08-05", value: null },
    ]);

    expect(result.weekCount).toBe(1);
    expect(result.cells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: "2026-08-03",
          hasData: true,
          intensity: 1,
          weekdayIndex: 0,
        }),
        expect.objectContaining({
          date: "2026-08-04",
          hasData: true,
          intensity: 4,
          weekdayIndex: 1,
        }),
        expect.objectContaining({
          date: "2026-08-09",
          hasData: false,
          intensity: 0,
          weekdayIndex: 6,
        }),
      ]),
    );
    expect(result.peakCell?.date).toBe("2026-08-04");
  });

  it("derives only deterministic month summary values from populated days", () => {
    const data = createPrismCalendarHeatmapData([
      { label: "2026-08-03", value: 100 },
      { label: "2026-08-04", value: 400 },
      { label: "2026-08-05", value: 300 },
      { label: "2026-08-06", value: null },
    ]);

    expect(createPrismCalendarHeatmapSummary(data)).toMatchObject({
      averageValue: 800 / 3,
      dataDayCount: 3,
      strongestWeekdayIndex: 1,
      totalValue: 800,
    });
  });
});
