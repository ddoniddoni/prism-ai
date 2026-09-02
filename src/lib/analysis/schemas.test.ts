import { describe, expect, it } from "vitest";

import { analyzeRequestSchema } from "./schemas";

const currentContext = {
  primaryMetric: "revenue",
  period: { preset: "lastMonth" },
  compareWith: "previousPeriod",
  filters: [],
  focusDimension: "category",
} as const;

describe("Analyze request drilldown filter", () => {
  it("accepts one allowlisted eq filter when a current Context exists", () => {
    expect(
      analyzeRequestSchema.safeParse({
        question: "선택한 카테고리를 자세히 분석해줘.",
        requestId: "drilldown-schema-request",
        currentContext,
        drilldownFilter: {
          dimension: "category",
          operator: "eq",
          values: ["Electronics"],
        },
      }).success,
    ).toBe(true);
  });

  it("rejects a date filter, multiple values, and a missing Context", () => {
    expect(
      analyzeRequestSchema.safeParse({
        question: "선택한 날짜를 자세히 분석해줘.",
        requestId: "drilldown-invalid-date",
        currentContext,
        drilldownFilter: {
          dimension: "date",
          operator: "eq",
          values: ["2026-07-16"],
        },
      }).success,
    ).toBe(false);
    expect(
      analyzeRequestSchema.safeParse({
        question: "선택한 카테고리를 자세히 분석해줘.",
        requestId: "drilldown-invalid-values",
        currentContext,
        drilldownFilter: {
          dimension: "category",
          operator: "eq",
          values: ["Electronics", "Fashion"],
        },
      }).success,
    ).toBe(false);
    expect(
      analyzeRequestSchema.safeParse({
        question: "선택한 카테고리를 자세히 분석해줘.",
        requestId: "drilldown-missing-context",
        drilldownFilter: {
          dimension: "category",
          operator: "eq",
          values: ["Electronics"],
        },
      }).success,
    ).toBe(false);
  });

  it("accepts a verified Context override and rejects conflicting input", () => {
    expect(
      analyzeRequestSchema.safeParse({
        question: "지난달 매출이 왜 감소했어?",
        requestId: "context-override-request",
        currentContext,
        contextOverride: {
          filters: [
            {
              dimension: "device",
              operator: "eq",
              values: ["mobile"],
            },
          ],
        },
      }).success,
    ).toBe(true);
    expect(
      analyzeRequestSchema.safeParse({
        question: "선택한 카테고리를 자세히 분석해줘.",
        requestId: "context-override-conflict-request",
        currentContext,
        drilldownFilter: {
          dimension: "category",
          operator: "eq",
          values: ["Electronics"],
        },
        contextOverride: { filters: [] },
      }).success,
    ).toBe(false);
    expect(
      analyzeRequestSchema.safeParse({
        question: "지난달 매출이 왜 감소했어?",
        requestId: "context-override-missing-context-request",
        contextOverride: { filters: [] },
      }).success,
    ).toBe(false);
    expect(
      analyzeRequestSchema.safeParse({
        question: "지난달 매출이 왜 감소했어?",
        requestId: "context-override-comparison-request",
        currentContext,
        contextOverride: { compareWith: "previousYear" },
      }).success,
    ).toBe(true);
  });
});
