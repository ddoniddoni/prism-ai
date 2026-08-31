import { describe, expect, it } from "vitest";

import { formatChangeWithDirection } from "./formatters";

describe("formatChangeWithDirection", () => {
  it("adds a text direction without relying on color", () => {
    expect(formatChangeWithDirection(12.34)).toBe("+12.3% 상승");
    expect(formatChangeWithDirection(-8.1)).toBe("-8.1% 하락");
    expect(formatChangeWithDirection(0)).toBe("0.0% 변화 없음");
    expect(formatChangeWithDirection(null)).toBe("비교 불가");
  });
});
