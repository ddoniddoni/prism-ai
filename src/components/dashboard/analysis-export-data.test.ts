import { describe, expect, it } from "vitest";
import type { AnalyzeResponse } from "@/lib/analysis/schemas";
import { createAnalysisCsv } from "./analysis-export-data";

const context: AnalyzeResponse["context"] = {
  primaryMetric: "revenue",
  period: { preset: "last7Days" },
  compareWith: "previousPeriod",
  filters: [],
};
const response: AnalyzeResponse = {
  analysisId: "analysis",
  sessionId: "session",
  context,
  plan: {
    normalizedQuestion: "매출 분석",
    intent: "overview",
    contextPatch: {},
    analysisGoal: "매출 비교",
    queries: [],
  },
  datasets: [
    {
      queryId: "groups",
      metric: "revenue",
      groupBy: "product",
      currentTotal: 0,
      previousTotal: null,
      points: [
        { label: '=SUM(1,2)"\n상품', value: 0, previousValue: null },
        { label: "상품", value: -25, previousValue: 20 },
      ],
      dataRange: { startDate: "2026-08-24", endDate: "2026-08-30" },
      empty: false,
      warnings: [],
    },
  ],
  findings: [],
  dashboard: {
    id: "dashboard",
    title: "매출",
    subtitle: "조회 결과",
    summary: "매출 집계",
    context,
    widgets: [],
  },
  assistantMessage: "조회 완료",
  meta: {
    provider: "mock",
    model: null,
    mockMode: true,
    cacheHit: false,
    fallbackUsed: false,
    partial: false,
    durationMs: 1,
  },
};

describe("analysis data export", () => {
  it("preserves raw numbers, nulls, totals and multiline labels while escaping formula text", () => {
    const csv = createAnalysisCsv(response);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"전체 집계"');
    expect(csv).toContain('"분류별 집계"');
    expect(csv).toContain('"\'=SUM(1,2)""\n상품"');
    expect(csv).toContain(",0,,");
    expect(csv).toContain(",-25,20,");
    expect(csv).toContain('"2026-08-24","2026-08-30"');
  });
});
