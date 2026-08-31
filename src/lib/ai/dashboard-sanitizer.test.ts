import { describe, expect, it } from "vitest";

import { sanitizeDashboardSpec } from "./dashboard-sanitizer";
import { dashboardSpecSchema } from "./schemas/dashboard-spec";

const dataset = {
  queryId: "primary",
  metric: "revenue" as const,
  currentTotal: 100,
  points: [{ label: "매출", value: 100 }],
  dataRange: { startDate: "2026-07-01", endDate: "2026-07-31" },
  empty: false,
  warnings: [],
};

describe("Dashboard spec sanitizer", () => {
  it("removes widgets that reference unavailable datasets", () => {
    const dashboard = dashboardSpecSchema.parse({
      id: "dashboard-test",
      title: "테스트",
      subtitle: "테스트 대시보드",
      summary: "결정론적 데이터만 표시합니다.",
      context: {
        primaryMetric: "revenue",
        period: { preset: "lastMonth" },
        compareWith: "none",
        filters: [],
      },
      widgets: [
        {
          id: "invalid-widget",
          type: "metric",
          title: "잘못된 참조",
          queryIds: ["unknown"],
          findingIds: [],
          size: "small",
          config: { queryId: "unknown", metric: "revenue" },
        },
      ],
    });

    const result = sanitizeDashboardSpec({
      dashboard,
      datasets: [dataset],
      findings: [],
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.dashboard.widgets[0]).toMatchObject({
      type: "metric",
      queryIds: ["primary"],
    });
  });
});
