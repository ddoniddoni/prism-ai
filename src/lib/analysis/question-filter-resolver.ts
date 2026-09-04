import type { AnalysisPlan } from "@/lib/ai/schemas/analysis-plan";
import {
  normalizeAnalyticsFilters,
  type AnalyticsFilter,
  type AnalyticsQuery,
} from "@/lib/analytics/query-schema";

type QuestionFilterAlias = {
  aliases: readonly string[];
  filter: AnalyticsFilter;
};

const questionFilterAliases = [
  {
    aliases: ["서울", "seoul"],
    filter: { dimension: "region", operator: "eq", values: ["Seoul"] },
  },
  {
    aliases: ["부산", "busan"],
    filter: { dimension: "region", operator: "eq", values: ["Busan"] },
  },
  {
    aliases: ["대전", "daejeon"],
    filter: { dimension: "region", operator: "eq", values: ["Daejeon"] },
  },
  {
    aliases: ["경기도", "gyeonggi"],
    filter: { dimension: "region", operator: "eq", values: ["Gyeonggi"] },
  },
  {
    aliases: ["제주", "jeju"],
    filter: { dimension: "region", operator: "eq", values: ["Jeju"] },
  },
] as const satisfies readonly QuestionFilterAlias[];

function normalizeQuestion(question: string): string {
  return question.trim().replaceAll(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function mergeQuestionFilters(
  filters: readonly AnalyticsFilter[],
  questionFilters: readonly AnalyticsFilter[],
): AnalyticsFilter[] {
  const resolvedDimensions = new Set(
    questionFilters.map((filter) => filter.dimension),
  );

  return normalizeAnalyticsFilters([
    ...filters.filter((filter) => !resolvedDimensions.has(filter.dimension)),
    ...questionFilters,
  ]);
}

function isProductUnitsQuestion(question: string): boolean {
  const refersToProduct =
    question.includes("상품") || question.includes("제품");
  const refersToUnits =
    question.includes("수량") || question.includes("판매량");

  return refersToProduct && question.includes("판매") && refersToUnits;
}

function createProductUnitsQueries(plan: AnalysisPlan): AnalyticsQuery[] {
  const sourceQuery =
    plan.queries.find((query) => !query.groupBy) ?? plan.queries[0];

  if (!sourceQuery) {
    throw new Error("A validated analysis plan must include a source query.");
  }

  const sharedQuery = {
    metric: "unitsSold" as const,
    period: sourceQuery.period,
    compareWith: sourceQuery.compareWith,
    filters: sourceQuery.filters,
  };

  return [
    { id: "primary", ...sharedQuery },
    { id: "trend", ...sharedQuery, groupBy: "date" },
    {
      id: "focus",
      ...sharedQuery,
      groupBy: "product",
      sort: { by: "value", direction: "desc" },
      limit: 20,
    },
  ];
}

export function resolveQuestionFilters(question: string): AnalyticsFilter[] {
  const normalizedQuestion = normalizeQuestion(question);

  return questionFilterAliases
    .filter((entry) =>
      entry.aliases.some((alias) => normalizedQuestion.includes(alias)),
    )
    .map((entry) => entry.filter);
}

/**
 * Maps registered natural-language aliases to canonical Dataset filter values
 * after the Planner has produced a validated Query DSL plan.
 */
export function applyQuestionFilters(
  plan: AnalysisPlan,
  question: string,
): AnalysisPlan {
  const questionFilters = resolveQuestionFilters(question);
  const resolvedPlan: AnalysisPlan = {
    ...plan,
    contextPatch: {
      ...plan.contextPatch,
      ...(questionFilters.length > 0
        ? {
            filters: mergeQuestionFilters(
              plan.contextPatch.filters ?? [],
              questionFilters,
            ),
          }
        : {}),
    },
    queries: plan.queries.map((query) => ({
      ...query,
      ...(questionFilters.length > 0
        ? { filters: mergeQuestionFilters(query.filters, questionFilters) }
        : {}),
    })),
  };

  if (!isProductUnitsQuestion(normalizeQuestion(question))) {
    return resolvedPlan;
  }

  return {
    ...resolvedPlan,
    intent: "ranking",
    contextPatch: {
      ...resolvedPlan.contextPatch,
      primaryMetric: "unitsSold",
      focusDimension: "product",
    },
    queries: createProductUnitsQueries(resolvedPlan),
  };
}
