import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";

import type { AnalysisContext, AnalysisPlan } from "./schemas/analysis-plan";
import type { DashboardSpec } from "./schemas/dashboard-spec";

export type AICallBudget = {
  maxCalls: number;
  usedCalls: number;
};

export type AIProviderMetadata = {
  provider: "mock" | "gemini";
  model: string | null;
  mockMode: boolean;
  fallbackUsed: boolean;
};

export function createAICallBudget(maxCalls: number): AICallBudget {
  return { maxCalls, usedCalls: 0 };
}

export function consumeAICall(budget: AICallBudget): boolean {
  if (budget.usedCalls >= budget.maxCalls) {
    return false;
  }

  budget.usedCalls += 1;

  return true;
}

export type PlannerInput = {
  question: string;
  currentContext?: AnalysisContext;
  callBudget?: AICallBudget;
};

export type DashboardComposerInput = {
  dashboardId: string;
  plan: AnalysisPlan;
  context: AnalysisContext;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
  callBudget?: AICallBudget;
};

export interface AIProvider {
  readonly metadata: AIProviderMetadata;
  createPlan(input: PlannerInput): Promise<AnalysisPlan>;
  createDashboard(input: DashboardComposerInput): Promise<DashboardSpec>;
}
