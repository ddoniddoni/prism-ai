import {
  normalizeAnalysisPlan,
  analysisContextSchema,
  type AnalysisContext,
  type AnalysisPlan,
} from "@/lib/ai/schemas/analysis-plan";
import {
  normalizeAnalyticsFilters,
  type AnalyticsFilter,
} from "@/lib/analytics/query-schema";

export function addDrilldownFilter(
  context: AnalysisContext,
  filter: AnalyticsFilter,
): AnalysisContext {
  return analysisContextSchema.parse({
    ...context,
    filters: normalizeAnalyticsFilters([...context.filters, filter]),
  });
}

export function replaceAnalysisContextFilters(
  context: AnalysisContext,
  filters: readonly AnalyticsFilter[],
): AnalysisContext {
  return analysisContextSchema.parse({
    ...context,
    filters: normalizeAnalyticsFilters(filters),
  });
}

export function applyAnalysisContextOverride(
  context: AnalysisContext,
  override: Partial<Pick<AnalysisContext, "filters" | "compareWith">>,
): AnalysisContext {
  return analysisContextSchema.parse({
    ...context,
    ...(override.filters
      ? { filters: normalizeAnalyticsFilters(override.filters) }
      : {}),
    ...(override.compareWith ? { compareWith: override.compareWith } : {}),
  });
}

export function constrainPlanToContextFilters(
  plan: AnalysisPlan,
  filters: readonly AnalyticsFilter[],
): AnalysisPlan {
  return normalizeAnalysisPlan({
    ...plan,
    queries: plan.queries.map((query) => ({
      ...query,
      filters: normalizeAnalyticsFilters([...query.filters, ...filters]),
    })),
  });
}

export function constrainPlanToContextOverride(
  plan: AnalysisPlan,
  context: AnalysisContext,
  override: Partial<Pick<AnalysisContext, "filters" | "compareWith">>,
): AnalysisPlan {
  return normalizeAnalysisPlan({
    ...plan,
    queries: plan.queries.map((query) => ({
      ...query,
      ...(override.filters
        ? {
            filters: normalizeAnalyticsFilters([
              ...query.filters,
              ...context.filters,
            ]),
          }
        : {}),
      ...(override.compareWith ? { compareWith: context.compareWith } : {}),
    })),
  });
}
