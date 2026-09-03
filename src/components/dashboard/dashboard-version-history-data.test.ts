import { describe, expect, it } from "vitest";

import type { AnalysisHistoryEntry } from "@/lib/history/local-analysis-history";

import {
  getAnalysisVersionChanges,
  getDashboardSessionVersions,
} from "./dashboard-version-history-data";

function createEntry(
  id: string,
  createdAt: string,
  overrides: Partial<AnalysisHistoryEntry["response"]["context"]> = {},
): AnalysisHistoryEntry {
  return {
    id,
    createdAt,
    question: "지난달 매출을 보여줘",
    response: {
      analysisId: id,
      sessionId: "session-1",
      context: {
        primaryMetric: "revenue",
        period: { preset: "lastMonth" },
        compareWith: "none",
        filters: [],
        ...overrides,
      },
      plan: {
        intent: "overview",
        normalizedQuestion: "지난달 매출을 보여줘",
        contextPatch: {},
        queries: [
          {
            id: "primary",
            metric: "revenue",
            period: { preset: "lastMonth" },
            compareWith: "none",
            filters: [],
          },
        ],
        analysisGoal: "지난달 매출을 확인합니다.",
      },
      datasets: [],
      findings: [],
      dashboard: {
        id,
        title: "지난달 매출",
        subtitle: "매출 요약",
        summary: "검증된 분석 결과입니다.",
        context: {
          primaryMetric: "revenue",
          period: { preset: "lastMonth" },
          compareWith: "none",
          filters: [],
          ...overrides,
        },
        widgets: [
          {
            id: "metric",
            type: "metric",
            title: "매출",
            queryIds: ["primary"],
            findingIds: [],
            size: "small",
            config: { queryId: "primary", metric: "revenue" },
          },
        ],
      },
      assistantMessage: "완료했습니다.",
      meta: {
        provider: "mock",
        model: null,
        mockMode: true,
        cacheHit: false,
        fallbackUsed: false,
        partial: false,
        durationMs: 1,
      },
    },
  };
}

describe("dashboard version history data", () => {
  it("orders only one session chronologically and labels context changes", () => {
    const initial = createEntry("v1", "2026-09-03T01:00:00.000Z");
    const filtered = createEntry("v2", "2026-09-03T02:00:00.000Z", {
      filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
    });
    const otherSession = {
      ...createEntry("other", "2026-09-03T03:00:00.000Z"),
      response: {
        ...createEntry("other", "2026-09-03T03:00:00.000Z").response,
        sessionId: "session-2",
      },
    };

    expect(
      getDashboardSessionVersions(
        [filtered, otherSession, initial],
        "session-1",
      ),
    ).toMatchObject([
      { version: 1, entry: { id: "v1" }, changes: [{ label: "첫 분석" }] },
      { version: 2, entry: { id: "v2" }, changes: [{ label: "필터 변경" }] },
    ]);
  });

  it("marks a repeated context as a result refresh", () => {
    const initial = createEntry("v1", "2026-09-03T01:00:00.000Z");
    const repeated = createEntry("v2", "2026-09-03T02:00:00.000Z");

    expect(getAnalysisVersionChanges(repeated, initial)).toEqual([
      { label: "결과 새로고침", tone: "neutral" },
    ]);
  });
});
