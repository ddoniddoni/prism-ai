import { describe, expect, it } from "vitest";

import { formatChangeWithDirection, formatMetricAxisValue } from "./formatters";

describe("formatChangeWithDirection", () => {
  it("adds a text direction without relying on color", () => {
    expect(formatChangeWithDirection(12.34)).toBe("+12.3% 상승");
    expect(formatChangeWithDirection(-8.1)).toBe("-8.1% 하락");
    expect(formatChangeWithDirection(0)).toBe("0.0% 변화 없음");
    expect(formatChangeWithDirection(null)).toBe("비교 불가");
  });
});

describe("formatMetricAxisValue", () => {
  it("uses compact K and M labels for chart axes", () => {
    expect(formatMetricAxisValue("revenue", 124_500)).toBe("₩124.5K");
    expect(formatMetricAxisValue("adSpend", 2_500_000)).toBe("₩2.5M");
    expect(formatMetricAxisValue("orders", 12_340)).toBe("12.3K");
    expect(formatMetricAxisValue("roas", 3.141)).toBe("3.1×");
  });
});
