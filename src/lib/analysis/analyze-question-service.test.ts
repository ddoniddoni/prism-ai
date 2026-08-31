import { describe, expect, it } from "vitest";

import { MockAIProvider } from "@/lib/ai/mock-provider";
import { LocalAnalyticsRepository } from "@/lib/data/local-repository";
import type { AnalyticsRepository } from "@/lib/data/repository";

import { AnalyzeQuestionService } from "./analyze-question-service";

describe("AnalyzeQuestionService", () => {
  it("connects the mock plan, local repository, findings, and sanitized dashboard", async () => {
    const result = await new AnalyzeQuestionService().execute({
      question: "지난달 매출이 왜 감소했어?",
      requestId: "service-test-request",
      dashboardId: "service-test-dashboard",
    });

    expect(result.meta.mockMode).toBe(true);
    expect(result.datasets.length).toBeGreaterThan(0);
    expect(result.findings.some((finding) => finding.type === "driver")).toBe(
      true,
    );
    expect(result.dashboard.widgets.length).toBeGreaterThan(0);
    expect(
      result.dashboard.widgets.every((widget) =>
        widget.queryIds.every((queryId) =>
          result.datasets.some((dataset) => dataset.queryId === queryId),
        ),
      ),
    ).toBe(true);
  });

  it("preserves validated context through sequential follow-up analysis", async () => {
    const service = new AnalyzeQuestionService();
    const initial = await service.execute({
      question: "이번 달 성과를 보여줘.",
      requestId: "followup-initial-request",
    });
    const mobile = await service.execute({
      question: "모바일만 자세히 분석해줘.",
      requestId: "followup-mobile-request",
      sessionId: initial.sessionId,
      currentContext: initial.context,
    });
    const previousYear = await service.execute({
      question: "작년 같은 기간과 비교해줘.",
      requestId: "followup-previous-year-request",
      sessionId: mobile.sessionId,
      currentContext: mobile.context,
    });

    expect(mobile.context).toMatchObject({
      primaryMetric: "revenue",
      period: { preset: "thisMonth" },
      compareWith: "previousPeriod",
      filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
    });
    expect(previousYear.context).toMatchObject({
      primaryMetric: "revenue",
      period: { preset: "thisMonth" },
      compareWith: "previousYear",
      filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
    });
  });

  it("keeps fulfilled query results when one repository query is unavailable", async () => {
    const localRepository = new LocalAnalyticsRepository();
    const repository: AnalyticsRepository = {
      getRows: () => localRepository.getRows(),
      getDataRange: () => localRepository.getDataRange(),
      getDatasetVersion: () => localRepository.getDatasetVersion(),
      execute: async (query) => {
        if (query.id === "focus") {
          throw new Error("Simulated query failure");
        }

        return localRepository.execute(query);
      },
    };
    const service = new AnalyzeQuestionService({
      repository,
      provider: new MockAIProvider(),
    });

    const result = await service.execute({
      question: "지난달 매출이 왜 감소했어?",
      requestId: "partial-query-request",
    });

    expect(result.meta.partial).toBe(true);
    expect(result.datasets.some((dataset) => dataset.queryId === "focus")).toBe(
      false,
    );
    expect(
      result.dashboard.widgets.every((widget) =>
        widget.queryIds.every((queryId) =>
          result.datasets.some((dataset) => dataset.queryId === queryId),
        ),
      ),
    ).toBe(true);
  });
});
