import { describe, expect, it } from "vitest";

import { buildFindings, findingSchema } from "./findings";
import type { AnalyticsDataset } from "./query-engine";

const comparisonDataset: AnalyticsDataset = {
  queryId: "device-revenue",
  metric: "revenue",
  groupBy: "device",
  currentTotal: 140,
  previousTotal: 230,
  points: [
    {
      label: "mobile",
      value: 50,
      previousValue: 150,
      absoluteChange: -100,
      percentChange: -66.66666666666666,
    },
    {
      label: "desktop",
      value: 90,
      previousValue: 80,
      absoluteChange: 10,
      percentChange: 12.5,
    },
  ],
  dataRange: { startDate: "2026-07-01", endDate: "2026-07-31" },
  comparisonRange: { startDate: "2026-06-01", endDate: "2026-06-30" },
  empty: false,
  warnings: [],
};

describe("deterministic findings", () => {
  it("creates schema-valid, evidence-linked trend and driver findings", () => {
    const findings = buildFindings([comparisonDataset]);
    const trend = findings.find((finding) => finding.type === "trend");
    const driver = findings.find((finding) => finding.type === "driver");

    expect(trend?.severity).toBe("critical");
    expect(driver).toMatchObject({
      segment: "mobile",
      contributionPercent: expect.closeTo(111.11111111111111),
      evidenceQueryIds: ["device-revenue"],
    });
    expect(
      findings.every((finding) => findingSchema.safeParse(finding).success),
    ).toBe(true);
  });

  it("uses data-quality findings when a dataset cannot support a claim", () => {
    const findings = buildFindings([
      {
        ...comparisonDataset,
        queryId: "empty-revenue",
        currentTotal: null,
        previousTotal: null,
        points: [],
        empty: true,
        warnings: ["선택한 기간과 필터에 일치하는 데이터가 없습니다."],
      },
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      type: "dataQuality",
      evidenceQueryIds: ["empty-revenue"],
    });
  });
});
