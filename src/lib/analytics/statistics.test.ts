import { describe, expect, it } from "vitest";

import {
  CONTRIBUTION_EPSILON,
  calculateAbsoluteChange,
  calculateContribution,
  calculatePercentChange,
  calculateRanking,
  detectAnomalies,
  findTopDrivers,
} from "./statistics";

describe("deterministic statistics", () => {
  it("calculates nullable absolute and percent changes without division by zero", () => {
    expect(calculateAbsoluteChange(80, 100)).toBe(-20);
    expect(calculateAbsoluteChange(null, 100)).toBeNull();
    expect(calculatePercentChange(80, 100)).toBe(-20);
    expect(calculatePercentChange(80, 0)).toBeNull();
  });

  it("calculates contribution only when the total change is meaningful", () => {
    expect(calculateContribution(80, 100, 800, 1_000)).toBe(10);
    expect(
      calculateContribution(80, 100, 1_000 + CONTRIBUTION_EPSILON / 2, 1_000),
    ).toBeNull();
  });

  it("ranks values deterministically and finds directional top drivers", () => {
    expect(
      calculateRanking([
        { label: "B", value: 10 },
        { label: "A", value: 10 },
        { label: "None", value: null },
      ]).map((value) => value.label),
    ).toEqual(["A", "B", "None"]);
    expect(
      findTopDrivers(
        [
          { label: "Mobile", currentValue: 50, previousValue: 150 },
          { label: "Desktop", currentValue: 90, previousValue: 80 },
        ],
        140,
        230,
      )[0]?.label,
    ).toBe("Mobile");
  });

  it("uses the documented rolling z-score threshold for anomalies", () => {
    const anomalies = detectAnomalies(
      [100, 101, 99, 100, 102, 98, 100, 150].map((value, index) => ({
        label: `day-${index + 1}`,
        value,
      })),
    );

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.label).toBe("day-8");
  });
});
