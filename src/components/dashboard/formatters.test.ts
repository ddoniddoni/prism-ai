import { describe, expect, it } from "vitest";

import {
  getKoreanDisplayTitle,
  localizeAnalyticsText,
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

describe("Korean display copy", () => {
  it("localizes stored system copy and uses a verified title for unknown English titles", () => {
    expect(localizeAnalyticsText("일부 Query를 제외한 결과")).toBe(
      "일부 조회를 제외한 결과",
    );
    expect(getKoreanDisplayTitle("Revenue overview", "매출 분석 결과")).toBe(
      "매출 분석 결과",
    );
    expect(
      getKoreanDisplayTitle("지난달 매출 변화의 신호", "매출 분석 결과"),
    ).toBe("지난달 매출 변화의 신호");
    expect(formatDimensionValue("customerSegment", "vip")).toBe("우수 고객");
  });
});
