import { describe, expect, it } from "vitest";

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
});
