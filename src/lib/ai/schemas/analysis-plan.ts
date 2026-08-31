import { z } from "zod";

import { dimensionKeys } from "@/lib/analytics/dimension-catalog";
import { metricKeys } from "@/lib/analytics/metric-catalog";
import {
  analyticsFilterSchema,
  analyticsPeriodSchema,
  analyticsQueriesSchema,
  compareModes,
  deduplicateAnalyticsQueries,
  normalizeAnalyticsFilters,
} from "@/lib/analytics/query-schema";

export const analysisIntents = [
  "overview",
  "trend",
  "comparison",
  "rootCause",
  "ranking",
  "segmentAnalysis",
  "unsupported",
] as const;

export const analysisContextSchema = z
  .object({
    primaryMetric: z.enum(metricKeys),
    period: analyticsPeriodSchema,
    compareWith: z.enum(compareModes),
    filters: z.array(analyticsFilterSchema).max(20),
    focusDimension: z.enum(dimensionKeys).optional(),
  })
  .strict();

export const analysisContextPatchSchema = z
  .object({
    primaryMetric: z.enum(metricKeys).optional(),
    period: analyticsPeriodSchema.optional(),
    compareWith: z.enum(compareModes).optional(),
    filters: z.array(analyticsFilterSchema).max(20).optional(),
    focusDimension: z.enum(dimensionKeys).optional(),
  })
  .strict();

export const analysisPlanSchema = z
  .object({
    intent: z.enum(analysisIntents),
    normalizedQuestion: z.string().trim().min(2).max(300),
    contextPatch: analysisContextPatchSchema,
    queries: analyticsQueriesSchema,
    analysisGoal: z.string().trim().min(2).max(220),
  })
  .strict();

export type AnalysisContext = z.infer<typeof analysisContextSchema>;
export type AnalysisContextPatch = z.infer<typeof analysisContextPatchSchema>;
export type AnalysisPlan = z.infer<typeof analysisPlanSchema>;
export type AnalysisIntent = (typeof analysisIntents)[number];

export function normalizeAnalysisPlan(input: unknown): AnalysisPlan {
  const plan = analysisPlanSchema.parse(input);

  return analysisPlanSchema.parse({
    ...plan,
    queries: deduplicateAnalyticsQueries(plan.queries),
    contextPatch: {
      ...plan.contextPatch,
      ...(plan.contextPatch.filters
        ? { filters: normalizeAnalyticsFilters(plan.contextPatch.filters) }
        : {}),
    },
  });
}

export function resolveInitialAnalysisContext(
  plan: AnalysisPlan,
): AnalysisContext {
  return mergeAnalysisContext(undefined, plan);
}

export function mergeAnalysisContext(
  currentContext: AnalysisContext | undefined,
  plan: AnalysisPlan,
): AnalysisContext {
  const primaryQuery = plan.queries[0];

  if (!primaryQuery) {
    throw new Error("A validated analysis plan must include one query.");
  }

  return analysisContextSchema.parse({
    primaryMetric:
      plan.contextPatch.primaryMetric ??
      currentContext?.primaryMetric ??
      primaryQuery.metric,
    period:
      plan.contextPatch.period ?? currentContext?.period ?? primaryQuery.period,
    compareWith:
      plan.contextPatch.compareWith ??
      currentContext?.compareWith ??
      primaryQuery.compareWith,
    filters: normalizeAnalyticsFilters(
      plan.contextPatch.filters ??
        currentContext?.filters ??
        primaryQuery.filters,
    ),
    ...(plan.contextPatch.focusDimension
      ? { focusDimension: plan.contextPatch.focusDimension }
      : currentContext?.focusDimension
        ? { focusDimension: currentContext.focusDimension }
        : primaryQuery.groupBy
          ? { focusDimension: primaryQuery.groupBy }
          : {}),
  });
}
