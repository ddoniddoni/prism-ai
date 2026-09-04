import { describe, expect, it } from "vitest";

import {
  formatChangeWithDirection,
  formatDimensionValue,
  formatMetricAxisValue,
} from "./formatters";

describe("formatChangeWithDirection", () => {
  it("adds a text direction without relying on color", () => {
    expect(formatChangeWithDirection(12.34)).toBe("+12.3% 상승");
    expect(formatChangeWithDirection(-8.1)).toBe("-8.1% 하락");
    expect(formatChangeWithDirection(0)).toBe("0.0% 변화 없음");
    expect(formatChangeWithDirection(null)).toBe("비교 불가");
  });
});

describe("formatMetricAxisValue", () => {
  it("uses Korean compact units for chart axes", () => {
    expect(formatMetricAxisValue("revenue", 124_500)).toBe("₩12.5만");
    expect(formatMetricAxisValue("adSpend", 2_500_000)).toBe("₩250만");
    expect(formatMetricAxisValue("orders", 12_340)).toBe("1.2만");
    expect(formatMetricAxisValue("roas", 3.141)).toBe("3.1×");
  });
});

describe("formatDimensionValue", () => {
  it("keeps canonical data values in code while exposing Korean labels", () => {
    expect(formatDimensionValue("region", "Gyeonggi")).toBe("경기도");
    expect(formatDimensionValue("product", "Quiet Air Purifier")).toBe(
      "저소음 공기청정기",
    );
  });
});
