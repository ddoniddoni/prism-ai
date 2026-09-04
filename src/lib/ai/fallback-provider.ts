import type {
  AIProvider,
  AIProviderMetadata,
  DashboardComposerInput,
  PlannerInput,
} from "./provider";
import type { AnalysisPlan } from "./schemas/analysis-plan";
import type { DashboardSpec } from "./schemas/dashboard-spec";

export class LiveProviderUnavailableError extends Error {
  constructor() {
    super(
      "Gemini가 현재 이 질문의 분석 계획을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
    this.name = "LiveProviderUnavailableError";
  }
}

export class FallbackAIProvider implements AIProvider {
  private fallbackUsed = false;

  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider,
  ) {}

  get metadata(): AIProviderMetadata {
    return {
      ...this.primary.metadata,
      fallbackUsed: this.primary.metadata.fallbackUsed || this.fallbackUsed,
    };
  }

  async createPlan(input: PlannerInput): Promise<AnalysisPlan> {
    try {
      return await this.primary.createPlan(input);
    } catch {
      this.fallbackUsed = true;

      try {
        return await this.fallback.createPlan(input);
      } catch {
        throw new LiveProviderUnavailableError();
      }
    }
  }

  async createDashboard(input: DashboardComposerInput): Promise<DashboardSpec> {
    try {
      return await this.primary.createDashboard(input);
    } catch {
      this.fallbackUsed = true;
      return this.fallback.createDashboard(input);
    }
  }
}
