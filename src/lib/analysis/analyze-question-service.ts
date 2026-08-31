import { buildFindings } from "@/lib/analytics/findings";
import { createAIProvider } from "@/lib/ai/create-provider";
import { sanitizeDashboardSpec } from "@/lib/ai/dashboard-sanitizer";
import { UnsupportedQuestionError } from "@/lib/ai/mock-provider";
import type { AIProvider } from "@/lib/ai/provider";
import {
  normalizeAnalysisPlan,
  resolveInitialAnalysisContext,
} from "@/lib/ai/schemas/analysis-plan";
import { LocalAnalyticsRepository } from "@/lib/data/local-repository";
import type { AnalyticsRepository } from "@/lib/data/repository";

import {
  analyzeRequestSchema,
  analyzeResponseSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "./schemas";

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
    repository: new LocalAnalyticsRepository(),
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
    let rawPlan;

    try {
      rawPlan = await this.dependencies.provider.createPlan({
        question: request.question,
      });
    } catch (error) {
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

    const plan = normalizeAnalysisPlan(rawPlan);
    const context = resolveInitialAnalysisContext(plan);
    const queryResults = await Promise.allSettled(
      plan.queries.map((query) => this.dependencies.repository.execute(query)),
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
        plan,
        context,
        datasets,
        findings,
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
      plan,
      datasets,
      findings,
      dashboard: sanitizedDashboard.dashboard,
      assistantMessage: partial
        ? "일부 Query를 제외한 검증된 결과를 표시합니다."
        : "질문을 검증된 Query와 결정론적 결과로 구성했습니다.",
      meta: {
        provider: "mock",
        model: null,
        mockMode: true,
        cacheHit: false,
        fallbackUsed: composerFallbackUsed || sanitizedDashboard.fallbackUsed,
        partial,
        durationMs: Date.now() - startedAt,
      },
    });
  }
}
