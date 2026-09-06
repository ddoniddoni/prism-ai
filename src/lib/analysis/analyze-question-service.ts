import { buildFindings } from "@/lib/analytics/findings";
import { createAIProvider } from "@/lib/ai/create-provider";
import { sanitizeDashboardSpec } from "@/lib/ai/dashboard-sanitizer";
import { LiveProviderUnavailableError } from "@/lib/ai/fallback-provider";
import { UnsupportedQuestionError } from "@/lib/ai/mock-provider";
import { createAICallBudget, type AIProvider } from "@/lib/ai/provider";
import {
  mergeAnalysisContext,
  normalizeAnalysisPlan,
} from "@/lib/ai/schemas/analysis-plan";
import { createAnalyticsRepository } from "@/lib/data/create-repository";
import type { AnalyticsRepository } from "@/lib/data/repository";
import { env } from "@/lib/env";

import {
  addDrilldownFilter,
  applyAnalysisContextOverride,
  constrainPlanToContextOverride,
  constrainPlanToContextFilters,
} from "./drilldown-context";
import {
  analyzeRequestSchema,
  analyzeResponseSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "./schemas";
import { applyQuestionFilters } from "./question-filter-resolver";

export type AnalyzeQuestionServiceDependencies = {
  repository: AnalyticsRepository;
  provider: AIProvider;
};

export class AnalyzeQuestionServiceError extends Error {
  constructor(
    readonly code:
      "UNSUPPORTED_QUESTION" | "DATA_UNAVAILABLE" | "AI_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "AnalyzeQuestionServiceError";
  }
}

function createDefaultDependencies(): AnalyzeQuestionServiceDependencies {
  return {
    repository: createAnalyticsRepository(),
    provider: createAIProvider(),
  };
}

export class AnalyzeQuestionService {
  constructor(
    private readonly dependencies: AnalyzeQuestionServiceDependencies = createDefaultDependencies(),
  ) {}

  async execute(input: AnalyzeRequest): Promise<AnalyzeResponse> {
    const request = analyzeRequestSchema.parse(input);
    const startedAt = Date.now();
    const callBudget = createAICallBudget(env.AI_MAX_CALLS_PER_ANALYSIS);
    const currentContext =
      request.currentContext && request.contextOverride
        ? applyAnalysisContextOverride(
            request.currentContext,
            request.contextOverride,
          )
        : request.currentContext;
    const plannerContext =
      currentContext && request.drilldownFilter
        ? addDrilldownFilter(currentContext, request.drilldownFilter)
        : currentContext;
    let rawPlan;

    try {
      rawPlan = await this.dependencies.provider.createPlan({
        question: request.question,
        ...(plannerContext ? { currentContext: plannerContext } : {}),
        callBudget,
      });
    } catch (error) {
      if (error instanceof LiveProviderUnavailableError) {
        throw new AnalyzeQuestionServiceError("AI_UNAVAILABLE", error.message);
      }

      if (error instanceof UnsupportedQuestionError) {
        throw new AnalyzeQuestionServiceError(
          "UNSUPPORTED_QUESTION",
          error.message,
        );
      }

      throw new AnalyzeQuestionServiceError(
        "AI_UNAVAILABLE",
        "분석 계획을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }

    const plan = applyQuestionFilters(
      normalizeAnalysisPlan(rawPlan),
      request.question,
    );
    const plannedContext = mergeAnalysisContext(plannerContext, plan);
    const context = request.contextOverride
      ? applyAnalysisContextOverride(
          currentContext ?? plannedContext,
          request.contextOverride,
        )
      : request.drilldownFilter
        ? addDrilldownFilter(plannedContext, request.drilldownFilter)
        : plannedContext;
    const constrainedPlan = request.contextOverride
      ? constrainPlanToContextOverride(plan, context, context)
      : request.drilldownFilter
        ? constrainPlanToContextFilters(plan, context.filters)
        : plan;
    const queryResults = await Promise.allSettled(
      constrainedPlan.queries.map((query) =>
        this.dependencies.repository.execute(query),
      ),
    );
    const datasets = queryResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );
    const partial = datasets.length !== queryResults.length;

    if (datasets.length === 0) {
      throw new AnalyzeQuestionServiceError(
        "DATA_UNAVAILABLE",
        "선택한 분석에 사용할 수 있는 데이터를 준비하지 못했습니다.",
      );
    }

    const findings = buildFindings(datasets);
    let dashboardProposal;
    let composerFallbackUsed = false;

    try {
      dashboardProposal = await this.dependencies.provider.createDashboard({
        dashboardId: request.dashboardId ?? `dashboard-${request.requestId}`,
        plan: constrainedPlan,
        context,
        datasets,
        findings,
        callBudget,
      });
    } catch {
      composerFallbackUsed = true;
      dashboardProposal = {
        id: request.dashboardId ?? `dashboard-${request.requestId}`,
        title: "검증된 분석 결과",
        subtitle:
          "Composer 결과를 사용할 수 없어 안전한 기본 구성을 적용했습니다.",
        summary: "표시된 수치는 결정론적 Analytics Engine의 결과입니다.",
        context,
        widgets: [],
      };
    }

    const sanitizedDashboard = sanitizeDashboardSpec({
      dashboard: dashboardProposal,
      datasets,
      findings,
    });

    return analyzeResponseSchema.parse({
      analysisId: `analysis-${request.requestId}`,
      sessionId: request.sessionId ?? `session-${request.requestId}`,
      context,
      plan: constrainedPlan,
      datasets,
      findings,
      dashboard: sanitizedDashboard.dashboard,
      assistantMessage: partial
        ? "일부 Query를 제외한 검증된 결과를 표시합니다."
        : "질문을 검증된 Query와 결정론적 결과로 구성했습니다.",
      meta: {
        provider: this.dependencies.provider.metadata.provider,
        model: this.dependencies.provider.metadata.model,
        mockMode: this.dependencies.provider.metadata.mockMode,
        cacheHit: false,
        fallbackUsed:
          this.dependencies.provider.metadata.fallbackUsed ||
          composerFallbackUsed ||
          sanitizedDashboard.fallbackUsed,
        partial,
        durationMs: Date.now() - startedAt,
      },
    });
  }
}
