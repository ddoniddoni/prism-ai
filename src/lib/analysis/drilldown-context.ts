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
