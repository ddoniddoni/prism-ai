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

  it("enforces a selected chart filter in the Context and every executed query", async () => {
    const service = new AnalyzeQuestionService();
    const initial = await service.execute({
      question: "이번 달 성과를 보여줘.",
      requestId: "drilldown-initial-request",
    });
    const drilldown = await service.execute({
      question: "선택한 카테고리 Electronics을 자세히 분석해줘.",
      requestId: "drilldown-followup-request",
      sessionId: initial.sessionId,
      currentContext: initial.context,
      drilldownFilter: {
        dimension: "category",
        operator: "eq",
        values: ["Electronics"],
      },
    });

    expect(drilldown.context.filters).toEqual(
      expect.arrayContaining([
        { dimension: "category", operator: "eq", values: ["Electronics"] },
      ]),
    );
    expect(
      drilldown.plan.queries.every((query) =>
        query.filters.some(
          (filter) =>
            filter.dimension === "category" &&
            filter.operator === "eq" &&
            filter.values.includes("Electronics"),
        ),
      ),
    ).toBe(true);
  });

  it("enforces an explicit Context filter change after a selected chart analysis", async () => {
    const service = new AnalyzeQuestionService();
    const initial = await service.execute({
      question: "지난달 매출이 왜 감소했어?",
      requestId: "context-filter-initial-request",
    });
    const selected = await service.execute({
      question: "선택한 카테고리 Electronics을 자세히 분석해줘.",
      requestId: "context-filter-selected-request",
      sessionId: initial.sessionId,
      currentContext: initial.context,
      drilldownFilter: {
        dimension: "category",
        operator: "eq",
        values: ["Electronics"],
      },
    });
    const reset = await service.execute({
      question: selected.plan.normalizedQuestion,
      requestId: "context-override-reset-request",
      sessionId: selected.sessionId,
      currentContext: selected.context,
      contextOverride: { filters: [] },
    });

    expect(reset.context.filters).toEqual([]);
    expect(
      reset.plan.queries.every(
        (query) =>
          !query.filters.some((filter) => filter.dimension === "category"),
      ),
    ).toBe(true);

    const mobileOnly = await service.execute({
      question: initial.plan.normalizedQuestion,
      requestId: "context-override-mobile-request",
      sessionId: initial.sessionId,
      currentContext: initial.context,
      contextOverride: {
        filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
      },
    });

    expect(mobileOnly.context.filters).toEqual([
      { dimension: "device", operator: "eq", values: ["mobile"] },
    ]);
    expect(
      mobileOnly.plan.queries.every((query) =>
        query.filters.some(
          (filter) =>
            filter.dimension === "device" &&
            filter.operator === "eq" &&
            filter.values.includes("mobile"),
        ),
      ),
    ).toBe(true);

    const previousYear = await service.execute({
      question: initial.plan.normalizedQuestion,
      requestId: "context-override-comparison-request",
      sessionId: initial.sessionId,
      currentContext: initial.context,
      contextOverride: { compareWith: "previousYear" },
    });

    expect(previousYear.context.compareWith).toBe("previousYear");
    expect(
      previousYear.plan.queries.every(
        (query) => query.compareWith === "previousYear",
      ),
    ).toBe(true);
  });

  it("applies a selected period to every query without losing existing conditions", async () => {
    const service = new AnalyzeQuestionService();
    const initial = await service.execute({
      question: "서울 매출을 보여줘.",
      requestId: "period-control-initial",
    });
    const period = {
      preset: "custom",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    } as const;
    const result = await service.execute({
      question: initial.plan.normalizedQuestion,
      requestId: "period-control-updated",
      currentContext: initial.context,
      sessionId: initial.sessionId,
      contextOverride: { period },
    });
    expect(result.context).toEqual({ ...initial.context, period });
    expect(
      result.plan.queries.every(
        (query) => JSON.stringify(query.period) === JSON.stringify(period),
      ),
    ).toBe(true);
    expect(
      result.datasets.every(
        (dataset) =>
          dataset.dataRange.startDate === period.startDate &&
          dataset.dataRange.endDate === period.endDate,
      ),
    ).toBe(true);
    const cleared = await service.execute({
      question: initial.plan.normalizedQuestion,
      requestId: "period-control-cleared",
      currentContext: result.context,
      contextOverride: { filters: [] },
    });
    expect(cleared.context.period).toEqual(period);
    expect(
      cleared.plan.queries.every((query) => query.filters.length === 0),
    ).toBe(true);
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
