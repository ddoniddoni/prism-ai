import { describe, expect, it } from "vitest";

import { AnalyzeQuestionService } from "@/lib/analysis/analyze-question-service";
import type { AnalyzeRequest } from "@/lib/analysis/schemas";

import {
  createAnalysisCacheKey,
  InMemoryAnalysisCache,
  rebindAnalysisResponse,
} from "./analysis-cache";

const scope = {
  aiLiveEnabled: true,
  aiProvider: "mock" as const,
  dataSource: "local" as const,
};

const originalRequest: AnalyzeRequest = {
  question: "지난달 매출이 왜 감소했어?",
  requestId: "cache-original-request",
};

describe("InMemoryAnalysisCache", () => {
  it("shares semantic requests while keeping request identifiers out of the key", () => {
    const followUp: AnalyzeRequest = {
      ...originalRequest,
      requestId: "cache-follow-up-request",
      dashboardId: "dashboard-override",
      sessionId: "session-override",
    };

    expect(createAnalysisCacheKey(originalRequest, scope)).toBe(
      createAnalysisCacheKey(followUp, scope),
    );
  });

  it("keeps different selected chart filters in separate cache entries", () => {
    const context = {
      primaryMetric: "revenue" as const,
      period: { preset: "lastMonth" as const },
      compareWith: "previousPeriod" as const,
      filters: [],
      focusDimension: "category" as const,
    };
    const electronicsRequest: AnalyzeRequest = {
      ...originalRequest,
      question: "선택한 카테고리 Electronics을 자세히 분석해줘.",
      currentContext: context,
      drilldownFilter: {
        dimension: "category",
        operator: "eq",
        values: ["Electronics"],
      },
    };
    const fashionRequest: AnalyzeRequest = {
      ...electronicsRequest,
      requestId: "cache-fashion-request",
      drilldownFilter: {
        dimension: "category",
        operator: "eq",
        values: ["Fashion"],
      },
    };

    expect(createAnalysisCacheKey(electronicsRequest, scope)).not.toBe(
      createAnalysisCacheKey(fashionRequest, scope),
    );
  });

  it("expires entries and returns a defensive response copy", async () => {
    let now = 0;
    const cache = new InMemoryAnalysisCache(1_000, 2, () => now);
    const response = await new AnalyzeQuestionService().execute(
      originalRequest,
    );

    cache.set("analysis", response);
    const cached = cache.get("analysis");

    expect(cached).not.toBe(response);
    expect(cached).toEqual(response);

    now = 1_000;

    expect(cache.get("analysis")).toBeNull();
  });

  it("binds cached analysis content to the current request identity", async () => {
    const response = await new AnalyzeQuestionService().execute(
      originalRequest,
    );
    const rebound = rebindAnalysisResponse(
      response,
      {
        ...originalRequest,
        requestId: "cache-rebound-request",
        dashboardId: "cache-rebound-dashboard",
        sessionId: "cache-rebound-session",
      },
      { cacheHit: true, durationMs: 12 },
    );

    expect(rebound.analysisId).toBe("analysis-cache-rebound-request");
    expect(rebound.sessionId).toBe("cache-rebound-session");
    expect(rebound.dashboard.id).toBe("cache-rebound-dashboard");
    expect(rebound.meta).toMatchObject({ cacheHit: true, durationMs: 12 });
  });
});
