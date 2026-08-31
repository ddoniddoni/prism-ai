import { describe, expect, it } from "vitest";

import { InMemoryAnalysisCache } from "@/lib/cache/analysis-cache";
import { parseEnvironment } from "@/lib/env";
import type { AnalysisOperations } from "@/lib/operations/analysis-operations";
import { DailyRateLimiter } from "@/lib/rate-limit/daily-rate-limiter";

import { AnalyzeQuestionService } from "./analyze-question-service";
import {
  AnalyzeRequestCoordinator,
  RateLimitExceededError,
} from "./analyze-request-coordinator";

const operations: AnalysisOperations = {
  async recordCompletion() {},
  async recordFailure() {},
};

describe("AnalyzeRequestCoordinator", () => {
  it("serves a matching cached result before consuming another demo limit", async () => {
    let calls = 0;
    const coordinator = new AnalyzeRequestCoordinator({
      environment: parseEnvironment({
        DEMO_DAILY_LIMIT: "1",
        ANALYSIS_CACHE_TTL_MS: "60000",
        ANALYSIS_CACHE_MAX_ENTRIES: "2",
      }),
      cache: new InMemoryAnalysisCache(60_000, 2),
      rateLimiter: new DailyRateLimiter(
        1,
        () => new Date("2026-08-31T12:00:00.000Z"),
      ),
      operations,
      executeAnalysis: async (request) => {
        calls += 1;
        return new AnalyzeQuestionService().execute(request);
      },
    });

    const initial = await coordinator.execute(
      {
        question: "지난달 매출이 왜 감소했어?",
        requestId: "coordinator-initial-request",
      },
      "203.0.113.1",
    );
    const cached = await coordinator.execute(
      {
        question: "지난달 매출이 왜 감소했어?",
        requestId: "coordinator-cached-request",
        dashboardId: "coordinator-cached-dashboard",
      },
      "203.0.113.1",
    );

    expect(calls).toBe(1);
    expect(initial.meta.cacheHit).toBe(false);
    expect(cached.meta.cacheHit).toBe(true);
    expect(cached.dashboard.id).toBe("coordinator-cached-dashboard");

    await expect(
      coordinator.execute(
        {
          question: "이번 달 성과를 보여줘.",
          requestId: "coordinator-limited-request",
        },
        "203.0.113.1",
      ),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
