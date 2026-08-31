import type {
  AIProvider,
  AIProviderMetadata,
  DashboardComposerInput,
  PlannerInput,
} from "./provider";
import type { AnalysisPlan } from "./schemas/analysis-plan";
import type { DashboardSpec } from "./schemas/dashboard-spec";

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
      return this.fallback.createPlan(input);
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
